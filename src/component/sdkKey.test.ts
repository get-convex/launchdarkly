import { convexTest } from "convex-test";
import { describe, test, expect } from "vitest";
import schema from "./schema";
import { modules } from "./setup.test";
import { get, replace, store } from "./sdkKey";

describe("sdkKey", () => {
  test("that it works", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      expect(await get(ctx, {})).toBe(null);
      await store(ctx, { sdkKey: "test-sdk-key" });
      expect(await get(ctx, {})).toBe("test-sdk-key");
      await expect(
        async () => await store(ctx, { sdkKey: "test-sdk-key-2" })
      ).rejects.toThrowError(/An sdkKey already exists/);
      expect(await get(ctx, {})).toBe("test-sdk-key");

      await replace(ctx, { sdkKey: "test-sdk-key-2" });
      expect(await get(ctx, {})).toBe("test-sdk-key-2");
    });
  });
});
