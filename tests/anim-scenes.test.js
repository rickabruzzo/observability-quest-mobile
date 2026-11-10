import test from 'node:test';
import assert from 'node:assert/strict';
import { at } from '../js/anim/timeline.js';
import { coinTimeline, S5_LOOP } from '../js/anim/s5.js';
import { productTimeline, S3_LOOP } from '../js/anim/s3.js';
import { positions } from '../js/anim/flash.js';

test('timeline.at: step keyframes, looping at the last frame', () => {
  const kf = [[0, 'a'], [10, 'b'], [25, 'c'], [30, 'a']];
  assert.equal(at(0, kf), 'a');
  assert.equal(at(9, kf), 'a');
  assert.equal(at(10, kf), 'b');
  assert.equal(at(29, kf), 'c');
  assert.equal(at(30, kf), 'a');   // loops
  assert.equal(at(41, kf), 'b');
});

test('S5: coins go silver→gold left to right, PAY2 copper, BANK gold last', () => {
  assert.deepEqual(coinTimeline(0).coins, ['silver', 'silver', 'silver', 'silver', 'silver']);
  const t = [...Array(S5_LOOP).keys()].map(coinTimeline);
  const first = (i, v) => t.findIndex((s) => s.coins[i] === v);
  assert.ok(first(0, 'gold') > 0 && first(0, 'gold') < first(1, 'gold') && first(1, 'gold') < first(2, 'gold'));
  assert.ok(first(3, 'copper') > first(2, 'gold'));
  assert.equal(first(3, 'gold'), -1, 'PAY2 coin must never turn gold');
  assert.ok(first(4, 'gold') > first(3, 'copper') + 8, 'BANK waits a longer pause after the copper');
  assert.ok(t.some((s) => s.pay2Wobble), 'PAY2 wobbles at some point');
  assert.ok(t.some((s) => s.coins[0].startsWith('spin')), 'coins spin while turning');
  assert.ok(t.some((s) => s.pulse !== null), 'a data pulse travels');
  // loop boundary resets to silver
  assert.deepEqual(coinTimeline(S5_LOOP).coins, ['silver', 'silver', 'silver', 'silver', 'silver']);
});

test('S3: cycle drums→keys→guitar; guitar stalls at 13 with warning; others reach 100 and SOLD', () => {
  const t = [...Array(S3_LOOP).keys()].map(productTimeline);
  const order = t.map((s) => s.product).filter((p, i, a) => i === 0 || p !== a[i - 1]);
  assert.deepEqual(order, ['drums', 'keys', 'guitar']);
  for (const p of ['drums', 'keys']) {
    const seg = t.filter((s) => s.product === p);
    assert.equal(Math.max(...seg.map((s) => s.barPct)), 100, `${p} reaches 100`);
    assert.ok(seg.some((s) => s.rightPanel === 'sold'), `${p} shows SOLD`);
    assert.ok(!seg.some((s) => s.rightPanel === 'warning'), `${p} never warns`);
  }
  const g = t.filter((s) => s.product === 'guitar');
  assert.equal(Math.max(...g.map((s) => s.barPct)), 13);
  assert.ok(g.some((s) => s.rightPanel === 'warning'));
  assert.ok(!g.some((s) => s.rightPanel === 'sold'));
  assert.equal(productTimeline(S3_LOOP).product, 'drums'); // loops
});

test('flash positions advance along a path and wrap to another', () => {
  const paths = [[[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5]]];
  const a = positions(0, paths, 1, 2);
  assert.equal(a.length, 2);
  const b = positions(1, paths, 1, 2);
  for (let k = 0; k < 2; k++) {
    assert.ok(b[k].index === a[k].index + 1 || (b[k].index === 0 && b[k].path !== a[k].path), 'advances or wraps');
  }
  const seen = new Set();
  for (let f = 0; f < 40; f++) for (const p of positions(f, paths, 1, 2)) seen.add(p.path);
  assert.equal(seen.size, 2, 'both paths get used over time');
});
