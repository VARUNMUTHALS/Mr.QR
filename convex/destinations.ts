import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOrgRole } from "./helpers/ownership";
import { validateDestinationUrl } from "./helpers/validation";
import { logActivity } from "./helpers/audit";

export const update = mutation({
  args: {
    qrId: v.id("qrCodes"),
    organizationId: v.string(),
    newUrl: v.string(),
    changeReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireOrgRole(ctx, args.organizationId, [
      "OWNER",
      "ADMIN",
      "EDITOR",
    ]);

    const validUrl = validateDestinationUrl(args.newUrl);

    // Find latest version number
    const destinations = await ctx.db
      .query("qrDestinations")
      .withIndex("by_qr", (q) => q.eq("qrId", args.qrId))
      .order("desc")
      .collect();

    let nextVersion = 1;
    for (const d of destinations) {
      if (d.version >= nextVersion) {
        nextVersion = d.version + 1;
      }
      if (d.isCurrent) {
        await ctx.db.patch(d._id, { isCurrent: false });
      }
    }

    const now = Date.now();
    const newDestId = await ctx.db.insert("qrDestinations", {
      qrId: args.qrId,
      url: validUrl,
      version: nextVersion,
      isCurrent: true,
      createdBy: identity.subject,
      changeReason: args.changeReason,
      createdAt: now,
    });

    await ctx.db.patch(args.qrId, {
      currentDestinationId: newDestId,
      updatedAt: now,
    });

    await logActivity(ctx, {
      organizationId: args.organizationId,
      userId: identity.subject,
      qrId: args.qrId,
      action: "DESTINATION_UPDATED",
      metadata: {
        newUrl: validUrl,
        version: nextVersion,
        changeReason: args.changeReason,
      },
    });

    return {
      destinationId: newDestId,
      version: nextVersion,
      url: validUrl,
    };
  },
});

export const listVersions = query({
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

    return await ctx.db
      .query("qrDestinations")
      .withIndex("by_qr", (q) => q.eq("qrId", args.qrId))
      .order("desc")
      .collect();
  },
});

export const restoreVersion = mutation({
  args: {
    qrId: v.id("qrCodes"),
    organizationId: v.string(),
    targetVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireOrgRole(ctx, args.organizationId, [
      "OWNER",
      "ADMIN",
      "EDITOR",
    ]);

    const target = await ctx.db
      .query("qrDestinations")
      .withIndex("by_qr_and_version", (q) =>
        q.eq("qrId", args.qrId).eq("version", args.targetVersion)
      )
      .first();

    if (!target) {
      throw new Error(`Version ${args.targetVersion} not found`);
    }

    // Determine next version number (Restoring v1 creates new version v4)
    const all = await ctx.db
      .query("qrDestinations")
      .withIndex("by_qr", (q) => q.eq("qrId", args.qrId))
      .order("desc")
      .collect();

    let maxVersion = 1;
    for (const d of all) {
      if (d.version > maxVersion) maxVersion = d.version;
      if (d.isCurrent) {
        await ctx.db.patch(d._id, { isCurrent: false });
      }
    }

    const nextVersion = maxVersion + 1;
    const now = Date.now();

    const restoredDestId = await ctx.db.insert("qrDestinations", {
      qrId: args.qrId,
      url: target.url,
      version: nextVersion,
      isCurrent: true,
      createdBy: identity.subject,
      changeReason: `Restored from version ${args.targetVersion}`,
      createdAt: now,
    });

    await ctx.db.patch(args.qrId, {
      currentDestinationId: restoredDestId,
      updatedAt: now,
    });

    await logActivity(ctx, {
      organizationId: args.organizationId,
      userId: identity.subject,
      qrId: args.qrId,
      action: "DESTINATION_RESTORED",
      metadata: {
        restoredFromVersion: args.targetVersion,
        newVersion: nextVersion,
        url: target.url,
      },
    });

    return {
      destinationId: restoredDestId,
      version: nextVersion,
      url: target.url,
    };
  },
});
