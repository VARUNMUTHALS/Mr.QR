# Analytics Specification

## 1. Production problem in prototype

The prototype analytics are useful for demonstrating the product, but: -
synthetic scan history is generated at creation; - geography is
deterministic fake data; - unique visitors are distinct `ipHash`; -
daily unique values contain randomized estimates in the timeline
helper; - raw scans are queried into memory.

These are acceptable demo techniques but must be removed for production.

------------------------------------------------------------------------

## 2. Analytics event

A production event should contain:

``` text
qrId
occurredAt
deviceType
osFamily
browserFamily
country
region
city (optional/coarsened)
referrerDomain
visitorKey
suspectedBot
requestId
source
```

------------------------------------------------------------------------

## 3. Privacy

Use data minimization.

Do not expose: - raw IP; - full raw user-agent; - authentication data; -
arbitrary query-string secrets.

If IP is used to derive a visitor key: - hash with a server-side
secret; - rotate the secret/salt on a documented schedule if desired; -
define retention; - never describe the result as a person count.

UI label: **Estimated unique visitors**

------------------------------------------------------------------------

## 4. Geography

The prototype's `approximateGeo()` is deterministic sample data and must
be removed.

Production options: 1. trusted edge/CDN geo headers; 2.
privacy-conscious IP geolocation service; 3. no geography.

Never claim GPS precision.

------------------------------------------------------------------------

## 5. Time series

All events stored in UTC.

Analytics request includes reporting timezone.

For `today`: - hourly buckets.

For 7/30/90 days: - daily buckets.

For larger ranges: - daily/weekly/monthly aggregate tables.

------------------------------------------------------------------------

## 6. Aggregation architecture

``` text
ScanEvent
   |
   v
Worker
   |
   +--> hourly aggregate
   |
   +--> daily aggregate
```

Dashboard should use aggregates for large datasets.

------------------------------------------------------------------------

## 7. Bot detection

Conservative: - known crawler user agents; - impossible request rates; -
repeated automated patterns.

Do not silently remove ambiguous traffic.

Expose: - total scans; - optionally suspected bot scans; -
human-oriented estimate.

------------------------------------------------------------------------

## 8. Unique visitor definition

Document exactly what the metric means.

Example:
`estimatedUniqueVisitors = count(distinct rotatingVisitorKey within reporting period)`

This is an estimate, not an identity system.

------------------------------------------------------------------------

## 9. Dashboard

### Overview

-   total scans
-   estimated unique visitors
-   active QR codes
-   scans today
-   trend

### QR detail

-   scans
-   estimated unique visitors
-   first scan
-   latest scan
-   growth
-   time series
-   device
-   OS
-   browser
-   geography
-   referrer

------------------------------------------------------------------------

## 10. Analytics query safety

Current prototype loads all scan rows for the selected range into
application memory.

Production: - aggregate in SQL; - use indexes; - paginate recent
scans; - cap date ranges; - use precomputed aggregates for expensive
charts.

------------------------------------------------------------------------

## 11. Recent scans

Use cursor pagination.

Fields shown: - timestamp - device - OS - country - browser - test/live
marker

Do not expose IP.

------------------------------------------------------------------------

## 12. Export

Default export should be aggregate data.

Raw event export: - privileged; - retention-aware; - privacy-reviewed; -
plan-controlled.

------------------------------------------------------------------------

## 13. Failure behavior

If analytics worker is unavailable: - QR still redirects; - events
remain retryable; - queue depth alerts; - dead-letter events are
recoverable.

------------------------------------------------------------------------

## 14. Data retention

Create a documented policy before production.

Example: - raw events: 90 days Free, 180 days Pro, 365 days Business; -
aggregates: longer; - audit logs: according to operational/legal
requirements.

Make retention configurable.

------------------------------------------------------------------------

## 15. Analytics acceptance tests

-   real scan increments scan count;
-   test scan is visibly labeled;
-   duplicate/retry semantics are defined;
-   date boundary is correct;
-   timezone conversion is correct;
-   destination edits do not reset scan history;
-   paused QR behavior is correct;
-   organization isolation is correct;
-   analytics failure never blocks redirect.
