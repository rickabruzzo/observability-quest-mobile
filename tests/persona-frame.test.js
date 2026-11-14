// The persona's frame in the room (Warp brief 08): rest, idle, talking, the win frame, reduced motion; and the
// card's painted frames. Pure functions in js/engine/persona.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { personaFrame, TALK_MS, cardFrameAt, CARD_FRAME_MS, phoneRows } from '../js/engine/persona.js';

const F = { talk: ['t1', 't2'], rest: 'look', idle: ['scratch', 'mark'], win: 'win' };
const PLATE = { talk: ['t1', 't2'], rest: null, idle: [], win: null };

test('talking: the two talk frames alternate with the rest frame at about 320 ms a frame', () => {
  assert.equal(TALK_MS, 320);
  const seq = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => personaFrame({ t: i * TALK_MS + 1, talking: true, frames: F }));
  assert.deepEqual(seq, ['look', 't1', 'look', 't2', 'look', 't1', 'look', 't2']);
  assert.equal(personaFrame({ t: TALK_MS + 1, talking: true, frames: PLATE }), 't1');
  assert.equal(personaFrame({ t: 1, talking: true, frames: PLATE }), null);           // the plate is the rest frame
});

test('otherwise they rest: the rest frame, or the plate when there is none', () => {
  assert.equal(personaFrame({ t: 1000, talking: false, frames: { ...F, idle: [] } }), 'look');
  assert.equal(personaFrame({ t: 1000, talking: false, frames: PLATE }), null);
});

test('with idle frames, every 4–10 s one shows for 0.6–1 s, then back to rest; the schedule is the seed\'s own', () => {
  const sample = (seed) => { const out = []; for (let t = 0; t < 120000; t += 50) out.push(personaFrame({ t, talking: false, frames: F, seed })); return out; };
  const a = sample(1);
  const idle = a.map((f, i) => (f !== 'look' ? i : -1)).filter((i) => i >= 0);
  assert.ok(idle.length > 0, 'something happens');
  assert.ok(idle.every((i) => ['scratch', 'mark'].includes(a[i])));
  // runs of idle frames: 0.6–1 s long, 4–10 s apart
  const runs = []; let start = null;
  a.forEach((f, i) => { if (f !== 'look' && start === null) start = i; if (f === 'look' && start !== null) { runs.push([start, i]); start = null; } });
  assert.ok(runs.length >= 8 && runs.length <= 26, `${runs.length} runs in two minutes`);
  for (const [s, e] of runs) assert.ok((e - s) * 50 >= 550 && (e - s) * 50 <= 1050, `run ${(e - s) * 50} ms`);
  for (let i = 1; i < runs.length; i++) { const gap = (runs[i][0] - runs[i - 1][1]) * 50; assert.ok(gap >= 3900 && gap <= 10100, `gap ${gap} ms`); }
  assert.ok(new Set(a.filter((f) => f !== 'look')).size === 2, 'both idle frames turn up');
  assert.notDeepEqual(a, sample(2));
});

test('the win frame holds from the win on, over everything, reduced motion included', () => {
  for (const t of [0, 500, 7000]) {
    assert.equal(personaFrame({ t, talking: true, won: true, frames: F }), 'win');
    assert.equal(personaFrame({ t, talking: false, won: true, reduced: true, frames: F }), 'win');
  }
  assert.equal(personaFrame({ t: 400, talking: true, won: true, frames: PLATE }), 't1', 'no win frame: the loop goes on');
});

test('reduced motion: the rest frame only', () => {
  for (let t = 0; t < 30000; t += 333) {
    assert.equal(personaFrame({ t, talking: true, reduced: true, frames: F }), 'look');
    assert.equal(personaFrame({ t, talking: false, reduced: true, frames: PLATE }), null);
  }
});

test('scenario 1\'s CTO keeps her phone loop: always talking unless quiet', () => {
  assert.equal(personaFrame({ t: TALK_MS + 1, talking: false, loop: 'always', frames: PLATE }), 't1');
  assert.equal(personaFrame({ t: TALK_MS + 1, talking: false, loop: 'always', quiet: true, frames: PLATE }), null);
});

test('a card with painted frames cycles card → 1 → 2 → 3 → 2 → 1 at about 180 ms; a card without frames is still', () => {
  assert.equal(CARD_FRAME_MS, 180);
  const frames = ['a.png', 'b.png', 'c.png'];
  const seq = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => cardFrameAt(i * CARD_FRAME_MS + 1, frames));
  assert.deepEqual(seq, [null, 'a.png', 'b.png', 'c.png', 'b.png', 'a.png', null, 'a.png']);
  assert.equal(cardFrameAt(999, []), null); assert.equal(cardFrameAt(999, undefined), null);
  assert.equal(cardFrameAt(999, frames, true), null, 'reduced motion: the still card');
});

test('Knight Watch\'s phone: 1 px rows scrolling up a 6×6 screen, one new row every other pixel, 1 px every 120 ms', () => {
  const r0 = phoneRows(0, { w: 6, h: 6 }), r1 = phoneRows(121, { w: 6, h: 6 });
  assert.ok(r0.length >= 2 && r0.every((r) => r.y >= 0 && r.y < 6 && r.w >= 2 && r.w <= 6));
  assert.ok(r0.every((r) => r.y % 2 === 0) || r1.every((r) => r.y % 2 === 1), 'rows sit every other pixel');
  assert.notDeepEqual(r0, r1, 'they move');
  assert.deepEqual(phoneRows(0, { w: 6, h: 6 }, true), r0, 'reduced motion holds the first frame');
  assert.deepEqual(phoneRows(5000, { w: 6, h: 6 }, true), r0);
});
