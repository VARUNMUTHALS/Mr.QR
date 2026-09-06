# Mr.QR — Production Backend Audit & Migration Blueprint

**Audit Date**: September 6, 2026  
**Auditor**: Senior Staff Full-Stack / Backend Systems Engineer  
**Repository**: [VARUNMUTHALS/Mr.QR](https://github.com/VARUNMUTHALS/Mr.QR)  
**Status**: Completed — Awaiting Architecture Approval Before Phase 1 Execution

---

## 1. Current Architecture

The Mr.QR codebase is currently operating in a **hybrid transitional state**:

```text
                               ┌────────────────────────────────┐
                               │           Client / UI          │
                               │   (Next.js 16 App Router UI)   │
                               └───────────────┬────────────────┘
                                               │
               ┌───────────────────────────────┼──────────────────────────────┐
               │                               │                              │
               ▼                               ▼                              ▼
      [Clerk Provider]                 [TanStack Query]             [ConvexProviderWithClerk]
   Session / User State             Fetches /api/qr Routes        Connected to Cloud Backend
(Client loading race condition)                │                    (Not yet wired to UI)
                                               │
                                               ▼
                                    [Next.js Server API]
                           /api/qr, /api/r/[slug], /q/[shortCode]
                                               │
                   ┌───────────────────────────┴───────────────────────────┐
                   ▼                                                       ▼
            [Prisma Client]                                    [Local In-Memory Structures]
     Direct PostgreSQL/SQLite DB queries                      Map<string, RateLimitBucket>
  (Creates QRs, Reads destinations)                           (Process-local, lost on restart)
```

### Key Architectural Bottlenecks Identified:
1. **Frontend Auth Race Condition (The Screenshot Issue)**:
   - In `src/components/studio/app-shell.tsx`, `const { isSignedIn } = useUser()` is destructured without checking `isLoaded`.
   - On initial mount or page transitions, `isLoaded` is `false`, rendering `isSignedIn === false`.
   - `ViewRouter` instantly redirects any protected action (`create-dynamic`, `dashboard`, `qr-detail`) to `<SignInView redirectTo={view} />`.
   - Inside `src/components/studio/views/sign-in-view.tsx`, `<SignUp routing="hash" />` fails to mount properly on root path `/` without hash initialization, resulting in the **blank container with only the leaf icon and headline** as captured in the user screenshot.
2. **Dual-Database Disconnect**:
   - Convex is fully deployed (`https://majestic-gnat-826.convex.cloud`) with tables, indexes, and mutations.
   - However, the frontend UI (`DynamicBuilderView` and `use-qr-api.ts`) still submits requests to `/api/qr`, which executes direct `db.qrCode.create()` calls via Prisma.
3. **Dual Rate Limiting**:
   - `src/lib/rate-limit/index.ts` has `@upstash/ratelimit` ready.
   - But legacy routes like `src/app/api/r/[slug]/route.ts` and `src/lib/security/index.ts` still use a process-local `Map<string, RateLimitBucket>()`.
4. **Redirect Resolver Reliance on Prisma**:
   - `/q/[shortCode]` and `/api/r/[slug]` still execute `db.qrCode.findFirst()` queries directly against Prisma on cache miss instead of leveraging Convex queries or hot Redis caching.

---

## 2. Existing Backend Files

| File Path | Purpose | Current State | Target Role |
|---|---|---|---|
| `src/proxy.ts` | Next.js 16 Edge Proxy & Clerk Matcher | Configured with `clerkMiddleware` | Edge Route Protection & Auth Gateway |
| `src/lib/api.ts` | Server response helpers & user serializer | Hybrid Clerk `auth()` + Prisma lookup | Standard response wrapper & serialization |
| `src/lib/db.ts` | Prisma database client singleton | Active | Scheduled for phase-out once Convex is primary |
| `src/lib/auth.ts` | Legacy NextAuth configuration | Stubbed / partial | To be removed completely |
| `src/lib/auth/rbac.ts` | Role hierarchy & auth context | Hybrid Clerk + Prisma user creation | Migrate fully to Convex RBAC helpers |
| `src/lib/redis/index.ts` | Upstash Redis client & destination cache | Implemented with LRU fallback | Primary Sub-5ms Destination Cache |
| `src/lib/rate-limit/index.ts` | Upstash distributed rate limiter | Implemented for redirect/create | Global distributed rate-limiting authority |
| `src/lib/security/index.ts` | IP parsing, edge geo, visitor hashing | Contains legacy `Map` rate limiter | Keep geo/visitor hashing; remove in-memory rate limiter |
| `src/lib/stripe/index.ts` | Stripe SDK & checkout session creator | Configured | Stripe billing authority integration |
| `src/lib/email/resend.ts` | Resend SDK & transactional sender | Configured & live verified | Transactional email delivery service |
| `inngest/client.ts` | Inngest event dispatcher | Configured | Durable background workflow orchestrator |
| `inngest/functions/processScan.ts` | Scan telemetry ingestion job | Implemented | Asynchronous scan analytics processor |
| `inngest/functions/sendWelcomeEmail.ts` | Welcome email dispatch job | Implemented | Durable user onboarding email handler |

---

## 3. Existing API Routes

| Route | Method | Current Implementation | Migration Action |
|---|---|---|---|
| `/api/qr` | `GET`, `POST` | Queries & creates QRs via Prisma (`db.qrCode`) | Migrate to Convex queries/mutations (`api.qrCodes`) |
| `/api/qr/[id]` | `GET`, `DELETE` | Queries & soft-deletes via Prisma | Migrate to Convex queries/mutations |
| `/api/qr/[id]/destination` | `PATCH` | Creates destination version $N+1$ in Prisma | Migrate to Convex mutation (`api.destinations.update`) + Redis cache eviction |
| `/api/qr/[id]/versions` | `GET` | Fetches historical versions from Prisma | Migrate to Convex query (`api.destinations.listVersions`) |
| `/api/qr/[id]/versions/[vid]/restore` | `POST` | Copies version to new $N+1$ in Prisma | Migrate to Convex mutation (`api.destinations.restore`) + Redis eviction |
| `/api/qr/[id]/analytics` | `GET` | Calculates aggregates from Prisma `ScanEvent` | Migrate to Convex aggregate query (`api.analytics.getSummary`) |
| `/api/qr/[id]/activity` | `GET` | Reads Prisma `ActivityLog` | Migrate to Convex query (`api.activity.listByQr`) |
| `/api/qr/[id]/status` | `PATCH` | Updates `status` (`ACTIVE`/`PAUSED`/`ARCHIVED`) in Prisma | Migrate to Convex mutation (`api.qrCodes.setStatus`) + Redis eviction |
| `/api/qr/[id]/design` | `PATCH` | Updates JSON design config in Prisma | Migrate to Convex mutation (`api.qrCodes.updateDesign`) |
| `/api/qr/[id]/simulate` | `POST` | Injects synthetic test scans into Prisma | **Isolate/Remove** from production; restrict to test env |
| `/q/[shortCode]` | `GET` | Upstash RL + Redis cache + Prisma fallback + Inngest | Replace Prisma fallback with Convex query; keep sub-5ms path |
| `/api/r/[slug]` | `GET` | In-memory RL + direct Prisma query (Legacy compat) | Wire to Upstash RL + Redis cache + Convex fallback |
| `/api/report` | `POST` | In-memory RL + Prisma abuse report | Wire to Upstash RL + Convex `activityLogs` |
| `/api/v1/auth/me` | `GET` | Resolves user via Clerk + Prisma | Migrate to Convex user query (`api.users.current`) |
| `/api/v1/auth/register` | `POST` | Legacy NextAuth bcrypt registration | Deprecated — handled exclusively by Clerk |
| `/api/auth/[...nextauth]` | `GET`, `POST` | Stubbed JSON response `{ user: null }` | Deprecated — remove after all traces cleared |
| `/api/inngest` | `GET`, `POST`, `PUT` | Serves Inngest webhook runtime | Keep active for durable workflows |
| `/api/webhooks/clerk` | `POST` | Verifies Svix signature & syncs users | Wire to Convex mutations (`api.users.syncFromClerk`) |
| `/api/webhooks/stripe` | `POST` | Verifies Stripe signature & updates DB | Wire to Convex mutations (`api.billing.syncSubscription`) |

---

## 4. Existing Database Models

### Prisma Schema Models (`prisma/schema.prisma`):
- `User`: Legacy passwordHash, email, name, timestamps.
- `Organization`: Multi-tenant boundary, slug, ownerUserId.
- `OrganizationMember`: RBAC roles (`OWNER`, `ADMIN`, `EDITOR`, `ANALYST`, `VIEWER`).
- `QrCode`: shortCode, slug, name, type (`STATIC`/`DYNAMIC`), status (`ACTIVE`/`PAUSED`/`ARCHIVED`), designConfig.
- `QrDestination`: Immutable versions (`version`, `destinationUrl`, `isCurrent`, `changeReason`).
- `QrDesign`: Historical design snapshots.
- `ScanEvent`: Real/test source, device, OS, browser, anonymized visitorKey, geo fields, suspectedBot.
- `ScanDailyAggregate`: Date-bucketed rollup stats.
- `ActivityLog`: Audit trail.
- `Folder`, `Campaign`, `LandingPage`, `Asset`, `Subscription`, `UsageCounter`.

### Convex Schema Tables (`convex/schema.ts`):
- All 11 domain models are fully defined with identical production semantics and 24 compound indexes:
  - `users`, `organizations`, `memberships`, `qrCodes`, `qrDestinations`, `qrDesigns`, `scanEvents`, `scanDailyStats`, `activityLogs`, `folders`, `campaigns`, `subscriptions`.
- **Primary Migration Requirement**: Switch API routes and UI from calling Prisma to executing reactive Convex queries and mutations.

---

## 5. Existing Authentication

### Current State:
- **Provider**: `@clerk/nextjs` (v7.9.1) & `@clerk/ui` (v1.32.2).
- **Environment**: Active test instance (`known-camel-6817.clerk.accounts.dev`).
- **Middleware**: `src/proxy.ts` protects non-public routes with `clerkMiddleware`.
- **Frontend Components**:
  - `StudioHeader`: Uses `<UserButton />`, `<SignInButton mode="modal">`, and `<SignUpButton mode="modal">`.
  - `SignInView`: Renders `<SignIn routing="hash" />` and `<SignUp routing="hash" />`.
  - `AppShell`: Evaluates `useUser()`.

### The Specific Bug Causing the User's Screenshot:
1. In `src/components/studio/app-shell.tsx`:
   ```tsx
   export function AppShell() {
     const { isSignedIn } = useUser(); // isLoaded is ignored!
   ```
   When `isLoaded` is `false`, `isSignedIn` evaluates to `false`. If the user navigates to `create-dynamic`, `ViewRouter` prematurely treats the user as logged out.
2. In `src/components/studio/views/sign-in-view.tsx`:
   `<SignUp routing="hash" />` without hash state renders a blank placeholder under dark mode theme.
3. **Fix Requirement**:
   - Introduce an `isLoaded` gate in `AppShell` with a sleek loading skeleton.
   - Replace `<SignUp routing="hash" />` with Clerk's native modal trigger or official paths `/sign-in` and `/sign-up`.
   - Automatically transition signed-in users directly to `DynamicBuilderView` with zero flash.

---

## 6. Existing Redis Usage

- **Library**: `@upstash/redis` (v1.38.4).
- **File**: `src/lib/redis/index.ts`.
- **Key Pattern**: `qr:destination:{shortCode}`.
- **Cached Payload**: `{ qrId, organizationId, name, status, destinationUrl, version }`.
- **Current Integration**:
  - Wired into `/q/[shortCode]/route.ts`.
  - Cache set on miss (TTL 600s).
  - Memory fallback LRU cache implemented for local offline development.
- **Gaps to Close**:
  - Wire cache invalidation (`deleteCachedDestination`) into Convex destination mutations, status updates, and restores.
  - Wire Redis cache into legacy route `/api/r/[slug]/route.ts`.

---

## 7. Existing Convex Usage

- **Deployment**: Live on Convex Cloud (`https://majestic-gnat-826.convex.cloud`).
- **Files**:
  - `convex/schema.ts`: Full multi-tenant schema with compound indexes.
  - `convex/qrCodes.ts`: `create`, `list`, `get`, `updateDesign`, `setStatus`, `softDelete`.
  - `convex/destinations.ts`: `createVersion`, `restoreVersion`, `listVersions`.
  - `convex/analytics.ts`: Aggregate summaries, time-series metrics, geo stats.
  - `convex/activity.ts`: Immutable audit logs.
  - `convex/billing.ts`: Plan entitlement queries and subscription synchronization.
  - `convex/helpers/ownership.ts`: Strict multi-tenant RBAC validator.
  - `convex/helpers/audit.ts`: Automated audit trail logger.
  - `convex/helpers/validation.ts`: Server-side URL and SSRF validation.
- **Gap to Close**: Frontend and API routes must be transitioned from Prisma to Convex.

---

## 8. Existing Inngest Usage

- **Library**: `inngest` (v4.20.0).
- **Files**:
  - `inngest/client.ts`: Registered app `mr-qr-studio`.
  - `src/app/api/inngest/route.ts`: Next.js route handler serving Inngest webhook API.
  - `inngest/functions/processScan.ts`: Asynchronous scan telemetry recorder and daily aggregator.
  - `inngest/functions/sendWelcomeEmail.ts`: Asynchronous welcome email sender.
- **Gap to Close**: Wire additional background workflows: `generateCSVExport`, `syncStripeSubscription`, `aggregateDailyAnalytics`.

---

## 9. Existing Stripe Usage

- **Library**: `stripe` (v22.6.1).
- **Files**:
  - `src/lib/stripe/index.ts`: Checkout session builder, webhook constructor.
  - `src/app/api/webhooks/stripe/route.ts`: Webhook handler for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
  - `src/lib/billing/entitlements.ts`: Server-side plan tier limits (`FREE`, `PRO`, `BUSINESS`).
- **Gap to Close**: Persist Stripe customer IDs and subscription tiers into Convex `subscriptions` table.

---

## 10. Existing Resend Usage

- **Library**: `resend` (v6.26.0).
- **File**: `src/lib/email/resend.ts`.
- **Sender**: Verified sender `Mr.QR <onboarding@resend.dev>`.
- **Status**: Live verified with delivery to `007mutthal007@gmail.com` (Message ID: `5213479b-d547-4681-9ddf-83e693ad11e6`).
- **Gap to Close**: Create centralized HTML email templates for welcome, scan milestone alerts, and billing receipts.

---

## 11. Existing Analytics

- **Files**:
  - `src/app/api/qr/[id]/analytics/route.ts`: Computes exact distinct `visitorKey` counts.
  - `src/app/q/[shortCode]/route.ts`: Asynchronously dispatches `qr.scan.recorded` to Inngest.
  - `src/lib/security/index.ts`: `computeVisitorKey` (HMAC-SHA256 privacy hashing), `extractEdgeGeo` (extracts CDN geo headers with zero fake data).
- **Gap to Close**: Transition frontend charts in `src/components/studio/views/qr-detail-view.tsx` to read pre-aggregated Convex rollup stats (`scanDailyStats`) for instant sub-50ms dashboard loading.

---

## 12. Existing Demo / Mock Code

| Location | Demo / Mock Artifact | Action |
|---|---|---|
| `src/app/api/qr/[id]/simulate/route.ts` | Generates simulated scan batches | Restrict to test environments or remove from production |
| `src/lib/security/index.ts` (L233) | `const memoryBuckets = new Map<string, RateLimitBucket>()` | Replace with `@upstash/ratelimit` |
| `src/lib/redis/index.ts` (L13) | `const memoryCache = new Map<string, ...>()` | Retain solely as graceful degradation fallback |
| `src/lib/auth.ts` | Legacy NextAuth credentials provider | Remove completely |
| `src/app/api/v1/auth/register/route.ts` | Password registration endpoint | Remove completely |

---

## 13. Migration Risks & Mitigation Strategies

1. **Auth State Desynchronization (User blocked at Sign-in)**:
   - *Risk*: Users log in via Clerk but client components still evaluate unauthenticated state before session hydration.
   - *Mitigation*: Ensure `AppShell` explicitly guards on `isLoaded`. If `!isLoaded`, display a subtle skeleton. Once `isLoaded && isSignedIn`, immediately display the requested view (`DynamicBuilderView` or `DashboardView`).
2. **QR Redirect Downtime During Database Cutover**:
   - *Risk*: Switching `/q/[shortCode]` from Prisma to Convex could cause transient errors.
   - *Mitigation*: The Redis cache layer shields 99% of traffic. When cache misses occur, implement graceful fallback: try Redis $\to$ try Convex $\to$ fallback to existing Prisma record.
3. **Double Writes & Stale Caches**:
   - *Risk*: Modifying a destination in Convex without purging Redis results in outdated redirects.
   - *Mitigation*: Invalidate Redis cache key `qr:destination:{shortCode}` synchronously within or immediately after every destination update/restore mutation.
4. **Data Isolation Breach**:
   - *Risk*: Tenant A accesses Tenant B's QR code.
   - *Mitigation*: Convex mutations enforce `requireOrgRole(ctx, organizationId, roles)` and verify document ownership on every query and mutation.

---

## 14. Exact Implementation Order (Phases 0 to 12)

```text
PHASE 0: AUDIT (CURRENT — Complete & Documented in BACKEND_AUDIT.md)
   │
   ▼
PHASE 1: CLERK IDENTITY & UI AUTH LIFECYCLE FIX
   │  - Fix AppShell isLoaded gate
   │  - Eliminate blank SignInView hash bug
   │  - Ensure immediate transition to DynamicBuilderView on login
   │  - Complete NextAuth removal
   │
   ▼
PHASE 2: CONVEX APPLICATION BACKEND AS SOURCE OF TRUTH
   │  - Connect frontend hooks (useCreateQr, useQrList, useQrDetail) to Convex
   │  - Sync Clerk organization & user profile webhooks into Convex
   │
   ▼
PHASE 3: HIGH-SPEED QR REDIRECT ENGINE
   │  - Route /q/[shortCode] to Redis cache -> Convex query fallback -> 302
   │  - Route legacy /api/r/[slug] to identical pipeline
   │  - Enforce redirect invariant: analytics failure NEVER interrupts 302
   │
   ▼
PHASE 4: UPSTASH DISTRIBUTED RATE LIMITING
   │  - Replace in-memory Map rate limiter in security/index.ts with Upstash Ratelimit
   │  - Configure separate sliding windows for redirects, creates, and auth
   │
   ▼
PHASE 5: ANALYTICS PIPELINE & AGGREGATION
   │  - Inngest non-blocking scan event ingestion
   │  - Pre-computed daily aggregate rollups in Convex
   │  - Remove simulated scan endpoints from production
   │
   ▼
PHASE 6: INNGEST DURABLE WORKFLOWS
   │  - Idempotent scan processing
   │  - Scheduled daily aggregation jobs
   │  - CSV export generation
   │
   ▼
PHASE 7: RESEND TRANSACTIONAL EMAIL SYSTEM
   │  - Welcome email on first signup
   │  - Scan milestone notifications (100, 1K, 10K scans)
   │  - Billing event notifications
   │
   ▼
PHASE 8: STRIPE BILLING & ENTITLEMENT ENFORCEMENT
   │  - Server-side plan limits (FREE, PRO, BUSINESS)
   │  - Stripe webhook sync to Convex subscriptions
   │  - Customer billing portal
   │
   ▼
PHASE 9: CLOUDFLARE R2 ASSET STORAGE
   │  - Presigned upload URLs for custom QR center logos
   │  - Store asset metadata in Convex
   │
   ▼
PHASE 10: OBSERVABILITY (SENTRY & POSTHOG)
   │  - Structured logging with requestId, organizationId, qrId
   │  - Sentry exception capturing (sanitizing tokens/PII)
   │  - PostHog product funnel events
   │
   ▼
PHASE 11: CLOUDFLARE EDGE CONFIGURATION
   │  - WAF rules, DDoS mitigation, bot inspection headers
   │
   ▼
PHASE 12: COMPREHENSIVE VERIFICATION & LOAD TESTING
   │  - Vitest unit tests, Playwright E2E tests
   │  - 100 to 1,000 req/sec redirect benchmark verification
```

---

## 15. Files That Will Be Created

- `src/lib/convex/client.ts` — Server-side Convex client for API route queries and Inngest jobs.
- `inngest/functions/aggregateDailyAnalytics.ts` — Scheduled nightly rollup aggregator.
- `inngest/functions/generateExport.ts` — Durable CSV export generator.
- `src/lib/email/templates/welcome.tsx` — Clean HTML transactional welcome template.
- `src/lib/email/templates/milestone.tsx` — Scan milestone notification template.
- `src/lib/r2/index.ts` — Cloudflare R2 S3-compatible client for QR logo asset storage.
- `tests/load/redirect-benchmark.js` — High-concurrency redirect load test.

---

## 16. Files That Will Be Modified

- `src/components/studio/app-shell.tsx` — Fix `isLoaded` auth race condition to immediately open dynamic QR builder for logged-in users.
- `src/components/studio/views/sign-in-view.tsx` — Replace broken hash routing with clean Clerk modal / standard sign-up flow.
- `src/components/studio/views/dynamic-builder-view.tsx` — Wire QR creation mutation directly to Convex.
- `src/hooks/use-qr-api.ts` — Connect hooks to Convex reactive queries (`api.qrCodes.list`, `api.qrCodes.get`).
- `src/app/q/[shortCode]/route.ts` — Replace Prisma lookup with Convex query on Redis cache miss.
- `src/app/api/r/[slug]/route.ts` — Upgrade legacy redirect to use Upstash Redis and Convex.
- `src/lib/security/index.ts` — Strip process-local `memoryBuckets` Map; redirect all checks to `@upstash/ratelimit`.
- `src/app/api/webhooks/clerk/route.ts` — Sync Clerk user and organization events into Convex.
- `src/app/api/webhooks/stripe/route.ts` — Sync subscription tiers and quotas into Convex.
- `src/components/studio/views/qr-detail-view.tsx` — Wire analytics charts to Convex aggregate queries.

---

## 17. Files That Will Eventually Be Removed

- `src/app/api/v1/auth/register/route.ts` — Redundant credentials registration endpoint (Clerk is authoritative).
- `src/app/api/qr/[id]/simulate/route.ts` — Mock scan generator (violates Rule 7: Zero fake analytics).
- `src/lib/auth.ts` — Legacy NextAuth credentials provider file.
- `src/app/api/auth/[...nextauth]/route.ts` — Obsolete NextAuth handler (after client references are fully scrubbed).
- `prisma/` (Schema & migrations) — Phased out once all relational queries have moved to Convex.
- `src/lib/db.ts` — Phased out once Prisma is decommissioned.

---

### End of Audit. Awaiting user review and approval before proceeding with Phase 1.
