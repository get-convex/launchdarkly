import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { modules } from "./setup.test";
import { EVENT_CAPACITY, storeEvents } from "./events";
import { store } from "./sdkKey";

describe("events", () => {
  describe("storeEvents", () => {
    test("should not store an event if SDK key is not set", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        const payload = JSON.stringify({ event: "test-event" });
        await storeEvents(ctx, { payloads: [payload] });
        const storedEvent = await ctx.db.query("events").first();
        expect(storedEvent?.payload).toEqual(undefined);
      });
    });

    test("should store an event if SDK key is set", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        await store(ctx, { sdkKey: "test-sdk-key" });
        const payload = JSON.stringify({ event: "test-event" });
        await storeEvents(ctx, { payloads: [payload] });
        const storedEvent = await ctx.db.query("events").first();
        expect(storedEvent?.payload).toEqual(payload);
      });
    });

    test("should store multiple events", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        await store(ctx, { sdkKey: "test-sdk-key" });
        const payloads = [
          JSON.stringify({ event: "test-event-1" }),
          JSON.stringify({ event: "test-event-2" }),
        ];
        await storeEvents(ctx, { payloads });
        const storedEvents = await ctx.db.query("events").collect();
        expect(storedEvents.length).toEqual(2);
        expect(storedEvents[0].payload).toEqual(payloads[0]);
        expect(storedEvents[1].payload).toEqual(payloads[1]);
      });
    });

    test("should store multiple events across multiple calls", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        await store(ctx, { sdkKey: "test-sdk-key" });
        const payloads = [JSON.stringify({ event: "test-event-1" })];
        await storeEvents(ctx, { payloads });

        const payloads2 = [JSON.stringify({ event: "test-event-2" })];
        await storeEvents(ctx, { payloads: payloads2 });

        const storedEvents = await ctx.db.query("events").collect();
        expect(storedEvents.length).toEqual(2);
        expect(storedEvents[0].payload).toEqual(payloads[0]);
        expect(storedEvents[1].payload).toEqual(payloads2[0]);
      });
    });

    test("should partially drop events if the event store is full", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        await store(ctx, { sdkKey: "test-sdk-key" });
        const loadsOfPayloads = Array.from(
          { length: EVENT_CAPACITY + 1 },
          (_, i) => JSON.stringify({ event: `test-event-${i}` })
        );

        await storeEvents(ctx, { payloads: loadsOfPayloads });

        const storedEvents = await ctx.db.query("events").collect();
        expect(storedEvents.length).toEqual(EVENT_CAPACITY);
      });
    });

    test("should drop events if the event store is full", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        await store(ctx, { sdkKey: "test-sdk-key" });
        const loadsOfPayloads = Array.from({ length: EVENT_CAPACITY }, (_, i) =>
          JSON.stringify({ event: `test-event-${i}` })
        );

        await storeEvents(ctx, { payloads: loadsOfPayloads });

        const storedEvents = await ctx.db.query("events").collect();
        expect(storedEvents.length).toEqual(EVENT_CAPACITY);

        const newPayloads = [JSON.stringify({ event: "new-event" })];

        await storeEvents(ctx, { payloads: newPayloads });

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
        await store(ctx, { sdkKey: "test-sdk-key" });
        expect(await ctx.db.query("eventSchedule").first()).toBeNull();
        const payload = JSON.stringify({ event: "test-event" });
        await storeEvents(ctx, { payloads: [payload] });
        expect(await ctx.db.query("eventSchedule").first()).not.toBeNull();
      });
    });
  });
});
