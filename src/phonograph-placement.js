import * as THREE from 'three';

export function fitObjectToAnchor(object, {
  targetWidth,
  shelfY = 0,
  centerX = 0,
  centerZ = 0,
  anchor = null,
} = {}) {
  object.updateMatrixWorld(true);
  const sourceBounds = getBoundsInAnchor(object, anchor);
  const sourceSize = sourceBounds.getSize(new THREE.Vector3());
  if (!Number.isFinite(targetWidth) || targetWidth <= 0) {
    throw new Error('targetWidth must be a positive number');
  }
  if (sourceSize.x <= 0) throw new Error('Cannot fit an object with zero width');

  object.scale.multiplyScalar(targetWidth / sourceSize.x);
  object.updateMatrixWorld(true);

  const fittedBounds = getBoundsInAnchor(object, anchor);
  const fittedCenter = fittedBounds.getCenter(new THREE.Vector3());
  object.position.x += centerX - fittedCenter.x;
  object.position.y += shelfY - fittedBounds.min.y;
  object.position.z += centerZ - fittedCenter.z;
  object.updateMatrixWorld(true);

  return getBoundsInAnchor(object, anchor);
}

function getBoundsInAnchor(object, anchor) {
  anchor?.updateMatrixWorld(true);
  const worldBounds = new THREE.Box3().setFromObject(object);
  if (!anchor) return worldBounds;

  const localBounds = new THREE.Box3().makeEmpty();
  for (const x of [worldBounds.min.x, worldBounds.max.x]) {
    for (const y of [worldBounds.min.y, worldBounds.max.y]) {
      for (const z of [worldBounds.min.z, worldBounds.max.z]) {
        localBounds.expandByPoint(anchor.worldToLocal(new THREE.Vector3(x, y, z)));
      }
    }
  }
  return localBounds;
}
