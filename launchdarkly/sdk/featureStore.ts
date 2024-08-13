import type { LDFeatureStore } from "@launchdarkly/node-server-sdk";
import {
  AnyDataModel,
  FunctionReference,
  GenericMutationCtx,
} from "convex/server";

export function featureStore(
  ctx: GenericMutationCtx<AnyDataModel>,
  launchdarklyComponent: {
    store: {
      get: FunctionReference<
        "query",
        "internal",
        {
          kind: "features" | "segments";
          key: string;
        }
      >;
      all: FunctionReference<
        "query",
        "internal",
        {
          kind: "features" | "segments";
        }
      >;
    };
  }
): LDFeatureStore {
  return {
    all: function (kind, callback): void {
      if (kind.namespace !== "features" && kind.namespace !== "segments") {
        throw "Invalid namespace";
      }
      const getAll = async () => {
        const data = await ctx.runQuery(launchdarklyComponent.store.all, {
          kind: kind.namespace as "features" | "segments",
        });
        callback(
          data.reduce(
            (
              acc: Record<
                string,
                {
                  key: string;
                  version: number;
                  [key: string]: unknown;
                }
              >,
              item: {
                key: string;
                config: {
                  key: string;
                  version: number;
                  [key: string]: unknown;
                };
              }
            ) => {
              acc[item.key] = item.config;
              return acc;
            },
            {}
          )
        );
      };
      getAll();
    },
    get: function (kind, key, callback): void {
      if (kind.namespace !== "features" && kind.namespace !== "segments") {
        throw "Invalid namespace";
      }
      const get = async () => {
        const data = await ctx.runQuery(launchdarklyComponent.store.get, {
          kind: kind.namespace as "features" | "segments",
          key,
        });
        callback(data.config);
      };
      get();
    },
    init: function (): void {
      throw new Error("Function not implemented.");
    },
    delete: function (): void {
      throw new Error("Function not implemented.");
    },
    upsert: function (): void {
      throw new Error("Function not implemented.");
    },
    initialized: function (callback: (isInitialized: boolean) => void): void {
      callback(true);
    },
    close: function (): void {
      console.debug("LaunchDarkly: You do not need to call close() in Convex.");
    },
  };
}
