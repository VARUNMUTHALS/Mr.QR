"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Sparkles, Scan, ArrowUpRight, ShieldCheck } from "lucide-react";

export function InteractiveHeroCard({ onClick }: { onClick?: () => void }) {
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Mouse coordinate motion values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring physics inspired by MengTo ThreeUI
  const springConfig = { damping: 20, stiffness: 180, mass: 0.6 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), springConfig);
  const glareX = useSpring(useTransform(x, [-0.5, 0.5], [0, 100]), springConfig);
  const glareY = useSpring(useTransform(y, [-0.5, 0.5], [0, 100]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      className="perspective-1000 flex items-center justify-center py-6 select-none"
      style={{ perspective: 1200 }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full max-w-[420px] rounded-2xl bg-[var(--paper-card)] border border-[var(--rule-strong)] p-7 sm:p-8 cursor-pointer shadow-[0_30px_70px_-20px_rgba(45,90,67,0.18),0_12px_24px_-10px_rgba(31,35,40,0.08)] transition-shadow hover:shadow-[0_40px_90px_-25px_rgba(200,90,50,0.22),0_20px_35px_-10px_rgba(31,35,40,0.12)] overflow-hidden group"
      >
        {/* Dynamic Light Sheen / Specular Glare (ThreeUI style) */}
        <motion.div
          className="pointer-events-none absolute -inset-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle 320px at ${glareX}% ${glareY}%, rgba(255,255,255,0.45), transparent 75%)`,
          }}
        />

        {/* Ambient Glow Orbs */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 bg-[var(--botanical)]/10 rounded-full blur-3xl group-hover:bg-[var(--terracotta)]/15 transition-colors duration-700" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-44 h-44 bg-[var(--terracotta)]/10 rounded-full blur-3xl group-hover:bg-[var(--botanical)]/15 transition-colors duration-700" />

        {/* Top bar */}
        <div className="flex items-center justify-between relative z-10" style={{ transform: "translateZ(30px)" }}>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--botanical)] animate-pulse" />
            <span className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-[var(--botanical)] font-semibold">
              Live Engine · Dynamic
            </span>
          </div>
          <div className="flex items-center gap-1 font-sans text-xs text-[var(--ink-muted)] group-hover:text-[var(--ink)] transition-colors">
            <span>Explore</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>

        {/* Center QR Graphic with 3D Depth */}
        <div
          className="my-7 flex items-center justify-center relative z-10"
          style={{ transform: "translateZ(50px)" }}
        >
          <div className="relative p-6 rounded-xl bg-[var(--paper-3)] border border-[var(--rule)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),0_15px_35px_-10px_rgba(31,35,40,0.12)] group-hover:border-[var(--terracotta)]/40 transition-colors">
            {/* Corner registration markers */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[var(--ink)]" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[var(--ink)]" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[var(--ink)]" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[var(--ink)]" />

            {/* Stylized QR Matrix Pattern */}
            <svg
              className="w-48 h-48 text-[var(--ink)] transition-transform duration-500 group-hover:scale-[1.02]"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              {/* Corner Eyeball Top-Left */}
              <rect x="10" y="10" width="22" height="22" rx="4" />
              <rect x="14" y="14" width="14" height="14" fill="var(--paper-3)" />
              <rect x="17" y="17" width="8" height="8" rx="2" fill="var(--botanical)" />

              {/* Corner Eyeball Top-Right */}
              <rect x="68" y="10" width="22" height="22" rx="4" />
              <rect x="72" y="14" width="14" height="14" fill="var(--paper-3)" />
              <rect x="75" y="17" width="8" height="8" rx="2" fill="var(--terracotta)" />

              {/* Corner Eyeball Bottom-Left */}
              <rect x="10" y="68" width="22" height="22" rx="4" />
              <rect x="14" y="72" width="14" height="14" fill="var(--paper-3)" />
              <rect x="17" y="75" width="8" height="8" rx="2" fill="var(--ink)" />

              {/* Data Modules */}
              <rect x="38" y="12" width="5" height="5" rx="1.5" />
              <rect x="46" y="12" width="5" height="5" rx="1.5" />
              <rect x="54" y="12" width="5" height="5" rx="1.5" />
              <rect x="38" y="20" width="5" height="5" rx="1.5" />
              <rect x="54" y="20" width="5" height="5" rx="1.5" />
              <rect x="38" y="28" width="5" height="5" rx="1.5" />
              <rect x="46" y="28" width="5" height="5" rx="1.5" />

              <rect x="12" y="38" width="5" height="5" rx="1.5" />
              <rect x="20" y="38" width="5" height="5" rx="1.5" />
              <rect x="28" y="38" width="5" height="5" rx="1.5" />
              <rect x="36" y="38" width="5" height="5" rx="1.5" />
              <rect x="44" y="38" width="12" height="12" rx="3" fill="var(--botanical)" />
              <rect x="60" y="38" width="5" height="5" rx="1.5" />
              <rect x="68" y="38" width="5" height="5" rx="1.5" />
              <rect x="76" y="38" width="5" height="5" rx="1.5" />
              <rect x="84" y="38" width="5" height="5" rx="1.5" />

              <rect x="38" y="54" width="5" height="5" rx="1.5" />
              <rect x="46" y="54" width="5" height="5" rx="1.5" />
              <rect x="54" y="54" width="5" height="5" rx="1.5" />
              <rect x="68" y="54" width="5" height="5" rx="1.5" />
              <rect x="76" y="54" width="5" height="5" rx="1.5" />
              <rect x="84" y="54" width="5" height="5" rx="1.5" />

              <rect x="38" y="68" width="5" height="5" rx="1.5" />
              <rect x="46" y="68" width="5" height="5" rx="1.5" />
              <rect x="54" y="68" width="5" height="5" rx="1.5" />
              <rect x="68" y="68" width="5" height="5" rx="1.5" />
              <rect x="76" y="68" width="5" height="5" rx="1.5" />

              <rect x="38" y="76" width="5" height="5" rx="1.5" />
              <rect x="54" y="76" width="5" height="5" rx="1.5" />
              <rect x="68" y="76" width="5" height="5" rx="1.5" />
              <rect x="84" y="76" width="5" height="5" rx="1.5" />

              <rect x="38" y="84" width="5" height="5" rx="1.5" />
              <rect x="46" y="84" width="5" height="5" rx="1.5" />
              <rect x="54" y="84" width="5" height="5" rx="1.5" />
              <rect x="76" y="84" width="5" height="5" rx="1.5" />
            </svg>
          </div>
        </div>

        {/* Bottom Details with 3D Depth */}
        <div className="space-y-3 relative z-10" style={{ transform: "translateZ(35px)" }}>
          <div className="flex items-center justify-between">
            <span className="font-sans text-[0.8125rem] text-[var(--ink-muted)]">Permanent Route</span>
            <code className="font-mono text-xs text-[var(--ink)] bg-[var(--paper-3)] px-2 py-1 rounded border border-[var(--rule)]">
              /q/8F72KX92
            </code>
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--ink-muted)] pt-2 border-t border-[var(--rule)]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--botanical)]" /> PostgreSQL + HMAC
            </span>
            <span className="inline-flex items-center gap-1 text-[var(--terracotta)] font-medium">
              <Sparkles className="h-3 w-3" /> Real Telemetry
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
