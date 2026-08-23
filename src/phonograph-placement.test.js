import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';

import { fitObjectToAnchor } from './phonograph-placement.js';

test('fits an offset object to the requested width and shelf plane', () => {
  const object = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 3));
  mesh.position.set(4, 2.5, -3);
  object.add(mesh);

  fitObjectToAnchor(object, {
    targetWidth: 0.72,
    shelfY: 0,
    centerX: 0,
    centerZ: 0,
  });

  object.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(object);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());

  assert.ok(Math.abs(size.x - 0.72) < 1e-6);
  assert.ok(Math.abs(bounds.min.y) < 1e-6);
  assert.ok(Math.abs(center.x) < 1e-6);
  assert.ok(Math.abs(center.z) < 1e-6);
});

test('fits an imported object in its parent anchor coordinate space', () => {
  const anchor = new THREE.Group();
  anchor.position.set(4, -2, 3);
  anchor.scale.setScalar(3);
  const object = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 3));
  mesh.position.set(4, 2.5, -3);
  object.add(mesh);
  anchor.add(object);
  anchor.updateMatrixWorld(true);

  fitObjectToAnchor(object, {
    targetWidth: 0.72,
    shelfY: 0,
    centerX: 0,
    centerZ: 0,
    anchor,
  });

  anchor.updateMatrixWorld(true);
  const worldBounds = new THREE.Box3().setFromObject(object);
  const localBounds = new THREE.Box3().makeEmpty();
  for (const x of [worldBounds.min.x, worldBounds.max.x]) {
    for (const y of [worldBounds.min.y, worldBounds.max.y]) {
      for (const z of [worldBounds.min.z, worldBounds.max.z]) {
        localBounds.expandByPoint(anchor.worldToLocal(new THREE.Vector3(x, y, z)));
      }
    }
  }
  const size = localBounds.getSize(new THREE.Vector3());
  const center = localBounds.getCenter(new THREE.Vector3());
  assert.ok(Math.abs(size.x - 0.72) < 1e-6);
  assert.ok(Math.abs(localBounds.min.y) < 1e-6);
  assert.ok(Math.abs(center.x) < 1e-6);
  assert.ok(Math.abs(center.z) < 1e-6);
});

test('main scene loads the authored phonograph into the Skills anchor with fallback', () => {
  const source = fs.readFileSync(new URL('./main.js', import.meta.url), 'utf8');

  assert.match(source, /唱片机\.glb/);
  assert.match(source, /fitObjectToAnchor\(phonograph/);
  assert.match(source, /skillsAnchor\.userData\.displayModel = phonograph/);
  assert.match(source, /interactiveObjects\.get\(['"]skills['"]\)/);
  assert.match(source, /phonograph\.rotation\.set\(THREE\.MathUtils\.degToRad\(14\), THREE\.MathUtils\.degToRad\(10\), 0\)/);
  assert.match(source, /Phonograph model failed to load; using cube placeholder\./);

  const loaderStart = source.indexOf('function loadPhonographModel');
  const loaderEnd = source.indexOf('\n}', loaderStart);
  assert.ok(loaderStart >= 0, 'loadPhonographModel must exist');
  assert.doesNotMatch(source.slice(loaderStart, loaderEnd), /node\.material\s*=/);
});

test('loads the authored file box as the Work display model on the lowest shelf', () => {
  const source = fs.readFileSync(new URL('./main.js', import.meta.url), 'utf8');

  assert.match(source, /文件箱\.glb/);
  assert.match(source, /function loadWorkModel/);
  assert.match(source, /fitObjectToAnchor\(fileBox/);
  assert.match(source, /targetWidth: 0\.36/);
  assert.match(source, /shelfY: 0\.047/);
  assert.match(source, /centerZ: -0\.04/);
  assert.match(source, /anchor: importedInteriorAnchor/);
  assert.match(source, /fileBox\.userData\.restScale = fileBox\.scale\.clone\(\)/);
  assert.match(source, /fileBox\.visible = state\.introComplete/);
  assert.match(source, /interactivePlacements\.work\[0\]/);
  assert.match(source, /workAnchor\.userData\.displayModel = fileBox/);
  assert.match(source, /interactiveObjects\.set\(['"]work['"], fileBox\)/);
  assert.match(source, /raycaster\.intersectObjects\(\[\.\.\.interactiveObjects\.values\(\)\], true\)/);
  assert.match(source, /hover-outline/);
  assert.match(source, /hover-glow/);
  assert.match(source, /function animateHoverScale/);
  assert.match(source, /factor = active \? 1\.045 : 1/);
  assert.doesNotMatch(source, /opacity: 0\.8, duration: 0\.16/);
  assert.match(source, /workAnchor\.visible = false/);
  assert.match(source, /work-file-box-model/);
  assert.match(source, /fileBox\.visible = state\.introComplete \|\| interiorRevealActive/);
});

test('loads the authored clipboard model as the Notes interaction model', () => {
  const source = fs.readFileSync(new URL('./main.js', import.meta.url), 'utf8');

  assert.match(source, /剪贴板\.glb/);
  assert.match(source, /function loadNotesModel/);
  assert.match(source, /fitObjectToAnchor\(clipboard/);
  assert.match(source, /targetWidth: 0\.09/);
  assert.match(source, /shelfY: -0\.13/);
  assert.match(source, /anchor: notesAnchor/);
  assert.match(source, /clipboard\.rotation\.set\(Math\.PI \/ 2, 0, Math\.PI\)/);
  assert.match(source, /node\.name === '图形001' \|\| node\.name === '图形002'/);
  assert.match(source, /metalness: 0\.22/);
  assert.match(source, /roughness: 0\.3/);
  assert.match(source, /const notesParent = notesAnchor\.parent/);
  assert.match(source, /clipboard\.userData\.draggable = true/);
  assert.match(source, /clipboard\.userData\.staticReveal = true/);
  assert.match(source, /clipboard\.position\.z = 0/);
  assert.match(source, /getObjectBoundsInSpace\(clipboard, notesParent\)/);
  assert.match(source, /contactGap = 0\.0015/);
  assert.match(source, /node\.castShadow = false/);
  assert.match(source, /clipboard\.visible = false/);
  assert.match(source, /z: doorLocalBounds\.min\.z/);
  assert.match(source, /notesAnchor\.userData\.displayModel = clipboard/);
  assert.match(source, /notesAnchor\.attach\(clipboard\)/);
  assert.match(source, /notesAnchor\.visible = true/);
  assert.doesNotMatch(source, /interactiveObjects\.set\(['"]notes['"], clipboard\)/);
  assert.match(source, /notes-clipboard-model/);
});

test('grows interior objects into view while the cabinet opens', () => {
  const source = fs.readFileSync(new URL('./main.js', import.meta.url), 'utf8');

  assert.match(source, /const interiorRevealStartScale = 0\.92/);
  assert.match(source, /function animateInteriorObject/);
  assert.match(source, /gsap\.to\(object\.scale/);
  assert.match(source, /const interiorRevealDuration = 1\.45/);
  assert.match(source, /const interiorRevealDoorProgress = 0\.24/);
  assert.match(source, /const interiorRevealDepth = 0\.12/);
  assert.match(source, /ease: 'power3\.inOut'/);
  assert.match(source, /const hasDisplayModel = Boolean\(object\.userData\.hasDisplayModel\)/);
  assert.match(source, /object\.material\.opacity = hasDisplayModel \? 0 : 0/);
  assert.match(source, /function prepareInteriorReveal/);
  assert.match(source, /function updateInteriorRevealFromDoor/);
  assert.match(source, /onUpdate: updateInteriorRevealFromDoor/);
  assert.match(source, /object\.position\.z = object\.userData\.basePosition\.z -/);
  assert.match(source, /showInteriorObjects\(\{ animate: true \}\)/);
  assert.match(source, /prefers-reduced-motion/);
});

test('adds damped horizontal pointer sway to the cabinet without translating objects', () => {
  const source = fs.readFileSync(new URL('./main.js', import.meta.url), 'utf8');

  assert.match(source, /const cabinetPointerSwayMax = THREE\.MathUtils\.degToRad\(3\.2\)/);
  assert.match(source, /cabinetPointerSwayTarget = normalizedX \* cabinetPointerSwayMax/);
  assert.match(source, /cabinetPointerSway \+= \(cabinetPointerSwayTarget - cabinetPointerSway\)/);
  assert.match(source, /const swaySmoothing = 1 - Math\.exp\(-delta \* 5\.5\)/);
  assert.match(source, /cabinet\.rotation\.y = cabinetPointerSway/);
  assert.match(source, /importedCabinet\.rotation\.y = cabinetPointerSway/);
  assert.match(source, /function addToonOutlines/);
  assert.match(source, /toonOutlineMaterial/);
  assert.match(source, /function addToonOutlines\(object, scale = 1\.004\)/);
  assert.match(source, /addToonOutlines\(importedCabinet, 1\.003\)/);
  assert.match(source, /flatShading: false/);
  assert.match(source, /side: THREE\.FrontSide/);
  assert.match(source, /renderer\.shadowMap\.type = THREE\.PCFSoftShadowMap/);
  assert.match(source, /getRenderPixelRatio/);
  assert.match(source, /canvas\.addEventListener\('pointerleave'/);
  assert.match(source, /cabinetPointerSwayTarget = 0/);
});

test('removes the pencil texture treatment from the scene surface', () => {
  const styles = fs.readFileSync(new URL('./style.css', import.meta.url), 'utf8');

  assert.doesNotMatch(styles, /pencilNoise|\.grain\s*\{|filter:\s*saturate/);
  assert.match(styles, /\.scene-vignette\s*\{/);
});

test('notes use the door pivot without the stretched static door cube', () => {
  const source = fs.readFileSync(new URL('./main.js', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /door-cube-static|window\.__doorCube/);
  assert.match(source, /getObjectByName\('Box028'\) \|\| importedCabinet\.getObjectByName\('Box024'\)/);
  assert.match(source, /const parentCandidate = doorMesh\.parent/);
  assert.match(source, /parentCandidate !== importedCabinet/);
  assert.match(source, /const notesParent = importedDoorPivot \|\| importedInteriorAnchor/);
  assert.match(source, /notesParent\.attach\(object\)/);
  assert.match(source, /object\.userData\.dragBounds/);
  assert.match(source, /object\.castShadow = false/);
  assert.match(source, /object\.userData\.restScale = object\.scale\.clone\(\)/);
  assert.match(source, /object\.scale\.copy\(object\.userData\.restScale\)/);
  assert.match(source, /z: doorLocalBounds\.min\.z/);
});
