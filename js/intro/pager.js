// Pager LCD maths: what the text does inside the LCD rectangle the asset build found on the nightstand plate.
import { textWidth, drawText } from './font5x7.js';

/** Largest whole scale whose 7px glyph fits the LCD height with a 2px margin top and bottom. */
export function lcdScale(lcd) { return Math.max(1, Math.floor((lcd.h - 4) / 7)); }

/** On for the first half of each period. 500ms = 2Hz, the fastest anything in the game may flash. */
export function flashOn(elapsedMs, periodMs = 500) { return (((elapsedMs % periodMs) + periodMs) % periodMs) < periodMs / 2; }

/** Left edge of the text. Text that fits sits centred; longer text crosses right-to-left over durationMs. */
export function marqueeX(text, lcd, scale, elapsedMs, durationMs) {
  const w = textWidth(text, scale);
  if (w <= lcd.w - 4) return lcd.x + Math.floor((lcd.w - w) / 2);
  const start = lcd.x + lcd.w, end = lcd.x - w;
  const p = Math.min(1, Math.max(0, durationMs > 0 ? elapsedMs / durationMs : 1));
  if (p >= 1) return end;
  return start - Math.round(((start - end) * p) / scale) * scale;       // whole LCD dots, never sub-pixel
}

export function drawLcd(ctx, lcd, text, x, scale, color = '#0F200F') {
  ctx.save();
  ctx.beginPath(); ctx.rect(lcd.x, lcd.y, lcd.w, lcd.h); ctx.clip();
  drawText(ctx, text, x, lcd.y + Math.floor((lcd.h - 7 * scale) / 2), scale, color);
  ctx.restore();
}

/** Scale for scrolling text: small enough for eight characters at once — but on a small LCD, double-size dots
 *  with five characters showing read better than single-size ones. Never taller than the LCD. */
export function marqueeScale(lcd) {
  const w = lcd.w - 4;
  return Math.max(1, Math.min(lcdScale(lcd), Math.max(Math.floor(w / 48), Math.min(2, Math.floor(w / 30)))));
}

function wrap(sentence, cols) {
  const lines = []; let line = '';
  for (let word of sentence.split(/\s+/).filter(Boolean)) {
    while (word.length > cols) {                                         // a word wider than the LCD is cut, never dropped
      if (line) { lines.push(line); line = ''; }
      lines.push(word.slice(0, cols)); word = word.slice(cols);
    }
    if (!word) continue;
    if (line && line.length + 1 + word.length > cols) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * The same text without scrolling (reduced motion): one sentence per page, word-wrapped, at the
 * largest scale where every page fits. On an LCD too small for that, pages are cut by line count.
 * @returns {{ scale: number, pages: string[][] }}
 */
export function lcdPages(text, lcd) {
  const sentences = String(text).split(/(?<=[.!?])\s+(?=[A-Za-z0-9])/).filter(Boolean);
  for (let scale = lcdScale(lcd); scale >= 1; scale--) {
    const cols = Math.max(1, Math.floor(((lcd.w - 4) / scale + 1) / 6));
    const rows = Math.max(1, Math.floor(((lcd.h - 4) / scale + 1) / 8));
    const pages = sentences.map((s) => wrap(s, cols));
    if (pages.every((p) => p.length <= rows)) return { scale, pages };
    if (scale === 1) {
      const all = pages.flat(), cut = [];
      for (let i = 0; i < all.length; i += rows) cut.push(all.slice(i, i + rows));
      return { scale, pages: cut };
    }
  }
  return { scale: 1, pages: [[String(text)]] };
}

/** Draws one static page, lines centred in the LCD. */
export function drawLcdPage(ctx, lcd, lines, scale, color = '#0F200F') {
  ctx.save();
  ctx.beginPath(); ctx.rect(lcd.x, lcd.y, lcd.w, lcd.h); ctx.clip();
  const pitch = 8 * scale, top = lcd.y + Math.floor((lcd.h - (lines.length * pitch - scale)) / 2);
  lines.forEach((l, i) => drawText(ctx, l, lcd.x + Math.floor((lcd.w - textWidth(l, scale)) / 2), top + i * pitch, scale, color));
  ctx.restore();
}
