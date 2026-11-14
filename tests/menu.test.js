import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDone, serializeDone, recordDone, solvedCount, menuRows, parseCh, afterIntro, canClaim, SCENARIOS, AVAILABLE } from '../js/menu.js';
import * as menu from '../js/menu.js';
import { SCRIPT } from '../js/script.js';

test('five scenarios, in order; all five are built', () => {
  assert.deepEqual(SCENARIOS, [1, 2, 3, 4, 5]);
  assert.deepEqual(AVAILABLE, [1, 2, 3, 4, 5]);
});

test('completion is scenario → missteps, stored with a version; junk and unknown scenarios are dropped', () => {
  assert.deepEqual(parseDone(null), {});
  assert.deepEqual(parseDone('not json'), {});
  assert.deepEqual(parseDone('[1,2]'), {});
  const raw = serializeDone({ 1: 0, 3: 2 });
  assert.deepEqual(JSON.parse(raw), { v: 2, done: { 1: 0, 3: 2 } });
  assert.deepEqual(parseDone(raw), { 1: 0, 3: 2 });
  assert.deepEqual(parseDone('{"v":2,"done":{"1":0,"9":0,"2":-1,"4":1.5,"5":"x"}}'), { 1: 0 });
});

test('an old-format oq.done (scenario → score) reads without crashing: 100 is no missteps, anything else is one', () => {
  assert.deepEqual(parseDone('{"1":100}'), { 1: 0 });
  assert.deepEqual(parseDone('{"1":50,"2":100,"9":100,"3":"x"}'), { 1: 1, 2: 0 });
});

test('a replay keeps the fewer missteps', () => {
  let d = recordDone({}, 1, 2);
  assert.deepEqual(d, { 1: 2 });
  d = recordDone(d, 1, 0);
  assert.deepEqual(d, { 1: 0 });
  d = recordDone(d, 1, 3);
  assert.deepEqual(d, { 1: 0 });
});

test('the status bar counts solved scenarios', () => {
  assert.equal(solvedCount({}), 0);
  assert.equal(solvedCount({ 1: 0, 3: 4 }), 2);
});

test('menu rows: five, from the script, the built scenarios enabled, solved ones ticked — and no number', () => {
  const rows = menuRows(SCRIPT, { 1: 3 });
  assert.equal(rows.length, 5);
  assert.deepEqual(rows.map((r) => r.ch), [1, 2, 3, 4, 5]);
  assert.deepEqual(rows.map((r) => r.enabled), [true, true, true, true, true]);
  assert.equal(rows[0].name, SCRIPT['menu.ch1.name']);
  assert.equal(rows[0].done, true); assert.equal(rows[1].done, false);
  for (const r of rows) assert.deepEqual(Object.keys(r).sort(), ['ch', 'done', 'enabled', 'hook', 'name']);
});

test('?ch=N: a whole number 1..5, anything else is ignored', () => {
  assert.equal(parseCh('?ch=1'), 1);
  assert.equal(parseCh('?x=2&ch=5'), 5);
  for (const s of ['', '?ch=', '?ch=0', '?ch=6', '?ch=1.5', '?ch=abc', '?ch=1x', '?ch= 1']) assert.equal(parseCh(s), null, s);
});

test('after the intro: a built ?ch goes straight in, ?preview=1 goes to the preview room, anything else the menu', () => {
  assert.deepEqual(afterIntro('?ch=1'), { screen: 'CHAPTER', ch: 1 });
  assert.deepEqual(afterIntro('?ch=2'), { screen: 'CHAPTER', ch: 2 });
  assert.deepEqual(afterIntro('?ch=5'), { screen: 'CHAPTER', ch: 5 });
  assert.deepEqual(afterIntro('?ch=6'), { screen: 'MENU' });
  assert.deepEqual(afterIntro(''), { screen: 'MENU' });
  assert.deepEqual(afterIntro('?preview=1'), { screen: 'PREVIEW' });
});

test('the claim button: once one scenario is solved and the prize is unclaimed', () => {
  assert.equal(canClaim({}, false), false);
  assert.equal(canClaim({ 1: 2 }, false), true);
  assert.equal(canClaim({ 1: 0 }, true), false);
});

test('nothing exported is named for a score', () => {
  assert.deepEqual(Object.keys(menu).filter((k) => /score|^max_|per_scenario/i.test(k)), []);
});
