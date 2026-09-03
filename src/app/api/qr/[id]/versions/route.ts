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

  const qr = await db.qrCode.findUnique({
    where: { id },
    select: { userId: true, type: true },
  });
  if (!qr || qr.userId !== user.id) return errorResponse("Not found", 404);

  const destinations = await db.qrDestination.findMany({
    where: { qrId: id },
    orderBy: { version: "desc" },
  });

  return json({
    versions: destinations.map((d) => ({
      id: d.id,
      url: d.url,
      version: d.version,
      isCurrent: d.isCurrent,
      createdBy: d.createdBy,
      createdAt: d.createdAt.toISOString(),
    })),
  });
}
