import type { Platform, LDOptions } from "@launchdarkly/js-server-sdk-common";
import { LDClientImpl, Context } from "@launchdarkly/js-server-sdk-common";
import { RunMutationCtx } from "../component/types";
import { createPlatformInfo } from "./createPlatformInfo";
import ConvexCrypto from "./crypto";
import { createCallbacks, createOptions } from "./LaunchDarkly";
import { ComponentApi } from "./useApi";

// This is a replacement for the built-in event processor that
// stores events in the convex component instead of sending them to LaunchDarkly.
// The events in the store will later be picked up by a scheduled function in Convex
// and sent to LaunchDarkly.
export class EventProcessor {
  constructor(
    private readonly eventStore: ComponentApi["events"],
    private readonly ctx: RunMutationCtx
  ) {}

  sendEvent(inputEvent: object) {
    void (async () => {
      await this.ctx.runMutation(this.eventStore.storeEvents, {
        payloads: [JSON.stringify(inputEvent)],
      });
    })();
  }

  async flush() {
    return Promise.resolve();
  }

  start() {}

  close() {}
}

// This function is used to actually send events to LaunchDarkly.
// It picks out the internal `EventProcessor` class and re-uses it to
// send events manually.
export const sendEvents = async (
  events: { payload: string }[],
  sdkKey: string,
  options?: {
    allAttributesPrivate?: boolean;
    privateAttributes?: string[];
    eventsUri?: string;
  }
) => {
  const platform: Platform = {
    info: createPlatformInfo(),
    crypto: new ConvexCrypto(),
    // @ts-expect-error We only alow fetch
    requests: { fetch },
  };

  const ldOptions: LDOptions = {
    ...createOptions(console),
    sendEvents: true,
    // We will flush manually at the end, so make this value really high.
    flushInterval: 5,
    // Not sure what to make this number, but it should be greater
    // Then the number of events to account for any extra events,
    // like debug events.
    capacity: events.length * 2,
    ...options,
  };

  const client: LDClientImpl = new LDClientImpl(
    sdkKey,
    platform,
    ldOptions,
    createCallbacks(console)
  );

  // @ts-expect-error Accessing internals
  const eventProcessor = client.eventProcessor;

  for (const event of events) {
    const e = JSON.parse(event.payload);
    if (e.context) {
      const originalContext = e.context;
      e.context = Context.fromLDContext(originalContext);
      e.context.context = originalContext.context;
    }
    eventProcessor.sendEvent(e);
  }

  console.debug("EVENTS FLUSHING NOW");

  await eventProcessor.flush();
};
