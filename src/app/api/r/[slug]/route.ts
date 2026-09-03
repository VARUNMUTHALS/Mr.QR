import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  parseUserAgent,
  approximateGeo,
  hashIp,
  getIp,
  rateLimit,
} from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Light rate limiting on redirects (per IP) to slow abuse.
  const ip = getIp(req);
  const rl = rateLimit(`r:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return new NextResponse(renderRateLimited(), {
      status: 429,
      headers: { "Content-Type": "text/html", "Retry-After": "60" },
    });
  }

  const qr = await db.qrCode.findUnique({
    where: { slug },
    include: { destinations: { where: { isCurrent: true }, take: 1 } },
  });

  if (!qr) {
    return new NextResponse(renderNotFound(slug), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Non-active states: show editorial fallback page (never leak destination).
  if (qr.status === "PAUSED") {
    return new NextResponse(renderPaused(qr.name, qr.id), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }
  if (qr.status === "ARCHIVED") {
    return new NextResponse(renderArchived(qr.name, qr.id), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  const destination = qr.destinations[0]?.url;
  if (!destination) {
    return new NextResponse(renderUnavailable(qr.name), {
      status: 503,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Record scan WITHOUT blocking the redirect. If analytics fails, redirect
  // still succeeds (hard requirement).
  const ua = req.headers.get("user-agent");
  const dev = parseUserAgent(ua);
  const seed = `${ip}-${qr.slug}`;
  const geo = approximateGeo(seed);
  const referrer = req.headers.get("referer");

  // fire-and-forget analytics write
  void recordScan({
    qrId: qr.id,
    deviceType: dev.deviceType,
    os: dev.os,
    browser: dev.browser,
    country: geo.country,
    region: geo.region,
    city: geo.city,
    ipHash: hashIp(ip),
    userAgent: (ua || "").slice(0, 240),
    referrer,
  });

  return NextResponse.redirect(destination, { status: 302 });
}

async function recordScan(input: {
  qrId: string;
  deviceType: string;
  os: string;
  browser: string;
  country: string;
  region: string;
  city: string;
  ipHash: string;
  userAgent: string;
  referrer: string | null;
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
     <p class="report"><a href="/" style="color:var(--ink)">Go to QR Studio →</a></p>`
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
