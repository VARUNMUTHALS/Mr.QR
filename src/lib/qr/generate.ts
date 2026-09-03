import type { Options } from "qr-code-styling";
import type { QrDesignConfig, QrPattern, QrEyeSquare } from "./types";

const patternMap: Record<QrPattern, string> = {
  square: "square",
  rounded: "rounded",
  dot: "dots",
  classy: "classy",
  "extra-rounded": "extra-rounded",
};

const eyeSquareMap: Record<QrEyeSquare, string> = {
  square: "square",
  dot: "dot",
  "extra-rounded": "extra-rounded",
};

export function buildQrOptions(
  data: string,
  config: QrDesignConfig,
  size = 320
): Options {
  const base: Options = {
    data: data || " ",
    width: size,
    height: size,
    type: "svg",
    margin: config.quietZone,
    qrOptions: {
      errorCorrectionLevel: config.errorCorrection,
    },
    dotsOptions: {
      type: patternMap[config.pattern] as Options["dotsOptions"] extends
        | { type?: infer T }
        ? T
        : never,
      color: config.fgColor,
    },
    cornersSquareOptions: {
      type: eyeSquareMap[config.eyeSquare] as Options["cornersSquareOptions"] extends
        | { type?: infer T }
        ? T
        : never,
      color: config.fgColor,
    },
    cornersDotOptions: {
      type: config.eyeDot === "dot" ? "dot" : "square",
      color: config.fgColor,
    },
    backgroundOptions: {
      color: config.bgColor,
    },
    image: config.logoDataUrl || undefined,
    imageOptions: {
      crossOrigin: "anonymous",
      margin: config.logoMargin,
      imageSize: config.logoSize,
      hideBackgroundDots: true,
      ...(config.logoRounded ? { radius: 0.5 } : {}),
    },
  };
  return base;
}

// Convert "#rrggbb" to {r,g,b}
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

// Relative luminance per WCAG
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

export function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function suggestCorrection(hasLogo: boolean): "L" | "M" | "Q" | "H" {
  return hasLogo ? "H" : "M";
}
