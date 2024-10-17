import type { Platform, LDOptions } from "@launchdarkly/js-server-sdk-common";
import { LDClientImpl, Context } from "@launchdarkly/js-server-sdk-common";
import { RunMutationCtx } from "../component/types";
import { createPlatformInfo } from "./createPlatformInfo";
import ConvexCrypto from "./crypto";
import { createCallbacks, createOptions } from "./LDClient";
import { Mounts } from "../component/_generated/api";

// This is a replacement for the built-in event processor that
// stores events in the convex component instead of sending them to LaunchDarkly.
// The events in the store will later be picked up by a scheduled function in Convex
// and sent to LaunchDarkly.
export class EventProcessor {
  constructor(
    private readonly eventStore: Mounts["events"],
    private readonly ctx: RunMutationCtx,
    private readonly sdkKey: string
  ) {}

  sendEvent(inputEvent: object) {
    void (async () => {
      await this.ctx.runMutation(this.eventStore.storeEvents, {
        payloads: [JSON.stringify(inputEvent)],
        sdkKey: this.sdkKey,
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
    // Don't connect to any stream.
    streamUri: "",
  };
  if (options?.eventsUri) {
    ldOptions.eventsUri = options.eventsUri;
  }
  if (options?.allAttributesPrivate !== undefined) {
    ldOptions.allAttributesPrivate = options.allAttributesPrivate;
  }
  if (options?.privateAttributes) {
    ldOptions.privateAttributes = options.privateAttributes;
  }

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

  await eventProcessor.flush();
};
