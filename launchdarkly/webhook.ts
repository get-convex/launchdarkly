import { httpAction } from "./_generated/server";

export default httpAction(async (ctx, request) => {
  // implementation will be here
  console.log(await request.json());
  return new Response();
});
