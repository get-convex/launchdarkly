import { components, query } from "./_generated/server";
import { init } from "../launchdarkly/sdk/LDClient";
export const listFlags = query({
  handler: async (ctx) => {
    const client = init({
      sdkKey: "_",
      ctx,
      launchdarklyComponent: components.launchdarkly,
    });
    const res = await client.allFlagsState({ key: "component-user" });
    return res.allValues();
  },
});
