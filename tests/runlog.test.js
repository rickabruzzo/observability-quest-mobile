import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunlog, formatMs, summaryLines, PHASES } from '../js/engine/runlog.js';

function clock() { let t = 1000; const now = () => t; now.add = (ms) => { t += ms; }; return now; }

test('phases are timed back to back and add up to the total', () => {
  const now = clock(), r = createRunlog({ chapter: 1, now });
  r.phase('card'); now.add(4000);
  r.phase('room'); now.add(10000);
  r.phase('old'); now.add(6000);
  r.phase('room'); now.add(2000);                      // back from the old tool: room time accumulates
  r.phase('pc'); now.add(3000);
  r.phase('hc'); now.add(20000);
  r.phase('pc'); now.add(1000);
  r.phase('monitor'); now.add(5000);
  r.phase('deploy'); now.add(8000);
  r.phase('cto'); now.add(7000);
  r.phase('win'); now.add(9000);
  r.end(2);
  const s = r.snapshot();
  assert.deepEqual(PHASES, ['card', 'room', 'pc', 'old', 'hc', 'deploy', 'monitor', 'cto', 'win']);
  assert.deepEqual(s.phases, { card: 4000, room: 12000, pc: 4000, old: 6000, hc: 20000, deploy: 8000, monitor: 5000, cto: 7000, win: 9000 });
  assert.equal(s.total, 75000);
  assert.equal(Object.values(s.phases).reduce((a, b) => a + b, 0), s.total);
  assert.equal(s.missteps, 2);
  assert.equal(s.done, true);
  assert.ok(!('score' in s), 'no score in the stopwatch');
});

test('time on hold (rotate gate, hidden tab) does not count, and overlapping holds count once', () => {
  const now = clock(), r = createRunlog({ chapter: 1, now });
  r.phase('room'); now.add(1000);
  r.hold('rotate', true); now.add(5000);
  r.hold('hidden', true); now.add(5000);
  r.hold('rotate', false); now.add(5000);
  r.hold('hidden', false); now.add(1000);
  assert.equal(r.snapshot().elapsed, 2000);
  assert.equal(r.snapshot().phases.room, 2000);
  assert.equal(r.snapshot().held, false);
});

test('the clock is frozen while held: a snapshot taken on hold does not move', () => {
  const now = clock(), r = createRunlog({ chapter: 1, now });
  r.phase('room'); now.add(1500); r.hold('rotate', true);
  const a = r.snapshot().elapsed; now.add(9000);
  assert.equal(r.snapshot().elapsed, a);
  assert.equal(r.snapshot().held, true);
});

test('counts: windows, taps, walks and walking time, wrong prompts, old-tool prompts, looks, distinct hotspots, emails, vitals, monitor, signed', () => {
  const r = createRunlog({ chapter: 1, now: clock() });
  r.count('windows'); r.count('windows'); r.count('taps', 3); r.walk(1200); r.walk(800);
  r.count('nudges'); r.count('oldPrompts', 3); r.count('looks');
  r.count('emails', 2); r.count('vitals'); r.count('monitor', 2); r.count('signed');
  r.visit('pc'); r.visit('pc'); r.visit('cto');
  const c = r.snapshot().counts;
  assert.deepEqual(c, { windows: 2, taps: 3, walks: 2, walkMs: 2000, nudges: 1, oldPrompts: 3, looks: 1, emails: 2, vitals: 1, monitor: 2, signed: 1, visited: 2 });
  assert.deepEqual(r.snapshot().visited, ['pc', 'cto']);
});

test('after end nothing moves', () => {
  const now = clock(), r = createRunlog({ chapter: 1, now });
  r.phase('card'); now.add(1000); r.end(1); now.add(5000);
  r.phase('room'); r.count('taps');
  assert.equal(r.snapshot().total, 1000);
  assert.equal(r.snapshot().counts.taps, 0);
});

test('m:ss', () => {
  assert.equal(formatMs(0), '0:00');
  assert.equal(formatMs(59499), '0:59');
  assert.equal(formatMs(59500), '1:00');
  assert.equal(formatMs(134000), '2:14');
  assert.equal(formatMs(600000), '10:00');
});

test('summary lines carry the total, every phase and every count', () => {
  const now = clock(), r = createRunlog({ chapter: 1, now });
  r.phase('card'); now.add(3000); r.phase('room'); now.add(60000); r.phase('hc'); now.add(30000); r.phase('win'); now.add(10000);
  r.count('taps', 9); r.end(1);
  const text = summaryLines(r.snapshot()).join('\n');
  assert.match(text, /1:43/);
  for (const w of ['Class card', 'Room', 'PC', 'Old tool', 'Honeycomb screen', 'Deploy', 'Monitor', 'CTO', 'Win', 'Taps', 'Honeycomb nudges', 'Emails', 'Vitals', 'Signed', 'Missteps: 1']) assert.match(text, new RegExp(w));
  assert.doesNotMatch(text, /score/i);
});
