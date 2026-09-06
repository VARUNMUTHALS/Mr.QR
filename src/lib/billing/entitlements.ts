export type PlanTier = "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE";

export interface PlanLimits {
  tier: PlanTier;
  maxQrCodes: number;
  maxScansPerMonth: number;
  analyticsRetentionDays: number;
  customDomains: boolean;
  removeBranding: boolean;
  exports: boolean;
  apiAccess: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  FREE: {
    tier: "FREE",
    maxQrCodes: 5,
    maxScansPerMonth: 1_000,
    analyticsRetentionDays: 30,
    customDomains: false,
    removeBranding: false,
    exports: false,
    apiAccess: false,
  },
  PRO: {
    tier: "PRO",
    maxQrCodes: 100,
    maxScansPerMonth: 50_000,
    analyticsRetentionDays: 365,
    customDomains: true,
    removeBranding: true,
    exports: true,
    apiAccess: false,
  },
  BUSINESS: {
    tier: "BUSINESS",
    maxQrCodes: 1_000,
    maxScansPerMonth: 500_000,
    analyticsRetentionDays: 730,
    customDomains: true,
    removeBranding: true,
    exports: true,
    apiAccess: true,
  },
  ENTERPRISE: {
    tier: "ENTERPRISE",
    maxQrCodes: Infinity,
    maxScansPerMonth: Infinity,
    analyticsRetentionDays: 3650,
    customDomains: true,
    removeBranding: true,
    exports: true,
    apiAccess: true,
  },
};

export function getPlanLimits(planName?: string): PlanLimits {
  const normalized = (planName || "FREE").toUpperCase() as PlanTier;
  return PLAN_LIMITS[normalized] || PLAN_LIMITS.FREE;
}

export function canCreateQr(planName: string, currentQrCount: number): boolean {
  const limits = getPlanLimits(planName);
  return currentQrCount < limits.maxQrCodes;
}

export function canExportAnalytics(planName: string): boolean {
  return getPlanLimits(planName).exports;
}

export function canUseCustomDomain(planName: string): boolean {
  return getPlanLimits(planName).customDomains;
}
