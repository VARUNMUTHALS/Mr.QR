const DISALLOWED_SCHEMES = [
  "javascript:",
  "data:",
  "file:",
  "vbscript:",
  "blob:",
];

const DISALLOWED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254", // AWS/GCP metadata service
  "metadata.google.internal",
];

export function validateDestinationUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new Error("Destination URL is required");
  }

  const lower = trimmed.toLowerCase();
  for (const scheme of DISALLOWED_SCHEMES) {
    if (lower.startsWith(scheme)) {
      throw new Error(`Forbidden URL protocol: ${scheme}`);
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Destination URL must use http: or https: protocol");
  }

  const host = parsed.hostname.toLowerCase();
  for (const badHost of DISALLOWED_HOSTNAMES) {
    if (host === badHost || host.endsWith(`.${badHost}`)) {
      throw new Error("Private or loopback destination hosts are prohibited for security");
    }
  }

  // Check RFC1918 private ranges (10.x, 172.16-31.x, 192.168.x)
  if (
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
  ) {
    throw new Error("Private network IP addresses cannot be set as QR destinations");
  }

  return parsed.toString();
}
