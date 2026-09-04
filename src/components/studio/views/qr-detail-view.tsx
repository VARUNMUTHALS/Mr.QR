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
  MetricNumber,
  BotanicalSprig,
} from "@/components/studio/primitives";
import { QRPreview, type QRPreviewHandle } from "@/components/qr/QRPreview";
import {
  useQrDetail,
  useAnalytics,
  useActivity,
  useVersions,
  useChangeDestination,
  useChangeStatus,
  useUpdateDesign,
  useRestoreVersion,
  useSimulateScan,
} from "@/hooks/use-qr-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ScanChart,
  Breakdown,
  HourlyChart,
} from "@/components/analytics/charts";
import { QRDesignPanel } from "@/components/qr/QRDesignPanel";
import { validateQr } from "@/lib/qr/validate";
import { validateDestinationUrl } from "@/lib/security/client";
import {
  ArrowLeft,
  Copy,
  Download,
  Loader2,
  Pause,
  Play,
  Archive,
  RotateCcw,
  FlaskConical,
  History,
  Activity as ActivityIcon,
  BarChart3,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const RANGES = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
] as const;

export function QrDetailView({
  qrId,
  tab,
}: {
  qrId: string;
  tab: "overview" | "analytics" | "activity" | "versions";
}) {
  const go = useNav((s) => s.go);
  const { data: qr, isLoading } = useQrDetail(qrId);
  const previewRef = React.useRef<QRPreviewHandle>(null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "analytics" | "activity" | "versions"
  >(tab);

  const redirectUrl = qr?.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/r/${qr.slug}`
    : "";

  const onCopy = async () => {
    if (!redirectUrl) return;
    await navigator.clipboard.writeText(redirectUrl);
    toast({ title: "QR URL copied", description: redirectUrl });
  };

  const onDownload = (format: "png" | "svg") => {
    previewRef.current?.download(format, 1024, `qr-studio-${qr?.slug || "code"}`);
    toast({ title: format === "png" ? "PNG prepared" : "SVG prepared" });
  };

  if (isLoading || !qr) {
    return (
      <div className="py-32 text-center">
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-[var(--ink-muted)]" />
      </div>
    );
  }

  const isDynamic = qr.type === "DYNAMIC";

  return (
    <div className="mx-auto max-w-[1320px] px-5 sm:px-8 pb-24">
      {/* Header */}
      <div className="pt-8">
        <button
          onClick={() => go({ view: "dashboard" })}
          className="font-sans text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] mb-4 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All QR codes
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Eyebrow ink>{isDynamic ? "Dynamic QR" : "Static QR"}</Eyebrow>
              <StatusDot status={qr.status} />
            </div>
            <EditorialHeading as="h1" className="text-[clamp(1.75rem,4vw,3rem)]">
              {qr.name}
            </EditorialHeading>
            {isDynamic && qr.slug && (
              <div className="mt-3 flex items-center gap-2">
                <code className="font-sans text-[0.8125rem] text-[var(--ink-2)] bg-[var(--paper-3)] px-2 py-1 border border-[var(--rule)] rounded-[2px]">
                  /api/r/{qr.slug}
                </code>
                <button
                  onClick={onCopy}
                  className="font-sans text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] inline-flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <InkButton variant="paper" onClick={() => onDownload("png")}>
              <Download className="h-4 w-4" /> PNG
            </InkButton>
            <InkButton variant="paper" onClick={() => onDownload("svg")}>
              <Download className="h-4 w-4" /> SVG
            </InkButton>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10">
        <div
          role="tablist"
          aria-label="QR sections"
          className="flex w-full justify-start gap-0 overflow-x-auto border-b border-[var(--rule)]"
        >
          {(
            [
              ["overview", "Overview", BarChart3],
              ...(isDynamic
                ? ([
                    ["analytics", "Scan Book", BarChart3],
                    ["activity", "Margin Notes", ActivityIcon],
                    ["versions", "Versions", History],
                  ] as const)
                : ([] as const)),
            ] as const
          ).map(([value, label, Icon]: readonly [string, string, any]) => {
            const active = activeTab === value;
            return (
              <button
                key={value}
                role="tab"
                aria-selected={active}
                onClick={() =>
                  setActiveTab(
                    value as "overview" | "analytics" | "activity" | "versions"
                  )
                }
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-3 font-sans text-xs tracking-wide border-b-2 -mb-px transition-colors whitespace-nowrap",
                  active
                    ? "border-[var(--ink)] text-[var(--ink)]"
                    : "border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" className="mt-8">
          {activeTab === "overview" && <OverviewTab qrId={qrId} previewRef={previewRef} />}
          {isDynamic && activeTab === "analytics" && <AnalyticsTab qrId={qrId} />}
          {isDynamic && activeTab === "activity" && <ActivityTab qrId={qrId} />}
          {isDynamic && activeTab === "versions" && <VersionsTab qrId={qrId} />}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Overview tab ------------------------------- */

function OverviewTab({
  qrId,
  previewRef,
}: {
  qrId: string;
  previewRef: React.RefObject<QRPreviewHandle | null>;
}) {
  const go = useNav((s) => s.go);
  const { data: qr } = useQrDetail(qrId);
  const changeStatus = useChangeStatus(qrId);
  const simulate = useSimulateScan(qrId);
  const { toast } = useToast();

  if (!qr) return null;
  const isDynamic = qr.type === "DYNAMIC";
  const redirectUrl = qr.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/r/${qr.slug}`
    : "";

  const onStatus = (status: "ACTIVE" | "PAUSED" | "ARCHIVED") => {
    changeStatus.mutate(status, {
      onSuccess: () => {
        toast({
          title:
            status === "PAUSED"
              ? "QR paused"
              : status === "ARCHIVED"
              ? "QR archived"
              : "QR resumed",
        });
      },
    });
  };

  const onSimulate = () => {
    simulate.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Test scan recorded",
          description: "Refresh analytics to see it in the Scan Book.",
        });
      },
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* QR preview + status */}
      <div className="lg:col-span-5 space-y-6">
        <PaperSurface className="p-6 sm:p-8">
          <div className="relative mx-auto max-w-[340px]">
            <div
              className="relative p-6"
              style={{
                background: "var(--paper-3)",
                boxShadow:
                  "0 1px 0 rgba(43,39,33,0.05), 0 30px 60px -40px rgba(43,39,33,0.5), inset 0 0 0 1px var(--rule)",
              }}
            >
              <QRPreview
                ref={previewRef}
                data={isDynamic ? redirectUrl : qr.content || " "}
                config={qr.designConfig}
                size={340}
              />
            </div>
          </div>
        </PaperSurface>

        {isDynamic && (
          <PaperSurface className="p-6">
            <Eyebrow ink className="mb-4 block">
              Status controls
            </Eyebrow>
            <div className="flex flex-wrap gap-2">
              {qr.status !== "ACTIVE" && (
                <InkButton
                  variant="botanical"
                  size="sm"
                  onClick={() => onStatus("ACTIVE")}
                  disabled={changeStatus.isPending}
                >
                  <Play className="h-3.5 w-3.5" /> Resume
                </InkButton>
              )}
              {qr.status === "ACTIVE" && (
                <InkButton
                  variant="paper"
                  size="sm"
                  onClick={() => onStatus("PAUSED")}
                  disabled={changeStatus.isPending}
                >
                  <Pause className="h-3.5 w-3.5" /> Pause
                </InkButton>
              )}
              {qr.status !== "ARCHIVED" && (
                <InkButton
                  variant="danger"
                  size="sm"
                  onClick={() => onStatus("ARCHIVED")}
                  disabled={changeStatus.isPending}
                >
                  <Archive className="h-3.5 w-3.5" /> Archive
                </InkButton>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--rule)]">
              <InkButton
                variant="ghost"
                size="sm"
                onClick={onSimulate}
                disabled={simulate.isPending}
                className="w-full"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                {simulate.isPending ? "Recording…" : "Record a test scan"}
              </InkButton>
            </div>
          </PaperSurface>
        )}
      </div>

      {/* Right: details + metrics */}
      <div className="lg:col-span-7 space-y-6">
        {/* Quick metrics for dynamic */}
        {isDynamic && (
          <div className="grid grid-cols-3 gap-4">
            <MetricCard label="Total scans" value={qr.totalScans.toLocaleString()} />
            <MetricCard
              label="Current version"
              value={`v${qr.currentVersion ?? 1}`}
              accent="terracotta"
            />
            <MetricCard label="Status" value={qr.status} />
          </div>
        )}

        {/* Destination / content */}
        <PaperSurface className="p-6">
          <Eyebrow ink className="mb-3 block">
            {isDynamic ? "Current destination" : "Encoded content"}
          </Eyebrow>
          <p className="font-body text-[1.0625rem] text-[var(--ink)] break-all">
            {isDynamic ? qr.currentDestination : qr.content}
          </p>
          {isDynamic && (
            <p className="mt-2 font-body text-[0.8125rem] italic text-[var(--ink-muted)]">
              Version {qr.currentVersion} ·{" "}
              {new Date(qr.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </PaperSurface>

        {/* Edit destination (dynamic only) */}
        {isDynamic && <EditDestinationCard qrId={qrId} />}

        {/* Edit design */}
        <EditDesignCard qrId={qrId} />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: "terracotta";
}) {
  return (
    <PaperSurface variant="inset" className="p-5">
      <Eyebrow className="block mb-2">{label}</Eyebrow>
      <div
        className="display-heading text-[clamp(1.5rem,2.5vw,2rem)] tabular-nums capitalize"
        style={{ color: accent === "terracotta" ? "var(--terracotta)" : "var(--ink)" }}
      >
        {value}
      </div>
    </PaperSurface>
  );
}

function EditDestinationCard({ qrId }: { qrId: string }) {
  const { data: qr } = useQrDetail(qrId);
  const changeDest = useChangeDestination(qrId);
  const { toast } = useToast();
  const [value, setValue] = React.useState("");
  const [editing, setEditing] = React.useState(false);

  React.useEffect(() => {
    if (qr?.currentDestination) setValue(qr.currentDestination);
  }, [qr?.currentDestination]);

  if (!qr) return null;
  const validation = validateDestinationUrl(value);
  const changed = value.trim() !== (qr.currentDestination || "").trim();

  const onSave = () => {
    if (!validation.ok) {
      toast({
        title: "Invalid destination",
        description: validation.reason,
        variant: "destructive",
      });
      return;
    }
    changeDest.mutate(validation.normalized!, {
      onSuccess: () => {
        toast({ title: "Destination updated", description: "New version created." });
        setEditing(false);
      },
      onError: (e) => {
        toast({
          title: "Couldn't update",
          description: (e as Error).message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <PaperSurface className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Eyebrow ink>Edit destination</Eyebrow>
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setValue(qr.currentDestination || "");
              }}
              className="font-sans text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] inline-flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="font-sans text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] inline-flex items-center gap-1"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        )}
      </div>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!editing || changeDest.isPending}
        className="h-11 bg-[var(--paper-3)] border-[var(--rule-strong)] focus-visible:border-[var(--ink)] font-body text-[1rem] disabled:opacity-80"
      />
      {editing && (
        <div className="mt-4 flex items-center justify-between">
          <p className="font-body text-[0.75rem] italic text-[var(--ink-muted)]">
            Changing this creates a new version. The printed QR stays valid.
          </p>
          <InkButton
            size="sm"
            onClick={onSave}
            disabled={!changed || !validation.ok || changeDest.isPending}
          >
            {changeDest.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Check className="h-3.5 w-3.5" /> Save
              </>
            )}
          </InkButton>
        </div>
      )}
    </PaperSurface>
  );
}

function EditDesignCard({ qrId }: { qrId: string }) {
  const { data: qr } = useQrDetail(qrId);
  const updateDesign = useUpdateDesign(qrId);
  const { toast } = useToast();
  const [config, setConfig] = React.useState(qr?.designConfig);
  const [editing, setEditing] = React.useState(false);

  React.useEffect(() => {
    if (qr?.designConfig) setConfig(qr.designConfig);
  }, [qr?.designConfig]);

  if (!qr || !config) return null;

  const onSave = () => {
    updateDesign.mutate(config, {
      onSuccess: () => {
        toast({ title: "Design updated" });
        setEditing(false);
      },
    });
  };

  return (
    <PaperSurface className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Eyebrow ink>Design</Eyebrow>
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setConfig(qr.designConfig);
              }}
              className="font-sans text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] inline-flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
            <InkButton size="sm" onClick={onSave} disabled={updateDesign.isPending}>
              {updateDesign.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" /> Save
                </>
              )}
            </InkButton>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="font-sans text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] inline-flex items-center gap-1"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        )}
      </div>
      {editing ? (
        <QRDesignPanel config={config} onChange={setConfig} />
      ) : (
        <DesignSummary config={config} />
      )}
    </PaperSurface>
  );
}

function DesignSummary({ config }: { config: import("@/lib/qr/types").QrDesignConfig }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div>
        <Eyebrow className="block mb-1.5">Foreground</Eyebrow>
        <div className="flex items-center gap-2">
          <span
            className="h-5 w-5 border border-[var(--rule)]"
            style={{ backgroundColor: config.fgColor }}
          />
          <span className="font-sans text-xs text-[var(--ink-2)] uppercase">{config.fgColor}</span>
        </div>
      </div>
      <div>
        <Eyebrow className="block mb-1.5">Background</Eyebrow>
        <div className="flex items-center gap-2">
          <span
            className="h-5 w-5 border border-[var(--rule)]"
            style={{ backgroundColor: config.bgColor }}
          />
          <span className="font-sans text-xs text-[var(--ink-2)] uppercase">{config.bgColor}</span>
        </div>
      </div>
      <div>
        <Eyebrow className="block mb-1.5">Pattern</Eyebrow>
        <span className="font-sans text-xs text-[var(--ink-2)] capitalize">{config.pattern}</span>
      </div>
      <div>
        <Eyebrow className="block mb-1.5">Error correction</Eyebrow>
        <span className="font-sans text-xs text-[var(--ink-2)] uppercase">{config.errorCorrection}</span>
      </div>
    </div>
  );
}

/* ------------------------------- Analytics tab ------------------------------ */

function AnalyticsTab({ qrId }: { qrId: string }) {
  const [range, setRange] = React.useState<"today" | "7d" | "30d" | "90d">("30d");
  const { data: analytics, isLoading } = useAnalytics(qrId, range);

  return (
    <div className="space-y-8">
      {/* Range filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Eyebrow ink>The Scan Book</Eyebrow>
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              aria-pressed={range === r.value}
              className={cn(
                "h-8 px-3 border rounded-[2px] font-sans text-xs transition-colors",
                range === r.value
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper-3)]"
                  : "border-[var(--rule)] text-[var(--ink-2)] hover:border-[var(--ink)]"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <PaperSurface variant="inset" className="p-5">
          <Eyebrow className="block mb-2">Total scans</Eyebrow>
          <MetricNumber value={(analytics?.totalScans ?? 0).toLocaleString()} />
        </PaperSurface>
        <PaperSurface variant="inset" className="p-5">
          <Eyebrow className="block mb-2">In range</Eyebrow>
          <MetricNumber value={(analytics?.scansInRange ?? 0).toLocaleString()} />
        </PaperSurface>
        <PaperSurface variant="inset" className="p-5">
          <Eyebrow className="block mb-2">Unique visitors</Eyebrow>
          <MetricNumber value={(analytics?.uniqueVisitors ?? 0).toLocaleString()} />
        </PaperSurface>
        <PaperSurface variant="inset" className="p-5">
          <Eyebrow className="block mb-2">Growth</Eyebrow>
          <MetricNumber
            value={`${analytics && analytics.growthPct >= 0 ? "+" : ""}${analytics?.growthPct ?? 0}%`}
            className={
              (analytics?.growthPct ?? 0) >= 0
                ? "text-[var(--botanical)]"
                : "text-[var(--terracotta)]"
            }
          />
        </PaperSurface>
      </div>

      {/* Timeline chart */}
      <PaperSurface className="p-6">
        <ScanChart data={analytics} loading={isLoading} />
      </PaperSurface>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PaperSurface className="p-6">
          <Breakdown
            title="What did they use?"
            items={analytics?.devices ?? []}
            loading={isLoading}
          />
        </PaperSurface>
        <PaperSurface className="p-6">
          <Breakdown
            title="Where did they scan?"
            items={analytics?.locations ?? []}
            loading={isLoading}
            note="Location is approximate and may be inferred from network information."
          />
        </PaperSurface>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PaperSurface className="p-6">
          <Breakdown title="Operating system" items={analytics?.os ?? []} loading={isLoading} />
        </PaperSurface>
        <PaperSurface className="p-6">
          <HourlyChart data={analytics} peakHour={analytics?.peakHour ?? 0} loading={isLoading} />
        </PaperSurface>
      </div>

      {/* Recent scans */}
      <PaperSurface className="p-6">
        <Eyebrow ink className="mb-4 block">
          Recent scans
        </Eyebrow>
        {isLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-4 w-4 animate-spin mx-auto text-[var(--ink-muted)]" />
          </div>
        ) : (analytics?.recent?.length ?? 0) === 0 ? (
          <p className="py-8 text-center font-body text-sm italic text-[var(--ink-muted)]">
            No scans yet. Once someone scans your QR, activity will appear here.
          </p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto scroll-area">
            {analytics?.recent.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-[var(--rule)] last:border-0"
              >
                <div>
                  <div className="font-body text-[0.875rem] text-[var(--ink)]">
                    {r.deviceType} · {r.os}
                  </div>
                  <div className="font-sans text-[0.6875rem] text-[var(--ink-muted)]">
                    {r.city !== "—" ? `${r.city}, ` : ""}
                    {r.country}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-sans text-[0.6875rem] text-[var(--ink-2)] tabular-nums">
                    {new Date(r.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                  {r.simulated && (
                    <span className="font-sans text-[0.625rem] text-[var(--ochre)] uppercase tracking-wide">
                      test
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PaperSurface>

      <p className="font-body text-[0.75rem] italic text-[var(--ink-muted)] text-center">
        Unique visitors are estimated, not exact human counts. Location is
        approximate and never GPS-precise.
      </p>
    </div>
  );
}

/* ------------------------------- Activity tab ------------------------------- */

const ACTION_LABELS: Record<string, string> = {
  CREATED: "QR created",
  DESTINATION_CHANGED: "Destination changed",
  DESIGN_UPDATED: "QR design updated",
  STATUS_CHANGED: "Status changed",
  VERSION_RESTORED: "Version restored",
  NAME_CHANGED: "Renamed",
  REPORTED: "Reported",
};

function ActivityTab({ qrId }: { qrId: string }) {
  const { data: activity, isLoading } = useActivity(qrId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Eyebrow ink>Margin Notes</Eyebrow>
        <span className="font-sans text-[0.6875rem] text-[var(--ink-muted)]">
          Immutable record
        </span>
      </div>
      <BotanicalSprig variant="center" className="h-20 mx-auto opacity-60" />
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="h-4 w-4 animate-spin mx-auto text-[var(--ink-muted)]" />
        </div>
      ) : !activity || activity.length === 0 ? (
        <PaperSurface className="p-12 text-center">
          <p className="font-body text-sm italic text-[var(--ink-muted)]">
            Nothing here yet. Activity will be recorded as you make changes.
          </p>
        </PaperSurface>
      ) : (
        <div className="relative pl-6">
          {/* vertical rule */}
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-[var(--rule-strong)]" />
          <div className="space-y-6">
            {activity.map((entry) => (
              <div key={entry.id} className="relative">
                <span
                  className="absolute -left-6 top-1.5 h-2.5 w-2.5 rounded-full border-2"
                  style={{
                    backgroundColor: "var(--paper)",
                    borderColor: dotColor(entry.action),
                  }}
                />
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-body text-[1rem] text-[var(--ink)]">
                    {ACTION_LABELS[entry.action] || entry.action}
                  </span>
                  <span className="font-sans text-[0.6875rem] text-[var(--ink-muted)] tabular-nums shrink-0">
                    {new Date(entry.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {entry.metadata && renderMetadata(entry.action, entry.metadata)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function dotColor(action: string): string {
  if (action === "CREATED") return "var(--botanical)";
  if (action === "DESTINATION_CHANGED" || action === "VERSION_RESTORED")
    return "var(--terracotta)";
  if (action === "STATUS_CHANGED") return "var(--ochre)";
  return "var(--ink-muted)";
}

function renderMetadata(action: string, meta: Record<string, unknown>) {
  if (action === "DESTINATION_CHANGED") {
    return (
      <div className="mt-2 font-body text-[0.8125rem] text-[var(--ink-muted)] space-y-1">
        {meta.previous != null && (
          <div>
            <span className="eyebrow mr-2">Previous</span>
            <span className="break-all">{String(meta.previous)}</span>
          </div>
        )}
        {meta.next != null && (
          <div>
            <span className="eyebrow mr-2">New</span>
            <span className="break-all text-[var(--terracotta)]">{String(meta.next)}</span>
          </div>
        )}
      </div>
    );
  }
  if (action === "VERSION_RESTORED") {
    return (
      <div className="mt-2 font-body text-[0.8125rem] text-[var(--ink-muted)]">
        Restored from v{String(meta.restoredFromVersion)} → new v{String(meta.newVersion)}
      </div>
    );
  }
  if (action === "STATUS_CHANGED") {
    return (
      <div className="mt-2 font-body text-[0.8125rem] text-[var(--ink-muted)]">
        {String(meta.previous)} → {String(meta.next)}
      </div>
    );
  }
  if (action === "NAME_CHANGED") {
    return (
      <div className="mt-2 font-body text-[0.8125rem] text-[var(--ink-muted)]">
        Renamed to “{String(meta.name)}”
      </div>
    );
  }
  return null;
}

/* ------------------------------- Versions tab ------------------------------ */

function VersionsTab({ qrId }: { qrId: string }) {
  const { data: versions, isLoading } = useVersions(qrId);
  const restore = useRestoreVersion(qrId);
  const { toast } = useToast();

  const onRestore = (versionId: string, version: number) => {
    restore.mutate(versionId, {
      onSuccess: () => {
        toast({
          title: `Version ${version} restored`,
          description: "A new version was created pointing to this destination.",
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Eyebrow ink>Version History</Eyebrow>
        <span className="font-sans text-[0.6875rem] text-[var(--ink-muted)]">
          {versions?.length ?? 0} versions
        </span>
      </div>
      <p className="font-body text-[0.875rem] italic text-[var(--ink-muted)]">
        Every destination change creates a new version. Restoring an old version
        creates a new one — history is never destroyed.
      </p>
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="h-4 w-4 animate-spin mx-auto text-[var(--ink-muted)]" />
        </div>
      ) : !versions || versions.length === 0 ? (
        <PaperSurface className="p-12 text-center">
          <p className="font-body text-sm italic text-[var(--ink-muted)]">
            No versions yet. Change the destination to create one.
          </p>
        </PaperSurface>
      ) : (
        <div className="space-y-4">
          {versions.map((v) => (
            <PaperSurface key={v.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="display-heading text-2xl"
                      style={{
                        color: v.isCurrent ? "var(--terracotta)" : "var(--ink-2)",
                      }}
                    >
                      v{String(v.version).padStart(2, "0")}
                    </span>
                    {v.isCurrent && (
                      <span className="eyebrow-ink text-[var(--terracotta)]">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="font-body text-[1.0625rem] text-[var(--ink)] break-all">
                    {v.url}
                  </p>
                  <p className="mt-1 font-sans text-[0.6875rem] text-[var(--ink-muted)]">
                    {new Date(v.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {!v.isCurrent && (
                  <InkButton
                    variant="paper"
                    size="sm"
                    onClick={() => onRestore(v.id, v.version)}
                    disabled={restore.isPending}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Restore
                  </InkButton>
                )}
              </div>
            </PaperSurface>
          ))}
        </div>
      )}
    </div>
  );
}
