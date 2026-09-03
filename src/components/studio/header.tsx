"use client";

import * as React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, LayoutGrid, Plus, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function StudioHeader() {
  const { data: session, status } = useSession();
  const go = useNav((s) => s.go);
  const back = useNav((s) => s.back);
  const home = useNav((s) => s.home);
  const view = useNav((s) => s.view);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const canGoBack = view.view !== "home";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full backdrop-blur-[2px] transition-colors",
        scrolled
          ? "bg-[var(--paper)]/85 border-b border-[var(--rule)]"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <button
            onClick={home}
            className="group flex items-center gap-2.5"
            aria-label="QR Studio — home"
          >
            <BrandMark />
            <span className="hidden sm:block font-sans text-[0.8125rem] tracking-[0.24em] uppercase text-[var(--ink)]">
              QR&nbsp;Studio
            </span>
          </button>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavBtn
              active={view.view === "home"}
              onClick={() => home()}
            >
              Home
            </NavBtn>
            {status === "authenticated" && (
              <>
                <NavBtn
                  active={view.view === "dashboard"}
                  onClick={() => go({ view: "dashboard" })}
                >
                  QR Codes
                </NavBtn>
                <NavBtn onClick={() => go({ view: "create-static" })}>
                  Create QR
                </NavBtn>
              </>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {canGoBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={back}
                className="font-sans text-xs text-[var(--ink-2)] hover:text-[var(--ink)]"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </Button>
            )}
            {status === "authenticated" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 h-9 pl-1 pr-3 rounded-[2px] border border-[var(--rule)] hover:border-[var(--ink)] transition-colors">
                    <span
                      className="h-7 w-7 rounded-full flex items-center justify-center font-sans text-xs text-[var(--paper-3)]"
                      style={{ backgroundColor: "var(--botanical)" }}
                    >
                      {(session?.user?.name || session?.user?.email || "S")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                    <span className="hidden sm:block font-sans text-xs text-[var(--ink)] max-w-[120px] truncate">
                      {session?.user?.name || session?.user?.email}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 bg-[var(--paper-3)] border-[var(--rule)]"
                >
                  <DropdownMenuLabel className="font-sans text-xs text-[var(--ink-muted)]">
                    {session?.user?.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[var(--rule)]" />
                  <DropdownMenuItem
                    onClick={() => go({ view: "dashboard" })}
                    className="font-sans text-sm text-[var(--ink)] cursor-pointer"
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" /> My QR codes
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => go({ view: "create-static" })}
                    className="font-sans text-sm text-[var(--ink)] cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-2" /> New static QR
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[var(--rule)]" />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="font-sans text-sm text-[var(--destructive)] cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => go({ view: "sign-in" })}
                variant="ghost"
                size="sm"
                className="font-sans text-xs text-[var(--ink)]"
              >
                Sign in
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative h-9 px-3 font-sans text-[0.8125rem] transition-colors rounded-[2px]",
        active
          ? "text-[var(--ink)]"
          : "text-[var(--ink-2)] hover:text-[var(--ink)]"
      )}
    >
      {children}
      {active && (
        <span className="absolute left-3 right-3 -bottom-px h-px bg-[var(--ink)]" />
      )}
    </button>
  );
}

function BrandMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="h-7 w-7 text-[var(--ink)]"
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <g fill="currentColor">
        <rect x="6" y="6" width="5" height="5" />
        <rect x="21" y="6" width="5" height="5" />
        <rect x="6" y="21" width="5" height="5" />
        <rect x="14" y="6" width="2" height="2" />
        <rect x="18" y="10" width="2" height="2" />
        <rect x="14" y="14" width="2" height="2" />
        <rect x="10" y="18" width="2" height="2" />
        <rect x="18" y="18" width="2" height="2" />
        <rect x="22" y="14" width="2" height="2" />
        <rect x="22" y="22" width="2" height="2" />
        <rect x="14" y="22" width="2" height="2" />
      </g>
      <circle cx="16" cy="16" r="3.2" fill="none" stroke="var(--terracotta)" strokeWidth="1.4" />
    </svg>
  );
}

// keep Link import used (for potential static links)
export const _Link = Link;
