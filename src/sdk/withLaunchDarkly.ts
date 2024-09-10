import {
  customMutation,
  customQuery,
  customAction,
} from "convex-helpers/server/customFunctions";

import { query, mutation, action } from "../component/_generated/server";

import { BaseSDKParams, LDClient } from "./LDClient";
import {
  LaunchDarklyComponent,
  RunMutationCtx,
  RunQueryCtx,
} from "../component/types";

const input =
  (
    component: LaunchDarklyComponent,
    sdkKey: string,
    options?: BaseSDKParams["options"]
  ) =>
  async (ctx: RunQueryCtx | RunMutationCtx) => {
    const isMutation = "runMutation" in ctx;
    const launchdarkly = new LDClient(
      isMutation
        ? {
            ctx,
            component,
            sdkKey,
            options,
            sendEvents: true,
          }
        : {
            ctx,
            component,
            sdkKey,
            options,
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
  options?: BaseSDKParams["options"]
) {
  const i = input(component, sdkKey, options);
  const mod = {
    args: {},
    input: i,
  };

  return {
    query: customQuery(query, mod),
    mutation: customMutation(mutation, mod),
    action: customAction(action, mod),
  };
}
