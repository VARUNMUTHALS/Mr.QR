# Dynamic QR Platform --- API Specification

## 1. API principles

Production API prefix:

`/api/v1`

All authenticated mutations: - require authentication; - validate
request body; - authorize resource; - enforce plan entitlements; -
return stable error codes; - include request ID.

------------------------------------------------------------------------

## 2. Error format

``` json
{
  "error": {
    "code": "QR_NOT_FOUND",
    "message": "The QR code was not found.",
    "requestId": "req_01..."
  }
}
```

Common codes: - UNAUTHENTICATED - FORBIDDEN - VALIDATION_ERROR -
QR_NOT_FOUND - DESTINATION_INVALID - QR_PAUSED - QR_ARCHIVED -
PLAN_LIMIT_REACHED - RATE_LIMITED - CONFLICT - INTERNAL_ERROR

------------------------------------------------------------------------

## 3. Authentication

`POST /api/v1/auth/register`

`POST /api/v1/auth/login`

`POST /api/v1/auth/logout`

`POST /api/v1/auth/verify-email`

`POST /api/v1/auth/forgot-password`

`POST /api/v1/auth/reset-password`

`GET /api/v1/auth/me`

Production registration must not auto-create an account merely because a
login attempt used an unknown email.

------------------------------------------------------------------------

## 4. QR

### POST /api/v1/qr

Request:

``` json
{
  "name": "Summer Campaign",
  "type": "DYNAMIC",
  "contentType": "URL",
  "destinationUrl": "https://example.com/summer",
  "design": {}
}
```

Response:

``` json
{
  "qr": {
    "id": "...",
    "name": "Summer Campaign",
    "type": "DYNAMIC",
    "status": "ACTIVE",
    "shortCode": "8F72KX92",
    "scanUrl": "https://qr.example.com/q/8F72KX92",
    "destination": "https://example.com/summer"
  }
}
```

------------------------------------------------------------------------

### GET /api/v1/qr

Parameters: - cursor - limit - search - type - status - folder -
campaign - sort

Never return unbounded results.

------------------------------------------------------------------------

### GET /api/v1/qr/{id}

Returns authorized QR details.

------------------------------------------------------------------------

### PATCH /api/v1/qr/{id}

Mutable: - name - metadata - organization classification

Destination should have its own endpoint.

------------------------------------------------------------------------

### DELETE /api/v1/qr/{id}

Soft delete/archive according to policy.

------------------------------------------------------------------------

## 5. Destination

### POST /api/v1/qr/{id}/destination

Request:

``` json
{
  "destinationUrl": "https://example.com/new"
}
```

Creates a new immutable version.

------------------------------------------------------------------------

### GET /api/v1/qr/{id}/destinations

Cursor-paginated version history.

------------------------------------------------------------------------

### POST /api/v1/qr/{id}/destinations/{versionId}/restore

Creates a new version using the selected historical destination.

------------------------------------------------------------------------

## 6. Status

`POST /api/v1/qr/{id}/status`

Body:

``` json
{
  "status": "PAUSED"
}
```

Allowed transitions must be defined.

------------------------------------------------------------------------

## 7. Design

`PUT /api/v1/qr/{id}/design`

The server validates the complete design schema.

Do not accept arbitrary JSON without schema validation.

------------------------------------------------------------------------

## 8. Public redirect

`GET /q/{shortCode}`

This is intentionally outside the authenticated API namespace.

Rules: - public; - short code only; - no arbitrary destination query
parameter; - rate limited; - cached; - safe branded errors; - temporary
redirect; - analytics event emitted.

------------------------------------------------------------------------

## 9. Analytics

`GET /api/v1/qr/{id}/analytics`

Parameters: - from - to - timezone - granularity

Response:

``` json
{
  "summary": {
    "scans": 1234,
    "estimatedUniqueVisitors": 812
  },
  "timeline": [],
  "devices": [],
  "operatingSystems": [],
  "browsers": [],
  "countries": [],
  "referrers": []
}
```

------------------------------------------------------------------------

## 10. Analytics export

`POST /api/v1/qr/{id}/analytics/export`

Large exports should be asynchronous.

`GET /api/v1/exports/{id}`

------------------------------------------------------------------------

## 11. Folders/campaigns

`POST /api/v1/folders`

`GET /api/v1/folders`

`PATCH /api/v1/folders/{id}`

`DELETE /api/v1/folders/{id}`

`POST /api/v1/folders/{id}/qr`

`DELETE /api/v1/folders/{id}/qr/{qrId}`

Campaign endpoints follow the same pattern.

------------------------------------------------------------------------

## 12. Organizations

`POST /api/v1/organizations`

`GET /api/v1/organizations`

`GET /api/v1/organizations/{id}`

`PATCH /api/v1/organizations/{id}`

`POST /api/v1/organizations/{id}/invitations`

`PATCH /api/v1/organizations/{id}/members/{userId}`

`DELETE /api/v1/organizations/{id}/members/{userId}`

------------------------------------------------------------------------

## 13. Billing

`GET /api/v1/billing/subscription`

`GET /api/v1/billing/usage`

`POST /api/v1/billing/checkout`

`POST /api/v1/billing/portal`

`POST /api/v1/billing/webhook`

Webhook must verify provider signature and be idempotent.

------------------------------------------------------------------------

## 14. Abuse

`POST /api/v1/abuse/reports`

`GET /api/v1/admin/abuse/reports`

`POST /api/v1/admin/abuse/{qrId}/disable`

Admin routes require explicit admin authorization.

------------------------------------------------------------------------

## 15. Idempotency

Support `Idempotency-Key` for: - QR creation; - export creation; -
billing checkout where supported; - bulk operations.

------------------------------------------------------------------------

## 16. Authorization pattern

Every handler must follow:

``` text
authenticate
  -> resolve organization
  -> check role
  -> resolve resource within organization
  -> check entitlement
  -> execute
```

Never:

``` text
find QR by id
then compare only a client-provided userId
```

------------------------------------------------------------------------

## 17. Compatibility

Existing prototype endpoints may be temporarily retained behind adapters
during migration. New production clients should use `/api/v1`.

Do not break the public redirect URL used by existing printed QR codes.
