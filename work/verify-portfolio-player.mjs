import { chromium } from 'playwright';

async function run(viewport, output) {
  const browser = await chromium.launch({ headless: true, executablePath: chromium.executablePath() });
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__cabinetState?.introComplete);
  await page.getByRole('button', { name: '作品' }).click();
  await page.waitForSelector('.portfolio-player');
  const first = await page.locator('.portfolio-copy h2').textContent();
  const folderCount = await page.locator('.portfolio-folder').count();
  await page.locator('[data-portfolio-direction="1"]').click();
  await page.waitForTimeout(520);
  const second = await page.locator('.portfolio-copy h2').textContent();
  await page.evaluate(() => {
    const panel = document.querySelector('#panel-content');
    panel.dispatchEvent(new WheelEvent('wheel', { deltaY: 160, bubbles: true, cancelable: true }));
    panel.dispatchEvent(new WheelEvent('wheel', { deltaY: 160, bubbles: true, cancelable: true }));
    panel.dispatchEvent(new WheelEvent('wheel', { deltaY: 160, bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(520);
  const third = await page.locator('.portfolio-copy h2').textContent();
  await page.screenshot({ path: output });
  const result = {
    viewport,
    first,
    second,
    third,
    folderCount,
    panelClass: await page.locator('.detail-panel').getAttribute('class'),
    errors,
  };
  await browser.close();
  return result;
}

console.log(JSON.stringify({
  desktop: await run({ width: 1440, height: 900 }, 'C:/Users/赵杰/Documents/Codex/2026-08-21/11/outputs/portfolio-player-desktop.png'),
  mobile: await run({ width: 390, height: 844 }, 'C:/Users/赵杰/Documents/Codex/2026-08-21/11/outputs/portfolio-player-mobile.png'),
}, null, 2));
