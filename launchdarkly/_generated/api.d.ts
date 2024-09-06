/* prettier-ignore-start */

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as sdk_LDClient from "../sdk/LDClient.js";
import type * as sdk_createPlatformInfo from "../sdk/createPlatformInfo.js";
import type * as sdk_featureStore from "../sdk/featureStore.js";
import type * as store from "../store.js";
import type * as tokens from "../tokens.js";
import type * as webhook from "../webhook.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "sdk/LDClient": typeof sdk_LDClient;
  "sdk/createPlatformInfo": typeof sdk_createPlatformInfo;
  "sdk/featureStore": typeof sdk_featureStore;
  store: typeof store;
  tokens: typeof tokens;
  webhook: typeof webhook;
}>;
declare const fullApiWithMounts: typeof fullApi & {
  store: {
    get: FunctionReference<
      "query",
      "public",
      { rootKey: string },
      string | null
    >;
    store: FunctionReference<
      "mutation",
      "public",
      { key: string; payload: { flags: any; segments: any } },
      null
    >;
  };
  webhook: {
    validate: FunctionReference<
      "query",
      "public",
      { sdkKey?: string; token?: string },
      { error?: string; success: boolean }
    >;
  };
};

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

/* prettier-ignore-end */
