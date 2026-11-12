import test from 'node:test';
import assert from 'node:assert/strict';
import { planWalk, stepWalk, STRIDE_PX, WALK_SPEED, SETTLE_MS } from '../js/engine/walk.js';
import { SIDE_POSES } from '../js/engine/hero-side.js';

test('a Sierra stroll: about three steps a second, so a full room takes about five seconds', () => {
  // The stride is fixed by the drawn leg angles (STRIDE_PX per two steps); the speed is what sets the cadence.
  // At 110 px/s the profile walk took nearly six steps a second — a scurry (Warp hand-back 01, 2026-11-11).
  const steps = (WALK_SPEED / STRIDE_PX) * 2;
  assert.ok(steps >= 2.5 && steps <= 3.6, `${steps.toFixed(2)} steps a second`);
  const d = planWalk(0, 292).duration;
  assert.ok(d >= 4000 && d <= 5800, `${d} ms`);
});

test('duration from distance and speed', () => {
  assert.equal(planWalk(0, 120, { speed: 300 }).duration, 400);
  assert.equal(planWalk(50, 50).duration, 0);
});

test('direction and flip', () => {
  assert.equal(planWalk(100, 20).dir, -1);
  assert.equal(stepWalk(planWalk(100, 20), 10).flip, true);
});

// ---- the walk is the profile view, and the frame comes from distance, not the clock ----

test('walking is the side view; standing still is the front view', () => {
  const p = planWalk(0, 300, { speed: 300 });
  assert.equal(stepWalk(p, 100).view, 'side');
  assert.ok(SIDE_POSES.includes(stepWalk(p, 100).pose));
  const end = stepWalk(p, 1000 + SETTLE_MS);
  assert.equal(end.view, 'front'); assert.equal(end.pose, 'idle');
});

test('one full cycle of eight frames per STRIDE_PX of travel', () => {
  assert.equal(STRIDE_PX, 38);
  const p = planWalk(0, 1000, { speed: 1000 });                 // 1 px per ms: elapsed ms == px travelled
  const seen = [];
  for (let d = 0; d < STRIDE_PX; d++) seen.push(stepWalk(p, d).pose);
  assert.deepEqual([...new Set(seen)], ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8'], 'all eight, in order');
  assert.equal(stepWalk(p, 0).pose, 'w1');
  assert.equal(stepWalk(p, STRIDE_PX).pose, 'w1', 'the cycle starts over after one stride');
  assert.equal(stepWalk(p, STRIDE_PX * 3).pose, 'w1');
});

test('the same distance gives the same frame whatever the speed — feet do not slide', () => {
  const slow = planWalk(0, 300, { speed: 50 }), fast = planWalk(0, 300, { speed: 400 });
  for (const travelled of [1, 7, 19, 25, 38, 60, 123, 250]) {
    const a = stepWalk(slow, (travelled / 50) * 1000);
    const b = stepWalk(fast, (travelled / 400) * 1000);
    assert.equal(a.x, b.x, `x at ${travelled} px`);
    assert.equal(a.pose, b.pose, `pose at ${travelled} px`);
  }
});

test('walking left runs the same cycle, mirrored', () => {
  const left = planWalk(300, 0, { speed: 1000 }), right = planWalk(0, 300, { speed: 1000 });
  for (const t of [0, 5, 12, 30, 76]) {
    assert.equal(stepWalk(left, t).pose, stepWalk(right, t).pose, `t=${t}`);
    assert.equal(stepWalk(left, t).flip, true);
    assert.equal(stepWalk(right, t).flip, false);
  }
});

test('x interpolates', () => {
  assert.equal(stepWalk(planWalk(0, 300, { speed: 300 }), 500).x, 150);
});

test('done at the end, front-facing idle, exact target', () => {
  const s = stepWalk(planWalk(0, 300, { speed: 300 }), 1000 + SETTLE_MS);
  assert.equal(s.done, true); assert.equal(s.pose, 'idle'); assert.equal(s.view, 'front'); assert.equal(s.x, 300);
  assert.equal(stepWalk(planWalk(0, 300, { speed: 300 }), 5000).x, 300);
  const nowhere = stepWalk(planWalk(50, 50), 0);
  assert.deepEqual([nowhere.done, nowhere.pose, nowhere.view], [true, 'idle', 'front']);
});

test('a negative or zero elapsed time is the first frame, not a crash', () => {
  const p = planWalk(0, 300, { speed: 300 });
  assert.equal(stepWalk(p, -50).pose, 'w1');
  assert.equal(stepWalk(p, -50).x, 0);
});

test('on arrival the hero holds the side-on stance for a beat, then turns to face the player', () => {
  assert.ok(SETTLE_MS >= 150 && SETTLE_MS <= 400);
  const right = planWalk(0, 300, { speed: 300 }), left = planWalk(300, 0, { speed: 300 });
  for (const t of [1000, 1000 + SETTLE_MS - 1]) {
    assert.deepEqual(stepWalk(right, t), { x: 300, pose: 'stand', view: 'side', done: false, flip: false });
    assert.deepEqual(stepWalk(left, t), { x: 0, pose: 'stand', view: 'side', done: false, flip: true });   // still facing the way they walked
  }
  assert.deepEqual(stepWalk(right, 1000 + SETTLE_MS), { x: 300, pose: 'idle', view: 'front', done: true, flip: false });
  assert.equal(stepWalk(planWalk(50, 50), 0).done, true);            // a walk to where they already are does not settle
});
