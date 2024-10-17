import { LaunchDarkly } from "@convex-dev/launchdarkly";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";

export const listFruits = query({
  handler: async (ctx) => {
    const launchdarkly = new LaunchDarkly(components.launchdarkly, ctx);

    const showFruits = await launchdarkly.boolVariation(
      "show-fruits",
      { key: "user" },
      false
    );

    if (!showFruits) {
      return [];
    }

    return (await ctx.db.query("fruits").collect()).map((f) => f.name);
  },
});

export const buyFruit = mutation({
  handler: async (ctx) => {
    const launchdarkly = new LaunchDarkly(components.launchdarkly, ctx);

    const user = { key: "user" };

    const showFruits = await launchdarkly.boolVariation(
      "show-fruits",
      user,
      false
    );
    if (!showFruits) {
      throw new Error("You can't buy fruits!");
    }

    launchdarkly.track("buy-fruit", user);
  },
});
