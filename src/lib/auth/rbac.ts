import { auth, currentUser } from "@clerk/nextjs/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export type OrgRole = "OWNER" | "ADMIN" | "EDITOR" | "ANALYST" | "VIEWER";

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  EDITOR: 3,
  ANALYST: 2,
  VIEWER: 1,
};

export function hasPermission(userRole: OrgRole, requiredRole: OrgRole): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

export interface AuthContext {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
  organizationId: string;
  role: OrgRole;
}

/**
 * Resolves the authenticated user and their active organization membership.
 * Guarantees that client-supplied IDs can NEVER bypass organization authorization.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  let clerkUserId: string | null = null;
  let userEmail: string | null = null;
  let userName: string | null = null;

  try {
    const authState = await auth();
    clerkUserId = authState.userId;
    if (clerkUserId) {
      const clerkUser = await currentUser();
      userEmail = clerkUser?.emailAddresses[0]?.emailAddress || `${clerkUserId}@user.clerk`;
      userName = `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() || null;
    }
  } catch {}

  let user = null;

  if (clerkUserId) {
    user = await db.user.findFirst({
      where: { OR: [{ id: clerkUserId }, { email: userEmail || "" }] },
      include: {
        memberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });

    if (!user && userEmail) {
      user = await db.user.create({
        data: {
          id: clerkUserId,
          email: userEmail,
          name: userName || "Studio Creator",
          passwordHash: "clerk-managed-auth",
        },
        include: {
          memberships: {
            include: { organization: true },
            take: 1,
          },
        },
      });
    }
  } else {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.email) {
      return null;
    }

    user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        memberships: {
          include: { organization: true },
          take: 1,
        },
      },
    });
  }

  if (!user) return null;

  // If user doesn't have an organization yet (legacy prototype migration),
  // auto-create their personal studio organization
  let membership = user.memberships[0];
  if (!membership) {
    const orgName = `${user.name || user.email.split("@")[0]}'s Studio`;
    const orgSlug = `${orgName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.random().toString(36).slice(2, 7)}`;

    const newOrg = await db.organization.create({
      data: {
        name: orgName,
        slug: orgSlug,
        ownerUserId: user.id,
      },
    });

    membership = await db.organizationMember.create({
      data: {
        organizationId: newOrg.id,
        userId: user.id,
        role: "OWNER",
      },
      include: {
        organization: true,
      },
    });
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    organizationId: membership.organizationId,
    role: (membership.role as OrgRole) || "VIEWER",
  };
}
