import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, executablePath: chromium.executablePath() });
const page = await browser.newPage({ viewport: { width: 930, height: 1024 } });
await page.goto('http://127.0.0.1:4175/?refresh=29', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__cabinetState?.introComplete);
await page.getByRole('button', { name: '作品' }).click();
await page.waitForSelector('.portfolio-player');
await page.waitForTimeout(1200);
await page.screenshot({ path: 'C:/Users/赵杰/Documents/Codex/2026-08-21/11/outputs/portfolio-player-930.png' });
console.log(JSON.stringify({ box: await page.locator('.portfolio-file-box').count(), folders: await page.locator('.portfolio-folder').count(), tabText: await page.locator('.portfolio-folder-tab').allTextContents(), errors: [] }));
await browser.close();
