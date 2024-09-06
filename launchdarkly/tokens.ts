import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const store = internalMutation({
  args: { token: v.string() },
  returns: v.string(),
  handler: async (ctx, { token }) => {
    const existingToken = await ctx.db.query("tokens").first();
    if (existingToken) {
      throw new Error(
        "A token already exists. Delete the existing token from the tokens table to generate a new one."
      );
    }
    ctx.db.insert("tokens", {
      token,
    });
    console.log(
      `Copy your token into the "Component API Token" field of the LaunchDarkly integration form.`
    );
    return token;
  },
});

export const validate = query({
  args: { token: v.optional(v.string()) },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, { token }) => {
    if (!token) {
      return {
        success: false,
        error: "Token not provided. Pass a token in the Authorization header.",
      };
    }
    const t = await ctx.db.query("tokens").first();
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
