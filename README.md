# Dynamic QR Studio — Enterprise Dynamic QR Platform

A production-grade, highly resilient Dynamic QR code generation, redirection, and analytics platform built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **Prisma 6**, and **PostgreSQL**.

> **Note on Updates and Changes**:
> All architectural progress, phased implementation milestones, detailed changelogs, security audits, and deployment tracking are continuously maintained in **[`DEVELOPMENT_TRACKER.md`](./DEVELOPMENT_TRACKER.md)**.

---

## Architectural Highlights

- **Core Invariant**: A dynamic QR code has a permanent, unchanging scan URL (`/q/{shortCode}`). The destination URL can be updated or rolled back at any time without reprinting the physical QR code.
- **Backwards Compatibility**: Existing printed prototype QR codes utilizing `/api/r/{slug}` are permanently supported without disruption.
- **Immutable Destination Versioning**: Every destination modification produces version $N+1$. Restoring previous versions appends a new state rather than mutating historical records.
- **Privacy-First Analytics**: Real-only scan event processing. No synthetic scans or fake geography. IP addresses are never exposed or stored in raw form; unique visitor tracking utilizes salted HMAC visitor keys labeled as *"Estimated unique visitors"*.
- **Organization-Scoped RBAC**: Strict multi-tenant authorization (`OWNER`, `ADMIN`, `EDITOR`, `ANALYST`, `VIEWER`) guarding against Broken Object-Level Authorization (BOLA/IDOR).
- **Zero Frontend Secrets**: No database credentials, JWT secrets, or private API keys are ever bundled into client assets or prefixed with `NEXT_PUBLIC_`.
- **Database Architecture**: Enterprise PostgreSQL via Prisma 6, featuring connection pooling, soft-deletion (`archivedAt`, `deletedAt`), and pre-aggregated daily analytics tables (`ScanDailyAggregate`).

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Server Actions, Route Handlers) |
| **Language & Runtime** | TypeScript 5, Node.js (v25+) / Bun |
| **Styling & UI** | Tailwind CSS v4, shadcn/Radix UI, Framer Motion, Lucide Icons |
| **State & Data** | Zustand v5, TanStack Query v5, React Hook Form, Zod |
| **QR Engine** | `qr-code-styling`, SVG/PNG renderers, high-contrast validation |
| **Database & ORM** | PostgreSQL, Prisma ORM 6 |
| **Security & Auth** | NextAuth v4, bcryptjs, distributed rate limiting, URL scheme sanitizer |
| **Hosting & Deploy** | Vercel (Frontend & Edge Resolver), Render (PostgreSQL & Background Workers) |

---

## Project Structure

```text
├── src/
│   ├── app/
│   │   ├── api/v1/          # Production versioned REST APIs (auth, qr, analytics, orgs)
│   │   ├── q/[shortCode]/   # Public high-performance dynamic QR redirect resolver
│   │   ├── api/r/[slug]/    # Backwards-compatible redirect resolver
│   │   └── page.tsx         # Editorial Studio application shell & views
│   ├── components/
│   │   ├── qr/              # QR design panel, preview canvas, styling engines
│   │   ├── studio/          # Editorial workspace views (dashboard, dynamic/static builder)
│   │   ├── analytics/       # Timezone-aware charts and metrics tables
│   │   └── ui/              # Radix/shadcn accessible UI primitives
│   ├── lib/
│   │   ├── db.ts            # Production Prisma Client singleton
│   │   ├── auth.ts          # NextAuth session & credential configuration
│   │   ├── security/        # Rate limiting, HMAC hashing, URL sanitization
│   │   └── qr/              # QR generation, validation, and encoding utilities
├── prisma/
│   └── schema.prisma        # PostgreSQL production schema
├── DEVELOPMENT_TRACKER.md   # Living progress, changelog, and todo tracker
└── tests/                   # QR decoder, lifecycle, and security tests
```

---

## Deployment Guide

### 1. Frontend on Vercel
Deploy using the Vercel CLI:
```bash
# Login to Vercel
npx vercel login

# Deploy preview
npx vercel

# Deploy production
npx vercel --prod
```

### 2. Backend & PostgreSQL on Render
1. Provision a **PostgreSQL database** instance on [Render](https://render.com).
2. Configure the database connection string in your environment as `DATABASE_URL`.
3. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

---

## Documentation Index

Detailed architectural specifications:
- [`PRD.md`](./PRD.md) — Product Requirements Document
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Target System Architecture
- [`DATABASE.md`](./DATABASE.md) — PostgreSQL Schema & Migration Specification
- [`DYNAMIC_QR.md`](./DYNAMIC_QR.md) — Dynamic QR Core Engine Invariants
- [`SECURITY.md`](./SECURITY.md) — Threat Model & Security Controls
- [`API_SPEC.md`](./API_SPEC.md) — `/api/v1` REST Interface Specification
- [`ANALYTICS.md`](./ANALYTICS.md) — Privacy-First Analytics & Aggregation
- [`TESTING.md`](./TESTING.md) — Automated QR Decoding & Integration Tests
- [`UI_UX.md`](./UI_UX.md) — Editorial Aesthetic & UX Guidelines
- [`BILLING.md`](./BILLING.md) — Plan Limits & Entitlement Enforcement
- [`ROADMAP.md`](./ROADMAP.md) — Staged Delivery Roadmap
- [`DEVELOPMENT_TRACKER.md`](./DEVELOPMENT_TRACKER.md) — Living Todo List & Update Changelog
