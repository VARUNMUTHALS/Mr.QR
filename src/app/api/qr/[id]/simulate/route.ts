import { NextRequest } from "next/server";
import { getCurrentUser, json, errorResponse } from "@/lib/api";
import { db } from "@/lib/db";
import { parseUserAgent, approximateGeo, hashIp } from "@/lib/security";

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
    select: { userId: true, type: true, slug: true, status: true },
  });
  if (!qr || qr.userId !== user.id) return errorResponse("Not found", 404);
  if (qr.type !== "DYNAMIC") return errorResponse("Only dynamic QRs record scans.");

  const body = await req.json().catch(() => ({}));
  const ua = body.userAgent || req.headers.get("user-agent") || "studio-sim";
  const dev = parseUserAgent(ua);

  // Deterministic-ish but varied geo per simulated scan.
  const seed = `${qr.slug}-${Date.now()}-${Math.random()}`;
  const geo = approximateGeo(seed);

  const scan = await db.scanEvent.create({
    data: {
      qrId: id,
      deviceType: dev.deviceType,
      os: dev.os,
      browser: dev.browser,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      ipHash: hashIp(seed),
      userAgent: ua.slice(0, 240),
      referrer: null,
      simulated: true,
    },
  });

  return json({ ok: true, scan: { id: scan.id, timestamp: scan.timestamp.toISOString() } });
}
