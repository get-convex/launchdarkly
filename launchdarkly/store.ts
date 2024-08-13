import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { GenericDatabaseWriter, TableNamesInDataModel } from "convex/server";
import { DataModel } from "./_generated/dataModel";

export const all = query({
  args: { kind: v.union(v.literal("features"), v.literal("segments")) },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.query(args.kind).collect();
  },
});

export const get = query({
  args: {
    kind: v.union(v.literal("features"), v.literal("segments")),
    key: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query(args.kind)
      .withIndex("key", (q) => q.eq("key", args.key))
      .first();
  },
});

export const store = mutation({
  args: {
    features: v.any(),
    segments: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { features, segments } = args;
    await Promise.all([
      ...upsertEntries(ctx.db, "features", features),
      ...upsertEntries(ctx.db, "segments", segments),
    ]);
  },
});

const upsertEntries = (
  db: GenericDatabaseWriter<DataModel>,
  tableName: TableNamesInDataModel<DataModel>,
  data: object
) => {
  return Object.entries(data).map(async ([key, config]) => {
    return upsert(db, tableName, key, config);
  });
};

const upsert = async (
  db: GenericDatabaseWriter<DataModel>,
  tableName: TableNamesInDataModel<DataModel>,
  key: string,
  config: unknown
) => {
  const existing = await db
    .query(tableName)
    .withIndex("key", (q) => q.eq("key", key))
    .first();
  // @ts-expect-error config.version is not typed
  const newConfigVersion = config.version;
  if (!existing) {
    return db.insert(tableName, { key, config });
  } else if (existing.config.version < newConfigVersion) {
    db.patch(existing._id, { config });
    return;
  }
};
