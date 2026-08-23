import { chromium } from 'playwright';

async function run(viewport, output) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__cabinetState?.introComplete);
  await page.getByRole('button', { name: '能力' }).click();
  await page.waitForSelector('.skills-player');
  const first = await page.locator('.skill-copy h2').textContent();
  await page.locator('[data-skill-direction="1"]').click();
  await page.waitForTimeout(450);
  const second = await page.locator('.skill-copy h2').textContent();
  await page.locator('.skills-player').dispatchEvent('wheel', { deltaY: 100 });
  await page.waitForTimeout(700);
  const third = await page.locator('.skill-copy h2').textContent();
  await page.screenshot({ path: output });
  const result = { viewport, first, second, third, panelClass: await page.locator('.detail-panel').getAttribute('class'), errors };
  await browser.close();
  return result;
}

console.log(JSON.stringify({
  desktop: await run({ width: 1440, height: 900 }, 'C:/Users/赵杰/Documents/Codex/2026-08-21/11/outputs/skills-player-desktop.png'),
  mobile: await run({ width: 390, height: 844 }, 'C:/Users/赵杰/Documents/Codex/2026-08-21/11/outputs/skills-player-mobile.png'),
}, null, 2));
