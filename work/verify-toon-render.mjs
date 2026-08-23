import assert from 'node:assert/strict';

const { default: playwright } = await import('file:///C:/Users/%E8%B5%B5%E6%9D%B0/AppData/Local/OpenAI/Codex/runtimes/cua_node/cd454f7c85348168/bin/node_modules/playwright/index.js');
const browser = await playwright.chromium.launch({ headless: true, executablePath: 'C:/Users/赵杰/AppData/Local/ms-playwright/chromium-1187/chrome-win/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.goto('http://127.0.0.1:4174/?v=70', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__cabinetState?.introComplete);
await page.waitForFunction(() => window.__cabinetDebug?.importedCabinet);
await page.waitForTimeout(900);
const data = await page.evaluate(() => {
  const debug = window.__cabinetDebug;
  let outlineMeshes = 0;
  let cabinetMeshes = 0;
  debug.importedCabinet.traverse((node) => {
    if (!node.isMesh) return;
    cabinetMeshes += 1;
    if (node.userData.toonOutline) outlineMeshes += 1;
  });
  return {
    outlineMeshes,
    cabinetMeshes,
    devicePixelRatio: window.devicePixelRatio,
    canvasWidth: document.querySelector('#scene').width,
    canvasHeight: document.querySelector('#scene').height,
  };
});
await page.screenshot({ path: 'work/portfolio-toon-v70.png' });
assert.ok(data.outlineMeshes > 0);
assert.ok(data.outlineMeshes >= 40);
assert.ok(data.outlineMeshes < data.cabinetMeshes);
assert.deepEqual(errors, []);
console.log(JSON.stringify({ data, errors }, null, 2));
await browser.close();
