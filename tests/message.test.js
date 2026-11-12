import test from 'node:test';
import assert from 'node:assert/strict';
import { wrapLines, paginate, typedChars, createMessage, stepMessage, tapMessage, linesFor, hugWidth, MAX_LINE_PX, MS_PER_CHAR } from '../js/engine/message.js';

const mono = (s) => s.length * 10;            // a fake monospace font: 10 px a character

test('wraps greedily at word boundaries within the width', () => {
  assert.deepEqual(wrapLines('the quick brown fox jumps', mono, 100), ['the quick', 'brown fox', 'jumps']);
  assert.deepEqual(wrapLines('', mono, 100), []);
});

test('a word longer than the line is broken, never lost', () => {
  assert.deepEqual(wrapLines('abcdefghijklmno xy', mono, 50), ['abcde', 'fghij', 'klmno', 'xy']);
});

test('paginates into pages of at most maxLines, keeping every word in order', () => {
  const text = 'one two three four five six seven eight nine ten';
  const pages = paginate(text, mono, 100, 2);
  assert.ok(pages.every((p) => p.length <= 2));
  assert.equal(pages.flat().join(' '), text);
  assert.equal(pages.length, 3);
});

test('a short line is one page', () => {
  assert.deepEqual(paginate('Hello.', mono, 100, 3), [['Hello.']]);
});

test('typewriter: 25 ms a character, clamped to the text', () => {
  assert.equal(MS_PER_CHAR, 25);
  assert.equal(typedChars('abcdef', 0), 0);
  assert.equal(typedChars('abcdef', 74), 2);
  assert.equal(typedChars('abcdef', 75), 3);
  assert.equal(typedChars('abcdef', 99999), 6);
});

test('a tap completes the page, the next tap turns it, the last tap closes', () => {
  const m = createMessage([['aaaa'], ['bb']]);
  stepMessage(m, 30);
  assert.equal(m.shown, 1);
  assert.equal(tapMessage(m), 'typed');
  assert.equal(m.shown, 4);
  assert.equal(tapMessage(m), 'page');
  assert.equal(m.page, 1); assert.equal(m.shown, 0);
  stepMessage(m, 1000);
  assert.equal(m.shown, 2);
  assert.equal(tapMessage(m), 'closed');
  assert.equal(m.closed, true);
});

test('instant text (reduced motion) shows each page whole at once', () => {
  const m = createMessage([['aaaa'], ['bb']], { instant: true });
  assert.equal(m.shown, 4);
  assert.equal(tapMessage(m), 'page');
  assert.equal(m.shown, 2);
  assert.equal(tapMessage(m), 'closed');
});

test('lines a window holds: a narrow window is allowed to be taller, five lines on a 375-px phone', () => {
  assert.equal(linesFor(346), 5);           // 667x375
  assert.equal(linesFor(370), 6);           // 844x390
  assert.equal(linesFor(410), 7);           // 932x430
  assert.equal(linesFor(800), 7);
});

test('a window is as wide as its longest line on any page, never wider than the reading measure', () => {
  assert.equal(hugWidth([['short', 'a longer line'], ['mid line']], mono), 130);
  assert.equal(hugWidth([['x'.repeat(200)]], mono), MAX_LINE_PX);
  assert.ok(MAX_LINE_PX >= 300 && MAX_LINE_PX <= 380);     // about 32 to 38 characters of VT323 at 24 px
  assert.equal(hugWidth([], mono), 0);
});
