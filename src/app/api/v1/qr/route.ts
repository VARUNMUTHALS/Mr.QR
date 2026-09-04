import { NextRequest } from "next/server";
import { getAuthContext, hasPermission } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { json, errorResponse } from "@/lib/api";
import {
  validateDestinationUrl,
  generateUniqueShortCode,
  rateLimit,
  getIp,
} from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) {
    return errorResponse("Unauthenticated", 401);
  }

  const { searchParams } = req.nextUrl;
  const limitParam = parseInt(searchParams.get("limit") || "20", 10);
  const limit = Math.min(Math.max(limitParam, 1), 100);
  const cursor = searchParams.get("cursor");
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const search = searchParams.get("search");

  const whereClause: any = {
    deletedAt: null,
    OR: [
      { organizationId: ctx.organizationId },
      { userId: ctx.user.id },
    ],
  };

  if (status && ["ACTIVE", "PAUSED", "ARCHIVED"].includes(status)) {
    whereClause.status = status;
  }

  if (type && ["STATIC", "DYNAMIC"].includes(type)) {
    whereClause.type = type;
  }

  if (search && search.trim()) {
    whereClause.name = {
      contains: search.trim(),
    };
  }

  const items = await db.qrCode.findMany({
    where: whereClause,
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    orderBy: { updatedAt: "desc" },
    include: {
      destinations: {
        where: { isCurrent: true },
        take: 1,
      },
      _count: {
        select: { scans: true },
      },
    },
  });

  const hasMore = items.length > limit;
  const qrRecords = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? qrRecords[qrRecords.length - 1].id : null;

  return json({
    data: qrRecords.map((qr) => ({
      id: qr.id,
      name: qr.name,
      type: qr.type,
      status: qr.status,
      shortCode: qr.shortCode || qr.slug,
      scanUrl: `/q/${qr.shortCode || qr.slug}`,
      currentDestination: qr.destinations[0]?.url ?? null,
      totalScans: qr._count.scans,
      createdAt: qr.createdAt.toISOString(),
      updatedAt: qr.updatedAt.toISOString(),
    })),
    pagination: {
      hasMore,
      nextCursor,
      limit,
    },
  });
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) {
    return errorResponse("Unauthenticated", 401);
  }

  if (!hasPermission(ctx.role, "EDITOR")) {
    return errorResponse("Forbidden: Insufficient permissions to create QR codes", 403);
  }

  const ip = getIp(req);
  const rl = rateLimit(`create_qr:${ctx.user.id}`, 30, 60_000);
  if (!rl.ok) {
    return errorResponse("Rate limit exceeded. Please wait before creating more QR codes.", 429);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON payload", 400);
  }

  const name = (body.name || "").trim();
  if (!name) {
    return errorResponse("QR Code name is required", 400);
  }

  const type = body.type === "STATIC" ? "STATIC" : "DYNAMIC";
  const design = body.design || body.designConfig || {};

  if (type === "STATIC") {
    const content = (body.content || "").trim();
    if (!content) return errorResponse("Static QR requires content", 400);

    const qr = await db.$transaction(async (tx) => {
      const created = await tx.qrCode.create({
        data: {
          userId: ctx.user.id,
          organizationId: ctx.organizationId,
          createdBy: ctx.user.id,
          name,
          type: "STATIC",
          status: "ACTIVE",
          content,
          designConfig: JSON.stringify(design),
        },
      });

      await tx.activityLog.create({
        data: {
          organizationId: ctx.organizationId,
          userId: ctx.user.id,
          qrId: created.id,
          action: "CREATED",
          metadata: JSON.stringify({ type: "STATIC" }),
        },
      });

      return created;
    });

    return json(
      {
        qr: {
          id: qr.id,
          name: qr.name,
          type: qr.type,
          status: qr.status,
          content: qr.content,
          createdAt: qr.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  }

  // Dynamic QR
  const destinationUrl = (body.destinationUrl || body.destination || "").trim();
  const validation = validateDestinationUrl(destinationUrl);
  if (!validation.ok) {
    return errorResponse(validation.reason || "Invalid destination URL", 400);
  }

  const shortCode = await generateUniqueShortCode(8);

  const qr = await db.$transaction(async (tx) => {
    const created = await tx.qrCode.create({
      data: {
        userId: ctx.user.id,
        organizationId: ctx.organizationId,
        createdBy: ctx.user.id,
        name,
        type: "DYNAMIC",
        slug: shortCode,
        shortCode,
        status: "ACTIVE",
        content: null,
        designConfig: JSON.stringify(design),
      },
    });

    const destination = await tx.qrDestination.create({
      data: {
        qrId: created.id,
        url: validation.normalized!,
        version: 1,
        isCurrent: true,
        createdBy: ctx.user.id,
      },
    });

    await tx.qrCode.update({
      where: { id: created.id },
      data: { currentDestinationId: destination.id },
    });

    await tx.activityLog.create({
      data: {
        organizationId: ctx.organizationId,
        userId: ctx.user.id,
        qrId: created.id,
        action: "CREATED",
        metadata: JSON.stringify({
          type: "DYNAMIC",
          destination: validation.normalized,
          shortCode,
        }),
      },
    });

    return created;
  });

  return json(
    {
      qr: {
        id: qr.id,
        name: qr.name,
        type: qr.type,
        status: qr.status,
        shortCode: qr.shortCode,
        scanUrl: `/q/${qr.shortCode}`,
        destination: validation.normalized,
        createdAt: qr.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
