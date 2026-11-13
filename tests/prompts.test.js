import test from 'node:test';
import assert from 'node:assert/strict';
import { createTool, choose, promptsOf } from '../js/engine/prompts.js';
import * as prompts from '../js/engine/prompts.js';

const HC = {
  kind: 'hc',
  steps: [
    { prompts: [{ key: 's1.p1', right: true }, { key: 's1.p2', jab: 's1.j2' }, { key: 's1.p3', jab: 's1.j3' }], result: 's1.r' },
    { prompts: [{ key: 's2.p1', right: true }, { key: 's2.p2', jab: 's2.j2' }, { key: 's2.p3', jab: 's2.j3' }], result: 's2.r' },
  ],
};
const OLD = { kind: 'old', steps: [{ prompts: [{ key: 'o1', jab: 'j1' }, { key: 'o2', jab: 'j2' }, { key: 'o3', jab: 'j3' }] }] };

test('the direct path: two direct prompts, each gives its result; the second finishes the screen', () => {
  const t = createTool(HC);
  assert.deepEqual(choose(t, 0), { outcome: 'right', result: 's1.r', finished: false });
  assert.equal(t.step, 1);
  assert.deepEqual(choose(t, 0), { outcome: 'right', result: 's2.r', finished: true });
  assert.equal(t.done, true);
});

test('a nudge gives its line, greys out, and cannot be chosen again; it is counted, not punished', () => {
  const t = createTool(HC);
  assert.deepEqual(choose(t, 2), { outcome: 'wrong', jab: 's1.j3' });
  assert.deepEqual(promptsOf(t).map((p) => p.disabled), [false, false, true]);
  assert.deepEqual(choose(t, 2), { outcome: 'tried' });
  assert.equal(t.nudges, 1);
  choose(t, 1);
  assert.equal(t.nudges, 2);
});

test('greyed prompts reset on the next step', () => {
  const t = createTool(HC);
  choose(t, 1); choose(t, 0);
  assert.deepEqual(promptsOf(t).map((p) => [p.key, p.disabled]), [['s2.p1', false], ['s2.p2', false], ['s2.p3', false]]);
});

test('a finished screen takes no more choices', () => {
  const t = createTool(HC);
  choose(t, 0); choose(t, 0);
  assert.deepEqual(choose(t, 0), { outcome: 'done' });
});

test('the old tool: only jokes, never finishes; its picks are counted (they are missteps)', () => {
  const t = createTool(OLD);
  for (const [i, j] of [[0, 'j1'], [1, 'j2'], [2, 'j3']]) assert.deepEqual(choose(t, i), { outcome: 'wrong', jab: j });
  assert.equal(t.done, false);
  assert.ok(promptsOf(t).every((p) => p.disabled));
  assert.equal(t.nudges, 3);
});

test('a malformed choice is ignored', () => {
  const t = createTool(HC);
  assert.deepEqual(choose(t, 7), { outcome: 'tried' });
  assert.equal(t.nudges, 0);
});

test('no scoring is left in the prompt rules', () => {
  assert.deepEqual(Object.keys(prompts).filter((k) => /score|clean|messy/i.test(k)), []);
});
