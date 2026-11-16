// The painted hero (Warp brief 15): Art Claude's figures, cut to game size as parts the game recolours. The sheet
// (assets/hero/hero.png) is codes, not a picture: a pixel's code is 1 + part × 32 + tone, 0 is clear, 255 (in the beard)
// erases what is under it; the manifest (hero.json) says where every body, head and overlay is on it, with its anchor
// (the neck), and holds every colour as ramps of 32 tones. A figure is layers stacked anchor on anchor, then each code
// looked up in the player's colours; no colour maths, and nothing drawn by code. The one thing added is the Honeycomb
// mark on his chest, from js/engine/hc-mark.js. Drawn smaller, a figure keeps whole rows and columns of itself.

import { HC_MARK, HC_MARK_PIXELS } from './hc-mark.js';
import { DEFAULT_HERO } from './hero-parts.js';

export const HERO_W = 56;                   // the canvas the rooms scale him by (heroScaleAt): his nominal box
export const HERO_H = 144;                  // the painted figure stands 136 rows on it; not corrected (brief 15 C)
export const HERO_URL = 'assets/hero/hero.json';
export const PREVIEW = { w: 56, h: 148 };   // the creator's big preview: the front figure centred on its anchor, soles on the last row
export const THUMB = { w: 40, h: 44, dx: -20, dy: -36 };   // a hair, beard or glasses thumbnail: the front figure cropped from (ax − 20, ay − 36)
const TONES = 32, ERASE = 255;
const HC_RGB = Object.fromEntries(Object.entries(HC_MARK).map(([k, v]) => [k, [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)]]));

// ---- the sheet ----
let sheet = null, loading = null;
const figCache = new Map();

/** Installs the manifest and the sheet's codes (row-major, one byte a pixel). Tests call this with the fixture's codes. */
export function setHeroSheet(manifest, codes, w, h) {
  sheet = manifest && codes ? { m: manifest, codes, w, h } : null;
  figCache.clear();
}
export const heroReady = () => !!sheet;
export const heroManifest = () => sheet?.m ?? null;

/** Loads the manifest and the sheet in a browser, once. Never throws: resolves false and the game draws no hero. */
export function loadHero(url = HERO_URL) {
  if (sheet) return Promise.resolve(true);
  if (loading) return loading;
  loading = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url} ${res.status}`);
      const m = await res.json();
      const img = new Image();
      await new Promise((ok, fail) => { img.onload = ok; img.onerror = () => fail(new Error('hero sheet failed')); img.src = url.slice(0, url.lastIndexOf('/') + 1) + m.image; });
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data, codes = new Uint8Array(c.width * c.height);
      for (let i = 0; i < codes.length; i++) codes[i] = d[i * 4];                   // the red channel is the code
      setHeroSheet(m, codes, c.width, c.height);
      return true;
    } catch { return false; } finally { loading = null; }
  })();
  return loading;
}

// ---- putting a figure together ----
/** Which body a state uses (brief 15 C). A body's own name passes through (the walks name their frames). */
export function bodyFor(pose = 'idle', outfit = 'hoodie') {
  if (outfit === 'pj') return pose === 'situp' ? 'pj_sit' : 'pj_front';
  if (pose === 'idle' || pose === 'front') return 'front';
  if (pose === 'stand') return 'side';
  if (pose === 'situp') return 'pj_sit';
  return sheet?.m.bodies[pose] ? pose : 'front';
}
/** A piece's codes cut from the sheet. */
function cut(e) {
  const { codes, w } = sheet, out = new Uint8Array(e.w * e.h);
  for (let y = 0; y < e.h; y++) out.set(codes.subarray((e.y + y) * w + e.x, (e.y + y) * w + e.x + e.w), y * e.w);
  return { codes: out, w: e.w, h: e.h, ax: e.ax, ay: e.ay };
}
/** Layers anchor on anchor, later over earlier: 0 leaves what is under, ERASE clears it, anything else replaces it. */
function stack(layers) {
  const left = Math.max(...layers.map((l) => l.ax)), top = Math.max(...layers.map((l) => l.ay));
  const w = Math.max(...layers.map((l) => l.w - l.ax)) + left, h = Math.max(...layers.map((l) => l.h - l.ay)) + top;
  const codes = new Uint8Array(w * h);
  for (const l of layers) {
    const ox = left - l.ax, oy = top - l.ay;
    for (let y = 0; y < l.h; y++) for (let x = 0; x < l.w; x++) {
      const c = l.codes[y * l.w + x];
      if (c === 0) continue;
      codes[(oy + y) * w + ox + x] = c === ERASE ? 0 : c;
    }
  }
  return { codes, w, h, ax: left, ay: top };
}
const hex6 = (s, i) => [parseInt(s.slice(i, i + 2), 16), parseInt(s.slice(i + 2, i + 4), 16), parseInt(s.slice(i + 4, i + 6), 16)];
/** code → RGBA for one look (and outfit): the six parts' ramps in the manifest's part order. */
function lut(cfg, outfit) {
  const r = sheet.m.ramps, pj = outfit === 'pj';
  const skin = r.skin[cfg.skin] ? cfg.skin : DEFAULT_HERO.skin;
  const ramps = [
    pj ? r.pj.top : (r.hoodie[cfg.hoodie] ?? r.hoodie[DEFAULT_HERO.hoodie]),
    pj ? r.pj.bottom : (r.jeans[cfg.jeans] ?? r.jeans[DEFAULT_HERO.jeans]),
    r.skin[skin],
    (r.hair[cfg.hair] ?? r.hair[DEFAULT_HERO.hair])[skin],
    r.grey, r.outline,
  ];
  const out = new Uint8ClampedArray(256 * 4);
  ramps.forEach((ramp, i) => { for (let t = 0; t < TONES; t++) { const c = hex6(ramp, t * 6), o = (1 + i * TONES + t) * 4; out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = 255; } });
  return out;
}
const key = (cfg, body, outfit, mark) => `${body}|${outfit}|${mark ? 1 : 0}|${cfg.hoodie}|${cfg.jeans}|${cfg.skin}|${cfg.hair}|${cfg.style}|${cfg.beard}|${cfg.glasses}`;

/**
 * A finished figure: { w, h, ax, ay, view, body, data (RGBA), eyes: [[x, y]…] in the figure's own pixels }, or null when the
 * sheet is not loaded or the body is unknown. The body, the head of the hero's style for that view, the beard and the
 * glasses if he has them and the view shows them; the colours looked up; the mark on the chest where the manifest says
 * (hoodie only; `mark: false` leaves it off, as the fixtures are). Kept per look and body.
 */
export function composeFigure(cfg, body, outfit = 'hoodie', { mark = true } = {}) {
  if (!sheet) return null;
  const m = sheet.m, b = m.bodies[body];
  if (!b) return null;
  const k = key(cfg, body, outfit, mark), hit = figCache.get(k);
  if (hit) return hit;
  const style = m.heads[cfg.style] ? cfg.style : DEFAULT_HERO.style;
  const layers = [cut(b), cut(m.heads[style][b.view])];
  if (cfg.beard && cfg.beard !== 'none' && m.beard[b.view]) layers.push(cut(m.beard[b.view]));
  if (cfg.glasses && cfg.glasses !== 'none' && m.glasses[b.view]) layers.push(cut(m.glasses[b.view]));
  const s = stack(layers), L = lut(cfg, outfit), data = new Uint8ClampedArray(s.w * s.h * 4);
  for (let i = 0; i < s.codes.length; i++) { const c = s.codes[i] * 4, o = i * 4; data[o] = L[c]; data[o + 1] = L[c + 1]; data[o + 2] = L[c + 2]; data[o + 3] = L[c + 3]; }
  if (mark && outfit === 'hoodie' && m.mark.bodies.includes(body)) {
    for (const [mx, my, colour] of HC_MARK_PIXELS) {
      const x = s.ax + m.mark.dx + mx, y = s.ay + m.mark.dy + my;
      if (x < 0 || y < 0 || x >= s.w || y >= s.h) continue;
      const o = (y * s.w + x) * 4, c = HC_RGB[colour]; data[o] = c[0]; data[o + 1] = c[1]; data[o + 2] = c[2]; data[o + 3] = 255;
    }
  }
  const fig = { w: s.w, h: s.h, ax: s.ax, ay: s.ay, view: b.view, body, data, eyes: (m.eyes[b.view] ?? []).map(([dx, dy]) => [s.ax + dx, s.ay + dy]) };
  figCache.set(k, fig); if (figCache.size > 96) figCache.delete(figCache.keys().next().value);
  return fig;
}
/** A prop from the sheet in the hero's colours (the heap of day clothes): { w, h, ax, ay, data, eyes: [] }, anchored at its bottom centre. */
export function composeProp(name, cfg) {
  const e = sheet?.m.props[name];
  if (!e) return null;
  const p = cut({ ...e, ax: Math.floor(e.w / 2), ay: e.h }), L = lut(cfg, 'hoodie'), data = new Uint8ClampedArray(p.w * p.h * 4);
  for (let i = 0; i < p.codes.length; i++) { const c = (p.codes[i] === ERASE ? 0 : p.codes[i]) * 4, o = i * 4; data[o] = L[c]; data[o + 1] = L[c + 1]; data[o + 2] = L[c + 2]; data[o + 3] = L[c + 3]; }
  return { w: p.w, h: p.h, ax: p.ax, ay: p.ay, view: 'front', body: name, data, eyes: [] };
}
/** The figure in one flat colour (the flash into day clothes). */
export function silhouette(fig, [r, g, b]) {
  const data = new Uint8ClampedArray(fig.data.length);
  for (let i = 0; i < data.length; i += 4) if (fig.data[i + 3]) { data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255; }
  return { ...fig, data };
}

// ---- drawn smaller (brief 15 D) ----
// A smaller figure keeps whole rows and columns of itself, evenly spaced, slid along each axis to the offset that keeps
// the most: his soles' row always, the eyes' row and columns whenever some offset allows it, then the lines with the
// most colour changes. No blending, ever: every pixel is one of the figure's own.

/** Which of `n` source lines `m` destination lines take, evenly spaced, slid by `phase` (0..1) of a destination line. */
export function evenLines(n, m, phase = 0.5) {
  const k = n / m, out = new Array(m);
  for (let d = 0; d < m; d++) out[d] = Math.min(n - 1, Math.floor((d + phase) * k));
  return out;
}
const PHASES = Array.from({ length: 20 }, (_, i) => i / 20);
function bestLines(n, m, score, ok = () => true) {
  let best = null, top = -Infinity;
  for (const phase of PHASES) {
    const lines = evenLines(n, m, phase);
    if (!ok(lines)) continue;
    const v = score(lines) - Math.abs(phase - 0.5) * 1e-3;
    if (v > top) { top = v; best = lines; }
  }
  return best ?? evenLines(n, m);
}
const detailCache = new WeakMap();
/** Colour changes along each row and column of a figure. */
function detailOf(fig) {
  let d = detailCache.get(fig);
  if (d) return d;
  const { w, h, data: px } = fig, rows = new Float64Array(h), cols = new Float64Array(w);
  const same = (i, j) => px[i] === px[j] && px[i + 1] === px[j + 1] && px[i + 2] === px[j + 2] && px[i + 3] === px[j + 3];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (x + 1 < w && !same(i, i + 4)) rows[y]++;
    if (y + 1 < h && !same(i, i + w * 4)) cols[x]++;
  }
  d = { rows, cols }; detailCache.set(fig, d);
  return d;
}
/** The destination line that carries source line `s` (the first kept line at or after it; the last if none). */
const placeOf = (lines, s) => { const i = lines.findIndex((l) => l >= s); return i < 0 ? lines.length - 1 : i; };

/**
 * A figure at `scale` (never above 1): { w, h, ax, ay, data }. Whole rows and columns of the figure, evenly spaced, at the
 * offset that keeps the most (above); `flip` mirrors the result and the anchor's column moves with it.
 */
export function scaleFigure(fig, scale = 1, flip = false) {
  const s = Math.min(1, scale), w = Math.max(1, Math.round(fig.w * s)), h = Math.max(1, Math.round(fig.h * s));
  let ys, xs;
  if (w >= fig.w && h >= fig.h) { ys = evenLines(fig.h, h); xs = evenLines(fig.w, w); }
  else {
    const d = detailOf(fig), eyeRows = [...new Set(fig.eyes.map(([, y]) => y))], eyeCols = [...new Set(fig.eyes.map(([x]) => x))];
    const sum = (score) => (lines) => { let v = 0, last = -1; for (const l of lines) if (l !== last) { v += score[l]; last = l; } return v; };
    const rowScore = sum(d.rows), colScore = sum(d.cols);
    ys = bestLines(fig.h, h, (lines) => rowScore(lines) + eyeRows.filter((y) => lines.includes(y)).length * 1e4, (lines) => lines[h - 1] === fig.h - 1);
    xs = bestLines(fig.w, w, (lines) => colScore(lines) + eyeCols.filter((x) => lines.includes(x)).length * 1e4);
  }
  const data = new Uint8ClampedArray(w * h * 4);
  for (let dr = 0; dr < h; dr++) for (let dc = 0; dc < w; dc++) {
    const sx = xs[flip ? w - 1 - dc : dc], i = (ys[dr] * fig.w + sx) * 4, o = (dr * w + dc) * 4;
    data[o] = fig.data[i]; data[o + 1] = fig.data[i + 1]; data[o + 2] = fig.data[i + 2]; data[o + 3] = fig.data[i + 3];
  }
  const ax = placeOf(xs, fig.ax), ay = placeOf(ys, fig.ay);
  return { w, h, ax: flip ? w - 1 - ax : ax, ay, data };
}
const scaledCache = new WeakMap();
function scaled(fig, scale, flip) {
  let m = scaledCache.get(fig);
  if (!m) { m = new Map(); scaledCache.set(fig, m); }
  const k = `${Math.round(fig.w * Math.min(1, scale))}x${Math.round(fig.h * Math.min(1, scale))}${flip ? 'f' : ''}`;
  let v = m.get(k);
  if (!v) { v = scaleFigure(fig, scale, flip); m.set(k, v); if (m.size > 48) m.delete(m.keys().next().value); }
  return v;
}

/** Paints a figure with its top-left at (x, y) at `scale`, in whole pixels: runs of one colour go as one fillRect. */
export function blit(ctx, fig, x, y, scale = 1, flip = false) {
  const { w, h, data } = scaled(fig, scale, flip);
  for (let dr = 0; dr < h; dr++) {
    let run = null, from = 0;
    for (let dc = 0; dc <= w; dc++) {
      let col = null;
      if (dc < w) { const i = (dr * w + dc) * 4; if (data[i + 3]) col = `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`; }
      if (run !== null && run !== col) { ctx.fillStyle = run; ctx.fillRect(x + from, y + dr, dc - from, 1); run = null; }
      if (col !== null && run === null) { run = col; from = dc; }
    }
  }
}

/**
 * Where the hero's figure goes for his feet's centre at (feetX, feetY) on the floor (brief 15 C): its anchor's column on
 * feetX, its last row the row above feetY (so box.y + box.h is the floor line, as the rooms count it), moved down `dy`
 * figure pixels (a walk frame's bob). Side bodies mirror when `flip`; the front and back views never do. Returns the box
 * of what would be drawn, { x, y, w, h, ax, ay, scale, fig }, or null without the sheet.
 */
export function placeHero(cfg, pose, feetX, feetY, scale = 1, { flip = false, outfit = 'hoodie', dy = 0 } = {}) {
  const fig = composeFigure(cfg, bodyFor(pose, outfit), outfit);
  if (!fig) return null;
  const s = Math.min(1, scale), mirror = flip && fig.view === 'side', sc = scaled(fig, s, mirror);
  return { x: feetX - sc.ax, y: feetY - sc.h + Math.round(dy * s), w: sc.w, h: sc.h, ax: sc.ax, ay: sc.ay, scale: s, flip: mirror, fig };
}
/** Draws the hero for his feet at (feetX, feetY); see placeHero. Returns the drawn box, or null when there is no hero to draw. */
export function drawHero(ctx, cfg, pose, feetX, feetY, scale = 1, opts = {}) {
  const p = placeHero(cfg, pose, feetX, feetY, scale, opts);
  if (p) blit(ctx, p.fig, p.x, p.y, p.scale, p.flip);
  return p;
}
/** The creator's big preview: the front figure centred on its anchor in a PREVIEW canvas, soles on the last row. */
export function drawPreview(ctx, cfg) {
  const fig = composeFigure(cfg, 'front');
  if (!fig) return null;
  const x = Math.floor(PREVIEW.w / 2) - fig.ax, y = PREVIEW.h - fig.h;
  blit(ctx, fig, x, y, 1, false);
  return { x, y, w: fig.w, h: fig.h };
}
/** A thumbnail for hair, beard or glasses: the front figure cropped to THUMB from (ax + dx, ay + dy), at (0, 0). */
export function drawHeadThumb(ctx, cfg) {
  const fig = composeFigure(cfg, 'front');
  if (!fig) return false;
  const x0 = fig.ax + THUMB.dx, y0 = fig.ay + THUMB.dy;
  for (let r = 0; r < THUMB.h; r++) for (let c = 0; c < THUMB.w; c++) {
    const sx = x0 + c, sy = y0 + r;
    if (sx < 0 || sy < 0 || sx >= fig.w || sy >= fig.h) continue;
    const i = (sy * fig.w + sx) * 4;
    if (!fig.data[i + 3]) continue;
    ctx.fillStyle = `rgb(${fig.data[i]},${fig.data[i + 1]},${fig.data[i + 2]})`;
    ctx.fillRect(c, r, 1, 1);
  }
  return true;
}
