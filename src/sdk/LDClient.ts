import {
  type Platform,
  LDLogger,
} from "@launchdarkly/js-server-sdk-common-edge";
import {
  type LDOptions,
  LDClientImpl,
} from "@launchdarkly/js-server-sdk-common";

import { FunctionReference } from "convex/server";

import { createPlatformInfo } from "./createPlatformInfo";
import ConvexCrypto from "./crypto";
import { FeatureStore } from "./FeatureStore";
import { EventProcessor } from "./EventProcessor";
import { RunMutationCtx, RunQueryCtx } from "../component/typeHelpers";

const convex = "Convex";

export type LaunchDarklyComponent = {
  tokens: {
    validate: FunctionReference<"query", "internal", { token?: string }>;
  };
  store: LaunchDarklyStore;
  events: LaunchDarklyEventStore;
};

export type LaunchDarklyEventStore = {
  storeEvents: FunctionReference<
    "mutation",
    "internal",
    { payloads: string[]; sdkKey: string }
  >;
};

export type LaunchDarklyStore = {
  initialized: FunctionReference<
    "query",
    "internal",
    Record<string, never>,
    boolean
  >;

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
  ctx: RunQueryCtx;
  component: LaunchDarklyComponent;
  application?: LDOptions["application"];
  sdkKey: string;
  sendEvents?: boolean;
} & (
  | { ctx: RunQueryCtx; sendEvents: false }
  | { ctx: RunMutationCtx; sendEvents?: boolean }
);

export const init = ({
  ctx,
  component,
  sendEvents,
  application,
  sdkKey,
}: BaseSDKParams): LDClientImpl => {
  const { store, events } = component;
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
  if ("runMutation" in ctx && sendEvents) {
    // @ts-expect-error Accessing internals
    client.eventProcessor = new EventProcessor(events, ctx, sdkKey);
  }
  return client;
};

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
