# Dynamic QR Platform — Production Development Tracker

This living document tracks every architectural phase, master todo item, code change, security audit, and deployment update for the Dynamic QR Platform (**QR Studio**).

---

## 1. Architectural Decisions & Production Directives

| Decision | Selection | Status / Rationale |
| :--- | :--- | :--- |
| **Backend Architecture** | Next.js 16 App Router Modular Monolith | Modular monolith per `MASTER_DEVELOPMENT_PROMPT.md` and `ARCHITECTURE.md`. |
| **PocketBase Evaluation** | **Leave It (Not Adopted)** | PocketBase is built on embedded SQLite and Go. The production specification mandates PostgreSQL with Prisma ORM migrations, relational integrity, immutable destination/design versions, and edge-friendly Next.js App Router endpoints. |
| **Database Engine** | PostgreSQL via Prisma 6 | Replaces prototype SQLite (`db/custom.db`). Enables JSONB, connection pooling, and append-heavy partitioned analytics. |
| **Frontend Deployment** | Vercel (via Vercel CLI) | Next.js App Router optimized for Vercel Edge / Serverless with sub-50ms redirect caching. |
| **Backend / DB Deployment** | Render | Managed PostgreSQL database and background service workers on Render. |
| **Frontend Security** | Zero API Keys in Client Bundles | Strictly NO secrets or private tokens with `NEXT_PUBLIC_` prefix. All database credentials, JWT secrets, and external keys remain strictly server-side. |
| **Source Control** | GitHub Sync | All changes committed and pushed to GitHub after each development cycle. |

---

## 2. Master Todo List

### Phase 0: Baseline Repository Audit & Setup
- [x] **Task 0.1**: Extract prototype repository from `workspace-11e2eb6d-0ca8-4235-8c4f-10abf0262e38.tar` into project root.
- [x] **Task 0.2**: Verify project structure, dependencies, and git configuration.
- [x] **Task 0.3**: Create `DEVELOPMENT_TRACKER.md` as the living progress and changelog document.
- [ ] **Task 0.4**: Run baseline dependency installation and typecheck audit.

### Phase 1: PostgreSQL & Prisma Schema Migration (P0)
- [ ] **Task 1.1**: Update `prisma/schema.prisma` datasource from `sqlite` to `postgresql`.
- [ ] **Task 1.2**: Implement normalized models per `DATABASE.md`:
  - `User`, `Organization`, `OrganizationMember` (with roles: `OWNER`, `ADMIN`, `EDITOR`, `ANALYST`, `VIEWER`).
  - `QRCode` (with `shortCode`, `status`, `type`, `contentType`, soft deletion support `archivedAt`, `deletedAt`).
  - `QRDestinationVersion` (immutable versioning, `versionNumber`, `destinationUrl`, `changeReason`).
  - `QRDesignVersion` (immutable design configs with JSONB support, `versionNumber`, `config`).
  - `ScanEvent` (real/test source, device, OS, browser, anonymized `visitorKey`, geo fields, `suspectedBot`).
  - `ScanDailyAggregate` (efficient pre-computed daily rollups).
  - `AuditLog` (immutable audit trails for all actions).
  - `Folder`, `Campaign`, `LandingPage`, `Asset`, `Subscription`, `UsageCounter`.
- [ ] **Task 1.3**: Add soft deletion (`archivedAt`, `deletedAt`) and database indexes for performance.
- [ ] **Task 1.4**: Configure Prisma Client singleton with connection pooling (`src/lib/db.ts`).

### Phase 2: Elimination of Demo Behavior & Security Hardening (P0)
- [ ] **Task 2.1**: Remove synthetic scan seeding on QR creation (`/api/qr` and creation services).
- [ ] **Task 2.2**: Remove fake geography generator (`approximateGeo`); replace with real trusted CDN/edge header detection (`x-vercel-ip-country`) with graceful fallback.
- [ ] **Task 2.3**: Replace auto-provisioning login with explicit registration (`/api/v1/auth/register`), password hashing with `bcryptjs`, and secure session validation.
- [ ] **Task 2.4**: Implement distributed rate limiting abstraction (Redis / Upstash / Edge rate limiting) replacing in-memory maps.
- [ ] **Task 2.5**: Centralize URL validation to block dangerous schemes (`javascript:`, `data:`, `file:`) and open redirect attacks.

### Phase 3: Dynamic QR Engine & Resilient Resolver (P0)
- [ ] **Task 3.1**: Implement `/q/[shortCode]` public redirect route with fast caching.
- [ ] **Task 3.2**: Retain `/api/r/[slug]` as a backwards-compatible alias to preserve existing printed QR codes.
- [ ] **Task 3.3**: Implement immutable destination versioning (version $N+1$ on edit, restore creates new copy version).
- [ ] **Task 3.4**: Ensure scan recording is non-blocking (redirect responds with HTTP 302 without waiting for analytics write).
- [ ] **Task 3.5**: Add automated QR image decoding verification tests.

### Phase 4: Privacy-Preserving Analytics Pipeline (P1)
- [ ] **Task 4.1**: Store timestamps in UTC and support user-requested reporting timezones.
- [ ] **Task 4.2**: Implement privacy-preserving visitor key calculation (HMAC-SHA256 with server-side secret) with zero raw IP persistence.
- [ ] **Task 4.3**: Label unique visitors as "Estimated unique visitors".
- [ ] **Task 4.4**: Implement SQL aggregation queries and daily rollups (`ScanDailyAggregate`) avoiding in-memory array loading.
- [ ] **Task 4.5**: Add conservative bot detection filtering.

### Phase 5: Organization RBAC, Entitlements & API v1 (P1)
- [ ] **Task 5.1**: Implement Organization-scoped RBAC (`OWNER`, `ADMIN`, `EDITOR`, `ANALYST`, `VIEWER`).
- [ ] **Task 5.2**: Add BOLA/IDOR protection ensuring all queries scope through authenticated organization membership.
- [ ] **Task 5.3**: Build `/api/v1/*` endpoints with typed Zod validation and standardized error formatting.
- [ ] **Task 5.4**: Enforce server-side billing limits and plan entitlements.

### Phase 6: Editorial UI Upgrades & Preserving Aesthetic (P1/P2)
- [ ] **Task 6.1**: Preserve sketchbook / editorial identity (warm paper, ink, botanical green, terracotta).
- [ ] **Task 6.2**: Upgrade Dynamic Builder UX with clarity: *"This QR code stays the same. Only its destination changes."*
- [ ] **Task 6.3**: Upgrade post-publish screen: QR preview, download (SVG, PNG), copy link, test scan, destination editor.
- [ ] **Task 6.4**: Upgrade Dashboard shelf with real metrics, search, filters, folders, and campaigns.
- [ ] **Task 6.5**: Replace empty fake data with clear user prompts.

### Phase 7: Deployment & GitHub Synchronization
- [ ] **Task 7.1**: Configure `vercel.json` and deploy frontend to Vercel via Vercel CLI.
- [ ] **Task 7.2**: Configure Render deployment setup (`render.yaml`) for PostgreSQL and background services.
- [ ] **Task 7.3**: Verify that zero secrets are exposed in client bundles.
- [ ] **Task 7.4**: Commit all changes and push to GitHub remote.

---

## 3. Changelog & Implementation History

| Date | Phase / Task | Files Modified / Created | Summary of Changes |
| :--- | :--- | :--- | :--- |
| **2026-09-04** | Setup | `implementation_plan.md`, `DEVELOPMENT_TRACKER.md` | Extracted prototype repository from tarball, verified clean git state, created living `DEVELOPMENT_TRACKER.md`. Evaluated PocketBase and documented architectural decision to leave it. |

---

## 4. Security & Invariant Checklist

- [x] **PocketBase Evaluation**: Evaluated and discarded in favor of PostgreSQL + Prisma + Next.js App Router modular monolith.
- [ ] **No Secrets in Frontend**: Zero `NEXT_PUBLIC_` prefixes on secrets; no API keys or database credentials in client bundles.
- [ ] **PostgreSQL Only**: No SQLite in production; reproducible Prisma migrations.
- [ ] **No Fake Analytics**: Zero synthetic scans seeded; zero fake geography in production.
- [ ] **Public URL Invariant**: Dynamic QR encodes `https://<domain>/q/{shortCode}`; destination is never hardcoded in dynamic QR image.
- [ ] **Backwards Compatibility**: `/api/r/{slug}` continues resolving existing printed QR codes.
- [ ] **Immutable History**: Destination updates and restores append new versions; history is never destroyed or mutated.
- [ ] **BOLA/IDOR Protected**: Organization RBAC enforced on every authenticated request.
- [ ] **Open Redirect Protected**: Resolver only redirects to validated destination stored in database.
