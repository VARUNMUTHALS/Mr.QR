"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  BarChart,
  Cell,
} from "recharts";
import type { AnalyticsData } from "@/hooks/use-qr-api";
import { Eyebrow, SectionRule, MetricNumber } from "@/components/studio/primitives";
import { cn } from "@/lib/utils";

/* ------------------------------- Scan timeline ------------------------------ */

export function ScanChart({
  data,
  loading,
}: {
  data: AnalyticsData | undefined;
  loading: boolean;
}) {
  const timeline = data?.timeline ?? [];
  const [hover, setHover] = React.useState<{
    label: string;
    scans: number;
    unique: number;
    x: number;
    y: number;
  } | null>(null);

  return (
    <div className="relative">
      <div className="flex items-baseline justify-between mb-4">
        <Eyebrow ink>Scan activity</Eyebrow>
        <span className="font-sans text-[0.6875rem] text-[var(--ink-muted)]">
          {data?.scansInRange.toLocaleString() ?? 0} in range
        </span>
      </div>
      {loading && timeline.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center">
          <span className="font-body text-sm italic text-[var(--ink-muted)]">
            Opening the scan book…
          </span>
        </div>
      ) : timeline.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center">
          <span className="font-body text-sm italic text-[var(--ink-muted)]">
            No scans in this range yet.
          </span>
        </div>
      ) : (
        <div className="relative h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timeline}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              onMouseMove={(e: { activeTooltipIndex?: number; activeLabel?: string }) => {
                if (e.activeTooltipIndex != null && timeline[e.activeTooltipIndex]) {
                  const p = timeline[e.activeTooltipIndex];
                  setHover({
                    label: p.label,
                    scans: p.scans,
                    unique: p.unique,
                    x: 0,
                    y: 0,
                  });
                }
              }}
              onMouseLeave={() => setHover(null)}
            >
              <defs>
                <linearGradient id="scanFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--terracotta)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--terracotta)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="2 4"
                stroke="var(--rule)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="var(--ink-muted)"
                tick={{ fontSize: 10, fontFamily: "var(--font-geist-sans)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--rule)" }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                stroke="var(--ink-muted)"
                tick={{ fontSize: 10, fontFamily: "var(--font-geist-sans)" }}
                tickLine={false}
                axisLine={false}
                width={40}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ stroke: "var(--ink)", strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-[var(--paper-3)] border border-[var(--rule-strong)] px-3 py-2 shadow-lg">
                      <div className="font-sans text-[0.6875rem] text-[var(--ink-muted)] uppercase tracking-wide">
                        {label}
                      </div>
                      <div className="font-body text-sm text-[var(--ink)] mt-0.5">
                        Scans: <span className="tabular-nums">{payload[0].value as number}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="scans"
                stroke="var(--terracotta)"
                strokeWidth={1.6}
                fill="url(#scanFill)"
                dot={false}
                activeDot={{ r: 4, fill: "var(--terracotta)", stroke: "var(--paper-3)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      {hover && (
        <div className="sr-only" aria-live="polite">
          {hover.label}: {hover.scans} scans
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Breakdown bars ------------------------------- */

const BREAKDOWN_COLORS: Record<string, string> = {
  Mobile: "var(--terracotta)",
  Desktop: "var(--botanical)",
  Tablet: "var(--ochre)",
  Android: "var(--botanical)",
  iOS: "var(--terracotta)",
  Windows: "var(--ochre)",
  macOS: "var(--ink-2)",
  Linux: "var(--ink-muted)",
  Chrome: "var(--terracotta)",
  Safari: "var(--botanical)",
  Firefox: "var(--ochre)",
  Edge: "var(--ink-2)",
  India: "var(--terracotta)",
  "United States": "var(--botanical)",
  "United Kingdom": "var(--ochre)",
  "United Arab Emirates": "var(--ink-2)",
  Singapore: "var(--ink-muted)",
  Germany: "var(--botanical-2)",
  Australia: "var(--ochre)",
  Other: "var(--ink-muted)",
};

export function Breakdown({
  title,
  items,
  loading,
  note,
}: {
  title: string;
  items: { key: string; count: number; pct: number }[];
  loading?: boolean;
  note?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <Eyebrow ink>{title}</Eyebrow>
      </div>
      {loading && items.length === 0 ? (
        <div className="h-[120px] flex items-center">
          <span className="font-body text-sm italic text-[var(--ink-muted)]">
            Reading…
          </span>
        </div>
      ) : items.length === 0 ? (
        <div className="h-[120px] flex items-center">
          <span className="font-body text-sm italic text-[var(--ink-muted)]">
            Nothing here yet.
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 6).map((item) => (
            <div key={item.key}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-body text-[0.875rem] text-[var(--ink)]">
                  {item.key}
                </span>
                <span className="font-sans text-[0.75rem] text-[var(--ink-muted)] tabular-nums">
                  {item.count.toLocaleString()} · {item.pct}%
                </span>
              </div>
              <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.pct}%`,
                    backgroundColor:
                      BREAKDOWN_COLORS[item.key] || "var(--ink-2)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {note && (
        <p className="mt-4 font-body text-[0.6875rem] italic text-[var(--ink-muted)]">
          {note}
        </p>
      )}
    </div>
  );
}

/* ----------------------------- Hourly distribution ------------------------- */

export function HourlyChart({
  data,
  peakHour,
  loading,
}: {
  data: AnalyticsData | undefined;
  peakHour: number;
  loading: boolean;
}) {
  const hourly = data?.hourly ?? [];
  const max = Math.max(1, ...hourly.map((h) => h.count));

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <Eyebrow ink>By hour</Eyebrow>
        <span className="font-sans text-[0.6875rem] text-[var(--ink-muted)]">
          Peak: {peakHour}:00–{peakHour + 1}:00
        </span>
      </div>
      {loading && hourly.length === 0 ? (
        <div className="h-[100px] flex items-center">
          <span className="font-body text-sm italic text-[var(--ink-muted)]">
            Reading…
          </span>
        </div>
      ) : (
        <div className="h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourly} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
              <XAxis
                dataKey="hour"
                stroke="var(--ink-muted)"
                tick={{ fontSize: 9, fontFamily: "var(--font-geist-sans)" }}
                tickLine={false}
                axisLine={false}
                interval={3}
                tickFormatter={(h: number) => `${h}`}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "rgba(43,39,33,0.04)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-[var(--paper-3)] border border-[var(--rule-strong)] px-3 py-2">
                      <div className="font-sans text-[0.6875rem] text-[var(--ink-muted)]">
                        {payload[0].payload.hour}:00
                      </div>
                      <div className="font-body text-sm text-[var(--ink)]">
                        {payload[0].value as number} scans
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {hourly.map((h) => (
                  <Cell
                    key={h.hour}
                    fill={
                      h.hour === peakHour ? "var(--terracotta)" : "var(--ink-muted)"
                    }
                    fillOpacity={h.hour === peakHour ? 1 : 0.4}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export { SectionRule, cn };
