// The title screen's clock (Warp brief 16): the twinkle, the glow, the Start beat.
import test from 'node:test';
import assert from 'node:assert/strict';
import { starsOn, starRhythm, glowAt, startBeat, STAR_ON_MS, STAR_OFF_MS, STARS_MAX_ON, STAR_COUNT, GLOW } from '../js/title/timeline.js';

test('each star is on about 400 ms in every cycle of its own, off three to six seconds, from its index', () => {
  for (let i = 0; i < STAR_COUNT; i++) {
    const { period, phase } = starRhythm(i);
    assert.ok(period >= STAR_ON_MS + STAR_OFF_MS[0] && period <= STAR_ON_MS + STAR_OFF_MS[1], `${i}: ${period}`);
    assert.ok(phase >= 0 && phase < period);
    let on = 0; for (let t = 0; t < period; t += 10) if ((((t + phase) % period) + period) % period < STAR_ON_MS) on += 10;
    assert.ok(Math.abs(on - STAR_ON_MS) <= 10, `${i}: on ${on} ms a cycle`);
  }
  const periods = new Set(Array.from({ length: STAR_COUNT }, (_, i) => starRhythm(i).period));
  assert.ok(periods.size >= 8, 'their rhythms differ');
});
test('over a minute every star has been on; never more than three at once; the same t gives the same answer', () => {
  const seen = new Set();
  for (let t = 0; t < 60000; t += 20) {
    const on = starsOn(t);
    assert.ok(on.length <= STARS_MAX_ON, `${t}: ${on.length} on`);
    assert.deepEqual(on, starsOn(t));
    assert.deepEqual(on, [...on].sort((a, b) => a - b));
    for (const i of on) seen.add(i);
  }
  assert.equal(seen.size, STAR_COUNT, `stars never on: ${Array.from({ length: STAR_COUNT }, (_, i) => i).filter((i) => !seen.has(i))}`);
  let any = 0; for (let t = 0; t < 10000; t += 100) if (starsOn(t).length) any++;
  assert.ok(any > 20, 'something twinkles most of the time');
});
test('a star that is on stays on for its whole 400 ms unless three came on before it', () => {
  for (let t = 0; t < 30000; t += 50) {
    const now = starsOn(t), next = starsOn(t + 50);
    for (const i of now) {
      const { period, phase } = starRhythm(i), k = (t + 50 + phase) % period;
      if (k < STAR_ON_MS && k >= 50) assert.ok(next.includes(i) || next.length === STARS_MAX_ON, `${t}: star ${i} went out early`);
    }
  }
});
test('the glow: 1.0, 0.9, 0.8, 0.7, 0.8, 0.9 by 500 ms steps, round again; 1.0 under reduced motion', () => {
  assert.deepEqual([0, 499, 500, 1000, 1500, 2000, 2500, 3000, 3499, 3500].map((t) => glowAt(t)), [1.0, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 1.0, 0.9]);
  assert.deepEqual(GLOW, [1.0, 0.9, 0.8, 0.7, 0.8, 0.9]);
  for (const t of [0, 700, 1600, 99999]) assert.equal(glowAt(t, true), 1.0);
  assert.equal(glowAt(-10), 1.0);
});
test('the Start beat: lit from 0; one beep by 0, two by 300; the creator at 600', () => {
  assert.deepEqual(startBeat(-1), { lit: false, beeps: 0, go: false });
  assert.deepEqual(startBeat(0), { lit: true, beeps: 1, go: false });
  assert.deepEqual(startBeat(299), { lit: true, beeps: 1, go: false });
  assert.deepEqual(startBeat(300), { lit: true, beeps: 2, go: false });
  assert.deepEqual(startBeat(599), { lit: true, beeps: 2, go: false });
  assert.deepEqual(startBeat(600), { lit: true, beeps: 2, go: true });
  assert.deepEqual(startBeat(5000), { lit: true, beeps: 2, go: true });
});
