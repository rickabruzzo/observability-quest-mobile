import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDone, recordDone, totalScore, menuRows, parseCh, afterIntro, canClaim, SCENARIOS, AVAILABLE, MAX_SCORE } from '../js/menu.js';
import { SCRIPT } from '../js/script.js';

test('five scenarios, in order; only the first is built; the score is out of 500', () => {
  assert.deepEqual(SCENARIOS, [1, 2, 3, 4, 5]);
  assert.deepEqual(AVAILABLE, [1]);
  assert.equal(MAX_SCORE, 500);
});

test('stored completion is sanitised: junk, unknown scenarios and bad scores are dropped', () => {
  assert.deepEqual(parseDone(null), {});
  assert.deepEqual(parseDone('not json'), {});
  assert.deepEqual(parseDone('[1,2]'), {});
  assert.deepEqual(parseDone('{"1":100,"2":50,"9":100,"3":"x","4":250,"5":-1}'), { 1: 100, 2: 50 });
  assert.deepEqual(parseDone('{"1":49.5}'), {});
});

test('a replay keeps the better score', () => {
  let d = recordDone({}, 1, 50);
  assert.deepEqual(d, { 1: 50 });
  d = recordDone(d, 1, 100);
  assert.deepEqual(d, { 1: 100 });
  d = recordDone(d, 1, 50);
  assert.deepEqual(d, { 1: 100 });
});

test('the status-bar score is the sum of best scores', () => {
  assert.equal(totalScore({}), 0);
  assert.equal(totalScore({ 1: 100, 3: 50 }), 150);
});

test('menu rows: five, from the script, only scenario 1 enabled, done ones carry their score', () => {
  const rows = menuRows(SCRIPT, { 1: 50 });
  assert.equal(rows.length, 5);
  assert.deepEqual(rows.map((r) => r.ch), [1, 2, 3, 4, 5]);
  assert.deepEqual(rows.map((r) => r.enabled), [true, false, false, false, false]);
  assert.equal(rows[0].name, SCRIPT['menu.ch1.name']);
  assert.equal(rows[4].hook, SCRIPT['menu.ch5.hook']);
  assert.deepEqual([rows[0].done, rows[0].score], [true, 50]);
  assert.deepEqual([rows[1].done, rows[1].score], [false, null]);
});

test('?ch=N: a whole number 1..5, anything else is ignored', () => {
  assert.equal(parseCh('?ch=1'), 1);
  assert.equal(parseCh('?x=2&ch=5'), 5);
  for (const s of ['', '?ch=', '?ch=0', '?ch=6', '?ch=1.5', '?ch=abc', '?ch=1x', '?ch= 1']) assert.equal(parseCh(s), null, s);
});

test('after the intro: a built ?ch goes straight in, ?preview=1 goes to the preview room, anything else the menu', () => {
  assert.deepEqual(afterIntro('?ch=1'), { screen: 'CHAPTER', ch: 1 });
  assert.deepEqual(afterIntro('?ch=2'), { screen: 'MENU' });        // not built yet: the menu
  assert.deepEqual(afterIntro('?ch=zz'), { screen: 'MENU' });
  assert.deepEqual(afterIntro(''), { screen: 'MENU' });
  assert.deepEqual(afterIntro('?preview=1'), { screen: 'PREVIEW' });
});

test('the claim button: once one scenario is done and the prize is unclaimed', () => {
  assert.equal(canClaim({}, false), false);
  assert.equal(canClaim({ 1: 50 }, false), true);
  assert.equal(canClaim({ 1: 100 }, true), false);
});
