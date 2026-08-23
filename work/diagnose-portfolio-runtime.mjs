import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('pageerror', (error) => console.log(`PAGEERROR: ${error.stack || error.message}`));
page.on('console', (message) => { if (message.type() === 'error') console.log(`CONSOLE: ${message.text()}`); });
await page.goto('http://127.0.0.1:4174/?v=56', { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.waitForTimeout(3000);
console.log(await page.locator('body').innerText());
await browser.close();
