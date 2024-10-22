import {
  type LDOptions,
  type Platform,
  type LDLogger,
  LDClientImpl,
} from "@launchdarkly/js-server-sdk-common";

import { createPlatformInfo } from "./createPlatformInfo";
import ConvexCrypto from "./crypto";
import { FeatureStore } from "./FeatureStore";
import { EventProcessor } from "./EventProcessor";
import { RunMutationCtx, RunQueryCtx } from "../component/types";
import { ComponentApi } from "./useApi";

export class LaunchDarkly extends LDClientImpl {
  constructor(
    component: ComponentApi,
    ctx: RunQueryCtx | RunMutationCtx,
    options?: {
      application?: LDOptions["application"];
      sendEvents?: boolean;
    }
  ) {
    const { store, events } = component;
    const logger = console;

    const featureStore = new FeatureStore(ctx, store, logger);

    const sendEvents = options?.sendEvents !== false;
    const ldOptions: LDOptions = {
      featureStore,
      ...createOptions(logger),
      ...(options || {}),
      sendEvents: false,
    };

    const platform: Platform = {
      info: createPlatformInfo(),
      crypto: new ConvexCrypto(),
      // @ts-expect-error We do not allow LDClient to send requests inside of the Convex runtime.
      requests: undefined,
    };
    super("sdk-unused", platform, ldOptions, createCallbacks(logger));

    // We can only send events if the context has a runMutation function.
    // This exists in Convex mutations and actions, but not in queries.
    if ("runMutation" in ctx && sendEvents) {
      const eventProcessor = new EventProcessor(events, ctx);
      // @ts-expect-error We are setting the eventProcessor directly here.
      this.eventProcessor = eventProcessor;
    }
  }
}

export const createOptions = (logger: LDLogger): LDOptions => ({
  // Even though the SDK can send events with our own implementation, we need
  // to set this value to false so the super() constructor does not call EventProcessor.start() which calls setInterval.
  sendEvents: false,
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
