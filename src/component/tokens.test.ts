import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import schema from "./schema";
import { modules } from "./setup.test";
import { storeHandler as store, validateHandler as validate } from "./tokens";

describe("tokens", () => {
  describe("generate", () => {
    test("should store a token", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        const token = await store(ctx, { token: "some-token" });
        expect(token).toBe("some-token");

        const storedToken = await ctx.db.query("tokens").first();
        expect(storedToken?.token).toEqual("some-token");

        // Attempt to store a second token
        await expect(
          async () => await store(ctx, { token: "another-token" })
        ).rejects.toThrowError(/A token already exists/);
      });
    });
  });

  describe("validate", () => {
    test("should return an error for an undefined token", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        const result = await validate(ctx, { token: undefined });
        expect(result.success).toBe(false);
        expect(result.error).toBe(
          "Token not provided. Pass a token in the Authorization header."
        );
      });
    });

    test("should return an error for a non-existent token", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        const result = await validate(ctx, { token: "non-existent-token" });
        expect(result.success).toBe(false);
        expect(result.error).toBe(
          "Token not found. Run the tokens:generate function to create a token."
        );
      });
    });

    test("should return an error for an invalid token", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        await store(ctx, { token: "valid-token" });
        const result = await validate(ctx, { token: "invalid-token" });
        expect(result.success).toBe(false);
        expect(result.error).toBeUndefined();
      });
    });

    test("should validate a token", async () => {
      const t = convexTest(schema, modules);
      await t.run(async (ctx) => {
        await store(ctx, { token: "valid-token" });
        const result = await validate(ctx, { token: "valid-token" });
        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });
  });
});
