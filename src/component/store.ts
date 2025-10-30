import { Infer, v } from "convex/values";
import { GenericMutationCtx } from "convex/server";
import { mutation, query, QueryCtx } from "./_generated/server";
import { DataModel } from "./_generated/dataModel";
import type { LDFeatureStoreKindData } from "@launchdarkly/js-server-sdk-common";

export const initialized = query({
  args: {},
  returns: v.boolean(),
  handler: initializedHandler,
});

export async function initializedHandler(ctx: QueryCtx): Promise<boolean> {
  return (await ctx.db.query("payloads").first()) !== null;
}

const vKind = v.union(v.literal("flags"), v.literal("segments"));

export const get = query({
  args: { kind: vKind, key: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: getHandler,
});

export async function getHandler(
  ctx: QueryCtx,
  { kind, key }: { kind: Infer<typeof vKind>; key: string }
): Promise<string | null> {
  const item = await ctx.db
    .query("payloads")
    .withIndex("kind_key", (q) => q.eq("kind", kind).eq("key", key))
    .first();
  if (!item) {
    return null;
  }
  return item.payload;
}

export const getAll = query({
  args: v.object({ kind: vKind }),
  returns: v.array(v.string()),
  handler: getAllHandler,
});

export async function getAllHandler(
  ctx: QueryCtx,
  { kind }: { kind: Infer<typeof vKind> }
): Promise<string[]> {
  const items = await ctx.db
    .query("payloads")
    .withIndex("kind_key", (q) => q.eq("kind", kind))
    .collect();
  return items.map((i) => i.payload);
}

export const write = mutation({
  args: {
    payload: v.string(),
  },
  returns: v.null(),
  handler: writeHandler,
});

export async function writeHandler(
  ctx: GenericMutationCtx<DataModel>,
  { payload }: { payload: string }
) {
  const { flags, segments } = JSON.parse(payload);
  await Promise.all([
    upsertItems(ctx, "flags", flags),
    upsertItems(ctx, "segments", segments),
  ]);
}

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
