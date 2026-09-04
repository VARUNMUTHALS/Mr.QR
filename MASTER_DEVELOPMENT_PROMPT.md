# MASTER DEVELOPMENT PROMPT --- Upgrade the Existing QR Studio Prototype

You are an expert senior full-stack engineer responsible for upgrading
an EXISTING Dynamic QR application.

The repository you are operating on is the user's existing prototype.
**Do not rebuild it from scratch.**

## 0. SOURCE OF TRUTH

Read these files before implementation:

-   `PRD.md`
-   `ARCHITECTURE.md`
-   `DATABASE.md`
-   `API_SPEC.md`
-   `DYNAMIC_QR.md`
-   `ANALYTICS.md`
-   `SECURITY.md`
-   `UI_UX.md`
-   `BILLING.md`
-   `TESTING.md`
-   `ROADMAP.md`

Also inspect the actual repository before making architectural
decisions.

------------------------------------------------------------------------

# 1. CURRENT PROTOTYPE --- FACTS YOU MUST PRESERVE

The current prototype is:

-   Next.js 16 App Router
-   TypeScript
-   Tailwind 4
-   shadcn/Radix UI
-   Prisma
-   SQLite
-   NextAuth v4
-   TanStack Query
-   Zustand
-   Framer Motion
-   `qr-code-styling`
-   Recharts

Important existing routes/features:

``` text
/api/qr
/api/qr/[id]
/api/qr/[id]/destination
/api/qr/[id]/status
/api/qr/[id]/design
/api/qr/[id]/versions
/api/qr/[id]/versions/[vid]/restore
/api/qr/[id]/analytics
/api/qr/[id]/activity
/api/qr/[id]/simulate
/api/r/[slug]
/api/report
```

Existing database models:

``` text
User
QrCode
QrDestination
QrDesign
ScanEvent
ActivityLog
```

Existing working product concepts: - static QR; - dynamic QR; -
destination versioning; - version restore; - scan analytics; - activity
history; - pause/resume/archive; - QR design customization; - QR
validation; - editorial UI.

Preserve these concepts.

------------------------------------------------------------------------

# 2. ABSOLUTE NON-NEGOTIABLE RULES

### Rule 1

Do not delete working functionality simply to simplify the codebase.

### Rule 2

Do not replace the editorial design with generic SaaS styling.

### Rule 3

Do not break existing printed dynamic QR URLs.

### Rule 4

Do not encode dynamic destinations directly into generated QR images.

### Rule 5

Do not use the browser as the authority for authorization, billing or
limits.

### Rule 6

Do not seed fake analytics in production.

### Rule 7

Do not use fake geography for real scans.

### Rule 8

Do not use process-local in-memory rate limiting in production.

### Rule 9

Do not hard-delete QR records as the normal delete operation.

### Rule 10

Do not create microservices merely for architectural fashion. Use a
modular monolith until scale proves otherwise.

------------------------------------------------------------------------

# 3. FIRST TASK --- REPOSITORY AUDIT

Before changing code, inspect:

``` text
package.json
next.config.ts
tsconfig.json
prisma/schema.prisma
.env / environment examples
src/app
src/components
src/hooks
src/lib
tests
```

Determine: - exact current build status; - lint status; - TypeScript
status; - current database; - current authentication; - current QR
implementation; - current API behavior; - current public redirect URL; -
current deployment assumptions.

Run: - install/build if environment allows; - lint; - typecheck; -
existing tests.

Create an internal gap list.

Do not ask the user to repeat information already available in the
repository.

------------------------------------------------------------------------

# 4. SECOND TASK --- REMOVE DEMO-ONLY BEHAVIOR

The current prototype contains demo behavior.

Remove or isolate from production:

### Synthetic scans

The dynamic QR creation route currently calls a sample scan seeding
function.

Replace with: - zero real scans after creation; - explicit test scan
endpoint; - test scans marked `source=TEST` or equivalent.

### Fake geography

The current security module maps hashes to sample cities.

Remove for real scans.

Use: - real trusted geo source, or - omit geography.

Never claim fake data is real.

### Demo credentials

The current authentication auto-provisions accounts.

Replace with explicit registration/login.

### In-memory rate limiter

Replace with Redis/edge/WAF-backed distributed limits.

------------------------------------------------------------------------

# 5. THIRD TASK --- POSTGRESQL

Migrate:

``` text
SQLite
  ->
PostgreSQL
```

Use Prisma migrations.

Do not use: `prisma db push --accept-data-loss`

for production deployment.

Create a safe migration path.

Map existing models to:

``` text
User
Organization
OrganizationMember
QRCode
QRDestinationVersion
QRDesignVersion
ScanEvent
ScanDailyAggregate
AuditLog
Folder
Campaign
LandingPage
Asset
Subscription
UsageCounter
```

Preserve existing short codes.

------------------------------------------------------------------------

# 6. FOURTH TASK --- DYNAMIC QR ENGINE

This is the highest-priority feature.

A dynamic QR must encode:

`https://qr.example.com/q/{shortCode}`

The destination is stored in PostgreSQL.

When destination changes: - short code remains unchanged; - QR image
remains unchanged; - new destination version is created; - cache is
invalidated; - audit entry is created.

Example:

``` text
v1 -> product A
v2 -> product B
v3 -> product C
restore v1
v4 -> product A
```

Never mutate v1.

------------------------------------------------------------------------

# 7. PUBLIC REDIRECT

Implement the production resolver:

`GET /q/{shortCode}`

If legacy `/api/r/{slug}` exists and printed codes use it, keep it
working.

Do not break existing printed codes.

Redirect flow:

``` text
request
 -> WAF/rate limit
 -> cache
 -> DB lookup if miss
 -> validate active status
 -> enqueue analytics
 -> 302 redirect
```

Do not wait for expensive analytics queries before redirecting.

------------------------------------------------------------------------

# 8. REDIRECT SECURITY

Never accept:

`?url=...`

as the redirect destination.

The only valid destination is the database record associated with the
short code.

Allowed schemes: - http - https

Reject dangerous schemes.

Do not fetch destination URLs from the redirect service.

------------------------------------------------------------------------

# 9. DESTINATION VERSIONING

Implement as an immutable history.

Required behavior:

``` text
POST destination A
POST destination B
POST destination C
restore A
```

Results:

``` text
v1 A
v2 B
v3 C
v4 A
```

Never destroy history.

------------------------------------------------------------------------

# 10. QR GENERATION

Preserve `qr-code-styling`.

Support: - SVG; - PNG; - design presets; - patterns; - eyes; - logo; -
frame; - quiet zone; - error correction.

Production rule:

Every generated QR must be automatically decoded in tests.

Dynamic QR decoded payload must exactly equal the public scan URL.

------------------------------------------------------------------------

# 11. DESIGN VALIDATION

Keep existing contrast/logo/quiet-zone checks, but strengthen them.

Validate server-side before save/export.

Important: A warning is not proof that a QR scans.

Use actual decoder tests.

------------------------------------------------------------------------

# 12. DATABASE AND AUTHORIZATION

Introduce organization-scoped authorization.

Every protected request:

``` text
session
 -> organization membership
 -> role
 -> resource within organization
 -> entitlement
 -> operation
```

Roles:

``` text
OWNER
ADMIN
EDITOR
ANALYST
VIEWER
```

Never authorize using only a client-provided user ID.

------------------------------------------------------------------------

# 13. AUTHENTICATION

Replace prototype auto-provisioning.

Implement: - registration; - email verification; - login; - logout; -
password reset; - secure session; - account deletion; - optional OAuth
later; - MFA later.

Do not break existing user migration.

------------------------------------------------------------------------

# 14. ANALYTICS

Real scans only.

Do not seed fake history.

Do not use random numbers in analytics calculations.

Do not calculate "unique visitors" as an undocumented exact person
count.

Use: `estimatedUniqueVisitors`

Document the algorithm.

Store timestamps UTC.

Support reporting timezone.

------------------------------------------------------------------------

# 15. ANALYTICS PERFORMANCE

Do not load all raw scan events into memory for dashboard charts.

Use: - SQL aggregation; - indexes; - daily aggregates; - cursor
pagination; - background workers.

For large datasets:

``` text
ScanEvent
 -> hourly/daily aggregates
 -> dashboard
```

------------------------------------------------------------------------

# 16. ANALYTICS RESILIENCE

If analytics fails:

**redirect must still succeed.**

Use a durable event queue.

Retry failed events.

Provide dead-letter handling.

------------------------------------------------------------------------

# 17. SECURITY

Implement: - distributed rate limiting; - secure sessions; - RBAC; -
BOLA protection; - open redirect prevention; - URL validation; - XSS
protection; - CSRF protection where applicable; - file upload
validation; - security headers; - secret management; - webhook
verification; - abuse reporting; - audit logs.

------------------------------------------------------------------------

# 18. ABUSE SYSTEM

Because this is a redirect platform, provide:

``` text
public report
    ->
abuse queue
    ->
admin review
    ->
disable QR / suspend account
```

Admin must be able to disable malicious QR codes quickly.

Keep audit reason.

------------------------------------------------------------------------

# 19. FILES

Move logo/file data out of QR design JSON.

Use object storage.

Database stores: - asset ID; - storage key; - MIME; - size; - checksum.

Validate uploads.

------------------------------------------------------------------------

# 20. API

Create `/api/v1`.

Use: - typed validation; - stable error codes; - request IDs; - cursor
pagination; - idempotency where needed.

Existing endpoints can remain temporarily for compatibility.

------------------------------------------------------------------------

# 21. UI

Do not rebuild the UI.

Upgrade existing surfaces:

``` text
Home
Static Builder
Dynamic Builder
Dashboard
QR Detail
Analytics
Activity
Version History
Sign In
```

Add: - organizations; - folders; - campaigns; - landing pages; -
billing; - settings.

Keep the editorial identity.

------------------------------------------------------------------------

# 22. DYNAMIC BUILDER UX

Keep:

> Where should it go?

Add:

> This QR code stays the same. Only its destination changes.

After publish: - preview; - scan URL; - copy; - download; - test scan; -
analytics; - edit destination.

------------------------------------------------------------------------

# 23. DASHBOARD

Keep "studio shelf" metaphor.

Add: - real metrics; - plan usage; - search; - filters; - folders; -
campaigns; - sorting; - pagination.

No fake metrics.

------------------------------------------------------------------------

# 24. QR DETAIL

Maintain: - overview; - status controls; - destination editor; - design
editor; - Scan Book; - Margin Notes; - Version History.

Improve: - authorization; - pagination; - loading states; - empty
states; - accessibility; - mobile behavior.

------------------------------------------------------------------------

# 25. BILLING

Implement only after core QR/analytics reliability.

Use a billing provider abstraction.

Server-side entitlements.

Suggested plans: - Free; - Pro; - Business.

Exact limits/prices configurable.

Existing QR scans should not unexpectedly break because of a downgrade.

------------------------------------------------------------------------

# 26. TESTING

Write tests for:

### Critical

``` text
create -> scan A -> change -> scan B
```

### Versioning

``` text
A -> B -> C -> restore A -> D
```

### Authorization

User A cannot access User B.

### Security

No open redirect.

### QR

Generated image decodes correctly.

### Analytics

Real scans appear; fake scans do not.

### Resilience

Analytics outage does not stop redirect.

------------------------------------------------------------------------

# 27. PERFORMANCE

Optimize in this order:

1.  redirect;
2.  QR lookup;
3.  database indexes;
4.  analytics aggregation;
5.  dashboard;
6.  exports.

Do not optimize without measurement.

------------------------------------------------------------------------

# 28. OBSERVABILITY

Add: - structured logs; - request IDs; - metrics; - traces where
useful; - redirect latency; - DB latency; - cache hit rate; - queue
depth; - worker failures; - auth failures; - abuse events; - billing
webhook failures.

------------------------------------------------------------------------

# 29. MIGRATION STRATEGY

Implement incrementally.

Recommended order:

``` text
Audit
  ↓
Remove demo behavior
  ↓
Validation/service boundaries
  ↓
PostgreSQL
  ↓
Auth/RBAC
  ↓
Distributed rate limiting
  ↓
Durable analytics
  ↓
Production redirect
  ↓
Organizations
  ↓
Billing
  ↓
Advanced QR types
  ↓
Landing pages
  ↓
Business features
```

At each stage: - test; - lint; - typecheck; - build; - review
migration; - verify critical QR flow.

------------------------------------------------------------------------

# 30. DO NOT DO THESE THINGS

Never: - rebuild from zero; - discard working QR version history; -
break old QR links; - use fake scans in production; - use fake
geography; - trust client authorization; - use a client-selected
redirect URL; - use permanent 301 redirects for editable destinations; -
hard-delete normal QR records; - expose IP addresses in analytics; -
store secrets in source; - introduce microservices prematurely; - bypass
migrations with destructive schema pushes.

------------------------------------------------------------------------

# 31. FINAL ACCEPTANCE

Do not declare the project production-ready until:

-   PostgreSQL is active;
-   dynamic redirect works;
-   existing printed URLs work;
-   destination editing works;
-   version restore works;
-   real scans are recorded;
-   fake scan seeding is disabled;
-   fake geography is removed;
-   analytics are privacy-aware;
-   distributed rate limiting works;
-   RBAC works;
-   BOLA tests pass;
-   open redirect tests pass;
-   QR decoder tests pass;
-   build passes;
-   migrations are reproducible;
-   monitoring exists;
-   backups exist;
-   abuse controls exist;
-   billing webhooks are secure if billing is enabled.

At completion, produce a final engineering report containing: -
prototype audit; - changed files; - migrations; - new APIs; - security
changes; - tests; - environment variables; - deployment procedure; -
rollback procedure; - known limitations.
