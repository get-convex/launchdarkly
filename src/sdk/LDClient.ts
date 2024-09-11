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
import {
  LaunchDarklyComponent,
  RunMutationCtx,
  RunQueryCtx,
} from "../component/types";

const convex = "Convex";

export class LDClient extends LDClientImpl {
  constructor(
    component: LaunchDarklyComponent,
    ctx: RunQueryCtx | RunMutationCtx,
    sdkKey: string,
    options?: {
      application?: LDOptions["application"];
      updateProcessor?: LDOptions["updateProcessor"];
      sendEvents?: boolean;
    }
  ) {
    const { store } = component;
    const logger = console;

    const featureStore = new FeatureStore(ctx, store, convex, logger);

    const sendEvents = options?.sendEvents !== false;
    const ldOptions: LDOptions = {
      featureStore,
      ...createOptions(logger),
      ...(options || {}),
      sendEvents,
    };

    const platform: Platform = {
      info: createPlatformInfo(),
      crypto: new ConvexCrypto(),
      // @ts-expect-error We do not allow LDClient to send requests inside of the Convex runtime.
      requests: undefined,
    };

    if ("runMutation" in ctx && sendEvents) {
      // @ts-expect-error Accessing internals
      client.eventProcessor = new EventProcessor(events, ctx, sdkKey);
    }
    super(sdkKey || convex, platform, ldOptions, createCallbacks(logger));
  }
}

export const createOptions = (logger: LDLogger): LDOptions => ({
  // Don't send any events to LaunchDarkly
  // TODO: Implement by storing the events in Convex instead and sending them in batch via a scheduled job.
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

  wrapperName: convex,
  wrapperVersion: "0.0.1",
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
