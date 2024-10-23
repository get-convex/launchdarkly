import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const store = internalMutation({
  args: { sdkKey: v.string() },
  handler: async (ctx, { sdkKey }) => {
    const existing = await ctx.db.query("sdkKeys").first();
    if (existing) {
      throw new Error(
        'An sdkKey already exists. Run the "replace" function instead of "store" to update your SDK key.'
      );
    }
    await ctx.db.insert("sdkKeys", {
      key: sdkKey,
    });
    console.log("SDK key stored.");
  },
});

export const replace = internalMutation({
  args: { sdkKey: v.string() },
  handler: async (ctx, { sdkKey }) => {
    const existing = await ctx.db.query("sdkKeys").first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    await ctx.db.insert("sdkKeys", {
      key: sdkKey,
    });
    console.log("SDK key replaced.");
  },
});

export const get = internalQuery({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("sdkKeys").first();
    return existing ? existing.key : null;
  },
});
