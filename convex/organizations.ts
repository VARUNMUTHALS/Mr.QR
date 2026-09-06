import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthenticatedUser } from "./helpers/auth";
import { requireOrgRole } from "./helpers/ownership";

export const getOrg = query({
  args: { organizationId: v.string() },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, args.organizationId, [
      "OWNER",
      "ADMIN",
      "EDITOR",
      "ANALYST",
      "VIEWER",
    ]);

    return await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) =>
        q.eq("clerkOrganizationId", args.organizationId)
      )
      .first();
  },
});

export const syncOrg = mutation({
  args: {
    clerkOrganizationId: v.string(),
    name: v.string(),
    slug: v.string(),
    plan: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) =>
        q.eq("clerkOrganizationId", args.clerkOrganizationId)
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        slug: args.slug,
        plan: args.plan || existing.plan,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("organizations", {
      clerkOrganizationId: args.clerkOrganizationId,
      name: args.name,
      slug: args.slug,
      plan: args.plan || "FREE",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addMembership = mutation({
  args: {
    organizationId: v.string(),
    clerkUserId: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("memberships")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("clerkUserId", args.clerkUserId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role });
      return existing._id;
    }

    return await ctx.db.insert("memberships", {
      organizationId: args.organizationId,
      clerkUserId: args.clerkUserId,
      role: args.role,
      createdAt: Date.now(),
    });
  },
});
