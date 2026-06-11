import { createRequire } from 'module';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/DigiPlus/AppData/Local/Temp/puppeteer-test/node_modules/puppeteer-core');

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:/Users/DigiPlus/.cache/puppeteer/chrome-headless-shell/win64-149.0.7827.22/chrome-headless-shell-win64/chrome-headless-shell.exe';
const OUT_DIR = join(__dirname, 'temporary screenshots');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';
const scrollY = parseInt(process.argv[4] || '0', 10);
const vpWidth = parseInt(process.argv[5] || '1440', 10);
const vpHeight = parseInt(process.argv[6] || '900', 10);

const existing = existsSync(OUT_DIR) ? readdirSync(OUT_DIR).filter(f => f.endsWith('.png')) : [];
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || 0)).filter(Boolean);
const n = nums.length ? Math.max(...nums) + 1 : 1;
const filename = `screenshot-${n}${label}.png`;
const outPath = join(OUT_DIR, filename);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
});

const page = await browser.newPage();
await page.setViewport({ width: vpWidth, height: vpHeight, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
await new Promise(r => setTimeout(r, 9000));
if (scrollY > 0) {
  // Step-scroll in a few large steps so GSAP scrub/reveal animations trigger
  await page.evaluate(async (target) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const end = Math.min(target, max);
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      window.scrollTo(0, (end / steps) * i);
      await new Promise(r => setTimeout(r, 120));
    }
  }, scrollY);
  await new Promise(r => setTimeout(r, 3000));
}
await page.screenshot({ path: outPath, fullPage: false });
await browser.close();

console.log(`Screenshot saved: temporary screenshots/${filename}`);
