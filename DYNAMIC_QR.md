# Dynamic QR Engine --- Production Specification

## 1. Core invariant

A dynamic QR encodes:

`https://qr.example.com/q/{shortCode}`

It must never encode the current destination directly.

------------------------------------------------------------------------

## 2. Existing prototype behavior to preserve

The prototype already: - generates a slug; - stores destination
versions; - marks one destination current; - redirects through
`/api/r/[slug]`; - records scans; - supports destination changes; -
supports restoration; - supports pause/archive; - shows editorial
fallback pages.

The production upgrade changes the infrastructure without changing the
user-facing mental model.

------------------------------------------------------------------------

## 3. Public URL migration

Current prototype: `/api/r/{slug}`

Production target: `/q/{shortCode}`

Migration options:

### Preferred

Keep `/api/r/{slug}` permanently as a compatibility redirect to the new
resolver, or continue resolving it directly.

### Critical

Existing printed QR codes must continue working after deployment.

------------------------------------------------------------------------

## 4. Short-code generation

Use a cryptographically secure random generator.

Recommended: - 8--12 characters; - URL-safe alphabet; - avoid visually
confusing characters; - database unique constraint; - retry on
collision.

Five-character codes are acceptable for a demo but should be reviewed
for production scale.

------------------------------------------------------------------------

## 5. Destination update

``` text
User
 |
 | PATCH destination
 v
Authorize
 |
Validate URL
 |
Create version N+1
 |
Mark N+1 current
 |
Audit log
 |
Invalidate cache
```

Old versions remain immutable.

------------------------------------------------------------------------

## 6. Restore

Restoring version 2 when version 5 is current does NOT make version 2
current by mutation.

Instead:

``` text
v1 A
v2 B
v3 C
v4 D
v5 E
restore v2
v6 B
```

This preserves a complete audit trail.

------------------------------------------------------------------------

## 7. Redirect algorithm

``` text
handlePublicScan(shortCode, request):

  validate shortCode syntax

  apply distributed rate limit

  resolve cached QR

  if cache miss:
      load active resolution from PostgreSQL
      cache short-lived result

  if missing:
      return branded 404

  if paused:
      optionally record scan-attempt event
      return branded paused page

  if archived:
      return branded archived page

  if destination missing:
      return branded unavailable page

  emit ScanEvent asynchronously

  return 302 destination
```

------------------------------------------------------------------------

## 8. Redirect status code

Use `302` or `307` for dynamic QR resolution.

Do not use permanent `301` caching for destinations that can change.

------------------------------------------------------------------------

## 9. Destination validation

Allowed: - `http` - `https`

Reject: - javascript - data - file - vbscript - custom executable
schemes - malformed URLs

Optional business policies: - block known malicious domains; - block URL
shorteners if abuse requires it; - block unsupported internationalized
hostname edge cases; - domain allowlist for enterprise.

------------------------------------------------------------------------

## 10. SSRF

A pure redirect service does not need to fetch the destination.

Prefer: - validate syntax only; - do not server-fetch the destination.

If preview/link verification is later added, use SSRF-safe networking: -
resolve DNS carefully; - block loopback/private/link-local/metadata
ranges; - validate after DNS resolution; - limit redirects; - enforce
egress restrictions.

------------------------------------------------------------------------

## 11. Analytics

Current prototype uses a direct fire-and-forget database write.

Production should use: - durable queue/event stream; - or an
infrastructure-supported background mechanism.

The redirect must not depend on analytics success.

------------------------------------------------------------------------

## 12. Synthetic scans

Current prototype seeds synthetic scans after dynamic QR creation.

Production rule:

**Never seed fake scans.**

For demo mode only: - explicitly mark demo data; - keep it out of
production; - never mix demo events with real analytics.

------------------------------------------------------------------------

## 13. Cache invalidation

On: - destination change; - restore; - pause; - resume; - archive;

invalidate: `qr-resolution:{shortCode}`

------------------------------------------------------------------------

## 14. QR payload verification

Automated test must decode every generated export and compare with
expected data.

Dynamic expected payload: `https://qr.example.com/q/{shortCode}`

------------------------------------------------------------------------

## 15. Scan reliability

QR generation should enforce: - quiet zone; - adequate contrast; - error
correction; - logo size limits; - no obstruction of critical QR modules.

Design validation is a warning system, not proof of scanability.
Automated decoding plus physical-device tests are required.
