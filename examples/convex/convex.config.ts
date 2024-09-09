import { defineApp } from "convex/server";
import launchdarkly from "../../launchdarkly/convex.config";

const app = defineApp();

app.use(launchdarkly, {
  name: "first-project",
});

app.use(launchdarkly, {
  name: "second-project",
});

export default app;
