import { NextRequest } from "next/server";
import { getCurrentUser, json, errorResponse, serializeQr } from "@/lib/api";
import { db } from "@/lib/db";
import { invalidateCachedDestination } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; vid: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);
  const { id, vid } = await params;

  const qr = await db.qrCode.findUnique({
    where: { id },
    select: { userId: true, type: true, shortCode: true, slug: true },
  });
  if (!qr || qr.userId !== user.id) return errorResponse("Not found", 404);
  if (qr.type !== "DYNAMIC") return errorResponse("Only dynamic QRs have versions.");

  const target = await db.qrDestination.findUnique({ where: { id: vid } });
  if (!target || target.qrId !== id) return errorResponse("Version not found", 404);
  if (target.isCurrent) return errorResponse("This version is already current.");

  const latest = await db.qrDestination.findFirst({
    where: { qrId: id },
    orderBy: { version: "desc" },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  await db.$transaction(async (tx) => {
    await tx.qrDestination.updateMany({
      where: { qrId: id, isCurrent: true },
      data: { isCurrent: false },
    });
    const restored = await tx.qrDestination.create({
      data: {
        qrId: id,
        url: target.url,
        version: nextVersion,
        isCurrent: true,
        createdBy: user.id,
      },
    });
    await tx.activityLog.create({
      data: {
        userId: user.id,
        qrId: id,
        action: "VERSION_RESTORED",
        metadata: JSON.stringify({
          restoredFromVersion: target.version,
          newVersion: nextVersion,
          url: restored.url,
        }),
      },
    });
  });

  // Purge cache immediately so next scan gets the restored version
  if (qr.shortCode) await invalidateCachedDestination(qr.shortCode);
  if (qr.slug) await invalidateCachedDestination(qr.slug);

  return json({ qr: await serializeQr(id) });
}
