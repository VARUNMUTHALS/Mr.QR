"use client";

import { create } from "zustand";

export type ViewName =
  | "home"
  | "create-static"
  | "create-dynamic"
  | "sign-in"
  | "dashboard"
  | "qr-detail";

export interface QrDetailTarget {
  view: "qr-detail";
  qrId: string;
  tab?: "overview" | "analytics" | "activity" | "versions";
}

export type ViewState =
  | { view: "home" }
  | { view: "create-static" }
  | { view: "create-dynamic" }
  | { view: "sign-in"; redirectTo?: ViewState }
  | { view: "dashboard" }
  | { view: "qr-detail"; qrId: string; tab?: "overview" | "analytics" | "activity" | "versions" };

interface NavState {
  view: ViewState;
  history: ViewState[];
  go: (view: ViewState) => void;
  back: () => void;
  home: () => void;
}

export const useNav = create<NavState>((set, get) => ({
  view: { view: "home" },
  history: [],
  go: (view) =>
    set((state) => ({
      history: [...state.history, state.view],
      view,
    })),
  back: () => {
    const hist = get().history;
    if (hist.length === 0) {
      set({ view: { view: "home" } });
      return;
    }
    const prev = hist[hist.length - 1];
    set({ view: prev, history: hist.slice(0, -1) });
  },
  home: () => set({ view: { view: "home" }, history: [] }),
}));

export function currentViewName(v: ViewState): ViewName {
  return v.view as ViewName;
}
