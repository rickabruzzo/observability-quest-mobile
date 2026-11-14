// The persona card (Warp brief 07), the pure part: the stats, the picture, when the card opens, the options every
// conversation ends in. js/engine/persona.js and the scenario rules; the DOM is js/screens/chapter.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStats, cardPicture, personaOptions, OPTION_KEYS } from '../js/engine/persona.js';
import { createScenario, notePrompt, firstTalk } from '../js/engine/scenario.js';
import { createRunlog, COUNT_LABELS } from '../js/engine/runlog.js';
import { SCRIPT } from '../js/script.js';
import { CH1 } from '../js/chapters/ch1.js';
import { UI } from '../js/screens/chapter.js';

test('four stats split at the dot, each a name and a number, for all five chapters', () => {
  for (let n = 1; n <= 5; n++) {
    const stats = parseStats(SCRIPT[`ch${n}.persona.stats`]);
    assert.equal(stats.length, 4, `ch${n}`);
    for (const [name, value] of stats) { assert.ok(name.length > 1, name); assert.match(value, /^\d+$/, `${name}: ${value}`); }
  }
  assert.deepEqual(parseStats('YAML Tolerance 18 · Kubernetes 16 · Sleep 4 · "It\'s DNS" 20'),
    [['YAML Tolerance', '18'], ['Kubernetes', '16'], ['Sleep', '4'], ['"It\'s DNS"', '20']]);
  assert.deepEqual(parseStats('Odd one'), [['Odd one', '']]);                       // never throws on a bad slot
});

test('the picture is the card art when it exists, else the persona cropped from the room plate', () => {
  const p = CH1.persona;
  assert.equal(p.art, 'assets/cards/P1_card.png');
  assert.deepEqual(p.crop, { image: 'R1_exec_floor', x: 192, y: 62, w: 112, h: 70 });
  assert.deepEqual(cardPicture(p, true), { kind: 'art', src: 'assets/cards/P1_card.png' });
  assert.deepEqual(cardPicture(p, false), { kind: 'crop', ...p.crop });
  assert.deepEqual(cardPicture({ crop: p.crop }, true), { kind: 'crop', ...p.crop });   // no art named: the crop
});

test('the card opens on the first talk only', () => {
  const s = createScenario();
  assert.equal(firstTalk(s), true);
  assert.equal(firstTalk(s), false);
  assert.equal(firstTalk(s), false);
  assert.equal(createScenario().cardSeen, false);
});

test('every conversation ends in options: show and leave before a tool is tried; sign, Honeycomb and show after', () => {
  const s = createScenario();
  assert.deepEqual(personaOptions(s), ['show', 'leave']);
  notePrompt(s, 'hc');
  assert.deepEqual(personaOptions(s), ['sign', 'hc', 'show']);
  assert.deepEqual(OPTION_KEYS, { show: 'persona.show', leave: 'persona.leave' });    // the script's own slots
  assert.ok(SCRIPT['persona.show'].startsWith('[') && SCRIPT['persona.leave'].startsWith('['));
});

test('chapter 1 names the persona\'s card from the script, and its title card has no stats any more', () => {
  const p = CH1.persona;
  assert.equal(p.name, 'ch1.persona.name'); assert.equal(p.class, 'ch1.persona.class');
  assert.equal(p.stats, 'ch1.persona.stats'); assert.equal(p.flavor, 'ch1.persona.flavor');
  assert.ok(!('stats' in CH1.card));
  assert.ok(!('ch1.card.stats' in SCRIPT), 'the chN.card.stats slots are gone');
  for (let n = 2; n <= 5; n++) assert.ok(!(`ch${n}.card.stats` in SCRIPT), `ch${n}`);
});

test('the stopwatch counts card views', () => {
  const log = createRunlog({ chapter: 1, now: () => 0 });
  log.count('cards'); log.count('cards');
  assert.equal(log.snapshot().counts.cards, 2);
  assert.ok(COUNT_LABELS.some(([k]) => k === 'cards'));
});

test('the strings that were waiting for slots come from the script now; only the summary\'s title stays in code', () => {
  assert.deepEqual(Object.keys(UI), ['summaryTitle']);
  for (const k of ['ui.look', 'ui.use', 'ui.help', 'ui.back', 'ui.close.hc', 'ch1.old.close', 'ui.copy', 'ui.copied', 'menu.soon', 'claim.soon']) assert.ok(SCRIPT[k], k);
  assert.equal(CH1.tools.old.close, 'ch1.old.close');
});
