import test from 'node:test'; import assert from 'node:assert/strict';
import { SHOTS, frameAt, nextShot, TOTAL_MS, HERO_STEPS, heroAt, FLASH_MS } from '../js/intro/timeline.js';

test('shots are the storyboard, in order, with its timings', () => {
  assert.deepEqual(SHOTS.map((s) => s.id), ['dark', 'help', 'asleep', 'arm', 'lit', 'message', 'misery', 'lamp', 'bedroom']);
  assert.deepEqual(SHOTS.map((s) => s.ms), [3000, 2500, 3000, 1500, 2000, 8000, 2000, 1500, 9000]);
  assert.equal(TOTAL_MS, 32500);
  assert.equal(SHOTS[1].text, 'Help!');
  assert.equal(SHOTS[5].text, 'Backend is down. Website is down. Database is down. Get in here! -CTO');
});
test('dark room flashes to black', () => { assert.equal(frameAt(0, 0).black, false); assert.equal(frameAt(0, 300).black, true); assert.equal(frameAt(0, 0).image, 'A_room_dark'); });
test('pager LCD flashes Help! then scrolls the message', () => {
  assert.deepEqual(frameAt(1, 0).lcd, { text: 'Help!', mode: 'flash', on: true }); assert.equal(frameAt(1, 300).lcd.on, false);
  assert.equal(frameAt(5, 300).lcd.mode, 'marquee'); assert.equal(frameAt(5, 300).lcd.on, true);
  assert.equal(frameAt(3, 0).lcd, null);
});
test('cuts to the alternate still at altAt', () => {
  assert.equal(frameAt(2, 1799).image, 'C_face_asleep'); assert.equal(frameAt(2, 1800).image, 'C_eye_crack');
  assert.equal(frameAt(7, 699).image, 'B_lamp'); assert.equal(frameAt(7, 700).image, 'B_lamp_lit');
});
test('green flash on the face alternates whole stills', () => { assert.equal(frameAt(4, 0).image, 'C_awake_lit'); assert.equal(frameAt(4, 300).image, 'C_awake'); });
test('reduced motion: nothing flashes', () => {
  assert.equal(frameAt(0, 300, { reduced: true }).black, false);
  assert.equal(frameAt(4, 0, { reduced: true }).image, 'C_awake');
  assert.deepEqual(frameAt(5, 0, { reduced: true }).lcd, { text: SHOTS[5].text, mode: 'static', on: true });
  assert.equal(frameAt(1, 300, { reduced: true }).lcd.on, true);
  assert.equal(frameAt(7, 0, { reduced: true }).image, 'B_lamp_lit');
  assert.equal(frameAt(2, 0, { reduced: true }).image, 'C_face_asleep'); assert.equal(frameAt(2, 1800, { reduced: true }).image, 'C_eye_crack');
});
test('nextShot runs off the end', () => { assert.equal(nextShot(0), 1); assert.equal(nextShot(8), null); });
test('out-of-range shot index is clamped, not thrown', () => { assert.equal(frameAt(99, 0).image, 'D_bedroom_vga'); assert.equal(frameAt(-1, 0).image, 'A_room_dark'); });
test('hero script', () => {
  assert.equal(heroAt(0).visible, false); assert.equal(heroAt(0).titled, false); assert.equal(heroAt(700).titled, true);
  assert.deepEqual([heroAt(1700).pose, heroAt(1700).outfit, heroAt(1700).visible], ['situp', 'pj', true]);
  assert.deepEqual([heroAt(3000).pose, heroAt(3000).outfit], ['idle', 'pj']);
  assert.equal(heroAt(3650).flash, true); assert.equal(heroAt(3000).flash, false); assert.equal(heroAt(3800).flash, false);
  assert.deepEqual([heroAt(3800).pose, heroAt(3800).outfit], ['idle', 'hoodie']);
  // dressed first, then the item comes off the dresser into the hand, then the walk
  assert.equal(heroAt(3000).holding, false); assert.equal(heroAt(3900).holding, false); assert.equal(heroAt(4300).holding, true);
  assert.equal(heroAt(4600).walking, false); assert.equal(heroAt(4800).walking, true); assert.equal(heroAt(4800).holding, true);
  assert.ok(HERO_STEPS.every((s, i) => i === 0 || s.at > HERO_STEPS[i - 1].at));
});
test('no flash faster than 2 Hz', () => assert.ok(FLASH_MS >= 500));
test('sampled every ms, no shot changes picture more than 4 times a second', () => {
  SHOTS.forEach((s, i) => {
    let last = null, changes = 0;
    for (let t = 0; t < s.ms; t++) { const f = frameAt(i, t); const k = `${f.image}|${f.black}|${f.lcd?.on}`; if (last !== null && k !== last) changes++; last = k; }
    assert.ok(changes <= Math.ceil(s.ms / 250), `${s.id}: ${changes} changes in ${s.ms} ms`);
  });
});

import { exitPlan, exitAt } from '../js/intro/timeline.js';
test('the way out: across the floor, up to the threshold, door opens, hero gone, door shuts', () => {
  const p = exitPlan({ standX: 158, doorX: 261, floorY: 178, doorY: 153 });
  assert.ok(p.total > 1500 && p.total < 3500, String(p.total));
  const a = exitAt(p, 0); assert.deepEqual([a.x, a.y, a.visible, a.doorOpen, a.done], [158, 178, true, false, false]);
  const mid = exitAt(p, p.across / 2); assert.ok(mid.x > 158 && mid.x < 261 && mid.y === 178 && /^walk/.test(mid.pose));
  const up = exitAt(p, p.across + p.up / 2); assert.equal(up.x, 261); assert.ok(up.y < 178 && up.y > 153);
  const open = exitAt(p, p.across + p.up + 10); assert.deepEqual([open.x, open.y, open.pose, open.visible, open.doorOpen], [261, 153, 'idle', true, true]);
  const gone = exitAt(p, p.across + p.up + p.open + 10); assert.deepEqual([gone.visible, gone.doorOpen, gone.done], [false, true, false]);
  const shut = exitAt(p, p.across + p.up + p.open + p.gone + 10); assert.deepEqual([shut.visible, shut.doorOpen, shut.done], [false, false, false]);
  assert.equal(exitAt(p, p.total).done, true);
});
test('the way out with the door on the hero\'s own row skips the walk up; leftward doors flip', () => {
  const p = exitPlan({ standX: 200, doorX: 40, floorY: 176, doorY: 176 });
  assert.equal(p.up, 0); assert.equal(exitAt(p, 10).flip, true);
});
test('the hero script fits inside the bedroom shot with the exit', () => {
  const p = exitPlan({ standX: 0, doorX: 292, floorY: 190, doorY: 150 });      // the longest walk a 320px room allows
  assert.ok(HERO_STEPS.at(-1).at + p.total <= SHOTS.at(-1).ms, `${HERO_STEPS.at(-1).at + p.total}`);
});
