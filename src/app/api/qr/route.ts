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
    where: { userId: user.id },
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

  // Seed sample scan history so analytics feels alive immediately.
  await seedSampleScans(qr.id);

  return json({ qr: await serializeQr(qr.id) }, { status: 201 });
}

/* ---------- Sample scan seeding for dynamic QR analytics ---------- */

const SAMPLE_DEVICES = [
  { deviceType: "Mobile", os: "Android", browser: "Chrome", w: 0.34 },
  { deviceType: "Mobile", os: "iOS", browser: "Safari", w: 0.30 },
  { deviceType: "Desktop", os: "Windows", browser: "Chrome", w: 0.12 },
  { deviceType: "Mobile", os: "iOS", browser: "Chrome", w: 0.08 },
  { deviceType: "Desktop", os: "macOS", browser: "Safari", w: 0.08 },
  { deviceType: "Tablet", os: "iPadOS", browser: "Safari", w: 0.04 },
  { deviceType: "Desktop", os: "Linux", browser: "Firefox", w: 0.04 },
];

const SAMPLE_GEO = [
  { country: "India", region: "Maharashtra", city: "Mumbai", w: 0.28 },
  { country: "India", region: "Karnataka", city: "Bengaluru", w: 0.18 },
  { country: "India", region: "Delhi", city: "New Delhi", w: 0.12 },
  { country: "United States", region: "California", city: "San Francisco", w: 0.10 },
  { country: "United Kingdom", region: "England", city: "London", w: 0.08 },
  { country: "United Arab Emirates", region: "Dubai", city: "Dubai", w: 0.06 },
  { country: "Singapore", region: "Central", city: "Singapore", w: 0.05 },
  { country: "Germany", region: "Berlin", city: "Berlin", w: 0.05 },
  { country: "Australia", region: "New South Wales", city: "Sydney", w: 0.04 },
  { country: "Other", region: "—", city: "—", w: 0.04 },
];

function weighted<T>(items: { w: number }[] & T[]): T {
  const total = items.reduce((s, i) => s + (i as { w: number }).w, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= (item as { w: number }).w;
    if (r <= 0) return item as T;
  }
  return items[0] as T;
}

async function seedSampleScans(qrId: string) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const events: {
    qrId: string;
    timestamp: Date;
    deviceType: string;
    os: string;
    browser: string;
    country: string;
    region: string;
    city: string;
    ipHash: string;
    simulated: boolean;
  }[] = [];

  // 28 days of history with an upward growth trend + daily seasonality.
  for (let d = 27; d >= 0; d--) {
    const dayStart = now - d * dayMs;
    // base grows from ~40 to ~520 over the window
    const growth = 1 - d / 27;
    const base = Math.round(40 + growth * 480);
    // weekday vs weekend variation
    const dow = new Date(dayStart).getDay();
    const weekendFactor = dow === 0 || dow === 6 ? 0.7 : 1.0;
    const daily = Math.max(4, Math.round(base * weekendFactor * (0.8 + Math.random() * 0.4)));

    for (let i = 0; i < daily; i++) {
      // distribute across the day, peak 6pm–9pm
      const hour = pickPeakHour();
      const ts = new Date(dayStart - (dayStart % dayMs) + hour * 60 * 60 * 1000 + Math.floor(Math.random() * 60 * 60 * 1000));
      const dev = weighted(SAMPLE_DEVICES as never) as unknown as {
        deviceType: string;
        os: string;
        browser: string;
      };
      const geo = weighted(SAMPLE_GEO as never) as unknown as {
        country: string;
        region: string;
        city: string;
      };
      events.push({
        qrId,
        timestamp: ts,
        deviceType: dev.deviceType,
        os: dev.os,
        browser: dev.browser,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        ipHash: Math.random().toString(36).slice(2, 14),
        simulated: true,
      });
    }
  }

  // batch insert in chunks to avoid huge queries
  const chunkSize = 200;
  for (let i = 0; i < events.length; i += chunkSize) {
    const chunk = events.slice(i, i + chunkSize);
    await db.scanEvent.createMany({ data: chunk });
  }
}

function pickPeakHour(): number {
  // weighted toward evening hours (6pm–9pm)
  const r = Math.random();
  if (r < 0.45) return 18 + Math.floor(Math.random() * 3);
  if (r < 0.7) return 12 + Math.floor(Math.random() * 4);
  if (r < 0.9) return 9 + Math.floor(Math.random() * 3);
  return Math.floor(Math.random() * 24);
}
