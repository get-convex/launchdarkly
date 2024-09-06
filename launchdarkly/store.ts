import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {
    rootKey: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("payloads")
      .withIndex("key", (q) => q.eq("key", args.rootKey))
      .first();
    return result ? JSON.stringify(result.payload) : null;
  },
});

export const store = mutation({
  args: {
    key: v.string(),
    payload: v.object({
      // TODO: v.record()
      flags: v.any(),
      segments: v.any(),
    }),
  },
  returns: v.null(),
  handler: async (ctx, { key, payload }) => {
    const existing = await ctx.db
      .query("payloads")
      .withIndex("key", (q) => q.eq("key", key))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    await ctx.db.insert("payloads", { key, payload });
  },
});
