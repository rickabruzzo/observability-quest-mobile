// The title's subtitle is a script slot (review of Warp brief 16, 2026-11-18; Warp's call 1). Every word the player
// reads is in script/script.md; the title screen and the intro both showed this line from a copy in their own code.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SCRIPT } from '../js/script.js';

test('the subtitle is the script\'s, and neither screen keeps its own copy of the words', () => {
  assert.equal(SCRIPT['title.subtitle'], 'So you want to be on-call?');
  for (const f of ['js/screens/title.js', 'js/screens/intro.js']) {
    const src = readFileSync(f, 'utf8');
    assert.ok(!src.includes('So you want to be on-call?'), `${f} spells the subtitle out`);
    assert.ok(src.includes("SCRIPT['title.subtitle']"), `${f} reads the slot`);
  }
});
