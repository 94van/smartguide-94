import test from 'node:test';
import assert from 'node:assert/strict';
import {
  edges,
  pois,
  getNode,
  edgePolyline,
  roomBounds,
  initialState,
} from '../shared/hospital.mjs';
import { createJourney, samplePath } from '../shared/journey.mjs';
test('所有平层通行折线均避开房间占地区域，含四像素余量', () => {
  for (const e of edges.filter((e) => e.kind === 'walk')) {
    const points = edgePolyline(e);
    const rooms = pois
      .filter((p) => p.level === getNode(e.a).level)
      .map(roomBounds);
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i];
      assert(a.x === b.x || a.y === b.y);
      for (let t = 0; t <= 1; t += 0.01) {
        const x = a.x + (b.x - a.x) * t,
          y = a.y + (b.y - a.y) * t;
        for (const r of rooms)
          assert(
            !(
              x > r.left - 4 &&
              x < r.right + 4 &&
              y > r.top - 4 &&
              y < r.bottom + 4
            ),
            `${e.id} traverses a room at ${x},${y}`,
          );
      }
    }
  }
});
test('科室终点为走廊侧门口，正反路径严格互逆', () => {
  for (const p of pois) {
    const n = getNode(p.id),
      r = roomBounds(p);
    assert.equal(n.x, r.doorX);
    assert(p.room === 'north' ? n.y > r.bottom : n.y < r.top);
  }
  for (const e of edges)
    assert.deepEqual(
      edgePolyline(e, e.a).slice().reverse(),
      edgePolyline(e, e.b),
    );
});
test('弧长采样不切直角、不越过终点', () => {
  const points = [
    { x: 0, y: 0, z: 0 },
    { x: 10, y: 0, z: 0 },
    { x: 10, y: 0, z: 10 },
  ];
  for (let d = 0; d < 22; d += 0.13) {
    const p = samplePath(points, d);
    assert(p.z === 0 || p.x === 10);
    assert(p.z <= 10);
  }
  assert.deepEqual(samplePath(points, 99), points.at(-1));
});
test('跨楼路线只从入口连到院区步道，不从科室直接出楼', () => {
  const j = createJourney('cardio', 'ct', initialState());
  for (const leg of j.legs.filter((l) => l.kind === 'outdoor')) {
    assert.equal(getNode(leg.from).type, 'entry');
    assert.equal(getNode(leg.to).type, 'entry');
    assert.equal(leg.points[1].z, 12);
    assert.equal(leg.points[2].z, 12);
  }
});
