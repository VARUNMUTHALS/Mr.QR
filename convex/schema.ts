import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 1. Users
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_email", ["email"]),

  // 2. Organizations
  organizations: defineTable({
    clerkOrganizationId: v.string(),
    name: v.string(),
    slug: v.string(),
    plan: v.string(), // "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE"
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_org_id", ["clerkOrganizationId"])
    .index("by_slug", ["slug"]),

  // 3. Organization Memberships & Roles
  memberships: defineTable({
    organizationId: v.string(),
    clerkUserId: v.string(),
    role: v.string(), // "OWNER" | "ADMIN" | "EDITOR" | "ANALYST" | "VIEWER"
    createdAt: v.number(),
  })
    .index("by_org", ["organizationId"])
    .index("by_org_and_user", ["organizationId", "clerkUserId"])
    .index("by_user", ["clerkUserId"]),

  // 4. QR Codes
  qrCodes: defineTable({
    organizationId: v.string(),
    createdBy: v.string(),
    name: v.string(),
    type: v.string(), // "STATIC" | "DYNAMIC"
    shortCode: v.string(), // Base58 public identifier
    status: v.string(), // "ACTIVE" | "PAUSED" | "ARCHIVED"
    currentDestinationId: v.optional(v.string()),
    designId: v.optional(v.string()),
    folderId: v.optional(v.string()),
    campaignId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    archivedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
  })
    .index("by_shortCode", ["shortCode"])
    .index("by_org", ["organizationId"])
    .index("by_org_and_status", ["organizationId", "status"])
    .index("by_org_and_created", ["organizationId", "createdAt"]),

  // 5. Immutable Destination History (Versions v1, v2, v3...)
  qrDestinations: defineTable({
    qrId: v.string(),
    url: v.string(),
    version: v.number(),
    isCurrent: v.boolean(),
    createdBy: v.string(),
    changeReason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_qr", ["qrId"])
    .index("by_qr_and_version", ["qrId", "version"])
    .index("by_qr_and_current", ["qrId", "isCurrent"]),

  // 6. QR Design Configurations (Immutable snapshots)
  qrDesigns: defineTable({
    qrId: v.string(),
    version: v.number(),
    config: v.string(), // JSON stringified design config
    createdAt: v.number(),
  })
    .index("by_qr", ["qrId"])
    .index("by_qr_and_version", ["qrId", "version"]),

  // 7. Raw Scan Events (Non-blocking ingested)
  scanEvents: defineTable({
    qrId: v.string(),
    organizationId: v.string(),
    timestamp: v.number(),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    deviceType: v.string(),
    os: v.string(),
    osFamily: v.optional(v.string()),
    browser: v.string(),
    browserFamily: v.optional(v.string()),
    referrer: v.optional(v.string()),
    referrerDomain: v.optional(v.string()),
    visitorKey: v.string(), // Salted HMAC-SHA256 (zero raw IP)
    ipHash: v.string(),
    userAgentHash: v.optional(v.string()),
    bot: v.boolean(),
    source: v.string(),
  })
    .index("by_qr_and_time", ["qrId", "timestamp"])
    .index("by_org_and_time", ["organizationId", "timestamp"]),

  // 8. Pre-aggregated Daily Analytics
  scanDailyStats: defineTable({
    organizationId: v.string(),
    qrId: v.string(),
    date: v.string(), // "YYYY-MM-DD"
    totalScans: v.number(),
    uniqueVisitors: v.number(),
    mobileScans: v.number(),
    desktopScans: v.number(),
    topCountries: v.string(), // JSON map
    topCities: v.string(), // JSON map
    topBrowsers: v.string(), // JSON map
    topOS: v.string(), // JSON map
    topReferrers: v.string(), // JSON map
    updatedAt: v.number(),
  })
    .index("by_qr_and_date", ["qrId", "date"])
    .index("by_org_and_date", ["organizationId", "date"]),

  // 9. Activity & Audit Logs
  activityLogs: defineTable({
    organizationId: v.string(),
    userId: v.optional(v.string()),
    qrId: v.optional(v.string()),
    action: v.string(),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_org_and_created", ["organizationId", "createdAt"])
    .index("by_qr", ["qrId"]),

  // 10. Campaigns & Folders
  campaigns: defineTable({
    organizationId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_org", ["organizationId"]),

  folders: defineTable({
    organizationId: v.string(),
    name: v.string(),
    color: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_org", ["organizationId"]),

  // 11. Subscriptions & Plan Entitlements
  subscriptions: defineTable({
    organizationId: v.string(),
    plan: v.string(), // "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE"
    status: v.string(), // "active" | "canceled" | "past_due"
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_org", ["organizationId"]),
});
