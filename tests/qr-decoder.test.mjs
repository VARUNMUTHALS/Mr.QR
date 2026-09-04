import jsQR from "jsqr";
import QRCode from "qrcode";
import sharp from "sharp";

async function verifyQrDecoding() {
  console.log("==========================================");
  console.log("  TEST: AUTOMATED QR DECODER VERIFICATION ");
  console.log("==========================================");

  // Test Case 1: Dynamic QR Code Invariant
  // Dynamic QR MUST encode only https://<domain>/q/{shortCode}, NEVER the raw destination!
  const shortCode = "8F72KX92";
  const dynamicPayload = `https://qr.studio/q/${shortCode}`;

  console.log(`[Test 1] Generating dynamic QR with payload: ${dynamicPayload}`);
  const dynamicPngBuffer = await QRCode.toBuffer(dynamicPayload, {
    errorCorrectionLevel: "H",
    margin: 4,
    width: 400,
  });

  const dynamicRaw = await sharp(dynamicPngBuffer)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const dynamicDecoded = jsQR(
    new Uint8ClampedArray(dynamicRaw.data),
    dynamicRaw.info.width,
    dynamicRaw.info.height
  );

  if (!dynamicDecoded || dynamicDecoded.data !== dynamicPayload) {
    throw new Error(
      `FAILED: Dynamic QR decoding mismatch! Expected: "${dynamicPayload}", Got: "${dynamicDecoded?.data}"`
    );
  }
  console.log(`✓ PASS: Dynamic QR decoded payload matches exactly: "${dynamicDecoded.data}"`);

  // Test Case 2: Static QR Code
  const staticPayload = "WIFI:T:WPA;S:StudioGuest;P:SecretPaper2026;;";
  console.log(`[Test 2] Generating static QR with payload: ${staticPayload}`);
  const staticPngBuffer = await QRCode.toBuffer(staticPayload, {
    errorCorrectionLevel: "M",
    margin: 4,
    width: 400,
  });

  const staticRaw = await sharp(staticPngBuffer)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const staticDecoded = jsQR(
    new Uint8ClampedArray(staticRaw.data),
    staticRaw.info.width,
    staticRaw.info.height
  );

  if (!staticDecoded || staticDecoded.data !== staticPayload) {
    throw new Error(
      `FAILED: Static QR decoding mismatch! Expected: "${staticPayload}", Got: "${staticDecoded?.data}"`
    );
  }
  console.log(`✓ PASS: Static QR decoded payload matches exactly: "${staticDecoded.data}"`);

  console.log("==========================================");
  console.log("  ALL QR DECODER TESTS PASSED SUCCESSFULLY ");
  console.log("==========================================");
}

verifyQrDecoding().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
