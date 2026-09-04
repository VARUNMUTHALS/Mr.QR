import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');

// 1. Favicon SVG (32x32 crisp view)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="7" fill="#141312" />
  
  <!-- Finder Top-Left -->
  <rect x="4" y="4" width="8" height="8" rx="2" fill="none" stroke="#E27344" stroke-width="1.6" />
  <rect x="6.5" y="6.5" width="3" height="3" rx="0.8" fill="#E27344" />
  
  <!-- Finder Top-Right -->
  <rect x="20" y="4" width="8" height="8" rx="2" fill="none" stroke="#E27344" stroke-width="1.6" />
  <rect x="22.5" y="6.5" width="3" height="3" rx="0.8" fill="#E27344" />
  
  <!-- Finder Bottom-Left -->
  <rect x="4" y="20" width="8" height="8" rx="2" fill="none" stroke="#E27344" stroke-width="1.6" />
  <rect x="6.5" y="22.5" width="3" height="3" rx="0.8" fill="#E27344" />
  
  <!-- Matrix Accents -->
  <rect x="14.5" y="5" width="2" height="2" rx="0.5" fill="#F5EFE6" opacity="0.9" />
  <rect x="14.5" y="8.5" width="2" height="2" rx="0.5" fill="#E27344" opacity="0.9" />
  <rect x="21" y="15" width="2" height="2" rx="0.5" fill="#F5EFE6" opacity="0.85" />
  <rect x="25" y="18" width="2" height="2" rx="0.5" fill="#E27344" opacity="0.85" />
  <rect x="21" y="22" width="2" height="2" rx="0.5" fill="#F5EFE6" opacity="0.85" />
  <rect x="25" y="25" width="2" height="2" rx="0.5" fill="#E27344" opacity="0.85" />

  <!-- Gentleman Glasses -->
  <!-- Left Lens -->
  <circle cx="11.5" cy="14.5" r="3.2" fill="none" stroke="#F5EFE6" stroke-width="1.3" />
  <circle cx="10.8" cy="13.8" r="0.8" fill="#F5EFE6" opacity="0.7" />
  <!-- Right Lens -->
  <circle cx="19.5" cy="14.5" r="3.2" fill="none" stroke="#F5EFE6" stroke-width="1.3" />
  <circle cx="18.8" cy="13.8" r="0.8" fill="#F5EFE6" opacity="0.7" />
  <!-- Bridge -->
  <path d="M 14.7 14.2 Q 15.5 13.2 16.3 14.2" fill="none" stroke="#F5EFE6" stroke-width="1.2" stroke-linecap="round" />

  <!-- Bowtie -->
  <polygon points="12,22 14.8,23.3 12,24.6" fill="#E27344" />
  <polygon points="19,22 16.2,23.3 19,24.6" fill="#E27344" />
  <rect x="14.5" y="22.3" width="2" height="2" rx="0.5" fill="#F5EFE6" />
</svg>`;

// 2. Full Square Logo Emblem SVG (128x128)
const logoMarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1C1A"/>
      <stop offset="100%" stop-color="#11100F"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E97746"/>
      <stop offset="100%" stop-color="#C85A32"/>
    </linearGradient>
  </defs>

  <!-- Background rounded canvas -->
  <rect width="128" height="128" rx="28" fill="url(#bgGrad)" stroke="#2D2926" stroke-width="2" />
  
  <!-- Outer Finder 1: Top-Left -->
  <rect x="18" y="18" width="30" height="30" rx="7" fill="none" stroke="url(#accentGrad)" stroke-width="5" />
  <rect x="27" y="27" width="12" height="12" rx="3" fill="url(#accentGrad)" />

  <!-- Outer Finder 2: Top-Right -->
  <rect x="80" y="18" width="30" height="30" rx="7" fill="none" stroke="url(#accentGrad)" stroke-width="5" />
  <rect x="89" y="27" width="12" height="12" rx="3" fill="url(#accentGrad)" />

  <!-- Outer Finder 3: Bottom-Left -->
  <rect x="18" y="80" width="30" height="30" rx="7" fill="none" stroke="url(#accentGrad)" stroke-width="5" />
  <rect x="27" y="89" width="12" height="12" rx="3" fill="url(#accentGrad)" />

  <!-- Data Matrix modules -->
  <rect x="58" y="20" width="7" height="7" rx="2" fill="#F5EFE6" opacity="0.9" />
  <rect x="58" y="32" width="7" height="7" rx="2" fill="url(#accentGrad)" opacity="0.9" />
  <rect x="68" y="26" width="7" height="7" rx="2" fill="#F5EFE6" opacity="0.8" />
  <rect x="84" y="58" width="7" height="7" rx="2" fill="#F5EFE6" opacity="0.9" />
  <rect x="98" y="68" width="7" height="7" rx="2" fill="url(#accentGrad)" opacity="0.9" />
  <rect x="84" y="84" width="7" height="7" rx="2" fill="#F5EFE6" opacity="0.8" />
  <rect x="98" y="98" width="7" height="7" rx="2" fill="url(#accentGrad)" opacity="0.8" />

  <!-- Gentleman Signature Glasses -->
  <!-- Left Eye Frame -->
  <circle cx="48" cy="58" r="13" fill="none" stroke="#F5EFE6" stroke-width="4.5" />
  <circle cx="45" cy="54" r="3" fill="#F5EFE6" opacity="0.75" />
  
  <!-- Right Eye Frame -->
  <circle cx="80" cy="58" r="13" fill="none" stroke="#F5EFE6" stroke-width="4.5" />
  <circle cx="77" cy="54" r="3" fill="#F5EFE6" opacity="0.75" />
  
  <!-- Glasses Bridge -->
  <path d="M 61 57 Q 64 53 67 57" fill="none" stroke="#F5EFE6" stroke-width="4" stroke-linecap="round" />

  <!-- Bowtie Feature -->
  <!-- Left Wing -->
  <polygon points="50,88 61,93.5 50,99" fill="url(#accentGrad)" />
  <!-- Right Wing -->
  <polygon points="78,88 67,93.5 78,99" fill="url(#accentGrad)" />
  <!-- Knot -->
  <rect x="60.5" y="89" width="7" height="9" rx="2" fill="#F5EFE6" />
</svg>`;

// 3. Horizontal Banner Logo SVG (300x72) with Emblem + Typography
const logoBannerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 72" width="300" height="72">
  <defs>
    <linearGradient id="gradAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E97746"/>
      <stop offset="100%" stop-color="#C85A32"/>
    </linearGradient>
  </defs>

  <!-- Left Icon Emblem (60x60 centered) -->
  <g transform="translate(6, 6)">
    <rect width="60" height="60" rx="14" fill="#161514" stroke="#2B2724" stroke-width="1.5" />
    
    <!-- Top-Left Finder -->
    <rect x="8" y="8" width="14" height="14" rx="3.5" fill="none" stroke="url(#gradAccent)" stroke-width="2.5" />
    <rect x="12" y="12" width="6" height="6" rx="1.5" fill="url(#gradAccent)" />

    <!-- Top-Right Finder -->
    <rect x="38" y="8" width="14" height="14" rx="3.5" fill="none" stroke="url(#gradAccent)" stroke-width="2.5" />
    <rect x="42" y="12" width="6" height="6" rx="1.5" fill="url(#gradAccent)" />

    <!-- Bottom-Left Finder -->
    <rect x="8" y="38" width="14" height="14" rx="3.5" fill="none" stroke="url(#gradAccent)" stroke-width="2.5" />
    <rect x="12" y="42" width="6" height="6" rx="1.5" fill="url(#gradAccent)" />

    <!-- Glasses & Bowtie -->
    <circle cx="23" cy="27" r="6" fill="none" stroke="#F5EFE6" stroke-width="2" />
    <circle cx="37" cy="27" r="6" fill="none" stroke="#F5EFE6" stroke-width="2" />
    <path d="M 29 26.5 Q 30 24.5 31 26.5" fill="none" stroke="#F5EFE6" stroke-width="1.8" stroke-linecap="round" />

    <polygon points="23.5,41 28.5,43.5 23.5,46" fill="url(#gradAccent)" />
    <polygon points="36.5,41 31.5,43.5 36.5,46" fill="url(#gradAccent)" />
    <rect x="28.5" y="41.5" width="3" height="4" rx="1" fill="#F5EFE6" />
  </g>

  <!-- Typography -->
  <g transform="translate(80, 0)">
    <!-- "Mr." in editorial serif style -->
    <text x="0" y="43" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, serif" font-weight="700" font-size="34" letter-spacing="-0.5px" fill="#1C1917">
      Mr.
    </text>
    <!-- "QR" in bold terracotta accent -->
    <text x="56" y="43" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="34" letter-spacing="1.5px" fill="url(#gradAccent)">
      QR
    </text>
    <!-- Tagline / Subtitle -->
    <text x="2" y="58" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="9" letter-spacing="3.5px" fill="#8C827A">
      DYNAMIC QR STUDIO
    </text>
  </g>
</svg>`;

async function main() {
  // Write SVG files
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), logoBannerSvg, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'logo-mark.svg'), logoMarkSvg, 'utf8');
  console.log('✓ Written SVG brand assets (favicon.svg, logo.svg, logo-mark.svg)');

  // Generate PNG favicon 32x32 & 48x48
  const faviconBuffer = Buffer.from(faviconSvg);
  await sharp(faviconBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  
  await sharp(faviconBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  // Generate Apple Touch Icon 180x180
  const logoMarkBuffer = Buffer.from(logoMarkSvg);
  await sharp(logoMarkBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Generate High-Res App Icon 512x512
  await sharp(logoMarkBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  console.log('✓ Generated raster icons (favicon.ico, favicon-32x32.png, apple-touch-icon.png, icon-512.png)');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
