import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, executablePath: chromium.executablePath() });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:4175/?refresh=28', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__cabinetState?.introComplete);
await page.getByRole('button', { name: '作品' }).click();
await page.waitForSelector('.portfolio-player');
await page.waitForTimeout(1500);

const before = await page.evaluate(() => {
  const player = document.querySelector('.portfolio-player');
  const folder = player.querySelector('.portfolio-folder.is-active');
  const box = player.querySelector('.portfolio-file-box');
  return { title: player.querySelector('.portfolio-copy h2').textContent, folderTop: folder.getBoundingClientRect().top, box: box.getBoundingClientRect().toJSON() };
});
await page.locator('[data-portfolio-direction="1"]').click();
await page.waitForTimeout(100);
const leaving = await page.evaluate(() => {
  const player = document.querySelector('.portfolio-player');
  const folder = player.querySelector('.portfolio-folder.is-active');
  const style = getComputedStyle(folder);
  return { classes: player.className, matches: player.matches('.portfolio-player.is-transition-out.is-next'), activeMatches: folder.matches('.portfolio-folder.is-active'), opacity: style.opacity, transform: style.transform, translate: style.translate, transition: style.transition, inline: folder.style.cssText };
});
await page.waitForTimeout(520);
const after = await page.evaluate(() => {
  const player = document.querySelector('.portfolio-player');
  const folder = player.querySelector('.portfolio-folder.is-active');
  const box = player.querySelector('.portfolio-file-box');
  return { title: player.querySelector('.portfolio-copy h2').textContent, folderTop: folder.getBoundingClientRect().top, box: box.getBoundingClientRect().toJSON(), classes: player.className };
});
const boxDelta = Math.hypot(after.box.top - before.box.top, after.box.left - before.box.left);
console.log(JSON.stringify({ before, leaving, after, boxDelta, boxStable: boxDelta < 2 }, null, 2));
await browser.close();
