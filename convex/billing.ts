import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOrgRole } from "./helpers/ownership";

export const getSubscription = query({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, args.organizationId, [
      "OWNER",
      "ADMIN",
      "EDITOR",
      "ANALYST",
      "VIEWER",
    ]);

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .first();

    return sub;
  },
});

export const updateSubscriptionFromStripe = mutation({
  args: {
    organizationId: v.string(),
    plan: v.string(),
    status: v.string(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        plan: args.plan,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("subscriptions", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});
