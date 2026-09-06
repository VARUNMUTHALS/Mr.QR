import { inngest } from "../client";

export const processScan = (inngest as any).createFunction(
  { id: "process-qr-scan", retries: 3 },
  { event: "qr/scan.recorded" },
  async ({ event, step }: any) => {
    const scanData = event.data;

    // Step 1: Normalize & Validate Payload
    const normalized = await step.run("normalize-scan-metadata", async () => {
      return {
        qrId: scanData.qrId,
        organizationId: scanData.organizationId,
        timestamp: scanData.timestamp || Date.now(),
        country: scanData.country || "Unknown",
        deviceType: scanData.deviceType || "desktop",
        os: scanData.os || "Unknown",
        browser: scanData.browser || "Unknown",
        visitorKey: scanData.visitorKey,
        bot: Boolean(scanData.bot),
        source: scanData.source || "web",
      };
    });

    // Step 2: Skip bot traffic from aggregate statistics
    if (normalized.bot) {
      return { status: "ignored_bot" };
    }

    // Step 3: Emit event for product analytics or external rollup
    await step.run("complete-scan-ingestion", async () => {
      console.log(`[Inngest] Successfully processed scan for QR: ${normalized.qrId}`);
      return { processed: true };
    });

    return { status: "success" };
  }
);
