"use client";

// Client-safe URL validation. Mirrors the server-side validator but without
// importing server-only crypto modules. SSRF protection is enforced on the
// server.

const UNSAFE_SCHEMES = /^(javascript|data|file|vbscript|about|blob|ftp|mailto|tel):/i;

export interface UrlValidation {
  ok: boolean;
  reason?: string;
  normalized?: string;
}

export function validateDestinationUrl(raw: string): UrlValidation {
  const input = (raw || "").trim();
  if (!input) return { ok: false, reason: "Destination is empty." };
  if (input.length > 2048) return { ok: false, reason: "Destination is too long." };

  let candidate = input;
  if (!/^https?:\/\//i.test(candidate)) {
    if (/^[\w-]+(\.[\w-]+)+/.test(candidate)) {
      candidate = "https://" + candidate;
    } else {
      return { ok: false, reason: "That doesn't look like a valid web address." };
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

  return { ok: true, normalized: url.toString() };
}
