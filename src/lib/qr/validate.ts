import { contrastRatio } from "./generate";
import type { QrDesignConfig, ValidationIssue } from "./types";

export interface ValidateInput {
  content: string;
  config: QrDesignConfig;
}

export function validateQr({
  content,
  config,
}: ValidateInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!content.trim()) {
    issues.push({ level: "error", message: "Add a URL or text to encode first." });
  }
  if (content.length > 1200) {
    issues.push({
      level: "warning",
      message:
        "Long content makes denser QR codes that are harder to scan. Consider shortening it.",
    });
  }

  // Contrast
  const ratio = contrastRatio(config.fgColor, config.bgColor);
  if (ratio < 3) {
    issues.push({
      level: "error",
      message:
        "Foreground and background are too similar — this QR will not scan reliably.",
      fix: "Choose a darker foreground or a lighter background.",
    });
  } else if (ratio < 4.5) {
    issues.push({
      level: "warning",
      message:
        "Contrast is a little low. Aim for stronger contrast for reliable scanning.",
      fix: "Darken the foreground or lighten the background.",
    });
  }

  // Quiet zone
  if (config.quietZone < 2) {
    issues.push({
      level: "warning",
      message:
        "Quiet zone is narrow — scanners may struggle near borders and frames.",
      fix: "Increase the quiet zone to at least 2–4 modules.",
    });
  }

  // Logo size
  if (config.logoDataUrl && config.logoSize > 0.3) {
    issues.push({
      level: "warning",
      message:
        "Your logo is large enough to reduce scan reliability.",
      fix: "Reduce the logo size, or raise error correction to High.",
    });
  }

  // Logo + low error correction
  if (config.logoDataUrl && config.errorCorrection === "L") {
    issues.push({
      level: "warning",
      message:
        "A logo covers part of the QR. Use at least Medium (M) error correction.",
      fix: "Set error correction to Medium or High.",
    });
  }

  // Frame + low quiet zone
  if (config.frame !== "none" && config.quietZone < 3) {
    issues.push({
      level: "warning",
      message:
        "A frame needs breathing room around the QR. Increase the quiet zone.",
      fix: "Raise the quiet zone to at least 3 modules.",
    });
  }

  return issues;
}

export function autoFixConfig(config: QrDesignConfig): QrDesignConfig {
  const next: QrDesignConfig = { ...config };
  // Raise error correction if a logo is present
  if (next.logoDataUrl) {
    next.errorCorrection = next.errorCorrection === "L" || next.errorCorrection === "M" ? "H" : next.errorCorrection;
  }
  // Quiet zone
  if (next.quietZone < 2) next.quietZone = 4;
  if (next.frame !== "none" && next.quietZone < 3) next.quietZone = 4;
  // Logo size
  if (next.logoDataUrl && next.logoSize > 0.3) next.logoSize = 0.24;
  return next;
}
