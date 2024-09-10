import { v } from "convex/values";
import { withLaunchDarkly, LDClient } from "launchdarkly-component";
import { components } from "./_generated/server";

const { query } = withLaunchDarkly(components.launchdarkly);

const listFlagsHandler = async (ld: LDClient, args: { context: string }) => {
  try {
    const context = JSON.parse(args.context);
    // This first request queries the data store
    console.log((await ld.allFlagsState(context)).allValues());

    // This second request queries the in-memory cache.
    const res = await ld.allFlagsState(context);
    return { success: true, flags: res.allValues() };
  } catch (e: unknown) {
    console.error(e);
    return { success: false, error: "Invalid LaunchDarkly context." };
  }
};

export const listFlags = query({
  args: { context: v.string() },
  handler: async (ctx, args) => listFlagsHandler(ctx.launchdarkly, args),
});
