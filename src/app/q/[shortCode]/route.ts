import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  parseUserAgent,
  extractEdgeGeo,
  computeVisitorKey,
  isSuspectedBot,
  hashIp,
  getIp,
  rateLimit,
} from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;

  // Rate limiting per client IP (120 requests/minute)
  const ip = getIp(req);
  const rl = rateLimit(`q:${ip}`, 120, 60_000);
  if (!rl.ok) {
    return new NextResponse(renderRateLimited(), {
      status: 429,
      headers: {
        "Content-Type": "text/html",
        "Retry-After": "60",
        "X-RateLimit-Limit": String(rl.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(rl.reset),
      },
    });
  }

  // Lookup active QR by shortCode (or legacy slug fallback)
  const qr = await db.qrCode.findFirst({
    where: {
      OR: [{ shortCode }, { slug: shortCode }],
      deletedAt: null,
    },
    include: {
      destinations: {
        where: { isCurrent: true },
        take: 1,
      },
    },
  });

  if (!qr) {
    return new NextResponse(renderNotFound(shortCode), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Handle status controls (never leak destination if not active)
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

  // Real scan tracking: Non-blocking write. If analytics fails, redirect still succeeds.
  const ua = req.headers.get("user-agent");
  const dev = parseUserAgent(ua);
  const geo = extractEdgeGeo(req.headers);
  const visitorKey = computeVisitorKey(ip, ua);
  const bot = isSuspectedBot(ua);
  const referrer = req.headers.get("referer");

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

  return NextResponse.redirect(destination, {
    status: 302,
    headers: {
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
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
    // Hard invariant: analytics failure must never block redirect
  }
}

/* --------------------------- Editorial fallback pages ---------------------------- */

function shell(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(title)} — Mr.QR</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{--paper:#FBF8F2;--paper-card:#F4EFE6;--ink:#1F2328;--ink-muted:#656D76;--terracotta:#C85A32;--botanical:#2D5A43;--border:#E6DFD3}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:'Inter',system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.card{background:var(--paper-card);border:1px solid var(--border);border-radius:12px;padding:48px 40px;max-width:480px;width:100%;box-shadow:0 4px 20px rgba(0,0,0,0.04);text-align:left}
.eyebrow{font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:16px;display:block}
h1{font-family:'Newsreader',serif;font-size:36px;font-weight:400;line-height:1.1;color:var(--ink);margin-bottom:16px}
h1 em{font-style:italic;color:var(--terracotta)}
p{font-size:15px;line-height:1.6;color:var(--ink-muted);margin-bottom:28px}
.foot{font-size:12px;color:var(--ink-muted);border-top:1px solid var(--border);padding-top:20px;display:flex;justify-content:space-between;align-items:center}
.btn{display:inline-block;background:var(--ink);color:var(--paper);padding:10px 18px;border-radius:6px;font-size:13px;font-weight:500;text-decoration:none;transition:opacity .15s}
.btn:hover{opacity:.85}
.btn-sec{background:transparent;color:var(--ink);border:1px solid var(--border);margin-left:8px}
</style>
</head><body><main class="card">${body}</main></body></html>`;
}

function renderNotFound(code: string): string {
  return shell(
    "QR Code Not Found",
    `<span class="eyebrow">Studio · Resolver</span>
<h1>Code <em>not found.</em></h1>
<p>The code <strong>${escapeHtml(code)}</strong> doesn't correspond to an active QR in this studio.</p>
<div class="foot"><span>Mr.QR</span><a href="/" class="btn">Create your own</a></div>`
  );
}

function renderPaused(name: string, id: string): string {
  return shell(
    "QR Paused",
    `<span class="eyebrow">Studio · Paused</span>
<h1>Temporarily <em>paused.</em></h1>
<p><strong>${escapeHtml(name)}</strong> is currently paused by its author. Check back soon.</p>
<div class="foot"><span>Dynamic QR</span><a href="/api/report?qr=${encodeURIComponent(id)}" class="btn btn-sec">Report</a></div>`
  );
}

function renderArchived(name: string, id: string): string {
  return shell(
    "QR Retired",
    `<span class="eyebrow">Studio · Archive</span>
<h1>This plate has been <em>retired.</em></h1>
<p><strong>${escapeHtml(name)}</strong> was archived and is no longer redirecting visitors.</p>
<div class="foot"><span>Dynamic QR</span><a href="/api/report?qr=${encodeURIComponent(id)}" class="btn btn-sec">Report</a></div>`
  );
}

function renderUnavailable(name: string): string {
  return shell(
    "Destination Pending",
    `<span class="eyebrow">Studio · Idle</span>
<h1>Destination <em>pending.</em></h1>
<p><strong>${escapeHtml(name)}</strong> has not had a destination assigned yet.</p>
<div class="foot"><span>Dynamic QR</span><a href="/" class="btn">Studio Home</a></div>`
  );
}

function renderRateLimited(): string {
  return shell(
    "Too Many Requests",
    `<span class="eyebrow">Studio · Notice</span>
<h1>Pacing <em>visitor scans.</em></h1>
<p>Too many redirect requests were made in a short interval. Please pause for a moment and try again.</p>
<div class="foot"><span>Rate limited</span><a href="/" class="btn">Studio Home</a></div>`
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
