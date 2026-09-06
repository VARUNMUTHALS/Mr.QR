"use client";

import * as React from "react";
import Link from "next/link";
import { UserButton, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { useNav } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Plus, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function StudioHeader() {
  const { isSignedIn, user } = useUser();
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
            aria-label="Mr.QR — home"
          >
            <BrandMark />
            <span className="flex items-center text-[0.9375rem] font-bold tracking-tight text-[var(--ink)]">
              <span className="font-serif italic text-lg mr-0.5">Mr.</span>
              <span className="text-[var(--terracotta)] font-sans tracking-wider">QR</span>
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
            {isSignedIn && (
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

            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => go({ view: "dashboard" })}
                  className="font-sans text-xs text-[var(--ink)]"
                >
                  <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> My QR codes
                </Button>
                <Button
                  size="sm"
                  onClick={() => go({ view: "create-dynamic" })}
                  className="font-sans text-xs bg-[var(--terracotta)] hover:bg-[var(--terracotta)]/90 text-white"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Create QR
                </Button>
                <UserButton />
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-sans text-xs text-[var(--ink)]"
                  >
                    Sign in
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button
                    size="sm"
                    className="font-sans text-xs bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--ink-2)]"
                  >
                    Get Started
                  </Button>
                </SignUpButton>
              </div>
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
      className="h-8 w-8"
      aria-hidden
    >
      <rect width="32" height="32" rx="7" fill="#141312" />
      
      {/* Finder Patterns */}
      <rect x="4" y="4" width="8" height="8" rx="2" fill="none" stroke="var(--terracotta)" strokeWidth="1.6" />
      <rect x="6.5" y="6.5" width="3" height="3" rx="0.8" fill="var(--terracotta)" />
      
      <rect x="20" y="4" width="8" height="8" rx="2" fill="none" stroke="var(--terracotta)" strokeWidth="1.6" />
      <rect x="22.5" y="6.5" width="3" height="3" rx="0.8" fill="var(--terracotta)" />
      
      <rect x="4" y="20" width="8" height="8" rx="2" fill="none" stroke="var(--terracotta)" strokeWidth="1.6" />
      <rect x="6.5" y="22.5" width="3" height="3" rx="0.8" fill="var(--terracotta)" />

      {/* Signature Glasses */}
      <circle cx="11.5" cy="14.5" r="3.2" fill="none" stroke="#FAF8F5" strokeWidth="1.3" />
      <circle cx="10.8" cy="13.8" r="0.7" fill="#FAF8F5" opacity="0.8" />
      <circle cx="19.5" cy="14.5" r="3.2" fill="none" stroke="#FAF8F5" strokeWidth="1.3" />
      <circle cx="18.8" cy="13.8" r="0.7" fill="#FAF8F5" opacity="0.8" />
      <path d="M 14.7 14.2 Q 15.5 13.2 16.3 14.2" fill="none" stroke="#FAF8F5" strokeWidth="1.2" strokeLinecap="round" />

      {/* Bowtie */}
      <polygon points="12,22 14.8,23.3 12,24.6" fill="var(--terracotta)" />
      <polygon points="19,22 16.2,23.3 19,24.6" fill="var(--terracotta)" />
      <rect x="14.5" y="22.3" width="2" height="2" rx="0.5" fill="#FAF8F5" />
    </svg>
  );
}

// keep Link import used (for potential static links)
export const _Link = Link;
