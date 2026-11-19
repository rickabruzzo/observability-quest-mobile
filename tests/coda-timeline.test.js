// The sunrise coda's rules (Warp brief 17): the walk out, the sun, reduced motion.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { codaPlan, beat1At, sunAt, beat3At, narrationLines, codaLine, SUN_MS, SHADES_MS, DOOR_OPEN_MS, DOORWAY_MS, DOOR_CLEAR_PX, AMBLE, AMBLE_DOWN, BEAT0_MS } from '../js/coda/timeline.js';
import { SCRIPT } from '../js/script.js';
import { WALKS, SETTLE_MS } from '../js/engine/walk.js';

const M = JSON.parse(readFileSync('assets/coda/coda.json', 'utf8'));
const SIDE = WALKS.side.frames.map((f) => f.body), TOWARD = WALKS.toward.frames.map((f) => f.body);

test('the plan from the manifest: the legs at the bedroom\'s pace, the door clear 20 px past its right edge', () => {
  const p = codaPlan(M);
  assert.equal(p.down, Math.round(((M.floorY - M.doorway.y) / AMBLE_DOWN) * 1000));
  assert.equal(p.across, Math.round(((M.stand.x - M.doorway.x) / AMBLE) * 1000));
  assert.equal(p.clearX, M.door.x + M.door.w + DOOR_CLEAR_PX);
  assert.equal(p.walkEnd, DOOR_OPEN_MS + DOORWAY_MS + p.down + p.across); assert.equal(p.total, p.walkEnd + SETTLE_MS);
  assert.equal(AMBLE, 100); assert.equal(AMBLE_DOWN, 66); assert.equal(BEAT0_MS, 600);
});
test('the walk out: on the path doorway → pavement line → stand.x, never left of the doorway; the door open from the start until he is 20 px clear; he ends at stand.x on floorY facing right, then holds', () => {
  const p = codaPlan(M);
  let lastX = -Infinity, sawDoorway = false, sawDown = false, sawAcross = false, shutAt = null;
  for (let t = 0; t <= p.total + 500; t += 10) {
    const b = beat1At(p, t), h = b.hero;
    if (t < DOOR_OPEN_MS) { assert.equal(h, null, `${t}: nobody yet`); assert.equal(b.doorOpen, true, 'the door is opening'); continue; }
    assert.ok(h && h.visible); assert.equal(h.flip, false, 'never mirrored: he only walks down and right');
    assert.ok(h.x >= M.doorway.x && h.x <= M.stand.x, `${t}: x ${h.x} on the path`);
    assert.ok(h.y >= M.doorway.y && h.y <= M.floorY, `${t}: y ${h.y}`);
    assert.ok(h.x >= lastX, 'never left'); lastX = h.x;
    if (h.x === M.doorway.x && h.y === M.doorway.y && h.pose === 'idle') { sawDoorway = true; assert.equal(h.view, 'front', 'facing us in the doorway'); }
    if (h.y > M.doorway.y && h.y < M.floorY) { sawDown = true; assert.ok(TOWARD.includes(h.pose), `down: ${h.pose}`); assert.equal(h.x, M.doorway.x, 'straight down first'); }
    if (h.y === M.floorY && h.x > M.doorway.x && h.x < M.stand.x) { sawAcross = true; assert.ok(SIDE.includes(h.pose), `across: ${h.pose}`); assert.equal(h.view, 'side'); }
    if (h.x < p.clearX) assert.equal(b.doorOpen, true, `${t}: the door is open while he is ${h.x} (clear at ${p.clearX})`);
    else { assert.equal(b.doorOpen, false, `${t}: the door shuts once he is clear`); shutAt ??= t; }
    if (t >= p.walkEnd) { assert.deepEqual([h.x, h.y, h.pose, h.view], [M.stand.x, M.floorY, 'stand', 'side'], `${t}: holds his stance`); }
    assert.equal(b.done, t >= p.total, `${t}: done`);
  }
  assert.ok(sawDoorway && sawAcross, 'the doorway and the walk across');
  assert.ok(sawDown || M.floorY - M.doorway.y < 2, 'the few steps down');
  assert.ok(shutAt !== null && shutAt < p.walkEnd, 'the door shuts before he stops');
  const b = beat1At(p, 99999); assert.deepEqual([b.hero.x, b.hero.y, b.hero.pose, b.doorOpen, b.done], [M.stand.x, M.floorY, 'stand', false, true]);
});
test('the sun: y0 at the start, y1 after 4 s, never moving down, whole pixels; the frame is 0, 1, 2, 3 at the thirds', () => {
  assert.deepEqual(sunAt(M, 0), { y: M.sun.y0, frame: 0, done: false });
  assert.deepEqual(sunAt(M, SUN_MS), { y: M.sun.y1, frame: 3, done: true });
  assert.deepEqual(sunAt(M, SUN_MS + 5000), { y: M.sun.y1, frame: 3, done: true });
  let last = Infinity;
  for (let t = 0; t <= SUN_MS; t += 7) { const s = sunAt(M, t); assert.ok(Number.isInteger(s.y)); assert.ok(s.y <= last, `${t}: the sun went down`); last = s.y; }
  assert.equal(sunAt(M, SUN_MS / 3 - 1).frame, 0); assert.equal(sunAt(M, SUN_MS / 3).frame, 1);
  assert.equal(sunAt(M, (2 * SUN_MS) / 3 - 1).frame, 1); assert.equal(sunAt(M, (2 * SUN_MS) / 3).frame, 2);
  assert.equal(sunAt(M, SUN_MS - 1).frame, 2); assert.equal(sunAt(M, SUN_MS).frame, 3);
  assert.equal(SUN_MS, 4000);
});
test('beat 3: he faces us, the sunglasses 400 ms later', () => {
  assert.deepEqual(beat3At(0), { view: 'front', pose: 'idle', shades: false, done: false });
  assert.deepEqual(beat3At(SHADES_MS - 1).shades, false); assert.deepEqual(beat3At(SHADES_MS), { view: 'front', pose: 'idle', shades: true, done: true });
});
test('reduced motion: the end state of each beat at once', () => {
  const p = codaPlan(M), b = beat1At(p, 0, true);
  assert.deepEqual([b.doorOpen, b.hero.x, b.hero.y, b.hero.pose, b.hero.view, b.done], [true, M.stand.x, M.floorY, 'stand', 'side', true]);
  assert.deepEqual(sunAt(M, 0, true), { y: M.sun.y1, frame: 3, done: true });
});
test('a manifest with other numbers (the real art) changes the plan, not the rules', () => {
  const m2 = { ...M, floorY: 190, doorway: { x: 40, y: 170 }, stand: { x: 200 }, door: { x: 10, y: 50, w: 60, h: 140 }, sun: { x: 100, y0: 150, y1: 40, w: 50, h: 50 } };
  const p = codaPlan(m2);
  assert.equal(p.down, Math.round((20 / AMBLE_DOWN) * 1000)); assert.equal(p.across, 1600); assert.equal(p.clearX, 90);
  const end = beat1At(p, p.total); assert.deepEqual([end.hero.x, end.hero.y, end.doorOpen], [200, 190, false]);
  assert.deepEqual(sunAt(m2, 2000), { y: 95, frame: 1, done: false });
});

// Review of brief 17 (2026-11-19). Each of the coda's lines is a punchline; as built each took two windows, breaking
// "…The street is the same street. You / are not the same engineer." across a tap.
test('the narration takes every line that fits above windowBottom, so each of the coda\'s lines is one window', () => {
  // a window's top is 6 CSS px down, its border and padding are 22, a line is 27 at 24 px type (css .msg, js/engine/window.js)
  const big = 592 / 320, small = 555 / 320;                 // CSS px a game pixel at 844×390 and at 667×375
  assert.equal(narrationLines(64, big), 3);
  assert.equal(narrationLines(64, small), 3);
  assert.equal(narrationLines(60, small), 2, 'four rows less and the third line no longer fits the small phone');
  assert.equal(narrationLines(10, big), 2, 'never fewer than two');
  for (const k of [big, small]) {
    const n = narrationLines(M.windowBottom, k);
    assert.equal(n, 3, 'the manifest leaves room for three lines, which is what each of the three takes');
    assert.ok((6 + 22 + 27 * n) / k <= M.windowBottom, 'and that many end above windowBottom');
  }
});
test('a line that begins with the hero\'s name begins with a capital', () => {
  assert.ok(codaLine('coda.3', 'the Engineer').startsWith('The Engineer puts on sunglasses.'));
  assert.ok(codaLine('coda.3', 'Rick').startsWith('Rick puts on sunglasses.'));
  assert.equal(codaLine('coda.1', 'the Engineer'), SCRIPT['coda.1']);
  assert.ok(!codaLine('coda.3', 'the Engineer').includes('{name}'));
});
