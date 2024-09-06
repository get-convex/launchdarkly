// @snippet start router
import { httpRouter } from "convex/server";
import { components, httpAction } from "./_generated/server";
import { buildRootKey } from "@launchdarkly/akamai-edgeworker-sdk-common/dist/featureStore/index";

const http = httpRouter();

const receiveUpdate = httpAction(async (ctx, req) => {
  const auth = req.headers.get("Authorization");
  const token = auth?.split("Bearer ")[1];
  const res = await ctx.runQuery(components.launchdarkly.webhook.validate, {
    token: token,
  });
  if (!res.success) {
    return new Response(
      JSON.stringify({ errors: res.error ? [res.error] : [] }),
      { status: 401 }
    );
  }

  const body = await req.json();
  await ctx.runMutation(components.launchdarkly.store.store, {
    key: buildRootKey("_"),
    payload: body,
  });

  return new Response(null, { status: 200 });
});

http.route({
  path: "/ld/webhook",
  method: "PUT",
  handler: receiveUpdate,
});

const validate = httpAction(async (ctx, req) => {
  const auth = req.headers.get("Authorization");
  const token = auth?.split("Bearer ")[1];
  console.log(req.headers);
  const res = await ctx.runQuery(components.launchdarkly.webhook.validate, {
    sdkKey: "_",
    token: token,
  });

  if (!res.success) {
    return new Response(
      JSON.stringify({ errors: res.error ? [res.error] : [] }),
      { status: 401 }
    );
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
});

// Define additional routes
http.route({
  path: "/ld/webhook",
  method: "GET",
  handler: validate,
});

export default http;
