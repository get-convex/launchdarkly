import { components, query } from "./_generated/server";
import { init } from "../../sdk/LDClient";
import { v } from "convex/values";

export const listFlags = query({
  args: { context: v.string() },
  handler: async (ctx, args) => {
    const client = init({
      ctx,
      store: components.launchdarkly.store,
    });
    try {
      const context = JSON.parse(args.context);
      // This first request queries the data store
      console.log((await client.allFlagsState(context)).allValues());

      // This second request queries the in-memory cache.
      const res = await client.allFlagsState(context);
      return { success: true, flags: res.allValues() };
    } catch (e: unknown) {
      console.error(e);
      return { success: false, error: "Invalid LaunchDarkly context." };
    }
  },
});
