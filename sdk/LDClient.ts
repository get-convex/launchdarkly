/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type Platform,
  type EdgeProvider,
} from "@launchdarkly/js-server-sdk-common-edge";

import BasicLogger from "@launchdarkly/js-sdk-common/dist/logging/BasicLogger";

import type { LDOptions } from "@launchdarkly/js-server-sdk-common";

import LDClient from "@launchdarkly/akamai-edgeworker-sdk-common/dist/api/LDClient";
import { EdgeFeatureStore } from "@launchdarkly/akamai-edgeworker-sdk-common/dist/featureStore";
import { buildRootKey } from "@launchdarkly/akamai-edgeworker-sdk-common/dist/featureStore/index";
import CacheableStoreProvider from "@launchdarkly/akamai-edgeworker-sdk-common/dist/featureStore/cacheableStoreProvider";

import {
  AnyDataModel,
  FunctionReference,
  GenericQueryCtx,
} from "convex/server";
import { createPlatformInfo } from "./createPlatformInfo";
import EdgeCrypto from "./crypto";

const convex = "Convex";

export type LaunchDarklyComponent = {
  tokens: {
    validate: FunctionReference<"query", "internal", { token?: string }>;
  };
  store: LaunchDarklyStore;
};

type LaunchDarklyStore = {
  get: FunctionReference<"query", "internal">;
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
}: BaseSDKParams): LDClient => {
  // @ts-expect-error CacheableStoreProvider is exported as an ES Module.
  const cachableStoreProvider = new CacheableStoreProvider.default(
    convexEdgeProvider(ctx, store),
    buildRootKey(convex)
  );
  const featureStore = new EdgeFeatureStore(
    cachableStoreProvider,
    sdkKey,
    convex,
    // @ts-expect-error BasicLogger is exported as an ES Module.
    BasicLogger.default.get()
  );

  const ldOptions: LDOptions = {
    featureStore,
    ...createOptions(),
  };

  if (application) {
    ldOptions.application = application;
  }

  const platform: Platform = {
    info: createPlatformInfo(),
    crypto: new EdgeCrypto(),
    // @ts-expect-error We do not allow LDClient to send requests inside of the Convex runtime.
    requests: undefined,
  };

  // @ts-expect-error LDClient is exported as an ES Module.
  const client: LDClient = new LDClient.default(
    sdkKey,
    platform,
    ldOptions,
    cachableStoreProvider
  );
  return client;
};

export function convexEdgeProvider(
  ctx: GenericQueryCtx<AnyDataModel>,
  store: BaseSDKParams["store"]
): EdgeProvider {
  return {
    get: async () => {
      const payload = await ctx.runQuery(store.get);
      return payload;
    },
  };
}

const createOptions = (): LDOptions => ({
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

  // @ts-expect-error BasicLogger is exported as an ES Module.
  logger: BasicLogger.default.get(),

  wrapperName: convex,
  wrapperVersion: "0.0.1",
});
