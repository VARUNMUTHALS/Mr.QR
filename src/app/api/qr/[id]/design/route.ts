import { NextRequest } from "next/server";
import { getCurrentUser, json, errorResponse, serializeQr } from "@/lib/api";
import { db } from "@/lib/db";
import { DEFAULT_DESIGN, type QrDesignConfig } from "@/lib/qr/types";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await params;

  const qr = await db.qrCode.findUnique({
    where: { id },
    select: { userId: true, designConfig: true },
  });
  if (!qr || qr.userId !== user.id) return errorResponse("Not found", 404);

  const body = await req.json().catch(() => ({}));
  const design: QrDesignConfig = {
    ...DEFAULT_DESIGN,
    ...JSON.parse(qr.designConfig),
    ...(body.designConfig || {}),
  };

  await db.$transaction(async (tx) => {
    await tx.qrCode.update({
      where: { id },
      data: { designConfig: JSON.stringify(design) },
    });
    await tx.activityLog.create({
      data: {
        userId: user.id,
        qrId: id,
        action: "DESIGN_UPDATED",
        metadata: JSON.stringify({}),
      },
    });
  });

  return json({ qr: await serializeQr(id) });
}
