import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import schema from "./schema";
import { modules } from "./setup.test";
import {
  EVENT_BATCH_SIZE,
  EVENT_CAPACITY,
  EVENT_PROCESSING_INTERVAL_SECONDS,
  storeEventsHandler as storeEvents,
} from "./events";
import { sendEvents } from "../sdk/EventProcessor";

vi.mock("../sdk/EventProcessor", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../sdk/EventProcessor")>();
  return {
    ...original,
    sendEvents: vi.fn(),
  };
});

describe("events", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should store an event", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      const payload = JSON.stringify({ event: "test-event" });
      await storeEvents(ctx, { sdkKey: "test-sdk-key", payloads: [payload] });
      const storedEvent = await ctx.db.query("events").first();
      expect(storedEvent?.payload).toEqual(payload);
    });
  });

  test("should store multiple events", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const payloads = [
        JSON.stringify({ event: "test-event-1" }),
        JSON.stringify({ event: "test-event-2" }),
      ];
      await storeEvents(ctx, { sdkKey: "test-sdk-key", payloads });
      const storedEvents = await ctx.db.query("events").collect();
      expect(storedEvents.length).toEqual(2);
      expect(storedEvents[0].payload).toEqual(payloads[0]);
      expect(storedEvents[1].payload).toEqual(payloads[1]);
    });
  });

  test("should store multiple events across multiple calls", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const payloads = [JSON.stringify({ event: "test-event-1" })];
      await storeEvents(ctx, { sdkKey: "test-sdk-key", payloads });

      const payloads2 = [JSON.stringify({ event: "test-event-2" })];
      await storeEvents(ctx, { sdkKey: "test-sdk-key", payloads: payloads2 });

      const storedEvents = await ctx.db.query("events").collect();
      expect(storedEvents.length).toEqual(2);
      expect(storedEvents[0].payload).toEqual(payloads[0]);
      expect(storedEvents[1].payload).toEqual(payloads2[0]);
    });
  });

  test("should partially drop events if the event store is full", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const loadsOfPayloads = Array.from(
        { length: EVENT_CAPACITY + 1 },
        (_, i) => JSON.stringify({ event: `test-event-${i}` })
      );

      await storeEvents(ctx, {
        sdkKey: "test-sdk-key",
        payloads: loadsOfPayloads,
      });

      const storedEvents = await ctx.db.query("events").collect();
      expect(storedEvents.length).toEqual(EVENT_CAPACITY);
    });
  });

  test("should drop events if the event store is full", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const loadsOfPayloads = Array.from({ length: EVENT_CAPACITY }, (_, i) =>
        JSON.stringify({ event: `test-event-${i}` })
      );

      await storeEvents(ctx, {
        sdkKey: "test-sdk-key",
        payloads: loadsOfPayloads,
      });

      const storedEvents = await ctx.db.query("events").collect();
      expect(storedEvents.length).toEqual(EVENT_CAPACITY);

      const newPayloads = [JSON.stringify({ event: "new-event" })];

      await storeEvents(ctx, {
        sdkKey: "test-sdk-key",
        payloads: newPayloads,
      });

      const updatedStoredEvents = await ctx.db.query("events").collect();

      expect(updatedStoredEvents.length).toEqual(EVENT_CAPACITY);
      expect(
        updatedStoredEvents.find((event) => event.payload === newPayloads[0])
      ).toBeUndefined();
    });
  });

  test("should schedule processing of events", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      expect(await ctx.db.query("eventSchedule").first()).toBeNull();
      const payload = JSON.stringify({ event: "test-event" });
      await storeEvents(ctx, { sdkKey: "test-sdk-key", payloads: [payload] });
      const scheduledJob = await ctx.db.query("eventSchedule").first();
      expect(scheduledJob).not.toBeNull();
      const scheduledSystemJob = await ctx.db.system.get(scheduledJob!.jobId);
      expect(scheduledSystemJob).not.toBeNull();
      expect(scheduledSystemJob!.name).toBe("events:processEvents");
      expect(scheduledSystemJob!.args).toStrictEqual([
        { sdkKey: "test-sdk-key" },
      ]);
      expect(scheduledSystemJob!.scheduledTime).toBe(
        Date.now() + EVENT_PROCESSING_INTERVAL_SECONDS * 1000
      );
    });
  });

  test("should not reschedule if there is already a scheduled job", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const payload = JSON.stringify({ event: "test-event" });
      await storeEvents(ctx, { sdkKey: "test-sdk-key", payloads: [payload] });
      const scheduledJob = await ctx.db.query("eventSchedule").first();

      expect(scheduledJob).not.toBeNull();
      await storeEvents(ctx, { sdkKey: "test-sdk-key", payloads: [] });

      const updatedScheduledJob = await ctx.db.query("eventSchedule").first();
      expect(updatedScheduledJob).toEqual(scheduledJob);
    });
  });

  test("should reschedule if the arguments change", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const payload = JSON.stringify({ event: "test-event" });
      await storeEvents(ctx, { sdkKey: "test-sdk-key", payloads: [payload] });
      const scheduledJob = await ctx.db.query("eventSchedule").first();

      expect(scheduledJob).not.toBeNull();
      await storeEvents(ctx, { sdkKey: "test-sdk-key-2", payloads: [] });

      const updatedScheduledJob = await ctx.db.query("eventSchedule").first();
      expect(updatedScheduledJob).not.toBeNull();
      expect(updatedScheduledJob).not.toEqual(scheduledJob);
      const oldScheduledSystemJob = await ctx.db.system.get(
        scheduledJob!.jobId
      );
      expect(oldScheduledSystemJob).not.toBeNull();
      expect(oldScheduledSystemJob!.state.kind).toBe("canceled");

      const newScheduledSystemJob = await ctx.db.system.get(
        updatedScheduledJob!.jobId
      );
      expect(newScheduledSystemJob).not.toBeNull();
      expect(newScheduledSystemJob!.args).toStrictEqual([
        { sdkKey: "test-sdk-key-2" },
      ]);
      expect(newScheduledSystemJob!.scheduledTime).toBe(
        Date.now() + EVENT_PROCESSING_INTERVAL_SECONDS * 1000
      );
    });
  });

  test("should process a small number of events in one go", async () => {
    const payloads = [
      JSON.stringify({ event: "test-event-1" }),
      JSON.stringify({ event: "test-event-2" }),
    ];
    const t = convexTest(schema, modules);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let events: any;
    await t.run(async (ctx) => {
      await storeEvents(ctx, { sdkKey: "test-sdk-key", payloads });
      events = await ctx.db.query("events").collect();
      expect(events.length).toEqual(2);

      expect(sendEvents).toHaveBeenCalledTimes(0);
    });

    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect(sendEvents).toHaveBeenCalledOnce();
    expect(sendEvents).toBeCalledWith(events, "test-sdk-key", {});

    await t.run(async (ctx) => {
      const newEvents = await ctx.db.query("events").collect();
      expect(newEvents.length).toEqual(0);

      const scheduledJob = await ctx.db.query("eventSchedule").first();
      expect(scheduledJob).not.toBeNull();
      const scheduledSystemJob = await ctx.db.system.get(scheduledJob!.jobId);
      expect(scheduledSystemJob).not.toBeNull();
      expect(scheduledSystemJob!.state.kind).toBe("success");
      expect(scheduledSystemJob?.scheduledTime).toBe(Date.now());
    });
  });

  test("should process a large number of events in multiple calls", async () => {
    const t = convexTest(schema, modules);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let events: any;
    await t.run(async (ctx) => {
      const payloads = Array.from({ length: EVENT_CAPACITY }, (_, i) =>
        JSON.stringify({ event: `test-event-${i}` })
      );
      await storeEvents(ctx, { sdkKey: "test-sdk-key", payloads });
      events = await ctx.db.query("events").collect();
    });

    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect(sendEvents).toHaveBeenCalledTimes(EVENT_CAPACITY / EVENT_BATCH_SIZE);
    for (let i = 0; i < EVENT_CAPACITY / EVENT_BATCH_SIZE; i++) {
      expect(sendEvents).toHaveBeenNthCalledWith(
        i + 1,
        events!.slice(i * EVENT_BATCH_SIZE, (i + 1) * EVENT_BATCH_SIZE),
        "test-sdk-key",
        {}
      );
    }

    await t.run(async (ctx) => {
      const newEvents = await ctx.db.query("events").collect();
      expect(newEvents.length).toEqual(0);

      const scheduledJob = await ctx.db.query("eventSchedule").first();
      expect(scheduledJob).not.toBeNull();
      const scheduledSystemJob = await ctx.db.system.get(scheduledJob!.jobId);
      expect(scheduledSystemJob).not.toBeNull();
      expect(scheduledSystemJob!.state.kind).toBe("success");
      expect(scheduledSystemJob?.scheduledTime).toBe(Date.now());
    });
  });

  test("does not send events if there are none to send", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await storeEvents(ctx, {
        sdkKey: "test-sdk-key",
        payloads: [],
      });

      const scheduledJob = await ctx.db.query("eventSchedule").first();
      expect(scheduledJob).not.toBeNull();
    });

    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(sendEvents).toHaveBeenCalledTimes(0);

    await t.run(async (ctx) => {
      const scheduledJob = await ctx.db.query("eventSchedule").first();
      const scheduledSystemJob = await ctx.db.system.get(scheduledJob!.jobId);
      expect(scheduledSystemJob).not.toBeNull();
      expect(scheduledSystemJob!.state.kind).toBe("success");
    });
  });

  test("should not delete events if there was an error sending them", async () => {
    const t = convexTest(schema, modules);
    vi.mocked(sendEvents).mockImplementationOnce(() => {
      throw new Error("Test error");
    });

    await t.run(async (ctx) => {
      const payloads = [
        JSON.stringify({ event: "test-event-1" }),
        JSON.stringify({ event: "test-event-2" }),
      ];
      await storeEvents(ctx, { sdkKey: "test-sdk-key", payloads });
    });

    await t.finishAllScheduledFunctions(vi.runAllTimers);

    await t.run(async (ctx) => {
      const storedEvents = await ctx.db.query("events").collect();
      expect(storedEvents.length).toEqual(2);

      const scheduledJob = await ctx.db.query("eventSchedule").first();
      const scheduledSystemJob = await ctx.db.system.get(scheduledJob!.jobId);
      expect(scheduledSystemJob).not.toBeNull();
      expect(scheduledSystemJob!.state.kind).toBe("failed");

      // Sending a new event should attempt to reprocess by scheduling a new job.
      await storeEvents(ctx, {
        sdkKey: "test-sdk-key",
        payloads: [JSON.stringify({ event: "test-event-3" })],
      });

      const updatedStoredEvents = await ctx.db.query("events").collect();
      expect(updatedStoredEvents.length).toEqual(3);

      const updatedScheduledJob = await ctx.db.query("eventSchedule").first();
      expect(updatedScheduledJob).not.toBeNull();
      const updatedScheduledSystemJob = await ctx.db.system.get(
        updatedScheduledJob!.jobId
      );
      expect(updatedScheduledSystemJob).not.toBeNull();
      expect(updatedScheduledSystemJob!.state.kind).toBe("pending");
    });
  });
});
