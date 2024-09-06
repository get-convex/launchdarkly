import { AnyDataModel, GenericActionCtx, HttpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { LaunchDarklyComponent } from "../sdk/LDClient";

export const initializeHttp = (
  component: LaunchDarklyComponent,
  http: HttpRouter,
  path = "/ld/webhook"
) => {
  const receiveUpdate = httpAction(async (ctx, req) => {
    const validateHeaderResult = await validateHeader(req, ctx, component);
    if (validateHeaderResult) {
      return validateHeaderResult;
    }
    const body = await req.json();
    await ctx.runMutation(component.store.write, {
      payload: body,
    });

    return new Response(null, { status: 200 });
  });

  const validate = httpAction(async (ctx, req) => {
    const validateHeaderResult = await validateHeader(req, ctx, component);
    if (validateHeaderResult) {
      return validateHeaderResult;
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  });

  http.route({
    path,
    method: "GET",
    handler: validate,
  });

  http.route({
    path,
    method: "PUT",
    handler: receiveUpdate,
  });
};

const validateHeader = async (
  req: Request,
  ctx: GenericActionCtx<AnyDataModel>,
  component: LaunchDarklyComponent
) => {
  // TODO: Replace with hmac signature in X-LD-Signature
  const auth = req.headers.get("Authorization");
  const token = auth?.split("Bearer ")[1];
  const res = await ctx.runQuery(component.tokens.validate, {
    token,
  });
  if (!res.success) {
    return new Response(
      JSON.stringify({ errors: res.error ? [res.error] : [] }),
      { status: 401 }
    );
  }
};
