// Build a correct metallic map from basecolor-2k.webp.
// The shipped metallic-2k.webp is solid white, which renders the gemstones as
// metal (no diffuse → black diamond on dark backgrounds). Classify each texel:
// warm saturated gold → metallic, anything else (diamonds, colored stones) → dielectric.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sharp = require('d:/سایت جواهر فروشی/.tools/node_modules/sharp');

const SRC = 'd:/سایت جواهر فروشی/site_assets/3d ring 1/source/textures/basecolor-2k.webp';
const OUT = 'd:/سایت جواهر فروشی/site_assets/3d ring 1/source/textures/metallic-fixed.webp';

const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

const out = Buffer.alloc(width * height);
for (let i = 0; i < width * height; i++) {
  const r = data[i * channels], g = data[i * channels + 1], b = data[i * channels + 2];
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;

  // Hue in degrees (only meaningful when saturated)
  let hue = 0;
  if (max !== min) {
    if (max === r) hue = (60 * (g - b)) / (max - min);
    else if (max === g) hue = 120 + (60 * (b - r)) / (max - min);
    else hue = 240 + (60 * (r - g)) / (max - min);
    if (hue < 0) hue += 360;
  }

  // Gold band: warm hue (yellow/orange/brown), some saturation.
  // Dark crevices (low max) also belong to the band — keep them metal.
  const isGold = (hue >= 15 && hue <= 75 && sat >= 0.2) || max < 60;
  out[i] = isGold ? 255 : 0;
}

// Slight blur softens the metal/dielectric boundary so edges don't shimmer
await sharp(out, { raw: { width, height, channels: 1 } })
  .blur(1.2)
  .webp({ quality: 90 })
  .toFile(OUT);

console.log('Wrote', OUT, `${width}x${height}`);
