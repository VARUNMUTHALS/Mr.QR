import { NextRequest } from "next/server";
import { getCurrentUser, json, errorResponse, serializeQr } from "@/lib/api";
import { db } from "@/lib/db";
import { generateUniqueSlug, validateDestinationUrl } from "@/lib/security";
import { DEFAULT_DESIGN, type QrDesignConfig } from "@/lib/qr/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  const qrs = await db.qrCode.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: {
      destinations: { orderBy: { version: "desc" }, take: 1 },
      _count: { select: { scans: true } },
    },
  });

  const result = await Promise.all(
    qrs.map(async (qr) => ({
      id: qr.id,
      type: qr.type,
      name: qr.name,
      slug: qr.slug,
      status: qr.status,
      createdAt: qr.createdAt.toISOString(),
      updatedAt: qr.updatedAt.toISOString(),
      currentDestination:
        qr.destinations.find((d) => d.isCurrent)?.url ?? qr.destinations[0]?.url ?? null,
      totalScans: qr._count.scans,
    }))
  );

  return json({ qrs: result });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);

  let body: {
    type?: "STATIC" | "DYNAMIC";
    name?: string;
    content?: string;
    destination?: string;
    designConfig?: Partial<QrDesignConfig>;
  };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const type = body.type;
  if (type !== "STATIC" && type !== "DYNAMIC") {
    return errorResponse("Type must be STATIC or DYNAMIC.");
  }

  const name = (body.name || "").trim().slice(0, 80);
  if (!name) return errorResponse("Give your QR a name.");

  const design: QrDesignConfig = { ...DEFAULT_DESIGN, ...(body.designConfig || {}) };

  if (type === "STATIC") {
    const content = (body.content || "").trim();
    if (!content) return errorResponse("Add some content to encode.");
    if (content.length > 1200) return errorResponse("Content is too long.");

    const qr = await db.qrCode.create({
      data: {
        userId: user.id,
        type: "STATIC",
        name,
        status: "ACTIVE",
        content,
        designConfig: JSON.stringify(design),
      },
    });

    await db.activityLog.create({
      data: {
        userId: user.id,
        qrId: qr.id,
        action: "CREATED",
        metadata: JSON.stringify({ type: "STATIC" }),
      },
    });

    return json({ qr: await serializeQr(qr.id) }, { status: 201 });
  }

  // DYNAMIC
  const dest = (body.destination || "").trim();
  const validation = validateDestinationUrl(dest);
  if (!validation.ok) {
    return errorResponse(validation.reason || "Invalid destination.");
  }

  const slug = await generateUniqueSlug();
  const qr = await db.$transaction(async (tx) => {
    const created = await tx.qrCode.create({
      data: {
        userId: user.id,
        type: "DYNAMIC",
        name,
        slug,
        shortCode: slug,
        status: "ACTIVE",
        content: null,
        designConfig: JSON.stringify(design),
      },
    });
    await tx.qrDestination.create({
      data: {
        qrId: created.id,
        url: validation.normalized!,
        version: 1,
        isCurrent: true,
        createdBy: user.id,
      },
    });
    await tx.activityLog.create({
      data: {
        userId: user.id,
        qrId: created.id,
        action: "CREATED",
        metadata: JSON.stringify({ type: "DYNAMIC", destination: validation.normalized }),
      },
    });
    return created;
  });

  return json({ qr: await serializeQr(qr.id) }, { status: 201 });
}
