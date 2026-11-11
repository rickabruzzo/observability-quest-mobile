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
