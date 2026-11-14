// The persona speaks from a close-up portrait (Warp brief 10): which lines are theirs, what is shown, how the
// portrait moves. Pure functions in js/engine/conversation.js; the DOM is js/engine/window.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { speakerOf, personaLine, portraitFrame, FRAME_MS, PORTRAIT_CROP, talkWindow } from '../js/engine/conversation.js';
import { SCRIPT } from '../js/script.js';
import { CH1 } from '../js/chapters/ch1.js';

test('the speaker prefix is the persona\'s name without its article: THE CTO speaks as CTO', () => {
  assert.equal(speakerOf('THE CTO'), 'CTO');
  assert.equal(speakerOf('THE CLOUD ENGINEER'), 'CLOUD ENGINEER');
  assert.equal(speakerOf('OTTO'), 'OTTO');
});

test('a line that starts with the title and a colon is the persona\'s, shown without the prefix', () => {
  assert.deepEqual(personaLine('CTO: Tell me what to buy.', 'CTO'), { spoken: true, text: 'Tell me what to buy.' });
  assert.deepEqual(personaLine('CTO:(to you) Go look.', 'CTO'), { spoken: true, text: '(to you) Go look.' });
  assert.deepEqual(personaLine('CLOUD ENGINEER: Every service is green.', 'CLOUD ENGINEER'), { spoken: true, text: 'Every service is green.' });
});

test('narration that only quotes them, or another speaker, stays an ordinary line, untouched', () => {
  const quote = 'The pen touches paper. The CTO looks at you. "Try again."';
  assert.deepEqual(personaLine(quote, 'CTO'), { spoken: false, text: quote });
  assert.deepEqual(personaLine('OTTO: I\'d be happy to.', 'CTO'), { spoken: false, text: 'OTTO: I\'d be happy to.' });
  assert.deepEqual(personaLine('CTO Tell me.', 'CTO'), { spoken: false, text: 'CTO Tell me.' });       // no colon
  assert.deepEqual(personaLine(' CTO: late', 'CTO'), { spoken: false, text: ' CTO: late' });           // not at the start
  assert.deepEqual(personaLine('The CTO: a title', 'CTO'), { spoken: false, text: 'The CTO: a title' });
});

test('the prefix is dropped once, from the start only; a second mention inside the line stays', () => {
  assert.equal(personaLine('CTO: The CTO: that is me. CTO: again.', 'CTO').text, 'The CTO: that is me. CTO: again.');
});

test('scenario 1: the calls, the question, the show line and her last word are hers; the jab, the win and the look are not', () => {
  const title = speakerOf(SCRIPT[CH1.persona.name]);
  assert.equal(title, 'CTO');
  for (const k of [...CH1.persona.calls, CH1.persona.ask, CH1.persona.options.hc.show, 'ch1.hero.line']) assert.equal(personaLine(SCRIPT[k], title).spoken, true, k);
  for (const k of [CH1.persona.options.wrong.jab, 'ch1.win', 'ch1.look.cto', 'ch1.room.enter']) assert.equal(personaLine(SCRIPT[k], title).spoken, false, k);
  assert.equal(CH1.persona.portrait, 'p1');
  assert.equal(CH1.persona.where, 'top-left');                       // the CTO is on the right
});

test('while typing the mouth cycles rest → talk1 → talk2 → talk1 at about 120 ms a frame; at rest it is shut', () => {
  assert.equal(FRAME_MS, 120);
  const mouths = [0, 1, 2, 3, 4, 5, 6, 7].map((f) => portraitFrame(f * FRAME_MS + 1, true, false, 1).mouth);
  assert.deepEqual(mouths, [0, 1, 2, 1, 0, 1, 2, 1]);
  for (let t = 0; t < 5000; t += 37) assert.equal(portraitFrame(t, false, false, 1).mouth, 0);
});

test('a blink every few seconds, on the persona\'s own schedule; two seeds do not blink together', () => {
  const blinks = (seed) => { const out = []; for (let f = 0; f < 400; f++) if (portraitFrame(f * FRAME_MS, false, false, seed).blink) out.push(f); return out; };
  const a = blinks(1), b = blinks(7);
  assert.ok(a.length >= 8 && a.length <= 24, `${a.length} blinks in 48 s`);
  const gaps = a.slice(1).map((f, i) => (f - a[i]) * FRAME_MS).filter((g) => g > FRAME_MS * 2);
  assert.ok(gaps.every((g) => g >= 1500 && g <= 10000), gaps.join());
  assert.notDeepEqual(a, b);
});

test('reduced motion: the still only — no mouth, no blink', () => {
  for (let t = 0; t < 20000; t += 113) assert.deepEqual(portraitFrame(t, true, true, 3), { mouth: 0, blink: false });
});

test('the portrait is the square of the 640×428 picture the brief names', () => {
  assert.deepEqual(PORTRAIT_CROP, { x: 170, y: 20, w: 300, h: 300 });
});

test('the window sits where it hides the persona least: beside their patch, at the top, inside the scene', () => {
  // top-left for a persona on the right: the window may use the scene from its left margin up to the patch
  const scale = 555 / 320;                                             // a 667×375 phone's scene
  const left = talkWindow('top-left', { x: 229, y: 65, w: 76, h: 104 }, scale, 10);
  assert.equal(left.maxWidth, Math.floor(229 * scale) - 10 - 10);
  assert.equal(left.className, 'top-left');
  const right = talkWindow('top-right', { x: 8, y: 45, w: 94, h: 141 }, scale, 10);
  assert.equal(right.maxWidth, Math.floor((320 - 102) * scale) - 10 - 10);
  assert.equal(right.className, 'top-right');
  assert.ok(talkWindow('top-left', null, scale, 10).maxWidth >= Math.floor(320 * scale) - 20, 'no patch: the whole width');
});
