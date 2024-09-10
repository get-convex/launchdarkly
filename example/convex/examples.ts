import { v } from "convex/values";
import { withLaunchDarkly } from "launchdarkly-component";
import { components } from "./_generated/server";

const { query, mutation } = withLaunchDarkly(
  components.launchdarkly,
  process.env.LAUNCHDARKLY_SDK_KEY!
);

export const listFlags = query({
  args: { context: v.string() },
  handler: async (ctx, args) => {
    try {
      const context = JSON.parse(args.context);
      // This first request queries the data store
      console.log((await ctx.launchdarkly.allFlagsState(context)).allValues());

      // This second request queries the in-memory cache.
      const res = await ctx.launchdarkly.allFlagsState(context);
      return { success: true, flags: res.allValues() };
    } catch (e: unknown) {
      console.error(e);
      return { success: false, error: "Invalid LaunchDarkly context." };
    }
  },
});

export const listFlagsMutation = mutation({
  args: { context: v.string() },
  handler: async (ctx, args) => {
    try {
      const context = JSON.parse(args.context);
      // This first request queries the data store
      console.log((await ctx.launchdarkly.allFlagsState(context)).allValues());

      // This second request queries the in-memory cache.
      const res = await ctx.launchdarkly.allFlagsState(context);
      return { success: true, flags: res.allValues() };
    } catch (e: unknown) {
      console.error(e);
      return { success: false, error: "Invalid LaunchDarkly context." };
    }
  },
});
