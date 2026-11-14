import test from 'node:test'; import assert from 'node:assert/strict';
import { SHOTS, frameAt, nextShot, TOTAL_MS, HERO_STEPS, heroAt, FLASH_MS } from '../js/intro/timeline.js';

test('shots are the storyboard, in order, with its timings', () => {
  assert.deepEqual(SHOTS.map((s) => s.id), ['dark', 'help', 'asleep', 'arm', 'lit', 'message', 'misery', 'wide', 'bedroom']);
  assert.deepEqual(SHOTS.map((s) => s.ms), [3000, 2500, 3000, 1500, 2000, 5000, 2000, 1400, 15000]);
  assert.equal(TOTAL_MS, 35400);
  assert.equal(SHOTS[1].text, 'Help!');
  assert.equal(SHOTS[5].text, 'Backend is down. Front end is down. Database is down. Get in here! -CTO');
});
test('dark room flashes to black', () => { assert.equal(frameAt(0, 0).black, false); assert.equal(frameAt(0, 300).black, true); assert.equal(frameAt(0, 0).image, 'A_room_dark'); });
test('pager LCD flashes Help! then scrolls the message', () => {
  assert.deepEqual(frameAt(1, 0).lcd, { text: 'Help!', mode: 'flash', on: true }); assert.equal(frameAt(1, 300).lcd.on, false);
  assert.equal(frameAt(5, 300).lcd.mode, 'marquee'); assert.equal(frameAt(5, 300).lcd.on, true);
  assert.equal(frameAt(3, 0).lcd, null);
});
test('cuts to the alternate still at altAt', () => {
  assert.equal(frameAt(2, 1799).image, 'C_face_asleep'); assert.equal(frameAt(2, 1800).image, 'C_eye_crack');
  // back to the wide dark room, steady in the pager's glow; the light comes on as the cut to the bedroom
  assert.equal(frameAt(7, 0).image, 'A_room_dark'); assert.equal(frameAt(7, 300).black, false); assert.equal(frameAt(7, 1399).image, 'A_room_dark');
  assert.equal(SHOTS[8].clickAt, 0);
  assert.ok(!SHOTS.some((s) => /lamp/i.test(`${s.image}${s.alt || ''}`)), 'the lamp close-up is gone');
});
test('green flash on the face alternates whole stills', () => { assert.equal(frameAt(4, 0).image, 'C_awake_lit'); assert.equal(frameAt(4, 300).image, 'C_awake'); });
test('reduced motion: nothing flashes', () => {
  assert.equal(frameAt(0, 300, { reduced: true }).black, false);
  assert.equal(frameAt(4, 0, { reduced: true }).image, 'C_awake');
  assert.deepEqual(frameAt(5, 0, { reduced: true }).lcd, { text: SHOTS[5].text, mode: 'static', on: true });
  assert.equal(frameAt(1, 300, { reduced: true }).lcd.on, true);
  assert.equal(frameAt(7, 0, { reduced: true }).image, 'A_room_dark');
  assert.equal(frameAt(2, 0, { reduced: true }).image, 'C_face_asleep'); assert.equal(frameAt(2, 1800, { reduced: true }).image, 'C_eye_crack');
});
test('nextShot runs off the end', () => { assert.equal(nextShot(0), 1); assert.equal(nextShot(8), null); });
test('out-of-range shot index is clamped, not thrown', () => { assert.equal(frameAt(99, 0).image, 'D_bedroom_vga'); assert.equal(frameAt(-1, 0).image, 'A_room_dark'); });
test('hero script: the room holds on the title, then up, dressed, a beat, the item, the door', () => {
  const at = Object.fromEntries(HERO_STEPS.map((s) => [s.walkTo ? 'walk' : s.take ? 'take' : s.flash ? 'flash' : s.pose ? `${s.pose}-${s.outfit}` : s.do, s.at]));
  // the light comes on with the title already on the wall and the hero already sitting up in bed — never an empty bed
  let h = heroAt(0); assert.deepEqual([h.visible, h.pose, h.outfit, h.titled], [true, 'situp', 'pj', true]);
  assert.equal(at['situp-pj'], 0);
  assert.ok(at['idle-pj'] >= 3000, 'the title gets at least 3 s before the hero gets up');
  assert.ok(at.rustle > 2000 && at.rustle < at['idle-pj'], 'the covers go back just before the feet hit the floor');
  assert.equal(heroAt(at.rustle - 1).stirring, false); assert.equal(heroAt(at.rustle + 1).stirring, true);
  h = heroAt(at['idle-pj'] + 100); assert.deepEqual([h.pose, h.outfit, h.flash], ['idle', 'pj', false]);
  assert.equal(heroAt(at.flash + 50).flash, true);
  h = heroAt(at['idle-hoodie'] + 40); assert.deepEqual([h.pose, h.outfit, h.flash, h.holding], ['idle', 'hoodie', false, false]);
  assert.ok(at.take - at['idle-hoodie'] >= 900, 'a beat between getting dressed and taking the item');
  assert.equal(heroAt(at.take - 1).holding, false); assert.equal(heroAt(at.take + 1).holding, true);
  assert.ok(at.walk - at.take >= 500); assert.equal(heroAt(at.walk - 1).walking, false); assert.equal(heroAt(at.walk + 1).walking, true);
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
import { SIDE_POSES } from '../js/engine/hero-side.js';
import { STRIDE_PX } from '../js/engine/walk.js';
test('the way out: across the floor, up to the threshold, door opens, hero gone, door shuts', () => {
  const p = exitPlan({ standX: 158, doorX: 261, floorY: 178, doorY: 153 });
  assert.ok(p.total > 1700 && p.total < 5000, String(p.total));      // 103 px at a stroll, a few steps up, the door
  const a = exitAt(p, 0); assert.deepEqual([a.x, a.y, a.visible, a.doorOpen, a.done], [158, 178, true, false, false]);
  const mid = exitAt(p, p.across / 2); assert.ok(mid.x > 158 && mid.x < 261 && mid.y === 178 && /^w[1-8]$/.test(mid.pose));
  // A stroll: about a step and a half a second. The era hero's stride is 76 px (× the bedroom's 0.85), so the
  // same cadence is about 100 px/s; the old ceiling of 70 px/s was for the 38-px stride (Warp brief 09).
  assert.ok(p.across >= 103 / 130 * 1000, 'the walk out is a stroll: no faster than 130 px/s');
  assert.ok(p.across <= 103 / 80 * 1000, 'but not a dawdle: at least 80 px/s, or the long stride goes to slow motion');
  const up = exitAt(p, p.across + p.up / 2); assert.equal(up.x, 261); assert.ok(up.y < 178 && up.y > 153);
  assert.ok(/^w[1-8]$/.test(up.pose), 'the few steps up to the door still walk — there is no back view');
  const open = exitAt(p, p.across + p.up + 10); assert.deepEqual([open.x, open.y, open.pose, open.visible, open.doorOpen], [261, 153, 'stand', true, true]);
  const gone = exitAt(p, p.across + p.up + p.open + 10); assert.deepEqual([gone.visible, gone.doorOpen, gone.done], [false, true, false]);
  const shut = exitAt(p, p.across + p.up + p.open + p.gone + 10); assert.deepEqual([shut.visible, shut.doorOpen, shut.done], [false, false, false]);
  assert.equal(exitAt(p, p.total).done, true);
});
test('the whole way out is the profile view: there is no back view to turn into', () => {
  const p = exitPlan({ standX: 158, doorX: 261, floorY: 178, doorY: 153 });
  for (let t = 0; t <= p.total; t += 25) {
    const e = exitAt(p, t);
    assert.equal(e.view, 'side', `t=${t}`);
    assert.ok(SIDE_POSES.includes(e.pose), `t=${t}: ${e.pose}`);
  }
});
test('the exit frame comes from distance travelled, so the feet do not slide', () => {
  const p = exitPlan({ standX: 0, doorX: 190, floorY: 180, doorY: 180 });
  assert.equal(exitAt(p, 0).pose, 'w1');
  const atPx = (px) => exitAt(p, (px / 190) * p.across).pose;          // the walk across is linear in t
  assert.equal(atPx(STRIDE_PX), 'w1', 'one full cycle per stride');
  assert.equal(atPx(STRIDE_PX * 2), 'w1');
  assert.deepEqual([...new Set(Array.from({ length: STRIDE_PX }, (_, d) => atPx(d)))], SIDE_POSES.slice(1));
});
test('a scaled hero strides a scaled distance: the cycle repeats every STRIDE_PX × heroScale scene px', () => {
  const p = exitPlan({ standX: 0, doorX: 190, floorY: 180, doorY: 180, heroScale: 0.5 });
  const atPx = (px) => exitAt(p, (px / 190) * p.across).pose;
  assert.equal(atPx(0), 'w1');
  assert.equal(atPx(STRIDE_PX / 2), 'w1', 'half the stride at half the size');
  assert.notEqual(atPx(STRIDE_PX / 4), 'w1');
  assert.deepEqual([...new Set(Array.from({ length: STRIDE_PX / 2 }, (_, d) => atPx(d)))], SIDE_POSES.slice(1));
  assert.equal(exitPlan({ standX: 0, doorX: 190, floorY: 180, doorY: 180 }).heroScale, 1);
});
test('the bedroom draws the hero at 0.85 of his size: taller than 136 px he would overtop his own 132-px door', () => {
  const bedroom = SHOTS.at(-1);
  assert.equal(bedroom.id, 'bedroom'); assert.equal(bedroom.heroScale, 0.85);
  assert.ok(SHOTS.slice(0, -1).every((s) => s.heroScale === undefined), 'only the shot with the hero carries a scale');
});
test('the way out with the door on the hero\'s own row skips the walk up; leftward doors flip', () => {
  const p = exitPlan({ standX: 200, doorX: 40, floorY: 176, doorY: 176 });
  assert.equal(p.up, 0); assert.equal(exitAt(p, 10).flip, true);
});
test('the hero script fits inside the bedroom shot with the exit', () => {
  const p = exitPlan({ standX: 0, doorX: 292, floorY: 190, doorY: 150 });      // the longest walk a 320px room allows
  assert.ok(HERO_STEPS.at(-1).at + p.total <= SHOTS.at(-1).ms, `${HERO_STEPS.at(-1).at + p.total}`);
});

test('the wide dark shot can carry the title, dimmed, for the lights to reveal', () => { assert.equal(SHOTS[7].title, 'dim'); });
