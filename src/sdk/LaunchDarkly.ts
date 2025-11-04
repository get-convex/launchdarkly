import {
  type LDOptions,
  type Platform,
  type LDLogger,
  LDClientImpl,
  BasicLogger,
} from "@launchdarkly/js-server-sdk-common";

import { createPlatformInfo } from "./createPlatformInfo";
import ConvexCrypto from "./crypto";
import { FeatureStore } from "./FeatureStore";
import {
  EventProcessor,
  type EventProcessorOptions,
  validateEventProcessorOptions,
} from "./EventProcessor";
import { type RunMutationCtx, type RunQueryCtx } from "../component/types";
import type { ComponentApi } from "../component/_generated/component.js";

export class LaunchDarkly {
  constructor(
    private component: ComponentApi,
    private options?: {
      application?: LDOptions["application"];
      sendEvents?: boolean;
      LAUNCHDARKLY_SDK_KEY?: string;
    } & EventProcessorOptions
  ) {}

  sdk(ctx: RunQueryCtx | RunMutationCtx) {
    return new LDClient(this.component, ctx, this.options);
  }
}

class LDClient extends LDClientImpl {
  constructor(
    component: ComponentApi,
    ctx: RunQueryCtx | RunMutationCtx,
    options?: {
      application?: LDOptions["application"];
      sendEvents?: boolean;
      LAUNCHDARKLY_SDK_KEY?: string;
    } & EventProcessorOptions
  ) {
    const { store, events } = component;
    const logger = new BasicLogger({
      level: "info",
    });

    const featureStore = new FeatureStore(ctx, store, logger);

    const sendEvents = options?.sendEvents !== false;
    const ldOptions: LDOptions = {
      featureStore,
      ...createOptions(logger),
      ...(options || {}),
      // Even though the SDK can send events with our own implementation, we need
      // to set this value to false so the super() constructor does not call EventProcessor.start() which calls setInterval.
      sendEvents: false,
    };

    const platform: Platform = {
      info: createPlatformInfo(),
      crypto: new ConvexCrypto(),
      // @ts-expect-error We do not allow LDClient to send requests inside of the Convex runtime.
      requests: undefined,
    };
    const sdkKey =
      options?.LAUNCHDARKLY_SDK_KEY || process.env.LAUNCHDARKLY_SDK_KEY;
    if (!sdkKey) {
      throw new Error("LAUNCHDARKLY_SDK_KEY is required");
    }
    super(sdkKey, platform, ldOptions, createCallbacks(logger));

    // We can only send events if the context has a runMutation function.
    // This exists in Convex mutations and actions, but not in queries.
    if ("runMutation" in ctx && sendEvents) {
      validateEventProcessorOptions(options);
      const eventProcessor = new EventProcessor(events, ctx, sdkKey, options);
      // @ts-expect-error We are setting the eventProcessor directly here.
      this.eventProcessor = eventProcessor;
    }
  }
}

export const createOptions = (logger: LDLogger): LDOptions => ({
  diagnosticOptOut: true,
  useLdd: false,

  // Override the update processor to do nothing.
  // We NEED an updateProcessor set here, otherwise the LD SDK internals
  // will attempt to call `setTimeout`, which is not supported by the
  // Convex JavaScript runtime.
  updateProcessor: (_a, _b, initSuccessHandler) => {
    initSuccessHandler();
    return {
      start: () => {},
      stop: () => {},
      close: () => {},
    };
  },

  logger,
});

export const createCallbacks = (logger: LDLogger) => ({
  onError: (err: Error) => {
    logger.error(err.message);
  },
  onFailed: () => {},
  onReady: () => {},
  onUpdate: () => {},
  hasEventListeners: () => false,
});
