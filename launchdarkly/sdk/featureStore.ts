import {
  LDFeatureStoreDataStorage,
  type LDFeatureStore,
} from "@launchdarkly/node-server-sdk";
import {
  AnyDataModel,
  FunctionReference,
  GenericQueryCtx,
} from "convex/server";

export function featureStore(
  rootKey: string,
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
): LDFeatureStore {
  return {
    all: function (kind, callback): void {
      if (kind.namespace !== "features" && kind.namespace !== "segments") {
        throw "Invalid namespace";
      }
      const getAll = async () => {
        const data = await ctx.runQuery(launchdarklyComponent.store.get, {
          rootKey,
        });
        callback(data[kind.namespace === "features" ? "flags" : "segments"]);
      };
      getAll();
    },
    get: function (kind, key, callback): void {
      if (kind.namespace !== "flags" && kind.namespace !== "segments") {
        throw "Invalid namespace";
      }
      const get = async () => {
        this.all(kind, (data) => {
          callback(data[key]);
        });
      };
      get();
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(_allData: LDFeatureStoreDataStorage, callback: () => void): void {
      callback();
    },
    delete: function (): void {},
    upsert: function (): void {},
    close: function (): void {},
    initialized: function (callback: (isInitialized: boolean) => void): void {
      callback(true);
    },
    getDescription(): string {
      return "Convex Feature Store";
    },
  };
}
