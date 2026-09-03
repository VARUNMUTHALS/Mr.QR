"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useNav } from "@/lib/nav";
import {
  Eyebrow,
  EditorialHeading,
  InkButton,
  SectionRule,
  PaperSurface,
} from "@/components/studio/primitives";
import { QRPreview, type QRPreviewHandle } from "@/components/qr/QRPreview";
import { QRDesignPanel } from "@/components/qr/QRDesignPanel";
import { DEFAULT_DESIGN, type QrDesignConfig } from "@/lib/qr/types";
import { validateQr, autoFixConfig } from "@/lib/qr/validate";
import { useCreateQr } from "@/hooks/use-qr-api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowRight, Link2, ScanLine, Sparkles } from "lucide-react";
import { validateDestinationUrl } from "@/lib/security/client";

export function DynamicBuilderView() {
  const go = useNav((s) => s.go);
  const { toast } = useToast();
  const createQr = useCreateQr();
  const [name, setName] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [config, setConfig] = React.useState<QrDesignConfig>({
    ...DEFAULT_DESIGN,
    fgColor: "#a85d3e",
    frame: "none",
  });
  const [createdId, setCreatedId] = React.useState<string | null>(null);
  const previewRef = React.useRef<QRPreviewHandle>(null);

  const destValidation = validateDestinationUrl(destination);
  const issues = validateQr({ content: destination, config });
  const canCreate = name.trim() && destValidation.ok && !issues.some((i) => i.level === "error");

  // Once created, the QR encodes the public redirect URL.
  const redirectUrl = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/api/r/preview`;
  }, []);
  const previewData = destination ? redirectUrl : " ";

  const onCreate = async () => {
    if (!canCreate) {
      toast({
        title: "Check your details",
        description:
          !name.trim()
            ? "Give your QR a name."
            : !destValidation.ok
            ? destValidation.reason || "Invalid destination."
            : "Fix the design warnings first.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await createQr.mutateAsync({
        type: "DYNAMIC",
        name: name.trim(),
        destination: destValidation.normalized!,
        designConfig: config,
      });
      setCreatedId(res.qr.id);
      toast({
        title: "Your QR is live",
        description: "Scan it, share it, change it anytime.",
      });
    } catch (e) {
      toast({
        title: "Couldn't create the QR",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  if (createdId) {
    return <PublishScreen qrId={createdId} />;
  }

  return (
    <div className="mx-auto max-w-[1320px] px-5 sm:px-8 pb-24">
      {/* Header */}
      <div className="pt-8 sm:pt-12 pb-10">
        <div className="flex items-center gap-3 mb-5">
          <Eyebrow ink>Dynamic QR / 01</Eyebrow>
          <span className="h-px flex-1 bg-[var(--rule)]" />
          <button
            onClick={() => go({ view: "home" })}
            className="font-sans text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            ← Studio
          </button>
        </div>
        <EditorialHeading as="h1" className="text-[clamp(2rem,5vw,3.25rem)]">
          Where should it go?
        </EditorialHeading>
        <p className="mt-4 font-body text-[1rem] text-[var(--ink-2)] max-w-xl leading-relaxed">
          Name your QR and set a destination. This destination can be changed
          after your QR has been printed — the QR itself never changes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: preview */}
        <div className="lg:col-span-6 order-2 lg:order-1">
          <PaperSurface className="p-6 sm:p-8 h-full">
            <div className="flex items-center justify-between mb-6">
              <Eyebrow ink>Preview</Eyebrow>
              <span className="font-sans text-[0.6875rem] text-[var(--ink-muted)] flex items-center gap-1.5">
                <ScanLine className="h-3 w-3" /> Live
              </span>
            </div>
            <div className="relative mx-auto max-w-[420px]">
              <div
                className="relative p-6 sm:p-8"
                style={{
                  background: "var(--paper-3)",
                  boxShadow:
                    "0 1px 0 rgba(43,39,33,0.05), 0 30px 60px -40px rgba(43,39,33,0.5), inset 0 0 0 1px var(--rule)",
                }}
              >
                <QRPreview
                  ref={previewRef}
                  data={previewData}
                  config={config}
                  size={420}
                />
                <div className="mt-5 flex items-center justify-between">
                  <span className="eyebrow text-[var(--ink-muted)]">
                    {destination ? "Studio redirect" : "Awaiting destination"}
                  </span>
                  <span className="font-sans text-[0.625rem] text-[var(--ink-muted)] uppercase tracking-[0.18em]">
                    ECC {config.errorCorrection}
                  </span>
                </div>
              </div>
              <div
                aria-hidden
                className="absolute -top-2 left-1/2 -translate-x-1/2 h-5 w-16 rotate-[-3deg] opacity-70"
                style={{
                  background: "rgba(184, 137, 58, 0.35)",
                  border: "1px solid rgba(43,39,33,0.08)",
                }}
              />
            </div>

            <div className="mt-6 p-4 border border-[var(--terracotta)]/25 bg-[var(--terracotta)]/[0.05] rounded-[2px]">
              <p className="font-body text-[0.8125rem] italic leading-relaxed text-[var(--ink-2)]">
                This QR points to a stable studio URL. When scanned, it
                records the event and redirects to your destination — which you
                can rewrite whenever you like.
              </p>
            </div>
          </PaperSurface>
        </div>

        {/* Right: content + design */}
        <div className="lg:col-span-6 order-1 lg:order-2 space-y-8">
          {/* Content */}
          <PaperSurface className="p-7">
            <Eyebrow ink className="mb-5 block">
              Content
            </Eyebrow>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="qr-name" className="font-sans text-[0.8125rem] text-[var(--ink)]">
                  QR name
                </Label>
                <Input
                  id="qr-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Summer Sale Poster"
                  maxLength={80}
                  className="h-11 bg-[var(--paper-3)] border-[var(--rule-strong)] focus-visible:border-[var(--ink)] font-body text-[1.0625rem]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qr-dest" className="font-sans text-[0.8125rem] text-[var(--ink)]">
                  Where should it go?
                </Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)]" />
                  <Input
                    id="qr-dest"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="https://example.com/summer-sale"
                    className="pl-9 h-11 bg-[var(--paper-3)] border-[var(--rule-strong)] focus-visible:border-[var(--ink)] font-body text-[1.0625rem]"
                  />
                </div>
                {destination && !destValidation.ok && (
                  <p className="font-sans text-xs text-[var(--destructive)]">
                    {destValidation.reason}
                  </p>
                )}
              </div>
            </div>
            <p className="mt-5 font-body text-[0.875rem] italic leading-relaxed text-[var(--ink-muted)]">
              This destination can be changed after your QR has been printed.
            </p>
          </PaperSurface>

          {/* Design */}
          <PaperSurface className="p-7">
            <Eyebrow ink className="mb-5 block">
              Design
            </Eyebrow>
            <QRDesignPanel
              config={config}
              onChange={setConfig}
            />
            {issues.length > 0 && (
              <div className="mt-6 flex items-start gap-3 p-3 border border-[var(--ochre)]/30 bg-[var(--ochre)]/[0.06] rounded-[2px]">
                <Sparkles className="h-3.5 w-3.5 text-[var(--ochre)] mt-0.5" />
                <div className="flex-1">
                  <p className="font-sans text-xs text-[var(--ink)]">{issues[0].message}</p>
                </div>
                <InkButton
                  size="sm"
                  variant="botanical"
                  onClick={() => setConfig((c) => autoFixConfig(c))}
                >
                  Fix
                </InkButton>
              </div>
            )}
          </PaperSurface>

          <div className="flex flex-col sm:flex-row gap-3">
            <InkButton
              size="lg"
              className="flex-1"
              onClick={onCreate}
              disabled={createQr.isPending}
            >
              {createQr.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                </>
              ) : (
                <>
                  Create Dynamic QR <ArrowRight className="h-4 w-4" />
                </>
              )}
            </InkButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Publish screen ------------------------------ */

function PublishScreen({ qrId }: { qrId: string }) {
  const go = useNav((s) => s.go);
  const { data: qr } = useQrDetailLite(qrId);
  const previewRef = React.useRef<QRPreviewHandle>(null);
  const { toast } = useToast();

  const redirectUrl = qr?.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/r/${qr.slug}`
    : "";

  const onCopy = async () => {
    if (!redirectUrl) return;
    try {
      await navigator.clipboard.writeText(redirectUrl);
      toast({ title: "QR URL copied", description: redirectUrl });
    } catch {
      toast({ title: "Couldn't copy", variant: "destructive" });
    }
  };

  const onDownload = (format: "png" | "svg") => {
    previewRef.current?.download(format, 1024, `qr-studio-${qr?.slug || "dynamic"}`);
    toast({
      title: format === "png" ? "PNG prepared" : "SVG prepared",
      description: "Your QR has been downloaded.",
    });
  };

  if (!qr) {
    return (
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 pb-24 pt-24 text-center">
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-[var(--ink-muted)]" />
        <p className="mt-4 font-body text-[var(--ink-muted)]">Preparing your QR…</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-[1320px] px-5 sm:px-8 pb-24"
    >
      <div className="pt-8 sm:pt-12">
        <div className="flex items-center gap-3 mb-5">
          <Eyebrow ink>Dynamic QR / 02</Eyebrow>
          <span className="h-px flex-1 bg-[var(--rule)]" />
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--botanical)] animate-pulse" />
            <span className="eyebrow text-[var(--botanical)]">Live</span>
          </span>
        </div>
        <EditorialHeading as="h1" className="text-[clamp(2rem,5vw,3.5rem)]">
          Your QR is live.
        </EditorialHeading>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
        {/* QR */}
        <div className="lg:col-span-5">
          <PaperSurface className="p-6 sm:p-8">
            <div className="relative mx-auto max-w-[380px]">
              <div
                className="relative p-6 sm:p-8"
                style={{
                  background: "var(--paper-3)",
                  boxShadow:
                    "0 1px 0 rgba(43,39,33,0.05), 0 30px 60px -40px rgba(43,39,33,0.5), inset 0 0 0 1px var(--rule)",
                }}
              >
                <QRPreview
                  ref={previewRef}
                  data={redirectUrl}
                  config={qr.designConfig}
                  size={380}
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <InkButton className="flex-1" onClick={() => onDownload("png")}>
                Download PNG
              </InkButton>
              <InkButton
                variant="paper"
                className="flex-1"
                onClick={() => onDownload("svg")}
              >
                Download SVG
              </InkButton>
            </div>
          </PaperSurface>
        </div>

        {/* Details */}
        <div className="lg:col-span-7 space-y-6">
          <PaperSurface className="p-7">
            <Eyebrow className="mb-3 block">QR URL</Eyebrow>
            <div className="flex items-center gap-3">
              <code className="flex-1 font-sans text-[0.9375rem] text-[var(--ink)] break-all">
                {redirectUrl}
              </code>
              <InkButton variant="ghost" size="sm" onClick={onCopy}>
                Copy
              </InkButton>
            </div>
            <div className="mt-6">
              <Eyebrow className="mb-3 block">Destination</Eyebrow>
              <p className="font-body text-[1.0625rem] text-[var(--ink)] break-all">
                {qr.currentDestination}
              </p>
              <p className="mt-2 font-body text-[0.8125rem] italic text-[var(--ink-muted)]">
                Version {qr.currentVersion} · change this anytime without
                reprinting.
              </p>
            </div>
          </PaperSurface>

          <div className="flex flex-wrap gap-3">
            <InkButton
              variant="paper"
              onClick={() =>
                go({ view: "qr-detail", qrId, tab: "overview" })
              }
            >
              Open QR <ArrowRight className="h-4 w-4" />
            </InkButton>
            <InkButton
              variant="ghost"
              onClick={() => go({ view: "qr-detail", qrId, tab: "analytics" })}
            >
              View analytics
            </InkButton>
            <InkButton variant="ghost" onClick={() => go({ view: "dashboard" })}>
              All QR codes
            </InkButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// lightweight hook to fetch the just-created QR
import { useQrDetail } from "@/hooks/use-qr-api";
function useQrDetailLite(id: string) {
  return useQrDetail(id);
}
