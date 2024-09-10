import {
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
