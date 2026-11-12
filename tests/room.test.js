import test from 'node:test';
import assert from 'node:assert/strict';
import { hotspotAt, walkTarget, clampWalk, checkRoom, MIN_HIT } from '../js/engine/room.js';
import { ROOM, CH1 } from '../js/chapters/ch1.js';
import { SCRIPT } from '../js/script.js';

const room = {
  floorY: 180, walk: [0, 292], start: 146,
  hotspots: [
    { id: 'a', rect: { x: 10, y: 10, w: 40, h: 40 }, standX: 20, look: 'k.a' },
    { id: 'b', rect: { x: 40, y: 40, w: 40, h: 40 }, standX: 50, look: 'k.b' },
  ],
};

test('hotspot lookup: inside, outside, edges, and the later-listed one wins an overlap', () => {
  assert.equal(hotspotAt(room, 15, 15).id, 'a');
  assert.equal(hotspotAt(room, 45, 45).id, 'b');           // overlap: drawn last, on top
  assert.equal(hotspotAt(room, 49, 49).id, 'b');
  assert.equal(hotspotAt(room, 79, 79).id, 'b');
  assert.equal(hotspotAt(room, 80, 80), null);              // w/h are exclusive
  assert.equal(hotspotAt(room, 200, 150), null);
  assert.equal(hotspotAt(room, NaN, 3), null);
});

test('a floor tap walks the hero so their feet land where the tap was, inside the walk range', () => {
  assert.equal(walkTarget(room, 100), 86);                  // the sprite is 28 wide; x is its left edge
  assert.equal(walkTarget(room, 2), 0);
  assert.equal(walkTarget(room, 319), 292);
  assert.equal(clampWalk(room, -40), 0);
});

test('a room is checked: rects inside the scene and at least MIN_HIT, stand points walkable, keys exist', () => {
  assert.deepEqual(checkRoom(room, { 'k.a': 'x', 'k.b': 'y' }), []);
  const bad = { ...room, hotspots: [{ id: 'z', rect: { x: 300, y: 5, w: 30, h: 10 }, standX: 400, look: 'nope' }] };
  const problems = checkRoom(bad, {});
  assert.ok(problems.some((p) => /z.*outside/.test(p)), problems.join('\n'));
  assert.ok(problems.some((p) => /z.*small/.test(p)), problems.join('\n'));
  assert.ok(problems.some((p) => /z.*standX/.test(p)), problems.join('\n'));
  assert.ok(problems.some((p) => /nope/.test(p)), problems.join('\n'));
});

test('chapter 1 room: five things, all checked against the real script', () => {
  assert.deepEqual(ROOM.hotspots.map((h) => h.id).sort(), ['contract', 'laptop', 'terminal', 'wallscreen', 'workstation']);
  assert.deepEqual(checkRoom(ROOM, SCRIPT), []);
  assert.ok(MIN_HIT >= 28);
});

test('chapter 1: every script key the chapter names exists', () => {
  const keys = JSON.stringify(CH1).match(/"ch1\.[a-z0-9.]+"/g).map((k) => JSON.parse(k));
  const missing = [...new Set(keys)].filter((k) => !SCRIPT[k]);
  assert.deepEqual(missing, []);
});

test('chapter 1 tools: the old tool has only wrong prompts; the Honeycomb screen has two steps, first prompt right', () => {
  const { old, hc } = CH1.tools;
  assert.equal(old.kind, 'old');
  assert.ok(old.steps[0].prompts.every((p) => !p.right && p.jab));
  assert.equal(hc.kind, 'hc');
  assert.equal(hc.steps.length, 2);
  for (const s of hc.steps) {
    assert.equal(s.prompts.length, 3);
    assert.equal(s.prompts[0].right, true);
    assert.ok(s.prompts.slice(1).every((p) => !p.right && p.jab));
  }
});
