/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
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
        null,
        Name
      >;
    };
    store: {
      get: FunctionReference<
        "query",
        "internal",
        { key: string; kind: "flags" | "segments" },
        string | null,
        Name
      >;
      getAll: FunctionReference<
        "query",
        "internal",
        { kind: "flags" | "segments" },
        Array<string>,
        Name
      >;
      initialized: FunctionReference<"query", "internal", {}, boolean, Name>;
      write: FunctionReference<
        "mutation",
        "internal",
        { payload: string },
        null,
        Name
      >;
    };
    tokens: {
      validate: FunctionReference<
        "query",
        "internal",
        { token?: string },
        { error?: string; success: boolean },
        Name
      >;
    };
  };
