// QR design + content configuration types shared across the app.

export type QrPattern = "square" | "rounded" | "dot" | "classy" | "extra-rounded";
export type QrEyeSquare = "square" | "dot" | "extra-rounded";
export type QrEyeDot = "square" | "dot";
export type QrFrame = "none" | "simple" | "scan-me";
export type QrErrorCorrection = "L" | "M" | "Q" | "H";
export type QrType = "STATIC" | "DYNAMIC";

export interface QrDesignConfig {
  pattern: QrPattern;
  eyeSquare: QrEyeSquare;
  eyeDot: QrEyeDot;
  fgColor: string;
  bgColor: string;
  logoDataUrl?: string | null;
  logoSize: number; // 0..1 fraction of qr
  logoMargin: number; // px
  logoRounded: boolean;
  frame: QrFrame;
  quietZone: number; // modules
  errorCorrection: QrErrorCorrection;
}

export const DEFAULT_DESIGN: QrDesignConfig = {
  pattern: "square",
  eyeSquare: "square",
  eyeDot: "square",
  fgColor: "#2b2721",
  bgColor: "#faf4e8",
  logoDataUrl: null,
  logoSize: 0.22,
  logoMargin: 6,
  logoRounded: false,
  frame: "none",
  quietZone: 4,
  errorCorrection: "M",
};

export const STUDIO_PRESETS: { name: string; design: Partial<QrDesignConfig> }[] = [
  { name: "Ink", design: { fgColor: "#2b2721", bgColor: "#faf4e8" } },
  { name: "Botanical", design: { fgColor: "#5f6b4f", bgColor: "#f4ecdc" } },
  { name: "Terracotta", design: { fgColor: "#a85d3e", bgColor: "#faf4e8" } },
  { name: "Ochre", design: { fgColor: "#9a6b1f", bgColor: "#f6efe0" } },
  { name: "Slate", design: { fgColor: "#3a3f44", bgColor: "#eef0ea" } },
  { name: "Indigo Ink", design: { fgColor: "#2d2a44", bgColor: "#f1eef0" } },
];

export interface ValidationIssue {
  level: "warning" | "error";
  message: string;
  fix?: string;
}

export interface QrContentPayload {
  text: string;
  type: QrType;
  name?: string;
  slug?: string;
}
