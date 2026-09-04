# Roadmap --- Prototype to Production

## Phase 0 --- Prototype audit

### Already verified in repository

-   Next.js 16 App Router.
-   TypeScript.
-   Tailwind 4.
-   shadcn/Radix.
-   Prisma.
-   SQLite.
-   NextAuth.
-   qr-code-styling.
-   dynamic redirect.
-   destination versioning.
-   analytics UI.
-   activity history.
-   design controls.

### Audit deliverables

-   baseline build;
-   baseline tests;
-   route inventory;
-   schema inventory;
-   security findings;
-   demo-data inventory.

------------------------------------------------------------------------

## Phase 1 --- Production core

Priority P0.

1.  PostgreSQL migration.
2.  Remove synthetic scan seeding.
3.  Remove fake geography.
4.  Introduce explicit registration/authentication.
5.  Distributed rate limiting.
6.  Stable public redirect route.
7.  Durable scan event pipeline.
8.  typed request validation.
9.  soft deletion.
10. stronger authorization.

Exit: real QR survives destination changes in production.

------------------------------------------------------------------------

## Phase 2 --- Analytics

1.  real geo source or omit geo;
2.  privacy-preserving visitor key;
3.  aggregate tables;
4.  cursor-paginated recent scans;
5.  timezone-aware charts;
6.  analytics export;
7.  retention policy;
8.  bot classification.

------------------------------------------------------------------------

## Phase 3 --- SaaS foundation

1.  organizations;
2.  members;
3.  roles;
4.  invitations;
5.  audit logs;
6.  usage counters;
7.  billing provider;
8.  entitlements.

------------------------------------------------------------------------

## Phase 4 --- Product expansion

1.  URL;
2.  text;
3.  vCard;
4.  Wi-Fi;
5.  email;
6.  phone;
7.  SMS;
8.  WhatsApp;
9.  location;
10. social;
11. file/PDF;
12. app download.

Add one type at a time behind a typed content model.

------------------------------------------------------------------------

## Phase 5 --- Landing pages

1.  template system;
2.  product;
3.  contact;
4.  event;
5.  restaurant;
6.  campaign;
7.  analytics integration;
8.  custom slug.

------------------------------------------------------------------------

## Phase 6 --- Business features

1.  folders;
2.  campaigns;
3.  bulk generation;
4.  CSV import/export;
5.  API keys;
6.  custom domains;
7.  advanced analytics;
8.  white-label options.

------------------------------------------------------------------------

## Phase 7 --- Scale

Only after measured demand: - dedicated redirect service; - edge
resolution; - multi-region database/read strategy; - streaming
analytics; - partitioned events; - advanced abuse detection.

Do not introduce distributed complexity before required.

------------------------------------------------------------------------

## Priority labels

### P0

Required for production reliability/security.

### P1

Required for paid SaaS/MVP completeness.

### P2

Growth and scale features.

------------------------------------------------------------------------

## Rollback principle

Every phase must be independently deployable or have a documented
rollback.

Database migrations must be backward-compatible where possible.
