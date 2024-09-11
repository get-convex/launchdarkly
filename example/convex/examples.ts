import { v } from "convex/values";
import { LDClient } from "launchdarkly-component";
import { components, query } from "./_generated/server";

export const listFlags = query({
  args: { context: v.string() },
  handler: async (ctx, args) => {
    const launchdarkly = new LDClient(components.launchdarkly, ctx);

    try {
      const context = JSON.parse(args.context);
      // This first request queries the data store
      console.log((await launchdarkly.allFlagsState(context)).allValues());

      // This second request queries the in-memory cache.
      const res = await launchdarkly.allFlagsState(context);
      return { success: true, flags: res.allValues() };
    } catch (e: unknown) {
      console.error(e);
      return { success: false, error: "Invalid LaunchDarkly context." };
    }
  },
});
