# Testing Strategy --- Dynamic QR Platform

## 1. Test pyramid

``` text
        E2E / physical scan
              /\
             /  \
        integration/API
           /      \
       unit tests
```

Critical QR behavior receives all three levels.

------------------------------------------------------------------------

## 2. Prototype baseline tests

Before modifications: - install dependencies; - run typecheck; - lint; -
build; - start app; - test static QR; - test dynamic QR; - test
redirect; - test destination update; - test restore; - test analytics; -
test status changes.

Capture baseline failures.

------------------------------------------------------------------------

## 3. Critical dynamic test

``` text
Create QR
   |
Scan -> A
   |
Change destination -> B
   |
Scan same physical QR
   |
Must redirect -> B
   |
Restore A
   |
Scan
   |
Must redirect -> A
```

------------------------------------------------------------------------

## 4. QR payload test

Generate QR.

Decode it automatically.

For dynamic:

``` text
decoded === https://qr.example.com/q/{shortCode}
```

For static:

``` text
decoded === expected static payload
```

------------------------------------------------------------------------

## 5. Authorization tests

For two users/orgs:

-   User A cannot read User B QR.
-   User A cannot edit User B destination.
-   User A cannot restore User B version.
-   Viewer cannot modify QR.
-   Analyst cannot change destination.
-   Editor cannot manage billing.
-   Member cannot remove owner.

------------------------------------------------------------------------

## 6. Security tests

### Open redirect

Attempt: `/q/abc?url=https://attacker`

Must not redirect to attacker.

### SSRF

If URL fetcher exists: - localhost; - 127.0.0.1; - private ranges; -
link-local; - metadata endpoints.

### XSS

Inject scripts in: - QR name; - landing page; - campaign; - report.

### IDOR/BOLA

Use valid resource IDs from another organization.

### Rate limiting

Test across multiple app instances.

### Webhook

Send invalid signatures.

------------------------------------------------------------------------

## 7. Analytics tests

-   real scan recorded;
-   test scan labeled;
-   scan count increments;
-   unique estimate follows documented algorithm;
-   timezone boundary correct;
-   range filtering correct;
-   aggregation matches raw events;
-   bot handling consistent;
-   analytics outage does not block redirect.

------------------------------------------------------------------------

## 8. Database tests

-   short code unique;
-   version numbers unique per QR;
-   one current destination;
-   foreign keys work;
-   soft deletion works;
-   migrations apply from empty database;
-   migrations upgrade existing database.

------------------------------------------------------------------------

## 9. QR design tests

Test: - black/white; - brand colors; - rounded; - dots; - logo; - ECC
L/M/Q/H; - quiet zone values; - frames; - SVG; - PNG.

Every generated code must decode.

------------------------------------------------------------------------

## 10. Physical scan matrix

At least: - iPhone Safari camera; - Android camera/Google Lens; -
Chrome; - low brightness; - printed sample; - small printed sample; -
logo version; - outdoor/indoor lighting.

------------------------------------------------------------------------

## 11. Performance tests

Load: - redirect endpoint; - QR lookup; - QR creation; - analytics; -
export.

Measure: - p50; - p95; - p99; - errors; - DB connections; - cache hit
rate.

------------------------------------------------------------------------

## 12. Failure tests

Simulate: - DB unavailable; - Redis unavailable; - queue unavailable; -
storage unavailable; - billing provider unavailable.

Core requirement: A valid active QR should remain as resilient as
architecture permits even when analytics/background systems fail.

------------------------------------------------------------------------

## 13. Regression suite

Every production release runs: - lint; - typecheck; - unit tests; -
integration tests; - E2E; - build; - migration validation; - security
checks.

------------------------------------------------------------------------

## 14. Release gate

No release if: - critical dynamic flow fails; - QR decoder fails; - BOLA
test fails; - open redirect exists; - production build fails; -
migration cannot run; - secrets are detected.
