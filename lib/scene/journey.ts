import * as THREE from 'three';
import {provenance} from '@/shared/provenance.mjs';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { pois, getNode, roomBounds } from '@/shared/hospital.mjs';
import { worldPoint, samplePath } from '@/shared/journey.mjs';
import type { createJourney } from '@/shared/journey.mjs';
type Journey = NonNullable<ReturnType<typeof createJourney>>;
export function createJourneyScene(
  host: HTMLElement,
  journey: Journey,
  theme: string,
) {
  const light = theme !== 'spatial';
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(light ? 0xf3f6f4 : 0x0a2030, 1);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.userData.provenance=provenance.originId;
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
  camera.position.set(14, 65, 85);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0);
  controls.enableDamping = true;
  controls.enablePan = true;
  controls.minDistance = 18;
  controls.maxDistance = 210;
  controls.maxPolarAngle = 1.35;
  scene.add(new THREE.HemisphereLight(0xe9ffff, 0x728992, 3));
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.position.set(-25, 60, 30);
  scene.add(sun);
  const objects: THREE.Object3D[] = [];
  const floors: THREE.Group[] = [];
  function box(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color: number,
    opacity = 1,
  ) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        transparent: opacity < 1,
        opacity,
        depthWrite: opacity === 1,
      }),
    );
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  function label(text: string, p: THREE.Vector3, width = 13) {
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 96;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = light ? '#ffffff' : '#102c40';
    ctx.fillRect(0, 0, 640, 96);
    ctx.strokeStyle = light ? '#1b6b7a' : '#69bee5';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 636, 92);
    ctx.fillStyle = light ? '#1a2b24' : '#e7f6ff';
    ctx.font = '600 38px Arial,"PingFang SC"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 320, 48, 610);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map, depthTest: false }),
    );
    s.position.copy(p);
    s.scale.set(width, width * 0.15, 1);
    scene.add(s);
  }
  box(scene, 106, 0.4, 31, 0, -0.5, 1, light ? 0xcfdcd5 : 0x1c3e51);
  box(scene, 99, 0.025, 2.8, 0, -0.2, 12, light ? 0xb4c5bd : 0x315265);
  for (const [id, x, name, count] of [
    ['out', -36, '门诊综合楼', 3],
    ['tech', 0, '医技楼', 1],
    ['ward', 36, '住院楼', 7],
  ] as const) {
    const root = new THREE.Group();
    scene.add(root);
    root.position.x = x;
    for (let f = 1; f <= count; f++) {
      const group = new THREE.Group();
      group.position.y = (f - 1) * 3.2;
      group.userData.level = `${id}-${f}`;
      root.add(group);
      floors.push(group);
      box(group, 25, 0.12, 16, 0, 0, 0, light ? 0x6d9696 : 0x4985a7, 0.12);
      box(group, 25, 2.9, 0.08, 0, 1.5, -8, light ? 0x85a9ae : 0x5d92ae, 0.045);
      // South facade has a real opening centered on the graph entrance (x=620).
      box(
        group,
        19.35,
        2.9,
        0.08,
        -2.825,
        1.5,
        8,
        light ? 0x85a9ae : 0x5d92ae,
        0.045,
      );
      box(
        group,
        3.95,
        2.9,
        0.08,
        10.525,
        1.5,
        8,
        light ? 0x85a9ae : 0x5d92ae,
        0.045,
      );
      box(group, 1.7, 0.05, 3.4, 7.7, 0.02, 9.7, light ? 0xb4c5bd : 0x315265);
      for (const dx of [-12.5, 12.5])
        box(
          group,
          0.08,
          2.9,
          16,
          dx,
          1.5,
          0,
          light ? 0x85a9ae : 0x5d92ae,
          0.045,
        );
      for (const p of pois.filter((p) => p.building === id && p.floor === f)) {
        const bounds = roomBounds(p),
          left = (bounds.left - 400) * 0.035,
          right = (bounds.right - 400) * 0.035;
        const top = (bounds.top - 300) * 0.035,
          bottom = (bounds.bottom - 300) * 0.035;
        const cx = (left + right) / 2,
          cz = (top + bottom) / 2,
          w = right - left,
          d = bottom - top;
        const color = light ? 0xb4ccc1 : 0x365c72;
        box(group, w, 0.1, d, cx, 0.015, cz, color, 0.5);
        box(group, 0.08, 1.25, d, left, 0.65, cz, color, 0.5);
        box(group, 0.08, 1.25, d, right, 0.65, cz, color, 0.5);
        const door = (bounds.doorY - 300) * 0.035,
          back = p.room === 'north' ? top : bottom;
        box(group, w, 1.25, 0.08, cx, 0.65, back, color, 0.5);
        // Two jambs with a 1.4-unit clear doorway; never a solid department block.
        const side = (w - 1.4) / 2;
        box(group, side, 1.25, 0.08, left + side / 2, 0.65, door, color, 0.5);
        box(group, side, 1.25, 0.08, right - side / 2, 0.65, door, color, 0.5);
      }
    }
    label(name, new THREE.Vector3(x, count * 3.2 + 3, 0));
  }
  const routes = new THREE.Group();
  scene.add(routes);
  for (const leg of journey.legs) {
    for (let i = 1; i < leg.points.length; i++) {
      const a = new THREE.Vector3(
          leg.points[i - 1].x,
          leg.points[i - 1].y,
          leg.points[i - 1].z,
        ),
        b = new THREE.Vector3(
          leg.points[i].x,
          leg.points[i].y,
          leg.points[i].z,
        );
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, a.distanceTo(b), 10),
        new THREE.MeshBasicMaterial({ color: light ? 0x1b6b7a : 0x67d6ff }),
      );
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        b.sub(a).normalize(),
      );
      routes.add(m);
    }
  }
  const marker = new THREE.Group();
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 16, 12),
    new THREE.MeshBasicMaterial({ color: light ? 0x1b6b7a : 0xc3f3ff }),
  );
  marker.add(ball);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.1, 8, 32),
    new THREE.MeshBasicMaterial({ color: light ? 0x1b6b7a : 0x88dfff }),
  );
  ring.rotation.x = Math.PI / 2;
  marker.add(ring);
  scene.add(marker);
  const startPosition = worldPoint(journey.path[0]);
  marker.position.set(startPosition.x, startPosition.y + 0.28, startPosition.z);
  const destination = worldPoint(journey.path.at(-1)!);
  label(
    '终点 · ' + getNode(journey.path.at(-1)!).name,
    new THREE.Vector3(destination.x, destination.y + 2.2, destination.z),
    12,
  );
  const pathPoints = journey.legs.flatMap((leg, i) =>
    i ? leg.points.slice(1) : leg.points,
  );
  const lengths = journey.legs.map((leg) =>
    leg.points
      .slice(1)
      .reduce(
        (sum, p, i) =>
          sum +
          Math.hypot(
            p.x - leg.points[i].x,
            p.y - leg.points[i].y,
            p.z - leg.points[i].z,
          ),
        0,
      ),
  );
  let desiredDistance = 0,
    displayDistance = 0;
  let currentLevel = '';
  function setProgress(index: number, fraction: number) {
    const leg = journey.legs[index];
    if (!leg) return;
    desiredDistance =
      lengths.slice(0, index).reduce((sum, n) => sum + n, 0) +
      lengths[index] * fraction;
    const level = fraction === 1 ? leg.nextLevel : leg.level;
    if (level !== currentLevel) {
      currentLevel = level;
      floors.forEach((group) =>
        group.children.forEach((child, i) => {
          const mat = (child as THREE.Mesh)
            .material as THREE.MeshStandardMaterial;
          const active = group.userData.level === level;
          mat.opacity = active
            ? i === 0
              ? 0.85
              : i < 5
                ? 0.12
                : 0.9
            : i === 0
              ? 0.1
              : i < 5
                ? 0.025
                : 0.08;
          mat.transparent = true;
          mat.depthWrite = false;
        }),
      );
    }
  }
  const resize = () => {
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(host.clientWidth, host.clientHeight);
    if (host.clientWidth < 600) camera.position.set(5, 115, 140);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  setProgress(0, 0);
  let frame = 0;
  let stopped = false;
  function render() {
    if (stopped) return;
    frame = requestAnimationFrame(render);
    if (document.hidden) return;
    // Smooth scalar distance, then sample the polyline: no diagonal corner cutting.
    displayDistance += (desiredDistance - displayDistance) * 0.18;
    const p = samplePath(pathPoints, displayDistance);
    if (p) marker.position.set(p.x, p.y + 0.28, p.z);
    controls.update();
    renderer.render(scene, camera);
  }
  render();
  return {
    setProgress,
    reset() {
      camera.position.set(
        host.clientWidth < 600 ? 5 : 14,
        host.clientWidth < 600 ? 115 : 65,
        host.clientWidth < 600 ? 140 : 85,
      );
      controls.target.set(0, 1, 0);
    },
    dispose() {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material)
          for (const m of Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]) {
            (m as THREE.MeshBasicMaterial).map?.dispose();
            m.dispose();
          }
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
