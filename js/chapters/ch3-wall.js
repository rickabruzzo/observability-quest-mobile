// Scenario 3's wall display: a wall TV showing the store's checkout page. The art draws the browser's title bar;
// the game draws the page: a progress bar stuck at 13 % with a spinner, the cart (a guitar from rectangles), three
// small boxes of jokey stats on their own timers, a sales line sliding down — and, fixed, the bar full, the stats
// kind, the line climbing. The TV's glow is the game's too (Rick): a dithered halo round the bezel that flickers
// between white and a bluish white, with the pale page tinted by the same flicker. Shape: see ch1-wall.js.

const INK = '#2B2F36', PALE = '#F4F7FB', BAR = '#A9CBFF', GOOD = '#2E9A3A', BAD = '#C0392B';
const STEP_MS = 100, RECOVER_MS = 1400, GLOW = 8;

function hash(n) {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
const step = (s) => (s.reduced ? 0 : Math.floor(s.tAll / STEP_MS));
const fixed = (s) => s.state === 'fixed';
/** How full the progress bar is: stuck at 13 %, then filling once fixed. */
const progress = (s) => (fixed(s) ? (s.reduced ? 1 : Math.min(1, 0.13 + (0.87 * s.t) / RECOVER_MS)) : 0.13);
/** The TV's brightness this step: an irregular flicker between pure white and a slightly darker, bluer white. */
function flicker(s) {
  if (s.reduced) return 0.6;
  const k = step(s), h = hash(k * 31 + 7);
  return (h % 3 === 0 ? 0.55 : 1) - ((h >>> 8) % 100) / 500;                // 0.35–1
}
/** The halo's light: translucent, bluer when dimmer, so the brick shows through lit rather than painted white. */
const glowColour = (f) => (f > 0.8 ? `rgba(255,255,255,${(0.25 + 0.3 * f).toFixed(2)})` : `rgba(214,228,255,${(0.22 + 0.3 * f).toFixed(2)})`);

function rect(g, a, colour) { g.fillStyle = colour; g.fillRect(a.x0, a.y0, a.x1 - a.x0 + 1, a.y1 - a.y0 + 1); }
function frame(g, a, colour) { g.fillStyle = colour; g.fillRect(a.x0, a.y0, a.x1 - a.x0 + 1, 1); g.fillRect(a.x0, a.y1, a.x1 - a.x0 + 1, 1); g.fillRect(a.x0, a.y0, 1, a.y1 - a.y0 + 1); g.fillRect(a.x1, a.y0, 1, a.y1 - a.y0 + 1); }

/** A guitar from rectangles: body, waist, neck, head, strings. Fitted to the area, right-handed. */
function guitar(g, a, colour, strings = true) {
  const w = a.x1 - a.x0 + 1, h = a.y1 - a.y0 + 1, cx = a.x0 + Math.round(w * 0.4), cy = a.y0 + Math.round(h * 0.62);
  const bw = Math.max(6, Math.round(w * 0.34)), bh = Math.max(8, Math.round(h * 0.5));
  g.fillStyle = colour;
  g.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);                                           // lower bout
  g.fillRect(cx - Math.round(bw * 0.38), cy - bh / 2 - Math.round(bh * 0.3), Math.round(bw * 0.76), Math.round(bh * 0.3));   // upper bout
  const nw = Math.max(2, Math.round(h * 0.08)), nl = Math.round(w * 0.42);
  g.fillRect(cx, cy - Math.round(nw / 2), nl, nw);                                       // the neck, to the right
  g.fillRect(cx + nl, cy - nw, Math.max(3, Math.round(w * 0.08)), nw * 2);               // the head
  if (strings && bh > 14) { g.fillStyle = PALE; for (let i = 0; i < 2; i++) g.fillRect(cx - bw / 2 + 2, cy - 1 + i * 2, bw + nl - 4, 1); }
}

/** The sales line: samples 0 (top) … 1 (bottom) across `n` columns, sliding down while broken, climbing once fixed. */
function sales(s, n) {
  const k = step(s), out = [];
  for (let i = 0; i < n; i++) {
    const x = (i + k * 0.5) / n;
    const base = fixed(s) ? 0.8 - 0.6 * ((i / n) * (s.reduced ? 1 : Math.min(1, s.t / RECOVER_MS)) + (1 - Math.min(1, s.t / RECOVER_MS)) * 0.5) : 0.2 + 0.6 * (i / n);
    out.push(Math.max(0.05, Math.min(0.95, base + ((hash(Math.floor(x * 40) + 3) % 7) - 3) * 0.02)));
  }
  return out;
}
function drawLine(g, a, samples, colour, thick) {
  const h = a.y1 - a.y0, stepX = (a.x1 - a.x0 + 1) / samples.length;
  g.fillStyle = colour;
  samples.forEach((v, i) => {
    const y = Math.round(a.y0 + v * h), prev = i ? Math.round(a.y0 + samples[i - 1] * h) : y;
    g.fillRect(Math.round(a.x0 + i * stepX), Math.min(y, prev), Math.max(1, Math.round(stepX)), Math.max(thick, Math.abs(y - prev) + 1));
  });
}
/** The halo round the bezel: pixels outside it, within GLOW px, lit by a dither that thins with distance. */
function halo(g, bezel, f, k) {
  const colour = glowColour(f);
  g.fillStyle = colour;
  for (let y = bezel.y0 - GLOW; y <= bezel.y1 + GLOW; y++) {
    for (let x = bezel.x0 - GLOW; x <= bezel.x1 + GLOW; x++) {
      const dx = x < bezel.x0 ? bezel.x0 - x : x > bezel.x1 ? x - bezel.x1 : 0;
      const dy = y < bezel.y0 ? bezel.y0 - y : y > bezel.y1 ? y - bezel.y1 : 0;
      const d = Math.max(dx, dy);
      if (d === 0) continue;
      const lit = (1 - d / (GLOW + 1)) ** 2 * (0.3 + 0.5 * f);                             // the share of pixels lit at this distance, thinning fast
      if ((hash(x * 131 + y * 17 + (k & 3)) % 1000) / 1000 < lit) g.fillRect(x, y, 1, 1);
    }
  }
}

export const WALL = {
  image: (s) => s.cfg.image,
  frameKey: (s) => `${s.state}:${step(s)}:${s.nudges.length}:${fixed(s) ? Math.min(RECOVER_MS, Math.floor(s.t / 100) * 100) : 0}`,
  recovered: (s) => s.reduced || s.t >= RECOVER_MS,
  hits: (s) => s.cfg.close.small.map((area, box) => ({ area, box })),
  /** The room: the TV's glow (under everything), the page tinted, a thin bar in the address bar, the guitar, bars, the line. */
  room(g, s) {
    const m = s.cfg.room, f = flicker(s);
    if (!(s.reduced && f === 0)) halo(g, m.bezel, s.reduced ? 0.35 : f, step(s));
    g.fillStyle = `rgba(255,255,255,${(0.04 + f * 0.1).toFixed(3)})`; g.fillRect(m.screen.x0, m.screen.y0, m.screen.x1 - m.screen.x0 + 1, m.screen.y1 - m.screen.y0 + 1);
    const p = m.progress, pw = Math.round((p.x1 - p.x0 + 1) * progress(s));
    rect(g, { x0: p.x0, y0: p.y0 + 1, x1: p.x0 + Math.max(1, pw) - 1, y1: p.y1 - 1 }, fixed(s) ? GOOD : '#4C8DFF');
    guitar(g, m.large, INK, false);
    m.small.forEach((a, i) => { rect(g, { x0: a.x0 + 2, y0: a.y0 + 3, x1: a.x0 + 2 + Math.round((a.x1 - a.x0 - 4) * (0.5 + ((hash(i * 7 + (fixed(s) ? 9 : step(s) >> 4)) % 50) / 100))), y1: a.y1 - 3 }, fixed(s) ? GOOD : (i === 0 ? BAD : INK)); });
    drawLine(g, m.lane, sales(s, m.lane.x1 - m.lane.x0 + 1), fixed(s) ? GOOD : BAD, 1);
  },
  /** Close up: the page tinted, the bar and its spinner, the cart, the boxes' frames, the sales line; the words are text. */
  close(g, s) {
    const m = s.cfg.close, f = flicker(s);
    g.fillStyle = `rgba(255,255,255,${(0.03 + f * 0.08).toFixed(3)})`; g.fillRect(m.screen.x0, m.screen.y0, m.screen.x1 - m.screen.x0 + 1, m.screen.y1 - m.screen.y0 + 1);
    const p = m.progress, pw = Math.round((p.x1 - p.x0 - 1) * progress(s));
    rect(g, { x0: p.x0 + 1, y0: p.y0 + 1, x1: p.x0 + Math.max(1, pw), y1: p.y1 - 1 }, fixed(s) ? '#7FD88A' : BAR);
    if (!fixed(s)) {                                                                        // the spinner: a dark pixel going round a tiny ring
      const k = step(s) % 8, cx = p.x1 - 6, cy = Math.round((p.y0 + p.y1) / 2);
      const ring = [[1, -2], [2, -1], [2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2]];
      g.fillStyle = INK; g.fillRect(cx + ring[k][0], cy + ring[k][1], 1, 1); g.fillRect(cx + ring[(k + 1) % 8][0], cy + ring[(k + 1) % 8][1], 1, 1);
    }
    guitar(g, { x0: m.large.x0 + 8, x1: m.large.x1 - 8, y0: m.large.y0 + 4, y1: m.cart.y0 - 4 }, INK);
    drawLine(g, m.lane, sales(s, Math.floor((m.lane.x1 - m.lane.x0 + 1) / 2)), fixed(s) ? GOOD : BAD, 2);
  },
  /** The bar's words, the cart's line, one stat a box (each on its own timer; fixed: the kind ones). */
  text(s) {
    const m = s.cfg.close, pool = fixed(s) ? s.text.okPool : s.text.pool, k = s.reduced ? 0 : Math.floor(s.tAll / 2500);
    const boxes = m.small.map((area, i) => {
      const taps = s.nudges.filter((n) => n.box === i).length;
      return { id: `box${i}`, area, lines: [pool[(i * 2 + k + taps) % pool.length]], cls: 'page' };
    });
    return [
      { id: 'progress', area: { x0: m.progress.x0 + 4, x1: m.progress.x1 - 12, y0: m.progress.y0, y1: m.progress.y1 }, lines: [fixed(s) ? s.text.progressOk : s.text.progress], cls: 'page left' },
      ...boxes,
      { id: 'cart', area: m.cart, lines: [s.text.cart], cls: 'page' },
    ];
  },
  tone: (s) => (fixed(s) ? 'ok' : ''),
};
