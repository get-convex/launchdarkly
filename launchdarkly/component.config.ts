import { defineComponent } from "convex/server";
import { v } from "convex/values";

export default defineComponent("launchdarkly", {
  args: {
    SDK_KEY: v.string(),
  },
});
