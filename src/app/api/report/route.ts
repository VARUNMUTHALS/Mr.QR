import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getIp } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit(`report:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many reports. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const qrId = String(body.qrId || "").trim();
  const reason = String(body.reason || "").trim().slice(0, 1000);

  if (!qrId) return NextResponse.json({ error: "Missing QR id." }, { status: 400 });

  // Store as an activity log entry with action REPORTED (no user required).
  const qr = await db.qrCode.findUnique({
    where: { id: qrId },
    select: { id: true, slug: true },
  });
  if (!qr) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await db.activityLog.create({
    data: {
      qrId: qr.id,
      userId: null,
      action: "REPORTED",
      metadata: JSON.stringify({ reason, ipHash: ip.slice(0, 8) }),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const qrId = req.nextUrl.searchParams.get("qr");
  if (!qrId) return NextResponse.json({ error: "Missing qr." }, { status: 400 });
  // simple confirmation page
  return new NextResponse(reportPage(), {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}

function reportPage(): string {
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Report submitted</title>
<style>body{font-family:Georgia,serif;background:#ece3d2;color:#2b2721;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:2rem}
.c{max-width:480px;background:#faf4e8;border:1px solid rgba(43,39,33,.16);padding:2.5rem 2.25rem}h1{font-weight:400;margin:0 0 1rem}p{line-height:1.6;color:#4a4339}a{color:#2b2721}</style></head>
<body><main class="c"><h1>Report received.</h1><p>Thank you. We've logged this QR for review and will take action if it violates our policies.</p><p><a href="/">Return to Mr.QR →</a></p></main></body></html>`;
}
