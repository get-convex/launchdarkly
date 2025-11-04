/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as example from "../example.js";
import type * as http from "../http.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  example: typeof example;
  http: typeof http;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
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
            eventBatchSize?: number;
            eventCapacity?: number;
            eventProcessingIntervalSeconds?: number;
            eventsUri?: string;
            privateAttributes?: Array<string>;
          };
          payloads: Array<string>;
          sdkKey: string;
        },
        null
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
