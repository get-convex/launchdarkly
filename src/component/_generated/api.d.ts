/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as events from "../events.js";
import type * as store from "../store.js";
import type * as tokens from "../tokens.js";
import type * as types from "../types.js";

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
  events: typeof events;
  store: typeof store;
  tokens: typeof tokens;
  types: typeof types;
}>;
export type Mounts = {
  events: {
    storeEvents: FunctionReference<
      "mutation",
      "public",
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
      "public",
      { key: string; kind: "flags" | "segments" },
      string | null
    >;
    getAll: FunctionReference<
      "query",
      "public",
      { kind: "flags" | "segments" },
      Array<string>
    >;
    initialized: FunctionReference<"query", "public", {}, boolean>;
    write: FunctionReference<"mutation", "public", { payload: string }, null>;
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
// For now fullApiWithMounts is only fullApi which provides
// jump-to-definition in component client code.
// Use Mounts for the same type without the inference.
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
