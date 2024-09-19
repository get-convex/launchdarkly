import {
  FunctionReference,
  GenericActionCtx,
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";

export type RunQueryCtx = {
  runQuery: GenericQueryCtx<GenericDataModel>["runQuery"];
};

export type RunMutationCtx = {
  runQuery: GenericQueryCtx<GenericDataModel>["runQuery"];
  runMutation: GenericMutationCtx<GenericDataModel>["runMutation"];
};

export type RunActionCtx = {
  runAction: GenericActionCtx<GenericDataModel>["runAction"];
};

export type LaunchDarklyComponent = {
  tokens: {
    validate: FunctionReference<"query", "internal", { token?: string }>;
  };
  store: LaunchDarklyStore;
  events: LaunchDarklyEventStore;
};

export type LaunchDarklyStore = {
  initialized: FunctionReference<
    "query",
    "internal",
    Record<string, never>,
    boolean
  >;

  get: FunctionReference<
    "query",
    "internal",
    { kind: string; key: string },
    string | null
  >;

  getAll: FunctionReference<"query", "internal", { kind: string }, string[]>;

  write: FunctionReference<
    "mutation",
    "internal",
    {
      payload: string;
    }
  >;
};

export type LaunchDarklyEventStore = {
  storeEvents: FunctionReference<
    "mutation",
    "internal",
    {
      payloads: string[];
      sdkKey: string;
    }
  >;
};
