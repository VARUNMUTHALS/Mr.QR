# Dynamic QR Platform — Production Development Tracker

This living document tracks every architectural phase, master todo item, code change, security audit, and deployment update for the Dynamic QR Platform (**QR Studio**).

---

## 1. Architectural Decisions & Production Directives

| Decision | Selection | Status / Rationale |
| :--- | :--- | :--- |
| **Backend Architecture** | Next.js 16 App Router Modular Monolith | Modular monolith per `MASTER_DEVELOPMENT_PROMPT.md` and `ARCHITECTURE.md`. |
| **PocketBase Evaluation** | **Leave It (Not Adopted)** | PocketBase relies on Go + SQLite. The platform specification mandates PostgreSQL with Prisma ORM migrations, relational integrity, immutable destination/design versions, and edge-friendly Next.js App Router endpoints. |
| **Database Engine** | PostgreSQL via Prisma 6 | Migrated from prototype SQLite (`db/custom.db`). Models normalized with multi-tenant organizations, immutable versions, and pre-computed daily rollups. |
| **Frontend Deployment** | Vercel (via Vercel CLI) | Optimized for Next.js App Router, SSR, and sub-50ms `/q/[shortCode]` redirect caching (`vercel.json` configured). |
| **Backend / DB Deployment** | Render | Managed PostgreSQL database and API web services (`render.yaml` configured). |
| **Frontend Security** | Zero API Keys in Client Bundles | Verified 0 `NEXT_PUBLIC_` sensitive secrets in `src/`. All credentials strictly reside in server-side environment variables. |
| **Source Control** | GitHub Sync | Atomic conventional commits maintained on `main` branch ready to push to remote. |

---

## 2. Master Todo List

### Phase 0: Baseline Repository Audit & Setup
- [x] **Task 0.1**: Extract prototype repository from `workspace-11e2eb6d-0ca8-4235-8c4f-10abf0262e38.tar` into project root.
- [x] **Task 0.2**: Verify project structure, dependencies, and git configuration.
- [x] **Task 0.3**: Create `DEVELOPMENT_TRACKER.md` as the living progress and changelog document.
- [x] **Task 0.4**: Run baseline dependency installation (`npm install`) and resolve TypeScript baseline errors.

### Phase 1: PostgreSQL & Prisma Schema Migration (P0)
- [x] **Task 1.1**: Update `prisma/schema.prisma` datasource from `sqlite` to `postgresql`.
- [x] **Task 1.2**: Implement normalized models per `DATABASE.md`:
  - `User`, `Organization`, `OrganizationMember` (with roles: `OWNER`, `ADMIN`, `EDITOR`, `ANALYST`, `VIEWER`).
  - `QrCode` (with `shortCode`, `status`, `type`, `contentType`, soft deletion support `archivedAt`, `deletedAt`).
  - `QrDestination` (immutable versioning, `version`, `destinationUrl`, `changeReason`).
  - `QrDesign` (immutable design configs with JSON support, `version`, `config`).
  - `ScanEvent` (real/test source, device, OS, browser, anonymized `visitorKey`, geo fields, `suspectedBot`).
  - `ScanDailyAggregate` (efficient pre-computed daily rollups).
  - `ActivityLog` / `AuditLog` (immutable audit trails for all actions).
  - `Folder`, `Campaign`, `LandingPage`, `Asset`, `Subscription`, `UsageCounter`.
- [x] **Task 1.3**: Add soft deletion (`archivedAt`, `deletedAt`) and database indexes for query performance.
- [x] **Task 1.4**: Configure Prisma Client singleton (`src/lib/db.ts`) and create `.env.example`.

### Phase 2: Elimination of Demo Behavior & Security Hardening (P0)
- [x] **Task 2.1**: Remove synthetic scan seeding on dynamic QR creation (`seedSampleScans` removed from `/api/qr`).
- [x] **Task 2.2**: Remove fake geography generator (`approximateGeo`); replace with real edge geolocation header parser (`extractEdgeGeo`).
- [x] **Task 2.3**: Replace auto-provisioning login in NextAuth with explicit registration (`/api/v1/auth/register`), password hashing via `bcryptjs`, and session validation.
- [x] **Task 2.4**: Implement distributed rate limiting abstraction (`rateLimit` in `src/lib/security/index.ts`).
- [x] **Task 2.5**: Strengthen URL validation (`validateDestinationUrl`) to block dangerous schemes (`javascript:`, `data:`, `file:`, `vbscript:`, `blob:`) and open redirect attacks.

### Phase 3: Dynamic QR Engine & Resilient Resolver (P0)
- [x] **Task 3.1**: Implement `/q/[shortCode]` public redirect route with fast caching, status handling (ACTIVE, PAUSED, ARCHIVED), and non-blocking analytics writes.
- [x] **Task 3.2**: Retain `/api/r/[slug]` as a backwards-compatible alias to preserve existing printed QR codes.
- [x] **Task 3.3**: Verify immutable destination versioning (version $N+1$ on edit, restore creates new copy version $N+1$).
- [x] **Task 3.4**: Ensure scan recording is non-blocking (redirect responds with HTTP 302 without waiting for analytics write).
- [x] **Task 3.5**: Add automated QR image decoding verification tests (`tests/qr-decoder.test.mjs`) ensuring dynamic QR decodes strictly to `https://<domain>/q/{shortCode}`.

### Phase 4: Privacy-Preserving Analytics Pipeline (P1)
- [x] **Task 4.1**: Store timestamps in UTC and support user-requested reporting timezones.
- [x] **Task 4.2**: Implement privacy-preserving visitor key calculation (`computeVisitorKey` with salted HMAC-SHA256) with zero raw IP persistence.
- [x] **Task 4.3**: Label unique visitors as **"Estimated unique visitors"** across APIs and UI components.
- [x] **Task 4.4**: Remove `Math.random()` from daily analytics aggregation (`bucketDaily`) and use exact unique visitor key set sizes.
- [x] **Task 4.5**: Add conservative bot detection filtering (`isSuspectedBot`).

### Phase 5: Organization RBAC, Entitlements & API v1 (P1)
- [x] **Task 5.1**: Implement Organization-scoped RBAC (`OWNER`, `ADMIN`, `EDITOR`, `ANALYST`, `VIEWER`) in `src/lib/auth/rbac.ts`.
- [x] **Task 5.2**: Add BOLA/IDOR protection ensuring all queries scope through authenticated organization membership (`getAuthContext()`).
- [x] **Task 5.3**: Build `/api/v1/qr` and `/api/v1/qr/[id]` endpoints with cursor pagination, validation, and standard error responses.
- [x] **Task 5.4**: Enforce server-side billing limits and plan entitlements.

### Phase 6: Editorial UI Upgrades & Preserving Aesthetic (P1/P2)
- [x] **Task 6.1**: Preserve sketchbook / editorial identity (warm paper, ink, botanical green, terracotta).
- [x] **Task 6.2**: Upgrade Dynamic Builder UX with clarity: *"This destination can be changed after your QR has been printed — the QR itself never changes."*
- [x] **Task 6.3**: Upgrade post-publish screen to display standard `/q/{shortCode}` scan URL, copy button, download SVG/PNG, and overview navigation.
- [x] **Task 6.4**: Upgrade sign-in view with seamless "Sign In" and "Create Studio" mode switching, removing demo buttons.
- [x] **Task 6.5**: Standardize detail view to display `/q/{shortCode}` and "Estimated unique visitors".
- [x] **Task 6.6**: Brand identity system for **Mr.QR** — generated custom brand emblem, crafted vector SVGs (`favicon.svg`, `logo.svg`, `logo-mark.svg`), rasterized multi-size favicon suite (`favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png`, `icon-512.png`), and updated UI headers, metadata, and fallback templates.

### Phase 7: Deployment & GitHub Synchronization
- [x] **Task 7.1**: Configure `vercel.json` with security headers and caching directives for Vercel CLI deployment.
- [x] **Task 7.2**: Configure Render infrastructure blueprint (`render.yaml`) for managed PostgreSQL and Node.js web services.
- [x] **Task 7.3**: Verify that zero secrets or API keys are exposed in client-side bundles.
- [x] **Task 7.4**: Commit all changes and verify clean git state.

---

## 3. Changelog & Implementation History

| Date | Phase / Task | Files Modified / Created | Summary of Changes |
| :--- | :--- | :--- | :--- |
| **2026-09-04** | Setup & Audit | `implementation_plan.md`, `DEVELOPMENT_TRACKER.md` | Extracted prototype repository from tarball, verified clean git state, created living `DEVELOPMENT_TRACKER.md`. Evaluated PocketBase and documented architectural decision to leave it. |
| **2026-09-04** | Baseline Typecheck | `home-view.tsx`, `qr-detail-view.tsx`, `tsconfig.json` | Fixed component props types and excluded unused websocket examples from typescript compilation. |
| **2026-09-04** | Phase 1: Database | `prisma/schema.prisma`, `src/lib/db.ts`, `.env.example` | Migrated Prisma schema from SQLite to PostgreSQL with full relational models (`User`, `Organization`, `OrganizationMember`, `QrCode`, `QrDestination`, `QrDesign`, `ScanEvent`, `ScanDailyAggregate`, `AuditLog`, etc.). Generated PostgreSQL Prisma Client v6.19.3. |
| **2026-09-04** | Phase 2: Security | `src/app/api/qr/route.ts`, `src/lib/security/index.ts`, `src/lib/auth.ts`, `sign-in-view.tsx` | Removed synthetic scan seeding; removed fake `approximateGeo`; implemented real edge geo header parsing; added salted HMAC `visitorKey`; added bot detection; removed auto-provisioning; added `/api/v1/auth/register` and `/api/v1/auth/me`. |
| **2026-09-04** | Phase 3: Resolver | `src/app/q/[shortCode]/route.ts`, `src/app/api/r/[slug]/route.ts` | Implemented high-performance `/q/[shortCode]` public resolver route; retained `/api/r/[slug]` backwards compatibility; non-blocking scan writes; verified immutable versioning on destination update & restore. |
| **2026-09-04** | Phase 3: Testing | `tests/qr-decoder.test.mjs`, `package.json` | Created automated QR decoder test that rasterizes generated QR codes and decodes them with `jsQR`, asserting exact match to `https://qr.studio/q/{shortCode}`. Added `npm test`. |
| **2026-09-04** | Phase 4: Analytics | `src/app/api/qr/[id]/analytics/route.ts`, `src/hooks/use-qr-api.ts`, `qr-detail-view.tsx` | Removed `Math.random()` from daily unique visitor calculations; switched to exact distinct visitor keys; updated UI labels to "Estimated unique visitors". |
| **2026-09-04** | Phase 5: RBAC & v1 | `src/lib/auth/rbac.ts`, `src/app/api/v1/qr/route.ts`, `src/app/api/v1/qr/[id]/route.ts` | Implemented organization-scoped RBAC (`OWNER`, `ADMIN`, `EDITOR`, `ANALYST`, `VIEWER`), BOLA/IDOR protection, cursor pagination, and soft deletion. |
| **2026-09-04** | Phase 6: Editorial UI | `dynamic-builder-view.tsx`, `qr-detail-view.tsx`, `src/lib/api.ts` | Upgraded dynamic builder to display standard `/q/{shortCode}` URL, updated detail view chips and overview tab. |
| **2026-09-04** | Phase 6.6: Mr.QR Brand | `public/favicon.svg`, `public/logo.svg`, `public/favicon.ico`, `apple-touch-icon.png`, `layout.tsx`, `header.tsx`, `footer.tsx` | Rebranded application to **Mr.QR**. Generated custom brand emblem, designed SVG logo banner & icon mark, rasterized multi-size favicon suite, and updated all studio UI headers and metadata. |
| **2026-09-04** | Phase 7: Deployment | `vercel.json`, `render.yaml` | Created Vercel deployment configuration with security headers and Render infrastructure blueprint with managed PostgreSQL. Verified zero frontend secret leaks. |

---

## 4. Security & Invariant Checklist

- [x] **PocketBase Evaluation**: Evaluated and discarded in favor of PostgreSQL + Prisma + Next.js App Router modular monolith.
- [x] **No Secrets in Frontend**: Zero `NEXT_PUBLIC_` prefixes on secrets; verified 0 sensitive keys in client bundles.
- [x] **PostgreSQL Only**: No SQLite in production; Prisma Client generated for PostgreSQL with normalized relational schema.
- [x] **No Fake Analytics**: Zero synthetic scans seeded on creation; zero fake geography in production.
- [x] **Public URL Invariant**: Dynamic QR encodes `https://<domain>/q/{shortCode}`; destination is never hardcoded in dynamic QR image.
- [x] **Backwards Compatibility**: `/api/r/{slug}` continues resolving existing printed QR codes.
- [x] **Immutable History**: Destination updates and restores append new versions ($N+1$); history is never destroyed or mutated.
- [x] **BOLA/IDOR Protected**: Organization RBAC enforced on every authenticated request via `getAuthContext()`.
- [x] **Open Redirect Protected**: Resolver only redirects to validated destination stored in database; blocks unsafe schemes.
- [x] **Automated Tests**: Automated QR image decoding tests pass (`npm test`).
