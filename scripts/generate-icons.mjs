import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Icon sizes for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Apple splash screen sizes (width x height)
const splashScreens = [
  { width: 2048, height: 2732, name: 'apple-splash-2048-2732.png' }, // 12.9" iPad Pro
  { width: 1668, height: 2388, name: 'apple-splash-1668-2388.png' }, // 11" iPad Pro
  { width: 1536, height: 2048, name: 'apple-splash-1536-2048.png' }, // 9.7" iPad
  { width: 1668, height: 2224, name: 'apple-splash-1668-2224.png' }, // 10.5" iPad Pro
  { width: 1620, height: 2160, name: 'apple-splash-1620-2160.png' }, // 10.2" iPad
  { width: 1290, height: 2796, name: 'apple-splash-1290-2796.png' }, // iPhone 15 Pro Max
  { width: 1179, height: 2556, name: 'apple-splash-1179-2556.png' }, // iPhone 15 Pro
  { width: 1170, height: 2532, name: 'apple-splash-1170-2532.png' }, // iPhone 14
  { width: 1125, height: 2436, name: 'apple-splash-1125-2436.png' }, // iPhone X/XS
  { width: 1242, height: 2688, name: 'apple-splash-1242-2688.png' }, // iPhone XS Max
  { width: 828, height: 1792, name: 'apple-splash-828-1792.png' },   // iPhone XR
  { width: 1080, height: 1920, name: 'apple-splash-1080-1920.png' }, // iPhone 8 Plus
  { width: 750, height: 1334, name: 'apple-splash-750-1334.png' },   // iPhone 8
];

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#18181b"/>
      <stop offset="100%" style="stop-color:#27272a"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <g transform="translate(96, 96)">
    <rect x="40" y="80" width="240" height="180" rx="20" fill="#fafafa" opacity="0.95"/>
    <path d="M40 120 L40 100 Q40 80 60 80 L260 80 Q280 80 280 100 L280 120 Q240 140 160 140 Q80 140 40 120Z" fill="#e4e4e7"/>
    <rect x="70" y="130" width="100" height="8" rx="4" fill="#a1a1aa"/>
    <rect x="70" y="150" width="70" height="8" rx="4" fill="#d4d4d8"/>
    <text x="160" y="210" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="600" fill="#18181b" text-anchor="middle">$</text>
    <circle cx="260" cy="60" r="24" fill="#fafafa"/>
    <path d="M260 44 L263 56 L275 56 L265 64 L268 76 L260 68 L252 76 L255 64 L245 56 L257 56Z" fill="#18181b"/>
  </g>
</svg>`;

// Maskable icon (with safe area padding)
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#18181b"/>
      <stop offset="100%" style="stop-color:#27272a"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(128, 128) scale(0.5)">
    <rect x="40" y="80" width="240" height="180" rx="20" fill="#fafafa" opacity="0.95"/>
    <path d="M40 120 L40 100 Q40 80 60 80 L260 80 Q280 80 280 100 L280 120 Q240 140 160 140 Q80 140 40 120Z" fill="#e4e4e7"/>
    <rect x="70" y="130" width="100" height="8" rx="4" fill="#a1a1aa"/>
    <rect x="70" y="150" width="70" height="8" rx="4" fill="#d4d4d8"/>
    <text x="160" y="210" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="600" fill="#18181b" text-anchor="middle">$</text>
    <circle cx="260" cy="60" r="24" fill="#fafafa"/>
    <path d="M260 44 L263 56 L275 56 L265 64 L268 76 L260 68 L252 76 L255 64 L245 56 L257 56Z" fill="#18181b"/>
  </g>
</svg>`;

async function generateIcons() {
  console.log('Generating PWA icons...');

  // Create icons directory
  const iconsDir = join(publicDir, 'icons');
  await mkdir(iconsDir, { recursive: true });

  // Generate standard icons
  for (const size of iconSizes) {
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Created: icons/icon-${size}x${size}.png`);
  }

  // Generate maskable icons
  for (const size of iconSizes) {
    const outputPath = join(iconsDir, `icon-maskable-${size}x${size}.png`);
    await sharp(Buffer.from(svgMaskable))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Created: icons/icon-maskable-${size}x${size}.png`);
  }

  // Generate Apple touch icon
  const appleTouchPath = join(publicDir, 'apple-touch-icon.png');
  await sharp(Buffer.from(svgIcon))
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath);
  console.log('Created: apple-touch-icon.png');

  // Generate favicon
  const faviconPath = join(publicDir, 'favicon.ico');
  await sharp(Buffer.from(svgIcon))
    .resize(32, 32)
    .toFormat('png')
    .toFile(join(publicDir, 'favicon-32x32.png'));
  console.log('Created: favicon-32x32.png');

  await sharp(Buffer.from(svgIcon))
    .resize(16, 16)
    .toFormat('png')
    .toFile(join(publicDir, 'favicon-16x16.png'));
  console.log('Created: favicon-16x16.png');

  // Generate splash screens
  console.log('\nGenerating splash screens...');
  const splashDir = join(publicDir, 'splash');
  await mkdir(splashDir, { recursive: true });

  for (const screen of splashScreens) {
    const iconSize = Math.min(screen.width, screen.height) * 0.25;

    // Create splash screen with centered icon
    const splash = await sharp({
      create: {
        width: screen.width,
        height: screen.height,
        channels: 4,
        background: { r: 24, g: 24, b: 27, alpha: 1 } // #18181b
      }
    })
    .composite([{
      input: await sharp(Buffer.from(svgIcon))
        .resize(Math.round(iconSize), Math.round(iconSize))
        .toBuffer(),
      gravity: 'center'
    }])
    .png()
    .toFile(join(splashDir, screen.name));

    console.log(`Created: splash/${screen.name}`);
  }

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
