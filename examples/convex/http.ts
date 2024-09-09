import { httpRouter } from "convex/server";
import { registerRoutes } from "launchdarkly-component";
import { components } from "./_generated/server";

const http = httpRouter();

registerRoutes(components.launchdarkly, http);

export default http;
