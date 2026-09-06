import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { json, errorResponse } from "@/lib/api";
import { rateLimit, getIp } from "@/lib/security";
import { findDevUser, registerDevUser } from "@/lib/auth-store";

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit(`reg:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return errorResponse("Too many registration attempts. Please try again later.", 429);
  }

  let body: { email?: string; password?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON payload.", 400);
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const rawName = (body.name || "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errorResponse("Please provide a valid email address.", 400);
  }

  if (password.length < 8) {
    return errorResponse("Password must be at least 8 characters long.", 400);
  }

  const name = rawName || email.split("@")[0].replace(/[._-]+/g, " ");
  const passwordHash = await bcrypt.hash(password, 12);
  const orgSlug = `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.random().toString(36).slice(2, 7)}`;

  try {
    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    }).catch(() => null);

    if (existingUser) {
      return errorResponse("An account with this email address already exists.", 409);
    }

    const devExisting = await findDevUser(email);
    if (devExisting) {
      return errorResponse("An account with this email address already exists.", 409);
    }

    try {
      const result = await db.$transaction(async (tx) => {
        // 1. Create User
        const user = await tx.user.create({
          data: {
            email,
            name,
            passwordHash,
          },
        });

        // 2. Create User Organization
        const org = await tx.organization.create({
          data: {
            name: `${name}'s Studio`,
            slug: orgSlug,
            ownerUserId: user.id,
          },
        });

        // 3. Add Member with OWNER Role
        await tx.organizationMember.create({
          data: {
            organizationId: org.id,
            userId: user.id,
            role: "OWNER",
          },
        });

        // 4. Create default Free subscription
        await tx.subscription.create({
          data: {
            organizationId: org.id,
            plan: "FREE",
            status: "ACTIVE",
          },
        });

        return { user, org };
      });

      return json(
        {
          ok: true,
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            organizationId: result.org.id,
          },
        },
        { status: 201 }
      );
    } catch {
      // Database offline/unreachable fallback: register in resilient dev store
      const devRecord = await registerDevUser({ email, passwordHash, name });
      return json(
        {
          ok: true,
          user: {
            id: devRecord.id,
            email: devRecord.email,
            name: devRecord.name,
            organizationId: devRecord.organizationId,
          },
        },
        { status: 201 }
      );
    }
  } catch (err: any) {
    return errorResponse(err?.message || "Registration failed.", 500);
  }
}
