// The painted hero drawn smaller (brief 15 D): whole rows and columns of the figure, evenly spaced, slid to keep the most:
// the soles' row always, the eyes' row and columns whenever some offset allows it, then the lines with the most colour.
import test from 'node:test';
import assert from 'node:assert/strict';
import { composeFigure, scaleFigure, evenLines, drawHero } from '../js/engine/hero.js';
import { DEFAULT_HERO, OPTIONS } from '../js/engine/hero-parts.js';
import { MANIFEST } from './hero.test.js';

const SCALES = [0.6, 0.7, 0.8, 0.9, 0.95];
const rgba = (d, i) => `${d[i]},${d[i + 1]},${d[i + 2]},${d[i + 3]}`;

for (const body of ['front', 'side']) for (const style of OPTIONS.style) {
  test(`${body}, ${style}, at ${SCALES.join(', ')}: the last row is kept, the eyes' row and columns are kept, every pixel is the figure's own, flip is the mirror`, () => {
    const fig = composeFigure({ ...DEFAULT_HERO, style }, body);
    const own = new Set(); for (let i = 0; i < fig.data.length; i += 4) own.add(rgba(fig.data, i));
    const lastRow = []; for (let x = 0; x < fig.w; x++) lastRow.push(rgba(fig.data, ((fig.h - 1) * fig.w + x) * 4));
    for (const scale of SCALES) {
      const s = scaleFigure(fig, scale);
      assert.equal(s.w, Math.round(fig.w * scale)); assert.equal(s.h, Math.round(fig.h * scale));
      for (let i = 0; i < s.data.length; i += 4) assert.ok(own.has(rgba(s.data, i)), `${scale}: a colour the figure does not have`);
      // the last row: every pixel of the scaled last row is one of the figure's last row
      const last = new Set(lastRow);
      for (let x = 0; x < s.w; x++) assert.ok(last.has(rgba(s.data, ((s.h - 1) * s.w + x) * 4)), `${scale}: the soles' row is kept`);
      // the eyes: each pupil's own pixel is somewhere on the scaled figure's row for it, in its column
      for (const [ex, ey] of fig.eyes) {
        const want = rgba(fig.data, (ey * fig.w + ex) * 4);
        const found = []; for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) if (rgba(s.data, (y * s.w + x) * 4) === want) found.push([x, y]);
        const ky = s.h / fig.h, kx = s.w / fig.w;
        assert.ok(found.some(([x, y]) => Math.abs(y - ey * ky) <= 1.5 && Math.abs(x - ex * kx) <= 1.5), `${scale}: the pupil at ${ex},${ey} is kept`);
      }
      const f = scaleFigure(fig, scale, true);
      for (let y = 0; y < s.h; y += 3) for (let x = 0; x < s.w; x++) assert.equal(rgba(f.data, (y * s.w + x) * 4), rgba(s.data, (y * s.w + (s.w - 1 - x)) * 4));
      assert.equal(f.ax, s.w - 1 - s.ax);
    }
  });
}
test('evenLines: never a line twice at a shrink, never two skipped; at scale 1 the figure is untouched', () => {
  const lines = evenLines(136, 105, 0.3);
  assert.equal(lines.length, 105);
  for (let i = 1; i < lines.length; i++) assert.ok(lines[i] - lines[i - 1] >= 1 && lines[i] - lines[i - 1] <= 2);
  const fig = composeFigure(DEFAULT_HERO, 'front'), s = scaleFigure(fig, 1);
  assert.deepEqual([s.w, s.h, s.ax, s.ay], [fig.w, fig.h, fig.ax, fig.ay]); assert.deepEqual([...s.data], [...fig.data]);
  assert.deepEqual([...scaleFigure(fig, 1.5).data], [...fig.data], 'never larger than 1');
});
test('the scaled anchor is where the anchor\'s column landed', () => {
  const fig = composeFigure(DEFAULT_HERO, 'front');
  for (const scale of SCALES) { const s = scaleFigure(fig, scale); assert.ok(Math.abs(s.ax - fig.ax * scale) <= 1.5 && Math.abs(s.ay - fig.ay * scale) <= 1.5, `${scale}: ${s.ax},${s.ay}`); }
});
test('every room size: a smaller hero has no see-through edge and stands on his last row', () => {
  const fig = composeFigure(DEFAULT_HERO, 'front');
  for (const scale of [0.95, 0.91, 0.86, 0.84, 0.81, 0.77, 0.73, 0.69, 0.65, 0.61, 0.57, 0.51]) {
    const s = scaleFigure(fig, scale);
    let last = -1;
    for (let i = 3; i < s.data.length; i += 4) { assert.ok(s.data[i] === 0 || s.data[i] === 255); if (s.data[i]) last = Math.floor(i / 4 / s.w); }
    assert.equal(last, s.h - 1, `${scale}`);
  }
  const calls = [], g = { fillStyle: '', fillRect(x, y, w, h) { calls.push([x, y, w, h]); } };
  const b = drawHero(g, DEFAULT_HERO, 'idle', 50, 100, 0.77);
  assert.equal(b.h, Math.round(136 * 0.77)); assert.ok(calls.length > 50);
});
test('the manifest\'s eyes are where the figure\'s are: two in front, one in profile', () => {
  assert.equal(MANIFEST.eyes.front.length, 2); assert.equal(MANIFEST.eyes.side.length, 1);
  assert.equal(composeFigure(DEFAULT_HERO, 'front').eyes.length, 2); assert.equal(composeFigure(DEFAULT_HERO, 'back').eyes.length, 0);
});
