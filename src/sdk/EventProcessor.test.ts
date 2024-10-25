import { describe, expect, test, vi } from "vitest";
import { EventProcessor } from "./EventProcessor";
import { convexTest } from "convex-test";
import schema from "../component/schema";
import { modules } from "../component/setup.test";
import { api } from "../component/_generated/api";
import { sendEvents } from "../sdk/EventProcessor";

describe("EventProcessor", () => {
  vi.mock("../sdk/EventProcessor", async (importOriginal) => {
    const original =
      await importOriginal<typeof import("../sdk/EventProcessor")>();
    return {
      ...original,
      sendEvents: vi.fn(),
    };
  });

  test("sendEvents should send events correctly", async () => {
    vi.useFakeTimers();
    const events = [{ payload: "event1" }, { payload: "event2" }];
    const sdkKey = "test-sdk-key";

    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      // @ts-expect-error It's ok
      const eventProcessor = new EventProcessor(api.events, ctx, sdkKey);

      await eventProcessor.sendEvent(events[0]);
    });

    await t.finishAllScheduledFunctions(vi.runAllTimers);

    expect(sendEvents).toHaveBeenCalledOnce();
  });
});
