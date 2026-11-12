import test from 'node:test';
import assert from 'node:assert/strict';
import { createScenario, notePrompt, noteHcDone, canLeave, vitalsLine, ctoUse, decide, scenarioScore } from '../js/engine/scenario.js';
import { createTool, choose } from '../js/engine/prompts.js';
import { CH1 } from '../js/chapters/ch1.js';

const hcTool = (wrong = false) => {
  const t = createTool(CH1.tools.hc);
  if (wrong) choose(t, 1);
  choose(t, 0); choose(t, 0);
  return t;
};

test('Leave computer is locked until a prompt has been picked in either tool', () => {
  const s = createScenario();
  assert.equal(canLeave(s), false);
  // opening a tool and backing out picks nothing, so nothing is noted
  notePrompt(s, 'old');
  assert.equal(canLeave(s), true);
  const t = createScenario();
  notePrompt(t, 'hc');
  assert.equal(canLeave(t), true);
});

test('Check Otto\'s vitals: before, then old once Cave Logs is tried, then hc once the investigation is done', () => {
  const s = createScenario();
  assert.equal(vitalsLine(s), 'before');
  notePrompt(s, 'hc');
  assert.equal(vitalsLine(s), 'before', 'a Honeycomb prompt alone is not the Cave Logs line');
  notePrompt(s, 'old');
  assert.equal(vitalsLine(s), 'old');
  noteHcDone(s);
  assert.equal(vitalsLine(s), 'hc');
});

test('the CTO before a tool is tried: her calls in order, the last one repeats', () => {
  const s = createScenario();
  assert.deepEqual([1, 2, 3, 4, 5].map(() => ctoUse(s)), [1, 2, 3, 3, 3].map((n) => ({ kind: 'call', n })));
  notePrompt(s, 'old');
  assert.deepEqual(ctoUse(s), { kind: 'ask' });
  assert.deepEqual(ctoUse(s), { kind: 'ask' });
});

test('the decision: Get Honeycomb wins when the investigation is done, else she says show me', () => {
  const s = createScenario(); notePrompt(s, 'old');
  assert.deepEqual(decide(s, 'hc'), { outcome: 'show' });
  noteHcDone(s);
  assert.deepEqual(decide(s, 'hc'), { outcome: 'win' });
});

test('Sign the contract: a jab once, then greyed; the choice always comes back', () => {
  const s = createScenario(); notePrompt(s, 'hc');
  assert.deepEqual(decide(s, 'sign'), { outcome: 'jab' });
  assert.equal(s.signed, true);
  assert.deepEqual(decide(s, 'sign'), { outcome: 'tried' });
  assert.deepEqual(decide(s, 'hc'), { outcome: 'show' });
});

test('the score: 100 clean; signing counts as a wrong Honeycomb prompt; a wrong prompt and a signature is still 50; unfinished is 0', () => {
  const s = createScenario();
  assert.equal(scenarioScore(s, hcTool()), 100);
  assert.equal(scenarioScore(s, hcTool(true)), 50);
  s.signed = true;
  assert.equal(scenarioScore(s, hcTool()), 50);
  assert.equal(scenarioScore(s, hcTool(true)), 50);
  assert.equal(scenarioScore(createScenario(), createTool(CH1.tools.hc)), 0);
});
