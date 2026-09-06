import { QueryCtx, MutationCtx } from "../_generated/server";
import { requireAuthenticatedUser } from "./auth";

export type OrgRole = "OWNER" | "ADMIN" | "EDITOR" | "ANALYST" | "VIEWER";

const ROLE_RANK: Record<OrgRole, number> = {
  OWNER: 50,
  ADMIN: 40,
  EDITOR: 30,
  ANALYST: 20,
  VIEWER: 10,
};

export async function requireOrgRole(
  ctx: QueryCtx | MutationCtx,
  organizationId: string,
  allowedRoles: OrgRole[]
) {
  const identity = await requireAuthenticatedUser(ctx);

  // 1. Check direct membership record in Convex
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_org_and_user", (q) =>
      q.eq("organizationId", organizationId).eq("clerkUserId", identity.subject)
    )
    .first();

  if (!membership) {
    throw new Error("FORBIDDEN: User does not belong to this organization");
  }

  const role = membership.role as OrgRole;
  if (!allowedRoles.includes(role)) {
    throw new Error(
      `INSUFFICIENT_ROLE: Required role in [${allowedRoles.join(", ")}], but user has [${role}]`
    );
  }

  return { identity, membership };
}
