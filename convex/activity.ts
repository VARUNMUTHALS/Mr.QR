import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireOrgRole } from "./helpers/ownership";

export const list = query({
  args: {
    organizationId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, args.organizationId, [
      "OWNER",
      "ADMIN",
      "EDITOR",
      "ANALYST",
      "VIEWER",
    ]);

    return await ctx.db
      .query("activityLogs")
      .withIndex("by_org_and_created", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .take(args.limit || 50);
  },
});
