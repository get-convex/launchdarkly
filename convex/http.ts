import { httpRouter } from "convex/server";
import { initializeHttp } from "../launchdarkly/initializeHttp";

const http = httpRouter();

initializeHttp(http);

export default http;
