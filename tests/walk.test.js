import test from 'node:test';
import assert from 'node:assert/strict';
import { planWalk, stepWalk, WALK_SPEED } from '../js/engine/walk.js';

test('a full-room crossing takes at most 1.2 s (spec: Interface › Tap to act)', () => {
  assert.ok(planWalk(0, 292).duration <= 1200, `${planWalk(0, 292).duration} ms`);
  assert.ok(WALK_SPEED >= 250);
});

test('duration from distance and speed', () => {
  assert.equal(planWalk(0, 120).duration, 400);
  assert.equal(planWalk(50, 50).duration, 0);
});

test('direction and flip', () => {
  assert.equal(planWalk(100, 20).dir, -1);
  assert.equal(stepWalk(planWalk(100, 20), 10).flip, true);
});

test('pose cycles at 10 fps and x interpolates', () => {
  const p = planWalk(0, 300); // 1000 ms at 300 px/s
  assert.equal(stepWalk(p, 0).pose, 'walk1');
  assert.equal(stepWalk(p, 150).pose, 'walk2');
  assert.equal(stepWalk(p, 350).pose, 'walk4');
  assert.equal(stepWalk(p, 450).pose, 'walk1');
  assert.equal(stepWalk(p, 500).x, 150);
});

test('done at the end, idle, exact target', () => {
  const s = stepWalk(planWalk(0, 300), 1000);
  assert.equal(s.done, true); assert.equal(s.pose, 'idle'); assert.equal(s.x, 300);
  assert.equal(stepWalk(planWalk(0, 300), 5000).x, 300);
});
