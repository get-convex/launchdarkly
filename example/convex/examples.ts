import { LDClient } from "launchdarkly-component";
import { components, mutation, query } from "./_generated/server";

export const listFruits = query({
  handler: async (ctx) => {
    const launchdarkly = new LDClient(
      components.launchdarkly,
      ctx,
      process.env.LAUNCHDARKLY_SDK_KEY!
    );

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
    const launchdarkly = new LDClient(
      components.launchdarkly,
      ctx,
      process.env.LAUNCHDARKLY_SDK_KEY!
    );

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
