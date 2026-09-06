import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOrgRole } from "./helpers/ownership";
import { validateDestinationUrl } from "./helpers/validation";
import { logActivity } from "./helpers/audit";

// Base58 characters (excluding visually ambiguous chars 0, O, I, l)
const BASE58_CHARS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function generateShortCode(length = 7): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * BASE58_CHARS.length);
    result += BASE58_CHARS[randomIndex];
  }
  return result;
}

export const create = mutation({
  args: {
    organizationId: v.string(),
    name: v.string(),
    type: v.string(), // "STATIC" | "DYNAMIC"
    destinationUrl: v.optional(v.string()),
    designConfig: v.optional(v.string()),
    folderId: v.optional(v.string()),
    campaignId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireOrgRole(ctx, args.organizationId, [
      "OWNER",
      "ADMIN",
      "EDITOR",
    ]);

    const now = Date.now();

    // Generate unique shortCode
    let shortCode = "";
    for (let attempts = 0; attempts < 5; attempts++) {
      const candidate = generateShortCode();
      const existing = await ctx.db
        .query("qrCodes")
        .withIndex("by_shortCode", (q) => q.eq("shortCode", candidate))
        .first();
      if (!existing) {
        shortCode = candidate;
        break;
      }
    }

    if (!shortCode) {
      throw new Error("Failed to generate unique shortCode; please retry");
    }

    const qrId = await ctx.db.insert("qrCodes", {
      organizationId: args.organizationId,
      createdBy: identity.subject,
      name: args.name,
      type: args.type,
      shortCode,
      status: "ACTIVE",
      folderId: args.folderId,
      campaignId: args.campaignId,
      createdAt: now,
      updatedAt: now,
    });

    let currentDestinationId: string | undefined = undefined;
    if (args.destinationUrl) {
      const validUrl = validateDestinationUrl(args.destinationUrl);
      const destId = await ctx.db.insert("qrDestinations", {
        qrId: qrId,
        url: validUrl,
        version: 1,
        isCurrent: true,
        createdBy: identity.subject,
        createdAt: now,
      });
      currentDestinationId = destId;
      await ctx.db.patch(qrId, { currentDestinationId: destId });
    }

    if (args.designConfig) {
      const designId = await ctx.db.insert("qrDesigns", {
        qrId: qrId,
        version: 1,
        config: args.designConfig,
        createdAt: now,
      });
      await ctx.db.patch(qrId, { designId: designId });
    }

    await logActivity(ctx, {
      organizationId: args.organizationId,
      userId: identity.subject,
      qrId: qrId,
      action: "QR_CREATED",
      metadata: { name: args.name, type: args.type, shortCode },
    });

    return { qrId, shortCode };
  },
});

export const list = query({
  args: {
    organizationId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, args.organizationId, [
      "OWNER",
      "ADMIN",
      "EDITOR",
      "ANALYST",
      "VIEWER",
    ]);

    const qrList = await ctx.db
      .query("qrCodes")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .take(args.limit || 50);

    // Filter active and soft-deleted items
    const nonDeleted = qrList.filter((item) => !item.deletedAt);

    // Hydrate current destinations
    const results = await Promise.all(
      nonDeleted.map(async (qr) => {
        let destinationUrl = "";
        if (qr.currentDestinationId) {
          const dest = await ctx.db
            .query("qrDestinations")
            .withIndex("by_qr_and_current", (q) =>
              q.eq("qrId", qr._id).eq("isCurrent", true)
            )
            .first();
          if (dest) destinationUrl = dest.url;
        }
        return {
          ...qr,
          destinationUrl,
        };
      })
    );

    return results;
  },
});

export const getById = query({
  args: {
    qrId: v.id("qrCodes"),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, args.organizationId, [
      "OWNER",
      "ADMIN",
      "EDITOR",
      "ANALYST",
      "VIEWER",
    ]);

    const qr = await ctx.db.get(args.qrId);
    if (!qr || qr.deletedAt || qr.organizationId !== args.organizationId) {
      return null;
    }

    const currentDestination = await ctx.db
      .query("qrDestinations")
      .withIndex("by_qr_and_current", (q) =>
        q.eq("qrId", qr._id).eq("isCurrent", true)
      )
      .first();

    const currentDesign = await ctx.db
      .query("qrDesigns")
      .withIndex("by_qr", (q) => q.eq("qrId", qr._id))
      .order("desc")
      .first();

    return {
      ...qr,
      currentDestination,
      currentDesign,
    };
  },
});

// Public resolver lookup query (authoritative fallback when Redis cache misses)
export const getByShortCode = query({
  args: { shortCode: v.string() },
  handler: async (ctx, args) => {
    const qr = await ctx.db
      .query("qrCodes")
      .withIndex("by_shortCode", (q) => q.eq("shortCode", args.shortCode))
      .first();

    if (!qr || qr.deletedAt) {
      return null;
    }

    let destinationUrl: string | null = null;
    let version = 1;

    const currentDest = await ctx.db
      .query("qrDestinations")
      .withIndex("by_qr_and_current", (q) =>
        q.eq("qrId", qr._id).eq("isCurrent", true)
      )
      .first();

    if (currentDest) {
      destinationUrl = currentDest.url;
      version = currentDest.version;
    }

    return {
      qrId: qr._id,
      organizationId: qr.organizationId,
      name: qr.name,
      status: qr.status,
      destinationUrl,
      version,
    };
  },
});

export const updateStatus = mutation({
  args: {
    qrId: v.id("qrCodes"),
    organizationId: v.string(),
    status: v.string(), // "ACTIVE" | "PAUSED" | "ARCHIVED"
  },
  handler: async (ctx, args) => {
    const { identity } = await requireOrgRole(ctx, args.organizationId, [
      "OWNER",
      "ADMIN",
      "EDITOR",
    ]);

    const qr = await ctx.db.get(args.qrId);
    if (!qr) throw new Error("QR not found");
    if (qr.organizationId !== args.organizationId) {
      throw new Error("FORBIDDEN: QR code does not belong to organization");
    }

    await ctx.db.patch(args.qrId, {
      status: args.status,
      updatedAt: Date.now(),
      archivedAt: args.status === "ARCHIVED" ? Date.now() : undefined,
    });

    await logActivity(ctx, {
      organizationId: args.organizationId,
      userId: identity.subject,
      qrId: args.qrId,
      action: "QR_STATUS_UPDATED",
      metadata: { previous: qr.status, current: args.status },
    });

    return { ok: true };
  },
});

export const archive = mutation({
  args: {
    qrId: v.id("qrCodes"),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireOrgRole(ctx, args.organizationId, [
      "OWNER",
      "ADMIN",
    ]);

    const qr = await ctx.db.get(args.qrId);
    if (!qr) throw new Error("QR not found");
    if (qr.organizationId !== args.organizationId) {
      throw new Error("FORBIDDEN: QR code does not belong to organization");
    }

    const now = Date.now();
    await ctx.db.patch(args.qrId, {
      status: "ARCHIVED",
      archivedAt: now,
      deletedAt: now,
      updatedAt: now,
    });

    await logActivity(ctx, {
      organizationId: args.organizationId,
      userId: identity.subject,
      qrId: args.qrId,
      action: "QR_ARCHIVED",
    });

    return { ok: true };
  },
});
