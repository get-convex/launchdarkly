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

// TODO: Make these configurable.
const EVENT_CAPACITY = 1000;
const EVENT_BATCH_SIZE = 100;
const EVENT_PROCESSING_INTERVAL_SECONDS = 5;

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
    await handleScheduleProcessing(ctx, { sdkKey, options });

    // @ts-expect-error Count is internal
    const numEvents = await ctx.db.query("events").count();
    if (numEvents + payloads.length > EVENT_CAPACITY) {
      console.warn("LaunchDarkly event store is full, dropping event.");
      return;
    }

    await Promise.all(
      payloads.map(async (payload) => {
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
    isRescheduling = false,
  }: {
    sdkKey: string;
    isRescheduling?: boolean;
    options?: {
      allAttributesPrivate?: boolean;
      privateAttributes?: string[];
      eventsUri?: string;
    };
  }
) => {
  const scheduled = await ctx.db.query("eventSchedule").first();
  if (scheduled !== null) {
    if (!isRescheduling) {
      return;
    }

    // We want to scheduled a new job immediately, so delete the old one.
    await ctx.db.delete(scheduled._id);
  }

  const areThereMoreEvents = (await ctx.db.query("events").take(1)).length > 0;

  if (!areThereMoreEvents && isRescheduling) {
    return;
  }

  const jobId = await ctx.scheduler.runAfter(
    (areThereMoreEvents ? 0 : EVENT_PROCESSING_INTERVAL_SECONDS) * 1000,
    internal.events.processEvents,
    { sdkKey, options }
  );

  await ctx.db.insert("eventSchedule", { jobId });
};

export const rescheduleProcessing = internalMutation({
  args: {
    sdkKey: v.string(),
    options: eventsOptions,
  },
  handler: (ctx, args) =>
    handleScheduleProcessing(ctx, { ...args, isRescheduling: true }),
});

export const processEvents = internalAction({
  args: {
    sdkKey: v.string(),
    options: eventsOptions,
  },
  handler: async (ctx, { sdkKey, options }) => {
    const events = await ctx.runQuery(internal.events.getOldestEvents, {
      count: EVENT_BATCH_SIZE,
    });

    await sendEvents(events, sdkKey, options);

    await ctx.runMutation(internal.events.deleteEvents, {
      ids: events.map((event) => event._id),
    });

    await ctx.runMutation(internal.events.rescheduleProcessing, {
      sdkKey,
      options,
    });
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
