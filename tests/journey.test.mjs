import test from 'node:test';
import assert from 'node:assert/strict';
import { createJourney, journeyAt, worldPoint } from '../shared/journey.mjs';
import { initialState, getNode } from '../shared/hospital.mjs';
test('一次规划跨楼层与楼栋，边界点连续且步道避开建筑', () => {
  const j = createJourney('cardio', 'ct', initialState());
  assert(j.legs.some((l) => l.kind === 'elevator'));
  assert(j.legs.some((l) => l.kind === 'outdoor'));
  for (let i = 1; i < j.legs.length; i++)
    assert.deepEqual(j.legs[i - 1].points.at(-1), j.legs[i].points[0]);
  const outdoor = j.legs.find((l) => l.kind === 'outdoor');
  assert.equal(outdoor.points.length, 4);
  assert.equal(outdoor.points[1].z, 12);
  assert.notEqual(worldPoint('cardio').x, worldPoint('ct').x);
});
test('全程进度在起点、分段边界和终点正确', () => {
  const j = createJourney('service', 'ct', initialState());
  assert.equal(journeyAt(j, 0).index, 0);
  const first = journeyAt(j, j.legs[0].duration);
  assert.equal(first.index, 1);
  assert.equal(first.fraction, 0);
  const last = journeyAt(j, j.totalSeconds + 100);
  assert.equal(last.done, true);
  assert.equal(last.fraction, 1);
  assert.equal(last.leg.to, 'ct');
});
test('无障碍与停运限制一致，不演示不可通行路线', () => {
  assert.equal(
    createJourney('cardio', 'ct', {
      ...initialState(),
      accessible: true,
      elevatorClosed: true,
    }),
    null,
  );
  const j = createJourney('cardio', 'ct', {
    ...initialState(),
    elevatorClosed: true,
  });
  assert(j.legs.some((l) => l.kind === 'stairs'));
  assert(!j.legs.some((l) => l.kind === 'elevator'));
});
test('相同起终点直接到达，反向路线标识不同', () => {
  const j = createJourney('ct', 'ct', initialState());
  assert.equal(j.totalSeconds, 0);
  assert.equal(journeyAt(j, 0).done, true);
  assert.notEqual(
    createJourney('ct', 'tech-1-left', initialState()).signature,
    createJourney('tech-1-left', 'ct', initialState()).signature,
  );
});
