import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { sendEvents } from "../sdk/EventProcessor";

// TODO: Make these configurable.
export const EVENT_CAPACITY = 1000;
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
    payloads: v.array(v.string()),
    options: eventsOptions,
  },
  returns: v.null(),
  handler: async (ctx, { payloads, options }) => {
    const sdkKey = await ctx.runQuery(internal.sdkKey.get);
    if (!sdkKey) {
      return;
    }

    await ctx.runMutation(internal.events.scheduleProcessing, {
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

export const scheduleProcessing = internalMutation({
  args: {
    doneProcessing: v.optional(v.boolean()),
    options: eventsOptions,
  },
  handler: async (ctx, { options, doneProcessing = false }) => {
    const scheduled = await ctx.db.query("eventSchedule").first();
    if (scheduled !== null) {
      if (!doneProcessing) {
        return;
      }

      await ctx.db.delete(scheduled._id);
    }

    const areThereMoreEvents =
      (await ctx.runQuery(internal.events.getOldestEvents, { count: 1 }))
        .length > 0;

    if (!areThereMoreEvents && doneProcessing) {
      return;
    }

    const jobId = await ctx.scheduler.runAfter(
      (areThereMoreEvents ? 0 : EVENT_PROCESSING_INTERVAL_SECONDS) * 1000,
      internal.events.processEvents,
      { options }
    );

    await ctx.db.insert("eventSchedule", { jobId });
  },
});

export const processEvents = internalAction({
  args: {
    options: eventsOptions,
  },
  handler: async (ctx, { options }) => {
    const events = await ctx.runQuery(internal.events.getOldestEvents, {
      count: EVENT_BATCH_SIZE,
    });

    const sdkKey = await ctx.runQuery(internal.sdkKey.get);
    if (!sdkKey) {
      console.error("No SDK key found, cannot send events.");
      return;
    }

    await sendEvents(events, sdkKey, options);

    await ctx.runMutation(internal.events.deleteOldestEvents, {
      count: events.length,
    });

    await ctx.runMutation(internal.events.scheduleProcessing, {
      doneProcessing: true,
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

export const deleteOldestEvents = internalMutation({
  args: { count: v.number() },
  handler: async (ctx, { count }) => {
    const events = await ctx.db.query("events").take(count);
    await Promise.all(
      events.map(async (event) => {
        await ctx.db.delete(event._id);
      })
    );
  },
});
