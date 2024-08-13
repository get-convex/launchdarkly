import { defineApp } from "convex/server";
import launchdarkly from "../launchdarkly/component.config";

const app = defineApp();

const ld = app.install(launchdarkly, {
  args: { SDK_KEY: process.env.LAUNCHDARKLY_SDK_KEY },
});
app.mountHttp("/ld/", ld);

export default app;
