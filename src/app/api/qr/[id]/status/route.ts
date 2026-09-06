import { NextRequest } from "next/server";
import { getCurrentUser, json, errorResponse, serializeQr } from "@/lib/api";
import { db } from "@/lib/db";
import { invalidateCachedDestination } from "@/lib/redis";

export const dynamic = "force-dynamic";

const VALID = new Set(["ACTIVE", "PAUSED", "ARCHIVED"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await params;

  const qr = await db.qrCode.findUnique({
    where: { id },
    select: { userId: true, status: true, type: true, shortCode: true, slug: true },
  });
  if (!qr || qr.userId !== user.id) return errorResponse("Not found", 404);

  const body = await req.json().catch(() => ({}));
  const next = String(body.status || "").toUpperCase();
  if (!VALID.has(next)) return errorResponse("Invalid status.");
  if (next === qr.status) return json({ qr: await serializeQr(id) });

  await db.$transaction(async (tx) => {
    await tx.qrCode.update({ where: { id }, data: { status: next } });
    await tx.activityLog.create({
      data: {
        userId: user.id,
        qrId: id,
        action: "STATUS_CHANGED",
        metadata: JSON.stringify({ previous: qr.status, next }),
      },
    });
  });

  // Purge cache immediately so new status applies to all incoming scans
  if (qr.shortCode) await invalidateCachedDestination(qr.shortCode);
  if (qr.slug) await invalidateCachedDestination(qr.slug);

  return json({ qr: await serializeQr(id) });
}
