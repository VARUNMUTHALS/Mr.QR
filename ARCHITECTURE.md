# Dynamic QR Platform --- Production Architecture

## 1. Architecture decision

The prototype is a strong monolithic Next.js foundation. Do **not**
immediately split it into microservices.

Use a modular monolith first, with one important logical separation:

-   **Control plane:** authenticated SaaS application.
-   **Data plane:** public QR redirect path.

The redirect path should be independently cacheable and operationally
resilient.

------------------------------------------------------------------------

## 2. Target architecture

``` text
                         Internet
                            |
                     CDN / WAF / TLS
                            |
             +--------------+---------------+
             |                              |
        App Dashboard                  QR Redirect
             |                              |
       Next.js App/API                /q/{shortCode}
             |                              |
             +---------------+--------------+
                             |
                       Service Layer
                             |
              +--------------+---------------+
              |              |               |
          PostgreSQL       Redis          Object Store
              |              |               |
              |              |          logos/files/exports
              |              |
              |          cache/rate limit
              |
        QR + users + analytics
              |
           Queue
              |
          Workers
              |
       aggregation/export/
       notifications/etc.
```

------------------------------------------------------------------------

## 3. Preserve the prototype

Retain where technically sound: - Next.js App Router. - TypeScript. -
Tailwind 4. - shadcn/Radix components. - Framer Motion. - Zustand
navigation model if the single-route constraint remains. - TanStack
Query. - `qr-code-styling`. - existing editorial primitives. - QR design
types. - destination versioning concept. - redirect fallback page
concept.

Refactor rather than replace.

------------------------------------------------------------------------

## 4. Target modules

Suggested source structure:

``` text
src/
  app/
    api/v1/
      auth/
      qr/
      analytics/
      organizations/
      billing/
      files/
    q/[shortCode]/
  modules/
    auth/
    qr/
    redirect/
    analytics/
    organizations/
    billing/
    abuse/
    files/
  lib/
    db/
    cache/
    queue/
    security/
    validation/
    observability/
```

The exact structure may adapt to the prototype.

------------------------------------------------------------------------

## 5. Redirect data path

``` text
GET /q/8F72KX92
       |
       v
WAF/rate limit
       |
       v
cache lookup
       |
       +---- hit ----> current destination
       |
       +---- miss ---> PostgreSQL
                         |
                         v
                     cache set
                         |
                         v
                  analytics event
                         |
                         v
                     302 redirect
```

Analytics event acceptance should preferably go to a queue or durable
event mechanism.

------------------------------------------------------------------------

## 6. Redirect cache

Cache only the minimum resolution object:

``` json
{
  "qrId": "...",
  "status": "ACTIVE",
  "destination": "https://example.com/product",
  "version": 4
}
```

Rules: - short TTL; - invalidate immediately on destination/status
changes; - never cache authorization-sensitive dashboard data
publicly; - use negative caching cautiously for unknown codes.

------------------------------------------------------------------------

## 7. Control plane

Handles: - authentication - QR CRUD - design configuration - destination
versioning - analytics queries - folders - campaigns - landing pages -
organizations - billing - exports - abuse administration

------------------------------------------------------------------------

## 8. Event processing

Recommended flow:

``` text
redirect request
      |
      +--> resolve QR
      |
      +--> enqueue ScanEvent
      |
      +--> redirect immediately
                    |
                    v
                 worker
                    |
          +---------+---------+
          |                   |
      raw events          aggregates
```

The worker must be retryable and idempotent where possible.

------------------------------------------------------------------------

## 9. Database target

PostgreSQL is mandatory for production.

Reason: - better concurrency; - indexes; - transactional guarantees; -
mature managed hosting; - partitioning options; - analytics workloads; -
concurrent application instances.

------------------------------------------------------------------------

## 10. Object storage

Move large assets out of `designConfig`.

Database should store:

``` text
logoAssetId
logoUrl/reference
```

Object storage contains the binary.

------------------------------------------------------------------------

## 11. Deployment

Minimum production topology:

``` text
CDN/WAF
   |
Next.js app instances
   |
PostgreSQL
Redis
Object storage
Queue/worker
```

Use managed services where possible.

------------------------------------------------------------------------

## 12. Observability

Required: - structured JSON logs - request IDs - redirect latency - QR
lookup errors - database latency - cache hit/miss - queue depth - worker
failure - API error rate - authentication failures - billing webhook
failures - abuse events

------------------------------------------------------------------------

## 13. Resilience rules

If analytics fails: - redirect still succeeds.

If Redis fails: - application falls back to PostgreSQL with stricter
rate controls.

If queue fails: - use a durable fallback or controlled synchronous
write; never silently lose all analytics.

If object storage fails: - existing QR redirects continue.

If billing provider fails: - existing entitlements remain based on last
verified subscription state until reconciliation.

------------------------------------------------------------------------

## 14. Migration strategy

Do not switch SQLite → PostgreSQL and rewrite the application
simultaneously.

Recommended sequence: 1. introduce repository/service boundaries; 2.
remove demo seed behavior; 3. add schema migrations; 4. deploy
PostgreSQL-compatible schema; 5. migrate existing data; 6. switch read
path; 7. verify; 8. switch writes; 9. keep rollback backup; 10. retire
SQLite.
