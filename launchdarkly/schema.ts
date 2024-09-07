import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tokens: defineTable({
    token: v.string(),
  }),
  payloads: defineTable({
    kind: v.string(),
    key: v.string(),
    version: v.number(),
    payload: v.string(),
  }).index("kind_key", ["kind", "key"]),
});
