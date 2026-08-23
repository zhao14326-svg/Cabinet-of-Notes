import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:4174/?v=56', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__cabinetState?.introComplete, null, { timeout: 15000 });
await page.getByRole('button', { name: '作品' }).click();
await page.locator('.portfolio-title-link').click();
await page.waitForSelector('.portfolio-detail');
await page.waitForTimeout(1200);
const images = await page.locator('.portfolio-gallery-item img').evaluateAll((elements) => elements.map((image) => ({
  src: image.currentSrc || image.src,
  alt: image.alt,
  width: image.naturalWidth,
  height: image.naturalHeight,
})));
console.log(JSON.stringify(images, null, 2));
await browser.close();
process.exit(0);
