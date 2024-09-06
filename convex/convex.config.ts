import { defineApp } from "convex/server";
import launchdarkly from "../launchdarkly/convex.config";

const app = defineApp();

app.use(launchdarkly);

export default app;
