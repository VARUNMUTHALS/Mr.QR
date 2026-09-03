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
  BotanicalSprig,
} from "@/components/studio/primitives";
import { QRPreview, type QRPreviewHandle } from "@/components/qr/QRPreview";
import {
  QRDesignPanel,
  DesignControlsFooter,
} from "@/components/qr/QRDesignPanel";
import { DEFAULT_DESIGN, type QrDesignConfig } from "@/lib/qr/types";
import { validateQr, autoFixConfig } from "@/lib/qr/validate";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Download,
  Image as ImageIcon,
  FileCode2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";

const RESOLUTIONS = [
  { label: "512", value: 512 },
  { label: "1024", value: 1024 },
  { label: "2048", value: 2048 },
];

export function StaticBuilderView() {
  const go = useNav((s) => s.go);
  const { toast } = useToast();
  const [content, setContent] = React.useState("");
  const [config, setConfig] = React.useState<QrDesignConfig>(DEFAULT_DESIGN);
  const [resolution, setResolution] = React.useState(1024);
  const [mobileTab, setMobileTab] = React.useState("preview");
  const previewRef = React.useRef<QRPreviewHandle>(null);

  const issues = React.useMemo(
    () => validateQr({ content, config }),
    [content, config]
  );
  const hasIssues = issues.length > 0;
  const hasErrors = issues.some((i) => i.level === "error");
  const canDownload = content.trim().length > 0 && !hasErrors;

  const onAutoFix = () => {
    setConfig((c) => autoFixConfig(c));
    toast({
      title: "Design adjusted",
      description: "We tuned the design for reliable scanning.",
    });
  };

  const onDownload = (format: "png" | "svg") => {
    if (!content.trim()) {
      toast({
        title: "Nothing to encode yet",
        description: "Add a URL or some text first.",
        variant: "destructive",
      });
      return;
    }
    if (hasErrors) {
      toast({
        title: "Fix the errors first",
        description: issues[0].message,
        variant: "destructive",
      });
      return;
    }
    const size = format === "png" ? resolution : 1024;
    previewRef.current?.download(format, size, "qr-studio-static");
    toast({
      title: format === "png" ? `PNG (${resolution}px) prepared` : "SVG prepared",
      description: "Your QR has been downloaded.",
    });
  };

  return (
    <div className="mx-auto max-w-[1320px] px-5 sm:px-8 pb-24">
      {/* Header */}
      <div className="pt-8 sm:pt-12 pb-10">
        <div className="flex items-center gap-3 mb-5">
          <Eyebrow ink>Static QR / 01</Eyebrow>
          <span className="h-px flex-1 bg-[var(--rule)]" />
          <button
            onClick={() => go({ view: "home" })}
            className="font-sans text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            ← Studio
          </button>
        </div>
        <EditorialHeading as="h1" className="text-[clamp(2rem,5vw,3.25rem)]">
          What should this QR contain?
        </EditorialHeading>
        <p className="mt-4 font-body text-[1rem] text-[var(--ink-2)] max-w-xl leading-relaxed">
          Enter a URL or any text. The information is stored directly inside the
          QR code — no redirect, no tracking, no account needed.
        </p>
      </div>

      {/* Mobile tab switch */}
      <div className="lg:hidden mb-6">
        <Tabs value={mobileTab} onValueChange={setMobileTab}>
          <TabsList className="grid grid-cols-3 bg-[var(--paper-2)] border border-[var(--rule)]">
            <TabsTrigger value="preview" className="font-sans text-xs">Preview</TabsTrigger>
            <TabsTrigger value="content" className="font-sans text-xs">Content</TabsTrigger>
            <TabsTrigger value="design" className="font-sans text-xs">Design</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="mt-4">
            <PreviewPanel
              content={content}
              config={config}
              previewRef={previewRef}
              resolution={resolution}
              setResolution={setResolution}
              onDownload={onDownload}
              canDownload={canDownload}
            />
          </TabsContent>
          <TabsContent value="content" className="mt-4">
            <ContentPanel content={content} setContent={setContent} />
          </TabsContent>
          <TabsContent value="design" className="mt-4">
            <PaperSurface className="p-6">
              <QRDesignPanel config={config} onChange={setConfig} />
              <div className="mt-6">
                <DesignControlsFooter onAutoFix={onAutoFix} hasIssues={hasIssues} />
              </div>
              <ValidationList issues={issues} />
            </PaperSurface>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop two-column layout */}
      <div className="hidden lg:grid grid-cols-12 gap-8">
        {/* Left: preview */}
        <div className="col-span-6">
          <PreviewPanel
            content={content}
            config={config}
            previewRef={previewRef}
            resolution={resolution}
            setResolution={setResolution}
            onDownload={onDownload}
            canDownload={canDownload}
          />
        </div>

        {/* Right: content + design */}
        <div className="col-span-6 space-y-8">
          <ContentPanel content={content} setContent={setContent} />
          <PaperSurface className="p-7">
            <Eyebrow ink className="mb-5 block">Design</Eyebrow>
            <QRDesignPanel config={config} onChange={setConfig} />
            <div className="mt-6">
              <DesignControlsFooter onAutoFix={onAutoFix} hasIssues={hasIssues} />
            </div>
            <ValidationList issues={issues} />
          </PaperSurface>
        </div>
      </div>

      <BotanicalSprig
        variant="left"
        className="absolute right-0 top-40 hidden xl:block h-32 w-64 opacity-50 pointer-events-none -z-10"
      />
    </div>
  );
}

/* ---------- Preview panel ---------- */
function PreviewPanel({
  content,
  config,
  previewRef,
  resolution,
  setResolution,
  onDownload,
  canDownload,
}: {
  content: string;
  config: QrDesignConfig;
  previewRef: React.RefObject<QRPreviewHandle | null>;
  resolution: number;
  setResolution: (n: number) => void;
  onDownload: (f: "png" | "svg") => void;
  canDownload: boolean;
}) {
  return (
    <PaperSurface className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <Eyebrow ink>Preview</Eyebrow>
        <span className="font-sans text-[0.6875rem] text-[var(--ink-muted)] flex items-center gap-1.5">
          <ScanLine className="h-3 w-3" /> Live
        </span>
      </div>

      {/* The QR as a printed object */}
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
            data={content}
            config={config}
            size={420}
          />
          <div className="mt-5 flex items-center justify-between">
            <span className="eyebrow text-[var(--ink-muted)]">
              {content.trim() ? "Encoded" : "Awaiting content"}
            </span>
            <span className="font-sans text-[0.625rem] text-[var(--ink-muted)] uppercase tracking-[0.18em]">
              ECC {config.errorCorrection}
            </span>
          </div>
        </div>
        {/* tape accent */}
        <div
          aria-hidden
          className="absolute -top-2 left-1/2 -translate-x-1/2 h-5 w-16 rotate-[-3deg] opacity-70"
          style={{
            background: "rgba(184, 137, 58, 0.35)",
            border: "1px solid rgba(43,39,33,0.08)",
          }}
        />
      </div>

      {/* Resolution selector */}
      <div className="mt-8">
        <Eyebrow className="mb-3 block">PNG resolution</Eyebrow>
        <div className="flex gap-1.5">
          {RESOLUTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setResolution(r.value)}
              aria-pressed={resolution === r.value}
              className={cn(
                "h-9 px-3 border rounded-[2px] font-sans text-xs transition-colors",
                resolution === r.value
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper-3)]"
                  : "border-[var(--rule)] text-[var(--ink-2)] hover:border-[var(--ink)]"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Download */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <InkButton
          className="flex-1"
          onClick={() => onDownload("png")}
          disabled={!canDownload}
        >
          <ImageIcon className="h-4 w-4" /> Download PNG
        </InkButton>
        <InkButton
          variant="paper"
          className="flex-1"
          onClick={() => onDownload("svg")}
          disabled={!canDownload}
        >
          <FileCode2 className="h-4 w-4" /> Download SVG
        </InkButton>
      </div>
      {!canDownload && (
        <p className="mt-3 font-sans text-[0.6875rem] text-[var(--ink-muted)] text-center">
          Add content to enable download.
        </p>
      )}
    </PaperSurface>
  );
}

/* ---------- Content panel ---------- */
function ContentPanel({
  content,
  setContent,
}: {
  content: string;
  setContent: (v: string) => void;
}) {
  const isUrl = /^https?:\/\//i.test(content.trim());
  return (
    <PaperSurface className="p-7">
      <Eyebrow ink className="mb-4 block">
        Content
      </Eyebrow>
      <label htmlFor="qr-content" className="sr-only">
        URL or text to encode
      </label>
      <Textarea
        id="qr-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="https://example.com   —   or any text you want to encode..."
        className="min-h-[120px] font-body text-[1.0625rem] leading-relaxed bg-[var(--paper-3)] border-[var(--rule-strong)] focus-visible:border-[var(--ink)] resize-none"
        maxLength={1200}
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="font-sans text-[0.6875rem] text-[var(--ink-muted)]">
          {isUrl ? "Detected: web address" : "Plain text · encoded directly"}
        </span>
        <span className="font-sans text-[0.6875rem] text-[var(--ink-muted)] tabular-nums">
          {content.length}/1200
        </span>
      </div>
      <p className="mt-5 font-body text-[0.875rem] italic leading-relaxed text-[var(--ink-muted)]">
        The information is stored directly inside the QR code. Once generated,
        it cannot be changed — that is what makes it static.
      </p>
    </PaperSurface>
  );
}

/* ---------- Validation list ---------- */
function ValidationList({
  issues,
}: {
  issues: { level: "warning" | "error"; message: string; fix?: string }[];
}) {
  if (issues.length === 0) {
    return (
      <div className="mt-6 flex items-center gap-3 p-4 border border-[var(--botanical)]/30 bg-[var(--botanical)]/[0.06] rounded-[2px]">
        <CheckCircle2 className="h-4 w-4 text-[var(--botanical)]" />
        <p className="font-sans text-xs text-[var(--ink-2)]">
          This configuration should scan reliably.
        </p>
      </div>
    );
  }
  return (
    <div className="mt-6 space-y-2">
      {issues.map((issue, i) => (
        <div
          key={i}
          className={cn(
            "flex items-start gap-3 p-3 border rounded-[2px]",
            issue.level === "error"
              ? "border-[var(--destructive)]/30 bg-[var(--destructive)]/[0.05]"
              : "border-[var(--ochre)]/30 bg-[var(--ochre)]/[0.06]"
          )}
        >
          <AlertTriangle
            className={cn(
              "h-3.5 w-3.5 mt-0.5 shrink-0",
              issue.level === "error"
                ? "text-[var(--destructive)]"
                : "text-[var(--ochre)]"
            )}
          />
          <div className="flex-1 min-w-0">
            <p className="font-sans text-xs text-[var(--ink)]">{issue.message}</p>
            {issue.fix && (
              <p className="font-sans text-[0.6875rem] text-[var(--ink-muted)] mt-1">
                {issue.fix}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
