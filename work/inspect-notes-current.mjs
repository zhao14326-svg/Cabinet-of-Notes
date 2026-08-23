import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__cabinetState?.introComplete && window.__notesClipboard);

const result = await page.evaluate(async () => {
  const THREE = await import('/src/vendor/three.module.js');
  const { importedDoorAssembly, importedDoorPivot } = window.__cabinetDebug;
  const clipboard = window.__notesClipboard;
  const getBounds = (object, space) => {
    const world = new THREE.Box3().setFromObject(object);
    const local = new THREE.Box3().makeEmpty();
    for (const x of [world.min.x, world.max.x]) for (const y of [world.min.y, world.max.y]) for (const z of [world.min.z, world.max.z]) {
      local.expandByPoint(space.worldToLocal(new THREE.Vector3(x, y, z)));
    }
    return { min: local.min.toArray(), max: local.max.toArray(), center: local.getCenter(new THREE.Vector3()).toArray() };
  };
  const getExactBounds = (object, space) => {
    const inverse = new THREE.Matrix4().copy(space.matrixWorld).invert();
    const transform = new THREE.Matrix4();
    const point = new THREE.Vector3();
    const bounds = new THREE.Box3().makeEmpty();
    object.traverse((node) => {
      if (!node.isMesh) return;
      node.geometry.computeBoundingBox();
      const source = node.geometry.boundingBox;
      transform.multiplyMatrices(inverse, node.matrixWorld);
      for (const x of [source.min.x, source.max.x]) for (const y of [source.min.y, source.max.y]) for (const z of [source.min.z, source.max.z]) {
        bounds.expandByPoint(point.set(x, y, z).applyMatrix4(transform));
      }
    });
    return { min: bounds.min.toArray(), max: bounds.max.toArray(), center: bounds.getCenter(new THREE.Vector3()).toArray() };
  };
  importedDoorPivot.updateMatrixWorld(true);
  return {
    door: getBounds(importedDoorAssembly, importedDoorPivot),
    exactDoor: getExactBounds(importedDoorAssembly, importedDoorPivot),
    exactDoorMesh: getExactBounds(importedDoorAssembly.getObjectByName('Box024') || importedDoorAssembly, importedDoorPivot),
    clipboard: getBounds(clipboard, importedDoorPivot),
    exactClipboard: getExactBounds(clipboard, importedDoorPivot),
    anchor: clipboard.parent.position.toArray(),
    clipboardPosition: clipboard.position.toArray(),
    screenPoint: (() => {
      const point = clipboard.parent.getWorldPosition(new THREE.Vector3()).project(window.__camera);
      const rect = document.querySelector('#scene').getBoundingClientRect();
      return {
        x: rect.left + ((point.x + 1) / 2) * rect.width,
        y: rect.top + ((1 - point.y) / 2) * rect.height,
      };
    })(),
  };
});

await page.mouse.click(result.screenPoint.x, result.screenPoint.y);
await page.waitForSelector('.detail-panel.is-open');
result.panelTitle = await page.locator('#panel-content h2').textContent();
await page.screenshot({ path: 'work/notes-current.png' });
console.log(JSON.stringify(result, null, 2));
await browser.close();
