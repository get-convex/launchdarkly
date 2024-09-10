import {
  type LDOptions,
  type Platform,
  type LDLogger,
  LDClientImpl,
} from "@launchdarkly/js-server-sdk-common";

import { createPlatformInfo } from "./createPlatformInfo";
import ConvexCrypto from "./crypto";
import { FeatureStore } from "./FeatureStore";
import {
  LaunchDarklyComponent,
  RunMutationCtx,
  RunQueryCtx,
} from "../component/types";

const convex = "Convex";

export type BaseSDKParams = {
  component: LaunchDarklyComponent;
  sdkKey?: string;
  options?: {
    updateProcessor?: LDOptions["updateProcessor"];
    application?: LDOptions["application"];
  };
} & ({ ctx: RunQueryCtx } | { ctx: RunMutationCtx });

export class LDClient extends LDClientImpl {
  constructor({ ctx, component, options, sdkKey }: BaseSDKParams) {
    const { store } = component;
    const logger = console;

    const featureStore = new FeatureStore(ctx, store, convex, logger);

    const ldOptions: LDOptions = {
      featureStore,
      ...createOptions(logger),
      ...(options || {}),
    };

    const platform: Platform = {
      info: createPlatformInfo(),
      crypto: new ConvexCrypto(),
      // @ts-expect-error We do not allow LDClient to send requests inside of the Convex runtime.
      requests: undefined,
    };

    super(sdkKey || convex, platform, ldOptions, createCallbacks(logger));
  }
}

const createOptions = (logger: LDLogger): LDOptions => ({
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

const createCallbacks = (logger: LDLogger) => ({
  onError: (err: Error) => {
    logger.error(err.message);
  },
  onFailed: () => {},
  onReady: () => {},
  onUpdate: () => {},
  hasEventListeners: () => false,
});
