import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tokens: defineTable({
    token: v.string(),
  }),
  payloads: defineTable({
    payload: v.any(),
  }),
});
