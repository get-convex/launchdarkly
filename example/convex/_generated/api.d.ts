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

import type * as examples from "../examples.js";
import type * as http from "../http.js";

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
  examples: typeof examples;
  http: typeof http;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  launchdarkly: {
    events: {
      storeEvents: FunctionReference<
        "mutation",
        "internal",
        {
          options?: {
            allAttributesPrivate?: boolean;
            eventsUri?: string;
            privateAttributes?: Array<string>;
          };
          payloads: Array<string>;
          sdkKey: string;
        },
        null
      >;
    };
    initialize: {
      poll: FunctionReference<
        "action",
        "internal",
        { intervalSeconds?: number; sdkKey: string; timeoutSeconds?: number },
        any
      >;
    };
    store: {
      get: FunctionReference<
        "query",
        "internal",
        { key: string; kind: "flags" | "segments" },
        string | null
      >;
      getAll: FunctionReference<
        "query",
        "internal",
        { kind: "flags" | "segments" },
        Array<string>
      >;
      initialized: FunctionReference<"query", "internal", {}, boolean>;
      write: FunctionReference<
        "mutation",
        "internal",
        { payload: string },
        null
      >;
    };
    tokens: {
      validate: FunctionReference<
        "query",
        "internal",
        { token?: string },
        { error?: string; success: boolean }
      >;
    };
  };
};

/* prettier-ignore-end */
