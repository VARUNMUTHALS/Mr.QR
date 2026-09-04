# Dynamic QR Platform --- PostgreSQL Database Specification

## 1. Migration from prototype

Current prototype: - Prisma - SQLite - JSON stored as strings -
User-owned QR records

Target: - Prisma + PostgreSQL - normalized relational data - JSONB only
for genuinely flexible configuration - organizations/workspaces -
immutable history - append-heavy analytics - soft deletion

------------------------------------------------------------------------

## 2. Core entities

``` text
User
  |
  +--- OrganizationMember --- Organization
                                  |
                                  +--- QRCode
                                  |      |
                                  |      +--- QRDestinationVersion
                                  |      +--- QRDesignVersion
                                  |      +--- ScanEvent
                                  |      +--- AuditLog
                                  |
                                  +--- Campaign
                                  +--- Folder
                                  +--- Subscription
```

------------------------------------------------------------------------

## 3. User

Fields: - id UUID/ULID - email - email_verified_at - name -
avatar_asset_id - password_hash - created_at - updated_at - deleted_at

Indexes: - unique lower(email)

Never store plaintext passwords.

------------------------------------------------------------------------

## 4. Organization

Fields: - id - name - slug - owner_user_id - created_at - updated_at -
deleted_at

Indexes: - unique slug - owner_user_id

------------------------------------------------------------------------

## 5. OrganizationMember

Fields: - organization_id - user_id - role - created_at - updated_at

Roles: - OWNER - ADMIN - EDITOR - ANALYST - VIEWER

Unique: `organization_id + user_id`

------------------------------------------------------------------------

## 6. QRCode

Fields: - id - organization_id - created_by - name - short_code - type -
content_type - static_payload nullable - status - current_destination_id
nullable - current_design_version nullable - created_at - updated_at -
archived_at - deleted_at

Indexes: - unique short_code - organization_id + updated_at -
organization_id + status - organization_id + type

Do not use sequential public identifiers.

------------------------------------------------------------------------

## 7. QRDestinationVersion

Fields: - id - qr_id - version_number - destination_type -
destination_url - landing_page_id nullable - created_by - created_at -
change_reason nullable

Unique: `qr_id + version_number`

The current version should be represented by a single pointer on QRCode
or a database-enforced current marker. Avoid relying only on application
logic to maintain multiple `isCurrent=true` rows.

------------------------------------------------------------------------

## 8. QRDesignVersion

Fields: - id - qr_id - version_number - config JSONB - logo_asset_id
nullable - created_by - created_at

Design configuration should be validated before persistence.

------------------------------------------------------------------------

## 9. ScanEvent

Fields: - id - qr_id - occurred_at - country_code nullable - region_code
nullable - city nullable - device_type - os_family - browser_family -
referrer_domain nullable - visitor_key nullable - suspected_bot
boolean - request_id - source (`REAL`, `TEST`) - retention_expires_at

Do not expose raw IP.

If raw IP is temporarily required for abuse/security: - encrypt or
strictly protect it; - define retention; - restrict access; - do not
include it in normal analytics exports.

Indexes: - qr_id + occurred_at DESC - organization/QR + occurred_at if
needed - occurred_at for retention jobs

For high volume, partition by month.

------------------------------------------------------------------------

## 10. ScanDailyAggregate

Fields: - qr_id - date - scans - estimated_unique_visitors - mobile -
tablet - desktop - bot_scans - country_breakdown JSONB where appropriate

Unique: `qr_id + date`

------------------------------------------------------------------------

## 11. AuditLog

Fields: - id - organization_id - actor_user_id nullable - action -
entity_type - entity_id - metadata JSONB - created_at

Actions: - QR_CREATED - QR_RENAMED - DESTINATION_CHANGED -
DESTINATION_RESTORED - DESIGN_CHANGED - QR_PAUSED - QR_ACTIVATED -
QR_ARCHIVED - MEMBER_INVITED - MEMBER_ROLE_CHANGED - BILLING_CHANGED -
ABUSE_ACTION

Never put secrets in metadata.

------------------------------------------------------------------------

## 12. Folder

Fields: - id - organization_id - name - created_at

Membership: `FolderQRCode(folder_id, qr_id)`

------------------------------------------------------------------------

## 13. Campaign

Fields: - id - organization_id - name - external_reference nullable -
created_at - updated_at

QR may belong to one or more campaigns depending on product policy.

------------------------------------------------------------------------

## 14. LandingPage

Fields: - id - organization_id - qr_id - slug - title - description -
content JSONB - published - created_at - updated_at

------------------------------------------------------------------------

## 15. Asset

Fields: - id - organization_id - storage_key - mime_type - size_bytes -
checksum - created_at - deleted_at

------------------------------------------------------------------------

## 16. Subscription

Fields: - id - organization_id - provider - provider_customer_id -
provider_subscription_id - plan - status - period_start - period_end -
created_at - updated_at

Unique provider subscription ID.

------------------------------------------------------------------------

## 17. UsageCounter

Fields: - organization_id - period_start - period_end -
dynamic_qr_count - scan_count - storage_bytes - api_request_count -
export_count

------------------------------------------------------------------------

## 18. Migration from existing SQLite

Mapping:

``` text
User                 -> User
QrCode               -> QRCode
QrDestination        -> QRDestinationVersion
QrDesign             -> QRDesignVersion
ScanEvent            -> ScanEvent
ActivityLog          -> AuditLog
```

Before migration: - remove synthetic scan records or mark them
explicitly; - preserve real prototype data if required; - convert
designConfig strings to JSONB; - validate every destination; - assign
existing users to an organization; - preserve QR slugs/short codes; - do
not reuse short codes.

------------------------------------------------------------------------

## 19. Transaction rules

Destination update:

``` text
BEGIN
  verify authorization
  create next destination version
  update current destination pointer
  create audit log
COMMIT
invalidate cache
```

Never mutate an old destination version.

------------------------------------------------------------------------

## 20. Deletion

Use soft deletion.

Recommended: - archive QR; - retain scan/audit history; - hide from
normal lists; - never recycle short code.

Hard deletion should be a controlled privacy/compliance operation, not
normal UI behavior.
