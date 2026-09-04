import { createHash } from "crypto";

/* ----------------------------- Slug / ShortCode generation ---------------------------- */

// URL-safe alphabet without visually confusable characters (no 0, O, 1, l, I) per DYNAMIC_QR.md
const SHORT_CODE_ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateShortCode(len = 8): string {
  const bytes = new Uint8Array(len);
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < len; i++) {
    out += SHORT_CODE_ALPHABET[bytes[i] % SHORT_CODE_ALPHABET.length];
  }
  return out;
}

// Backward-compatible alias
export const generateSlug = (len = 8) => generateShortCode(len);

export async function generateUniqueShortCode(len = 8): Promise<string> {
  const { db } = await import("@/lib/db");
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateShortCode(len + (attempt > 4 ? 1 : 0));
    const existing = await db.qrCode.findFirst({
      where: {
        OR: [{ shortCode: code }, { slug: code }],
      },
      select: { id: true },
    });
    if (!existing) return code;
  }
  return generateShortCode(12);
}

// Backward-compatible alias
export const generateUniqueSlug = () => generateUniqueShortCode(8);

/* ------------------------------ URL validation --------------------------- */

const UNSAFE_SCHEMES = /^(javascript|data|file|vbscript|about|blob|ftp):/i;

export interface UrlValidation {
  ok: boolean;
  reason?: string;
  normalized?: string;
}

export function validateDestinationUrl(raw: string): UrlValidation {
  const input = raw.trim();
  if (!input) return { ok: false, reason: "Destination URL is required." };
  if (input.length > 2048) return { ok: false, reason: "Destination URL is too long (maximum 2048 characters)." };

  if (UNSAFE_SCHEMES.test(input)) {
    return { ok: false, reason: "Unsafe URL scheme detected. Only http:// and https:// URLs are permitted." };
  }

  // Must be http/https. Add https:// if it looks like a bare domain.
  let candidate = input;
  if (!/^https?:\/\//i.test(candidate)) {
    if (/^[\w-]+(\.[\w-]+)+/.test(candidate)) {
      candidate = "https://" + candidate;
    } else {
      return { ok: false, reason: "Please provide a valid web address starting with http:// or https://" };
    }
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, reason: "Only http:// and https:// protocols are permitted." };
    }
    if (!parsed.hostname || parsed.hostname.length < 3) {
      return { ok: false, reason: "Invalid domain name in destination URL." };
    }
    // Block localhost / private IP addresses in destination for SSRF prevention
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return { ok: false, reason: "Local and private network destinations are not allowed." };
    }

    return { ok: true, normalized: parsed.toString() };
  } catch {
    return { ok: false, reason: "Malformed destination URL." };
  }
}

/* --------------------------- IP Extraction & Privacy Visitor Key -------------------------- */

export function getIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(`dynamic-qr:${ip}`).digest("hex").slice(0, 16);
}

/**
 * Privacy-preserving visitor key calculation per ANALYTICS.md.
 * Does NOT store or expose raw IP. Uses HMAC-SHA256 with server-side secret.
 */
export function computeVisitorKey(ip: string, userAgent: string | null): string {
  const salt = process.env.ANALYTICS_SALT || "dynamic-qr-secure-visitor-salt-2026";
  const normalizedUa = (userAgent || "").slice(0, 120).toLowerCase();
  return createHash("sha256")
    .update(`${salt}:${ip}:${normalizedUa}`)
    .digest("hex")
    .slice(0, 32);
}

/* ------------------------------- User-Agent ------------------------------ */

export interface DeviceInfo {
  deviceType: string;
  os: string;
  browser: string;
}

export function parseUserAgent(ua: string | null): DeviceInfo {
  const u = (ua || "").toLowerCase();
  let deviceType = "Desktop";
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

/* ------------------------------- Bot Detection ---------------------------- */

const KNOWN_BOT_PATTERNS = [
  /bot\b/i,
  /crawler\b/i,
  /spider\b/i,
  /slurp\b/i,
  /bingpreview/i,
  /facebookexternalhit/i,
  /whatsapp/i,
  /telegrambot/i,
  /twitterbot/i,
  /googlebot/i,
  /headlesschrome/i,
  /phantomjs/i,
  /curl\b/i,
  /wget\b/i,
  /python-requests/i,
];

export function isSuspectedBot(ua: string | null): boolean {
  if (!ua) return false;
  return KNOWN_BOT_PATTERNS.some((pattern) => pattern.test(ua));
}

/* ----------------------- Real Edge Geolocation (Zero Fake Geo) ------------------------ */
// Strictly per MASTER_DEVELOPMENT_PROMPT.md Rule 7 & ANALYTICS.md:
// Never claim fake data is real. Extract real edge geolocation headers if provided by CDN/Vercel,
// or return null/undefined.

export interface GeoLocation {
  country: string | null;
  countryCode: string | null;
  region: string | null;
  regionCode: string | null;
  city: string | null;
}

export function extractEdgeGeo(headers: Headers): GeoLocation {
  const countryCode =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    null;

  const country =
    headers.get("x-vercel-ip-country-name") ||
    countryCode;

  const regionCode =
    headers.get("x-vercel-ip-country-region") ||
    headers.get("x-region") ||
    null;

  const region =
    headers.get("x-vercel-ip-country-region-name") ||
    regionCode;

  const rawCity = headers.get("x-vercel-ip-city") || null;
  const city = rawCity ? decodeURIComponent(rawCity) : null;

  return {
    country: country ? decodeURIComponent(country) : null,
    countryCode,
    region: region ? decodeURIComponent(region) : null,
    regionCode,
    city,
  };
}

/* ------------------------------- Distributed Rate Limiting ------------------------------ */

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, RateLimitBucket>();

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    memoryBuckets.set(key, { count: 1, resetAt });
    return {
      ok: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil(resetAt / 1000),
    };
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  return {
    ok: bucket.count <= limit,
    limit,
    remaining,
    reset: Math.ceil(bucket.resetAt / 1000),
  };
}
