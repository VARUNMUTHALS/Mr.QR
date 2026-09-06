"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNav, type ViewState } from "@/lib/nav";
import { useUser } from "@clerk/nextjs";
import { HomeView } from "@/components/studio/views/home-view";
import { StaticBuilderView } from "@/components/studio/views/static-builder-view";
import { DynamicBuilderView } from "@/components/studio/views/dynamic-builder-view";
import { SignInView } from "@/components/studio/views/sign-in-view";
import { DashboardView } from "@/components/studio/views/dashboard-view";
import { QrDetailView } from "@/components/studio/views/qr-detail-view";
import { StudioHeader } from "@/components/studio/header";
import { StudioFooter } from "@/components/studio/footer";

const viewVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    y: dir > 0 ? 18 : -10,
  }),
  center: { opacity: 1, y: 0 },
  exit: (dir: number) => ({
    opacity: 0,
    y: dir > 0 ? -10 : 18,
  }),
};

function viewKey(v: ViewState): string {
  switch (v.view) {
    case "qr-detail":
      return `qr-detail:${v.qrId}:${v.tab ?? "overview"}`;
    case "sign-in":
      return "sign-in";
    default:
      return v.view;
  }
}

export function AppShell() {
  const view = useNav((s) => s.view);
  const history = useNav((s) => s.history);
  const { isSignedIn } = useUser();

  // Direction for transitions (forward/back). Tracked via state so it is
  // available during render without touching refs.
  const [direction, setDirection] = React.useState(1);
  const prevLen = React.useRef(0);
  React.useEffect(() => {
    if (history.length > prevLen.current) setDirection(1);
    else if (history.length < prevLen.current) setDirection(-1);
    prevLen.current = history.length;
  }, [history.length]);

  return (
    <div className="relative min-h-screen flex flex-col">
      <StudioHeader />
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={viewKey(view)}
            custom={direction}
            variants={viewVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: 0.45,
              ease: [0.22, 0.61, 0.36, 1],
            }}
          >
            <ViewRouter isSignedIn={Boolean(isSignedIn)} view={view} />
          </motion.div>
        </AnimatePresence>
      </main>
      <StudioFooter />
    </div>
  );
}

function ViewRouter({
  view,
  isSignedIn,
}: {
  view: ViewState;
  isSignedIn: boolean;
}) {
  switch (view.view) {
    case "home":
      return <HomeView />;
    case "create-static":
      return <StaticBuilderView />;
    case "create-dynamic":
      if (!isSignedIn) return <SignInView redirectTo={view} />;
      return <DynamicBuilderView />;
    case "sign-in":
      return <SignInView />;
    case "dashboard":
      if (!isSignedIn) return <SignInView redirectTo={view} />;
      return <DashboardView />;
    case "qr-detail":
      if (!isSignedIn) return <SignInView redirectTo={view} />;
      return <QrDetailView qrId={view.qrId} tab={view.tab ?? "overview"} />;
    default:
      return <HomeView />;
  }
}
