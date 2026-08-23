import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__cabinetState?.introComplete && window.__cabinetDebug?.importedDoorPivot);

const start = await page.evaluate(async () => {
  let notes = null;
  window.__cabinetDebug.importedCabinet.traverse((node) => {
    if (node.userData?.id === 'notes') notes = node;
  });
  const point = notes.getWorldPosition(notes.position.clone()).project(window.__camera);
  const rect = document.querySelector('#scene').getBoundingClientRect();
  return {
    x: rect.left + ((point.x + 1) / 2) * rect.width,
    y: rect.top + ((1 - point.y) / 2) * rect.height,
  };
});

await page.mouse.move(start.x, start.y);
await page.mouse.down();
await page.mouse.move(start.x + 500, start.y - 350, { steps: 12 });
await page.mouse.up();

const result = await page.evaluate(async () => {
  let notes = null;
  let staticCubeCount = 0;
  window.__cabinetDebug.importedCabinet.traverse((node) => {
    if (node.userData?.id === 'notes') notes = node;
    if (node.name === 'door-cube-static') staticCubeCount += 1;
  });
  const worldScale = notes.getWorldScale(notes.position.clone());
  const limits = notes.userData.dragBounds;
  return {
    staticCubeCount,
    parentName: notes.parent.name,
    worldSize: worldScale.multiplyScalar(0.26).toArray(),
    localPosition: notes.position.toArray(),
    limits,
    insideBounds:
      notes.position.x >= limits.minX && notes.position.x <= limits.maxX
      && notes.position.y >= limits.minY && notes.position.y <= limits.maxY
      && Math.abs(notes.position.z - limits.z) < 1e-6,
  };
});

console.log(JSON.stringify(result, null, 2));
await page.screenshot({ path: 'work/notes-drag-fixed.png' });
await browser.close();
