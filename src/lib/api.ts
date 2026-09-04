import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true },
  });
  return user;
}

export function json(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
}

export function errorResponse(message: string, status = 400) {
  return json({ error: message }, { status });
}

/** Serialize a QR code (with relations) into a client-friendly shape. */
export async function serializeQr(qrId: string) {
  const qr = await db.qrCode.findUnique({
    where: { id: qrId },
    include: {
      destinations: { orderBy: { version: "desc" } },
      scans: { select: { id: true }, take: 1 },
      _count: { select: { scans: true } },
    },
  });
  if (!qr) return null;

  const currentDest = qr.destinations.find((d) => d.isCurrent) || qr.destinations[0];
  return {
    id: qr.id,
    type: qr.type,
    name: qr.name,
    slug: qr.slug,
    shortCode: qr.shortCode || qr.slug,
    scanUrl: `/q/${qr.shortCode || qr.slug}`,
    status: qr.status,
    content: qr.content,
    designConfig: JSON.parse(qr.designConfig),
    createdAt: qr.createdAt.toISOString(),
    updatedAt: qr.updatedAt.toISOString(),
    currentDestination: currentDest?.url ?? null,
    currentVersion: currentDest?.version ?? null,
    totalScans: qr._count.scans,
    destinations: qr.destinations.map((d) => ({
      id: d.id,
      url: d.url,
      version: d.version,
      isCurrent: d.isCurrent,
      createdAt: d.createdAt.toISOString(),
    })),
  };
}
