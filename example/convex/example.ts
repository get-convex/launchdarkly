import { LaunchDarkly } from "@convex-dev/launchdarkly";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";

export const listFruits = query({
  handler: async (ctx) => {
    const launchdarkly = new LaunchDarkly(components.launchdarkly, ctx);
    const user = { key: "myUserId" };

    const showFruits = await launchdarkly.boolVariation(
      "can-show-fruits",
      user,
      true
    );
    if (!showFruits) {
      return [];
    }
    return await ctx.db.query("fruits").collect();
  },
});

export const buyFruit = mutation({
  handler: async (ctx) => {
    const launchdarkly = new LaunchDarkly(components.launchdarkly, ctx);

    const user = { key: "myUserId" };

    const showFruits = await launchdarkly.boolVariation(
      "can-buy-fruits",
      user,
      false
    );
    if (!showFruits) {
      return {
        error:
          "You can't buy fruits! Turn on the can-buy-fruits feature flag to enable this feature.",
      };
    }

    launchdarkly.track("buy-fruit", user);
  },
});

export const initialized = query({
  args: {},
  handler: async (ctx) => {
    if (!process.env.LAUNCHDARKLY_SDK_KEY) {
      return false;
    }
    const launchdarkly = new LaunchDarkly(components.launchdarkly, ctx);
    return (
      (await launchdarkly.allFlagsState({ key: "any" })).allValues()[
        "can-buy-fruits"
      ] !== undefined
    );
  },
});

export const seedData = mutation({
  handler: async (ctx) => {
    await ctx.db.insert("fruits", { name: "Apple", emoji: "🍎" });
    await ctx.db.insert("fruits", { name: "Banana", emoji: "🍌" });
    await ctx.db.insert("fruits", { name: "Cherry", emoji: "🍒" });
  },
});
