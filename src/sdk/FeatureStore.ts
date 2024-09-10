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
import { LaunchDarklyStore } from "./LDClient";
import { RunQueryCtx } from "../component/typeHelpers";

export class FeatureStore implements LDFeatureStore {
  private gotAllFlags = false;
  private gotAllSegments = false;
  private readonly cache: {
    flags: LDFeatureStoreKindData;
    segments: LDFeatureStoreKindData;
  } = {
    flags: {},
    segments: {},
  };

  constructor(
    private readonly ctx: RunQueryCtx,
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

    if (!(await this.ctx.runQuery(this.store.initialized))) {
      this.logger.error(
        "The LaunchDarkly data store has not been initialized. Is your integration configuration correct?"
      );
    }

    if (this.cache[kindKey][dataKey]) {
      this.logger.debug(`Retrieving ${dataKey} from ${kindKey} cache`);
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

    if (!(await this.ctx.runQuery(this.store.initialized))) {
      this.logger.error(
        "The LaunchDarkly data store has not been initialized. Is your integration configuration correct?"
      );
    }

    if (kindKey === "flags" ? this.gotAllFlags : this.gotAllSegments) {
      this.logger.debug(`Retrieving all from ${kindKey} cache`);
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
      if (kindKey === "flags") {
        this.gotAllFlags = true;
      } else {
        this.gotAllSegments = true;
      }

      callback(reduced);
    } catch (err: unknown) {
      this.logger.error(err);
      callback({});
    }
  }

  async initialized(
    callback: (isInitialized: boolean) => void = noop
  ): Promise<void> {
    const initialized = await this.ctx.runQuery(this.store.initialized);
    callback(initialized);
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
