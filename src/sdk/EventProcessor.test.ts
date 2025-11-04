import { describe, expect, test, vi } from "vitest";
import {
  EventProcessor,
  validateEventProcessorOptions,
} from "./EventProcessor";
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

describe("validateEventProcessorOptions", () => {
  test("should throw an error if allAttributesPrivate is not a boolean", () => {
    const options = { allAttributesPrivate: "true" };
    // @ts-expect-error testing invalid input
    expect(() => validateEventProcessorOptions(options)).toThrow(
      new Error("allAttributesPrivate must be a boolean"),
    );
  });

  test("should throw an error if privateAttributes is not an array", () => {
    const options = { privateAttributes: "not-an-array" };
    // @ts-expect-error testing invalid input
    expect(() => validateEventProcessorOptions(options)).toThrow(
      new Error("privateAttributes must be an array of strings"),
    );
  });

  test("should throw an error if eventsUri is not a string", () => {
    const options = { eventsUri: 12345 };
    // @ts-expect-error testing invalid input
    expect(() => validateEventProcessorOptions(options)).toThrow(
      new Error("eventsUri must be a string"),
    );
  });

  test("should throw an error if eventsUri is not a valid URL", () => {
    const options = { eventsUri: "invalid-url" };
    expect(() => validateEventProcessorOptions(options)).toThrow(
      new Error("eventsUri must be a valid URL"),
    );
  });

  test("should throw an error if eventProcessingIntervalSeconds is not a positive number", () => {
    const options = { eventProcessingIntervalSeconds: -1 };
    expect(() => validateEventProcessorOptions(options)).toThrow(
      new Error("eventProcessingIntervalSeconds must be a positive number"),
    );
  });

  test("should throw an error if eventCapacity is not a positive number", () => {
    const options = { eventCapacity: 0 };
    expect(() => validateEventProcessorOptions(options)).toThrow(
      new Error("eventCapacity must be a positive number"),
    );
  });

  test("should throw an error if eventCapacity is less than eventBatchSize", () => {
    const options = { eventCapacity: 10, eventBatchSize: 20 };
    expect(() => validateEventProcessorOptions(options)).toThrow(
      new Error(
        "eventCapacity must be greater than or equal to eventBatchSize",
      ),
    );
  });

  test("should throw an error if eventBatchSize is not a positive number", () => {
    const options = { eventBatchSize: -1 };
    expect(() => validateEventProcessorOptions(options)).toThrow(
      new Error("eventBatchSize must be a positive number"),
    );
  });

  test("should throw an error if eventBatchSize exceeds 4000", () => {
    const options = { eventBatchSize: 5000 };
    expect(() => validateEventProcessorOptions(options)).toThrow(
      new Error("eventBatchSize must be less than or equal to 4000"),
    );
  });

  test("should not throw an error if options are valid", () => {
    const validOptions = {
      allAttributesPrivate: true,
      privateAttributes: ["attr1", "attr2"],
      eventsUri: "https://valid.url",
      eventProcessingIntervalSeconds: 10,
      eventCapacity: 100,
      eventBatchSize: 50,
    };
    expect(() => validateEventProcessorOptions(validOptions)).not.toThrow();
  });
});
