"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* PaperSurface — warm paper plate with subtle grain                   */
/* ------------------------------------------------------------------ */
export function PaperSurface({
  className,
  variant = "plate",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "plate" | "flush" | "inset";
}) {
  return (
    <div
      className={cn(
        "relative",
        variant === "plate" &&
          "bg-[var(--paper-2)] border border-[var(--rule)] shadow-[0_1px_0_rgba(43,39,33,0.04),0_18px_40px_-32px_rgba(43,39,33,0.4)]",
        variant === "flush" && "bg-transparent",
        variant === "inset" && "bg-[var(--paper-3)] border border-[var(--rule)]",
        className
      )}
      {...props}
    >
      {variant === "plate" && <PaperGrain />}
      <div className="relative">{children}</div>
    </div>
  );
}

export function PaperGrain({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 mix-blend-multiply opacity-60", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.025'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* EditorialHeading — Instrument Serif display                        */
/* ------------------------------------------------------------------ */
export function EditorialHeading({
  children,
  className,
  as: Tag = "h2",
  italic,
  ...props
}: React.ComponentProps<"h2"> & { as?: "h1" | "h2" | "h3" | "h4"; italic?: boolean }) {
  return (
    <Tag
      className={cn(
        "display-heading text-[var(--ink)]",
        italic && "italic",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Eyebrow — editorial section label                                   */
/* ------------------------------------------------------------------ */
export function Eyebrow({
  children,
  className,
  ink,
  ...props
}: React.ComponentProps<"span"> & { ink?: boolean }) {
  return (
    <span
      className={cn("eyebrow", ink && "eyebrow-ink", className)}
      {...props}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* SectionRule — thin editorial rule with optional label               */
/* ------------------------------------------------------------------ */
export function SectionRule({
  label,
  right,
  strong,
  className,
}: {
  label?: React.ReactNode;
  right?: React.ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {label && <span className="eyebrow shrink-0">{label}</span>}
      <div className={cn("h-px flex-1", strong ? "bg-[var(--rule-strong)]" : "bg-[var(--rule)]")} />
      {right && <span className="eyebrow shrink-0 text-[var(--ink-muted)]">{right}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* InkButton — primary editorial button (paper + ink)                 */
/* ------------------------------------------------------------------ */
export function InkButton({
  children,
  className,
  variant = "ink",
  size = "md",
  ...props
}: React.ComponentProps<"button"> & {
  variant?: "ink" | "paper" | "botanical" | "terracotta" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const variants: Record<string, string> = {
    ink: "bg-[var(--ink)] text-[var(--paper-3)] hover:bg-[var(--ink-2)]",
    paper:
      "bg-[var(--paper-3)] text-[var(--ink)] border border-[var(--rule-strong)] hover:border-[var(--ink)]",
    botanical:
      "bg-[var(--botanical)] text-[var(--paper-3)] hover:bg-[var(--botanical-2)]",
    terracotta:
      "bg-[var(--terracotta)] text-[var(--paper-3)] hover:brightness-110",
    ghost: "bg-transparent text-[var(--ink)] hover:bg-[var(--muted)]",
    danger:
      "bg-transparent text-[var(--destructive)] border border-[var(--destructive)]/40 hover:bg-[var(--destructive)]/10",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-[0.8125rem]",
    md: "h-10 px-5 text-[0.875rem]",
    lg: "h-12 px-7 text-[0.9375rem]",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-sans font-medium tracking-wide rounded-[2px] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* MetricNumber — large editorial figure                              */
/* ------------------------------------------------------------------ */
export function MetricNumber({
  value,
  className,
  unit,
}: {
  value: React.ReactNode;
  className?: string;
  unit?: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-baseline gap-1", className)}>
      <span className="display-heading text-[var(--ink)] tabular-nums">
        {value}
      </span>
      {unit && (
        <span className="font-body text-sm text-[var(--ink-muted)]">{unit}</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StatusDot — status indicator with text (never color-only)          */
/* ------------------------------------------------------------------ */
export function StatusDot({
  status,
  className,
}: {
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  className?: string;
}) {
  const map = {
    ACTIVE: { color: "var(--botanical)", label: "Active" },
    PAUSED: { color: "var(--ochre)", label: "Paused" },
    ARCHIVED: { color: "var(--ink-muted)", label: "Archived" },
  } as const;
  const s = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-sans text-[0.75rem] tracking-wide",
        className
      )}
    >
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: s.color }}
      />
      <span className="uppercase tracking-[0.14em] text-[var(--ink-2)]">
        {s.label}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* BotanicalSprig — hand-drawn SVG accent (muted botanical)           */
/* ------------------------------------------------------------------ */
export function BotanicalSprig({
  className,
  variant = "left",
}: {
  className?: string;
  variant?: "left" | "right" | "center";
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 120"
      className={cn("text-[var(--botanical)]", className)}
      preserveAspectRatio="xMidYMid meet"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      >
        {variant === "left" && (
          <>
            <path d="M10 110 C 40 80, 70 60, 130 40" />
            <path d="M30 92 C 34 84, 42 80, 52 82 C 48 90, 40 94, 30 92 Z" />
            <path d="M52 78 C 58 68, 68 64, 80 66 C 76 78, 66 82, 52 78 Z" />
            <path d="M80 60 C 88 50, 100 47, 112 50 C 108 62, 96 66, 80 60 Z" />
            <path d="M110 44 C 118 34, 130 31, 142 35 C 138 47, 126 51, 110 44 Z" />
            <circle cx="148" cy="34" r="2.2" fill="currentColor" stroke="none" />
          </>
        )}
        {variant === "right" && (
          <>
            <path d="M190 110 C 160 80, 130 60, 70 40" />
            <path d="M170 92 C 166 84, 158 80, 148 82 C 152 90, 160 94, 170 92 Z" />
            <path d="M148 78 C 142 68, 132 64, 120 66 C 124 78, 134 82, 148 78 Z" />
            <path d="M120 60 C 112 50, 100 47, 88 50 C 92 62, 104 66, 120 60 Z" />
            <path d="M90 44 C 82 34, 70 31, 58 35 C 62 47, 74 51, 90 44 Z" />
            <circle cx="52" cy="34" r="2.2" fill="currentColor" stroke="none" />
          </>
        )}
        {variant === "center" && (
          <>
            <path d="M100 115 C 100 80, 100 50, 100 18" />
            <path d="M100 86 C 92 80, 86 70, 86 58 C 96 60, 102 70, 100 86 Z" />
            <path d="M100 86 C 108 80, 114 70, 114 58 C 104 60, 98 70, 100 86 Z" />
            <path d="M100 60 C 92 54, 86 44, 86 32 C 96 34, 102 44, 100 60 Z" />
            <path d="M100 60 C 108 54, 114 44, 114 32 C 104 34, 98 44, 100 60 Z" />
            <path d="M100 34 C 94 28, 90 20, 90 12 C 98 14, 102 22, 100 34 Z" />
            <path d="M100 34 C 106 28, 110 20, 110 12 C 102 14, 98 22, 100 34 Z" />
          </>
        )}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* DeckledEdge — a subtle torn paper edge accent                       */
/* ------------------------------------------------------------------ */
export function DeckledEdge({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={cn("text-[var(--rule)]", className)}
      preserveAspectRatio="none"
      viewBox="0 0 100 4"
    >
      <path
        d="M0 2 Q 6 0 12 2 T 24 2 T 36 2 T 48 2 T 60 2 T 72 2 T 84 2 T 100 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
      />
    </svg>
  );
}
