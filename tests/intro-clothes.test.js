// Yesterday's clothes on the bedroom floor (art brief 08; review of 2026-11-18). Rick, 2026-11-17: "before it was spread
// on the ground like it was what the character took off before bed. I want it to appear as if they are in a hurry and
// threw on yesterdays outfit." The painting is spread wide, so where it lies matters: it has to be seen whole, both
// while he sits up in bed and while he stands in his pyjamas beside it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import './hero.test.js';                                   // installs the hero's sheet
import { drawClothes } from '../js/screens/intro.js';
import { placeHero, HERO_W } from '../js/engine/hero.js';
import { DEFAULT_HERO } from '../js/engine/hero-parts.js';
import { SHOTS } from '../js/intro/timeline.js';

const INTRO = JSON.parse(readFileSync('assets/intro/intro.json', 'utf8'));
const BED = SHOTS.find((s) => s.id === 'bedroom');

/** Every pixel drawClothes paints, as a box: { x0, y0, x1, y1 } (x1, y1 exclusive). */
function painted(x, y, hs) {
  const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const g = { fillStyle: '', fillRect(px, py, w, h) { b.x0 = Math.min(b.x0, px); b.y0 = Math.min(b.y0, py); b.x1 = Math.max(b.x1, px + w); b.y1 = Math.max(b.y1, py + h); } };
  drawClothes(g, DEFAULT_HERO, x, y, hs);
  return b;
}

test('the clothes are drawn with the middle of their bottom edge on the point given, at the hero\'s scale', () => {
  const full = painted(160, 150, 1);
  assert.deepEqual([full.x1 - full.x0, full.y1 - full.y0], [100, 38]);
  assert.deepEqual([(full.x0 + full.x1) / 2, full.y1], [160, 150]);
  const small = painted(160, 150, 0.85);
  assert.deepEqual([small.x1 - small.x0, small.y1 - small.y0], [85, 32]);
  assert.ok(Math.abs((small.x0 + small.x1) / 2 - 160) <= 0.5 && small.y1 === 150);
});

test('in the bedroom they lie whole on the floor, clear of the bed and of where he stands', () => {
  const c = painted(INTRO.clothes.x, INTRO.clothes.y, BED.heroScale);
  assert.ok(c.x0 >= 0 && c.x1 <= 320 && c.y1 <= 200, `on the picture (${JSON.stringify(c)})`);
  assert.ok(c.y0 >= 160, 'on the floor, below the furniture along the wall');
  assert.ok(c.y1 <= BED.standY, 'no nearer us than his feet');
  // where he stands in his pyjamas (js/screens/intro.js: the manifest's stand.x is the sprite's left edge)
  const feetX = INTRO.stand.x + Math.round((HERO_W * BED.heroScale) / 2);
  const he = placeHero(DEFAULT_HERO, 'idle', feetX, BED.standY, BED.heroScale, { outfit: 'pj' });
  assert.ok(c.x0 >= he.x + he.w || c.x1 <= he.x, `beside him, not behind him (clothes x ${c.x0}..${c.x1}, he x ${he.x}..${he.x + he.w})`);
  assert.ok(c.x0 >= 112, 'clear of the bed');
});
