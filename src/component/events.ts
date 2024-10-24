import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  MutationCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { sendEvents } from "../sdk/EventProcessor";
import isEqual from "lodash.isequal";

// TODO: Make these configurable.
export const EVENT_CAPACITY = 1000;
export const EVENT_BATCH_SIZE = 100;
export const EVENT_PROCESSING_INTERVAL_SECONDS = 5;

const eventsOptions = v.optional(
  v.object({
    allAttributesPrivate: v.optional(v.boolean()),
    privateAttributes: v.optional(v.array(v.string())),
    eventsUri: v.optional(v.string()),
  })
);

export const storeEvents = mutation({
  args: {
    sdkKey: v.string(),
    payloads: v.array(v.string()),
    options: eventsOptions,
  },
  returns: v.null(),
  handler: async (ctx, { sdkKey, payloads, options }) => {
    await handleScheduleProcessing(ctx, {
      sdkKey,
      options,
    });

    const numEvents = (await ctx.db.query("events").collect()).length;
    if (numEvents >= EVENT_CAPACITY) {
      console.warn("Event store is full, dropping events.");
      return;
    }

    const payloadsToStore = payloads.slice(0, EVENT_CAPACITY - numEvents);
    if (payloadsToStore.length !== payloads.length) {
      console.warn(
        `${payloads.length - payloadsToStore.length} events were dropped due to capacity limits.`
      );
    }

    await Promise.all(
      payloadsToStore.map(async (payload) => {
        await ctx.db.insert("events", { payload });
      })
    );
  },
});

const handleScheduleProcessing = async (
  ctx: MutationCtx,
  {
    sdkKey,
    options,
    runImmediately = false,
  }: {
    sdkKey: string;
    runImmediately?: boolean;
    options?: {
      allAttributesPrivate?: boolean;
      privateAttributes?: string[];
      eventsUri?: string;
    };
  }
) => {
  const existingScheduledJob = await ctx.db.query("eventSchedule").first();
  if (existingScheduledJob !== null) {
    const existingSystemJob = await ctx.db.system.get(
      existingScheduledJob.jobId
    );

    const didScheduledJobsArgsChange = existingSystemJob
      ? !isEqual(existingSystemJob.args[0].sdkKey, sdkKey) ||
        !isEqual(existingSystemJob.args[0].options, options)
      : false;

    // If we are not rescheduling a job, and the job exists and has the same args as the scheduled jobs, we can return early
    // because the correct job is already scheduled.
    if (!runImmediately && existingSystemJob && !didScheduledJobsArgsChange) {
      return;
    }

    if (didScheduledJobsArgsChange) {
      console.info("Rescheduling event processing job due to changed args.");
    }

    // We want to scheduled a new job immediately, so delete the old one.
    await ctx.db.delete(existingScheduledJob._id);
    if (existingSystemJob?.state.kind !== "inProgress") {
      await ctx.scheduler.cancel(existingScheduledJob.jobId);
    }
  }

  const runAfterSeconds = runImmediately
    ? 0
    : EVENT_PROCESSING_INTERVAL_SECONDS;
  const jobId = await ctx.scheduler.runAfter(
    runAfterSeconds * 1000,
    internal.events.processEvents,
    { sdkKey, options }
  );

  await ctx.db.insert("eventSchedule", { jobId });
};

export const processEvents = internalAction({
  args: {
    sdkKey: v.string(),
    options: eventsOptions,
  },
  handler: async (ctx, { sdkKey, options }) => {
    const events = await ctx.runQuery(internal.events.getOldestEvents, {
      count: EVENT_BATCH_SIZE,
    });

    if (events.length === 0) {
      return;
    }

    try {
      await sendEvents(events, sdkKey, options);

      try {
        await ctx.runMutation(internal.events.deleteEvents, {
          ids: events.map((event) => event._id),
        });
      } catch (error) {
        // If we fail to delete events, we can log the error.
        // This will cause us to send some events to LaunchDarkly again,
        // but LaunchDarkly should de-dupe them.
        console.error(error);
      }
    } catch (error) {
      console.error("Error processing events:", error);
      // If there's an error, we can reschedule the job to try again later.
    } finally {
      await ctx.runMutation(internal.events.rescheduleProcessing, {
        sdkKey,
        options,
      });
    }
  },
});

export const rescheduleProcessing = internalMutation({
  args: {
    sdkKey: v.string(),
    options: eventsOptions,
  },
  handler: async (ctx, args) => {
    const areThereMoreEvents =
      (await ctx.db.query("events").take(1)).length > 0;

    // We do not need to reschedule if there are no more events.
    if (!areThereMoreEvents) {
      return;
    }
    return handleScheduleProcessing(ctx, { ...args, runImmediately: true });
  },
});

export const getOldestEvents = internalQuery({
  args: { count: v.number() },
  returns: v.array(
    v.object({
      payload: v.string(),
      _id: v.id("events"),
      _creationTime: v.number(),
    })
  ),
  handler: async (ctx, { count }) => {
    return ctx.db.query("events").order("asc").take(count);
  },
});

export const deleteEvents = internalMutation({
  args: { ids: v.array(v.id("events")) },
  handler: async (ctx, { ids }) => {
    await Promise.all(
      ids.map(async (id) => {
        await ctx.db.delete(id);
      })
    );
  },
});
