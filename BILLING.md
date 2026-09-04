# Billing and Entitlement Specification

## 1. Goal

Turn the prototype into a SaaS product without allowing billing logic to
leak into or control the core QR redirect path.

------------------------------------------------------------------------

## 2. Suggested plans

Exact pricing must be configurable.

### Free

-   limited dynamic QRs;
-   limited monthly scans;
-   basic customization;
-   PNG/SVG subject to policy;
-   limited analytics retention.

### Pro

-   higher dynamic QR limit;
-   higher scan allowance;
-   advanced customization;
-   analytics;
-   landing pages;
-   folders/campaigns;
-   longer retention;
-   exports.

### Business

-   teams;
-   RBAC;
-   custom domains;
-   API;
-   bulk generation;
-   advanced analytics;
-   audit logs;
-   higher limits;
-   priority support.

------------------------------------------------------------------------

## 3. Entitlement service

Use:

``` text
organization
    |
    v
subscription
    |
    v
plan
    |
    v
entitlements
```

Examples: - maxDynamicQr; - monthlyScans; - maxMembers; -
analyticsRetentionDays; - customDomain; - apiAccess; - bulkGeneration; -
whiteLabel.

------------------------------------------------------------------------

## 4. Server-side enforcement

The browser may display: `You have 3 of 5 dynamic QR codes.`

But the server must enforce:
`createDynamicQr -> entitlementService.check(...)`

Never trust a client plan field.

------------------------------------------------------------------------

## 5. Checkout

Flow:

``` text
Pricing page
   |
   v
server creates checkout session
   |
   v
payment provider
   |
   v
webhook
   |
   v
subscription state
   |
   v
entitlement cache refresh
```

Do not activate paid access merely because the browser returned from
checkout.

------------------------------------------------------------------------

## 6. Webhooks

Must: - verify signature; - use idempotency; - store provider event
ID; - handle out-of-order events; - reconcile current provider state.

------------------------------------------------------------------------

## 7. Usage

Count: - dynamic QR creation; - real scans; - storage; - exports; - API
requests; - seats.

Test scans should not consume production scan allowance unless policy
says otherwise.

------------------------------------------------------------------------

## 8. Downgrade

Recommended policy: - existing dynamic QRs continue redirecting; -
existing printed QRs are not broken; - creation/editing of over-limit
resources may be restricted; - analytics retention can shorten only
according to clearly communicated policy.

------------------------------------------------------------------------

## 9. Pricing configuration

Keep prices and limits outside UI source code.

Use server configuration/database.

------------------------------------------------------------------------

## 10. Billing UI

Show: - current plan; - current period; - usage; - renewal; - upgrade; -
billing portal; - invoices if available.

Avoid dark patterns.

------------------------------------------------------------------------

## 11. Prototype status

Billing is currently absent. It must be implemented only after core
production QR/analytics infrastructure is stable.
