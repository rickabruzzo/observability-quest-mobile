import test from 'node:test'; import assert from 'node:assert/strict';
import { GLYPHS, textWidth, drawText } from '../js/intro/font5x7.js';
import { lcdScale, flashOn, marqueeX, drawLcd } from '../js/intro/pager.js';
const MSG = 'Backend is down. Website is down. Database is down. Get in here! -CTO';
test('every character of both LCD strings has a glyph', () => { for (const ch of 'Help!' + MSG) assert.ok(GLYPHS[ch], JSON.stringify(ch)); });
test('all of printable ASCII has a glyph', () => { for (let c = 32; c < 127; c++) assert.ok(GLYPHS[String.fromCharCode(c)], String(c)); });
test('glyphs are 7 rows of 5 bits', () => { for (const g of Object.values(GLYPHS)) { assert.equal(g.length, 7); assert.ok(g.every((r) => r >= 0 && r < 32)); } });
test('known shapes: H and !', () => {
  assert.deepEqual(GLYPHS.H, [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001]);
  assert.deepEqual(GLYPHS['!'], [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100]);
});
test('textWidth', () => { assert.equal(textWidth('Help!'), 5 * 6 - 1); assert.equal(textWidth('Hi', 3), (2 * 6 - 1) * 3); assert.equal(textWidth(''), 0); });
test('drawText paints scale-sized pixels and boxes unknown glyphs', () => {
  const calls = []; const ctx = { fillStyle: '', fillRect: (...a) => calls.push(a) };
  drawText(ctx, 'H', 10, 20, 2, '#000'); assert.ok(calls.length > 5 && calls.every(([, , w, h]) => w === 2 && h === 2));
  const n = calls.length; drawText(ctx, '☃', 0, 0, 1, '#000'); assert.ok(calls.length > n);
});
test('lcdScale fits the height', () => { assert.equal(lcdScale({ x: 0, y: 0, w: 136, h: 36 }), 4); assert.equal(lcdScale({ x: 0, y: 0, w: 100, h: 12 }), 1); assert.equal(lcdScale({ x: 0, y: 0, w: 10, h: 3 }), 1); });
test('flash is on then off, 2 Hz', () => { assert.equal(flashOn(0), true); assert.equal(flashOn(249), true); assert.equal(flashOn(250), false); assert.equal(flashOn(500), true); });
test('marquee enters from the right and leaves on the left', () => {
  const lcd = { x: 92, y: 62, w: 136, h: 36 }, s = 4, w = textWidth(MSG, s);
  assert.equal(marqueeX(MSG, lcd, s, 0, 5000), lcd.x + lcd.w);
  assert.equal(marqueeX(MSG, lcd, s, 5000, 5000), lcd.x - w);
  assert.ok(marqueeX(MSG, lcd, s, 2500, 5000) < lcd.x);
  assert.equal(marqueeX(MSG, lcd, s, 99999, 5000), lcd.x - w);
});
test('short text is centred and does not scroll', () => {
  const lcd = { x: 92, y: 62, w: 136, h: 36 }, s = 4, x0 = marqueeX('Help!', lcd, s, 0, 5000);
  assert.equal(x0, marqueeX('Help!', lcd, s, 4000, 5000)); assert.ok(x0 > lcd.x && x0 + textWidth('Help!', s) < lcd.x + lcd.w);
});
test('drawLcd clips to the LCD and restores', () => {
  const log = []; const ctx = { fillStyle: '', save: () => log.push('save'), restore: () => log.push('restore'), beginPath() {}, rect: (...a) => log.push(['rect', ...a]), clip: () => log.push('clip'), fillRect() {} };
  drawLcd(ctx, { x: 92, y: 62, w: 136, h: 36 }, 'Hi', 100, 4);
  assert.deepEqual(log, ['save', ['rect', 92, 62, 136, 36], 'clip', 'restore']);
});
import { lcdPages, marqueeScale } from '../js/intro/pager.js';
test('marquee text is small enough to show at least eight characters at once', () => {
  assert.equal(marqueeScale({ x: 103, y: 71, w: 110, h: 36 }), 2);        // the real pager plate
  assert.equal(marqueeScale({ x: 92, y: 62, w: 136, h: 36 }), 2);
  assert.equal(marqueeScale({ x: 0, y: 0, w: 40, h: 36 }), 1);
  assert.equal(marqueeScale({ x: 0, y: 0, w: 600, h: 36 }), 4);        // never taller than the LCD
});
test('static paging: one sentence per page, word-wrapped, at the largest scale that fits', () => {
  const p = lcdPages(MSG, { x: 92, y: 62, w: 136, h: 36 });
  assert.equal(p.scale, 2);
  assert.deepEqual(p.pages, [['Backend is', 'down.'], ['Website is', 'down.'], ['Database is', 'down.'], ['Get in', 'here! -CTO']]);
  assert.deepEqual(lcdPages('Help!', { x: 92, y: 62, w: 136, h: 36 }), { scale: 4, pages: [['Help!']] });
});
test('static paging on a tiny LCD still returns every word', () => {
  const p = lcdPages(MSG, { x: 0, y: 0, w: 60, h: 12 });
  assert.equal(p.scale, 1);
  assert.equal(p.pages.flat().join(' ').replace(/\s+/g, ' '), MSG);
});
