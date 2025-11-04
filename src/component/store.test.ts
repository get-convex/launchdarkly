import { describe, expect, test } from "vitest";
import { convexTest } from "convex-test";
import { modules } from "./setup.test.js";
import schema from "./schema";
import {
  getHandler as get,
  getAllHandler as getAll,
  initializedHandler as initialized,
  writeHandler as write,
} from "./store";

const sampleFlagData = {
  key: "flag1",
  on: true,
  prerequisites: [],
  targets: [],
  contextTargets: [],
  rules: [],
  fallthrough: { variation: 0 },
  offVariation: 1,
  variations: [true, false],
  clientSideAvailability: {
    usingMobileKey: false,
    usingEnvironmentId: false,
  },
  clientSide: false,
  salt: "aacee0e3f16c44418331ee4c02be5956",
  trackEvents: false,
  trackEventsFallthrough: false,
  debugEventsUntilDate: null,
  version: 1,
  deleted: false,
};

const sampleData = {
  flags: {
    flag1: sampleFlagData,
    flag2: { ...sampleFlagData, key: "flag2" },
  },
  segments: {},
};

describe("store", () => {
  describe("initialized", () => {
    test("should initialize", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        expect(await initialized(ctx)).toBe(false);
        await write(ctx, {
          payload: JSON.stringify(sampleData),
        });
        expect(await initialized(ctx)).toBe(true);
      });
    });
  });

  describe("get", () => {
    test("should get a flag", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        expect(await get(ctx, { kind: "flags", key: "flag1" })).toBe(null);
        await write(ctx, {
          payload: JSON.stringify(sampleData),
        });
        expect(await get(ctx, { kind: "flags", key: "flag1" })).toBe(
          JSON.stringify(sampleData.flags.flag1),
        );
      });
    });
  });

  describe("getAll", () => {
    test("should get all flags", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        expect(await getAll(ctx, { kind: "flags" })).toEqual([]);
        await write(ctx, {
          payload: JSON.stringify(sampleData),
        });
        expect(await getAll(ctx, { kind: "flags" })).toEqual(
          Object.values(sampleData.flags).map((flag) => JSON.stringify(flag)),
        );
      });
    });
  });

  describe("write", () => {
    test("should write data", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        await write(ctx, {
          payload: JSON.stringify(sampleData),
        });
        expect(await getAll(ctx, { kind: "flags" })).toEqual(
          Object.values(sampleData.flags).map((flag) => JSON.stringify(flag)),
        );
      });
    });
  });

  test("should delete removed flags", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await write(ctx, {
        payload: JSON.stringify(sampleData),
      });

      // flag2 was removed
      const updatedSampleData = {
        flags: {
          flag1: { ...sampleFlagData, key: "flag1" },
        },
        segments: {},
      };
      await write(ctx, {
        payload: JSON.stringify(updatedSampleData),
      });
      expect(await getAll(ctx, { kind: "flags" })).toEqual([
        JSON.stringify(updatedSampleData.flags.flag1),
      ]);
    });
  });

  test("should update flag if version is incremented", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await write(ctx, {
        payload: JSON.stringify(sampleData),
      });

      // flag1 version is incremented
      const updatedSampleData = {
        flags: {
          flag1: {
            ...sampleData.flags.flag1,
            key: "flag1",
            version: 2,
            on: !sampleData.flags.flag1.on,
          },
          flag2: sampleData.flags.flag2,
        },
        segments: {},
      };
      await write(ctx, {
        payload: JSON.stringify(updatedSampleData),
      });
      expect(await get(ctx, { kind: "flags", key: "flag1" })).toEqual(
        JSON.stringify(updatedSampleData.flags.flag1),
      );
    });
  });

  test("should not update flag if version is not incremented", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await write(ctx, {
        payload: JSON.stringify(sampleData),
      });

      // flag1 version is not incremented
      const updatedSampleData = {
        flags: {
          flag1: {
            ...sampleData.flags.flag1,
            key: "flag1",
            version: 1,
            on: !sampleData.flags.flag1.on,
          },
          flag2: sampleData.flags.flag2,
        },
        segments: {},
      };
      await write(ctx, {
        payload: JSON.stringify(updatedSampleData),
      });
      expect(await get(ctx, { kind: "flags", key: "flag1" })).toEqual(
        JSON.stringify(sampleData.flags.flag1),
      );
    });
  });
});
