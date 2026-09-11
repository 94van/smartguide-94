import test from 'node:test';
import assert from 'node:assert/strict';
import {
  nodes,
  edges,
  pois,
  initialState,
  applyAction,
  planRoute,
  stages,
} from '../shared/hospital.mjs';
test('地图完整：30 个 POI，所有点均可从入口到达，边引用有效', () => {
  assert.equal(pois.length, 30);
  assert.equal(new Set(nodes.map((n) => n.id)).size, nodes.length);
  for (const e of edges) {
    assert(nodes.some((n) => n.id === e.a));
    assert(nodes.some((n) => n.id === e.b));
    assert(e.distance > 0);
  }
  for (const n of nodes) assert(planRoute('out-1-entry', n.id), n.id);
});
test('跨楼栋跨楼层路线连续并经过电梯', () => {
  const r = planRoute('cardio', 'ct');
  assert(r.segments.some((e) => e.kind === 'elevator'));
  assert(r.segments.some((e) => e.kind === 'outdoor'));
  assert.deepEqual(r.path.slice(0, 1), ['cardio']);
  assert.equal(r.path.at(-1), 'ct');
  r.segments.forEach((e, i) =>
    assert(
      [e.a, e.b].includes(r.path[i]) && [e.a, e.b].includes(r.path[i + 1]),
    ),
  );
});
test('电梯停运后绕行楼梯，无障碍时明确不可达', () => {
  const s = { ...initialState(), elevatorClosed: true };
  assert(
    planRoute('service', 'cardio', s).segments.some((e) => e.kind === 'stairs'),
  );
  assert.equal(
    planRoute('service', 'cardio', { ...s, accessible: true }),
    null,
  );
});
test('路段封闭会绕行，完全封闭目标入口返回不可达', () => {
  const r = planRoute('service', 'cardio');
  const e = r.segments.find(
    (e) =>
      nodes.find((n) => n.id === e.a).type === 'corridor' &&
      nodes.find((n) => n.id === e.b).type === 'corridor',
  );
  if (e) {
    const s = { ...initialState(), blocked: [e.id] };
    const next = planRoute('service', 'cardio', s);
    assert(next);
    assert(!next.segments.some((x) => x.id === e.id));
  }
  assert.equal(
    planRoute('service', 'cardio', {
      ...initialState(),
      blocked: edges
        .filter((e) => e.a === 'cardio' || e.b === 'cardio')
        .map((e) => e.id),
    }),
    null,
  );
});
test('到达和候诊检查禁止跳过前置条件', () => {
  assert.throws(
    () => applyAction(initialState(), { type: 'advance' }),
    /先模拟到达/,
  );
  const s = { ...initialState(), stage: 2, location: 'cardio' };
  assert.throws(() => applyAction(s, { type: 'advance' }), /候诊/);
  assert.throws(
    () => applyAction(s, { type: 'locate', id: 'invalid' }),
    /无效/,
  );
});
for (const scenario of ['ct', 'simple'])
  test(`${scenario} 全就诊流程可完成并重置`, () => {
    let s = applyAction(initialState(), { type: 'reset', scenario });
    const visited = [];
    while (s.stage < 9) {
      visited.push(s.stage);
      const current = stages[s.stage];
      if (current.target)
        s = applyAction(s, { type: 'arrive', id: current.target });
      if (s.stage === 2)
        while (s.queue > 0) s = applyAction(s, { type: 'call' });
      s = applyAction(s, { type: 'advance' });
    }
    assert.equal(s.stage, 9);
    assert(visited.includes(8));
    assert.equal(visited.includes(4), scenario === 'ct');
    assert.throws(() => applyAction(s, { type: 'advance' }));
    s = applyAction(s, { type: 'reset', scenario });
    assert.equal(s.location, 'out-1-entry');
    assert.equal(s.stage, 0);
  });
test('编辑科室可保留，非法操作不改变原始状态', () => {
  const s = initialState(),
    next = applyAction(s, {
      type: 'poi',
      id: 'ct',
      name: 'CT 新名称',
      hours: '09:00–17:00',
    });
  assert.equal(next.poiOverrides.ct.name, 'CT 新名称');
  assert.deepEqual(s.poiOverrides, {});
  assert.throws(() => applyAction(s, { type: 'elevator', value: 'yes' }));
  assert.throws(() =>
    applyAction(s, { type: 'block', id: 'fake', value: true }),
  );
  assert.throws(() => applyAction(s, { type: 'reset', scenario: 'fake' }));
});

test('演示跳过等待只清空队列，保留接诊与到达校验', () => {
  assert.throws(() => applyAction(initialState(), { type: 'skip-wait' }), /候诊/);
  const waiting = { ...initialState(), stage: 2, location: stages[2].target };
  const called = applyAction(waiting, { type: 'skip-wait' });
  assert.equal(called.queue, 0);
  assert.equal(called.stage, 2);
  assert.equal(called.location, waiting.location);
  assert.equal(waiting.queue, 5);
  assert.equal(applyAction(called, { type: 'advance' }).stage, 3);
  assert.throws(() => applyAction(called, { type: 'skip-wait' }), /已经叫到/);
  assert.throws(() => applyAction({ ...waiting, location: 'service' }, { type: 'skip-wait' }), /到达/);
});
