import { NextRequest } from "next/server";
import { getAuthContext, hasPermission } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { json, errorResponse, serializeQr } from "@/lib/api";
import { validateDestinationUrl } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return errorResponse("Unauthenticated", 401);

  const { id } = await params;

  const qr = await db.qrCode.findFirst({
    where: {
      id,
      deletedAt: null,
      OR: [
        { organizationId: ctx.organizationId },
        { userId: ctx.user.id },
      ],
    },
  });

  if (!qr) {
    return errorResponse("QR Code not found or access denied", 404);
  }

  const serialized = await serializeQr(id);
  return json({ qr: serialized });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return errorResponse("Unauthenticated", 401);

  if (!hasPermission(ctx.role, "EDITOR")) {
    return errorResponse("Forbidden: Insufficient permissions to edit QR codes", 403);
  }

  const { id } = await params;

  const qr = await db.qrCode.findFirst({
    where: {
      id,
      deletedAt: null,
      OR: [
        { organizationId: ctx.organizationId },
        { userId: ctx.user.id },
      ],
    },
    include: {
      destinations: {
        where: { isCurrent: true },
        take: 1,
      },
    },
  });

  if (!qr) {
    return errorResponse("QR Code not found", 404);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON payload", 400);
  }

  await db.$transaction(async (tx) => {
    // 1. Destination Update (Immutable version N+1)
    if (body.destinationUrl || body.destination) {
      const destInput = (body.destinationUrl || body.destination).trim();
      const validation = validateDestinationUrl(destInput);
      if (!validation.ok) {
        throw new Error(validation.reason || "Invalid destination URL");
      }

      const prev = qr.destinations[0];
      if (!prev || prev.url !== validation.normalized) {
        const latestVersionRecord = await tx.qrDestination.findFirst({
          where: { qrId: id },
          orderBy: { version: "desc" },
        });

        const nextVersion = (latestVersionRecord?.version ?? 0) + 1;

        await tx.qrDestination.updateMany({
          where: { qrId: id, isCurrent: true },
          data: { isCurrent: false },
        });

        const newDestination = await tx.qrDestination.create({
          data: {
            qrId: id,
            url: validation.normalized!,
            destinationUrl: validation.normalized!,
            version: nextVersion,
            versionNumber: nextVersion,
            isCurrent: true,
            createdBy: ctx.user.id,
            changeReason: body.changeReason || "Destination updated via API v1",
          },
        });

        await tx.qrCode.update({
          where: { id },
          data: { currentDestinationId: newDestination.id },
        });

        await tx.activityLog.create({
          data: {
            organizationId: ctx.organizationId,
            userId: ctx.user.id,
            qrId: id,
            action: "DESTINATION_CHANGED",
            metadata: JSON.stringify({
              previousUrl: prev?.url ?? null,
              newUrl: validation.normalized,
              version: nextVersion,
            }),
          },
        });
      }
    }

    // 2. Status change
    if (body.status && ["ACTIVE", "PAUSED", "ARCHIVED"].includes(body.status)) {
      await tx.qrCode.update({
        where: { id },
        data: { status: body.status },
      });

      await tx.activityLog.create({
        data: {
          organizationId: ctx.organizationId,
          userId: ctx.user.id,
          qrId: id,
          action: "STATUS_CHANGED",
          metadata: JSON.stringify({ status: body.status }),
        },
      });
    }

    // 3. Name update
    if (body.name && body.name.trim()) {
      await tx.qrCode.update({
        where: { id },
        data: { name: body.name.trim() },
      });
    }
  });

  const updated = await serializeQr(id);
  return json({ qr: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (!ctx) return errorResponse("Unauthenticated", 401);

  if (!hasPermission(ctx.role, "ADMIN")) {
    return errorResponse("Forbidden: Only ADMIN or OWNER can delete QR codes", 403);
  }

  const { id } = await params;

  const qr = await db.qrCode.findFirst({
    where: {
      id,
      deletedAt: null,
      OR: [
        { organizationId: ctx.organizationId },
        { userId: ctx.user.id },
      ],
    },
  });

  if (!qr) {
    return errorResponse("QR Code not found", 404);
  }

  // Soft deletion per DATABASE.md Section 20
  await db.$transaction(async (tx) => {
    await tx.qrCode.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        deletedAt: new Date(),
      },
    });

    await tx.activityLog.create({
      data: {
        organizationId: ctx.organizationId,
        userId: ctx.user.id,
        qrId: id,
        action: "STATUS_CHANGED",
        metadata: JSON.stringify({ status: "ARCHIVED", softDeleted: true, name: qr.name }),
      },
    });
  });

  return json({ ok: true, message: "QR Code soft-deleted and archived successfully" });
}
