"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface QrListItem {
  id: string;
  type: "STATIC" | "DYNAMIC";
  name: string;
  slug: string | null;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  currentDestination: string | null;
  totalScans: number;
}

export interface QrDetail {
  id: string;
  type: "STATIC" | "DYNAMIC";
  name: string;
  slug: string | null;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  content: string | null;
  designConfig: import("@/lib/qr/types").QrDesignConfig;
  createdAt: string;
  updatedAt: string;
  currentDestination: string | null;
  currentVersion: number | null;
  totalScans: number;
  destinations: {
    id: string;
    url: string;
    version: number;
    isCurrent: boolean;
    createdAt: string;
  }[];
}

async function jfetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    let msg = "Something went wrong. Try again.";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function useQrList(enabled = true) {
  return useQuery({
    queryKey: ["qr-list"],
    queryFn: () => jfetch("/api/qr").then((d) => d.qrs as QrListItem[]),
    enabled,
  });
}

export function useQrDetail(id: string | null, enabled = true) {
  return useQuery({
    queryKey: ["qr", id],
    queryFn: () => jfetch(`/api/qr/${id}`).then((d) => d.qr as QrDetail),
    enabled: !!id && enabled,
  });
}

export function useCreateQr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      type: "STATIC" | "DYNAMIC";
      name: string;
      content?: string;
      destination?: string;
      designConfig?: Partial<import("@/lib/qr/types").QrDesignConfig>;
    }) => jfetch("/api/qr", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qr-list"] });
    },
  });
}

export function useUpdateQr(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string }) =>
      jfetch(`/api/qr/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qr", id] });
      qc.invalidateQueries({ queryKey: ["qr-list"] });
    },
  });
}

export function useChangeDestination(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (destination: string) =>
      jfetch(`/api/qr/${id}/destination`, {
        method: "POST",
        body: JSON.stringify({ destination }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qr", id] });
      qc.invalidateQueries({ queryKey: ["qr-list"] });
      qc.invalidateQueries({ queryKey: ["qr", id, "activity"] });
      qc.invalidateQueries({ queryKey: ["qr", id, "versions"] });
    },
  });
}

export function useChangeStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: "ACTIVE" | "PAUSED" | "ARCHIVED") =>
      jfetch(`/api/qr/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qr", id] });
      qc.invalidateQueries({ queryKey: ["qr-list"] });
      qc.invalidateQueries({ queryKey: ["qr", id, "activity"] });
    },
  });
}

export function useUpdateDesign(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (designConfig: import("@/lib/qr/types").QrDesignConfig) =>
      jfetch(`/api/qr/${id}/design`, {
        method: "PUT",
        body: JSON.stringify({ designConfig }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qr", id] });
      qc.invalidateQueries({ queryKey: ["qr", id, "activity"] });
    },
  });
}

export function useRestoreVersion(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) =>
      jfetch(`/api/qr/${id}/versions/${versionId}/restore`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qr", id] });
      qc.invalidateQueries({ queryKey: ["qr", id, "versions"] });
      qc.invalidateQueries({ queryKey: ["qr", id, "activity"] });
    },
  });
}

export function useSimulateScan(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      jfetch(`/api/qr/${id}/simulate`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qr", id, "analytics"] });
      qc.invalidateQueries({ queryKey: ["qr", id] });
    },
  });
}

export function useDeleteQr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jfetch(`/api/qr/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qr-list"] });
    },
  });
}

/* analytics */
export interface AnalyticsData {
  range: string;
  since: string;
  totalScans: number;
  scansInRange: number;
  uniqueVisitors: number;
  estimatedUniqueVisitors?: number;
  growthPct: number;
  timeline: { label: string; date: string; scans: number; unique: number }[];
  devices: { key: string; count: number; pct: number }[];
  os: { key: string; count: number; pct: number }[];
  browsers: { key: string; count: number; pct: number }[];
  locations: { key: string; count: number; pct: number }[];
  hourly: { hour: number; count: number }[];
  peakHour: number;
  recent: {
    timestamp: string;
    deviceType: string;
    os: string;
    country: string;
    city: string;
    simulated: boolean;
  }[];
}

export function useAnalytics(id: string | null, range: string, enabled = true) {
  return useQuery({
    queryKey: ["qr", id, "analytics", range],
    queryFn: () =>
      jfetch(`/api/qr/${id}/analytics?range=${range}`).then(
        (d) => d as AnalyticsData
      ),
    enabled: !!id && enabled,
    refetchInterval: 15000,
  });
}

export function useActivity(id: string | null, enabled = true) {
  return useQuery({
    queryKey: ["qr", id, "activity"],
    queryFn: () =>
      jfetch(`/api/qr/${id}/activity`).then(
        (d) => d.activity as {
          id: string;
          action: string;
          metadata: Record<string, unknown> | null;
          createdAt: string;
        }[]
      ),
    enabled: !!id && enabled,
  });
}

export function useVersions(id: string | null, enabled = true) {
  return useQuery({
    queryKey: ["qr", id, "versions"],
    queryFn: () =>
      jfetch(`/api/qr/${id}/versions`).then(
        (d) => d.versions as {
          id: string;
          url: string;
          version: number;
          isCurrent: boolean;
          createdAt: string;
        }[]
      ),
    enabled: !!id && enabled,
  });
}
