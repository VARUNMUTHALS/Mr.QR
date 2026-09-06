import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const recordScan = mutation({
  args: {
    qrId: v.string(),
    organizationId: v.string(),
    timestamp: v.number(),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    deviceType: v.string(),
    os: v.string(),
    osFamily: v.optional(v.string()),
    browser: v.string(),
    browserFamily: v.optional(v.string()),
    referrer: v.optional(v.string()),
    referrerDomain: v.optional(v.string()),
    visitorKey: v.string(),
    ipHash: v.string(),
    userAgentHash: v.optional(v.string()),
    bot: v.boolean(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scanEvents", args);
  },
});
