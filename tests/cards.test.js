// The persona cards at the art's own size (Rick, 2026-11-14: "rather have it with the original look"): the data
// names the built files, and Knight Watch's notifications are drawn on the phone the card paints.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHAPTERS } from '../js/chapters/index.js';

const CARDS = JSON.parse(readFileSync('assets/cards/cards.json', 'utf8'));

test('the cards are built at the art\'s size, not the old 128×80', () => {
  assert.deepEqual(CARDS.size, [640, 400]);
  for (const c of Object.values(CHAPTERS)) assert.equal(c.persona.art, `assets/cards/${CARDS.cards[c.persona.card]}`);
});

test('Knight Watch\'s notifications sit on the phone screen the card paints (x 418–451, y 276–312 of 640×400)', () => {
  const o = CHAPTERS[4].persona.overlay;
  assert.equal(o.kind, 'phone');
  assert.ok(o.px >= 2, 'one phone pixel is several card pixels at this size');
  assert.ok(o.x >= 418 && o.x + o.w * o.px <= 451, `x ${o.x}..${o.x + o.w * o.px}`);
  assert.ok(o.y >= 276 && o.y + o.h * o.px <= 312, `y ${o.y}..${o.y + o.h * o.px}`);
});
