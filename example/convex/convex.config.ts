import { defineApp } from "convex/server";
import launchdarkly from "launchdarkly-component/convex.config.js";

const app = defineApp();

app.use(launchdarkly);

export default app;
