// Rick's play-through of 2026-11-14 (Warp brief 12), the pure parts: the TV page's tint, the narrator's name off the
// front of a verdict, the portrait's crop for a phone on its side.
import test from 'node:test';
import assert from 'node:assert/strict';
import { pageTint, TINTS, TINT_MS } from '../js/chapters/ch3-wall.js';
import { narratorLine, portraitLayout, PORTRAIT_SHARE } from '../js/engine/verdict.js';

test('the page shifts between three close tints at irregular intervals of 200 to 600 ms', () => {
  assert.equal(TINTS.length, 3);
  assert.deepEqual(TINT_MS, [200, 600]);
  const seq = []; let last = null, at = 0;
  const changes = [];
  for (let t = 0; t < 60000; t += 10) {
    const k = pageTint(t);
    assert.ok(k >= 0 && k < 3, String(k));
    if (k !== last) { if (last !== null) changes.push(t - at); last = k; at = t; }
    seq.push(k);
  }
  assert.ok(changes.length >= 60000 / 600 - 2 && changes.length <= 60000 / 200 + 2, `${changes.length} changes in a minute`);
  for (const d of changes) assert.ok(d >= 200 && d <= 600, `${d} ms`);
  assert.ok(new Set(seq).size === 3, 'all three tints turn up');
  assert.ok(new Set(changes).size > 3, 'irregular, not a metronome');
  assert.equal(pageTint(1234, true), 0, 'reduced motion: one tint, still');
  assert.equal(pageTint(98765, true), 0);
});

test('the narrator\'s name comes off the front of the line; a line without one is left alone', () => {
  assert.deepEqual(narratorLine('CHRISTINE YEN: A chatbot is a conversation.'), { name: 'CHRISTINE YEN', text: 'A chatbot is a conversation.' });
  assert.deepEqual(narratorLine('JESSITRON: Nobody had to be the hero.'), { name: 'JESSITRON', text: 'Nobody had to be the hero.' });
  assert.deepEqual(narratorLine('No detours. You looked: good.'), { name: null, text: 'No detours. You looked: good.' });   // not shouted, not a name
  assert.deepEqual(narratorLine('MATT NELSON:no space'), { name: 'MATT NELSON', text: 'no space' });
  assert.deepEqual(narratorLine('CTO: Well?'), { name: 'CTO', text: 'Well?' });
});

test('the portrait sits on the left with its bottom on the scene\'s bottom edge, about 45 % wide, cropped round the figure', () => {
  assert.equal(PORTRAIT_SHARE, 0.45);
  const L = portraitLayout(640, 428, 378);                                  // a figure centred at x 378 of 640
  assert.equal(L.dx, 0); assert.equal(L.dy + L.dh, 200, 'the picture\'s bottom is the scene\'s bottom');
  assert.equal(L.dw, 144);
  assert.equal(L.sy, 0); assert.equal(L.sh, 428, 'the whole height: the shoulders run off the bottom as the art crops them');
  assert.ok(Math.abs(L.sw / L.sh - L.dw / L.dh) < 0.01, 'no stretch');
  assert.ok(L.sx + L.sw / 2 > 360 && L.sx + L.sw / 2 < 396, 'cropped round the figure');
  assert.ok(L.sx >= 0 && L.sx + L.sw <= 640, 'inside the picture');
  const edge = portraitLayout(640, 428, 40);                                 // a figure at the very left edge: the crop stops at the picture's edge
  assert.equal(edge.sx, 0);
  const far = portraitLayout(640, 428, 630);
  assert.equal(far.sx + far.sw, 640);
  assert.ok(L.textX >= L.dw + 4 && L.textX < 160, 'the words start just right of the picture');
});
