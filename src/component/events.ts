import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { sendEvents } from "../sdk/EventProcessor";

// TODO: Tune and make all these configurable.
const EVENT_CAPACITY = 1000;
const EVENT_BATCH_SIZE = 100;
const EVENT_PROCESSING_INTERVAL_SECONDS = 30;

export const storeEvents = mutation({
  args: {
    payloads: v.array(v.string()),
    sdkKey: v.string(),
    eventsUri: v.optional(v.string()),
  },
  handler: async (ctx, { payloads, sdkKey, eventsUri }) => {
    await ctx.runMutation(internal.events.scheduleProcessing, {
      sdkKey,
      eventsUri,
    });

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

export const scheduleProcessing = internalMutation({
  args: {
    sdkKey: v.string(),
    eventsUri: v.optional(v.string()),
    doneProcessing: v.optional(v.boolean()),
  },
  handler: async (ctx, { sdkKey, eventsUri, doneProcessing = false }) => {
    const scheduled = await ctx.db.query("eventSchedule").first();
    if (scheduled !== null) {
      if (!doneProcessing) {
        console.debug("Event processing is already scheduled");
        return;
      }

      await ctx.db.delete(scheduled._id);
    }

    const areThereMoreEvents =
      (await ctx.runQuery(internal.events.getOldestEvents, { count: 1 }))
        .length > 0;

    if (!areThereMoreEvents && doneProcessing) {
      console.debug("No more events to process");
      return;
    }

    const jobId = await ctx.scheduler.runAfter(
      (areThereMoreEvents ? 0 : EVENT_PROCESSING_INTERVAL_SECONDS) * 1000,
      internal.events.processEvents,
      { sdkKey, eventsUri }
    );

    await ctx.db.insert("eventSchedule", { jobId });
  },
});

export const processEvents = internalAction({
  args: { sdkKey: v.string(), eventsUri: v.optional(v.string()) },
  handler: async (ctx, { sdkKey, eventsUri }) => {
    const events = await ctx.runQuery(internal.events.getOldestEvents, {
      count: EVENT_BATCH_SIZE,
    });

    await sendEvents(events, sdkKey, eventsUri);

    await ctx.runMutation(internal.events.deleteOldestEvents, {
      count: events.length,
    });

    await ctx.runMutation(internal.events.scheduleProcessing, {
      sdkKey,
      doneProcessing: true,
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