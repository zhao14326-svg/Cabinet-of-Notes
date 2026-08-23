import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
await page.goto('http://127.0.0.1:4175/?csscheck=1', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__cabinetState?.introComplete);
await page.getByRole('button', { name: '作品' }).click();
await page.waitForSelector('.portfolio-player');
const styles = await page.evaluate(() => {
  const pick = (selector) => {
    const node = document.querySelector(selector);
    if (!node) return null;
    const style = getComputedStyle(node);
    return { display: style.display, gridTemplateColumns: style.gridTemplateColumns, width: style.width, height: style.height, padding: style.padding, color: style.color };
  };
  return { panel: pick('.detail-panel'), player: pick('.portfolio-player'), fileBox: pick('.portfolio-file-box'), body: pick('body') };
});
await page.screenshot({ path: 'C:/Users/赵杰/Documents/Codex/2026-08-21/11/outputs/portfolio-css-check.png' });
console.log(JSON.stringify({ styles, errors }, null, 2));
await browser.close();
