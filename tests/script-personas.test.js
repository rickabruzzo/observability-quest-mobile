// The script's side of the conversation window (review of Warp briefs 08 and 10): in every scenario the lines the
// persona speaks carry the prefix the window looks for (their card's name without its article), and every label a
// tool shows is a script slot, not a string in the data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { speakerOf, personaLine } from '../js/engine/conversation.js';
import { SCRIPT } from '../js/script.js';
import { CHAPTERS } from '../js/chapters/index.js';

for (const [n, c] of Object.entries(CHAPTERS)) {
  test(`scenario ${n}: the persona's calls, question, show line and last word open the portrait window`, () => {
    const title = speakerOf(SCRIPT[c.persona.name]);
    const theirs = [...c.persona.calls, c.persona.ask, c.persona.options.hc.show, `ch${n}.hero.line`];
    for (const k of theirs) {
      const line = personaLine(SCRIPT[k], title);
      assert.equal(line.spoken, true, `${k} should start "${title}:" — it reads "${SCRIPT[k].slice(0, 30)}…"`);
      assert.ok(line.text.length > 0 && !/^[A-Z][A-Z ]+:/.test(line.text), `${k} shows a prefix: "${line.text.slice(0, 30)}…"`);
    }
  });

  test(`scenario ${n}: every tool's title, intro and close label is a script slot`, () => {
    for (const [id, tool] of Object.entries(c.tools)) {
      for (const field of ['title', 'intro', 'exit', 'close']) {
        if (tool[field] === undefined) continue;
        assert.ok(SCRIPT[tool[field]], `ch${n} ${id}.${field} is "${tool[field]}", which is not a slot in script/script.md`);
      }
    }
  });
}

test('scenario 4: the Honeycomb tool closes with the coding agent\'s name', () => {
  assert.equal(CHAPTERS[4].tools.hc.close, 'ch4.hc.close');
  assert.equal(SCRIPT['ch4.hc.close'], '[Close Claw Codez]');
});
