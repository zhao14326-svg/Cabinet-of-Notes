import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const issues = [];
page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') issues.push(`console: ${message.text()}`);
});

await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__workFileBox, null, { timeout: 12000 });
const preIntroVisibility = await page.evaluate(() => ({
  introComplete: window.__cabinetState?.introComplete,
  visible: window.__workFileBox.visible,
}));
await page.waitForFunction(() => window.__cabinetState?.introComplete, null, { timeout: 12000 });
await page.waitForTimeout(1800);

const geometry = await page.evaluate(async () => {
  const THREE = await import('/src/vendor/three.module.js');
  const model = window.__workFileBox;
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const anchorLocalCenter = model.parent.worldToLocal(center.clone());
  const modelParent = model.parent;
  modelParent.remove(model);
  model.updateMatrixWorld(true);
  const detachedBounds = new THREE.Box3().setFromObject(model);
  modelParent.add(model);
  model.updateMatrixWorld(true);
  const cabinet = window.__cabinetDebug.importedCabinet;
  const cabinetBounds = new THREE.Box3().setFromObject(cabinet);
  const lowerShelf = cabinet.getObjectByName('Box023');
  const shelfBounds = new THREE.Box3().setFromObject(lowerShelf);
  const hierarchy = [];
  let current = model;
  while (current) {
    hierarchy.push({ name: current.name, position: current.position.toArray(), scale: current.scale.toArray() });
    current = current.parent;
  }
  const meshBounds = [];
  const modelMeshes = [];
  model.traverse((node) => {
    if (!node.isMesh || modelMeshes.length >= 8) return;
    const nodeBounds = new THREE.Box3().setFromObject(node);
    modelMeshes.push({ name: node.name, position: node.position.toArray(), scale: node.scale.toArray(), size: nodeBounds.getSize(new THREE.Vector3()).toArray() });
  });
  cabinet.traverse((node) => {
    if (!node.isMesh) return;
    const nodeBounds = new THREE.Box3().setFromObject(node);
    const nodeSize = nodeBounds.getSize(new THREE.Vector3());
    const nodeCenter = nodeBounds.getCenter(new THREE.Vector3());
    if (nodeSize.y < 0.25 && Math.abs(nodeCenter.x - center.x) < 1.0) {
      meshBounds.push({ name: node.name, center: nodeCenter.toArray(), size: nodeSize.toArray(), top: nodeBounds.max.y });
    }
  });
  const projected = center.clone().project(window.__camera);
  const rect = document.querySelector('#scene').getBoundingClientRect();
  return {
    localPosition: model.position.toArray(),
    hierarchy,
    meshBounds,
    modelMeshes,
    worldCenter: center.toArray(),
    cabinetBottom: cabinetBounds.min.y,
    floorY: -2.7,
    anchorLocalCenter: anchorLocalCenter.toArray(),
    detachedCenter: detachedBounds.getCenter(new THREE.Vector3()).toArray(),
    detachedSize: detachedBounds.getSize(new THREE.Vector3()).toArray(),
    worldSize: bounds.getSize(new THREE.Vector3()).toArray(),
    bottom: bounds.min.y,
    shelfTop: shelfBounds.max.y,
    bottomGap: bounds.min.y - shelfBounds.max.y,
    projected: {
      x: rect.left + ((projected.x + 1) / 2) * rect.width,
      y: rect.top + ((1 - projected.y) / 2) * rect.height,
    },
  };
});

await page.screenshot({ path: 'C:/Users/赵杰/Documents/Codex/2026-08-21/11/outputs/work-file-box-adjusted-home.png' });
await page.mouse.click(geometry.projected.x, geometry.projected.y);
let panelTitle = null;
try {
  await page.waitForSelector('.detail-panel.is-open', { timeout: 5000 });
  panelTitle = await page.locator('#panel-content h2').textContent();
} catch {
  issues.push('file-box center click did not open the Work panel');
}
await page.screenshot({ path: 'C:/Users/赵杰/Documents/Codex/2026-08-21/11/outputs/work-file-box-adjusted.png' });

console.log(JSON.stringify({
  preIntroVisibility,
  geometry,
  panelTitle,
  issues,
}, null, 2));

await browser.close();
