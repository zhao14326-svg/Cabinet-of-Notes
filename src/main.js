import * as THREE from 'three';
import { gsap } from 'gsap';
import { fitObjectToAnchor } from './phonograph-placement.js';
import { renderSkillsPlayer, skillRecords, wrapSkillIndex } from './skills-player.js';
import { loadPortfolioRecords, portfolioRecords, renderPortfolioDetail, renderPortfolioPlayer } from './portfolio-player.js';

const app = document.querySelector('#app');

const state = {
  introComplete: false,
  activeSection: 'home',
  selectedTile: null,
  activeSkillRecord: 0,
  activePortfolioRecord: 0,
  portfolioDetailOpen: false,
  portfolioLightboxIndex: null,
  adminToken: sessionStorage.getItem('cabinet-admin-token') || '',
  adminOpen: false,
  tiles: [
    { id: 'about', label: '关于我', kicker: 'PROFILE', color: '#f3b7c7', position: [-3.1, 1.45, 0.15], rotation: -0.12, kind: 'about' },
    { id: 'work', label: '作品集', kicker: 'SELECTED WORK', color: '#a9dfc9', position: [3.05, 1.55, 0.1], rotation: 0.09, kind: 'work' },
    { id: 'skills', label: '能力', kicker: 'TOOLKIT', color: '#f5d79b', position: [-3.45, -0.7, 0.2], rotation: 0.1, kind: 'skills' },
    { id: 'notes', label: '便签', kicker: 'FIELD NOTES', color: '#d6c7f0', position: [3.3, -0.7, 0.22], rotation: -0.08, kind: 'notes' },
  ],
};
window.__cabinetState = state;

const content = {
  about: {
    title: '关于我',
    eyebrow: 'A QUIET OBSERVER',
    body: '我把复杂的东西整理成清晰、可触摸的体验。喜欢在界面、空间和文字之间寻找有温度的秩序。',
    facts: ['独立设计 / 开发者', '常驻：深圳 · 远程', '正在研究：空间化叙事'],
  },
  work: {
    title: '作品集',
    eyebrow: 'SELECTED WORK',
    body: '把每一个项目当成一件被收进柜子里的物品：有来处、有细节，也有留给下一次打开的余地。',
    facts: ['01 / 城市声音地图', '02 / 纸上天气', '03 / 微型展览系统'],
  },
  skills: {
    title: '能力',
    eyebrow: 'TOOLKIT',
    body: '从概念、原型到上线，我擅长把感觉翻译成结构，再把结构做得像感觉一样自然。',
    facts: ['Three.js · GSAP · WebGL', 'React · TypeScript · Vite', '交互原型 · 视觉系统 · 叙事'],
  },
  notes: {
    title: '便签',
    eyebrow: 'FIELD NOTES',
    body: '这里收集正在发生的想法。点击磁贴后可以编辑内容，所有修改会保存在当前浏览器。',
    facts: ['拖拽磁贴调整位置', '双击磁贴进入编辑', '自动保存到 localStorage'],
  },
};

app.innerHTML = `
  <main class="site-shell">
    <div class="grain"></div>
    <section class="scene-wrap" aria-label="3D portfolio scene">
      <canvas id="scene"></canvas>
      <div class="scene-vignette"></div>
      <header class="topbar">
        <button class="brand" data-section="home" aria-label="回到首页"><span class="brand-mark">CN</span><span>cabinet of notes</span></button>
        <nav class="nav" aria-label="主导航">
          <button class="nav-link is-active" data-section="home">首页</button>
          <button class="nav-link" data-section="about">关于我</button>
          <button class="nav-link" data-section="work">作品</button>
          <button class="nav-link" data-section="skills">能力</button>
          <button class="nav-link" data-section="notes">便签</button>
        </nav>
        <div class="top-meta"><span class="status-dot"></span><span>柜门已打开</span><span class="meta-divider"></span><span>2026 — 08</span></div><button class="admin-open-button" type="button" data-admin-open>编辑作品</button>
      </header>
      <div class="intro-copy">
        <p class="intro-kicker">PERSONAL ARCHIVE / 001</p>
        <h1>把想法，<br><em>收进一个空间。</em></h1>
        <p class="intro-sub">一份可被打开的个人记录与作品集。</p>
      </div>
      <div class="scene-hint"><span class="hint-line"></span><span>点击柜内物体</span><span class="hint-key">CLICK TO OPEN</span></div>
      <div id="tile-layer" class="tile-layer" aria-live="polite"></div>
    </section>
    <div class="panel-scrim" aria-hidden="true"></div>
    <aside class="detail-panel" aria-label="内容面板">
      <div class="panel-top"><span class="panel-index">00 / HOME</span><button class="panel-close" aria-label="关闭面板">×</button></div>
      <div id="panel-content" class="panel-content"></div>
      <div class="panel-footer"><span>© 2026 CN</span><span>保存于本地浏览器</span></div>
    </aside>
    <div class="welcome-overlay" id="welcome">
      <div class="welcome-word">welcome</div>
      <div class="pour-track"><div class="pour-fill"></div></div>
      <div class="welcome-note"><span>opening personal archive</span><span id="load-percent">00%</span></div>
    </div>
    <div class="editor-modal" id="editor-modal" aria-hidden="true">
      <div class="editor-box">
        <div class="editor-head"><span>编辑便签</span><button class="editor-close" aria-label="关闭">×</button></div>
        <label>标题<input id="note-title" maxlength="24" /></label>
        <label>内容<textarea id="note-body" rows="5" maxlength="220"></textarea></label>
        <div class="editor-actions"><button class="ghost-btn editor-cancel">取消</button><button class="solid-btn editor-save">保存便签</button></div>
      </div>
    </div>
    <div class="portfolio-lightbox" id="portfolio-lightbox" aria-hidden="true" role="dialog" aria-modal="true" aria-label="作品图片预览">
      <button class="portfolio-lightbox-close" type="button" data-lightbox-close aria-label="关闭图片预览" title="关闭">×</button>
      <button class="portfolio-lightbox-nav portfolio-lightbox-prev" type="button" data-lightbox-direction="-1" aria-label="上一张图片" title="上一张">←</button>
      <figure class="portfolio-lightbox-figure">
        <img class="portfolio-lightbox-image" alt="" />
        <figcaption><span class="portfolio-lightbox-name"></span><span class="portfolio-lightbox-count"></span></figcaption>
      </figure>
      <button class="portfolio-lightbox-nav portfolio-lightbox-next" type="button" data-lightbox-direction="1" aria-label="下一张图片" title="下一张">→</button>
    </div>
    <div class="admin-modal" id="admin-modal" aria-hidden="true" role="dialog" aria-modal="true" aria-label="作品集管理">
      <div class="admin-box">
        <div class="admin-head"><div><p class="admin-eyebrow">PORTFOLIO CMS</p><h2>编辑作品集</h2></div><button class="admin-close" type="button" data-admin-close aria-label="关闭编辑">×</button></div>
        <div class="admin-login" data-admin-login><p>登录后可以上传文件、移动文件和重命名文件夹。</p><label>管理密码<input type="password" data-admin-password autocomplete="current-password" /></label><button class="admin-action admin-login-submit" type="button">登录</button><p class="admin-error" data-admin-error></p></div>
        <div class="admin-workspace" data-admin-workspace hidden>
          <div class="admin-toolbar"><button class="admin-action" type="button" data-admin-new-folder>新建文件夹</button><button class="admin-action admin-logout" type="button" data-admin-logout>退出登录</button></div>
          <div class="admin-folder-list" data-admin-folders></div>
        </div>
      </div>
    </div>
  </main>
`;
window.__cabinetAppStarted = true;

const canvas = document.querySelector('#scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#ffffff');
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0.45, 19.2);
const cameraFocus = new THREE.Vector3(0, 0.55, 0);
let cameraTargetZ = 19.2;
const cameraMinZ = 11.2;
const cameraMaxZ = 23.5;
window.__cameraTargetZ = cameraTargetZ;
camera.lookAt(cameraFocus);
window.__camera = camera;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 1;

const ambient = new THREE.HemisphereLight('#ffffff', '#dff4fa', 1.2);
scene.add(ambient);
const keyLight = new THREE.DirectionalLight('#ffffff', 3.6);
keyLight.position.set(-10, 10, 14);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 45;
keyLight.shadow.camera.left = -16;
keyLight.shadow.camera.right = 16;
keyLight.shadow.camera.top = 14;
keyLight.shadow.camera.bottom = -12;
keyLight.shadow.bias = -0.00025;
scene.add(keyLight);
scene.add(keyLight.target);
const fillLight = new THREE.DirectionalLight('#e6f8ff', 0.7);
fillLight.position.set(5, -2, 5);
scene.add(fillLight);
const rimLight = new THREE.PointLight('#d4f2ff', 0.65, 24);
rimLight.position.set(4, -2, 5);
scene.add(rimLight);

const root = new THREE.Group();
root.position.y = -0.2;
scene.add(root);

const toonGradient = new THREE.DataTexture(
  new Uint8Array([82, 118, 130, 255, 148, 194, 207, 255, 226, 247, 251, 255]),
  3,
  1,
  THREE.RGBAFormat,
);
toonGradient.magFilter = THREE.NearestFilter;
toonGradient.minFilter = THREE.NearestFilter;
toonGradient.needsUpdate = true;

const mat = (color) => new THREE.MeshToonMaterial({ color, gradientMap: toonGradient, flatShading: true });
const wood = mat('#9ed7e8');
const woodDark = mat('#73b8cd');
const brass = mat('#f3c9a8');
const inner = mat('#6aaec2');

function box(size, material, position, parent = root) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function getObjectBoundsInSpace(object, space) {
  object.updateMatrixWorld(true);
  space.updateMatrixWorld(true);
  const inverse = new THREE.Matrix4().copy(space.matrixWorld).invert();
  const transform = new THREE.Matrix4();
  const point = new THREE.Vector3();
  const bounds = new THREE.Box3().makeEmpty();
  object.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry.computeBoundingBox();
    const source = node.geometry.boundingBox;
    transform.multiplyMatrices(inverse, node.matrixWorld);
    for (const x of [source.min.x, source.max.x]) {
      for (const y of [source.min.y, source.max.y]) {
        for (const z of [source.min.z, source.max.z]) {
          bounds.expandByPoint(point.set(x, y, z).applyMatrix4(transform));
        }
      }
    }
  });
  return bounds;
}

const cabinet = new THREE.Group();
cabinet.position.y = 0.25;
root.add(cabinet);
box([4.35, 5.3, 0.52], wood, [0, 0, 0], cabinet);
box([3.74, 4.7, 0.18], inner, [0, 0, 0.33], cabinet);
box([3.74, 0.12, 0.18], woodDark, [0, 2.13, 0.43], cabinet);
box([3.74, 0.12, 0.18], woodDark, [0, -2.13, 0.43], cabinet);
box([0.12, 4.5, 0.18], woodDark, [-1.82, 0, 0.43], cabinet);
box([0.12, 4.5, 0.18], woodDark, [1.82, 0, 0.43], cabinet);

const shelfYs = [1.15, -0.15, -1.45];
shelfYs.forEach((y) => box([3.6, 0.11, 0.22], woodDark, [0, y, 0.52], cabinet));

function makeDoor(x, side) {
  const pivot = new THREE.Group();
  pivot.position.x = x;
  cabinet.add(pivot);
  const door = box([1.9, 4.7, 0.22], wood, [side * 0.95, 0, 0.68], pivot);
  door.material = wood;
  const trim = box([1.62, 4.38, 0.08], mat('#5e3b2c'), [side * 0.95, 0, 0.81], pivot);
  const handle = box([0.08, 0.66, 0.12], brass, [side * 0.18, 0, 0.9], pivot);
  return { pivot, door, trim, handle };
}
const leftDoor = makeDoor(-1.88, -1);
const rightDoor = makeDoor(1.88, 1);

let importedCabinet = null;
let importedMixer = null;
let importedOpenAction = null;
let importedDoorPivot = null;
let importedDoorAssembly = null;
let importedDoorOpen = false;
let importedInteriorAnchor = null;
let openRequested = false;
let interiorRevealActive = false;
let interiorRevealPending = false;
let interiorRevealTriggered = false;
const doorOpenAngle = THREE.MathUtils.degToRad(140);
const cabinetPointerSwayMax = THREE.MathUtils.degToRad(3.2);
let cabinetPointerSwayTarget = 0;
let cabinetPointerSway = 0;

async function loadCabinetModel() {
  let GLTFLoader;
  try {
    ({ GLTFLoader } = await import('./vendor/three/loaders/GLTFLoader.js'));
  } catch (error) {
    console.warn('Cabinet loader failed to initialize; using box placeholder.', error);
    return;
  }
  const gltfLoader = new GLTFLoader();
  const modelUrl = new URL('./assets/models/柜子1.glb', import.meta.url).href;
  gltfLoader.load(modelUrl, (gltf) => {
    importedCabinet = gltf.scene;
    importedCabinet.name = 'cabinet-model';
    importedCabinet.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        node.frustumCulled = false;
        const meshIndex = Number.parseInt(node.name.match(/Box(\d+)/)?.[1] || '0', 10);
        const palette = ['#a9dfee', '#91cfe2', '#b7e7f1', '#86c4da', '#9ed7e8'];
        const color = palette[meshIndex % palette.length];
        const materialCount = Array.isArray(node.material) ? node.material.length : 1;
        node.material = Array.from({ length: materialCount }, () => new THREE.MeshToonMaterial({
          color,
          gradientMap: toonGradient,
          flatShading: true,
          side: THREE.DoubleSide,
        }));
        if (materialCount === 1) node.material = node.material[0];
      }
    });

    const bounds = new THREE.Box3().setFromObject(importedCabinet);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const targetHeight = 5.1;
    const scale = size.y > 0 ? targetHeight / size.y : 1;
    importedCabinet.scale.setScalar(scale);
    importedCabinet.position.set(-center.x * scale, 0.25 - center.y * scale, 0.15 - center.z * scale);
    root.add(importedCabinet);
    cabinet.visible = false;

    importedCabinet.updateMatrixWorld(true);
    // The GLB repeats five tall door panels; Box024 is the second panel from the left.
    const doorMesh = importedCabinet.getObjectByName('Box024');
    if (doorMesh) {
      const doorAssembly = doorMesh.parent || doorMesh;
      importedDoorAssembly = doorAssembly;
      const doorBounds = new THREE.Box3().setFromObject(doorAssembly);
      const hingeWorld = new THREE.Vector3(doorBounds.max.x, doorBounds.getCenter(new THREE.Vector3()).y, doorBounds.getCenter(new THREE.Vector3()).z);
      const hingeLocal = importedCabinet.worldToLocal(hingeWorld.clone());
      importedDoorPivot = new THREE.Group();
      importedDoorPivot.name = 'second-door-hinge';
      importedDoorPivot.position.copy(hingeLocal);
      importedCabinet.add(importedDoorPivot);
      importedDoorPivot.updateMatrixWorld(true);
      importedDoorPivot.attach(doorAssembly);
      importedDoorPivot.rotation.order = 'YXZ';
      importedDoorPivot.userData = { angle: 140, axis: 'Y', hinge: 'right', panel: 'Box024' };
    }

    importedInteriorAnchor = new THREE.Group();
    importedInteriorAnchor.name = 'second-cabinet-interior';
    importedCabinet.add(importedInteriorAnchor);
    interactiveObjects.forEach((object, id) => {
      if (id === 'notes') {
        const notesParent = importedDoorPivot || importedInteriorAnchor;
        notesParent.attach(object);
        object.scale.setScalar(1);
        notesParent.updateMatrixWorld(true);
        object.userData.restScale = object.scale.clone();

        const doorLocalBounds = importedDoorAssembly
          ? getObjectBoundsInSpace(importedDoorAssembly, notesParent)
          : new THREE.Box3(new THREE.Vector3(-0.44, -0.72, -0.08), new THREE.Vector3(0, 0.72, 0.12));
        object.userData.dragBounds = {
          minX: doorLocalBounds.min.x + 0.11,
          maxX: doorLocalBounds.max.x - 0.11,
          minY: doorLocalBounds.min.y + 0.16,
          maxY: doorLocalBounds.max.y - 0.16,
          z: doorLocalBounds.min.z,
        };
        object.userData.doorSurfaceZ = doorLocalBounds.min.z;
        object.userData.noHoverScale = true;
        object.castShadow = false;
        object.receiveShadow = false;

        let savedPosition = null;
        try {
          const savedTiles = JSON.parse(localStorage.getItem('cabinet-tiles') || '[]');
          const savedNote = savedTiles.find((tile) => tile.id === 'notes');
          if (Array.isArray(savedNote?.position) && savedNote.position.length === 3) savedPosition = savedNote.position;
        } catch { /* ignore malformed note position */ }
        const [savedX = doorLocalBounds.getCenter(new THREE.Vector3()).x, savedY = 0.06] = savedPosition || [];
        object.position.set(
          THREE.MathUtils.clamp(savedX, object.userData.dragBounds.minX, object.userData.dragBounds.maxX),
          THREE.MathUtils.clamp(savedY, object.userData.dragBounds.minY, object.userData.dragBounds.maxY),
          object.userData.dragBounds.z,
        );
      } else {
        importedInteriorAnchor.attach(object);
        object.position.set(...interactivePlacements[id]);
      }
    });
    loadNotesModel();
    loadWorkModel();
    window.__cabinetDebug = { importedCabinet, importedDoorPivot, importedDoorAssembly, importedInteriorAnchor, doorOpenAngle };

    if (gltf.animations.length) {
      importedMixer = new THREE.AnimationMixer(importedCabinet);
      const openClip = gltf.animations.find((clip) => /open|door|开|门/i.test(clip.name)) || gltf.animations[0];
      importedOpenAction = importedMixer.clipAction(openClip);
      importedOpenAction.clampWhenFinished = true;
      importedOpenAction.loop = THREE.LoopOnce;
      if (state.introComplete) importedOpenAction.reset().play();
    } else if (state.introComplete) {
      importedCabinet.rotation.y = 0;
    }
    if (openRequested || state.introComplete) animateImportedDoor();
  }, undefined, (error) => {
    console.warn('Cabinet model failed to load; using box placeholder.', error);
  });
}
loadCabinetModel();

async function loadNotesModel() {
  const notesAnchor = interactiveObjects.get('notes');
  if (!notesAnchor?.parent) return;

  try {
    const { GLTFLoader } = await import('./vendor/three/loaders/GLTFLoader.js');
    const gltfLoader = new GLTFLoader();
    const modelUrl = new URL('./assets/models/剪贴板.glb', import.meta.url).href;
    gltfLoader.load(modelUrl, (gltf) => {
      const clipboard = gltf.scene;
      const notesParent = notesAnchor.parent;
      clipboard.name = 'notes-clipboard-model';
      clipboard.visible = false;
      // The authored asset is laid out on XZ; rotate it upright before fitting.
      clipboard.rotation.set(Math.PI / 2, 0, Math.PI);
      clipboard.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = false;
        node.receiveShadow = true;
        node.frustumCulled = false;
      });

      notesParent.add(clipboard);
      notesParent.updateMatrixWorld(true);
      notesAnchor.attach(clipboard);
      // Fit in the anchor's local space so the clipboard remains centered on the door
      // as the door rotates, instead of inheriting the GLB's offset geometry origin.
      fitObjectToAnchor(clipboard, {
        targetWidth: 0.075,
        shelfY: -0.13,
        anchor: notesAnchor,
      });
      clipboard.userData.restScale = clipboard.scale.clone();
      clipboard.userData.basePosition = clipboard.position.clone();
      clipboard.userData.staticReveal = true;
      clipboard.position.z = 0;
      clipboard.userData.basePosition.copy(clipboard.position);
      notesParent.updateMatrixWorld(true);
      const clipboardDoorBounds = getObjectBoundsInSpace(clipboard, notesParent);
      const contactGap = 0.0015;
      notesAnchor.position.z += notesAnchor.userData.doorSurfaceZ - contactGap - clipboardDoorBounds.max.z;
      notesAnchor.userData.dragBounds.z = notesAnchor.position.z;
      notesParent.updateMatrixWorld(true);
      clipboard.userData.baseRotationY = clipboard.rotation.y;
      clipboard.userData.id = 'notes';
      clipboard.userData.label = '便签';
      clipboard.userData.interactive = true;
      clipboard.userData.draggable = true;
      clipboard.visible = state.introComplete || interiorRevealActive;
      notesAnchor.userData.hasDisplayModel = true;
      notesAnchor.userData.displayModel = clipboard;
      notesAnchor.material.opacity = 0;
      notesAnchor.visible = true;
      window.__notesClipboard = clipboard;
      if (interiorRevealPending) prepareInteriorObject(clipboard);
      else if (interiorRevealActive) animateInteriorObject(clipboard, 'notes');
    }, undefined, (error) => {
      console.warn('Notes clipboard model failed to load; using hidden note anchor.', error);
    });
  } catch (error) {
    console.warn('Notes clipboard model failed to load; using hidden note anchor.', error);
  }
}

async function loadWorkModel() {
  const workAnchor = interactiveObjects.get('work');
  if (!workAnchor || !importedInteriorAnchor) return;

  try {
    const { GLTFLoader } = await import('./vendor/three/loaders/GLTFLoader.js');
    const gltfLoader = new GLTFLoader();
    const modelUrl = new URL('./assets/models/文件箱.glb', import.meta.url).href;
    gltfLoader.load(modelUrl, (gltf) => {
      const fileBox = gltf.scene;
      fileBox.name = 'work-file-box-model';
      fileBox.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = true;
        node.receiveShadow = true;
        node.frustumCulled = false;
      });

      importedInteriorAnchor.add(fileBox);
      fitObjectToAnchor(fileBox, {
        targetWidth: 0.36,
        shelfY: 0.047,
        centerX: interactivePlacements.work[0],
      centerZ: -0.04,
        anchor: importedInteriorAnchor,
      });
      fileBox.userData.restScale = fileBox.scale.clone();
      fileBox.userData.basePosition = fileBox.position.clone();
      fileBox.userData.baseRotationY = fileBox.rotation.y;
      fileBox.userData.id = 'work';
      fileBox.userData.label = '作品集';
      fileBox.userData.interactive = true;
      fileBox.userData.draggable = false;
      fileBox.visible = state.introComplete || interiorRevealActive;
      workAnchor.userData.hasDisplayModel = true;
      workAnchor.userData.displayModel = fileBox;
      workAnchor.material.opacity = 0;
      workAnchor.visible = false;
      interactiveObjects.set('work', fileBox);
      window.__workFileBox = fileBox;
      if (interiorRevealPending) prepareInteriorObject(fileBox);
      else if (interiorRevealActive) animateInteriorObject(fileBox, 'work');
    }, undefined, (error) => {
      console.warn('Work file box model failed to load; using cube placeholder.', error);
    });
  } catch (error) {
    console.warn('Work file box model failed to load; using cube placeholder.', error);
  }
}

const floor = new THREE.Mesh(new THREE.CircleGeometry(7, 64), new THREE.MeshStandardMaterial({ color: '#e6e9e4', roughness: 1 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2.5;
floor.receiveShadow = true;
scene.add(floor);

const glow = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 3.6), new THREE.MeshBasicMaterial({ color: '#fff2c7', transparent: true, opacity: 0.2 }));
glow.position.set(0, 0.25, 0.58);
scene.add(glow);

const interactiveObjects = new Map();
const interactivePlacements = {
  about: [-1.50, 1.28, -0.08],
  work: [-1.50, 0.92, -0.08],
  skills: [-1.50, 0.56, -0.08],
  notes: [-1.50, 0.20, -0.08],
};

function createInteriorObjects() {
  state.tiles.forEach((tile) => {
    const material = new THREE.MeshToonMaterial({
      color: tile.color,
      gradientMap: toonGradient,
      flatShading: true,
      transparent: true,
      opacity: 0,
    });
    const object = box([0.26, 0.26, 0.26], material, interactivePlacements[tile.id], root);
    object.visible = false;
    object.renderOrder = 12;
    object.userData = { id: tile.id, label: tile.label, draggable: tile.id === 'notes', interactive: true };
    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(object.geometry),
      new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthTest: false }),
    );
    outline.name = 'hover-outline';
    outline.scale.setScalar(1.12);
    outline.renderOrder = 30;
    object.add(outline);
    const glowOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(object.geometry),
      new THREE.LineBasicMaterial({ color: '#69e8ff', transparent: true, opacity: 0, depthTest: false }),
    );
    glowOutline.name = 'hover-glow';
    glowOutline.scale.setScalar(1.24);
    glowOutline.renderOrder = 29;
    object.add(glowOutline);
    object.userData.outline = outline;
    object.userData.glowOutline = glowOutline;
    interactiveObjects.set(tile.id, object);
  });
}
createInteriorObjects();

async function loadPhonographModel() {
  const skillsAnchor = interactiveObjects.get('skills');
  if (!skillsAnchor) return;

  try {
    const { GLTFLoader } = await import('./vendor/three/loaders/GLTFLoader.js');
    const gltfLoader = new GLTFLoader();
    const modelUrl = new URL('./assets/models/唱片机.glb', import.meta.url).href;
    gltfLoader.load(modelUrl, (gltf) => {
      const phonograph = gltf.scene;
      phonograph.name = 'skills-phonograph-model';
      phonograph.rotation.set(THREE.MathUtils.degToRad(14), THREE.MathUtils.degToRad(10), 0);
      phonograph.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = true;
        node.receiveShadow = true;
        node.frustumCulled = false;
      });

      fitObjectToAnchor(phonograph, {
        targetWidth: 0.36,
        shelfY: -0.02,
        centerX: 0,
        centerZ: 0.02,
      });
      phonograph.userData.restScale = phonograph.scale.clone();
      phonograph.userData.basePosition = phonograph.position.clone();
      phonograph.userData.baseRotationY = phonograph.rotation.y;
      skillsAnchor.add(phonograph);
      skillsAnchor.material.opacity = 0;
      skillsAnchor.userData.hasDisplayModel = true;
      skillsAnchor.userData.displayModel = phonograph;
      window.__phonographModel = phonograph;
      phonograph.visible = state.introComplete || interiorRevealActive;
      if (interiorRevealPending) prepareInteriorObject(phonograph);
      else if (interiorRevealActive) animateInteriorObject(phonograph, 'skills-model');
    }, undefined, (error) => {
      console.warn('Phonograph model failed to load; using cube placeholder.', error);
    });
  } catch (error) {
    console.warn('Phonograph model failed to load; using cube placeholder.', error);
  }
}
loadPhonographModel();

const interiorRevealStartScale = 0.92;
const interiorRevealDuration = 1.45;
const interiorRevealDelays = { about: 0, work: 0, skills: 0, notes: 0 };
const interiorRevealDoorProgress = 0.24;
const interiorRevealDepth = 0.12;
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

function prepareInteriorObject(object) {
  if (!object) return;
  const restScale = object.userData?.restScale || new THREE.Vector3(1, 1, 1);
  if (object.userData?.staticReveal) {
    object.visible = false;
    object.scale.copy(restScale);
    if (object.userData.basePosition) object.position.copy(object.userData.basePosition);
    object.userData.revealAnimating = false;
    return;
  }
  const startScale = restScale.clone().multiplyScalar(reducedMotion ? 0.98 : interiorRevealStartScale);
  object.visible = false;
  object.scale.copy(startScale);
  if (object.userData?.basePosition) {
    const depth = object.userData?.revealDepth ?? interiorRevealDepth;
    object.position.z = object.userData.basePosition.z - (reducedMotion ? 0 : depth);
    object.userData.revealAnimating = true;
  }
}

function animateInteriorObject(object, id = object.userData?.id) {
  if (!object) return;
  const restScale = object.userData?.restScale || new THREE.Vector3(1, 1, 1);
  if (object.userData?.staticReveal) {
    gsap.killTweensOf(object.scale);
    gsap.killTweensOf(object.position);
    object.visible = true;
    object.scale.copy(restScale);
    if (object.userData.basePosition) object.position.copy(object.userData.basePosition);
    object.userData.revealAnimating = false;
    return;
  }
  const startScale = restScale.clone().multiplyScalar(reducedMotion ? 0.98 : interiorRevealStartScale);
  const delay = reducedMotion ? 0 : (interiorRevealDelays[id] || 0);
  object.visible = true;
  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.position);
  object.scale.copy(startScale);
  if (object.userData?.basePosition) {
    const depth = object.userData?.revealDepth ?? interiorRevealDepth;
    object.position.z = object.userData.basePosition.z - (reducedMotion ? 0 : depth);
    object.userData.revealAnimating = true;
    gsap.to(object.position, {
      z: object.userData.basePosition.z,
      duration: reducedMotion ? 0.2 : interiorRevealDuration,
      delay,
      ease: 'power3.inOut',
      overwrite: true,
    });
  }
  gsap.to(object.scale, {
    x: restScale.x,
    y: restScale.y,
    z: restScale.z,
    duration: reducedMotion ? 0.2 : interiorRevealDuration,
    delay,
    ease: 'power3.inOut',
    overwrite: true,
    onComplete: () => { object.userData.revealAnimating = false; },
  });
}

function prepareInteriorReveal() {
  interiorRevealPending = true;
  interiorRevealActive = false;
  interiorRevealTriggered = false;
  interactiveObjects.forEach((object) => {
    const displayModel = object.userData.displayModel;
    object.visible = false;
    if (object.material) object.material.opacity = 0;
    if (displayModel) {
      object.scale.setScalar(1);
      displayModel.visible = false;
      prepareInteriorObject(displayModel);
    } else {
      prepareInteriorObject(object);
    }
  });
}

function revealInteriorObjects() {
  if (!interiorRevealPending || interiorRevealTriggered) return;
  interiorRevealPending = false;
  interiorRevealActive = true;
  interiorRevealTriggered = true;
  interactiveObjects.forEach((object, id) => {
    const displayModel = object.userData.displayModel;
    const hasDisplayModel = Boolean(object.userData.hasDisplayModel);
    object.visible = true;
    if (object.material) {
      object.material.opacity = hasDisplayModel ? 0 : 0;
      if (!hasDisplayModel) {
        gsap.to(object.material, {
          opacity: 1,
          duration: reducedMotion ? 0.2 : interiorRevealDuration,
          delay: reducedMotion ? 0 : (interiorRevealDelays[id] || 0),
          ease: 'power3.inOut',
          overwrite: true,
        });
      }
    }
    if (displayModel) {
      displayModel.visible = true;
      animateInteriorObject(displayModel, `${id}-model`);
    } else {
      animateInteriorObject(object, id);
    }
  });
}

function showInteriorObjects({ animate = false } = {}) {
  if (animate) {
    prepareInteriorReveal();
    return;
  }
  interiorRevealPending = false;
  interiorRevealActive = false;
  interiorRevealTriggered = true;
  interactiveObjects.forEach((object) => {
    const displayModel = object.userData.displayModel;
    object.visible = true;
    if (object.material) object.material.opacity = object.userData.hasDisplayModel ? 0 : 1;
    gsap.killTweensOf(object.scale);
    gsap.killTweensOf(object.position);
    if (object.userData.restScale) object.scale.copy(object.userData.restScale);
    else object.scale.setScalar(1);
    object.userData.revealAnimating = false;
    if (object.userData.basePosition) object.position.z = object.userData.basePosition.z;
    if (displayModel) {
      displayModel.visible = true;
      if (displayModel.userData.restScale) displayModel.scale.copy(displayModel.userData.restScale);
      if (displayModel.userData.basePosition) displayModel.position.z = displayModel.userData.basePosition.z;
      displayModel.userData.revealAnimating = false;
    }
  });
}

function updateInteriorRevealFromDoor() {
  if (!interiorRevealPending || !importedDoorPivot) return;
  const progress = THREE.MathUtils.clamp(importedDoorPivot.rotation.y / doorOpenAngle, 0, 1);
  if (progress >= interiorRevealDoorProgress) revealInteriorObjects();
}

function scheduleInteriorReveal(delay = 0.42) {
  window.setTimeout(revealInteriorObjects, reducedMotion ? 0 : delay * 1000);
}

function renderTiles() {
  const layer = document.querySelector('#tile-layer');
  layer.innerHTML = '';
}

function renderPanel(section = state.activeSection) {
  const panel = document.querySelector('#panel-content');
  const detailPanel = document.querySelector('.detail-panel');
  detailPanel.classList.toggle('detail-panel--skills', section === 'skills');
  detailPanel.classList.toggle('detail-panel--portfolio', section === 'work');
  detailPanel.classList.remove('detail-panel--portfolio-detail');
  if (section === 'skills') {
    document.querySelector('.panel-index').textContent = '03 / SKILLS';
    panel.innerHTML = renderSkillsPlayer(skillRecords[state.activeSkillRecord], state.activeSkillRecord, skillRecords.length);
    return;
  }
  if (section === 'work') {
    document.querySelector('.panel-index').textContent = '02 / WORK';
    panel.innerHTML = renderPortfolioPlayer(portfolioRecords[state.activePortfolioRecord], state.activePortfolioRecord, portfolioRecords.length);
    return;
  }
  const title = section === 'home' ? '一间可以打开的房间' : content[section].title;
  const eyebrow = section === 'home' ? 'CABINET OF NOTES' : content[section].eyebrow;
  const body = section === 'home' ? '欢迎来到我的个人记录。打开柜门，点击散落在空间里的磁贴，慢慢认识这里的工作与生活。' : content[section].body;
  const facts = section === 'home' ? ['四张磁贴，四个入口', '柜门打开后才开始探索', '便签支持编辑与本地保存'] : content[section].facts;
  document.querySelector('.panel-index').textContent = section === 'home' ? '00 / HOME' : `${String(state.tiles.findIndex((tile) => tile.kind === section) + 1).padStart(2, '0')} / ${section.toUpperCase()}`;
  panel.innerHTML = `<p class="panel-eyebrow">${eyebrow}</p><h2>${title}</h2><p class="panel-body">${body}</p><div class="fact-list">${facts.map((fact, index) => `<div class="fact"><span>0${index + 1}</span><span>${fact}</span></div>`).join('')}</div>`;
}

let skillWheelLock = false;
let skillWheelAccumulated = 0;
let skillWheelResetTimer = null;
let skillPointerStartY = null;
let portfolioWheelLock = false;
let portfolioWheelAccumulated = 0;
let portfolioWheelResetTimer = null;
let portfolioPointerStartY = null;

const skillWheelThreshold = 280;
const portfolioWheelThreshold = 250;

function applySkillWheelPreview(intent = skillWheelAccumulated) {
  const player = document.querySelector('.skills-player');
  if (!player) return;
  const progress = Math.min(Math.abs(intent) / skillWheelThreshold, 1);
  const direction = Math.sign(intent) || 1;
  const vinylMotion = player.querySelector('.vinyl-motion');
  const copy = player.querySelector('.skill-copy');
  const tonearm = player.querySelector('.tonearm');

  if (progress === 0) {
    vinylMotion?.style.removeProperty('transform');
    vinylMotion?.style.removeProperty('opacity');
    copy?.style.removeProperty('transform');
    copy?.style.removeProperty('opacity');
    tonearm?.style.removeProperty('transform');
    return;
  }

  if (vinylMotion) {
    vinylMotion.style.transform = `translate3d(${direction * 24 * progress}px, 0, 0) scale(${1 - 0.18 * progress})`;
    vinylMotion.style.opacity = String(1 - 0.25 * progress);
  }
  if (copy) {
    copy.style.transform = `translate3d(${-direction * 10 * progress}px, 0, 0)`;
    copy.style.opacity = String(1 - 0.58 * progress);
  }
  if (tonearm) tonearm.style.transform = `rotate(${8 - 18 * progress}deg)`;
}

function scheduleSkillWheelReset() {
  window.clearTimeout(skillWheelResetTimer);
  skillWheelResetTimer = window.setTimeout(() => {
    skillWheelAccumulated = 0;
    applySkillWheelPreview(0);
  }, 700);
}

function changeSkillRecord(direction) {
  if (state.activeSection !== 'skills' || skillWheelLock) return;
  skillWheelLock = true;
  skillWheelAccumulated = 0;
  window.clearTimeout(skillWheelResetTimer);
  const panel = document.querySelector('#panel-content');
  const player = panel.querySelector('.skills-player');
  panel.classList.add('skill-record-changing');
  player?.classList.add('is-transition-out', direction > 0 ? 'is-next' : 'is-prev');
  player?.querySelector('.vinyl-motion')?.style.removeProperty('transform');
  player?.querySelector('.vinyl-motion')?.style.removeProperty('opacity');
  player?.querySelector('.skill-copy')?.style.removeProperty('transform');
  player?.querySelector('.skill-copy')?.style.removeProperty('opacity');
  player?.querySelector('.tonearm')?.style.removeProperty('transform');
  window.setTimeout(() => {
    state.activeSkillRecord = wrapSkillIndex(state.activeSkillRecord + direction, skillRecords.length);
    renderPanel('skills');
    const nextPlayer = panel.querySelector('.skills-player');
    nextPlayer?.classList.add('is-transition-prep', direction > 0 ? 'is-next' : 'is-prev');
    nextPlayer?.getBoundingClientRect();
    nextPlayer?.classList.remove('is-transition-prep');
    window.setTimeout(() => {
      panel.classList.remove('skill-record-changing');
      nextPlayer?.classList.remove('is-next', 'is-prev');
      skillWheelLock = false;
    }, 280);
  }, 180);
}

function applyPortfolioWheelPreview(intent = portfolioWheelAccumulated) {
  const player = document.querySelector('.portfolio-player');
  if (!player) return;
  const progress = Math.min(Math.abs(intent) / portfolioWheelThreshold, 1);
  const direction = Math.sign(intent) || 1;
  const activeFolder = player.querySelector('.portfolio-folder.is-active');
  const copy = player.querySelector('.portfolio-copy');

  if (progress === 0) {
    activeFolder?.style.removeProperty('transform');
    activeFolder?.style.removeProperty('opacity');
    copy?.style.removeProperty('transform');
    copy?.style.removeProperty('opacity');
    return;
  }
  if (activeFolder) {
    activeFolder.style.transform = `translate3d(0, ${-direction * 28 * progress}px, 4px) scale(${1 - 0.08 * progress})`;
    activeFolder.style.opacity = String(1 - 0.25 * progress);
  }
  if (copy) {
    copy.style.transform = `translate3d(${-direction * 12 * progress}px, 0, 0)`;
    copy.style.opacity = String(1 - 0.55 * progress);
  }
}

function schedulePortfolioWheelReset() {
  window.clearTimeout(portfolioWheelResetTimer);
  portfolioWheelResetTimer = window.setTimeout(() => {
    portfolioWheelAccumulated = 0;
    applyPortfolioWheelPreview(0);
  }, 700);
}

function changePortfolioRecord(direction) {
  if (state.activeSection !== 'work' || state.portfolioDetailOpen || portfolioWheelLock) return;
  portfolioWheelLock = true;
  portfolioWheelAccumulated = 0;
  window.clearTimeout(portfolioWheelResetTimer);
  const panel = document.querySelector('#panel-content');
  const player = panel.querySelector('.portfolio-player');
  panel.classList.add('portfolio-record-changing');
  player?.classList.add('is-transition-out', direction > 0 ? 'is-next' : 'is-prev');
  player?.querySelector('.portfolio-folder.is-active')?.style.removeProperty('transform');
  player?.querySelector('.portfolio-folder.is-active')?.style.removeProperty('opacity');
  player?.querySelector('.portfolio-copy')?.style.removeProperty('transform');
  player?.querySelector('.portfolio-copy')?.style.removeProperty('opacity');
  window.setTimeout(() => {
    state.activePortfolioRecord = wrapSkillIndex(state.activePortfolioRecord + direction, portfolioRecords.length);
    state.portfolioDetailOpen = false;
    renderPanel('work');
    const nextPlayer = panel.querySelector('.portfolio-player');
    nextPlayer?.classList.add('is-transition-prep', direction > 0 ? 'is-next' : 'is-prev');
    nextPlayer?.getBoundingClientRect();
    nextPlayer?.classList.remove('is-transition-prep');
    window.setTimeout(() => {
      panel.classList.remove('portfolio-record-changing');
      nextPlayer?.classList.remove('is-next', 'is-prev');
      portfolioWheelLock = false;
    }, 220);
  }, 170);
}

function selectTile(id) {
  const tile = state.tiles.find((item) => item.id === id);
  if (!tile) return;
  state.selectedTile = id;
  state.portfolioDetailOpen = false;
  state.activeSection = tile.kind;
  document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('is-active', link.dataset.section === tile.kind));
  renderPanel(tile.kind);
  openPanel();
  const object = interactiveObjects.get(id);
  if (object) {
    const restScale = object.userData.restScale || new THREE.Vector3(1, 1, 1);
    gsap.to(object.scale, {
      x: restScale.x * 1.18,
      y: restScale.y * 1.18,
      z: restScale.z * 1.18,
      duration: 0.35,
      yoyo: true,
      repeat: 1,
    });
    const displayModel = object.userData.displayModel;
    if (displayModel) {
      const restDisplayScale = displayModel.userData.restScale || displayModel.scale.clone();
      displayModel.userData.restScale = restDisplayScale;
      gsap.to(displayModel.scale, {
        x: restDisplayScale.x * 1.08,
        y: restDisplayScale.y * 1.08,
        z: restDisplayScale.z * 1.08,
        duration: 0.35,
        yoyo: true,
        repeat: 1,
      });
    }
  }
}

function openPanel() {
  const panel = document.querySelector('.detail-panel');
  const scrim = document.querySelector('.panel-scrim');
  panel.classList.add('is-open');
  scrim.classList.add('is-open');
  scrim.setAttribute('aria-hidden', 'false');
  gsap.fromTo(panel, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'power3.out' });
}

function openPortfolioDetail() {
  if (state.activeSection !== 'work') return;
  const panel = document.querySelector('.detail-panel');
  state.portfolioDetailOpen = true;
  panel.classList.remove('detail-panel--skills', 'detail-panel--portfolio');
  panel.classList.add('detail-panel--portfolio-detail');
  document.querySelector('.panel-index').textContent = `02 / WORK / ${String(state.activePortfolioRecord + 1).padStart(2, '0')}`;
  document.querySelector('#panel-content').innerHTML = renderPortfolioDetail(
    portfolioRecords[state.activePortfolioRecord],
    state.activePortfolioRecord,
    portfolioRecords.length,
  );
}

const adminEscape = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

async function adminRequest(url, options = {}) {
  const headers = new Headers(options.headers || {});
  if (state.adminToken) headers.set('Authorization', `Bearer ${state.adminToken}`);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(url, { ...options, headers });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || `请求失败 (${response.status})`);
  return payload;
}

function renderAdminFolders(folders) {
  const container = document.querySelector('[data-admin-folders]');
  if (!container) return;
  container.innerHTML = folders.map((folder) => `
    <section class="admin-folder" data-admin-folder="${adminEscape(folder.id)}">
      <div class="admin-folder-head"><input class="admin-folder-name" value="${adminEscape(folder.title)}" aria-label="文件夹名称" /><button class="admin-small-button" type="button" data-admin-rename-folder>保存名称</button><button class="admin-small-button admin-danger" type="button" data-admin-delete-folder>删除空文件夹</button></div>
      <label class="admin-upload"><span>上传文件</span><input type="file" multiple data-admin-upload /><button class="admin-action" type="button" data-admin-upload-submit>上传到此文件夹</button></label>
      <div class="admin-file-list">${folder.files.length ? folder.files.map((file) => `<div class="admin-file" data-admin-file="${adminEscape(file.name)}"><span class="admin-file-name" title="${adminEscape(file.name)}">${adminEscape(file.name)}</span><select class="admin-file-folder" aria-label="移动 ${adminEscape(file.name)}"></select><input class="admin-file-new-name" value="${adminEscape(file.name)}" aria-label="重命名 ${adminEscape(file.name)}" /><button class="admin-small-button" type="button" data-admin-save-file>保存</button><button class="admin-small-button admin-danger" type="button" data-admin-delete-file>删除</button></div>`).join('') : '<p class="admin-empty">暂无文件</p>'}</div>
    </section>
  `).join('');
  container.querySelectorAll('.admin-file-folder').forEach((select) => {
    folders.forEach((item) => select.add(new Option(item.title, item.id)));
    select.closest('.admin-folder') && (select.value = select.closest('.admin-folder').dataset.adminFolder);
  });
}

async function refreshAdminFolders() {
  const payload = await adminRequest('/api/portfolio');
  renderAdminFolders(payload.folders || []);
  return payload.folders || [];
}

function openAdminModal() {
  const modal = document.querySelector('#admin-modal');
  state.adminOpen = true;
  modal.setAttribute('aria-hidden', 'false');
  const login = modal.querySelector('[data-admin-login]');
  const workspace = modal.querySelector('[data-admin-workspace]');
  login.hidden = Boolean(state.adminToken);
  workspace.hidden = !state.adminToken;
  if (state.adminToken) refreshAdminFolders().catch((error) => { state.adminToken = ''; sessionStorage.removeItem('cabinet-admin-token'); login.hidden = false; workspace.hidden = true; modal.querySelector('[data-admin-error]').textContent = error.message; });
  else modal.querySelector('[data-admin-password]')?.focus();
}

function closeAdminModal() {
  state.adminOpen = false;
  document.querySelector('#admin-modal').setAttribute('aria-hidden', 'true');
}

async function adminLogin() {
  const modal = document.querySelector('#admin-modal');
  const password = modal.querySelector('[data-admin-password]').value;
  const error = modal.querySelector('[data-admin-error]');
  try {
    const result = await adminRequest('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
    state.adminToken = result.token;
    sessionStorage.setItem('cabinet-admin-token', state.adminToken);
    modal.querySelector('[data-admin-login]').hidden = true;
    modal.querySelector('[data-admin-workspace]').hidden = false;
    await refreshAdminFolders();
  } catch (requestError) { error.textContent = requestError.message; }
}

async function reloadPortfolioAfterAdminChange() {
  await loadPortfolioRecords();
  if (state.activeSection === 'work' && !state.portfolioDetailOpen) renderPanel('work');
  await refreshAdminFolders();
}

document.querySelector('[data-admin-open]').addEventListener('click', openAdminModal);
document.querySelector('[data-admin-close]').addEventListener('click', closeAdminModal);
document.querySelector('.admin-login-submit').addEventListener('click', adminLogin);
document.querySelector('[data-admin-password]').addEventListener('keydown', (event) => { if (event.key === 'Enter') adminLogin(); });
document.querySelector('[data-admin-logout]').addEventListener('click', async () => {
  try { await adminRequest('/api/admin/logout', { method: 'POST' }); } catch { /* local session still gets cleared */ }
  state.adminToken = '';
  sessionStorage.removeItem('cabinet-admin-token');
  openAdminModal();
});
document.querySelector('[data-admin-new-folder]').addEventListener('click', async () => {
  const name = window.prompt('新文件夹名称');
  if (!name) return;
  try { await adminRequest('/api/admin/folders', { method: 'POST', body: JSON.stringify({ name }) }); await reloadPortfolioAfterAdminChange(); }
  catch (error) { window.alert(error.message); }
});
document.querySelector('[data-admin-folders]').addEventListener('click', async (event) => {
  const folderElement = event.target.closest('[data-admin-folder]');
  if (!folderElement) return;
  const folder = folderElement.dataset.adminFolder;
  try {
    if (event.target.closest('[data-admin-rename-folder]')) {
      const name = folderElement.querySelector('.admin-folder-name').value;
      await adminRequest(`/api/admin/folders/${encodeURIComponent(folder)}`, { method: 'PATCH', body: JSON.stringify({ name }) });
      await reloadPortfolioAfterAdminChange();
    }
    if (event.target.closest('[data-admin-delete-folder]')) {
      if (!window.confirm(`确定删除空文件夹“${folder}”吗？`)) return;
      await adminRequest(`/api/admin/folders/${encodeURIComponent(folder)}`, { method: 'DELETE' });
      await reloadPortfolioAfterAdminChange();
    }
    if (event.target.closest('[data-admin-upload-submit]')) {
      const input = folderElement.querySelector('[data-admin-upload]');
      if (!input.files.length) throw new Error('请选择需要上传的文件');
      const form = new FormData(); form.set('folder', folder); [...input.files].forEach((file) => form.append('files', file));
      await adminRequest('/api/admin/files', { method: 'POST', body: form });
      await reloadPortfolioAfterAdminChange();
    }
    const fileElement = event.target.closest('[data-admin-file]');
    if (fileElement && event.target.closest('[data-admin-save-file]')) {
      const sourceFolder = folderElement.dataset.adminFolder;
      await adminRequest('/api/admin/files', { method: 'PATCH', body: JSON.stringify({ sourceFolder, targetFolder: fileElement.querySelector('.admin-file-folder').value, fileName: fileElement.dataset.adminFile, newName: fileElement.querySelector('.admin-file-new-name').value }) });
      await reloadPortfolioAfterAdminChange();
    }
    if (fileElement && event.target.closest('[data-admin-delete-file]')) {
      if (!window.confirm(`确定删除“${fileElement.dataset.adminFile}”吗？`)) return;
      await adminRequest('/api/admin/files', { method: 'DELETE', body: JSON.stringify({ folder, fileName: fileElement.dataset.adminFile }) });
      await reloadPortfolioAfterAdminChange();
    }
  } catch (error) { window.alert(error.message); }
});

function getActivePortfolioImages() {
  return portfolioRecords[state.activePortfolioRecord].files.filter((file) => file.visual);
}

function updatePortfolioLightbox() {
  const lightbox = document.querySelector('#portfolio-lightbox');
  const images = getActivePortfolioImages();
  if (state.portfolioLightboxIndex === null || images.length === 0) return;
  state.portfolioLightboxIndex = ((state.portfolioLightboxIndex % images.length) + images.length) % images.length;
  const image = images[state.portfolioLightboxIndex];
  const imageElement = lightbox.querySelector('.portfolio-lightbox-image');
  imageElement.src = image.url;
  imageElement.alt = image.name;
  lightbox.querySelector('.portfolio-lightbox-name').textContent = image.name;
  lightbox.querySelector('.portfolio-lightbox-count').textContent = `${String(state.portfolioLightboxIndex + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`;
  lightbox.querySelectorAll('[data-lightbox-direction]').forEach((button) => { button.hidden = images.length < 2; });
}

function openPortfolioLightbox(index) {
  const images = getActivePortfolioImages();
  if (!state.portfolioDetailOpen || images.length === 0) return;
  state.portfolioLightboxIndex = Number.isInteger(index) ? index : 0;
  updatePortfolioLightbox();
  const lightbox = document.querySelector('#portfolio-lightbox');
  lightbox.setAttribute('aria-hidden', 'false');
  lightbox.querySelector('[data-lightbox-close]').focus();
}

function closePortfolioLightbox() {
  const lightbox = document.querySelector('#portfolio-lightbox');
  if (lightbox.getAttribute('aria-hidden') === 'true') return false;
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.querySelector('.portfolio-lightbox-image').removeAttribute('src');
  state.portfolioLightboxIndex = null;
  return true;
}

function stepPortfolioLightbox(direction) {
  if (state.portfolioLightboxIndex === null) return;
  state.portfolioLightboxIndex += direction;
  updatePortfolioLightbox();
}

function closePanel() {
  closePortfolioLightbox();
  const panel = document.querySelector('.detail-panel');
  const scrim = document.querySelector('.panel-scrim');
  scrim.classList.remove('is-open');
  scrim.setAttribute('aria-hidden', 'true');
  gsap.to(panel, { autoAlpha: 0, scale: 0.94, duration: 0.28, ease: 'power3.in', onComplete: () => panel.classList.remove('is-open') });
  state.activeSection = ['skills', 'work'].includes(state.activeSection) ? 'home' : state.activeSection;
  state.portfolioDetailOpen = false;
  skillPointerStartY = null;
  skillWheelAccumulated = 0;
  window.clearTimeout(skillWheelResetTimer);
  portfolioPointerStartY = null;
  portfolioWheelAccumulated = 0;
  window.clearTimeout(portfolioWheelResetTimer);
}

function restoreTiles() {
  const saved = localStorage.getItem('cabinet-tiles');
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    parsed.forEach((savedTile) => {
      const tile = state.tiles.find((item) => item.id === savedTile.id);
      const object = interactiveObjects.get(savedTile.id);
      if (tile && Array.isArray(savedTile.position)) tile.position = savedTile.position;
      if (object && savedTile.id === 'notes' && Array.isArray(savedTile.position)) object.position.fromArray(savedTile.position);
    });
    // Positions are retained for future DOM/3D note layouts.
  } catch { /* ignore malformed local state */ }
}

function openEditor(id) {
  const tile = state.tiles.find((item) => item.id === id); if (!tile) return;
  const saved = JSON.parse(localStorage.getItem(`cabinet-note-${id}`) || 'null');
  document.querySelector('#note-title').value = saved?.title || tile.label;
  document.querySelector('#note-body').value = saved?.body || content[id]?.body || '记录一些此刻正在发生的想法。';
  document.querySelector('#editor-modal').dataset.tile = id;
  document.querySelector('#editor-modal').setAttribute('aria-hidden', 'false');
}

function closeEditor() { document.querySelector('#editor-modal').setAttribute('aria-hidden', 'true'); }
document.querySelector('.editor-close').addEventListener('click', closeEditor);
document.querySelector('.editor-cancel').addEventListener('click', closeEditor);
document.querySelector('.editor-save').addEventListener('click', () => {
  const id = document.querySelector('#editor-modal').dataset.tile;
  localStorage.setItem(`cabinet-note-${id}`, JSON.stringify({ title: document.querySelector('#note-title').value, body: document.querySelector('#note-body').value }));
  if (id === 'notes') content.notes.body = document.querySelector('#note-body').value;
  closeEditor(); selectTile(id);
});
document.querySelector('.panel-close').addEventListener('click', closePanel);
document.querySelector('.panel-scrim').addEventListener('click', closePanel);
document.querySelector('#panel-content').addEventListener('click', (event) => {
  const portfolioImage = event.target.closest('[data-portfolio-image]');
  if (portfolioImage) {
    openPortfolioLightbox(Number(portfolioImage.dataset.portfolioImage));
    return;
  }
  const portfolioOpen = event.target.closest('[data-portfolio-open]');
  if (portfolioOpen) {
    openPortfolioDetail();
    return;
  }
  const portfolioBack = event.target.closest('[data-portfolio-back]');
  if (portfolioBack) {
    state.portfolioDetailOpen = false;
    renderPanel('work');
    return;
  }
  const button = event.target.closest('[data-skill-direction]');
  if (button) changeSkillRecord(Number(button.dataset.skillDirection));
  const portfolioButton = event.target.closest('[data-portfolio-direction]');
  if (portfolioButton) changePortfolioRecord(Number(portfolioButton.dataset.portfolioDirection));
});
document.querySelector('#panel-content').addEventListener('keydown', (event) => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.closest('[data-portfolio-open]')) {
    event.preventDefault();
    openPortfolioDetail();
  }
});
document.querySelector('#panel-content').addEventListener('wheel', (event) => {
  if (!['skills', 'work'].includes(state.activeSection) || state.portfolioDetailOpen) return;
  event.preventDefault();
  if (state.activeSection === 'skills' && (skillWheelLock || Math.abs(event.deltaY) < 2)) return;
  if (state.activeSection === 'work' && (portfolioWheelLock || Math.abs(event.deltaY) < 2)) return;
  const modeMultiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? 120 : 1;
  const delta = THREE.MathUtils.clamp(event.deltaY * modeMultiplier, -120, 120);
  if (state.activeSection === 'work') {
    portfolioWheelAccumulated = THREE.MathUtils.clamp(portfolioWheelAccumulated + delta, -portfolioWheelThreshold, portfolioWheelThreshold);
    applyPortfolioWheelPreview();
    if (Math.abs(portfolioWheelAccumulated) < portfolioWheelThreshold) {
      schedulePortfolioWheelReset();
      return;
    }
    changePortfolioRecord(Math.sign(portfolioWheelAccumulated));
    return;
  }
  skillWheelAccumulated = THREE.MathUtils.clamp(skillWheelAccumulated + delta, -skillWheelThreshold, skillWheelThreshold);
  applySkillWheelPreview();
  if (Math.abs(skillWheelAccumulated) < skillWheelThreshold) {
    scheduleSkillWheelReset();
    return;
  }
  changeSkillRecord(Math.sign(skillWheelAccumulated));
}, { passive: false });
document.querySelector('#panel-content').addEventListener('pointerdown', (event) => {
  if (state.activeSection === 'skills') skillPointerStartY = event.clientY;
  if (state.activeSection === 'work' && !state.portfolioDetailOpen) portfolioPointerStartY = event.clientY;
});
document.querySelector('#panel-content').addEventListener('pointerup', (event) => {
  if (state.activeSection === 'skills' && skillPointerStartY !== null) {
    const delta = skillPointerStartY - event.clientY;
    skillPointerStartY = null;
    if (Math.abs(delta) >= 42) changeSkillRecord(delta > 0 ? 1 : -1);
  }
  if (state.activeSection === 'work' && portfolioPointerStartY !== null) {
    const delta = portfolioPointerStartY - event.clientY;
    portfolioPointerStartY = null;
    if (Math.abs(delta) >= 42) changePortfolioRecord(delta > 0 ? 1 : -1);
  }
});
document.querySelector('#portfolio-lightbox').addEventListener('click', (event) => {
  const directionButton = event.target.closest('[data-lightbox-direction]');
  if (directionButton) {
    stepPortfolioLightbox(Number(directionButton.dataset.lightboxDirection));
    return;
  }
  if (event.target.closest('[data-lightbox-close]') || event.target.id === 'portfolio-lightbox') closePortfolioLightbox();
});
window.addEventListener('keydown', (event) => {
  const lightboxOpen = state.portfolioLightboxIndex !== null;
  if (lightboxOpen && event.key === 'ArrowLeft') stepPortfolioLightbox(-1);
  if (lightboxOpen && event.key === 'ArrowRight') stepPortfolioLightbox(1);
  if (event.key === 'Escape') {
    if (closePortfolioLightbox()) return;
    closePanel();
  }
});
document.querySelectorAll('[data-section]').forEach((button) => button.addEventListener('click', () => {
  const section = button.dataset.section; state.activeSection = section;
  document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('is-active', link.dataset.section === section));
  if (section === 'home') { renderPanel('home'); closePanel(); return; }
  const object = interactiveObjects.get(section);
  if (object?.visible) selectTile(section);
  else { renderPanel(section); openPanel(); }
}));

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hoveredObject = null;
let dragState = null;
const dragPlane = new THREE.Plane();
const dragPoint = new THREE.Vector3();
const dragNormal = new THREE.Vector3();
const dragQuaternion = new THREE.Quaternion();

function raycastInteractive(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects([...interactiveObjects.values()], true).find((item) => (
    item.object.visible
    && item.object.name !== 'hover-outline'
    && item.object.name !== 'hover-glow'
  ));
  if (!hit) return null;
  let interactiveRoot = hit.object;
  while (interactiveRoot.parent && !interactiveRoot.userData?.id) interactiveRoot = interactiveRoot.parent;
  return { ...hit, object: interactiveRoot };
}

function updateRay(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
}

function setHoveredObject(object) {
  if (hoveredObject === object) return;
  if (hoveredObject) animateHoverScale(hoveredObject, false);
  hoveredObject = object || null;
  if (hoveredObject) animateHoverScale(hoveredObject, true);
  canvas.style.cursor = hoveredObject ? (hoveredObject.userData.draggable ? 'grab' : 'pointer') : 'default';
}

function animateHoverScale(object, active) {
  if (object.userData.noHoverScale) return;
  const displayModel = object.userData.displayModel;
  if (displayModel && displayModel !== object) {
    const displayBaseScale = displayModel.userData.restScale || displayModel.userData.hoverBaseScale || displayModel.scale.clone();
    displayModel.userData.hoverBaseScale = displayBaseScale;
    const factor = active ? 1.045 : 1;
    gsap.to(displayModel.scale, {
      x: displayBaseScale.x * factor,
      y: displayBaseScale.y * factor,
      z: displayBaseScale.z * factor,
      duration: 0.22,
      ease: 'power2.out',
      overwrite: true,
    });
    return;
  }
  const baseScale = object.userData.restScale || object.userData.hoverBaseScale || object.scale.clone();
  object.userData.hoverBaseScale = baseScale;
  const factor = active ? 1.045 : 1;
  gsap.to(object.scale, {
    x: baseScale.x * factor,
    y: baseScale.y * factor,
    z: baseScale.z * factor,
    duration: 0.22,
    ease: 'power2.out',
    overwrite: true,
  });

}

canvas.addEventListener('pointermove', (event) => {
  if (!state.introComplete) return;
  if (event.pointerType === 'mouse') {
    const rect = canvas.getBoundingClientRect();
    const normalizedX = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    cabinetPointerSwayTarget = normalizedX * cabinetPointerSwayMax;
  }
  if (dragState) {
    updateRay(event);
    if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
      const localPoint = dragState.parent.worldToLocal(dragPoint.clone()).add(dragState.offset);
      const bounds = dragState.object.userData.dragBounds;
      dragState.object.position.x = THREE.MathUtils.clamp(localPoint.x, bounds.minX, bounds.maxX);
      dragState.object.position.y = THREE.MathUtils.clamp(localPoint.y, bounds.minY, bounds.maxY);
      dragState.object.position.z = bounds.z;
      dragState.moved = true;
    }
    return;
  }
  const hit = raycastInteractive(event);
  setHoveredObject(hit?.object || null);
});

canvas.addEventListener('pointerleave', () => {
  cabinetPointerSwayTarget = 0;
});

canvas.addEventListener('pointerdown', (event) => {
  if (!state.introComplete) return;
  const hit = raycastInteractive(event);
  if (!hit?.object?.userData?.id) return;
  const object = hit.object;
  if (object.userData.draggable && object.userData.id === 'notes') {
    const parent = object.parent;
    parent.getWorldQuaternion(dragQuaternion);
    dragNormal.set(0, 0, 1).applyQuaternion(dragQuaternion).normalize();
    dragPlane.setFromNormalAndCoplanarPoint(dragNormal, object.getWorldPosition(new THREE.Vector3()));
    if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
      const localPoint = parent.worldToLocal(dragPoint.clone());
      dragState = { object, parent, offset: object.position.clone().sub(localPoint), moved: false };
      canvas.setPointerCapture?.(event.pointerId);
      canvas.style.cursor = 'grabbing';
    }
    return;
  }
  selectTile(object.userData.id);
});

canvas.addEventListener('pointerup', (event) => {
  if (!dragState) return;
  const moved = dragState.moved;
  const object = dragState.object;
  dragState = null;
  canvas.releasePointerCapture?.(event.pointerId);
  canvas.style.cursor = 'pointer';
  if (object.userData.id === 'notes') {
    const saved = state.tiles.map((tile) => ({ id: tile.id, position: tile.id === 'notes' ? object.position.toArray() : tile.position }));
    localStorage.setItem('cabinet-tiles', JSON.stringify(saved));
  }
  if (!moved) selectTile(object.userData.id);
});

restoreTiles(); renderTiles(); renderPanel();

function animateIntro() {
  const percent = document.querySelector('#load-percent');
  const progress = { value: 0 };
  let introHandoffComplete = false;
  const finishWelcome = () => {
    if (introHandoffComplete) return;
    introHandoffComplete = true;
    const welcome = document.querySelector('#welcome');
    if (welcome) {
      gsap.killTweensOf(welcome);
      welcome.remove();
    }
    openCabinet();
  };
  gsap.to(progress, { value: 100, duration: 2.2, ease: 'power2.inOut', onUpdate: () => { percent.textContent = `${String(Math.round(progress.value)).padStart(2, '0')}%`; } });
  gsap.fromTo('.pour-fill', { scaleX: 0 }, { scaleX: 1, duration: 2.15, ease: 'power2.inOut' });
  gsap.fromTo('.welcome-word', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
  gsap.to('#welcome', { opacity: 0, duration: 0.6, delay: 2.45, onComplete: finishWelcome });
  window.setTimeout(finishWelcome, 3600);
}

function openCabinet() {
  openRequested = true;
  const completeCabinetOpen = () => {
    if (state.introComplete) return;
    state.introComplete = true;
    document.body.classList.add('is-ready');
    if (!importedCabinet) showInteriorObjects({ animate: false });
  };
  if (importedDoorPivot) {
    animateImportedDoor();
  } else if (importedOpenAction) {
    showInteriorObjects({ animate: true });
    scheduleInteriorReveal(0.42);
    importedOpenAction.reset().play();
    gsap.delayedCall(1.6, completeCabinetOpen);
    window.setTimeout(completeCabinetOpen, 1800);
  } else if (importedCabinet) {
    showInteriorObjects({ animate: true });
    scheduleInteriorReveal(0.42);
    gsap.fromTo(importedCabinet.rotation, { y: -0.12 }, { y: 0, duration: 1.6, ease: 'power4.inOut', onComplete: completeCabinetOpen });
    window.setTimeout(completeCabinetOpen, 1800);
  } else {
    showInteriorObjects({ animate: true });
    scheduleInteriorReveal(0.42);
    gsap.to(leftDoor.pivot.rotation, { y: -Math.PI * 0.52, duration: 1.6, ease: 'power4.inOut' });
    gsap.to(rightDoor.pivot.rotation, { y: Math.PI * 0.52, duration: 1.6, ease: 'power4.inOut', onComplete: completeCabinetOpen });
    window.setTimeout(completeCabinetOpen, 1800);
  }
}

function animateImportedDoor() {
  if (!importedDoorPivot || importedDoorOpen) return;
  importedDoorOpen = true;
  showInteriorObjects({ animate: true });
  gsap.to(importedDoorPivot.rotation, {
    y: doorOpenAngle,
    duration: 2.15,
    ease: 'power3.inOut',
    onUpdate: updateInteriorRevealFromDoor,
    onComplete: completeImportedCabinetOpen,
  });
  // Background tabs may throttle GSAP frames; keep the completed scene usable.
  window.setTimeout(completeImportedCabinetOpen, 2350);
}

function completeImportedCabinetOpen() {
  if (!importedDoorPivot) return;
  importedDoorPivot.rotation.y = doorOpenAngle;
  if (!state.introComplete) {
    state.introComplete = true;
    document.body.classList.add('is-ready');
  }
  showInteriorObjects({ animate: false });
  cameraTargetZ = 15.4;
  window.__cameraTargetZ = cameraTargetZ;
  gsap.to(camera.position, {
    z: cameraTargetZ,
    duration: 1.45,
    ease: 'power3.inOut',
    onUpdate: () => camera.lookAt(cameraFocus),
    onComplete: () => camera.lookAt(cameraFocus),
  });
}

function updateCameraLook() {
  camera.lookAt(cameraFocus);
}

function resize() {
  const rect = canvas.parentElement.getBoundingClientRect(); camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix(); renderer.setSize(rect.width, rect.height, false);
}
window.addEventListener('resize', resize); resize(); animateIntro();
loadPortfolioRecords().then(() => {
  if (state.activeSection === 'work' && !state.portfolioDetailOpen) renderPanel('work');
}).catch(() => {});

canvas.addEventListener('wheel', (event) => {
  if (!state.introComplete) return;
  event.preventDefault();
  cameraTargetZ = THREE.MathUtils.clamp(cameraTargetZ + event.deltaY * 0.012, cameraMinZ, cameraMaxZ);
  window.__cameraTargetZ = cameraTargetZ;
  gsap.to(camera.position, {
    z: cameraTargetZ,
    duration: 0.42,
    ease: 'power2.out',
    overwrite: true,
    onUpdate: updateCameraLook,
  });
}, { passive: false });

const clock = new THREE.Clock();
function loop() {
  const delta = clock.getDelta();
  const t = clock.elapsedTime;
  // Frame-rate independent damping keeps pointer motion fluid while preserving momentum.
  const swaySmoothing = 1 - Math.exp(-delta * 5.5);
  cabinetPointerSway += (cabinetPointerSwayTarget - cabinetPointerSway) * swaySmoothing;
  if (importedMixer) importedMixer.update(delta);
  interactiveObjects.forEach((mesh, id) => {
    const placement = interactivePlacements[id];
    if (!placement || (id === 'notes' && mesh.userData.dragBounds)) return;
    const basePosition = mesh.userData.basePosition || new THREE.Vector3(...placement);
    const baseRotationY = mesh.userData.baseRotationY || 0;
    // Keep authored objects seated in the cabinet; only non-physical display pieces get a tiny yaw.
    if (!mesh.userData.revealAnimating) mesh.position.z = basePosition.z;
    mesh.rotation.y = id === 'work' ? baseRotationY : baseRotationY + Math.sin(t * 0.6 + placement[1]) * 0.025;
    const displayModel = mesh.userData.displayModel;
    if (displayModel?.userData.basePosition && !displayModel.userData.revealAnimating) {
      displayModel.position.z = displayModel.userData.basePosition.z;
      displayModel.rotation.y = id === 'work'
        ? displayModel.userData.baseRotationY
        : displayModel.userData.baseRotationY + Math.sin(t * 0.6 + placement[1]) * 0.025;
    }
  });
  cabinet.rotation.y = cabinetPointerSway;
  if (importedCabinet && state.introComplete) importedCabinet.rotation.y = cabinetPointerSway;
  renderer.render(scene, camera); requestAnimationFrame(loop);
}
loop();
