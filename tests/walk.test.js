import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planWalk, stepWalk, walkKind, walkFrame, WALKS, ADVANCE, WALK_SPEED, SETTLE_MS } from '../js/engine/walk.js';
import { HERO_W } from '../js/engine/hero.js';

const SIDE = WALKS.side.frames.map((f) => f.body);

test('the walks are the manifest\'s (brief 15 C): four frames each, 13.5 of his pixels a frame', () => {
  const m = JSON.parse(readFileSync('assets/hero/hero.json', 'utf8'));
  assert.deepEqual(WALKS, m.walk);
  assert.equal(ADVANCE, 13.5);
  assert.deepEqual(SIDE, ['walk_contact', 'walk_down', 'walk_pass', 'walk_up']);
});
test('a Sierra stroll: about three steps a second at full size', () => {
  const steps = WALK_SPEED / (ADVANCE * 4);                        // a step is four frames
  assert.ok(steps >= 1.8 && steps <= 3.6, `${steps.toFixed(2)} steps a second`);
  assert.equal(WALK_SPEED, 120);
  const d = planWalk(0, 320 - HERO_W).duration;
  assert.ok(d >= 2000 && d <= 2900, `${d} ms`);
});
test('duration from distance and speed', () => {
  assert.equal(planWalk(0, 120, { speed: 300 }).duration, 400);
  assert.equal(planWalk(50, 50).duration, 0);
});
test('which walk for a leg going right, left, toward and away', () => {
  assert.equal(walkKind({ x: 0, y: 100 }, { x: 50, y: 110 }), 'side'); assert.equal(walkKind({ x: 50, y: 100 }, { x: 0, y: 90 }), 'side');
  assert.equal(walkKind({ x: 0, y: 100 }, { x: 10, y: 150 }), 'toward'); assert.equal(walkKind({ x: 0, y: 150 }, { x: -10, y: 100 }), 'away');
  assert.equal(walkKind({ x: 0, y: 100 }, { x: 10, y: 110 }), 'toward', 'as far up as across is not a side walk');
  const right = planWalk({ x: 0, y: 150 }, { x: 100, y: 150 }), left = planWalk({ x: 100, y: 150 }, { x: 0, y: 150 });
  const down = planWalk({ x: 100, y: 100 }, { x: 110, y: 190 }), up = planWalk({ x: 100, y: 190 }, { x: 90, y: 100 });
  assert.deepEqual([stepWalk(right, 10).view, stepWalk(right, 10).flip], ['side', false]);
  assert.deepEqual([stepWalk(left, 10).view, stepWalk(left, 10).flip], ['side', true]);
  assert.deepEqual([stepWalk(down, 10).view, stepWalk(down, 10).flip], ['front', false]);
  assert.deepEqual([stepWalk(up, 10).view, stepWalk(up, 10).flip], ['back', false]);
  assert.ok(WALKS.toward.frames.map((f) => f.body).includes(stepWalk(down, 10).pose));
  assert.ok(WALKS.away.frames.map((f) => f.body).includes(stepWalk(up, 10).pose));
});
test('the frame after 0, 13.4, 13.5, 27 and 54 pixels of ground, in all three walks; dy comes with it', () => {
  for (const kind of ['side', 'toward', 'away']) {
    const f = WALKS[kind].frames;
    assert.deepEqual(walkFrame(kind, 0), f[0]); assert.deepEqual(walkFrame(kind, 13.4), f[0]);
    assert.deepEqual(walkFrame(kind, 13.5), f[1]); assert.deepEqual(walkFrame(kind, 27), f[2]); assert.deepEqual(walkFrame(kind, 54), f[0]);
  }
  const p = planWalk(0, 1000, { speed: 1000 });                   // 1 px per ms: elapsed ms == px travelled
  const seen = [];
  for (let d = 0; d < ADVANCE * 4; d++) seen.push(stepWalk(p, d).pose);
  assert.deepEqual([...new Set(seen)], SIDE, 'all four, in order');
  assert.equal(stepWalk(p, 0).pose, 'walk_contact'); assert.equal(stepWalk(p, 0).dy, 1);
  assert.equal(stepWalk(p, 14).pose, 'walk_down'); assert.equal(stepWalk(p, 14).dy, 2);
  assert.equal(stepWalk(p, 27).dy, 0); assert.equal(stepWalk(p, 41).dy, -1);
  assert.equal(stepWalk(p, ADVANCE * 4).pose, 'walk_contact', 'the step starts over');
});
test('the same distance gives the same frame whatever the speed — feet do not slide', () => {
  const slow = planWalk(0, 300, { speed: 50 }), fast = planWalk(0, 300, { speed: 400 });
  for (const travelled of [1, 7, 19, 25, 38, 60, 123, 250]) {
    const a = stepWalk(slow, (travelled / 50) * 1000), b = stepWalk(fast, (travelled / 400) * 1000);
    assert.equal(a.x, b.x, `x at ${travelled} px`); assert.equal(a.pose, b.pose, `pose at ${travelled} px`);
  }
});
test('walking left runs the same frames, mirrored', () => {
  const left = planWalk(300, 0, { speed: 1000 }), right = planWalk(0, 300, { speed: 1000 });
  for (const t of [0, 5, 12, 30, 54]) {
    assert.equal(stepWalk(left, t).pose, stepWalk(right, t).pose, `t=${t}`);
    assert.equal(stepWalk(left, t).flip, true); assert.equal(stepWalk(right, t).flip, false);
  }
});
test('x interpolates', () => { assert.equal(stepWalk(planWalk(0, 300, { speed: 300 }), 500).x, 150); });
test('done at the end, front-facing idle, exact target', () => {
  const s = stepWalk(planWalk(0, 300, { speed: 300 }), 1000 + SETTLE_MS);
  assert.deepEqual([s.done, s.pose, s.view, s.x, s.dy], [true, 'idle', 'front', 300, 0]);
  assert.equal(stepWalk(planWalk(0, 300, { speed: 300 }), 5000).x, 300);
  const nowhere = stepWalk(planWalk(50, 50), 0);
  assert.deepEqual([nowhere.done, nowhere.pose, nowhere.view], [true, 'idle', 'front']);
});
test('a negative or zero elapsed time is the first frame, not a crash', () => {
  const p = planWalk(0, 300, { speed: 300 });
  assert.equal(stepWalk(p, -50).pose, 'walk_contact'); assert.equal(stepWalk(p, -50).x, 0);
});
test('on arrival the hero holds the stance he arrived in for a beat, then turns to face the player: side after a side walk, his back after walking away', () => {
  assert.ok(SETTLE_MS >= 150 && SETTLE_MS <= 400);
  const right = planWalk(0, 300, { speed: 300 }), left = planWalk(300, 0, { speed: 300 });
  const pick = ({ x, pose, view, done, flip }) => ({ x, pose, view, done, flip });
  for (const t of [1000, 1000 + SETTLE_MS - 1]) {
    assert.deepEqual(pick(stepWalk(right, t)), { x: 300, pose: 'stand', view: 'side', done: false, flip: false });
    assert.deepEqual(pick(stepWalk(left, t)), { x: 0, pose: 'stand', view: 'side', done: false, flip: true });
  }
  assert.deepEqual(pick(stepWalk(right, 1000 + SETTLE_MS)), { x: 300, pose: 'idle', view: 'front', done: true, flip: false });
  const away = planWalk({ x: 100, y: 190 }, { x: 100, y: 100 }), toward = planWalk({ x: 100, y: 100 }, { x: 100, y: 190 });
  const heldAway = stepWalk(away, away.duration + 10), heldToward = stepWalk(toward, toward.duration + 10);
  assert.deepEqual([heldAway.pose, heldAway.view, heldAway.done, heldAway.flip], ['back', 'back', false, false]);
  assert.deepEqual([heldToward.pose, heldToward.view, heldToward.done], ['idle', 'front', false]);
  assert.equal(stepWalk(away, away.duration + SETTLE_MS).pose, 'idle');
  assert.equal(stepWalk(planWalk(50, 50), 0).done, true);
});
