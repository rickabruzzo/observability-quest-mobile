import test from 'node:test';
import assert from 'node:assert/strict';
import { createTool, choose, promptsOf, toolScore, CLEAN, MESSY } from '../js/engine/prompts.js';

const HC = {
  kind: 'hc',
  steps: [
    { prompts: [{ key: 's1.p1', right: true }, { key: 's1.p2', jab: 's1.j2' }, { key: 's1.p3', jab: 's1.j3' }], result: 's1.r' },
    { prompts: [{ key: 's2.p1', right: true }, { key: 's2.p2', jab: 's2.j2' }, { key: 's2.p3', jab: 's2.j3' }], result: 's2.r' },
  ],
};
const OLD = { kind: 'old', steps: [{ prompts: [{ key: 'o1', jab: 'j1' }, { key: 'o2', jab: 'j2' }, { key: 'o3', jab: 'j3' }] }] };

test('the clean path: two right answers, 100 points, finished', () => {
  const t = createTool(HC);
  assert.deepEqual(choose(t, 0), { outcome: 'right', result: 's1.r', finished: false });
  assert.equal(t.step, 1);
  assert.deepEqual(choose(t, 0), { outcome: 'right', result: 's2.r', finished: true });
  assert.equal(t.done, true);
  assert.equal(toolScore(t), CLEAN);
  assert.equal(CLEAN, 100);
});

test('a wrong prompt gives its jab, greys out, and cannot be chosen again', () => {
  const t = createTool(HC);
  assert.deepEqual(choose(t, 2), { outcome: 'wrong', jab: 's1.j3' });
  assert.deepEqual(promptsOf(t).map((p) => p.disabled), [false, false, true]);
  assert.deepEqual(choose(t, 2), { outcome: 'tried' });
  assert.equal(t.wrong, 1);
});

test('any wrong prompt inside the Honeycomb screen, at either step, makes it 50', () => {
  for (const wrongAt of [0, 1]) {
    const t = createTool(HC);
    if (wrongAt === 0) choose(t, 1);
    choose(t, 0);
    if (wrongAt === 1) choose(t, 1);
    choose(t, 0);
    assert.equal(toolScore(t), MESSY, `wrong at step ${wrongAt + 1}`);
  }
  assert.equal(MESSY, 50);
});

test('greyed prompts reset on the next step', () => {
  const t = createTool(HC);
  choose(t, 1); choose(t, 0);
  assert.deepEqual(promptsOf(t).map((p) => [p.key, p.disabled]), [['s2.p1', false], ['s2.p2', false], ['s2.p3', false]]);
});

test('an unfinished screen scores nothing; a finished one is done', () => {
  const t = createTool(HC);
  assert.equal(toolScore(t), 0);
  choose(t, 0); choose(t, 0);
  assert.deepEqual(choose(t, 0), { outcome: 'done' });
});

test('the old tool: only wrong prompts, never finishes, scores nothing', () => {
  const t = createTool(OLD);
  for (const [i, j] of [[0, 'j1'], [1, 'j2'], [2, 'j3']]) assert.deepEqual(choose(t, i), { outcome: 'wrong', jab: j });
  assert.equal(t.done, false);
  assert.ok(promptsOf(t).every((p) => p.disabled));
  assert.equal(toolScore(t), 0);
});

test('a malformed choice is ignored', () => {
  const t = createTool(HC);
  assert.deepEqual(choose(t, 7), { outcome: 'tried' });
  assert.equal(t.wrong, 0);
});
