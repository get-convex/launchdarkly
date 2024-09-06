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

import type * as initializeHttp from "../initializeHttp.js";
import type * as sdk_LDClient from "../sdk/LDClient.js";
import type * as sdk_createPlatformInfo from "../sdk/createPlatformInfo.js";
import type * as sdk_crypto from "../sdk/crypto.js";
import type * as store from "../store.js";
import type * as tokens from "../tokens.js";

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
  initializeHttp: typeof initializeHttp;
  "sdk/LDClient": typeof sdk_LDClient;
  "sdk/createPlatformInfo": typeof sdk_createPlatformInfo;
  "sdk/crypto": typeof sdk_crypto;
  store: typeof store;
  tokens: typeof tokens;
}>;
declare const fullApiWithMounts: typeof fullApi & {
  store: {
    get: FunctionReference<"query", "public", {}, string | null>;
    write: FunctionReference<
      "mutation",
      "public",
      { payload: { flags: any; segments: any } },
      null
    >;
  };
  tokens: {
    validate: FunctionReference<
      "query",
      "public",
      { token?: string },
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
