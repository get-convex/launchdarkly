import {
  type Platform,
  LDLogger,
} from "@launchdarkly/js-server-sdk-common-edge";

import {
  type LDOptions,
  LDClientImpl,
} from "@launchdarkly/js-server-sdk-common";

import {
  AnyDataModel,
  FunctionReference,
  GenericQueryCtx,
} from "convex/server";

import { createPlatformInfo } from "./createPlatformInfo";
import ConvexCrypto from "./crypto";
import { FeatureStore } from "./FeatureStore";

const convex = "Convex";

export type LaunchDarklyComponent = {
  tokens: {
    validate: FunctionReference<"query", "internal", { token?: string }>;
  };
  store: LaunchDarklyStore;
};

export type LaunchDarklyStore = {
  initialized: FunctionReference<"query", "internal">;
  get: FunctionReference<
    "query",
    "internal",
    { kind: string; key: string },
    string | null
  >;

  getAll: FunctionReference<"query", "internal", { kind: string }, string[]>;

  write: FunctionReference<
    "mutation",
    "internal",
    {
      payload: string;
    }
  >;
};

type BaseSDKParams = {
  ctx: GenericQueryCtx<AnyDataModel>;
  store: LaunchDarklyStore;
  application?: LDOptions["application"];
  // Only necessary if using secureModeHash.
  // The Convex LDClient otherwise disregards the sdkKey.
  sdkKey?: string;
};

export const init = ({
  ctx,
  store,
  application,
  sdkKey = convex,
}: BaseSDKParams): LDClientImpl => {
  const logger = console;

  const featureStore = new FeatureStore(ctx, store, convex, logger);

  const ldOptions: LDOptions = {
    featureStore,
    ...createOptions(logger),
  };

  if (application) {
    ldOptions.application = application;
  }

  const platform: Platform = {
    info: createPlatformInfo(),
    crypto: new ConvexCrypto(),
    // @ts-expect-error We do not allow LDClient to send requests inside of the Convex runtime.
    requests: undefined,
  };

  const client: LDClientImpl = new LDClientImpl(
    sdkKey,
    platform,
    ldOptions,
    createCallbacks(logger)
  );
  return client;
};

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
