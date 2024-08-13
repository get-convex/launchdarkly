import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  features: defineTable({
    key: v.string(),
    config: v.any(),
  }).index("key", ["key"]),
  segments: defineTable({
    key: v.string(),
    config: v.any(),
  }).index("key", ["key"]),
});
