import { v } from "convex/values";
import { app, internalMutation } from "../_generated/server";

export default internalMutation({
  args: {
    features: v.any(),
    segments: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(app.launchdarkly.store.store, args);
  },
});
