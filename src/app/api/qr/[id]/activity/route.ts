import { NextRequest } from "next/server";
import { getCurrentUser, json, errorResponse } from "@/lib/api";
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
    select: { userId: true },
  });
  if (!qr || qr.userId !== user.id) return errorResponse("Not found", 404);

  const logs = await db.activityLog.findMany({
    where: { qrId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return json({
    activity: logs.map((l) => ({
      id: l.id,
      action: l.action,
      metadata: l.metadata ? safeParse(l.metadata) : null,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
