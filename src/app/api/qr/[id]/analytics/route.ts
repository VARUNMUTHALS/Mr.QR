import { NextRequest } from "next/server";
import { getCurrentUser, json, errorResponse } from "@/lib/api";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Range = "today" | "7d" | "30d" | "90d";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Unauthorized", 401);
  const { id } = await params;

  const qr = await db.qrCode.findUnique({
    where: { id },
    select: { userId: true, name: true, createdAt: true },
  });
  if (!qr || qr.userId !== user.id) return errorResponse("Not found", 404);

  const rangeParam = (req.nextUrl.searchParams.get("range") || "30d") as Range;
  const now = new Date();
  const since = rangeToSince(rangeParam, now, qr.createdAt);

  const scans = await db.scanEvent.findMany({
    where: { qrId: id, timestamp: { gte: since } },
    select: {
      timestamp: true,
      deviceType: true,
      os: true,
      browser: true,
      country: true,
      region: true,
      city: true,
      ipHash: true,
      visitorKey: true,
    },
    orderBy: { timestamp: "asc" },
  });

  // total scans for the QR (all time) — separate quick query
  const allTime = await db.scanEvent.count({ where: { qrId: id } });

  // Estimated unique visitors (distinct salted visitorKey) in range
  const uniqueVisitorSet = new Set<string>();
  for (const s of scans) {
    const key = s.visitorKey || s.ipHash;
    if (key) uniqueVisitorSet.add(key);
  }
  const estimatedUniqueVisitors = uniqueVisitorSet.size;
  const uniqueVisitors = estimatedUniqueVisitors;

  // previous-window comparison for growth
  const prevSince = new Date(since.getTime() - (now.getTime() - since.getTime()));
  const prevCount = await db.scanEvent.count({
    where: { qrId: id, timestamp: { gte: prevSince, lt: since } },
  });
  const growthPct =
    prevCount === 0
      ? scans.length > 0
        ? 100
        : 0
      : Math.round(((scans.length - prevCount) / prevCount) * 100);

  // timeline (daily buckets)
  const timeline = bucketDaily(scans, since, now, rangeParam);

  // device breakdown
  const deviceMap = new Map<string, number>();
  const osMap = new Map<string, number>();
  const browserMap = new Map<string, number>();
  for (const s of scans) {
    const dt = s.deviceType || "Other";
    deviceMap.set(dt, (deviceMap.get(dt) || 0) + 1);
    const os = s.os || "Other";
    osMap.set(os, (osMap.get(os) || 0) + 1);
    const br = s.browser || "Other";
    browserMap.set(br, (browserMap.get(br) || 0) + 1);
  }

  // geo breakdown
  const countryMap = new Map<string, number>();
  for (const s of scans) {
    const c = s.country || "Other";
    countryMap.set(c, (countryMap.get(c) || 0) + 1);
  }

  // hourly distribution
  const hourly = new Array(24).fill(0);
  for (const s of scans) {
    hourly[new Date(s.timestamp).getHours()] += 1;
  }

  // recent activity (last 12)
  const recent = await db.scanEvent.findMany({
    where: { qrId: id },
    orderBy: { timestamp: "desc" },
    take: 12,
    select: {
      timestamp: true,
      deviceType: true,
      os: true,
      country: true,
      city: true,
      simulated: true,
    },
  });

  // peak hour
  let peakHour = 0;
  let peakCount = 0;
  for (let h = 0; h < 24; h++) {
    if (hourly[h] > peakCount) {
      peakCount = hourly[h];
      peakHour = h;
    }
  }

  return json({
    range: rangeParam,
    since: since.toISOString(),
    totalScans: allTime,
    scansInRange: scans.length,
    estimatedUniqueVisitors,
    uniqueVisitors,
    growthPct,
    timeline,
    devices: toRanked(deviceMap),
    os: toRanked(osMap),
    browsers: toRanked(browserMap),
    locations: toRanked(countryMap),
    hourly: hourly.map((count, hour) => ({ hour, count })),
    peakHour,
    recent: recent.map((r) => ({
      timestamp: r.timestamp.toISOString(),
      deviceType: r.deviceType || "Other",
      os: r.os || "Other",
      country: r.country || "Other",
      city: r.city || "—",
      simulated: r.simulated,
    })),
  });
}

function rangeToSince(range: Range, now: Date, createdAt: Date): Date {
  const ms = {
    today: 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
  }[range];
  const start = new Date(now.getTime() - ms);
  if (range === "today") {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    return dayStart;
  }
  // don't go before the QR existed
  return start < createdAt ? createdAt : start;
}

function bucketDaily(
  scans: { timestamp: Date }[],
  since: Date,
  now: Date,
  range: Range
) {
  if (scans.length === 0) {
    return [];
  }
  // for "today", bucket hourly
  if (range === "today") {
    const buckets = new Array(24).fill(0).map((_, hour) => ({
      label: `${hour}:00`,
      date: new Date(new Date(since).setHours(hour, 0, 0, 0)).toISOString(),
      scans: 0,
      unique: new Set<string>(),
    }));
    return buckets.map((b, hour) => ({
      label: b.label,
      date: b.date,
      scans: 0,
      unique: 0,
    }));
  }

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const out: { label: string; date: string; scans: number; unique: number }[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  const startDay = new Date(now);
  startDay.setHours(0, 0, 0, 0);

  const buckets: { date: string; scans: number; unique: Set<string> }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(startDay.getTime() - i * dayMs);
    buckets.push({
      date: d.toISOString(),
      scans: 0,
      unique: new Set(),
    });
  }

  for (const s of scans) {
    const dayIndex = Math.floor(
      (new Date(s.timestamp).setHours(0, 0, 0, 0) - startDay.getTime()) / dayMs
    );
    const idx = dayIndex + (days - 1);
    if (idx >= 0 && idx < buckets.length) {
      buckets[idx].scans += 1;
      const key = (s as unknown as { visitorKey?: string; ipHash?: string }).visitorKey ||
        (s as unknown as { visitorKey?: string; ipHash?: string }).ipHash;
      if (key) {
        buckets[idx].unique.add(key);
      }
    }
  }

  for (const b of buckets) {
    out.push({
      label: new Date(b.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      date: b.date,
      scans: b.scans,
      unique: b.unique.size,
    });
  }
  return out;
}

function toRanked(map: Map<string, number>) {
  const total = [...map.values()].reduce((s, n) => s + n, 0) || 1;
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      key,
      count,
      pct: Math.round((count / total) * 100),
    }));
}
