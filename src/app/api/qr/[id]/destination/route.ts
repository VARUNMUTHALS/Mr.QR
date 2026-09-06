import { NextRequest } from "next/server";
import { getCurrentUser, json, errorResponse, serializeQr } from "@/lib/api";
import { db } from "@/lib/db";
import { validateDestinationUrl } from "@/lib/security";
import { invalidateCachedDestination } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await params;

  const qr = await db.qrCode.findUnique({
    where: { id },
    select: {
      userId: true,
      type: true,
      shortCode: true,
      slug: true,
      destinations: { orderBy: { version: "desc" }, take: 1 },
    },
  });
  if (!qr || qr.userId !== user.id) return errorResponse("Not found", 404);
  if (qr.type !== "DYNAMIC") return errorResponse("Only dynamic QRs can change destination.");

  const body = await req.json().catch(() => ({}));
  const validation = validateDestinationUrl(body.destination || "");
  if (!validation.ok) return errorResponse(validation.reason || "Invalid destination.");

  const prev = qr.destinations[0];
  if (prev && prev.url === validation.normalized) {
    return json({ qr: await serializeQr(id), changed: false });
  }

  const nextVersion = (prev?.version ?? 0) + 1;

  await db.$transaction(async (tx) => {
    if (prev) {
      await tx.qrDestination.updateMany({
        where: { qrId: id, isCurrent: true },
        data: { isCurrent: false },
      });
    }
    await tx.qrDestination.create({
      data: {
        qrId: id,
        url: validation.normalized!,
        version: nextVersion,
        isCurrent: true,
        createdBy: user.id,
      },
    });
    await tx.activityLog.create({
      data: {
        userId: user.id,
        qrId: id,
        action: "DESTINATION_CHANGED",
        metadata: JSON.stringify({
          version: nextVersion,
          previous: prev?.url ?? null,
          next: validation.normalized,
        }),
      },
    });
  });

  // Purge cache immediately so next scan gets the latest version without delay
  if (qr.shortCode) await invalidateCachedDestination(qr.shortCode);
  if (qr.slug) await invalidateCachedDestination(qr.slug);

  return json({
    qr: await serializeQr(id),
    changed: true,
    version: nextVersion,
  });
}
