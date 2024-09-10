import {
  customMutation,
  customQuery,
  customAction,
} from "convex-helpers/server/customFunctions";

import { query, mutation, action } from "../component/_generated/server";

import { init, LaunchDarklyComponent } from "./LDClient";
import { RunMutationCtx, RunQueryCtx } from "../component/typeHelpers";

const input =
  (component: LaunchDarklyComponent, sdkKey: string) =>
  async (ctx: RunQueryCtx | RunMutationCtx) => {
    const isMutation = "runMutation" in ctx;
    const launchdarkly = init(
      isMutation
        ? {
            ctx,
            component,
            sdkKey,
            sendEvents: true,
          }
        : {
            ctx,
            component,
            sdkKey,
            sendEvents: false,
          }
    );
    const contextWithLd = {
      ...ctx,
      launchdarkly,
    };
    return { ctx: contextWithLd, args: {} };
  };

export function withLaunchDarkly(
  component: LaunchDarklyComponent,
  sdkKey: string,
  customFunctions = { query, mutation, action }
) {
  const i = input(component, sdkKey);
  const mod = {
    args: {},
    input: i,
  };

  return {
    query: customQuery(customFunctions.query, mod),
    mutation: customMutation(customFunctions.mutation, mod),
    action: customAction(customFunctions.action, mod),
  };
}
