import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__cabinetState?.introComplete && window.__doorCube);

const result = await page.evaluate(async () => {
  const THREE = await import('/src/vendor/three.module.js');
  const notes = [...document.defaultView.__cabinetDebug.importedCabinet.children]
    .flatMap(() => []);
  const noteObject = (() => {
    let found = null;
    window.__cabinetDebug.importedCabinet.traverse((node) => {
      if (node.userData?.id === 'notes') found = node;
    });
    return found;
  })();
  const bounds = (object) => {
    const box = new THREE.Box3().setFromObject(object);
    return {
      min: box.min.toArray(),
      max: box.max.toArray(),
      size: box.getSize(new THREE.Vector3()).toArray(),
      center: box.getCenter(new THREE.Vector3()).toArray(),
    };
  };
  const worldScale = (object) => object.getWorldScale(new THREE.Vector3()).toArray();
  const boundsInSpace = (object, space) => {
    object.updateMatrixWorld(true);
    space.updateMatrixWorld(true);
    const inverse = new THREE.Matrix4().copy(space.matrixWorld).invert();
    const matrix = new THREE.Matrix4();
    const box = new THREE.Box3().makeEmpty();
    const point = new THREE.Vector3();
    object.traverse((node) => {
      if (!node.isMesh) return;
      node.geometry.computeBoundingBox();
      const local = node.geometry.boundingBox;
      matrix.multiplyMatrices(inverse, node.matrixWorld);
      for (const x of [local.min.x, local.max.x]) for (const y of [local.min.y, local.max.y]) for (const z of [local.min.z, local.max.z]) {
        box.expandByPoint(point.set(x, y, z).applyMatrix4(matrix));
      }
    });
    return { min: box.min.toArray(), max: box.max.toArray(), size: box.getSize(new THREE.Vector3()).toArray() };
  };
  return {
    doorCube: {
      parent: window.__doorCube.parent?.name,
      localPosition: window.__doorCube.position.toArray(),
      worldScale: worldScale(window.__doorCube),
      bounds: bounds(window.__doorCube),
    },
    notes: {
      parent: noteObject?.parent?.name,
      localPosition: noteObject?.position.toArray(),
      worldScale: noteObject ? worldScale(noteObject) : null,
      bounds: noteObject ? bounds(noteObject) : null,
      saved: localStorage.getItem('cabinet-tiles'),
    },
    doorInPivot: boundsInSpace(window.__cabinetDebug.importedDoorAssembly, window.__cabinetDebug.importedDoorPivot),
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
