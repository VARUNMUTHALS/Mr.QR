import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOrgRole } from "./helpers/ownership";

export const getQrAnalytics = query({
  args: {
    qrId: v.string(),
    organizationId: v.string(),
    startDate: v.optional(v.string()), // "YYYY-MM-DD"
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOrgRole(ctx, args.organizationId, [
      "OWNER",
      "ADMIN",
      "EDITOR",
      "ANALYST",
      "VIEWER",
    ]);

    // Query pre-aggregated daily stats
    const dailyStats = await ctx.db
      .query("scanDailyStats")
      .withIndex("by_qr_and_date", (q) => q.eq("qrId", args.qrId))
      .order("asc")
      .collect();

    // Sum totals
    let totalScans = 0;
    let uniqueVisitors = 0;
    let mobileScans = 0;
    let desktopScans = 0;

    const countriesMap: Record<string, number> = {};
    const browsersMap: Record<string, number> = {};
    const osMap: Record<string, number> = {};
    const timeline: Array<{ date: string; scans: number; uniqueVisitors: number }> = [];

    for (const day of dailyStats) {
      if (args.startDate && day.date < args.startDate) continue;
      if (args.endDate && day.date > args.endDate) continue;

      totalScans += day.totalScans;
      uniqueVisitors += day.uniqueVisitors;
      mobileScans += day.mobileScans;
      desktopScans += day.desktopScans;

      timeline.push({
        date: day.date,
        scans: day.totalScans,
        uniqueVisitors: day.uniqueVisitors,
      });

      // Parse JSON rollups safely
      try {
        const c = JSON.parse(day.topCountries);
        for (const [k, val] of Object.entries(c)) {
          countriesMap[k] = (countriesMap[k] || 0) + Number(val);
        }
      } catch {}

      try {
        const b = JSON.parse(day.topBrowsers);
        for (const [k, val] of Object.entries(b)) {
          browsersMap[k] = (browsersMap[k] || 0) + Number(val);
        }
      } catch {}

      try {
        const o = JSON.parse(day.topOS);
        for (const [k, val] of Object.entries(o)) {
          osMap[k] = (osMap[k] || 0) + Number(val);
        }
      } catch {}
    }

    return {
      totalScans,
      uniqueVisitors,
      mobileScans,
      desktopScans,
      countries: Object.entries(countriesMap).map(([name, count]) => ({ name, count })),
      browsers: Object.entries(browsersMap).map(([name, count]) => ({ name, count })),
      operatingSystems: Object.entries(osMap).map(([name, count]) => ({ name, count })),
      timeline,
    };
  },
});

export const upsertDailyStats = mutation({
  args: {
    organizationId: v.string(),
    qrId: v.string(),
    date: v.string(),
    totalScans: v.number(),
    uniqueVisitors: v.number(),
    mobileScans: v.number(),
    desktopScans: v.number(),
    topCountries: v.string(),
    topCities: v.string(),
    topBrowsers: v.string(),
    topOS: v.string(),
    topReferrers: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("scanDailyStats")
      .withIndex("by_qr_and_date", (q) =>
        q.eq("qrId", args.qrId).eq("date", args.date)
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        totalScans: existing.totalScans + args.totalScans,
        uniqueVisitors: existing.uniqueVisitors + args.uniqueVisitors,
        mobileScans: existing.mobileScans + args.mobileScans,
        desktopScans: existing.desktopScans + args.desktopScans,
        topCountries: args.topCountries,
        topCities: args.topCities,
        topBrowsers: args.topBrowsers,
        topOS: args.topOS,
        topReferrers: args.topReferrers,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("scanDailyStats", {
      ...args,
      updatedAt: now,
    });
  },
});
