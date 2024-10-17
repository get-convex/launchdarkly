import { defineApp } from "convex/server";
import launchdarkly from "@convex-dev/launchdarkly/convex.config";

const app = defineApp();

app.use(launchdarkly);

export default app;
