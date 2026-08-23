import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, executablePath: chromium.executablePath() });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__cabinetState?.introComplete);
await page.getByRole('button', { name: '作品' }).click();
await page.waitForSelector('.portfolio-player');
await page.waitForTimeout(1500);

const before = await page.evaluate(() => {
  const folder = document.querySelector('.portfolio-folder.is-active');
  const box = document.querySelector('.portfolio-file-box');
  return { folderTop: folder.getBoundingClientRect().top, boxTop: box.getBoundingClientRect().top, boxLeft: box.getBoundingClientRect().left, transform: folder.style.transform, computed: getComputedStyle(folder).transform };
});
await page.evaluate(() => document.querySelector('#panel-content').dispatchEvent(new WheelEvent('wheel', { deltaY: 40, bubbles: true, cancelable: true })));
await page.waitForTimeout(300);
const during = await page.evaluate(() => {
  const folder = document.querySelector('.portfolio-folder.is-active');
  const box = document.querySelector('.portfolio-file-box');
  return { folderTop: folder.getBoundingClientRect().top, boxTop: box.getBoundingClientRect().top, boxLeft: box.getBoundingClientRect().left, transform: folder.style.transform, computed: getComputedStyle(folder).transform };
});
const boxDelta = Math.hypot(during.boxTop - before.boxTop, during.boxLeft - before.boxLeft);
console.log(JSON.stringify({ before, during, folderMovedVertically: Math.abs(during.folderTop - before.folderTop) > 0.5, boxDelta, boxStable: boxDelta < 2 }, null, 2));
await browser.close();
