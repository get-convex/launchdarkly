import { httpRouter } from "convex/server";
import { initializeHttp } from "launchdarkly-component";
import { components } from "./_generated/server";

const http = httpRouter();

initializeHttp(components.launchdarkly, http);

export default http;
