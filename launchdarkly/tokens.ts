import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const generate = internalMutation({
  args: {
    sdkKey: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, { sdkKey }) => {
    const existingToken = await ctx.db
      .query("tokens")
      .filter((q) => q.eq(q.field("sdkKey"), sdkKey))
      .first();
    if (existingToken) {
      throw new Error(
        "Token already exists for this SDK key. Delete the existing token from the tokens table to generate a new one."
      );
    }
    // TODO: Generate a token
    const token = "mySecretToken";
    ctx.db.insert("tokens", {
      sdkKey,
      token,
    });
    console.log(
      "Copy this token into the 'Component API Token' field of the LaunchDarkly integration form."
    );
    return token;
  },
});
