import { NextRequest } from "next/server";
import { getCurrentUser, json, errorResponse, serializeQr } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await params;

  const qr = await db.qrCode.findUnique({ where: { id }, select: { userId: true } });
  if (!qr || qr.userId !== user.id) return errorResponse("Not found", 404);

  return json({ qr: await serializeQr(id) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await params;

  const qr = await db.qrCode.findUnique({ where: { id }, select: { userId: true, name: true } });
  if (!qr || qr.userId !== user.id) return errorResponse("Not found", 404);

  const body = await req.json().catch(() => ({}));
  const updates: { name?: string } = {};

  if (typeof body.name === "string") {
    const name = body.name.trim().slice(0, 80);
    if (!name) return errorResponse("Name cannot be empty.");
    if (name !== qr.name) {
      updates.name = name;
    }
  }

  if (Object.keys(updates).length === 0) {
    return json({ qr: await serializeQr(id) });
  }

  await db.$transaction(async (tx) => {
    await tx.qrCode.update({ where: { id }, data: updates });
    if (updates.name) {
      await tx.activityLog.create({
        data: {
          userId: user.id,
          qrId: id,
          action: "NAME_CHANGED",
          metadata: JSON.stringify({ name: updates.name }),
        },
      });
    }
  });

  return json({ qr: await serializeQr(id) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await params;
  const qr = await db.qrCode.findUnique({ where: { id }, select: { userId: true, name: true } });
  if (!qr || qr.userId !== user.id) return errorResponse("Not found", 404);

  // Soft-delete: retain historical analytics & audit logs, archive shortCode, hide from lists
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
        userId: user.id,
        qrId: id,
        action: "STATUS_CHANGED",
        metadata: JSON.stringify({ status: "ARCHIVED", softDeleted: true, name: qr.name }),
      },
    });
  });

  return json({ ok: true, message: "QR code archived and soft-deleted." });
}
