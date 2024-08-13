import { httpRouter } from "convex/server";
import webhook from "./webhook";

const http = httpRouter();

http.route({
  path: "/webhook",
  method: "POST",
  handler: webhook,
});

// Convex expects the router to be the default export of `convex/http.js`.
export default http;
