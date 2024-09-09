import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { GenericMutationCtx } from "convex/server";
import { DataModel } from "./_generated/dataModel";
import { LDFeatureStoreKindData } from "@launchdarkly/js-server-sdk-common-edge";

export const get = query({
  args: {
    kind: v.union(v.literal("flags"), v.literal("segments")),
    key: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { kind, key }) => {
    const item = await ctx.db
      .query("payloads")
      .withIndex("kind_key", (q) => q.eq("kind", kind).eq("key", key))
      .first();
    if (!item) {
      return null;
    }
    return item.payload;
  },
});

export const getAll = query({
  args: {
    kind: v.union(v.literal("flags"), v.literal("segments")),
  },
  returns: v.array(v.string()),
  handler: async (ctx, { kind }) => {
    const items = await ctx.db
      .query("payloads")
      .withIndex("kind_key", (q) => q.eq("kind", kind))
      .collect();
    return items.map((i) => i.payload);
  },
});

export const write = mutation({
  args: {
    payload: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { payload }) => {
    const { flags, segments } = JSON.parse(payload);
    Promise.all([
      upsertItems(ctx, "flags", flags),
      upsertItems(ctx, "segments", segments),
    ]);
  },
});

async function upsertItems(
  ctx: GenericMutationCtx<DataModel>,
  kind: "flags" | "segments",
  items: LDFeatureStoreKindData
) {
  const existingItems = await ctx.db
    .query("payloads")
    .withIndex("kind_key", (q) => q.eq("kind", kind))
    .collect();

  const existingKeys = new Set(existingItems.map((i) => i.key));

  for (const item of Object.values(items)) {
    existingKeys.delete(item.key);
    const existingItem = existingItems.find((i) => i.key === item.key);
    const newItem = {
      key: item.key,
      kind,
      version: item.version,
      payload: JSON.stringify(item),
    };

    if (existingItem) {
      if ((existingItem.version || 0) < item.version) {
        console.debug(`Replacing item: ${kind} ${newItem.key}`);
        await ctx.db.replace(existingItem._id, newItem);
      }
      continue;
    }
    console.debug(`Inserting item: ${kind} ${newItem.key}`);
    await ctx.db.insert("payloads", newItem);
  }

  for (const key of existingKeys) {
    const existingItem = existingItems.find((i) => i.key === key);
    if (!existingItem) {
      console.error(`Item not found for deletion: ${kind} ${key}`);
      continue;
    }
    console.debug(`Deleting item: ${kind} ${key}`);
    await ctx.db.delete(existingItem._id);
  }
}
