"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Eyebrow,
  InkButton,
  SectionRule,
  PaperSurface,
} from "@/components/studio/primitives";
import {
  STUDIO_PRESETS,
  type QrDesignConfig,
  type QrEyeDot,
  type QrEyeSquare,
  type QrErrorCorrection,
  type QrFrame,
  type QrPattern,
} from "@/lib/qr/types";
import { cn } from "@/lib/utils";
import {
  Square,
  Circle,
  Shapes,
  Upload,
  X,
  Sparkles,
  Info,
} from "lucide-react";

interface Props {
  config: QrDesignConfig;
  onChange: (next: QrDesignConfig) => void;
}

export function QRDesignPanel({ config, onChange }: Props) {
  const fileRef = React.useRef<HTMLInputElement>(null);

  const set = <K extends keyof QrDesignConfig>(key: K, value: QrDesignConfig[K]) =>
    onChange({ ...config, [key]: value });

  const onLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024 * 2) {
      alert("Please choose a logo under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("logoDataUrl", reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8">
      {/* Presets */}
      <div className="space-y-3">
        <Eyebrow>Palette</Eyebrow>
        <div className="flex flex-wrap gap-2">
          {STUDIO_PRESETS.map((p) => {
            const active =
              config.fgColor === (p.design.fgColor ?? config.fgColor) &&
              config.bgColor === (p.design.bgColor ?? config.bgColor);
            return (
              <button
                key={p.name}
                onClick={() => onChange({ ...config, ...p.design })}
                className={cn(
                  "group flex items-center gap-2 px-3 h-9 border transition-colors rounded-[2px]",
                  active
                    ? "border-[var(--ink)] bg-[var(--paper-3)]"
                    : "border-[var(--rule)] hover:border-[var(--ink)]"
                )}
                aria-label={`Apply ${p.name} palette`}
              >
                <span className="flex">
                  <span
                    className="h-4 w-4 border border-[var(--rule)]"
                    style={{ backgroundColor: p.design.bgColor }}
                  />
                  <span
                    className="h-4 w-4 -ml-1.5 border border-[var(--rule)]"
                    style={{ backgroundColor: p.design.fgColor }}
                  />
                </span>
                <span className="font-sans text-xs text-[var(--ink)]">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <SectionRule label="Pattern" />

      <SegmentedField
        label="Module shape"
        help="The shape of the inner QR dots."
        value={config.pattern}
        options={[
          { value: "square", label: "Square", icon: <Square className="h-3.5 w-3.5" /> },
          { value: "rounded", label: "Rounded", icon: <Shapes className="h-3.5 w-3.5" /> },
          { value: "dot", label: "Dot", icon: <Circle className="h-3.5 w-3.5" /> },
          { value: "extra-rounded", label: "Soft" },
          { value: "classy", label: "Classy" },
        ]}
        onChange={(v) => set("pattern", v as QrPattern)}
      />

      <SegmentedField
        label="Eye frame"
        help="The outer square of the three position markers."
        value={config.eyeSquare}
        options={[
          { value: "square", label: "Square", icon: <Square className="h-3.5 w-3.5" /> },
          { value: "extra-rounded", label: "Rounded" },
          { value: "dot", label: "Circle", icon: <Circle className="h-3.5 w-3.5" /> },
        ]}
        onChange={(v) => set("eyeSquare", v as QrEyeSquare)}
      />

      <SegmentedField
        label="Eye pupil"
        help="The inner dot of the position markers."
        value={config.eyeDot}
        options={[
          { value: "square", label: "Square", icon: <Square className="h-3.5 w-3.5" /> },
          { value: "dot", label: "Circle", icon: <Circle className="h-3.5 w-3.5" /> },
        ]}
        onChange={(v) => set("eyeDot", v as QrEyeDot)}
      />

      <SectionRule label="Color" />

      <div className="grid grid-cols-2 gap-4">
        <ColorField
          label="Foreground"
          value={config.fgColor}
          onChange={(v) => set("fgColor", v)}
        />
        <ColorField
          label="Background"
          value={config.bgColor}
          onChange={(v) => set("bgColor", v)}
        />
      </div>

      <SectionRule label="Logo" />

      <div className="space-y-3">
        {config.logoDataUrl ? (
          <div className="flex items-center gap-3 p-3 border border-[var(--rule)] rounded-[2px] bg-[var(--paper-3)]">
            <div className="h-10 w-10 border border-[var(--rule)] bg-white flex items-center justify-center overflow-hidden">
              <img
                src={config.logoDataUrl}
                alt="Logo preview"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-sans text-xs text-[var(--ink)]">Logo added</div>
              <div className="font-sans text-[0.6875rem] text-[var(--ink-muted)] truncate">
                Embedded in the center of the QR
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => set("logoDataUrl", null)}
              aria-label="Remove logo"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            ref={fileRef as never}
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 h-10 border border-dashed border-[var(--rule-strong)] rounded-[2px] text-[var(--ink-2)] hover:border-[var(--ink)] hover:text-[var(--ink)] transition-colors font-sans text-xs"
          >
            <Upload className="h-3.5 w-3.5" /> Upload a logo
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={onLogoUpload}
        />

        {config.logoDataUrl && (
          <div className="grid grid-cols-1 gap-4">
            <SliderField
              label="Logo size"
              value={config.logoSize}
              min={0.1}
              max={0.4}
              step={0.01}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => set("logoSize", v)}
            />
            <SliderField
              label="Logo padding"
              value={config.logoMargin}
              min={0}
              max={20}
              step={1}
              format={(v) => `${v}px`}
              onChange={(v) => set("logoMargin", v)}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.logoRounded}
                onChange={(e) => set("logoRounded", e.target.checked)}
                className="accent-[var(--ink)]"
              />
              <span className="font-sans text-xs text-[var(--ink-2)]">
                Round the logo corners
              </span>
            </label>
          </div>
        )}
      </div>

      <SectionRule label="Frame" />

      <SegmentedField
        label="Frame style"
        value={config.frame}
        options={[
          { value: "none", label: "None" },
          { value: "simple", label: "Simple" },
          { value: "scan-me", label: "Scan Me" },
        ]}
        onChange={(v) => set("frame", v as QrFrame)}
      />

      <SectionRule label="Reliability" />

      <SliderField
        label="Quiet zone"
        help="The empty margin around the QR. 4 modules is the safe standard."
        value={config.quietZone}
        min={0}
        max={10}
        step={1}
        format={(v) => `${v} modules`}
        onChange={(v) => set("quietZone", v)}
      />

      <SegmentedField
        label="Error correction"
        help="Higher levels survive more damage (and logos)."
        value={config.errorCorrection}
        options={[
          { value: "L", label: "Low" },
          { value: "M", label: "Medium" },
          { value: "Q", label: "Quartile" },
          { value: "H", label: "High" },
        ]}
        onChange={(v) => set("errorCorrection", v as QrErrorCorrection)}
      />
    </div>
  );
}

/* ---------- field primitives ---------- */

function SegmentedField<T extends string>({
  label,
  help,
  value,
  options,
  onChange,
}: {
  label: string;
  help?: string;
  value: T;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="font-sans text-[0.8125rem] text-[var(--ink)]">{label}</Label>
        {help && (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  aria-label={`About ${label}`}
                >
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="font-sans text-xs max-w-[220px]">
                {help}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 border rounded-[2px] font-sans text-[0.75rem] transition-colors",
                active
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper-3)]"
                  : "border-[var(--rule)] text-[var(--ink-2)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
              )}
            >
              {o.icon}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="font-sans text-[0.8125rem] text-[var(--ink)]">{label}</Label>
      <div className="flex items-center gap-2 h-10 px-2 border border-[var(--rule)] rounded-[2px] bg-[var(--paper-3)]">
        <div className="relative h-6 w-6 overflow-hidden border border-[var(--rule)]">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-[calc(100%+4px)] w-[calc(100%+4px)] cursor-pointer border-0 p-0"
            aria-label={`${label} color picker`}
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 border-0 bg-transparent px-0 font-sans text-xs shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  help,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  help?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="font-sans text-[0.8125rem] text-[var(--ink)]">{label}</Label>
          {help && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-[var(--ink-muted)] hover:text-[var(--ink)]"
                    aria-label={`About ${label}`}
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="font-sans text-xs max-w-[220px]">
                  {help}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className="font-sans text-xs text-[var(--ink-2)] tabular-nums">
          {format(value)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
        className="[&_[role=slider]]:bg-[var(--ink)] [&_[role=slider]]:border-[var(--ink)] [&_.bg-primary]:bg-[var(--ink)]"
      />
    </div>
  );
}

export function DesignControlsFooter({
  onAutoFix,
  hasIssues,
}: {
  onAutoFix: () => void;
  hasIssues: boolean;
}) {
  if (!hasIssues) return null;
  return (
    <PaperSurface variant="inset" className="p-4">
      <div className="flex items-start gap-3">
        <Sparkles className="h-4 w-4 text-[var(--botanical)] mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="font-sans text-xs text-[var(--ink)]">
            We noticed some scan-reliability warnings.
          </div>
          <div className="font-sans text-[0.6875rem] text-[var(--ink-muted)] mt-0.5">
            Let the studio adjust the design automatically.
          </div>
        </div>
        <InkButton size="sm" variant="botanical" onClick={onAutoFix}>
          Fix automatically
        </InkButton>
      </div>
    </PaperSurface>
  );
}
