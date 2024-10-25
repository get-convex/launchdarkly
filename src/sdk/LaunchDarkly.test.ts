import { describe, expect, test, vi } from "vitest";
import { LaunchDarkly } from "./LaunchDarkly";
import { api } from "../component/_generated/api";
import { EventProcessor } from "./EventProcessor";

describe("LaunchDarkly", () => {
  // The LaunchDarkly internals sometimes call functions that use setTimeout and setInterval.
  // Ensure that our configuration is set up such that they are not called.
  test("initializing class does not crash and setTimeout and setInterval are not called", async () => {
    const setTimeoutSpy = vi.spyOn(global, "setTimeout");
    const setIntervalSpy = vi.spyOn(global, "setInterval");
    new LaunchDarkly(
      // @ts-expect-error It's ok
      api,
      {
        LAUNCHDARKLY_SDK_KEY: "test-key",
      }
      // @ts-expect-error It's ok
    ).sdk({});

    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  test("should throw an error if LAUNCHDARKLY_SDK_KEY is not provided", async () => {
    // @ts-expect-error It's ok
    await expect(() => new LaunchDarkly(api, {}).sdk({})).toThrow(
      new Error("LAUNCHDARKLY_SDK_KEY is required")
    );
  });

  test("should not throw an error if the env var is set", () => {
    vi.stubEnv("LAUNCHDARKLY_SDK_KEY", "test-key");

    expect(() => {
      // @ts-expect-error It's ok
      new LaunchDarkly(api, {}).sdk({});
    }).not.toThrow();

    vi.unstubAllEnvs();
  });

  test("should not configure the EventProcessor when in a query", () => {
    const ld = new LaunchDarkly(
      // @ts-expect-error It's ok
      api,
      {
        LAUNCHDARKLY_SDK_KEY: "test-key",
      }
      // @ts-expect-error It's ok
    ).sdk({});

    // @ts-expect-error We are testing internal state
    expect(ld.eventProcessor).not.toBeInstanceOf(EventProcessor);
  });

  test("should configure the EventProcessor when in a mutation", () => {
    const ld = new LaunchDarkly(
      // @ts-expect-error It's ok
      api,
      {
        LAUNCHDARKLY_SDK_KEY: "test-key",
      }
      // @ts-expect-error It's ok
    ).sdk({ runMutation: () => {} });

    // @ts-expect-error We are testing internal state
    expect(ld.eventProcessor).toBeInstanceOf(EventProcessor);
  });

  test("should not configure the EventProcessor when sendEvents is false", () => {
    const ld = new LaunchDarkly(
      // @ts-expect-error It's ok
      api,
      {
        LAUNCHDARKLY_SDK_KEY: "test-key",
        sendEvents: false,
      }
      // @ts-expect-error It's ok
    ).sdk({ runMutation: () => {} });

    // @ts-expect-error We are testing internal state
    expect(ld.eventProcessor).not.toBeInstanceOf(EventProcessor);
  });
});
