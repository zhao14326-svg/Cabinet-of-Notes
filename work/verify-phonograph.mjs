import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleIssues = [];
page.on('console', (message) => {
  if (message.type() === 'error' || message.type() === 'warning') {
    consoleIssues.push(`${message.type()}: ${message.text()}`);
  }
});
page.on('pageerror', (error) => consoleIssues.push(`pageerror: ${error.message}`));

await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__cabinetState?.introComplete && window.__phonographModel, null, { timeout: 12000 });

const geometry = await page.evaluate(async () => {
  const THREE = await import('/src/vendor/three.module.js');
  const model = window.__phonographModel;
  const modelBounds = new THREE.Box3().setFromObject(model);
  const modelCenter = modelBounds.getCenter(new THREE.Vector3());
  const cabinet = window.__cabinetDebug.importedCabinet;
  const shelves = [];
  cabinet.traverse((node) => {
    if (!node.isMesh || !/^Box(?:002|003|014|015|018|019|022|023|026|027)$/.test(node.name)) return;
    const bounds = new THREE.Box3().setFromObject(node);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    shelves.push({ name: node.name, top: bounds.max.y, center: center.toArray(), size: size.toArray(), xDistance: Math.abs(center.x - modelCenter.x) });
  });
  const shelf = shelves
    .filter((item) => item.top <= modelCenter.y)
    .sort((a, b) => a.xDistance - b.xDistance || b.top - a.top)[0];
  const anchor = model.parent;
  const projected = anchor.getWorldPosition(new THREE.Vector3()).project(window.__camera);
  const rect = document.querySelector('#scene').getBoundingClientRect();
  return {
    modelBottom: modelBounds.min.y,
    modelCenter: modelCenter.toArray(),
    shelves,
    shelf,
    gap: shelf ? modelBounds.min.y - shelf.top : null,
    click: {
      x: rect.left + ((projected.x + 1) / 2) * rect.width,
      y: rect.top + ((1 - projected.y) / 2) * rect.height,
    },
  };
});

await page.mouse.click(geometry.click.x, geometry.click.y);
await page.waitForSelector('.detail-panel.is-open');
const panelTitle = await page.locator('#panel-content h2').textContent();
console.log(JSON.stringify({
  url: page.url(),
  title: await page.title(),
  panelTitle,
  geometry,
  consoleIssues,
}, null, 2));

await browser.close();
