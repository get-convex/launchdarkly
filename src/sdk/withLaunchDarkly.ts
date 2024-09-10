import {
  customMutation,
  customQuery,
  customAction,
} from "convex-helpers/server/customFunctions";

import { query, mutation, action } from "../component/_generated/server";

import { init, LaunchDarklyComponent } from "./LDClient";
import { RunQueryCtx } from "../component/typeHelpers";

const input =
  (component: LaunchDarklyComponent) => async (ctx: RunQueryCtx) => {
    const launchdarkly = init({
      ctx,
      store: component.store,
    });
    const contextWithLd = {
      ...ctx,
      launchdarkly,
    };
    return { ctx: contextWithLd, args: {} };
  };

export function withLaunchDarkly(
  component: LaunchDarklyComponent,
  customFunctions = { query, mutation, action }
) {
  const i = input(component);
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
