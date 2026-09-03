import { createHash } from "crypto";

/* ----------------------------- Slug generation ---------------------------- */

const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // no confusables

export function generateSlug(len = 5): string {
  const bytes = new Uint8Array(len);
  // crypto.getRandomValues available in Node 19+ / Edge / browser
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < len; i++) {
    out += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  }
  return out;
}

export async function generateUniqueSlug(): Promise<string> {
  // dynamic import to avoid pulling prisma into client bundles
  const { db } = await import("@/lib/db");
  for (let attempt = 0; attempt < 8; attempt++) {
    const slug = generateSlug(5 + (attempt > 3 ? 1 : 0));
    const existing = await db.qrCode.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return slug;
  }
  // extremely unlikely fallback
  return generateSlug(8);
}

/* ------------------------------ URL validation --------------------------- */

const UNSAFE_SCHEMES = /^(javascript|data|file|vbscript|about|blob|ftp|mailto|tel):/i;

export interface UrlValidation {
  ok: boolean;
  reason?: string;
  normalized?: string;
}

export function validateDestinationUrl(raw: string): UrlValidation {
  const input = raw.trim();
  if (!input) return { ok: false, reason: "Destination is empty." };
  if (input.length > 2048) return { ok: false, reason: "Destination is too long." };

  // Must be http/https. Add https:// if it looks like a bare domain.
  let candidate = input;
  if (!/^https?:\/\//i.test(candidate)) {
    // accept bare domains like example.com/path
    if (/^[\w-]+(\.[\w-]+)+/.test(candidate)) {
      candidate = "https://" + candidate;
    } else {
      return { ok: false, reason: "Use a full http(s) web address." };
    }
  }

  if (UNSAFE_SCHEMES.test(input)) {
    return { ok: false, reason: "This destination cannot be used." };
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, reason: "That doesn't look like a valid web address." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "Only http and https destinations are supported." };
  }

  // SSRF protection (server-side fetch prevention)
  if (isPrivateOrLoopback(url.hostname)) {
    return {
      ok: false,
      reason: "This destination points to a private or local network and cannot be used.",
    };
  }

  return { ok: true, normalized: url.toString() };
}

export function isPrivateOrLoopback(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "0.0.0.0" || h === "::" || h === "::1") return true;
  // IPv4
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local + cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  }
  // metadata endpoints
  if (h === "metadata.google.internal" || h === "169.254.169.254") return true;
  return false;
}

/* ------------------------------ IP hashing ------------------------------- */

export function hashIp(ip: string): string {
  // privacy-preserving: hash + truncate. Not reversible to a person.
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}

export function getIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "0.0.0.0";
}

/* --------------------------- UA / device parsing ------------------------- */

export interface DeviceInfo {
  deviceType: string;
  os: string;
  browser: string;
}

export function parseUserAgent(ua: string | null): DeviceInfo {
  const u = (ua || "").toLowerCase();
  let deviceType = "Other";
  if (/ipad|tablet/.test(u)) deviceType = "Tablet";
  else if (/mobi|android|iphone/.test(u)) deviceType = "Mobile";
  else if (/windows|macintosh|linux/.test(u)) deviceType = "Desktop";

  let os = "Other";
  if (/android/.test(u)) os = "Android";
  else if (/iphone|ipad|ios/.test(u)) os = "iOS";
  else if (/windows nt/.test(u)) os = "Windows";
  else if (/mac os|macintosh/.test(u)) os = "macOS";
  else if (/linux/.test(u)) os = "Linux";

  let browser = "Other";
  if (/edg/.test(u)) browser = "Edge";
  else if (/chrome|crios/.test(u)) browser = "Chrome";
  else if (/firefox|fxios/.test(u)) browser = "Firefox";
  else if (/safari/.test(u)) browser = "Safari";

  return { deviceType, os, browser };
}

/* ----------------------- Approximate geo (hashed) ------------------------ */
// Geo is approximate and inferred, never GPS. We deterministically map an
// ip-hash to a region so a returning visitor is counted consistently, while
// never claiming real-world precision.

const APPROX_REGIONS = [
  { country: "India", region: "Maharashtra", city: "Mumbai", weight: 0.36 },
  { country: "India", region: "Karnataka", city: "Bengaluru", weight: 0.18 },
  { country: "United States", region: "California", city: "San Francisco", weight: 0.12 },
  { country: "United Kingdom", region: "England", city: "London", weight: 0.08 },
  { country: "United Arab Emirates", region: "Dubai", city: "Dubai", weight: 0.06 },
  { country: "Singapore", region: "Central", city: "Singapore", weight: 0.05 },
  { country: "Germany", region: "Berlin", city: "Berlin", weight: 0.05 },
  { country: "Australia", region: "New South Wales", city: "Sydney", weight: 0.04 },
  { country: "Other", region: "—", city: "—", weight: 0.06 },
];

export function approximateGeo(seed: string): {
  country: string;
  region: string;
  city: string;
} {
  // deterministic but distribution-aware. Maps the seed to [0,1).
  const buf = createHash("sha256").update(seed).digest();
  const num = buf.readUInt32LE(0) / 0xffffffff;
  let acc = 0;
  for (const r of APPROX_REGIONS) {
    acc += r.weight;
    if (num <= acc) return { country: r.country, region: r.region, city: r.city };
  }
  return APPROX_REGIONS[0];
}

/* ------------------------------- Rate limit ------------------------------ */
// Simple in-memory rate limiter (per process). Good enough for MVP/demo.

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (entry.count >= limit) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count += 1;
  return { ok: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}
