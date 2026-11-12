import test from 'node:test';
import assert from 'node:assert/strict';
import { planWalk, stepWalk, WALK_SPEED } from '../js/engine/walk.js';

test('a Sierra stroll, not a sprint: a full room takes about three seconds (Rick, 2026-11-11: "walking is way too fast")', () => {
  const d = planWalk(0, 292).duration;
  assert.ok(d >= 2300 && d <= 3500, `${d} ms`);
  assert.ok(WALK_SPEED >= 85 && WALK_SPEED <= 125);
});

test('duration from distance and speed', () => {
  assert.equal(planWalk(0, 120, { speed: 300 }).duration, 400);
  assert.equal(planWalk(50, 50).duration, 0);
});

test('direction and flip', () => {
  assert.equal(planWalk(100, 20).dir, -1);
  assert.equal(stepWalk(planWalk(100, 20), 10).flip, true);
});

test('pose cycles at 6 fps and x interpolates', () => {
  const p = planWalk(0, 300, { speed: 300 }); // 1000 ms at 300 px/s
  assert.equal(stepWalk(p, 0).pose, 'walk1');
  assert.equal(stepWalk(p, 200).pose, 'walk2');
  assert.equal(stepWalk(p, 520).pose, 'walk4');
  assert.equal(stepWalk(p, 700).pose, 'walk1');
  assert.equal(stepWalk(p, 500).x, 150);
});

test('done at the end, idle, exact target', () => {
  const s = stepWalk(planWalk(0, 300, { speed: 300 }), 1000);
  assert.equal(s.done, true); assert.equal(s.pose, 'idle'); assert.equal(s.x, 300);
  assert.equal(stepWalk(planWalk(0, 300, { speed: 300 }), 5000).x, 300);
});
