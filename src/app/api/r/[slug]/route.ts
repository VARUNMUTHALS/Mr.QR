import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  parseUserAgent,
  extractEdgeGeo,
  computeVisitorKey,
  isSuspectedBot,
  hashIp,
  getIp,
} from "@/lib/security";
import {
  getCachedDestination,
  setCachedDestination,
  DestinationCachePayload,
} from "@/lib/redis";
import { checkRedirectRateLimit } from "@/lib/rate-limit";
import { convexClient, api } from "@/lib/convex/client";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const ip = getIp(req);

  // 1. Upstash Distributed Rate Limiting (replaces in-memory Map)
  const rl = await checkRedirectRateLimit(ip);
  if (!rl.success) {
    return new NextResponse(renderRateLimited(), {
      status: 429,
      headers: { "Content-Type": "text/html", "Retry-After": "60" },
    });
  }

  // 2. High-speed Redis destination cache lookup
  let destinationData: DestinationCachePayload | null = await getCachedDestination(slug);

  // 3. Multi-tier authoritative lookup on cache miss
  if (!destinationData) {
    // 3a. Convex primary
    try {
      const convexQr = await convexClient.query(api.qrCodes.getByShortCode, {
        shortCode: slug,
      });
      if (convexQr && convexQr.destinationUrl) {
        destinationData = {
          qrId: convexQr.qrId,
          organizationId: convexQr.organizationId,
          name: convexQr.name,
          status: convexQr.status as "ACTIVE" | "PAUSED" | "ARCHIVED",
          destinationUrl: convexQr.destinationUrl,
          version: convexQr.version,
        };
      }
    } catch {}

    // 3b. Prisma cutover fallback
    if (!destinationData) {
      const qr = await db.qrCode.findFirst({
        where: {
          OR: [{ slug }, { shortCode: slug }],
          deletedAt: null,
        },
        include: { destinations: { where: { isCurrent: true }, take: 1 } },
      });

      if (qr && qr.destinations[0]?.url) {
        destinationData = {
          qrId: qr.id,
          organizationId: qr.organizationId || "default-org",
          name: qr.name,
          status: qr.status as "ACTIVE" | "PAUSED" | "ARCHIVED",
          destinationUrl: qr.destinations[0].url,
          version: qr.destinations[0].version || 1,
        };
      }
    }

    if (!destinationData) {
      return new NextResponse(renderNotFound(slug), {
        status: 404,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Cache in Redis for sub-5ms future lookups
    await setCachedDestination(slug, destinationData, 600);
  }

  // 4. Non-active states: show editorial fallback page (never leak destination).
  if (destinationData.status === "PAUSED") {
    return new NextResponse(renderPaused(destinationData.name, destinationData.qrId), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }
  if (destinationData.status === "ARCHIVED") {
    return new NextResponse(renderArchived(destinationData.name, destinationData.qrId), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  const destination = destinationData.destinationUrl;
  if (!destination) {
    return new NextResponse(renderUnavailable(destinationData.name), {
      status: 503,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Record scan WITHOUT blocking the redirect. If analytics fails, redirect
  // still succeeds (hard invariant). Real edge geo only — never fake data.
  const ua = req.headers.get("user-agent");
  const dev = parseUserAgent(ua);
  const geo = extractEdgeGeo(req.headers);
  const visitorKey = computeVisitorKey(ip, ua);
  const bot = isSuspectedBot(ua);
  const referrer = req.headers.get("referer");

  // non-blocking analytics write
  void recordScan({
    qrId: qr.id,
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
    userAgent: (ua || "").slice(0, 240),
    referrerDomain: referrer ? new URL(referrer, "https://unknown.domain").hostname : null,
    referrer,
    suspectedBot: bot,
    source: "REAL",
  });

  return NextResponse.redirect(destination, { status: 302 });
}

async function recordScan(input: {
  qrId: string;
  deviceType: string;
  os: string;
  osFamily: string;
  browser: string;
  browserFamily: string;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  regionCode: string | null;
  city: string | null;
  visitorKey: string;
  ipHash: string;
  userAgent: string;
  referrerDomain: string | null;
  referrer: string | null;
  suspectedBot: boolean;
  source: string;
}) {
  try {
    await db.scanEvent.create({ data: input });
  } catch {
    // Analytics failure must never break the redirect. Swallow.
  }
}

/* --------------------------- Editorial fallback pages ---------------------------- */

function shell(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
  :root{--paper:#ece3d2;--paper-3:#faf4e8;--ink:#2b2721;--ink-2:#4a4339;--ink-muted:#8a8173;--terracotta:#a85d3e;--botanical:#5f6b4f;--rule:rgba(43,39,33,.16);}
  *{box-sizing:border-box}html,body{margin:0;padding:0;height:100%}
  body{font-family:Georgia,'Times New Roman',serif;background:var(--paper);color:var(--ink);display:flex;align-items:center;justify-content:center;padding:2rem}
  .card{max-width:540px;background:var(--paper-3);border:1px solid var(--rule);padding:2.5rem 2.25rem;box-shadow:0 30px 60px -40px rgba(43,39,33,.5)}
  .eyebrow{font-size:.6875rem;letter-spacing:.22em;text-transform:uppercase;color:var(--ink-muted);margin:0 0 1rem 0}
  h1{font-family:Georgia,serif;font-weight:400;font-size:1.875rem;line-height:1.1;margin:0 0 1rem 0;letter-spacing:.01em}
  p{font-size:1.0625rem;line-height:1.6;color:var(--ink-2);margin:0 0 1rem 0}
  .report{margin-top:1.75rem;font-size:.8125rem;color:var(--ink-muted)}
  .report a{color:var(--ink);text-underline-offset:3px}
  .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--terracotta);margin-right:.5rem;vertical-align:middle}
</style></head>
<body><main class="card">${body}</main></body></html>`;
}

function renderPaused(name: string, qrId: string): string {
  return shell(
    "QR paused",
    `<p class="eyebrow"><span class="dot"></span>Paused</p>
     <h1>This QR is taking a break.</h1>
     <p>The owner of <em>${escapeHtml(name)}</em> has temporarily paused this QR code. It will resume redirecting when they bring it back.</p>
     <p class="report">Think this QR is being misused? <a href="/api/report?qr=${encodeURIComponent(
       qrId
     )}" style="color:var(--ink)">Report this QR</a>.</p>`
  );
}

function renderArchived(name: string, qrId: string): string {
  return shell(
    "QR archived",
    `<p class="eyebrow">Archived</p>
     <h1>This QR has been retired.</h1>
     <p><em>${escapeHtml(
       name
     )}</em> is no longer active. The owner has archived it and it will no longer redirect.</p>
     <p class="report">Think this QR is being misused? <a href="/api/report?qr=${encodeURIComponent(
       qrId
     )}" style="color:var(--ink)">Report this QR</a>.</p>`
  );
}

function renderNotFound(slug: string): string {
  return shell(
    "QR not found",
    `<p class="eyebrow">Not found</p>
     <h1>This QR doesn't lead anywhere.</h1>
     <p>We couldn't find a QR for <code>${escapeHtml(slug)}</code>. It may have been removed, or the link may be incomplete.</p>
     <p class="report"><a href="/" style="color:var(--ink)">Go to Mr.QR →</a></p>`
  );
}

function renderUnavailable(name: string): string {
  return shell(
    "QR unavailable",
    `<p class="eyebrow">Temporarily unavailable</p>
     <h1>This QR is temporarily unavailable.</h1>
     <p><em>${escapeHtml(
       name
     )}</em> is active but has no destination set right now. Please try again shortly.</p>`
  );
}

function renderRateLimited(): string {
  return shell(
    "Slow down",
    `<p class="eyebrow">Slow down</p>
     <h1>A little too quick.</h1>
     <p>You've scanned this QR a lot recently. Please wait a moment and try again.</p>`
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
