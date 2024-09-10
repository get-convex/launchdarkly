import { defineApp } from "convex/server";
// import launchdarkly from "launchdarkly-component/convex.config.js";
import launchdarkly from "../../src/component/convex.config";

const app = defineApp();

// TODO: Remove name once next alpha is out
app.use(launchdarkly, { name: "launchdarkly" });

export default app;
