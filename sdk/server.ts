import { v } from "convex/values";
import {
  customMutation,
  customQuery,
  customAction,
} from "convex-helpers/server/customFunctions";

import {
  query as q,
  mutation as m,
  action as a,
  GenericCtx,
} from "../launchdarkly/_generated/server";
import { api } from "../launchdarkly/_generated/api";

import { init } from "./LDClient";

const args = {
  // Only necessary if using secureModeHash.
  // The Convex LDClient otherwise disregards the sdkKey.
  sdkKey: v.optional(v.string()),
  // Application options object to be passed to the LaunchDarkly SDK.
  application: v.optional(
    v.object({
      id: v.optional(v.string()),
      version: v.optional(v.string()),
      name: v.optional(v.string()),
      versionName: v.optional(v.string()),
    })
  ),
};

const input = async (ctx: GenericCtx) => {
  const launchdarkly = init({ ctx, store: api.store });
  return { ctx: { ...ctx, launchdarkly }, args: {} };
};

export const query = customQuery(q, {
  args,
  input,
});

export const mutation = customMutation(m, {
  args,
  input,
});

export const action = customAction(a, {
  args,
  input,
});
