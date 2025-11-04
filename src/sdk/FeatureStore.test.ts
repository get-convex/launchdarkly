import { describe, expect, test, vi } from "vitest";
import { FeatureStore } from "./FeatureStore";
import { convexTest } from "convex-test";
import schema from "../component/schema";
import { modules } from "../component/setup.test";
import { api } from "../component/_generated/api";
import * as store from "../component/store";

describe("FeatureStore", () => {
  describe("get", () => {
    test("invalid kind should throw an error", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        // @ts-expect-error It's ok
        const featureStore = new FeatureStore(ctx, api.store, console);
        const invalidKind = "invalidKind";

        await expect(
          featureStore.get({ namespace: invalidKind }, "someKey", vi.fn())
        ).rejects.toThrow(new Error(`Unsupported DataKind: ${invalidKind}`));
      });
    });

    test.each(["features", "segments"])(
      "get should return null when not initialized for kind %s",
      async (namespace) => {
        const t = convexTest(schema, modules);
        await t.run(async (ctx) => {
          // @ts-expect-error It's ok
          const featureStore = new FeatureStore(ctx, api.store, console);
          const k = {
            namespace: namespace,
          };
          const key = "nonExistingKey";
          const consoleSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

          await featureStore.get(k, key, (res) => {
            expect(res).toBeNull();
          });
          expect(consoleSpy).toHaveBeenCalledWith(
            "The LaunchDarkly data store has not been initialized. Is your integration configuration correct?"
          );
        });
      }
    );

    test.each(["features", "segments"])(
      "get should return cached value for kind %s",
      async (kind) => {
        const t = convexTest(schema, modules);
        await t.run(async (ctx) => {
          const config = { key: "existingKey", version: 1 };

          await store.writeHandler(ctx, {
            payload: JSON.stringify({
              flags: {
                [config.key]: config,
              },
              segments: {
                [config.key]: config,
              },
            }),
          });

          // @ts-expect-error It's ok
          const featureStore = new FeatureStore(ctx, api.store, console);
          const k = { namespace: kind };
          const key = config.key;

          const spy = spyOnQuery(store, "get");

          await featureStore.get(k, key, (res) => {
            expect(res).toEqual(config);
          });

          expect(spy).toHaveBeenCalledOnce();

          await featureStore.get(k, key, (res) => {
            expect(res).toEqual(config);
          });

          expect(spy).toHaveBeenCalledOnce(); // should not call get again
        });
      }
    );
  });

  describe("all", () => {
    test("invalid kind should throw an error", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        // @ts-expect-error It's ok
        const featureStore = new FeatureStore(ctx, api.store, console);
        const invalidKind = "invalidKind";

        await expect(
          featureStore.all({ namespace: invalidKind }, vi.fn())
        ).rejects.toThrow(new Error(`Unsupported DataKind: ${invalidKind}`));
      });
    });

    test.each(["features", "segments"])(
      "all should return empty object when not initialized for kind %s",
      async (kind) => {
        const t = convexTest(schema, modules);
        await t.run(async (ctx) => {
          // @ts-expect-error It's ok
          const featureStore = new FeatureStore(ctx, api.store, console);
          const k = { namespace: kind };

          await featureStore.all(k, (res) => {
            expect(res).toEqual({});
          });
        });
      }
    );

    test.each(["features", "segments"])(
      "all should return cached values for kind %s",
      async (kind) => {
        const t = convexTest(schema, modules);
        await t.run(async (ctx) => {
          const config = { key: "existingKey", version: 1 };

          await store.writeHandler(ctx, {
            payload: JSON.stringify({
              flags: {
                [config.key]: config,
              },
              segments: {
                [config.key]: config,
              },
            }),
          });

          // @ts-expect-error It's ok
          const featureStore = new FeatureStore(ctx, api.store, console);
          const k = { namespace: kind };

          const getAllSpy = spyOnQuery(store, "getAll");

          await featureStore.all(k, (res) => {
            expect(res).toEqual({ [config.key]: config });
          });

          expect(getAllSpy).toHaveBeenCalledOnce();

          await featureStore.all(k, (res) => {
            expect(res).toEqual({ [config.key]: config });
          });

          expect(getAllSpy).toHaveBeenCalledOnce(); // should not call getAll again

          const getSpy = spyOnQuery(store, "get");

          await featureStore.get(k, config.key, (res) => {
            expect(res).toEqual(config);
          });

          expect(getSpy).toHaveBeenCalledTimes(0); // should not call get because getAll was already called
        });
      }
    );
  });
});

function spyOnQuery(api: any, method: string) {
  const spy = vi.spyOn(api, method);
  // @ts-expect-error It's a query ;)
  spy.isQuery = true;
  // @ts-expect-error Ignore validators
  spy.exportArgs = () => "{}";
  return spy;
}
