# Dynamic QR Platform --- Production Upgrade PRD

**Baseline:** Existing QR Studio prototype supplied by the user\
**Repository:** Next.js 16 App Router + TypeScript + Tailwind 4 +
shadcn/ui + Prisma + SQLite + NextAuth v4 + `qr-code-styling`\
**Design language:** editorial/tactile sketchbook; warm paper, ink,
botanical and terracotta accents\
**Primary product:** static and dynamic QR generation, destination
editing, scan analytics and QR lifecycle management

------------------------------------------------------------------------

## 1. Executive summary

The prototype already demonstrates a complete dynamic QR concept:

-   static and dynamic QR creation
-   dynamic redirect endpoint
-   destination versioning and restore
-   QR design customization
-   pause/resume/archive
-   scan recording
-   analytics views
-   activity history
-   abuse reporting
-   client-side QR validation
-   editorial dashboard/detail UI

The production upgrade must **preserve this working product behavior**
while replacing demo-only infrastructure and adding the missing SaaS
capabilities.

The most important product invariant is:

> A dynamic QR has a stable scan URL. The destination can change without
> changing the printed QR image.

------------------------------------------------------------------------

## 2. Existing prototype capabilities

The supplied repository currently contains:

### Frontend

-   Single `/` page route.
-   Zustand client-side navigation rather than multiple page routes.
-   Framer Motion transitions.
-   Editorial component primitives.
-   Static QR builder.
-   Dynamic QR builder.
-   Dashboard.
-   QR detail view.
-   Sign-in view.
-   Analytics charts.
-   QR preview and design controls.

### QR engine

-   `qr-code-styling`.
-   SVG QR generation.
-   PNG/SVG download behavior.
-   foreground/background customization.
-   patterns and eye styles.
-   logo overlay.
-   frame options.
-   quiet-zone control.
-   error-correction control.
-   contrast validation.
-   logo/quiet-zone/frame warnings.

### Dynamic backend

-   `/api/qr` creation/listing.
-   `/api/qr/[id]`.
-   `/api/qr/[id]/destination`.
-   `/api/qr/[id]/status`.
-   `/api/qr/[id]/design`.
-   `/api/qr/[id]/versions`.
-   `/api/qr/[id]/versions/[vid]/restore`.
-   `/api/qr/[id]/analytics`.
-   `/api/qr/[id]/activity`.
-   `/api/qr/[id]/simulate`.
-   `/api/r/[slug]`.
-   `/api/report`.

### Current data model

-   User.
-   QrCode.
-   QrDestination.
-   QrDesign.
-   ScanEvent.
-   ActivityLog.

------------------------------------------------------------------------

## 3. Prototype limitations that must be removed before production

### P0 --- Database

The prototype uses SQLite and stores JSON-like configuration in strings.
Production target is PostgreSQL.

### P0 --- Authentication

Credentials authentication auto-provisions a new account when an unknown
email/password is entered. This is acceptable for a demo but must not be
the production registration/authentication model.

### P0 --- Rate limiting

Rate limiting is process-local memory. It will fail to coordinate across
instances and resets on restart.

### P0 --- Analytics realism

New dynamic QRs are seeded with synthetic scans. This must never happen
in production.

### P0 --- Geo

The prototype uses deterministic fake/approximate geography. Production
analytics must use a real, documented geo provider or omit geography.

### P0 --- Redirect analytics

The redirect handler performs a fire-and-forget database write. This is
unsafe as a production durability mechanism in serverless/ephemeral
runtimes.

### P0 --- Authorization model

Authorization is user ownership only. Production needs organization
membership and role-based authorization.

### P1 --- Analytics

Unique visitors are currently based on distinct `ipHash`. This must
become a documented privacy-preserving estimate, with configurable
retention.

### P1 --- Deletion

Hard deleting a QR cascades to destinations, scans and activity.
Production should use archival/soft-delete semantics so historical
integrity is preserved.

### P1 --- Validation

Destination validation exists and is useful, but production should
centralize validation with typed schemas and stronger hostname/IP
handling.

### P1 --- API

API responses are mostly unversioned and use generic string errors.
Introduce `/api/v1`, stable error codes and request IDs.

### P1 --- Pagination

QR lists and some history queries are bounded or unbounded in ways that
will not scale. Use cursor pagination.

### P1 --- Billing

No production subscription/entitlement system exists.

### P1 --- Organizations

No organizations, teams or roles exist.

### P1 --- File/storage model

Logo data is currently carried as a data URL in design configuration.
Production should use object storage references rather than large base64
strings in database rows.

### P2 --- Product breadth

Additional QR types, hosted landing pages, folders, campaigns, bulk
operations and custom domains are not yet implemented.

------------------------------------------------------------------------

## 4. Product goals

1.  Make dynamic QR redirection reliable at production scale.
2.  Make destination changes safe and auditable.
3.  Provide trustworthy scan analytics.
4.  Preserve the existing editorial visual identity.
5.  Support individual and business workspaces.
6.  Provide a clear free-to-paid upgrade path.
7.  Provide abuse controls suitable for a public redirect service.
8.  Make the application testable, observable and deployable.

------------------------------------------------------------------------

## 5. Success metrics

### Reliability

-   QR redirect availability target: 99.9%+ initially.
-   No valid QR becomes unusable because analytics is temporarily
    unavailable.

### Product

-   successful QR creation rate
-   successful scan-to-destination rate
-   destination edit success rate
-   QR export success rate
-   percentage of dynamic users viewing analytics
-   conversion from free to paid

### Performance

Set measured SLOs before launch. Initial engineering targets: - redirect
p50 \< 100 ms at the application edge - redirect p95 \< 300 ms excluding
destination site latency - dashboard API p95 \< 500 ms for normal
queries

------------------------------------------------------------------------

## 6. Personas

### Creator

Needs a QR quickly and does not understand technical QR internals.

### Marketer

Needs campaigns, editable destinations and analytics.

### Small business

Needs product/menu/contact QR codes with minimal complexity.

### Team administrator

Needs multiple users, roles and audit history.

### Platform administrator

Needs abuse review, billing support and operational controls.

------------------------------------------------------------------------

## 7. Functional requirements

### QR creation

-   Select static or dynamic.
-   Select QR content type.
-   Enter and validate content.
-   Customize design.
-   Preview live.
-   Save.
-   Download.
-   Copy scan URL for dynamic QR.
-   Test scan.

### Dynamic QR

-   Stable short code.
-   Editable destination.
-   Version history.
-   Restore previous destination.
-   Pause.
-   Resume.
-   Archive.
-   Analytics.
-   Audit history.

### QR management

-   Search.
-   Filter.
-   Sort.
-   Folder/campaign assignment.
-   Duplicate.
-   Archive.
-   Delete/retire.
-   Bulk actions on supported plans.

### Analytics

-   scans
-   estimated unique visitors
-   time series
-   country/region where available
-   device
-   operating system
-   browser
-   referrer domain
-   recent scans
-   peak time
-   export

### Account

-   registration
-   login
-   logout
-   verification
-   password reset
-   profile
-   session management
-   account deletion/export

### Organization

-   create workspace
-   invite members
-   role management
-   shared QR library
-   audit log

### Billing

-   plans
-   checkout
-   billing portal
-   usage
-   entitlements
-   webhook reconciliation

------------------------------------------------------------------------

## 8. Product rules

1.  A dynamic QR's scan URL must never change.
2.  Destination updates must create a new immutable destination version.
3.  Restore creates a new version; it never mutates history.
4.  Paused QR must not redirect.
5.  Archived QR must not redirect.
6.  Unknown QR codes return a safe branded page.
7.  Analytics must not block a valid redirect.
8.  Static QR destination cannot be edited.
9.  Short codes are never recycled.
10. Client UI must never be the authority for permissions or plan
    limits.
11. Production must never seed synthetic scans.
12. QR deletion must not destroy required audit evidence.

------------------------------------------------------------------------

## 9. Acceptance criteria

The production MVP is accepted only when:

-   a dynamic QR can be created;
-   the QR encodes the platform scan URL;
-   a real phone camera scans it;
-   it redirects to destination A;
-   destination is changed to B;
-   the same physical QR redirects to B;
-   version A remains visible;
-   version A can be restored as a new version;
-   scans are recorded reliably;
-   analytics show real scans;
-   unauthorized users cannot access or modify another organization's
    QR;
-   rate limits work across instances;
-   production uses PostgreSQL;
-   synthetic analytics are disabled;
-   critical E2E/security tests pass.
