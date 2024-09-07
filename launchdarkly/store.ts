import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { GenericMutationCtx } from "convex/server";
import { DataModel } from "./_generated/dataModel";
import { LDFeatureStoreItem } from "@launchdarkly/js-server-sdk-common-edge";

export const get = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const items = await ctx.db.query("payloads").collect();
    const payload: {
      flags: Record<string, LDFeatureStoreItem>;
      segments: Record<string, LDFeatureStoreItem>;
    } = { flags: {}, segments: {} };

    for (const item of items) {
      const { _id, kind, key, payload: value } = item;
      if (key === undefined) {
        console.error("Payload missing key for item: ", _id);
        continue;
      }
      if (kind === undefined || (kind !== "flags" && kind !== "segments")) {
        console.error("Payload missing kind for item: ", _id);
        continue;
      }

      if (payload[kind][key] !== undefined) {
        console.error("Duplicate payload key: ", kind, key);
        continue;
      }
      payload[kind][key] = JSON.parse(value);
    }

    return JSON.stringify(payload);
  },
});

export const write = mutation({
  args: {
    payload: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { payload }) => {
    const { flags, segments } = JSON.parse(payload);
    console.log(flags);
    console.log(segments);
    Promise.all([
      upsertItems(ctx, "flags", flags),
      upsertItems(ctx, "segments", segments),
    ]);
  },
});

async function upsertItems(
  ctx: GenericMutationCtx<DataModel>,
  kind: "flags" | "segments",
  items: Record<string, LDFeatureStoreItem>
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
