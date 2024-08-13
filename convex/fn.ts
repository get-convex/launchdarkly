import { app, query } from "./_generated/server";
import { LDClient } from "../launchdarkly/sdk/LDClient";

export const listFlags = query({
  handler: async (ctx) => {
    const client = new LDClient(ctx, app.launchdarkly);
    const flags = (
      await client.allFlagsState({ key: "component-user" })
    ).allValues();
    return flags;
  },
});
