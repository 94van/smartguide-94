import * as THREE from 'three';
import {provenance} from '@/shared/provenance.mjs';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  nodes,
  pois,
  edges,
  floors,
  getNode,
  planRoute,
  edgePolyline,
} from '@/shared/hospital.mjs';
import type { HospitalState } from '@/lib/use-hospital';
export type InteriorData = {
  theme?: 'medical' | 'contrast' | 'spatial';
  state: HospitalState;
  level: string;
  target: string | null;
};
export function createInterior(
  host: HTMLElement,
  onSelect: (id: string) => void,
  onError: () => void,
) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.setClearColor(0x0b1b2b, 0);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.userData.provenance=provenance.originId;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 160);
  const home = new THREE.Vector3(25, 23, 31);
  camera.position.copy(home);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 3, 0);
  controls.enableDamping = true;
  controls.enablePan = true;
  controls.minDistance = 3;
  controls.maxDistance = 65;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.dampingFactor = 0.08;
  scene.add(new THREE.HemisphereLight(0xc7ebff, 0x374559, 3));
  const sun = new THREE.DirectionalLight(0xf6f1e9, 3.5);
  sun.position.set(-8, 24, 15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -22,
    right: 22,
    top: 22,
    bottom: -22,
    far: 65,
  });
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x64b7ff, 2);
  rim.position.set(12, 8, -9);
  scene.add(rim);
  let content = new THREE.Group();
  scene.add(content);
  let data: InteriorData;
  let hits: THREE.Object3D[] = [];
  let pulse: THREE.Mesh | null = null;
  let walkPoints: THREE.Vector3[] = [];
  let walking = false;
  let walkProgress = 0;
  let disposed = false;
  let frame = 0;
  let tween: {
    from: THREE.Vector3;
    to: THREE.Vector3;
    focusFrom: THREE.Vector3;
    focusTo: THREE.Vector3;
    t: number;
  } | null = null;
  const pos = (id: string, h = 0.12) => {
    const n = getNode(id);
    return new THREE.Vector3((n.x - 400) * 0.04, h, (n.y - 300) * 0.04);
  };
  function material(color: number, emissive = 0) {
    if (data?.theme !== 'spatial') {
      const c = new THREE.Color(color);
      const hsl = { h: 0, s: 0, l: 0 };
      c.getHSL(hsl);
      color = hsl.l < 0.32 ? 0xb8cecd : hsl.l < 0.56 ? 0xcadbd5 : 0xf0f4ec;
    }
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.45,
      metalness: 0.22,
      emissive,
      emissiveIntensity: 0.4,
    });
  }
  function box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color: number,
    id?: string,
  ) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    content.add(m);
    if (id) {
      m.userData.id = id;
      hits.push(m);
    }
    return m;
  }
  function label(
    text: string,
    x: number,
    y: number,
    z: number,
    color = '#bed8e9',
    id?: string,
    small = false,
  ) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = data.theme === 'spatial' ? 'rgba(10,31,49,.9)' : '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(2, 2, 636, 96, 12);
    ctx.fill();
    ctx.strokeStyle =
      data.theme === 'spatial'
        ? id === data.target
          ? '#76d1ff'
          : '#44667e'
        : '#1B6B7A';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = `500 ${small ? 30 : 34}px Arial, "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle =
      data.theme === 'spatial'
        ? color
        : data.theme === 'contrast'
          ? '#111111'
          : '#1A2B24';
    ctx.fillText(text, 320, 50, 600);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: tex,
        depthTest: false,
        transparent: true,
      }),
    );
    s.scale.set(small ? 3.6 : 5.4, small ? 0.56 : 0.84, 1);
    s.position.set(x, y, z);
    s.renderOrder = 5;
    content.add(s);
    if (id) {
      s.userData.id = id;
      hits.push(s);
    }
  }
  function disposeGroup() {
    content.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        for (const mat of Array.isArray(m.material)
          ? m.material
          : [m.material]) {
          const tex = (mat as THREE.MeshBasicMaterial).map;
          if (tex) tex.dispose();
          mat.dispose();
        }
      }
    });
    scene.remove(content);
    content = new THREE.Group();
    scene.add(content);
  }
  function update(next: InteriorData) {
    const changed =
      !data || data.level.split('-')[0] !== next.level.split('-')[0];
    data = next;
    disposeGroup();
    hits = [];
    pulse = null;
    walking = false;
    walkPoints = [];
    const floor = Number(data.level.split('-')[1]) || 1;
    box(28, 0.45, 18, 0, -0.35, 0.3, 0x203b50);
    box(27.5, 0.08, 17.5, 0, -0.08, 0.3, 0x496675);
    // All storeys occupy fixed heights in one building; the selected storey stays solid.
    const count = data.level.startsWith('out')
      ? 3
      : data.level.startsWith('ward')
        ? 7
        : 1;
    const activeY = (floor - 1) * 3.2;
    function ghost(
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      opacity = 0.1,
    ) {
      const m = box(w, h, d, x, y, z, 0x74b5d7);
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.transparent = true;
      mat.opacity = opacity;
      mat.depthWrite = false;
      m.castShadow = false;
      const line = new THREE.LineSegments(
        new THREE.EdgesGeometry(m.geometry),
        new THREE.LineBasicMaterial({
          color: data.theme === 'spatial' ? 0x79b4d3 : 0x41675e,
          transparent: true,
          opacity: 0.32,
          depthWrite: false,
        }),
      );
      line.position.copy(m.position);
      content.add(line);
      return m;
    }
    for (let f = 1; f <= count; f++) {
      const y = (f - floor) * 3.2;
      if (f !== floor) {
        ghost(28, 0.14, 18, 0, y - 0.1, 0.3, 0.08);
        ghost(27.7, 2.85, 0.08, 0, y + 1.4, -8.5, 0.055);
        ghost(27.7, 2.85, 0.08, 0, y + 1.4, 9.1, 0.055);
        ghost(0.08, 2.85, 17.7, -13.8, y + 1.4, 0.3, 0.055);
        ghost(0.08, 2.85, 17.7, 13.8, y + 1.4, 0.3, 0.055);
        for (const x of [-8.8, 0, 8.8])
          ghost(6.4, 1.35, 5, x, y + 0.7, -4.6, 0.035);
      } else {
        for (const z of [-8.7, 9.3]) {
          const band = box(28, 0.06, 0.06, 0, 2.9, z, 0x6bd7ff);
          (band.material as THREE.MeshStandardMaterial).color.setHex(
            data.theme === 'spatial' ? 0x6bd7ff : 0x1b6b7a,
          );
          (band.material as THREE.MeshStandardMaterial).emissive.setHex(
            data.theme === 'spatial' ? 0x37bbff : 0x000000,
          );
        }
      }
      for (const x of [-13.8, 13.8])
        for (const z of [-8.5, 9.1])
          ghost(0.13, 3.1, 0.13, x, y + 1.45, z, 0.22);
      label(
        `${f}F${f === floor ? ' · 当前楼层' : ''}`,
        15.9,
        y + 1.3,
        1.6,
        f === floor ? '#c5f3ff' : '#789bb5',
        f <= (data.level.startsWith('out') ? 3 : 1)
          ? `floor:${data.level.split('-')[0]}-${f}`
          : undefined,
        true,
      );
    }
    ghost(28.2, 0.13, 18.2, 0, count * 3.2 - activeY, 0.3, 0.06);
    box(29, 0.35, 19, 0, -activeY - 0.58, 0.3, 0x143044);
    box(24.6, 0.025, 2.1, 0, 0.015, 0, 0x274354);
    box(1.7, 0.03, 6.4, 4.4, 0.02, 2.8, 0x274354);
    box(1.5, 0.03, 6.4, -12.8, 0.02, 2.8, 0x274354);
    box(1.5, 0.03, 6.4, 12.8, 0.02, 2.8, 0x274354);
    box(18.9, 0.03, 1.5, 0, 0.02, 5.6, 0x274354);
    // Perimeter has low cutaway walls to keep the route visible.
    box(27.5, 0.65, 0.13, 0, 0.32, -8.35, 0x7998aa);
    box(0.13, 0.65, 17.4, -13.7, 0.32, 0.3, 0x7998aa);
    box(0.13, 0.65, 17.4, 13.7, 0.32, 0.3, 0x7998aa);
    for (const p of pois.filter((p) => p.level === data.level)) {
      const x = (p.x - 400) * 0.04,
        z = p.y < 300 ? -4.6 : 2.7;
      const depth = p.y < 300 ? 5.2 : 2.8;
      const isTarget = p.id === data.target;
      const surface = box(
        6.5,
        0.11,
        depth,
        x,
        0.065,
        z,
        isTarget ? 0x469bb7 : 0x8da9b9,
        p.id,
      );
      surface.userData.floor = true;
      box(
        6.5,
        1.4,
        0.12,
        x,
        0.76,
        z + (p.room === 'north' ? -depth / 2 : depth / 2),
        0xb4cad4,
        p.id,
      );
      box(0.12, 1.4, depth, x - 3.2, 0.76, z, 0xa3bcc9, p.id);
      box(0.12, 1.4, depth, x + 3.2, 0.76, z, 0xa3bcc9, p.id);
      // Door opening faces the corridor, and the graph route enters through it.
      const front = z + (p.y < 300 ? depth / 2 : -depth / 2);
      for (const dx of [-2.0, 2.0])
        box(2.35, 0.85, 0.12, x + dx, 0.48, front, 0x91b2c4, p.id);
      box(1.75, 0.04, 0.08, x, 0.1, front, isTarget ? 0x69d6ff : 0x75a8c5);
      // Consultation desk and chairs give the cutaway rooms an interior scale.
      box(1.6, 0.75, 0.72, x - 0.7, 0.43, z, 0xd0e0e7, p.id);
      box(1.7, 0.06, 0.8, x - 0.7, 0.84, z, 0xe4f0f4, p.id);
      box(0.08, 0.5, 0.45, x - 0.8, 1.11, z, 0x426678, p.id);
      for (const dx of [-0.6, 0.5]) {
        box(0.5, 0.1, 0.5, x + dx, 0.48, z + 0.85, 0x4b829a, p.id);
        box(0.5, 0.5, 0.1, x + dx, 0.75, z + 1.05, 0x4b829a, p.id);
      }
      label(
        getNode(p.id, data.state).name,
        x,
        2.1,
        z,
        isTarget ? '#a9edff' : '#def0f7',
        p.id,
      );
    }
    for (const n of nodes.filter(
      (n) =>
        n.level === data.level &&
        ['stairs', 'elevator', 'entry'].includes(n.type),
    )) {
      const p = pos(n.id);
      const closed = n.type === 'elevator' && data.state.elevatorClosed;
      box(2.25, 0.13, 1.75, p.x, 0.08, p.z, closed ? 0xa56861 : 0x6294a7, n.id);
      if (n.type === 'elevator') {
        box(2.25, 2, 0.1, p.x, 1, p.z + 0.8, 0xa6c2cf, n.id);
        box(
          1.5,
          1.8,
          0.12,
          p.x,
          1,
          p.z + 0.7,
          closed ? 0x724d50 : 0x41677f,
          n.id,
        );
        box(0.03, 1.8, 0.15, p.x, 1, p.z + 0.61, 0xacd8ef);
      }
      if (n.type === 'stairs')
        for (let i = 0; i < 7; i++)
          box(
            1.7,
            0.15 + i * 0.1,
            0.22,
            p.x,
            0.075 + i * 0.05,
            p.z - 0.7 + i * 0.23,
            0x92acb8,
            n.id,
          );
      label(
        closed ? 'A 区电梯 · 停运' : n.name,
        p.x,
        2.8,
        p.z,
        '#bbdceb',
        n.id,
        true,
      );
    }
    // All route points use the same coordinates as the authoritative routing graph.
    const route = data.target
      ? planRoute(data.state.location, data.target, data.state)
      : null;
    for (const e of route?.segments || []) {
      if (
        getNode(e.a).level !== data.level ||
        getNode(e.b).level !== data.level
      )
        continue;
      const points = edgePolyline(e).map(
        (p) => new THREE.Vector3((p.x - 400) * 0.04, 0.16, (p.y - 300) * 0.04),
      );
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1],
          b = points[i];
        const geometry = new THREE.CylinderGeometry(
          0.065,
          0.065,
          a.distanceTo(b),
          8,
        );
        const line = new THREE.Mesh(
          geometry,
          new THREE.MeshBasicMaterial({
            color: data.theme === 'spatial' ? 0x58d3ff : 0x0b4f6c,
          }),
        );
        line.position.copy(a).add(b).multiplyScalar(0.5);
        line.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          b.clone().sub(a).normalize(),
        );
        content.add(line);
      }
    }
    if (route) {
      let started = false;
      for (const id of route.path) {
        if (getNode(id).level === data.level) {
          walkPoints.push(pos(id, 1.45));
          started = true;
        } else if (started) break;
      }
    }
    for (const e of edges.filter((e) => data.state.blocked.includes(e.id))) {
      if (
        getNode(e.a).level !== data.level ||
        getNode(e.b).level !== data.level
      )
        continue;
      const p = pos(e.a).add(pos(e.b)).multiplyScalar(0.5);
      box(0.9, 0.7, 0.1, p.x, 0.5, p.z, 0xd88171);
      label('路段封闭', p.x, 1.6, p.z, '#ffc8b8', undefined, true);
    }
    const marker = (id: string, color: number) => {
      if (getNode(id)?.level !== data.level) return;
      const p = pos(id, 0.25);
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.23, 16, 12),
        new THREE.MeshBasicMaterial({ color }),
      );
      m.position.copy(p);
      content.add(m);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.35, 0.42, 40),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(p.x, 0.19, p.z);
      content.add(ring);
      if (id === data.state.location) pulse = ring;
    };
    marker(data.state.location, data.theme === 'spatial' ? 0xa9f0ff : 0x1b6b7a);
    if (data.target)
      marker(data.target, data.theme === 'spatial' ? 0xffb869 : 0x2e7d4f);
    content.position.y = activeY;
    walkPoints.forEach((p) => (p.y += activeY));
    if (changed) reset();
  }
  function move(to: THREE.Vector3, focus: THREE.Vector3) {
    walking = false;
    tween = {
      from: camera.position.clone(),
      to,
      focusFrom: controls.target.clone(),
      focusTo: focus,
      t: reduced ? 1 : 0,
    };
  }
  function reset() {
    controls.minDistance = 3;
    controls.maxPolarAngle = Math.PI * 0.48;
    move(
      home.clone().multiplyScalar(host.clientWidth < 600 ? 1.25 : 1),
      new THREE.Vector3(0, 3, 0),
    );
  }
  let down = { x: 0, y: 0 };
  const ray = new THREE.Raycaster();
  function hit(e: PointerEvent) {
    const r = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(
      new THREE.Vector2(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      ),
      camera,
    );
    return ray.intersectObjects(hits, false)[0]?.object.userData.id as
      | string
      | undefined;
  }
  function start(e: PointerEvent) {
    down = { x: e.clientX, y: e.clientY };
    walking = false;
    tween = null;
  }
  function hover(e: PointerEvent) {
    renderer.domElement.style.cursor = hit(e) ? 'pointer' : 'grab';
  }
  function end(e: PointerEvent) {
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const id = hit(e);
    if (id) {
      onSelect(id);
      if (id.startsWith('floor:')) return;
      const p = pos(id);
      p.y += (Number(data.level.split('-')[1]) - 1) * 3.2;
      // Preserve the viewpoint when selecting a room; only the route changes.
    }
  }
  renderer.domElement.addEventListener('pointerdown', start);
  renderer.domElement.addEventListener('pointermove', hover);
  renderer.domElement.addEventListener('pointerup', end);
  const lost = (e: Event) => {
    e.preventDefault();
    onError();
  };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  const resize = () => {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  let last = performance.now();
  function animate(now: number) {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (document.hidden) return;
    if (tween) {
      tween.t = Math.min(1, tween.t + dt * 1.1);
      const k = 1 - Math.pow(1 - tween.t, 3);
      camera.position.lerpVectors(tween.from, tween.to, k);
      controls.target.lerpVectors(tween.focusFrom, tween.focusTo, k);
      if (tween.t >= 1) tween = null;
    }
    controls.update();
    if (pulse)
      pulse.scale.setScalar(reduced ? 1 : 1 + Math.sin(now * 0.003) * 0.16);
    renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(animate);
  return {
    update,
    reset,
    zoom(delta: number) {
      walking = false;
      tween = null;
      camera.position
        .sub(controls.target)
        .multiplyScalar(delta)
        .add(controls.target);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      disposeGroup();
      renderer.domElement.removeEventListener('pointerdown', start);
      renderer.domElement.removeEventListener('pointermove', hover);
      renderer.domElement.removeEventListener('pointerup', end);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
