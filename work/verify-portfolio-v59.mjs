import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

await page.goto('http://127.0.0.1:4174/?v=59', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__cabinetState?.introComplete);
await page.getByRole('button', { name: '作品' }).click();
await page.waitForSelector('.portfolio-player');

const playerBefore = await page.evaluate(() => ({
  title: document.querySelector('.portfolio-title-link').textContent,
  folderImages: document.querySelectorAll('.portfolio-folder img').length,
  folderCount: document.querySelectorAll('.portfolio-folder').length,
}));
await page.screenshot({ path: 'work/portfolio-v59-folders.png' });

await page.locator('[data-portfolio-direction="1"]').click();
await page.waitForTimeout(70);
const motion = await page.evaluate(() => {
  const player = document.querySelector('.portfolio-player');
  const copyStyle = getComputedStyle(player.querySelector('.portfolio-copy'));
  const folderStyle = getComputedStyle(player.querySelector('.portfolio-folder.is-active'));
  return { filter: copyStyle.filter, folderFilter: folderStyle.filter, classes: player.className };
});
await page.waitForTimeout(360);
const playerAfterTitle = await page.locator('.portfolio-title-link').textContent();

await page.locator('.portfolio-title-link').click();
await page.waitForSelector('.portfolio-detail');
const typography = await page.evaluate(() => ({
  root: getComputedStyle(document.documentElement).fontFamily,
  detail: getComputedStyle(document.querySelector('.portfolio-detail')).fontFamily,
  heading: getComputedStyle(document.querySelector('.portfolio-detail-intro h2')).fontFamily,
}));
await page.screenshot({ path: 'work/portfolio-v59-detail.png' });

await page.locator('.portfolio-detail-art[data-portfolio-image="0"]').click();
await page.waitForSelector('#portfolio-lightbox[aria-hidden="false"]');
const lightboxBefore = await page.locator('.portfolio-lightbox-name').textContent();
await page.screenshot({ path: 'work/portfolio-v59-lightbox.png' });
await page.locator('[data-lightbox-direction="1"]').click();
const lightboxAfter = await page.locator('.portfolio-lightbox-name').textContent();
await page.keyboard.press('Escape');
const lightboxClosed = await page.locator('#portfolio-lightbox').getAttribute('aria-hidden');

assert.equal(playerBefore.folderImages, 0);
assert.equal(playerBefore.folderCount, 3);
assert.notEqual(playerAfterTitle, playerBefore.title);
assert.equal(motion.filter, 'none');
assert.equal(motion.folderFilter, 'none');
assert.equal(typography.detail, typography.root);
assert.equal(typography.heading, typography.root);
assert.notEqual(lightboxAfter, lightboxBefore);
assert.equal(lightboxClosed, 'true');
assert.deepEqual(errors, []);

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
mobile.setDefaultTimeout(20000);
await mobile.goto('http://127.0.0.1:4174/?v=59-mobile', { waitUntil: 'networkidle' });
await mobile.waitForFunction(() => window.__cabinetState?.introComplete);
await mobile.getByRole('button', { name: '作品' }).click();
await mobile.waitForSelector('.portfolio-player');
await mobile.locator('.portfolio-title-link').click();
await mobile.waitForSelector('.portfolio-detail');
await mobile.locator('.portfolio-detail-art[data-portfolio-image="0"]').click();
await mobile.waitForSelector('#portfolio-lightbox[aria-hidden="false"]');
const mobileLayout = await mobile.evaluate(() => {
  const viewport = document.documentElement.clientWidth;
  const image = document.querySelector('.portfolio-lightbox-image').getBoundingClientRect();
  const previous = document.querySelector('.portfolio-lightbox-prev').getBoundingClientRect();
  const next = document.querySelector('.portfolio-lightbox-next').getBoundingClientRect();
  return {
    viewport,
    imageInside: image.left >= 0 && image.right <= viewport,
    controlsInside: previous.left >= 0 && next.right <= viewport,
  };
});
await mobile.screenshot({ path: 'work/portfolio-v59-mobile-lightbox.png' });
assert.equal(mobileLayout.imageInside, true);
assert.equal(mobileLayout.controlsInside, true);

console.log(JSON.stringify({ playerBefore, playerAfterTitle, motion, typography, lightboxBefore, lightboxAfter, lightboxClosed, mobileLayout, errors }, null, 2));
await browser.close();
