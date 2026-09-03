"use client";

import * as React from "react";
import { useNav } from "@/lib/nav";
import {
  Eyebrow,
  EditorialHeading,
  InkButton,
  SectionRule,
  PaperSurface,
  StatusDot,
  BotanicalSprig,
} from "@/components/studio/primitives";
import { useQrList, type QrListItem } from "@/hooks/use-qr-api";
import { Input } from "@/components/ui/input";
import { Search, Plus, ArrowUpRight, Loader2, FileText, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

type Filter = "all" | "static" | "dynamic" | "active" | "paused";

export function DashboardView() {
  const go = useNav((s) => s.go);
  const { data: qrs, isLoading } = useQrList();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");

  const filtered = React.useMemo(() => {
    if (!qrs) return [];
    return qrs.filter((q) => {
      if (query) {
        const qy = query.toLowerCase();
        if (
          !q.name.toLowerCase().includes(qy) &&
          !(q.currentDestination || "").toLowerCase().includes(qy) &&
          !(q.slug || "").toLowerCase().includes(qy)
        ) {
          return false;
        }
      }
      if (filter === "static") return q.type === "STATIC";
      if (filter === "dynamic") return q.type === "DYNAMIC";
      if (filter === "active") return q.status === "ACTIVE";
      if (filter === "paused") return q.status === "PAUSED";
      return true;
    });
  }, [qrs, query, filter]);

  const counts = React.useMemo(() => {
    if (!qrs) return { total: 0, static: 0, dynamic: 0, scans: 0 };
    return {
      total: qrs.length,
      static: qrs.filter((q) => q.type === "STATIC").length,
      dynamic: qrs.filter((q) => q.type === "DYNAMIC").length,
      scans: qrs.reduce((s, q) => s + q.totalScans, 0),
    };
  }, [qrs]);

  return (
    <div className="mx-auto max-w-[1320px] px-5 sm:px-8 pb-24">
      {/* Header */}
      <div className="pt-8 sm:pt-12">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <Eyebrow ink className="mb-4 block">
              QR Codes
            </Eyebrow>
            <EditorialHeading as="h1" className="text-[clamp(2rem,5vw,3.25rem)]">
              Your studio shelf.
            </EditorialHeading>
          </div>
          <div className="flex gap-2">
            <InkButton variant="paper" onClick={() => go({ view: "create-static" })}>
              <Plus className="h-4 w-4" /> Static
            </InkButton>
            <InkButton variant="terracotta" onClick={() => go({ view: "create-dynamic" })}>
              <Plus className="h-4 w-4" /> Dynamic
            </InkButton>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
        <Metric label="QR codes" value={counts.total} />
        <Metric label="Dynamic" value={counts.dynamic} accent="terracotta" />
        <Metric label="Static" value={counts.static} accent="botanical" />
        <Metric label="Total scans" value={counts.scans.toLocaleString()} />
      </div>

      {/* Filters */}
      <div className="mt-12 mb-6 space-y-4">
        <SectionRule label="The shelf" right={`${filtered.length} shown`} />
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--ink-muted)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search QR codes..."
              className="pl-9 h-10 bg-[var(--paper-3)] border-[var(--rule-strong)] focus-visible:border-[var(--ink)] font-body"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["all", "All"],
                ["dynamic", "Dynamic"],
                ["static", "Static"],
                ["active", "Active"],
                ["paused", "Paused"],
              ] as [Filter, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={cn(
                  "h-8 px-3 border rounded-[2px] font-sans text-xs transition-colors",
                  filter === value
                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper-3)]"
                    : "border-[var(--rule)] text-[var(--ink-2)] hover:border-[var(--ink)]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-[var(--ink-muted)]" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {/* table header (desktop) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 eyebrow text-[var(--ink-muted)]">
            <div className="col-span-4">Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-3">Destination</div>
            <div className="col-span-1 text-right">Scans</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          {filtered.map((qr) => (
            <QrRow key={qr.id} qr={qr} />
          ))}
        </div>
      )}

      <BotanicalSprig
        variant="left"
        className="absolute right-0 bottom-32 hidden xl:block h-24 w-52 opacity-40 pointer-events-none"
      />
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: "botanical" | "terracotta";
}) {
  return (
    <PaperSurface variant="inset" className="p-5">
      <Eyebrow className="block mb-2">{label}</Eyebrow>
      <div
        className="display-heading text-[clamp(1.75rem,3vw,2.5rem)] tabular-nums"
        style={{
          color:
            accent === "terracotta"
              ? "var(--terracotta)"
              : accent === "botanical"
              ? "var(--botanical)"
              : "var(--ink)",
        }}
      >
        {value}
      </div>
    </PaperSurface>
  );
}

function QrRow({ qr }: { qr: QrListItem }) {
  const go = useNav((s) => s.go);
  const isDynamic = qr.type === "DYNAMIC";
  return (
    <button
      onClick={() =>
        go({
          view: "qr-detail",
          qrId: qr.id,
          tab: isDynamic ? "overview" : "overview",
        })
      }
      className="w-full text-left group"
    >
      <PaperSurface className="overflow-hidden transition-transform duration-200 group-hover:-translate-y-0.5">
        <div className="md:grid md:grid-cols-12 gap-4 px-5 py-4 flex flex-col gap-3">
          <div className="md:col-span-4 flex items-center gap-3 min-w-0">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-[2px] shrink-0"
              style={{
                backgroundColor: isDynamic
                  ? "var(--terracotta)"
                  : "var(--botanical)",
                color: "var(--paper-3)",
              }}
            >
              {isDynamic ? (
                <Repeat className="h-3.5 w-3.5" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
            </span>
            <div className="min-w-0">
              <div className="font-body text-[1.0625rem] text-[var(--ink)] truncate">
                {qr.name}
              </div>
              <div className="font-sans text-[0.6875rem] text-[var(--ink-muted)] truncate">
                {qr.slug ? `/${qr.slug}` : "static"} ·{" "}
                {new Date(qr.updatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
          <div className="md:col-span-2 flex md:items-center">
            <span
              className="font-sans text-[0.6875rem] uppercase tracking-[0.14em]"
              style={{
                color: isDynamic ? "var(--terracotta)" : "var(--botanical)",
              }}
            >
              {isDynamic ? "Dynamic" : "Static"}
            </span>
          </div>
          <div className="md:col-span-3 flex items-center min-w-0">
            <span className="font-body text-[0.875rem] text-[var(--ink-2)] truncate">
              {qr.currentDestination || "—"}
            </span>
          </div>
          <div className="md:col-span-1 md:text-right">
            <span className="font-body text-[0.9375rem] text-[var(--ink)] tabular-nums">
              {isDynamic ? qr.totalScans.toLocaleString() : "—"}
            </span>
          </div>
          <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3">
            <StatusDot status={qr.status as "ACTIVE" | "PAUSED" | "ARCHIVED"} />
            <ArrowUpRight className="h-4 w-4 text-[var(--ink-muted)] group-hover:text-[var(--ink)] transition-colors" />
          </div>
        </div>
      </PaperSurface>
    </button>
  );
}

function EmptyState() {
  const go = useNav((s) => s.go);
  return (
    <PaperSurface className="p-12 text-center">
      <BotanicalSprig variant="center" className="h-24 mx-auto opacity-70" />
      <EditorialHeading as="h3" className="text-2xl mt-4">
        Your shelf is empty.
      </EditorialHeading>
      <p className="mt-3 font-body text-[var(--ink-muted)] max-w-md mx-auto">
        Create your first QR code — choose static for something permanent, or
        dynamic when you want to change and measure it.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <InkButton variant="botanical" onClick={() => go({ view: "create-static" })}>
          <Plus className="h-4 w-4" /> Static QR
        </InkButton>
        <InkButton variant="terracotta" onClick={() => go({ view: "create-dynamic" })}>
          <Plus className="h-4 w-4" /> Dynamic QR
        </InkButton>
      </div>
    </PaperSurface>
  );
}
