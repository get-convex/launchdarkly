import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  fruits: defineTable({
    name: v.string(),
    emoji: v.string(),
  }),
});
