import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(15000);
await page.goto('http://127.0.0.1:4174/?v=55', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__notesClipboard && window.__cabinetDebug?.importedDoorPivot);

const samples = [];
for (let index = 0; index < 8; index += 1) {
  samples.push(await page.evaluate(async () => {
    const THREE = await import('/src/vendor/three.module.js');
    const clipboard = window.__notesClipboard;
    const pivot = window.__cabinetDebug.importedDoorPivot;
    const door = window.__cabinetDebug.importedDoorAssembly;
    const exactBounds = (object) => {
      object.updateMatrixWorld(true);
      pivot.updateMatrixWorld(true);
      const inverse = new THREE.Matrix4().copy(pivot.matrixWorld).invert();
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
      return bounds;
    };
    const doorBounds = exactBounds(door);
    const clipboardBounds = exactBounds(clipboard);
    return {
      scale: clipboard.scale.toArray(),
      anchorScale: clipboard.parent.scale.toArray(),
      localZ: clipboard.position.z,
      width: clipboardBounds.max.x - clipboardBounds.min.x,
      gap: doorBounds.min.z - clipboardBounds.max.z,
    };
  }));
  await page.waitForTimeout(250);
}

const widths = samples.map((sample) => sample.width);
const gaps = samples.map((sample) => sample.gap);
const scaleKeys = new Set(samples.map((sample) => sample.scale.map((value) => value.toFixed(8)).join(',')));
const anchorScaleKeys = new Set(samples.map((sample) => sample.anchorScale.map((value) => value.toFixed(8)).join(',')));

assert.equal(scaleKeys.size, 1, 'clipboard scale changed during the door animation');
assert.equal(anchorScaleKeys.size, 1, 'clipboard anchor scale changed during the door animation');
assert.ok(samples.every((sample) => Math.abs(sample.localZ) < 1e-8), 'clipboard moved away from its mount');
assert.ok(Math.max(...widths) - Math.min(...widths) < 1e-7, 'clipboard width changed during the door animation');
assert.ok(Math.max(...gaps) - Math.min(...gaps) < 1e-7, 'clipboard contact gap changed during the door animation');
assert.ok(Math.abs(gaps.at(-1) - 0.0015) < 1e-6, 'clipboard is not flush with the door');

console.log(JSON.stringify({
  sampleCount: samples.length,
  width: widths.at(-1),
  gap: gaps.at(-1),
  scale: samples.at(-1).scale,
  anchorScale: samples.at(-1).anchorScale,
  stable: true,
}, null, 2));
} finally {
  await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 2000))]);
}
process.exit(0);
