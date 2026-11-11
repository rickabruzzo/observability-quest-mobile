import test from 'node:test';
import assert from 'node:assert/strict';
import { planWalk, stepWalk } from '../js/engine/walk.js';

test('duration from distance and speed', () => {
  assert.equal(planWalk(0, 120).duration, 2000);
  assert.equal(planWalk(50, 50).duration, 0);
});

test('direction and flip', () => {
  assert.equal(planWalk(100, 20).dir, -1);
  assert.equal(stepWalk(planWalk(100, 20), 10).flip, true);
});

test('pose cycles at 10 fps and x interpolates', () => {
  const p = planWalk(0, 60); // 1000 ms
  assert.equal(stepWalk(p, 0).pose, 'walk1');
  assert.equal(stepWalk(p, 150).pose, 'walk2');
  assert.equal(stepWalk(p, 350).pose, 'walk4');
  assert.equal(stepWalk(p, 450).pose, 'walk1');
  assert.equal(stepWalk(p, 500).x, 30);
});

test('done at the end, idle, exact target', () => {
  const s = stepWalk(planWalk(0, 60), 1000);
  assert.equal(s.done, true); assert.equal(s.pose, 'idle'); assert.equal(s.x, 60);
  assert.equal(stepWalk(planWalk(0, 60), 5000).x, 60);
});
