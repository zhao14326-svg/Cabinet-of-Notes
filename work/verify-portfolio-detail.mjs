import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

await page.goto('http://127.0.0.1:4174/?v=56', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__cabinetState?.introComplete);
await page.getByRole('button', { name: '作品' }).click();
await page.waitForSelector('.portfolio-player');

const firstTitle = await page.locator('.portfolio-copy h2').textContent();
const firstImageCount = await page.locator('.portfolio-folder.is-active .portfolio-folder-preview').count();
await page.locator('.portfolio-copy h2 button').click();
await page.waitForSelector('.portfolio-detail');
const firstDetailTitle = await page.locator('.portfolio-detail-intro h2').textContent();
const firstGalleryCount = await page.locator('.portfolio-gallery-item').count();
await page.locator('[data-portfolio-back]').click();
await page.waitForSelector('.portfolio-player');
await page.locator('[data-portfolio-direction="1"]').click();
await page.waitForTimeout(560);
const secondTitle = await page.locator('.portfolio-copy h2').textContent();
await page.locator('.portfolio-stage').click();
await page.waitForSelector('.portfolio-detail');
const secondDetailTitle = await page.locator('.portfolio-detail-intro h2').textContent();
await page.screenshot({ path: 'work/portfolio-detail.png' });

assert.equal(firstDetailTitle, firstTitle);
assert.ok(firstImageCount > 0);
assert.ok(firstGalleryCount > 0);
assert.notEqual(secondTitle, firstTitle);
assert.equal(secondDetailTitle, secondTitle);
assert.deepEqual(errors, []);

console.log(JSON.stringify({ firstTitle, firstDetailTitle, secondTitle, secondDetailTitle, errors }, null, 2));
await browser.close();
