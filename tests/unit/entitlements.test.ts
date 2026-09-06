import { describe, it, expect } from "vitest";
import {
  getPlanLimits,
  canCreateQr,
  canExportAnalytics,
  canUseCustomDomain,
} from "../../src/lib/billing/entitlements";

describe("Billing Entitlements", () => {
  it("enforces Free plan limits", () => {
    const limits = getPlanLimits("FREE");
    expect(limits.maxQrCodes).toBe(5);
    expect(limits.customDomains).toBe(false);
    expect(limits.exports).toBe(false);

    expect(canCreateQr("FREE", 4)).toBe(true);
    expect(canCreateQr("FREE", 5)).toBe(false);
    expect(canExportAnalytics("FREE")).toBe(false);
  });

  it("enforces Pro plan limits", () => {
    const limits = getPlanLimits("PRO");
    expect(limits.maxQrCodes).toBe(100);
    expect(limits.customDomains).toBe(true);
    expect(limits.exports).toBe(true);

    expect(canCreateQr("PRO", 50)).toBe(true);
    expect(canCreateQr("PRO", 100)).toBe(false);
    expect(canExportAnalytics("PRO")).toBe(true);
    expect(canUseCustomDomain("PRO")).toBe(true);
  });

  it("enforces Enterprise unlimited capabilities", () => {
    const limits = getPlanLimits("ENTERPRISE");
    expect(limits.maxQrCodes).toBe(Infinity);
    expect(canCreateQr("ENTERPRISE", 99999)).toBe(true);
  });
});
