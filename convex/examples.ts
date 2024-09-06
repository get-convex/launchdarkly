import { components, query } from "./_generated/server";
import { init } from "../sdk/LDClient";
export const listFlags = query({
  handler: async (ctx) => {
    const client = init({
      ctx,
      component: components.launchdarkly,
    });
    const res = await client.allFlagsState({ key: "component-user" });
    return res.allValues();
  },
});
