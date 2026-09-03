"use client";

import * as React from "react";
import QRCodeStyling from "qr-code-styling";
import { buildQrOptions } from "@/lib/qr/generate";
import type { QrDesignConfig } from "@/lib/qr/types";
import { cn } from "@/lib/utils";
import { DeckledEdge } from "@/components/studio/primitives";

export interface QRPreviewHandle {
  download: (format: "png" | "svg", size?: number, name?: string) => void;
  getDataUrl: (size?: number) => Promise<string | null>;
  toCanvas: (size?: number) => Promise<HTMLCanvasElement | null>;
}

interface QRPreviewProps {
  data: string;
  config: QrDesignConfig;
  size?: number;
  className?: string;
  withFrame?: boolean;
}

export const QRPreview = React.forwardRef<QRPreviewHandle, QRPreviewProps>(
  function QRPreview({ data, config, size = 320, className, withFrame = true }, ref) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const qrRef = React.useRef<QRCodeStyling | null>(null);
    const optsRef = React.useRef(config);

    // init
    React.useEffect(() => {
      const qr = new QRCodeStyling({
        ...buildQrOptions(data, config, size),
        // jsdom fallback during build
        ...(typeof window === "undefined" ? {} : {}),
      });
      qrRef.current = qr;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        qr.append(containerRef.current);
      }
      optsRef.current = config;
    }, []);

    // update on data/config change
    React.useEffect(() => {
      if (!qrRef.current) return;
      qrRef.current.update(buildQrOptions(data, config, size));
      optsRef.current = config;
    }, [data, config, size]);

    // download / export handlers
    React.useImperativeHandle(ref, () => ({
      download: (format, customSize, name) => {
        if (!qrRef.current) return;
        const s = customSize ?? size;
        qrRef.current.update(buildQrOptions(data, config, s));
        // small delay so update applies
        setTimeout(() => {
          qrRef.current?.download({
            name: name || "qr-studio",
            extension: format,
          });
          // restore preview size
          qrRef.current?.update(buildQrOptions(data, config, size));
        }, 60);
      },
      getDataUrl: async (customSize) => {
        if (!qrRef.current) return null;
        const s = customSize ?? size;
        await qrRef.current.update(buildQrOptions(data, config, s));
        return new Promise((resolve) => {
          setTimeout(async () => {
            const blob = (await qrRef.current?.getRawData("png")) as Blob | null;
            if (!blob) {
              resolve(null);
              return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
            // restore
            setTimeout(() => {
              qrRef.current?.update(buildQrOptions(data, config, size));
            }, 0);
          }, 60);
        });
      },
      toCanvas: async (customSize) => {
        const s = customSize ?? size;
        await qrRef.current?.update(buildQrOptions(data, config, s));
        return new Promise((resolve) => {
          setTimeout(() => {
            const canvas = containerRef.current?.querySelector("canvas");
            resolve((canvas as HTMLCanvasElement) || null);
            setTimeout(() => {
              qrRef.current?.update(buildQrOptions(data, config, size));
            }, 0);
          }, 60);
        });
      },
    }));

    return (
      <div className={cn("relative", className)}>
        {withFrame && config.frame === "scan-me" ? (
          <ScanMeFrame>
            <InnerQR containerRef={containerRef} />
          </ScanMeFrame>
        ) : withFrame && config.frame === "simple" ? (
          <SimpleFrame>
            <InnerQR containerRef={containerRef} />
          </SimpleFrame>
        ) : (
          <InnerQR containerRef={containerRef} />
        )}
      </div>
    );
  }
);

function InnerQR({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={containerRef}
      className="qr-mount flex items-center justify-center [&_canvas]:!w-full [&_canvas]:!h-auto [&_svg]:!w-full [&_svg]:!h-auto"
      style={{ aspectRatio: "1 / 1", width: "100%" }}
      aria-label="QR code preview"
      role="img"
    />
  );
}

function SimpleFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="p-3 border-2"
      style={{
        borderColor: "var(--ink)",
        borderRadius: 4,
        background: "var(--paper-3)",
      }}
    >
      {children}
      <DeckledEdge className="mt-3 text-[var(--ink-muted)]" />
      <div className="eyebrow text-center mt-1 text-[var(--ink)] tracking-[0.3em]">
        Scan
      </div>
    </div>
  );
}

function ScanMeFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative p-4 pt-6"
      style={{
        border: "2px solid var(--ink)",
        borderRadius: 6,
        background: "var(--paper-3)",
      }}
    >
      <div className="eyebrow text-center mb-3 text-[var(--ink)] tracking-[0.36em]">
        Scan Me
      </div>
      {children}
      <DeckledEdge className="mt-4 text-[var(--ink-muted)]" />
    </div>
  );
}
