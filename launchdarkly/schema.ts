import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tokens: defineTable({
    token: v.string(),
  }),
  payloads: defineTable({
    kind: v.optional(v.string()),
    key: v.optional(v.string()),
    version: v.optional(v.number()),
    payload: v.any(),
  }).index("kind_key", ["kind", "key"]),
});
