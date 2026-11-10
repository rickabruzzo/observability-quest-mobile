import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS, VERDICTS, CHARITY, HOW_TO_PLAY } from '../js/scenarios.js';

test('five scenarios, two intro pages each, CTA last', () => {
  assert.equal(SCENARIOS.length, 5);
  for (const s of SCENARIOS) {
    assert.equal(s.intro.length, 2, s.id);
    const last = s.intro[1].trim().split('\n').pop();
    assert.ok(last === last.toUpperCase() && last.endsWith('?'), `${s.id}: ${last}`);
    assert.match(s.intro[0], /^[A-Z &]+\n[A-Z ]+\n\n/, `${s.id} header`);
    assert.equal(s.image, s.id);
    assert.ok(s.choiceA.title && s.choiceA.sub && s.choiceB.title && s.choiceB.sub, `${s.id} choices`);
    assert.ok(s.winText.length > 50 && s.loseText.length > 50, `${s.id} outcomes`);
  }
});

test('roster updates', () => {
  assert.deepEqual(SCENARIOS[0].narrator, { name: 'CHRISTINE YEN', title: 'CEO & CO-FOUNDER', portrait: 'portrait_christine' });
  assert.deepEqual(SCENARIOS[1].narrator, { name: 'EMILY NAKASHIMA', title: 'SR VP OPERATIONS', portrait: 'portrait_emily' });
  assert.deepEqual(SCENARIOS[2].narrator, { name: 'GRAHAM SIENER', title: 'SVP, PRODUCT', portrait: 'portrait_graham' });
  assert.deepEqual(SCENARIOS[3].narrator, { name: 'JESSITRON', title: 'ENG MANAGER OF DEVELOPER RELATIONS', portrait: 'portrait_jessitron' });
  assert.deepEqual(SCENARIOS[4].narrator, { name: 'MATT NELSON', title: 'PRESIDENT, GO-TO-MARKET', portrait: 'portrait_matt' });
  assert.deepEqual(CHARITY, { name: 'CHARITY MAJORS', title: 'CTO & CO-FOUNDER', portrait: 'portrait_charity' });
});

test('verdicts 0..5 and copy spot-checks', () => {
  assert.deepEqual(Object.keys(VERDICTS).map(Number).sort(), [0, 1, 2, 3, 4, 5]);
  assert.ok(VERDICTS[5].startsWith('Perfect score.'));
  assert.ok(VERDICTS[0].startsWith('Zero. You got zero.'));
  assert.ok(SCENARIOS[0].loseText.endsWith('The incident is now your personality.'));
  assert.equal(SCENARIOS[2].choiceB.sub, 'Avg load: 2.1s. Looks fine.');
  assert.equal(SCENARIOS[4].choiceA.title, 'HONEYCOMB');
  assert.equal(SCENARIOS[3].choiceB.title, 'ADD A SIXTH TOOL');
  assert.ok(SCENARIOS[1].intro[1].endsWith('WHAT IS YOUR STRATEGY?'));
});

test('how-to-play copy exists and is short', () => {
  assert.ok(HOW_TO_PLAY.length > 40 && HOW_TO_PLAY.length < 400);
});
