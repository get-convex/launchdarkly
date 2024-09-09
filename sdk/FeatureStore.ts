import type {
  DataKind,
  LDFeatureStore,
  LDFeatureStoreDataStorage,
  LDFeatureStoreItem,
  LDFeatureStoreKindData,
  LDLogger,
} from "@launchdarkly/js-server-sdk-common";
import { noop } from "@launchdarkly/js-server-sdk-common";
import serialization from "@launchdarkly/js-server-sdk-common/dist/store/serialization";
import { GenericQueryCtx, AnyDataModel } from "convex/server";
import { LaunchDarklyStore } from "./LDClient";

export class FeatureStore implements LDFeatureStore {
  private readonly cache: {
    flags: LDFeatureStoreKindData;
    segments: LDFeatureStoreKindData;
  } = {
    flags: {},
    segments: {},
  };

  constructor(
    private readonly ctx: GenericQueryCtx<AnyDataModel>,
    private readonly store: LaunchDarklyStore,
    private readonly description: string,
    private logger: LDLogger
  ) {}

  async get(
    kind: DataKind,
    dataKey: string,
    callback: (res: LDFeatureStoreItem | null) => void
  ): Promise<void> {
    const { namespace } = kind;
    const kindKey = namespace === "features" ? "flags" : namespace;

    if (kindKey !== "flags" && kindKey !== "segments") {
      throw new Error(`Unsupported DataKind: ${namespace}`);
    }

    if (this.cache[kindKey] && this.cache[kindKey][dataKey]) {
      callback(this.cache[kindKey][dataKey]);
      return;
    }

    this.logger.debug(`Requesting ${dataKey} from ${kindKey}`);

    try {
      const i = await this.ctx.runQuery(this.store.get, {
        kind: kindKey,
        key: dataKey,
      });

      const deserialized = deserialize(kindKey, i);
      this.cache[kindKey][dataKey] = deserialized;

      callback(deserialized);
    } catch (err) {
      this.logger.error(err);
      callback(null);
    }
  }

  async all(
    kind: DataKind,
    callback: (res: LDFeatureStoreKindData) => void = noop
  ): Promise<void> {
    const { namespace } = kind;
    const kindKey = namespace === "features" ? "flags" : namespace;

    if (kindKey !== "flags" && kindKey !== "segments") {
      throw new Error(`Unsupported DataKind: ${namespace}`);
    }

    if (this.cache[kindKey]) {
      callback(this.cache[kindKey]);
      return;
    }

    this.logger.debug(`Requesting all from ${kindKey}`);
    try {
      const i = await this.ctx.runQuery(this.store.getAll, {
        kind: kindKey,
      });
      if (!i) {
        throw new Error(`${kindKey} is not found in KV.`);
      }

      const mapped = i.map((item) => deserialize(kindKey, item));
      const reduced = mapped.reduce((acc, item) => {
        acc[item.key] = item;
        return acc;
      }, {} as LDFeatureStoreKindData);

      this.cache[kindKey] = reduced;

      callback(reduced);
    } catch (err: unknown) {
      this.logger.error(err);
      callback({});
    }
  }

  async initialized(
    callback: (isInitialized: boolean) => void = noop
  ): Promise<void> {
    callback(true);
  }

  init(_: LDFeatureStoreDataStorage, callback: () => void): void {
    callback();
  }

  getDescription(): string {
    return this.description;
  }

  // unused
  close = noop;

  delete = noop;

  upsert = noop;
}

const deserialize = (
  kindKey: "flags" | "segments",
  item: string | null
): LDFeatureStoreItem => {
  if (kindKey !== "flags" && kindKey !== "segments") {
    throw new Error(`Unsupported DataKind: ${kindKey}`);
  }

  if (item === null) {
    throw new Error(`Item is null`);
  }

  const deserialize =
    kindKey === "flags"
      ? // @ts-expect-error Using internals
        serialization.deserializeFlag
      : // @ts-expect-error Using internals
        serialization.deserializeSegment;

  return deserialize(item);
};