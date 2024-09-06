import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tokens: defineTable({
    sdkKey: v.string(),
    token: v.string(),
  }),
  payloads: defineTable({
    key: v.string(),
    payload: v.any(),
  }).index("key", ["key"]),
});
