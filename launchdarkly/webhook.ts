import { v } from "convex/values";
import { query } from "./_generated/server";

export const validate = query({
  args: { token: v.optional(v.string()), sdkKey: v.optional(v.string()) },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, { token, sdkKey }) => {
    if (!sdkKey) {
      return {
        success: false,
        error: "SDK key not provided. Pass an SDK key in the request body.",
      };
    }
    if (!token) {
      return {
        success: false,
        error: "Token not provided. Pass a token in the Authorization header.",
      };
    }
    const t = await ctx.db
      .query("tokens")
      .filter((q) => q.eq(q.field("sdkKey"), sdkKey))
      .first();
    if (!t) {
      return {
        success: false,
        error:
          "Token not found. Run the tokens:generate function to create a token.",
      };
    }
    return { success: t?.token === token };
  },
});
