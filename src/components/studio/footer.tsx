"use client";

import * as React from "react";
import { useNav } from "@/lib/nav";
import { BotanicalSprig } from "@/components/studio/primitives";

export function StudioFooter() {
  const go = useNav((s) => s.go);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto relative border-t border-[var(--rule)] bg-[var(--paper)]">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="max-w-md">
            <div className="eyebrow mb-3 text-[var(--terracotta)] font-bold tracking-widest">Mr.QR Studio</div>
            <p className="font-body text-[0.9375rem] leading-relaxed text-[var(--ink-2)]">
              An editorial dynamic QR platform. Encode once for something
              permanent, or go dynamic to change the destination and measure
              every scan.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-2">
            <FooterLink onClick={() => go({ view: "home" })}>Home</FooterLink>
            <FooterLink onClick={() => go({ view: "create-static" })}>
              Static QR
            </FooterLink>
            <FooterLink onClick={() => go({ view: "create-dynamic" })}>
              Dynamic QR
            </FooterLink>
            <FooterLink onClick={() => go({ view: "sign-in" })}>Sign in</FooterLink>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--rule)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
            © {year} Mr.QR · A tactile sketchbook for digital links
          </p>
          <p className="font-sans text-[0.6875rem] text-[var(--ink-muted)]">
            Location data is approximate. Never GPS-precise.
          </p>
        </div>
      </div>

      <BotanicalSprig
        variant="left"
        className="absolute -bottom-2 left-0 h-20 w-40 opacity-60 pointer-events-none"
      />
    </footer>
  );
}

function FooterLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="font-sans text-[0.8125rem] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
    >
      {children}
    </button>
  );
}
