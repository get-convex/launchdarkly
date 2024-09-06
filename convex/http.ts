import { httpRouter } from "convex/server";
import { initializeHttp } from "../launchdarkly/initializeHttp";
import { components } from "./_generated/server";

const http = httpRouter();

initializeHttp(components.launchdarkly, http);

export default http;
