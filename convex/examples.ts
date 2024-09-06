import { components, query } from "./_generated/server";
import { init } from "../sdk/LDClient";
import { v } from "convex/values";
export const listFlags = query({
  args: { context: v.string() },
  handler: async (ctx, args) => {
    const client = init({
      ctx,
      store: components.launchdarkly.store,
    });
    try {
      const res = await client.allFlagsState(JSON.parse(args.context));
      return { success: true, flags: res.allValues() };
    } catch (e) {
      return { success: false, error: "Invalid LaunchDarkly context." };
    }
  },
});
