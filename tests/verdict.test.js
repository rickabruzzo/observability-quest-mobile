import test from 'node:test';
import assert from 'node:assert/strict';
import { charityVerdict, fillN } from '../js/engine/verdict.js';
import { SCRIPT } from '../js/script.js';

test('clean: every solved scenario had no missteps', () => {
  assert.deepEqual(charityVerdict({ 1: 0 }), { header: 'final.header', mood: 'final.clean', count: 'final.count.one', n: 1 });
  assert.equal(charityVerdict({ 1: 0, 3: 0 }).mood, 'final.clean');
});

test('grief: any solved scenario had a misstep', () => {
  assert.equal(charityVerdict({ 1: 1 }).mood, 'final.grief');
  assert.equal(charityVerdict({ 1: 0, 2: 4 }).mood, 'final.grief');
});

test('the count line: one, some (with {n}), all five', () => {
  assert.equal(charityVerdict({ 1: 0 }).count, 'final.count.one');
  for (const done of [{ 1: 0, 2: 0 }, { 1: 0, 2: 0, 3: 0 }, { 1: 0, 2: 0, 3: 0, 4: 1 }]) {
    const v = charityVerdict(done);
    assert.equal(v.count, 'final.count.some');
    assert.equal(v.n, Object.keys(done).length);
  }
  assert.equal(charityVerdict({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }).count, 'final.count.all');
});

test('{n} is filled in the script line', () => {
  assert.match(SCRIPT['final.count.some'], /\{n\}/);
  const text = fillN(SCRIPT['final.count.some'], 3);
  assert.ok(text.startsWith('3 incidents'), text);
  assert.doesNotMatch(text, /\{n\}/);
});

test('every key it returns is in the script', () => {
  for (const done of [{ 1: 0 }, { 1: 2, 2: 0 }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }]) {
    const v = charityVerdict(done);
    for (const k of [v.header, v.mood, v.count]) assert.ok(SCRIPT[k], k);
  }
});
