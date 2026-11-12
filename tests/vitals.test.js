import test from 'node:test';
import assert from 'node:assert/strict';
import { vitalsFrame, beatSamples, talkFrame, splitStat, STEP_MS, TALK_MS } from '../js/engine/vitals.js';

const POOL = Array.from({ length: 10 }, (_, i) => `STAT ${i} / VALUE ${i}`);
const OK = Array.from({ length: 5 }, (_, i) => `OK ${i} / FINE ${i}`);
const opts = (state, extra = {}) => ({ state, pool: POOL, okPool: OK, output: "I'd be happy to", outputOk: "I'd be happy to help! Your refund is on its way.", ...extra });
const STEPS = 3000;

function frames(state, extra) {
  const out = [];
  for (let s = 0; s < STEPS; s++) out.push(vitalsFrame(s * STEP_MS, opts(state, extra)));
  return out;
}

test('about ten frames a second', () => {
  assert.equal(STEP_MS, 100);
  assert.equal(vitalsFrame(99, opts('critical')).step, 0);
  assert.equal(vitalsFrame(100, opts('critical')).step, 1);
});

test('a stat is two lines split at " / "', () => {
  assert.deepEqual(splitStat('MODELS AWAKE / 10 OF 12'), ['MODELS AWAKE', '10 OF 12']);
  assert.deepEqual(splitStat('ONE LINE'), ['ONE LINE', '']);
});

for (const state of ['critical', 'ok']) {
  test(`${state}: the three boxes never change on the same step`, () => {
    const f = frames(state);
    for (let s = 1; s < STEPS; s++) {
      const changed = [0, 1, 2].filter((b) => f[s].boxes[b].stat !== f[s - 1].boxes[b].stat || (f[s].boxes[b].garble && !f[s - 1].boxes[b].garble));
      assert.ok(changed.length <= 1, `step ${s}: boxes ${changed} changed together`);
    }
  });

  test(`${state}: no two boxes ever show the same stat`, () => {
    for (const fr of frames(state)) {
      const stats = fr.boxes.map((b) => b.stat);
      assert.equal(new Set(stats).size, 3, `step ${fr.step}: ${stats}`);
    }
  });

  test(`${state}: every box keeps changing, and garbles for exactly one step between stats`, () => {
    const f = frames(state);
    for (let b = 0; b < 3; b++) {
      let changes = 0;
      for (let s = 1; s < STEPS - 1; s++) {
        const was = f[s - 1].boxes[b], now = f[s].boxes[b], next = f[s + 1].boxes[b];
        if (now.stat !== was.stat) {
          changes++;
          assert.equal(now.garble, true, `box ${b} changed at ${s} without a garble step`);
          assert.equal(next.garble, false, `box ${b} garbled for more than one step at ${s}`);
        }
        if (now.garble) assert.notEqual(now.stat, was.stat, `box ${b} garbled at ${s} without changing`);
      }
      assert.ok(changes >= 30, `box ${b} changed only ${changes} times in ${STEPS / 10} s`);
    }
  });

  test(`${state}: box text comes from the right pool; a garble keeps each line's length`, () => {
    const pool = state === 'ok' ? OK : POOL;
    for (const fr of frames(state).slice(0, 400)) for (const b of fr.boxes) {
      const want = splitStat(pool[b.stat]);
      if (b.garble) { assert.deepEqual(b.lines.map((l) => l.length), want.map((l) => l.length)); assert.notDeepEqual(b.lines, want); }
      else assert.deepEqual(b.lines, want);
    }
  });
}

test('critical: red lights that blink, never all on the same rhythm; output types, holds, glitches and starts over', () => {
  const f = frames('critical');
  assert.ok(f.every((fr) => fr.tone === 'red'));
  for (let i = 0; i < 3; i++) assert.ok(f.some((fr) => fr.lights[i]) && f.some((fr) => !fr.lights[i]), `light ${i} never blinks`);
  assert.ok(f.some((fr) => fr.lights[0] !== fr.lights[1] || fr.lights[1] !== fr.lights[2]));
  const out = f.map((fr) => fr.output);
  assert.ok(out.every((o) => o.text === "I'd be happy to"));
  const full = out.findIndex((o) => o.shown === o.text.length);
  assert.ok(full > 0 && out[0].shown < out[full].shown, 'it types');
  assert.ok(out.some((o) => o.glitch), 'it glitches');
  assert.ok(out.slice(full).some((o) => o.shown === 0), 'it starts over');
  assert.ok(out.some((o) => o.cursor) && out.some((o) => !o.cursor), 'the cursor blinks');
});

test('ok: green lights, steady; the output types the whole answer and holds', () => {
  const f = frames('ok');
  assert.ok(f.every((fr) => fr.tone === 'green' && fr.lights.every(Boolean)));
  const out = f.map((fr) => fr.output);
  assert.equal(out[0].text, "I'd be happy to help! Your refund is on its way.");
  const full = out.findIndex((o) => o.shown === o.text.length);
  assert.ok(full > 0);
  assert.ok(out.slice(full).every((o) => o.shown === o.text.length && !o.glitch), 'it holds');
});

test('the heartbeat scrolls left; critical is erratic with flat stretches, ok is a steady rhythm', () => {
  const a = beatSamples(0, 'critical', 60), b = beatSamples(STEP_MS, 'critical', 60);
  assert.equal(a.length, 60);
  assert.ok(a.every((v) => v >= 0 && v <= 1));
  assert.deepEqual(b.slice(0, 58), a.slice(2), 'one step scrolls the trace left');
  const long = beatSamples(0, 'critical', 2000);
  let flat = 0, run = 0;
  for (let i = 1; i < long.length; i++) { run = Math.abs(long[i] - long[i - 1]) < 0.03 ? run + 1 : 0; if (run === 40) flat++; }
  assert.ok(flat >= 3, `only ${flat} flat stretches`);
  const peaks = (s) => s.map((v, i) => (v > 0.85 ? i : -1)).filter((i) => i >= 0 && s[i - 1] <= 0.85);
  const okGaps = peaks(beatSamples(0, 'ok', 600)).map((p, i, ps) => (i ? p - ps[i - 1] : null)).filter((g) => g !== null);
  assert.ok(okGaps.length >= 10 && new Set(okGaps).size === 1, `ok rhythm not steady: ${okGaps}`);
  const critGaps = peaks(long).map((p, i, ps) => (i ? p - ps[i - 1] : null)).filter((g) => g !== null);
  assert.ok(new Set(critGaps).size > 3, 'critical rhythm is too regular');
});

test('reduced motion: one still frame per state', () => {
  for (const state of ['critical', 'ok']) {
    const a = vitalsFrame(0, opts(state, { reduced: true })), b = vitalsFrame(123456, opts(state, { reduced: true }));
    assert.deepEqual({ ...a, step: 0 }, { ...b, step: 0 });
    assert.ok(a.boxes.every((x) => !x.garble));
    assert.equal(a.output.shown, a.output.text.length);
    assert.equal(a.output.glitch, false);
    assert.ok(a.lights.every(Boolean));
    assert.deepEqual(beatSamples(0, state, 50, true), beatSamples(99999, state, 50, true));
  }
  assert.notDeepEqual(vitalsFrame(0, opts('critical', { reduced: true })).boxes.map((b) => b.lines), vitalsFrame(0, opts('ok', { reduced: true })).boxes.map((b) => b.lines));
});

test('a tap steps one box to its next stat, never one another box is showing', () => {
  const nudges = [{ step: 5, box: 1 }];
  const before = vitalsFrame(4 * STEP_MS, opts('critical', { nudges }));
  const at = vitalsFrame(5 * STEP_MS, opts('critical', { nudges }));
  assert.notEqual(at.boxes[1].stat, before.boxes[1].stat);
  assert.equal(at.boxes[0].stat, before.boxes[0].stat);
  assert.equal(at.boxes[2].stat, before.boxes[2].stat);
  assert.equal(new Set(at.boxes.map((b) => b.stat)).size, 3);
  // under reduced motion the tap still steps the box, with no garble
  const r = vitalsFrame(9e5, opts('critical', { reduced: true, nudges: [{ step: 3, box: 0 }] }));
  const r0 = vitalsFrame(0, opts('critical', { reduced: true }));
  assert.notEqual(r.boxes[0].stat, r0.boxes[0].stat);
  assert.equal(r.boxes[0].garble, false);
});

test('the CTO talks: plate, mouth 1, plate, mouth 2, a frame every 250–400 ms; reduced motion holds the plate', () => {
  assert.ok(TALK_MS >= 250 && TALK_MS <= 400);
  assert.deepEqual([0, 1, 2, 3, 4].map((i) => talkFrame(i * TALK_MS + 1)), [0, 1, 0, 2, 0]);
  assert.equal(talkFrame(TALK_MS + 1, true), 0);
});
