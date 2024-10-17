import { AnyDataModel, GenericActionCtx, HttpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Mounts } from "./_generated/api";

export const registerRoutes = (
  component: Mounts,
  http: HttpRouter,
  path = "/ld/webhook"
) => {
  const receiveUpdate = httpAction(async (ctx, req) => {
    const validateHeaderResult = await validateHeader(req, ctx, component);
    if (validateHeaderResult) {
      return validateHeaderResult;
    }
    const body = await req.text();
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
  component: Mounts
) => {
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
