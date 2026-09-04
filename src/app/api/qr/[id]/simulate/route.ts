import { NextRequest } from "next/server";
import { getCurrentUser, json, errorResponse } from "@/lib/api";
import { db } from "@/lib/db";
import { parseUserAgent, extractEdgeGeo, computeVisitorKey, getIp, hashIp } from "@/lib/security";

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
  const ua = body.userAgent || req.headers.get("user-agent") || "studio-test-scan";
  const dev = parseUserAgent(ua);
  const geo = extractEdgeGeo(req.headers);
  const ip = getIp(req);
  const visitorKey = computeVisitorKey(ip, ua);

  const scan = await db.scanEvent.create({
    data: {
      qrId: id,
      deviceType: dev.deviceType,
      os: dev.os,
      osFamily: dev.os,
      browser: dev.browser,
      browserFamily: dev.browser,
      country: geo.country,
      countryCode: geo.countryCode,
      region: geo.region,
      regionCode: geo.regionCode,
      city: geo.city,
      visitorKey,
      ipHash: hashIp(ip),
      userAgent: ua.slice(0, 240),
      referrer: null,
      simulated: true,
      source: "TEST",
    },
  });

  return json({ ok: true, scan: { id: scan.id, timestamp: scan.timestamp.toISOString() } });
}
