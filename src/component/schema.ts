import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tokens: defineTable({
    token: v.string(),
  }),
  sdkKeys: defineTable({
    key: v.string(),
  }),
  payloads: defineTable({
    kind: v.union(v.literal("flags"), v.literal("segments")),
    key: v.string(),
    version: v.number(),
    payload: v.string(),
  }).index("kind_key", ["kind", "key"]),
  events: defineTable({
    payload: v.string(),
  }),
  eventSchedule: defineTable({
    jobId: v.id("_scheduled_functions"),
  }),
});
