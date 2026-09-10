import { getNode, planRoute, buildings, edgePolyline } from './hospital.mjs';
const offsets = { out: -36, tech: 0, ward: 36 };
export function worldPoint(id) {
  const n = getNode(id);
  if (!n) throw Error('无效导航点');
  return worldCoordinate(n);
}
export function worldCoordinate(n) {
  return {
    x: offsets[n.building] + (n.x - 400) * 0.035,
    y: (n.floor - 1) * 3.2 + 0.22,
    z: (n.y - 300) * 0.035,
  };
}
export function createJourney(from, to, state) {
  const route = planRoute(from, to, state);
  if (!route) return null;
  const legs = route.segments.map((edge, i) => {
    const a = getNode(route.path[i], state),
      b = getNode(route.path[i + 1], state);
    const start = worldPoint(a.id),
      end = worldPoint(b.id);
    const points =
      edge.kind === 'outdoor'
        ? [start, { ...start, z: 12 }, { ...end, z: 12 }, end]
        : edgePolyline(edge, a.id).map(worldCoordinate);
    const building = buildings.find((x) => x.id === b.building);
    return {
      edgeId: edge.id,
      from: a.id,
      to: b.id,
      kind: edge.kind,
      meters: edge.distance,
      level: a.level,
      nextLevel: b.level,
      points,
      title:
        edge.kind === 'elevator'
          ? `乘 A 区电梯：${a.floor}F → ${b.floor}F`
          : edge.kind === 'stairs'
            ? `经 B 区楼梯：${a.floor}F → ${b.floor}F`
            : edge.kind === 'outdoor'
              ? `沿院区步道前往${building.name}`
              : `前往${b.name}`,
      duration:
        edge.kind === 'elevator'
          ? 5
          : edge.kind === 'stairs'
            ? 6
            : Math.max(2, edge.distance / 5),
    };
  });
  return {
    ...route,
    legs,
    totalSeconds: legs.reduce((s, l) => s + l.duration, 0),
    signature: JSON.stringify(
      legs.map((l) => [l.edgeId, l.from, l.to, l.points]),
    ),
  };
}
export function journeyAt(journey, elapsed) {
  let before = 0;
  for (let i = 0; i < journey.legs.length; i++) {
    const leg = journey.legs[i];
    if (elapsed < before + leg.duration || i === journey.legs.length - 1)
      return {
        index: i,
        fraction: Math.max(0, Math.min(1, (elapsed - before) / leg.duration)),
        leg,
        done: elapsed >= journey.totalSeconds,
      };
    before += leg.duration;
  }
  return { index: 0, fraction: 1, leg: null, done: true };
}

export function samplePath(points, distance) {
  if (!points.length) return null;
  let remaining = Math.max(0, distance);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i];
    const length = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    if (remaining <= length || i === points.length - 1) {
      const t = length ? Math.min(1, remaining / length) : 1;
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t,
      };
    }
    remaining -= length;
  }
  return { ...points[0] };
}
