import * as THREE from 'three';
import {provenance} from '@/shared/provenance.mjs';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export type BuildingId = 'out' | 'tech' | 'ward';
export const campusBuildings = [
  {
    id: 'out' as BuildingId,
    name: '门诊综合楼',
    en: 'OUTPATIENT CENTER',
    x: -4,
    z: 3,
    w: 8,
    d: 5.8,
    floors: 3,
    story: 1.65,
    open: '1F — 3F',
    description: '从签到到取药，让每一站清晰相连。',
    services: ['门诊服务', '专科诊室', '西药房'],
    number: '01',
  },
  {
    id: 'tech' as BuildingId,
    name: '医技中心',
    en: 'DIAGNOSTIC CENTER',
    x: 6.3,
    z: -1.2,
    w: 6,
    d: 5,
    floors: 1,
    story: 2.7,
    open: '1F',
    description: 'CT、磁共振与超声检查，在这里找到下一站。',
    services: ['CT 检查', '医学影像', '报告领取'],
    number: '02',
  },
  {
    id: 'ward' as BuildingId,
    name: '住院楼',
    en: 'INPATIENT BUILDING',
    x: -3.5,
    z: -7.2,
    w: 5.2,
    d: 4.6,
    floors: 7,
    story: 1.05,
    open: '1F 开放',
    description: '入院办理与住院服务，从容开启新的旅程。',
    services: ['入院办理', '家属休息', '生活服务'],
    number: '03',
  },
];

type Options = {
  onSelect: (id: BuildingId) => void;
  onReady: () => void;
  onError: () => void;
  labels: HTMLElement[];
};
export function createCampus(host: HTMLElement, options: Options) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = host.clientWidth < 700;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.4 : 1.8));
  renderer.setSize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x030d18, 0);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.userData.provenance=provenance.originId;
  scene.fog = new THREE.FogExp2(0x071523, 0.012);
  const camera = new THREE.PerspectiveCamera(
    36,
    Math.max(1, host.clientWidth) / Math.max(1, host.clientHeight),
    0.1,
    160,
  );
  const overview = new THREE.Vector3(24, 23, 29).multiplyScalar(
    mobile ? 1.35 : 1,
  );
  camera.position.copy(reduced || mobile ? overview : new THREE.Vector3(37, 37, 48));
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = false;
  controls.minDistance = 16;
  controls.maxDistance = mobile ? 76 : 57;
  controls.minPolarAngle = 0.3;
  controls.maxPolarAngle = Math.PI * 0.44;
  controls.autoRotate = false;
  controls.rotateSpeed = 0.48;
  controls.zoomSpeed = 0.6;
  const hemi = new THREE.HemisphereLight(0xb8e0ff, 0x223844, 3.1);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff3df, 4);
  key.position.set(-12, 23, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(key.shadow.camera, {
    left: -22,
    right: 22,
    top: 22,
    bottom: -22,
    near: 0.5,
    far: 70,
  });
  key.shadow.normalBias = 0.04;
  key.shadow.bias = -0.0002;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x60b9ff, 4.5);
  rim.position.set(12, 10, -14);
  scene.add(rim);
  const front = new THREE.DirectionalLight(0xaccdff, 1.3);
  front.position.set(2, 7, 16);
  scene.add(front);
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  function mat(c: number, roughness = 0.5, metalness = 0.2) {
    const m = new THREE.MeshStandardMaterial({
      color: c,
      roughness,
      metalness,
    });
    materials.push(m);
    return m;
  }
  function glow(c: number, intensity = 2) {
    const m = new THREE.MeshStandardMaterial({
      color: c,
      emissive: c,
      emissiveIntensity: intensity,
      roughness: 0.3,
    });
    materials.push(m);
    return m;
  }
  const ivory = mat(0xd5e4ec, 0.32, 0.28),
    edge = mat(0xa8c4d8, 0.28, 0.55),
    glass = mat(0x245676, 0.18, 0.75),
    darkGlass = mat(0x12354c, 0.21, 0.5),
    baseMat = mat(0x0e2434, 0.66, 0.4),
    road = mat(0x162e3b, 0.83, 0.12),
    walk = mat(0x294551, 0.9, 0.1),
    green = mat(0x234c46, 0.9, 0.05),
    treeMat = mat(0x458d7e, 0.8, 0.1),
    trunk = mat(0x52766f, 0.9),
    cyan = glow(0x49c8ff, 2.2),
    warm = glow(0xffce8c, 1.5),
    dimCyan = glow(0x358abc, 0.6);
  function box(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
  ) {
    const geo = new THREE.BoxGeometry(w, h, d);
    geometries.push(geo);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function line(
    points: THREE.Vector3[],
    material: THREE.Material,
    parent: THREE.Object3D = scene,
  ) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.02);
    const geo = new THREE.TubeGeometry(
      curve,
      Math.max(16, points.length * 8),
      0.035,
      5,
      false,
    );
    geometries.push(geo);
    const m = new THREE.Mesh(geo, material);
    parent.add(m);
    return curve;
  }
  const world = new THREE.Group();
  scene.add(world);
  box(world, 29, 0.65, 27, 0, -0.5, 0, baseMat);
  box(world, 28.5, 0.12, 26.5, 0, -0.12, 0, road);
  // Luminous perimeter makes the physical model read as a floating architectural maquette.
  line(
    [
      [-14.2, 0, -13.2],
      [14.2, 0, -13.2],
      [14.2, 0, 13.2],
      [-14.2, 0, 13.2],
      [-14.2, 0, -13.2],
    ].map((p) => new THREE.Vector3(...(p as [number, number, number]))),
    dimCyan,
    world,
  );
  box(world, 26, 0.03, 2.4, 0, 0, 9.8, walk);
  box(world, 2.1, 0.03, 23, 2.1, 0, -0.2, walk);
  for (let i = 0; i < 24; i++)
    box(world, 0.45, 0.012, 0.045, -12 + i, 0.025, 9.8, edge);
  for (let i = 0; i < 19; i++)
    box(world, 0.04, 0.012, 0.4, 2.1, 0.025, -10 + i, edge);
  // Main entry zebra crossing and an illuminated route to the outpatient canopy.
  for (let i = 0; i < 7; i++)
    box(world, 0.22, 0.022, 1.4, -4.85 + i * 0.3, 0.04, 9.8, ivory);
  const routePoints = [
    new THREE.Vector3(-3.9, 0.09, 12.8),
    new THREE.Vector3(-3.9, 0.09, 8),
    new THREE.Vector3(-3.9, 0.09, 6.4),
  ];
  const path = line(routePoints, cyan, world);
  const pinGeo = new THREE.SphereGeometry(0.075, 8, 8);
  geometries.push(pinGeo);
  const particles = Array.from({ length: 6 }, () => {
    const m = new THREE.Mesh(pinGeo, cyan);
    world.add(m);
    return m;
  });
  // Landscape beds, repeated tree crowns and street lights.
  const crownGeo = new THREE.IcosahedronGeometry(0.46, 1);
  geometries.push(crownGeo);
  for (const [x, z, w, d] of [
    [-11, 1, 2.5, 17],
    [10.8, 2, 2.1, 17],
    [-3, 11.8, 17, 1.1],
    [6, -8.7, 6, 2.2],
  ]) {
    box(world, w, 0.14, d, x, 0.05, z, green);
  }
  const treePositions: Array<[number, number]> = [];
  for (let i = 0; i < 9; i++) {
    treePositions.push([-11, -8 + i * 2], [11, -7 + i * 2]);
  }
  for (let i = 0; i < 7; i++) treePositions.push([-9 + i * 2.2, 11.8]);
  for (const [i, [x, z]] of treePositions.entries()) {
    box(world, 0.075, 0.65, 0.075, x, 0.34, z, trunk);
    const t = new THREE.Mesh(crownGeo, treeMat);
    t.position.set(x, 0.9 + (i % 3) * 0.08, z);
    t.scale.set(0.85, 1.4, 0.85);
    t.castShadow = true;
    world.add(t);
  }
  for (let i = 0; i < 7; i++) {
    const x = -10 + i * 3.3;
    box(world, 0.04, 0.6, 0.04, x, 0.32, 8.3, edge);
    box(world, 0.16, 0.045, 0.12, x, 0.65, 8.3, warm);
  }
  // An arrival plaza with concentric inlaid rings.
  for (let r = 0; r < 3; r++) {
    const geo = new THREE.RingGeometry(0.7 + r * 0.32, 0.72 + r * 0.32, 64);
    geometries.push(geo);
    const m = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({
        color: r === 0 ? 0x67caff : 0x406c83,
        side: THREE.DoubleSide,
      }),
    );
    materials.push(m.material);
    m.rotation.x = -Math.PI / 2;
    m.position.set(6.8, 0.025, 6.2);
    world.add(m);
  }
  const selectable: THREE.Object3D[] = [];
  const buildingGroups = new Map<BuildingId, THREE.Group>();
  const splitGroups: THREE.Group[] = [];
  const highlights = new Map<BuildingId, THREE.MeshStandardMaterial>();
  for (const b of campusBuildings) {
    const root = new THREE.Group();
    root.position.set(b.x, 0, b.z);
    world.add(root);
    buildingGroups.set(b.id, root);
    const tint = mat(b.id === 'out' ? 0xcce6f8 : 0xa3bbc9, 0.3, 0.35);
    highlights.set(b.id, tint);
    box(root, b.w + 0.65, 0.17, b.d + 0.65, 0, 0.04, 0, walk);
    for (let f = 0; f < b.floors; f++) {
      const storey = new THREE.Group();
      storey.position.y = 0.18 + f * b.story;
      storey.userData.floor = f;
      root.add(storey);
      if (b.id === 'out') splitGroups.push(storey);
      box(storey, b.w, 0.16, b.d, 0, 0, 0, tint);
      box(
        storey,
        b.w - 0.3,
        b.story - 0.16,
        b.d - 0.3,
        0,
        b.story / 2,
        0,
        b.id === 'ward' ? darkGlass : glass,
      );
      box(storey, b.w + 0.1, 0.12, b.d + 0.1, 0, b.story - 0.05, 0, ivory);
      // Facade mullions and recessed vertical fins produce real shadows.
      for (let i = 0; i <= Math.floor(b.w / 0.65); i++) {
        const x = -b.w / 2 + 0.2 + (i * (b.w - 0.4)) / Math.floor(b.w / 0.65);
        box(storey, 0.055, b.story - 0.15, 0.16, x, b.story / 2, b.d / 2, edge);
        box(
          storey,
          0.055,
          b.story - 0.15,
          0.16,
          x,
          b.story / 2,
          -b.d / 2,
          edge,
        );
      }
      for (let i = 0; i <= Math.floor(b.d / 0.72); i++) {
        const z = -b.d / 2 + 0.2 + (i * (b.d - 0.4)) / Math.floor(b.d / 0.72);
        box(storey, 0.16, b.story - 0.15, 0.055, b.w / 2, b.story / 2, z, edge);
        box(
          storey,
          0.16,
          b.story - 0.15,
          0.055,
          -b.w / 2,
          b.story / 2,
          z,
          edge,
        );
      }
      // Warm occupied windows break the clinical blue facade rhythm.
      for (let i = 0; i < Math.floor(b.w / 1.4); i++)
        if ((i + f) % 3 === 0)
          box(
            storey,
            0.45,
            0.11,
            0.012,
            -b.w / 2 + 0.65 + i * 1.4,
            b.story * 0.6,
            b.d / 2 + 0.005,
            warm,
          );
      if (b.id === 'out') {
        box(
          storey,
          b.w + 0.16,
          0.035,
          0.06,
          0,
          b.story - 0.16,
          b.d / 2 + 0.06,
          dimCyan,
        );
        box(
          storey,
          0.065,
          0.035,
          b.d + 0.15,
          b.w / 2 + 0.06,
          b.story - 0.16,
          0,
          dimCyan,
        );
      }
    }
    const rooftop = new THREE.Group();
    rooftop.position.y = 0.2 + b.floors * b.story;
    root.add(rooftop);
    rooftop.userData.roof = true;
    if (b.id === 'out') {
      rooftop.userData.floor = 2;
      splitGroups.push(rooftop);
    }
    box(rooftop, b.w + 0.15, 0.18, b.d + 0.15, 0, 0, 0, ivory);
    box(rooftop, b.w - 0.55, 0.08, b.d - 0.55, 0, 0.14, 0, green);
    box(rooftop, b.w * 0.35, 0.22, b.d * 0.25, 0, 0.24, -0.3, edge);
    for (let j = 0; j < 4; j++)
      box(
        rooftop,
        0.5,
        0.1,
        1.25,
        -b.w * 0.31 + j * 0.65,
        0.23,
        0.6,
        darkGlass,
      );
    // Roof cross serves as a real architectural sign, visible in the aerial view.
    if (b.id === 'out') {
      box(rooftop, 0.25, 0.07, 1.05, 2.1, 0.23, -1.25, cyan);
      box(rooftop, 1.05, 0.07, 0.25, 2.1, 0.23, -1.25, cyan);
    }
    // Porte-cochere, glass foyer, columns, and illuminated entrance lintel.
    box(root, 2.6, 0.12, 1.5, 0, 1.7, b.d / 2 + 0.65, ivory);
    box(root, 2.5, 0.025, 1.45, 0, 1.61, b.d / 2 + 0.65, dimCyan);
    for (const x of [-1.12, 1.12])
      box(root, 0.07, 1.6, 0.07, x, 0.8, b.d / 2 + 1.15, edge);
    box(root, 1.8, 1.4, 0.04, 0, 0.7, b.d / 2 + 0.02, darkGlass);
    box(root, 0.06, 1.4, 0.08, 0, 0.7, b.d / 2 + 0.07, edge);
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.userData.building = b.id;
        selectable.push(o);
      }
    });
  }
  const grid = new THREE.GridHelper(110, 110, 0x254357, 0x153042);
  grid.position.y = -0.88;
  const gridMaterial = grid.material as THREE.Material;
  gridMaterial.transparent = true;
  gridMaterial.opacity = 0.22;
  materials.push(gridMaterial);
  geometries.push(grid.geometry);
  scene.add(grid);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight)),
    0.32,
    0.55,
    1.35,
  );
  composer.addPass(bloom);
  const output = new OutputPass();
  composer.addPass(output);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let selected: BuildingId = 'out';
  let hover: BuildingId | null = null;
  let expanded = false;
  let disposed = false;
  let frame = 0;
  let entering = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let hidden = document.hidden;
  let tween: {
    from: THREE.Vector3;
    to: THREE.Vector3;
    targetFrom: THREE.Vector3;
    targetTo: THREE.Vector3;
    start: number;
    duration: number;
  } | null = reduced || mobile
    ? null
    : {
        from: camera.position.clone(),
        to: overview.clone(),
        targetFrom: controls.target.clone(),
        targetTo: new THREE.Vector3(0, 1, 0),
        start: performance.now(),
        duration: 2400,
      };
  function focus(id: BuildingId) {
    selected = id;
    const b = campusBuildings.find((b) => b.id === id)!;
    const target = new THREE.Vector3(b.x * 0.55, 1.7, b.z * 0.55);
    tween = {
      from: camera.position.clone(),
      to: new THREE.Vector3(
        target.x + 21 * (mobile ? 1.3 : 1),
        21 * (mobile ? 1.3 : 1),
        target.z + 25 * (mobile ? 1.3 : 1),
      ),
      targetFrom: controls.target.clone(),
      targetTo: target,
      start: performance.now(),
      duration: reduced ? 0 : 1100,
    };
    options.onSelect(id);
  }
  let down = { x: 0, y: 0 };
  function hit(e: PointerEvent) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(selectable, false)[0]?.object.userData
      .building as BuildingId | undefined;
  }
  function pointerDown(e: PointerEvent) {
    down = { x: e.clientX, y: e.clientY };
    if (!entering) tween = null;
  }
  function pointerMove(e: PointerEvent) {
    if (entering) return;
    hover = hit(e) || null;
    renderer.domElement.style.cursor = hover ? 'pointer' : 'grab';
  }
  function pointerUp(e: PointerEvent) {
    if (entering || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6)
      return;
    const id = hit(e);
    if (id) focus(id);
  }
  renderer.domElement.addEventListener('pointerdown', pointerDown);
  renderer.domElement.addEventListener('pointermove', pointerMove);
  renderer.domElement.addEventListener('pointerup', pointerUp);
  function resized() {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
  }
  const observer = new ResizeObserver(resized);
  observer.observe(host);
  function visibility() {
    hidden = document.hidden;
  }
  document.addEventListener('visibilitychange', visibility);
  function contextLost(e: Event) {
    e.preventDefault();
    options.onError();
  }
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  const clock = new THREE.Clock();
  let first = true;
  function animate() {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.04);
    if (hidden) return;
    const t = clock.elapsedTime;
    if (tween) {
      const v = tween.duration
        ? Math.min((performance.now() - tween.start) / tween.duration, 1)
        : 1;
      const k = entering
        ? v * v * v * (v * (v * 6 - 15) + 10)
        : 1 - Math.pow(1 - v, 4);
      camera.position.lerpVectors(tween.from, tween.to, k);
      controls.target.lerpVectors(tween.targetFrom, tween.targetTo, k);
      if (v === 1) tween = null;
    }
    controls.update();
    for (const [id, m] of highlights) {
      m.emissive.setHex(
        id === hover ? 0x2e8dac : id === selected ? 0x145485 : 0x000000,
      );
      m.emissiveIntensity = id === hover ? 0.6 : 0.3;
    }
    for (const g of splitGroups) {
      const floor = g.userData.floor as number;
      const base = g.userData.roof ? 0.2 + 3 * 1.65 : 0.18 + floor * 1.65;
      g.position.y = THREE.MathUtils.lerp(
        g.position.y,
        base + (expanded ? floor * 1.35 : 0),
        reduced ? 1 : 1 - Math.exp(-dt * 5),
      );
    }
    particles.forEach((m, i) =>
      m.position.copy(
        path.getPointAt(reduced ? i / 6 : (t * 0.16 + i / 6) % 1),
      ),
    );
    campusBuildings.forEach((b, i) => {
      const y =
        b.floors * b.story + (b.id === 'out' && expanded ? 2.7 : 0) + 1.3;
      const p = new THREE.Vector3(b.x, y, b.z).project(camera);
      const el = options.labels[i];
      if (el) {
        el.style.transform = `translate(${(p.x * 0.5 + 0.5) * host.clientWidth}px,${(-p.y * 0.5 + 0.5) * host.clientHeight}px) translate(-50%,-100%)`;
        el.style.opacity = entering || p.z > 1 ? '0' : '1';
        el.dataset.active = String(b.id === selected);
      }
    });
    composer.render();
    if (first) {
      first = false;
      options.onReady();
    }
  }
  animate();
  return {
    select: focus,
    overhead() {
      if (entering) return;
      tween = { from: camera.position.clone(), to: new THREE.Vector3(0.1, 52, 12), targetFrom: controls.target.clone(), targetTo: new THREE.Vector3(0, 0, 0), start: performance.now(), duration: reduced ? 0 : 700 };
    },
    expand(value: boolean) {
      expanded = value;
    },
    reset() {
      selected = 'out';
      expanded = false;
      options.onSelect('out');
      tween = {
        from: camera.position.clone(),
        to: overview.clone(),
        targetFrom: controls.target.clone(),
        targetTo: new THREE.Vector3(0, 1, 0),
        start: performance.now(),
        duration: reduced ? 0 : 1200,
      };
    },
    enter(id: BuildingId, done: () => void) {
      if (entering) return;
      entering = true;
      controls.enabled = false;
      expanded = false;
      const b = campusBuildings.find((b) => b.id === id)!;
      tween = {
        from: camera.position.clone(),
        to: new THREE.Vector3(b.x + 4, 5, b.z + b.d / 2 + 8),
        targetFrom: controls.target.clone(),
        targetTo: new THREE.Vector3(b.x, 2, b.z),
        start: performance.now(),
        duration: reduced ? 0 : 900,
      };
      timer = setTimeout(done, reduced ? 0 : 940);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointermove', pointerMove);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      controls.dispose();
      bloom.dispose();
      output.dispose();
      composer.dispose();
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
