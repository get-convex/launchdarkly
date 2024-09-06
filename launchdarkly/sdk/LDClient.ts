import type {
  Platform,
  EdgeProvider,
} from "@launchdarkly/js-server-sdk-common-edge";

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

type BaseSDKParams = {
  sdkKey: string;
  ctx: GenericQueryCtx<AnyDataModel>;
  launchdarklyComponent: {
    store: {
      get: FunctionReference<
        "query",
        "internal",
        {
          rootKey: string;
        }
      >;
    };
  };
};

export const init = (params: BaseSDKParams): LDClient => {
  const { sdkKey, ctx, launchdarklyComponent } = params;

  // TODO: Implement a configurable logger.
  const logger = console;

  // @ts-expect-error It's OK to use the default export here.
  const cachableStoreProvider = new CacheableStoreProvider.default(
    convexEdgeProvider(ctx, launchdarklyComponent),
    buildRootKey(sdkKey)
  );
  const featureStore = new EdgeFeatureStore(
    cachableStoreProvider,
    sdkKey,
    "Convex",
    logger
  );

  const ldOptions: LDOptions = {
    featureStore,
    ...createOptions(),
  };

  const platform: Platform = {
    info: createPlatformInfo(),
    // @ts-expect-error - we're not using the crypto or requests properties.
    crypto: undefined,
    // @ts-expect-error - we're not using the crypto or requests properties.
    requests: undefined,
  };

  // @ts-expect-error - It's OK to use the default export here.
  return new LDClient.default(
    sdkKey,
    platform,
    ldOptions,
    cachableStoreProvider
  );
};

export function convexEdgeProvider(
  ctx: GenericQueryCtx<AnyDataModel>,
  launchdarklyComponent: {
    store: {
      get: FunctionReference<
        "query",
        "internal",
        {
          rootKey: string;
        }
      >;
    };
  }
): EdgeProvider {
  return {
    get: async (rootKey: string) => {
      console.log(rootKey);
      const payload = await ctx.runQuery(launchdarklyComponent.store.get, {
        rootKey,
      });
      return payload;
    },
  };
}

const createOptions = (): LDOptions => ({
  // Don't send any events to LaunchDarkly (TODO: Implement by processing the events in Convex instead).
  sendEvents: false,
  diagnosticOptOut: true,
  useLdd: false,

  // Override the update processor to do nothing. We never want to process updates.
  updateProcessor: {
    start: () => {},
    stop: () => {},
    close: () => {},
  },

  logger: console,

  wrapperName: "convex",
  wrapperVersion: "0.0.1",
});
