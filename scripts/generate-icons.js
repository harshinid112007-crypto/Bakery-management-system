import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Standard Brand SVG (for favicon and direct SVG rendering)
const brandSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1917"/>
      <stop offset="100%" stop-color="#292524"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="wheatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#d97706" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background rounded squircle -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <rect width="504" height="504" x="4" y="4" rx="108" fill="none" stroke="#d97706" stroke-width="4" stroke-opacity="0.3"/>

  <!-- Artisan Sourdough / Loaf Motif -->
  <g filter="url(#glow)">
    <!-- Main Loaf Body -->
    <path d="M 120 280 C 120 200, 180 150, 256 150 C 332 150, 392 200, 392 280 C 392 340, 332 370, 256 370 C 180 370, 120 340, 120 280 Z" fill="url(#goldGrad)"/>
    
    <!-- Scored Crust / Ear Highlights -->
    <path d="M 170 230 C 210 180, 300 180, 340 230" fill="none" stroke="#fef3c7" stroke-width="14" stroke-linecap="round"/>
    <path d="M 195 270 C 230 240, 280 240, 315 270" fill="none" stroke="#fef3c7" stroke-width="12" stroke-linecap="round"/>
    <path d="M 220 310 C 240 295, 270 295, 290 310" fill="none" stroke="#fef3c7" stroke-width="10" stroke-linecap="round"/>
    
    <!-- Flour dusting speckles -->
    <circle cx="210" cy="205" r="4" fill="#ffffff" opacity="0.8"/>
    <circle cx="240" cy="180" r="3" fill="#ffffff" opacity="0.8"/>
    <circle cx="270" cy="185" r="4.5" fill="#ffffff" opacity="0.8"/>
    <circle cx="300" cy="210" r="3.5" fill="#ffffff" opacity="0.8"/>
    <circle cx="256" cy="235" r="3" fill="#ffffff" opacity="0.7"/>
  </g>

  <!-- Wheat stalk accents on sides -->
  <g stroke="url(#wheatGrad)" stroke-width="6" stroke-linecap="round" fill="none">
    <!-- Center top wheat stem -->
    <path d="M 256 80 L 256 130"/>
    <path d="M 256 95 C 244 85, 236 90, 240 105 C 244 115, 256 112, 256 112"/>
    <path d="M 256 95 C 268 85, 276 90, 272 105 C 268 115, 256 112, 256 112"/>
    <path d="M 256 115 C 242 105, 234 110, 238 125 C 242 135, 256 132, 256 132"/>
    <path d="M 256 115 C 270 105, 278 110, 274 125 C 270 135, 256 132, 256 132"/>
  </g>

  <!-- Tiny bakery text badge -->
  <text x="256" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" fill="#fef3c7" text-anchor="middle" letter-spacing="4">BAKERY OPS</text>
</svg>`;

// 2. Maskable SVG with 20% safe zone padding & solid full-bleed background for Android squircles
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="mBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1917"/>
      <stop offset="100%" stop-color="#292524"/>
    </linearGradient>
    <linearGradient id="mGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="mWheatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <filter id="mGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#d97706" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Full-bleed background for maskable adaptive clipping -->
  <rect width="512" height="512" fill="url(#mBgGrad)"/>

  <!-- Centered within 75% safe area (x:64 to 448, y:64 to 448) -->
  <g transform="translate(51, 46) scale(0.8)">
    <g filter="url(#mGlow)">
      <!-- Main Loaf Body -->
      <path d="M 120 280 C 120 200, 180 150, 256 150 C 332 150, 392 200, 392 280 C 392 340, 332 370, 256 370 C 180 370, 120 340, 120 280 Z" fill="url(#mGoldGrad)"/>
      
      <!-- Scored Crust / Ear Highlights -->
      <path d="M 170 230 C 210 180, 300 180, 340 230" fill="none" stroke="#fef3c7" stroke-width="14" stroke-linecap="round"/>
      <path d="M 195 270 C 230 240, 280 240, 315 270" fill="none" stroke="#fef3c7" stroke-width="12" stroke-linecap="round"/>
      <path d="M 220 310 C 240 295, 270 295, 290 310" fill="none" stroke="#fef3c7" stroke-width="10" stroke-linecap="round"/>
      
      <!-- Flour dusting speckles -->
      <circle cx="210" cy="205" r="4" fill="#ffffff" opacity="0.8"/>
      <circle cx="240" cy="180" r="3" fill="#ffffff" opacity="0.8"/>
      <circle cx="270" cy="185" r="4.5" fill="#ffffff" opacity="0.8"/>
      <circle cx="300" cy="210" r="3.5" fill="#ffffff" opacity="0.8"/>
      <circle cx="256" cy="235" r="3" fill="#ffffff" opacity="0.7"/>
    </g>

    <!-- Wheat stalk accents -->
    <g stroke="url(#mWheatGrad)" stroke-width="6" stroke-linecap="round" fill="none">
      <path d="M 256 80 L 256 130"/>
      <path d="M 256 95 C 244 85, 236 90, 240 105 C 244 115, 256 112, 256 112"/>
      <path d="M 256 95 C 268 85, 276 90, 272 105 C 268 115, 256 112, 256 112"/>
      <path d="M 256 115 C 242 105, 234 110, 238 125 C 242 135, 256 132, 256 132"/>
      <path d="M 256 115 C 270 105, 278 110, 274 125 C 270 135, 256 132, 256 132"/>
    </g>

    <text x="256" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" fill="#fef3c7" text-anchor="middle" letter-spacing="4">BAKERY OPS</text>
  </g>
</svg>`;

async function run() {
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), brandSvg, 'utf8');
  console.log('Created public/icon.svg');

  const brandBuffer = Buffer.from(brandSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  // 1. pwa-192x192.png
  await sharp(brandBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created public/pwa-192x192.png');

  // 2. pwa-512x512.png
  await sharp(brandBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created public/pwa-512x512.png');

  // 3. pwa-maskable-512x512.png
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created public/pwa-maskable-512x512.png');

  // 4. apple-touch-icon.png (180x180)
  await sharp(brandBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created public/apple-touch-icon.png');

  // 5. favicon-32x32.png and favicon.ico
  await sharp(brandBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('Created public/favicon-32x32.png');

  console.log('All PWA icons generated successfully!');
}

run().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
