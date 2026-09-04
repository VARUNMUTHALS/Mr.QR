"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useNav } from "@/lib/nav";
import {
  Eyebrow,
  EditorialHeading,
  InkButton,
  SectionRule,
  PaperSurface,
  BotanicalSprig,
} from "@/components/studio/primitives";
import { ArrowRight, ArrowUpRight, Leaf, Activity, ScanLine, History } from "lucide-react";

export function HomeView() {
  const go = useNav((s) => s.go);

  return (
    <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
      {/* Hero */}
      <section className="relative pt-10 sm:pt-20 pb-14 sm:pb-24">
        <BotanicalSprig
          variant="right"
          className="absolute top-6 right-0 hidden md:block h-28 w-56 opacity-70 pointer-events-none"
        />
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
            className="eyebrow text-[var(--ink-muted)] mb-6"
          >
            QR Studio · Vol. 01
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 0.61, 0.36, 1] }}
            className="display-heading text-[var(--ink)] text-[clamp(2.75rem,9vw,6.5rem)] leading-[0.92]"
          >
            Make a QR.
            <br />
            <span className="italic text-[var(--botanical)]">Make it useful.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 0.61, 0.36, 1] }}
            className="mt-8 font-body text-[1.0625rem] sm:text-[1.1875rem] leading-[1.65] text-[var(--ink-2)] max-w-2xl"
          >
            Create a beautiful QR code in seconds. Choose{" "}
            <em className="not-italic text-[var(--ink)] font-medium">static</em>{" "}
            for something permanent, or{" "}
            <em className="not-italic text-[var(--ink)] font-medium">dynamic</em>{" "}
            when you want to change its destination and measure what happens
            after every scan.
          </motion.p>
        </div>
      </section>

      {/* Two plates */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 pb-20">
        <Plate
          index="01"
          accent="botanical"
          title="Static QR"
          tagline="Encode once."
          tagline2="Keep forever."
          description="Your content is encoded directly into the QR. No redirect, no account, no tracking — just a QR that works the day you print it and the day after."
          features={[
            { icon: ScanLine, label: "Instant generation" },
            { icon: Leaf, label: "No redirect, no tracking" },
          ]}
          cta="Create Static QR"
          onClick={() => go({ view: "create-static" })}
        />
        <Plate
          index="02"
          accent="terracotta"
          title="Dynamic QR"
          tagline="Change anytime."
          tagline2="Measure every scan."
          description="The QR points to a stable studio URL. Edit the destination later without reprinting, and watch the story of every scan unfold in the Scan Book."
          features={[
            { icon: Activity, label: "Scan analytics" },
            { icon: History, label: "Version history" },
          ]}
          cta="Create Dynamic QR"
          onClick={() => go({ view: "create-dynamic" })}
          delay={0.08}
        />
      </section>

      {/* The mental model */}
      <section className="pb-24">
        <SectionRule label="Two modes, one studio" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          <ModelCard
            heading="Static"
            steps={["Content", "QR", "Download"]}
            note="The information lives inside the QR itself. Forever."
          />
          <ModelCard
            heading="Dynamic"
            steps={["QR", "Redirect", "Scan", "Analytics", "Edit"]}
            note="The QR points to the studio. The destination is a story you can rewrite."
            accent
          />
        </div>
      </section>
    </div>
  );
}

function Plate({
  index,
  title,
  tagline,
  tagline2,
  description,
  features,
  cta,
  onClick,
  accent,
  delay = 0,
}: {
  index: string;
  title: string;
  tagline: string;
  tagline2: string;
  description: string;
  features: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string }[];
  cta: string;
  onClick: () => void;
  accent: "botanical" | "terracotta";
  delay?: number;
}) {
  const accentColor = accent === "botanical" ? "var(--botanical)" : "var(--terracotta)";
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 0.61, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="text-left group cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={`${cta} — ${title}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <PaperSurface className="h-full overflow-hidden">
        <div className="p-7 sm:p-10 flex flex-col h-full">
          {/* Header row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span
                className="font-sans text-[0.6875rem] tracking-[0.24em] uppercase"
                style={{ color: accentColor }}
              >
                {title} / {index}
              </span>
            </div>
            <ArrowUpRight
              className="h-5 w-5 text-[var(--ink-muted)] transition-all duration-300 group-hover:text-[var(--ink)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>

          {/* Big tagline */}
          <div className="mt-10 sm:mt-16 mb-8">
            <EditorialHeading
              as="h3"
              className="text-[clamp(2.25rem,5vw,3.5rem)] leading-[0.98]"
            >
              {tagline}
              <br />
              <span className="italic" style={{ color: accentColor }}>
                {tagline2}
              </span>
            </EditorialHeading>
          </div>

          <p className="font-body text-[0.9375rem] leading-[1.7] text-[var(--ink-2)] max-w-md">
            {description}
          </p>

          {/* Features */}
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {features.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-2 font-sans text-xs text-[var(--ink-muted)]"
              >
                <f.icon className="h-3.5 w-3.5" style={{ color: accentColor }} />
                {f.label}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-auto pt-10">
            <InkButton
              variant={accent === "botanical" ? "botanical" : "terracotta"}
              size="lg"
              className="w-full sm:w-auto"
            >
              {cta}
              <ArrowRight className="h-4 w-4" />
            </InkButton>
          </div>

          {/* Decorative number */}
          <div
            aria-hidden
            className="pointer-events-none absolute right-6 bottom-4 display-heading text-[8rem] leading-none opacity-[0.06] select-none"
            style={{ color: accentColor }}
          >
            {index}
          </div>
        </div>
      </PaperSurface>
    </motion.div>
  );
}

function ModelCard({
  heading,
  steps,
  note,
  accent,
}: {
  heading: string;
  steps: string[];
  note: string;
  accent?: boolean;
}) {
  return (
    <PaperSurface variant="inset" className="p-6 sm:p-8">
      <Eyebrow ink>{heading}</Eyebrow>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <span
              className="font-body text-[0.9375rem]"
              style={{
                color: accent && i === 0 ? "var(--terracotta)" : "var(--ink-2)",
              }}
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <span className="text-[var(--ink-muted)] text-sm">↓</span>
            )}
          </React.Fragment>
        ))}
      </div>
      <p className="mt-6 font-body text-[0.875rem] italic leading-relaxed text-[var(--ink-muted)]">
        {note}
      </p>
    </PaperSurface>
  );
}
