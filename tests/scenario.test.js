import test from 'node:test';
import assert from 'node:assert/strict';
import { createScenario, notePrompt, noteFound, noteDeployed, wallState, canLeave, canDeploy, statusLine, personaUse, decide, missteps } from '../js/engine/scenario.js';
import * as scenario from '../js/engine/scenario.js';

test('Leave computer is locked until a prompt has been picked in either tool', () => {
  const s = createScenario();
  assert.equal(canLeave(s), false);
  notePrompt(s, 'old');
  assert.equal(canLeave(s), true);
  const t = createScenario();
  notePrompt(t, 'hc');
  assert.equal(canLeave(t), true);
});

test('Otto: critical, then the cause is found, then the fix is deployed; the monitor recovers only on deployed', () => {
  const s = createScenario();
  assert.equal(wallState(s), 'broken');
  noteFound(s);
  assert.equal(wallState(s), 'found');
  noteDeployed(s);
  assert.equal(wallState(s), 'fixed');
  const early = createScenario();
  noteDeployed(early);
  assert.equal(wallState(early), 'broken', 'nothing to deploy before the cause is found');
});

test('Check Otto\'s vitals: before → old (Cave Logs tried) → found → hc (deployed)', () => {
  const s = createScenario();
  assert.equal(statusLine(s), 'before');
  notePrompt(s, 'hc');
  assert.equal(statusLine(s), 'before', 'a Honeycomb prompt alone is not the Cave Logs line');
  notePrompt(s, 'old');
  assert.equal(statusLine(s), 'old');
  noteFound(s);
  assert.equal(statusLine(s), 'found');
  noteDeployed(s);
  assert.equal(statusLine(s), 'hc');
});

test('[Apply the fix and deploy] shows once the cause is found and goes away once used', () => {
  const s = createScenario();
  assert.equal(canDeploy(s), false);
  noteFound(s);
  assert.equal(canDeploy(s), true);
  noteDeployed(s);
  assert.equal(canDeploy(s), false);
});

test('the CTO before a tool is tried: her calls in order, the last one repeats; after, her question', () => {
  const s = createScenario();
  assert.deepEqual([1, 2, 3, 4, 5].map(() => personaUse(s)), [1, 2, 3, 3, 3].map((n) => ({ kind: 'call', n })));
  notePrompt(s, 'old');
  assert.deepEqual(personaUse(s), { kind: 'ask' });
});

test('[Get Honeycomb]: deployed → win; found → deploy on the spot; not found → show me (the investigation)', () => {
  const s = createScenario(); notePrompt(s, 'old');
  assert.deepEqual(decide(s, 'hc'), { outcome: 'show' });
  noteFound(s);
  assert.deepEqual(decide(s, 'hc'), { outcome: 'deploy' });
  noteDeployed(s);
  assert.deepEqual(decide(s, 'hc'), { outcome: 'win' });
});

test('[Sign the contract]: a jab once, then greyed; the choice always comes back', () => {
  const s = createScenario(); notePrompt(s, 'hc');
  assert.deepEqual(decide(s, 'wrong'), { outcome: 'jab' });
  assert.equal(s.wrong, true);
  assert.deepEqual(decide(s, 'wrong'), { outcome: 'tried' });
  assert.deepEqual(decide(s, 'hc'), { outcome: 'show' });
});

test('missteps: every old-tool prompt picked plus wrong advice; nothing inside Honeycomb counts', () => {
  const s = createScenario();
  for (let i = 0; i < 5; i++) notePrompt(s, 'hc');
  assert.equal(missteps(s), 0);
  notePrompt(s, 'old'); notePrompt(s, 'old');
  assert.equal(missteps(s), 2);
  decide(s, 'wrong');
  assert.equal(missteps(s), 3);
  decide(s, 'wrong');
  assert.equal(missteps(s), 3, 'a greyed prompt cannot be picked twice');
});

test('no scoring is left in the scenario rules', () => {
  assert.deepEqual(Object.keys(scenario).filter((k) => /score/i.test(k)), []);
});
