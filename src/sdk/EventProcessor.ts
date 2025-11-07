import type { Platform, LDOptions } from "@launchdarkly/js-server-sdk-common";
import {
  LDClientImpl,
  Context,
  BasicLogger,
} from "@launchdarkly/js-server-sdk-common";
import { type RunMutationCtx } from "../component/types.js";
import { createPlatformInfo } from "./createPlatformInfo.js";
import ConvexCrypto from "./crypto.js";
import { createCallbacks, createOptions } from "./LaunchDarkly.js";
import type { ComponentApi } from "../component/_generated/component.js";

// This is a replacement for the built-in event processor that
// stores events in the convex component instead of sending them to LaunchDarkly.
// The events in the store will later be picked up by a scheduled function in Convex
// and sent to LaunchDarkly.
export class EventProcessor {
  constructor(
    private readonly eventStore: ComponentApi["events"],
    private readonly ctx: RunMutationCtx,
    private readonly sdkKey: string,
    private readonly options?: EventProcessorOptions,
  ) {}

  sendEvent(inputEvent: object) {
    return this.ctx.runMutation(this.eventStore.storeEvents, {
      payloads: [JSON.stringify(inputEvent)],
      sdkKey: this.sdkKey,
      options: this.options,
    });
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
  },
) => {
  const platform: Platform = {
    info: createPlatformInfo(),
    crypto: new ConvexCrypto(),
    // @ts-expect-error We only allow fetch
    requests: { fetch },
  };

  const logger = new BasicLogger({
    level: "info",
  });

  const ldOptions: LDOptions = {
    ...createOptions(logger),
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
    createCallbacks(console),
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

export type EventProcessorOptions = {
  allAttributesPrivate?: boolean;
  privateAttributes?: string[];

  // The URL to send events to. If not provided, the default LaunchDarkly
  // events endpoint will be used. Most users will not need to set this.
  eventsUri?: string;
  // The number of events to store in LaunchDarkly, awaiting processing
  // to be sent to LaunchDarkly. If the number of events exceeds this
  // value, new events will be dropped.
  eventCapacity?: number;
  // The number of events to send to LaunchDarkly in a single batch.
  eventBatchSize?: number;
  // How often to process events, in seconds.
  eventProcessingIntervalSeconds?: number;
};

export const validateEventProcessorOptions = (
  options?: EventProcessorOptions,
) => {
  if (!options) {
    return;
  }

  if (
    options.allAttributesPrivate !== undefined &&
    typeof options.allAttributesPrivate !== "boolean"
  ) {
    throw new Error("allAttributesPrivate must be a boolean");
  }
  if (
    options.privateAttributes !== undefined &&
    !Array.isArray(options.privateAttributes)
  ) {
    throw new Error("privateAttributes must be an array of strings");
  }
  if (options.eventsUri !== undefined) {
    if (typeof options.eventsUri !== "string") {
      throw new Error("eventsUri must be a string");
    }
    try {
      new URL(options.eventsUri);
    } catch {
      throw new Error("eventsUri must be a valid URL");
    }
  }

  if (options.eventProcessingIntervalSeconds !== undefined) {
    if (
      typeof options.eventProcessingIntervalSeconds !== "number" ||
      options.eventProcessingIntervalSeconds <= 0
    ) {
      throw new Error(
        "eventProcessingIntervalSeconds must be a positive number",
      );
    }
  }

  if (options.eventCapacity !== undefined) {
    if (
      typeof options.eventCapacity !== "number" ||
      options.eventCapacity <= 0
    ) {
      throw new Error("eventCapacity must be a positive number");
    }

    if (
      options.eventBatchSize !== undefined &&
      options.eventCapacity <= options.eventBatchSize
    ) {
      throw new Error(
        "eventCapacity must be greater than or equal to eventBatchSize",
      );
    }
  }

  if (options.eventBatchSize !== undefined) {
    if (
      typeof options.eventBatchSize !== "number" ||
      options.eventBatchSize <= 0
    ) {
      throw new Error("eventBatchSize must be a positive number");
    }

    // Do not allow eventBatchSize to exceed 4000 to respect Convex limits.
    if (options.eventBatchSize > 4000) {
      throw new Error("eventBatchSize must be less than or equal to 4000");
    }
  }
};
