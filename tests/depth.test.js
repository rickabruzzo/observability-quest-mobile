// The hero's depth (Warp brief 11): a floor polygon to walk into, a scale that follows his feet's y, paths that
// stay on the floor, the furniture that covers him. Pure functions in js/engine/room.js and js/engine/walk.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { insideFloor, nearestFloorPoint, heroScaleAt, heroHeightAt, frontsOver, planPath, checkRoom } from '../js/engine/room.js';
import { planWalk, stepWalk, WALK_SPEED, STRIDE_PX, SETTLE_MS } from '../js/engine/walk.js';
import { HERO_H } from '../js/engine/hero.js';

// a T-shaped floor: an aisle from the back wall to the front, and a strip across the front
const ROOM = {
  floor: [[136, 135], [204, 135], [204, 186], [319, 186], [319, 199], [0, 199], [0, 186], [136, 186]],
  horizonY: 40, anchors: [{ y: 182, h: 108 }],
  fronts: [{ poly: [[60, 150], [120, 150], [120, 199], [60, 199]], baseY: 196 }],
  start: { x: 70, y: 194 },
  hotspots: [{ id: 'a', rect: { x: 0, y: 75, w: 135, h: 111 }, stand: { x: 101, y: 188 }, look: 'k.a' }],
};

test('scale is linear in the feet\'s y and zero at the horizon; the anchor gives the figure\'s height on its line', () => {
  assert.ok(Math.abs(heroHeightAt(ROOM, 182) - 108) < 0.01);
  assert.ok(Math.abs(heroScaleAt(ROOM, 182) - 108 / HERO_H) < 1e-9);
  assert.equal(heroScaleAt(ROOM, 40), 0);
  assert.ok(Math.abs(heroHeightAt(ROOM, 111) - 54) < 0.01, 'halfway to the horizon: half the height');
  assert.ok(heroHeightAt(ROOM, 199) > 108 && heroHeightAt(ROOM, 135) < 108);
  // two anchors fix the horizon themselves (scenario 5)
  const two = { ...ROOM, horizonY: undefined, anchors: [{ y: 195, h: 130 }, { y: 127, h: 76 }] };
  assert.ok(Math.abs(heroHeightAt(two, 195) - 130) < 0.01 && Math.abs(heroHeightAt(two, 127) - 76) < 0.01);
  const H = 195 - 130 / ((130 - 76) / (195 - 127));
  assert.ok(Math.abs(heroScaleAt(two, H)) < 1e-6, `horizon at ${H.toFixed(1)}`);
});

test('inside the floor: the aisle and the strip, the edges included; the furniture is not floor', () => {
  assert.equal(insideFloor(ROOM, { x: 170, y: 150 }), true);
  assert.equal(insideFloor(ROOM, { x: 30, y: 190 }), true);
  assert.equal(insideFloor(ROOM, { x: 136, y: 135 }), true, 'a corner');
  assert.equal(insideFloor(ROOM, { x: 204, y: 160 }), true, 'an edge');
  assert.equal(insideFloor(ROOM, { x: 60, y: 150 }), false, 'the cubicle');
  assert.equal(insideFloor(ROOM, { x: 250, y: 150 }), false, 'the desk');
  assert.equal(insideFloor(ROOM, { x: 170, y: 120 }), false, 'the wall');
});

test('a tap off the floor goes to the nearest point of the floor', () => {
  assert.deepEqual(nearestFloorPoint(ROOM, { x: 170, y: 150 }), { x: 170, y: 150 });
  assert.deepEqual(nearestFloorPoint(ROOM, { x: 60, y: 150 }), { x: 60, y: 186 });         // the cubicle: the strip in front of it is nearer than the aisle
  assert.deepEqual(nearestFloorPoint(ROOM, { x: 250, y: 150 }), { x: 250, y: 186 });
  assert.deepEqual(nearestFloorPoint(ROOM, { x: 100, y: 140 }), { x: 136, y: 140 });        // high up the cubicle: the aisle's edge
  assert.deepEqual(nearestFloorPoint(ROOM, { x: 170, y: 100 }), { x: 170, y: 135 });       // the wall: the back of the aisle
  assert.deepEqual(nearestFloorPoint(ROOM, { x: 250, y: 120 }), { x: 204, y: 135 });       // a corner
  assert.deepEqual(nearestFloorPoint(ROOM, { x: 400, y: 300 }), { x: 319, y: 199 });
});

test('a path is a straight line when it stays on the floor, and goes round by the floor\'s corners otherwise; it never leaves the floor', () => {
  assert.deepEqual(planPath(ROOM, { x: 150, y: 190 }, { x: 170, y: 140 }), [{ x: 150, y: 190 }, { x: 170, y: 140 }]);
  const round = planPath(ROOM, { x: 30, y: 190 }, { x: 170, y: 140 });
  assert.ok(round.length >= 3, 'round the cubicle\'s corner');
  assert.deepEqual(round[0], { x: 30, y: 190 }); assert.deepEqual(round.at(-1), { x: 170, y: 140 });
  for (let i = 1; i < round.length; i++) {
    const a = round[i - 1], b = round[i], n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
    for (let k = 0; k <= n; k++) assert.ok(insideFloor(ROOM, { x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n }), `off the floor at step ${k} of leg ${i}`);
  }
  assert.deepEqual(planPath(ROOM, { x: 170, y: 140 }, { x: 170, y: 140 }), [{ x: 170, y: 140 }]);
  const far = planPath(ROOM, { x: 300, y: 195 }, { x: 140, y: 136 });
  assert.deepEqual(far.at(-1), { x: 140, y: 136 });
});

test('a front covers him when his feet are above its base line', () => {
  assert.deepEqual(frontsOver(ROOM, 190).map((f) => f.baseY), [196]);
  assert.deepEqual(frontsOver(ROOM, 196), []);
  assert.deepEqual(frontsOver(ROOM, 199), []);
});

test('the room checker: stand points and the start on the floor, anchors present, the wall never walks', () => {
  assert.deepEqual(checkRoom(ROOM, { 'k.a': 'x' }), []);
  const bad = { ...ROOM, start: { x: 60, y: 150 }, hotspots: [{ id: 'z', rect: { x: 10, y: 10, w: 40, h: 40 }, stand: { x: 250, y: 150 }, look: 'k.a' }] };
  const problems = checkRoom(bad, { 'k.a': 'x' });
  assert.ok(problems.some((p) => /start.*floor/.test(p)), problems.join('\n'));
  assert.ok(problems.some((p) => /z.*stand.*floor/.test(p)), problems.join('\n'));
  assert.ok(checkRoom({ ...ROOM, anchors: [] }, { 'k.a': 'x' }).some((p) => /anchor/.test(p)));
});

// ---- the walk in two dimensions ----

test('a walk follows the path; its speed in scene px follows his scale, so the stride matches the ground', () => {
  const p = planWalk({ x: 150, y: 190 }, { x: 170, y: 140 }, ROOM);
  assert.equal(p.points.length, 2);
  const flat = planWalk({ x: 0, y: 190 }, { x: 100, y: 190 }, ROOM), deep = planWalk({ x: 150, y: 140 }, { x: 200, y: 140 }, ROOM);
  // 100 px along the front at scale ~0.87 vs 50 px at the back at scale ~0.56: the deep walk is slower per px
  assert.ok(flat.duration / 100 < deep.duration / 50, `${flat.duration}/100 vs ${deep.duration}/50`);
  const s = heroScaleAt(ROOM, 190);
  assert.ok(Math.abs(flat.duration - (100 / (WALK_SPEED * s)) * 1000) < 40, `${flat.duration} ms for 100 px at scale ${s.toFixed(2)}`);
  assert.equal(planWalk({ x: 5, y: 5 }, { x: 5, y: 5 }, ROOM).duration, 0);
});

test('stepping: position along the path, the frame from ground covered in his own pixels, side on then a settle, done at the end', () => {
  const p = planWalk({ x: 150, y: 190 }, { x: 170, y: 140 }, ROOM);
  const a = stepWalk(p, 0), mid = stepWalk(p, p.duration / 2), end = stepWalk(p, p.duration + SETTLE_MS);
  assert.deepEqual([a.x, a.y, a.view, a.pose], [150, 190, 'side', 'w1']);
  assert.ok(mid.x > 150 && mid.x < 170 && mid.y < 190 && mid.y > 140 && /^w[1-8]$/.test(mid.pose));
  assert.ok(mid.scale > 0 && mid.scale < 1);
  assert.deepEqual([end.x, end.y, end.view, end.pose, end.done], [170, 140, 'front', 'idle', true]);
  assert.equal(stepWalk(p, p.duration + 10).pose, 'stand');
  // one full cycle of eight frames per STRIDE_PX of ground in the hero's own pixels: along the front, at scale s, every STRIDE_PX*s scene px
  const s = heroScaleAt(ROOM, 190), flat = planWalk({ x: 0, y: 190 }, { x: 300, y: 190 }, ROOM);
  const at = (px) => stepWalk(flat, (px / 300) * flat.duration).pose;
  assert.equal(at(0), 'w1'); assert.equal(at(STRIDE_PX * s), 'w1', 'the cycle starts over after one scaled stride');
  assert.notEqual(at((STRIDE_PX * s) / 2), 'w1');
  assert.equal(stepWalk(planWalk({ x: 100, y: 190 }, { x: 20, y: 190 }, ROOM), 10).flip, true, 'walking left is mirrored');
});

test('the one-dimensional walk still works for the preview room and the old tests (a flat floor at scale 1)', () => {
  const p = planWalk(0, 300, { speed: 300 });
  assert.equal(p.duration, 1000); assert.equal(stepWalk(p, 500).x, 150); assert.equal(p.dir, 1);
});
