import { defineApp } from "convex/server";
import launchdarkly from "launchdarkly-component";

const app = defineApp();

app.use(launchdarkly);

export default app;
