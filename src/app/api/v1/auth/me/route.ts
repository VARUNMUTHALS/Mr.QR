import { getAuthContext } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { json, errorResponse } from "@/lib/api";

export async function GET() {
  const authContext = await getAuthContext();
  if (!authContext?.user?.id) {
    return errorResponse("Unauthenticated", 401);
  }

  const user = await db.user.findUnique({
    where: { id: authContext.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      memberships: {
        select: {
          role: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              subscription: {
                select: {
                  plan: true,
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return errorResponse("User not found", 404);
  }

  const activeMembership = user.memberships[0];

  return json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      organization: activeMembership?.organization ?? null,
      role: activeMembership?.role ?? "VIEWER",
      plan: activeMembership?.organization?.subscription?.plan ?? "FREE",
    },
  });
}
