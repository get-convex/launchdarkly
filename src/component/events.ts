import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  MutationCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import {
  EventProcessorOptions,
  sendEvents,
  validateEventProcessorOptions,
} from "../sdk/EventProcessor";
import isEqual from "lodash.isequal";

export const EVENT_CAPACITY = 1000;
export const EVENT_BATCH_SIZE = 100;
export const EVENT_PROCESSING_INTERVAL_SECONDS = 5;

const eventsOptions = v.optional(
  v.object({
    allAttributesPrivate: v.optional(v.boolean()),
    privateAttributes: v.optional(v.array(v.string())),
    eventsUri: v.optional(v.string()),
    eventCapacity: v.optional(v.number()),
    eventBatchSize: v.optional(v.number()),
    eventProcessingIntervalSeconds: v.optional(v.number()),
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
    validateEventProcessorOptions(options);
    await handleScheduleProcessing(ctx, {
      sdkKey,
      options,
    });

    const eventCapacity = options?.eventCapacity ?? EVENT_CAPACITY;

    const numEvents = (await ctx.db.query("events").take(eventCapacity + 1))
      .length;

    if (numEvents >= eventCapacity) {
      console.warn("Event store is full, dropping events.");
      return;
    }

    const payloadsToStore = payloads.slice(0, eventCapacity - numEvents);
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
    options?: EventProcessorOptions;
  }
) => {
  validateEventProcessorOptions(options);
  const existingScheduledJob = await ctx.db.query("eventSchedule").first();
  if (existingScheduledJob !== null) {
    const existingSystemJob = await ctx.db.system.get(
      existingScheduledJob.jobId
    );

    const didScheduledJobsArgsChange = existingSystemJob
      ? !isEqual(existingSystemJob.args[0].sdkKey, sdkKey) ||
        !isEqual(existingSystemJob.args[0].options, options)
      : false;

    const jobIsStuck = existingSystemJob
      ? ["canceled", "failed", "success"].some(
          (k) => k === existingSystemJob.state.kind
        )
      : false;

    // If we are not rescheduling a job, and the job exists and has the same args as the scheduled jobs, we can return early
    // because the correct job is already scheduled.
    if (
      !runImmediately &&
      existingSystemJob &&
      !jobIsStuck &&
      !didScheduledJobsArgsChange
    ) {
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
    validateEventProcessorOptions(options);
    const eventBatchSize = options?.eventBatchSize ?? EVENT_BATCH_SIZE;
    const events = await ctx.runQuery(internal.events.getOldestEvents, {
      count: eventBatchSize,
    });

    if (events.length === 0) {
      return;
    }

    await sendEvents(events, sdkKey, options);

    // If we fail to send events, we won't end up deleting them.
    // Next time an event is stored, we will try to send them again.
    await ctx.runMutation(internal.events.deleteEvents, {
      ids: events.map((event) => event._id),
    });

    await ctx.runMutation(internal.events.rescheduleProcessing, {
      sdkKey,
      options,
    });
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
