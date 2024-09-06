import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const result = await ctx.db.query("payloads").first();
    return result ? JSON.stringify(result.payload) : null;
  },
});

export const write = mutation({
  args: {
    payload: v.object({
      // TODO: v.record()
      flags: v.any(),
      segments: v.any(),
    }),
  },
  returns: v.null(),
  handler: async (ctx, { payload }) => {
    const existing = await ctx.db.query("payloads").first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    // TODO: Split this into multiple documents to avoid
    // reaching document size limits.
    await ctx.db.insert("payloads", { payload });
  },
});
