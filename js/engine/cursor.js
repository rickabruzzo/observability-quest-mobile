// The cursor says what a tap will do, the way Sierra's did: a walking figure over the floor, a hand over
// anything usable. A mouse gets real cursors; a phone has no hover, so the same icon is stamped where the
// tap lands for a moment. Icons are our own pixels ('#' outline, 'o' fill, 'w' highlight).

export const MARKER_MS = 450;
const COLOURS = { '#': '#1a1424', o: '#FFB000', w: '#FFF3D0' };

export const ICONS = {
  walk: {
    hot: [6, 14],                      // the feet: where the hero will go
    rows: [
      '....###.....',
      '...#ooo#....',
      '...#owo#....',
      '....###.....',
      '...#ooo##...',
      '..#ooooo#o#.',
      '.#o#ooo#.##.',
      '.##.#oo#....',
      '....#ooo#...',
      '...#oo#oo#..',
      '..#oo#.#oo#.',
      '.#oo#...#o#.',
      '#oo#....#oo#',
      '###......###',
      '............',
    ],
  },
  hand: {
    hot: [5, 0],                       // the fingertip
    rows: [
      '....##......',
      '...#ow#.....',
      '...#oo#.....',
      '...#oo#.....',
      '...#oo###...',
      '...#oo#o###.',
      '.###oo#o#o##',
      '#oo#ooooooo#',
      '#ooooooooow#',
      '.#ooooooooo#',
      '.#ooooooooo#',
      '..#oooooooo#',
      '..#ooooooo#.',
      '...#######..',
    ],
  },
};

/** [x, y, colour] for every painted pixel of an icon. */
export function iconPixels(name) {
  const out = [];
  ICONS[name].rows.forEach((row, y) => [...row].forEach((ch, x) => { if (COLOURS[ch]) out.push([x, y, COLOURS[ch]]); }));
  return out;
}

/** What a tap or click at logical (x, y) would do: use the hotspot under it, or walk. */
export function actionAt(x, y, hotspots) {
  const spot = Number.isFinite(x) && Number.isFinite(y)
    ? (hotspots || []).find((h) => x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) : null;
  return spot ? { icon: 'hand', spot } : { icon: 'walk', spot: null };
}

/** Stamps an icon on the canvas with its hot spot at (x, y) — the tap marker. */
export function drawIcon(g, name, x, y) {
  const [hx, hy] = ICONS[name].hot;
  for (const [px, py, c] of iconPixels(name)) { g.fillStyle = c; g.fillRect(Math.round(x) - hx + px, Math.round(y) - hy + py, 1, 1); }
}

const css = new Map();
/** CSS cursor value for an icon, drawn at 2x so it reads on a desktop screen. */
export function cursorCss(name, doc = document) {
  if (css.has(name)) return css.get(name);
  const S = 2, rows = ICONS[name].rows, c = doc.createElement('canvas');
  c.width = rows[0].length * S; c.height = rows.length * S;
  const g = c.getContext('2d');
  for (const [x, y, col] of iconPixels(name)) { g.fillStyle = col; g.fillRect(x * S, y * S, S, S); }
  const [hx, hy] = ICONS[name].hot;
  const v = `url("${c.toDataURL('image/png')}") ${hx * S} ${hy * S}, ${name === 'hand' ? 'pointer' : 'default'}`;
  css.set(name, v);
  return v;
}

/** True where there is a real pointer that hovers (a mouse or trackpad), false on touch screens. */
export function hasHover(win = window) {
  return !!win.matchMedia && win.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/** Sets (or, with null, clears) the element's cursor. Does nothing on touch screens. */
export function applyCursor(el, name, win = window) {
  if (!el) return;
  el.style.cursor = name && hasHover(win) ? cursorCss(name, win.document) : '';
}
