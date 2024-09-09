import { v } from "convex/values";
import { query } from "../sdk/server";

export const listFlags = query({
  args: { context: v.string() },
  handler: async (ctx, args) => {
    try {
      const context = JSON.parse(args.context);
      const res = await ctx.launchdarkly.allFlagsState(context);
      return { success: true, flags: res.allValues() };
    } catch (e: unknown) {
      console.error(e);
      return { success: false, error: "Invalid LaunchDarkly context." };
    }
  },
});
