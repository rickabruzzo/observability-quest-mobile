import test from 'node:test'; import assert from 'node:assert/strict';
import { SHOTS, frameAt, nextShot, TOTAL_MS, HERO_STEPS, heroAt, FLASH_MS } from '../js/intro/timeline.js';

test('shots are the storyboard, in order, with its timings', () => {
  assert.deepEqual(SHOTS.map((s) => s.id), ['dark', 'help', 'asleep', 'arm', 'lit', 'message', 'misery', 'lamp', 'bedroom']);
  assert.deepEqual(SHOTS.map((s) => s.ms), [3000, 2500, 3000, 1500, 2000, 8000, 2000, 1500, 8000]);
  assert.equal(TOTAL_MS, 31500);
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
  assert.equal(heroAt(4300).walking, false); assert.equal(heroAt(4500).walking, true);
  assert.ok(HERO_STEPS.every((s, i) => i === 0 || s.at > HERO_STEPS[i - 1].at));
});
test('no flash faster than 2 Hz', () => assert.ok(FLASH_MS >= 500));
