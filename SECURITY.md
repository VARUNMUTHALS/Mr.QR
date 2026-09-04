# Security Specification

## 1. Security priorities

This product is a public redirect platform. The highest risks are:

1.  open redirect abuse;
2.  phishing/malware distribution;
3.  account takeover;
4.  broken object-level authorization;
5.  SSRF if URL fetching is introduced;
6.  file upload abuse;
7.  rate-limit bypass;
8.  analytics/privacy leakage;
9.  billing entitlement abuse;
10. operational abuse against the redirect endpoint.

------------------------------------------------------------------------

## 2. Authentication

Prototype behavior: - NextAuth credentials; - JWT session; -
auto-provisioning on first login.

Production: - explicit registration; - email verification; - secure
password hashing; - password reset; - session rotation/invalidation; -
optional MFA; - optional OAuth.

Minimum password policy should be reasonable without creating
unnecessary friction.

------------------------------------------------------------------------

## 3. Authorization

Implement organization-scoped RBAC.

``` text
OWNER
ADMIN
EDITOR
ANALYST
VIEWER
```

Examples: - Viewer: read QR metadata/analytics. - Analyst:
analytics/export. - Editor: create/edit QR. - Admin: team/settings. -
Owner: billing/ownership/destructive operations.

------------------------------------------------------------------------

## 4. BOLA/IDOR prevention

Every API route must resolve resource ownership through the
authenticated principal.

Bad:

``` text
GET /qr/123
```

then trust `userId` supplied by client.

Good:

``` text
session user
 -> organization membership
 -> qr where qr.organizationId = organization.id
```

------------------------------------------------------------------------

## 5. Session security

Use: - HttpOnly cookies; - Secure in production; - appropriate
SameSite; - CSRF protection where required; - short-lived access/session
strategy where appropriate; - server-side logout/session revocation for
sensitive operations.

------------------------------------------------------------------------

## 6. Redirect security

Never implement:

`/q/abc?url=https://attacker.example`

The only destination is the one stored against `abc`.

------------------------------------------------------------------------

## 7. URL validation

Centralize validation.

Reject dangerous schemes and malformed values.

Do not automatically fetch arbitrary URLs from the server.

------------------------------------------------------------------------

## 8. SSRF

If future features verify destination URLs: - block private addresses; -
block loopback; - block link-local; - block cloud metadata; - validate
DNS resolution; - restrict redirects; - enforce timeouts; - enforce
response-size limits; - isolate outbound network.

------------------------------------------------------------------------

## 9. Rate limiting

Prototype uses in-memory buckets.

Production use: - Redis or edge/WAF rate limiting.

Separate limits: - login; - password reset; - QR creation; - destination
update; - analytics; - exports; - public scans; - abuse reports.

------------------------------------------------------------------------

## 10. Abuse prevention

Provide: - report QR; - admin queue; - QR disable; - account
suspension; - destination moderation; - audit log; - abuse reason; -
review status.

Do not expose administrative controls publicly.

------------------------------------------------------------------------

## 11. File uploads

For logos/PDFs: - verify MIME and magic bytes; - maximum size; - image
dimensions; - randomized object key; - private storage where possible; -
malware scanning if available; - signed download URLs; - reject
executable types.

Never store large base64 data URLs inside normal QR database rows.

------------------------------------------------------------------------

## 12. XSS

Potential inputs: - QR name; - landing page content; - destination
URL; - campaign name; - report reason.

Escape output and sanitize rich content.

Never render user HTML without sanitization.

------------------------------------------------------------------------

## 13. CSRF

Protect cookie-authenticated state-changing endpoints.

SameSite cookies help but are not the only control where CSRF is
applicable.

------------------------------------------------------------------------

## 14. Security headers

Use appropriate: - HSTS; - CSP; - X-Content-Type-Options; -
Referrer-Policy; - Permissions-Policy; - frame protections.

Landing-page CSP may need a separate policy.

------------------------------------------------------------------------

## 15. Secrets

Never commit: - database credentials; - auth secrets; - billing keys; -
storage keys; - geo provider keys; - encryption keys.

Use secret management in production.

------------------------------------------------------------------------

## 16. Logging

Include: - request ID; - actor; - organization; - action; - status; -
latency.

Do not log: - passwords; - session tokens; - API keys; - payment
secrets; - sensitive query strings.

------------------------------------------------------------------------

## 17. Billing security

-   verify webhook signatures;
-   idempotently process events;
-   never trust browser-selected plan;
-   calculate entitlement server-side;
-   reconcile provider state.

------------------------------------------------------------------------

## 18. Prototype-specific security changes

### Replace

`rateLimit()` in `src/lib/security/index.ts`

with distributed rate limiting.

### Replace

`auto-provision` in `src/lib/auth.ts`

with explicit account creation.

### Remove

`seedSampleScans()` from production QR creation.

### Remove

`approximateGeo()` from real scan processing.

### Review

`getIp()` because trusting the first `x-forwarded-for` value can be
unsafe unless the application is behind a trusted proxy.

### Review

`userAgent` persistence; store normalized fields rather than unnecessary
raw strings.

### Review

`ActivityLog.metadata` because destination URLs may contain sensitive
query parameters.

------------------------------------------------------------------------

## 19. Security release gate

Production cannot launch until: - BOLA tests pass; - open redirect tests
pass; - SSRF tests pass where applicable; - rate limiting works across
instances; - authentication abuse tests pass; - upload validation
passes; - billing webhooks are verified; - secrets scan passes; -
dependency audit is clean enough for release.
