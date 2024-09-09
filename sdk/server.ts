import {
  customMutation,
  customQuery,
  customAction,
} from "convex-helpers/server/customFunctions";

import {
  query as q,
  mutation as m,
  action as a,
} from "../launchdarkly/_generated/server";
import { api } from "../launchdarkly/_generated/api";

import { init } from "./LDClient";

export const query = customQuery(q, {
  args: {},
  input: async (ctx) => {
    const launchdarkly = init({ ctx, store: api.store });
    return { ctx: { ...ctx, launchdarkly }, args: {} };
  },
});

export const mutation = customMutation(m, {
  args: {},
  input: async (ctx) => {
    const launchdarkly = init({ ctx, store: api.store });
    return { ctx: { ...ctx, launchdarkly }, args: {} };
  },
});

export const action = customAction(a, {
  args: {},
  input: async (ctx) => {
    const launchdarkly = init({ ctx, store: api.store });
    return { ctx: { ...ctx, launchdarkly }, args: {} };
  },
});
