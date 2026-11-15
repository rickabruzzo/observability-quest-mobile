// Scenario 3's wall display: a wall TV showing the store's page (brief 14 C). The art draws the browser's title bar;
// the game draws the page: a customer's visit, over and over — four products browsed (the pictures are Art Claude's,
// on the S3_products sheet), the shop's name on the header in its colour, then the left-handed model in the cart
// and the order that sticks at 13 % with a spinner; three small boxes of jokey stats on their own timers; a sales
// line sliding down — and, fixed, the southpaw stays, the bar fills, the stats are kind, the line climbs. The TV's
// light is the page itself: its pale background shifts between three close tints at irregular intervals (Rick,
// 2026-11-14: no ring of light round the bezel). Shape: see ch1-wall.js.

const INK = '#2B2F36', BAR = '#A9CBFF', GOOD = '#2E9A3A', BAD = '#C0392B';
export const SHOP = '#8C3A1C', SHOP_INK = '#F4E9D0';            // the shop's colour; its name on the header
const STEP_MS = 100, RECOVER_MS = 1400;
export const VISIT_MS = 14000, BROWSE_MS = 1100, CART_AT = 4400, STUCK_AT = 5000;
export const PRODUCTS = ['ukulele', 'banjo', 'acoustic', 'bass'], SOUTHPAW = 'southpaw';

function hash(n) {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
const step = (s) => (s.reduced ? 0 : Math.floor(s.tAll / STEP_MS));

/** The page's three tints: the white it is painted, a cooler white, a slightly dimmer one. Laid over the screen. */
export const TINTS = ['rgba(255,255,255,0)', 'rgba(196,214,255,0.22)', 'rgba(20,30,50,0.10)'];
/** The tint holds between this long and this long before it shifts. */
export const TINT_MS = [200, 600];
/** Which tint shows at `t` ms: a schedule of irregular holds, no two the same in a row. Reduced motion: the first. */
export function pageTint(t, reduced = false) {
  if (reduced) return 0;
  let at = 0, k = 0;
  for (let n = 0; n < 200000; n++) {
    const hold = TINT_MS[0] + (hash(n * 5 + 3) % (TINT_MS[1] - TINT_MS[0] + 1));
    if (t < at + hold) return k;
    at += hold;
    k = (k + 1 + (hash(n * 9 + 1) % 2)) % 3;                                  // the next tint is one of the other two
  }
  return k;
}
const fixed = (s) => s.state === 'fixed';

/**
 * Where the customer's visit is at this moment (from tAll; one visit is VISIT_MS). Fixed or reduced motion: the order.
 * @returns {{ phase: 'browse'|'cart'|'stuck'|'order', product: string, progress: number }}
 *   phase: browsing a product, the bar running to 13 %, stuck at 13 %, or (fixed) the order going through.
 */
export function visit(s) {
  if (fixed(s)) return { phase: 'order', product: SOUTHPAW, progress: s.reduced ? 1 : Math.min(1, 0.13 + (0.87 * s.t) / RECOVER_MS) };
  if (s.reduced) return { phase: 'stuck', product: SOUTHPAW, progress: 0.13 };
  const p = ((s.tAll % VISIT_MS) + VISIT_MS) % VISIT_MS;
  if (p < CART_AT) return { phase: 'browse', product: PRODUCTS[Math.floor(p / BROWSE_MS)], progress: 0 };
  if (p < STUCK_AT) return { phase: 'cart', product: SOUTHPAW, progress: (0.13 * (p - CART_AT)) / (STUCK_AT - CART_AT) };
  return { phase: 'stuck', product: SOUTHPAW, progress: 0.13 };
}
const browsing = (v) => v.phase === 'browse';

function rect(g, a, colour) { g.fillStyle = colour; g.fillRect(a.x0, a.y0, a.x1 - a.x0 + 1, a.y1 - a.y0 + 1); }

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

export const WALL = {
  image: (s) => s.cfg.image,
  frameKey: (s) => { const v = visit(s); return `${s.state}:${step(s)}:${pageTint(s.tAll, s.reduced)}:${s.nudges.length}:${v.phase}:${v.product}:${Math.round(v.progress * 100)}:${fixed(s) ? Math.min(RECOVER_MS, Math.floor(s.t / 100) * 100) : 0}`; },
  recovered: (s) => s.reduced || s.t >= RECOVER_MS,
  /** Where the visit is: what the browser tests read through window.__oq.chapter.wall.frame. */
  frame: (s) => visit(s),
  hits: (s) => s.cfg.close.small.map((area, box) => ({ area, box })),
  /** The room: the page's tint (under the picture), a thin bar in the address bar, the product, bars, the line. */
  room(g, s) {
    const m = s.cfg.room, v = visit(s);
    rect(g, m.screen, TINTS[pageTint(s.tAll, s.reduced)]);
    const p = m.progress;
    if (browsing(v)) rect(g, { x0: p.x0, y0: p.y0 + 1, x1: p.x1, y1: p.y1 - 1 }, SHOP);                          // the shop's colour while browsing
    else { const pw = Math.round((p.x1 - p.x0 + 1) * v.progress); rect(g, { x0: p.x0, y0: p.y0 + 1, x1: p.x0 + Math.max(1, pw) - 1, y1: p.y1 - 1 }, fixed(s) ? GOOD : '#4C8DFF'); }
    s.art?.draw(g, `product_${v.product}_small`, m.picture.x, m.picture.y);
    m.small.forEach((a, i) => { rect(g, { x0: a.x0 + 2, y0: a.y0 + 3, x1: a.x0 + 2 + Math.round((a.x1 - a.x0 - 4) * (0.5 + ((hash(i * 7 + (fixed(s) ? 9 : step(s) >> 4)) % 50) / 100))), y1: a.y1 - 3 }, fixed(s) ? GOOD : (i === 0 ? BAD : INK)); });
    drawLine(g, m.lane, sales(s, m.lane.x1 - m.lane.x0 + 1), fixed(s) ? GOOD : BAD, 1);
  },
  /** Close up: the page tinted, the header (the shop's name, or the bar and its spinner), the product, the boxes' tabs,
   * the sales line; the words are text. */
  close(g, s) {
    const m = s.cfg.close, v = visit(s);
    rect(g, m.screen, TINTS[pageTint(s.tAll, s.reduced)]);
    const p = m.progress;
    if (browsing(v)) rect(g, { x0: p.x0 + 1, y0: p.y0 + 1, x1: p.x1 - 1, y1: p.y1 - 1 }, SHOP);                   // the header in the shop's colour
    else { const pw = Math.round((p.x1 - p.x0 - 1) * v.progress); rect(g, { x0: p.x0 + 1, y0: p.y0 + 1, x1: p.x0 + Math.max(1, pw), y1: p.y1 - 1 }, fixed(s) ? '#7FD88A' : BAR); }
    s.art?.draw(g, `product_${v.product}`, m.picture.x, m.picture.y);
    for (const a of m.small) rect(g, { x0: a.x0 + 1, x1: a.x0 + 3, y0: a.y0 + 1, y1: a.y1 - 1 }, fixed(s) ? GOOD : BAD);   // a tab down each box's left edge
    if (v.phase === 'stuck') {                                                                // the spinner: a dark pixel going round a tiny ring
      const k = step(s) % 8, cx = p.x1 - 6, cy = Math.round((p.y0 + p.y1) / 2);
      const ring = [[1, -2], [2, -1], [2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2]];
      g.fillStyle = INK; g.fillRect(cx + ring[k][0], cy + ring[k][1], 1, 1); g.fillRect(cx + ring[(k + 1) % 8][0], cy + ring[(k + 1) % 8][1], 1, 1);
    }
    drawLine(g, m.lane, sales(s, Math.floor((m.lane.x1 - m.lane.x0 + 1) / 2)), fixed(s) ? GOOD : BAD, 2);
  },
  /** The header's words (the shop's name while browsing, else the bar's), the tag beside the picture (the product's name
   * and price, or the cart's line), one stat a box (each on its own timer; fixed: the kind ones). */
  text(s) {
    const m = s.cfg.close, pool = fixed(s) ? s.text.okPool : s.text.pool, k = s.reduced ? 0 : Math.floor(s.tAll / 2500), v = visit(s);
    const tagLine = browsing(v) ? s.text.products[PRODUCTS.indexOf(v.product)] : s.text.cart;
    const i = tagLine.indexOf(' / '), tag = i < 0 ? [tagLine] : [tagLine.slice(0, i), tagLine.slice(i + 3)];
    const boxes = m.small.map((area, i) => {
      const taps = s.nudges.filter((n) => n.box === i).length;
      return { id: `box${i}`, area, lines: [pool[(i * 2 + k + taps) % pool.length]], cls: 'page' };
    });
    const header = browsing(v)
      ? { id: 'progress', area: { x0: m.progress.x0 + 4, x1: m.progress.x1 - 4, y0: m.progress.y0, y1: m.progress.y1 }, lines: [s.text.shop], cls: 'page shop' }
      : { id: 'progress', area: { x0: m.progress.x0 + 4, x1: m.progress.x1 - 12, y0: m.progress.y0, y1: m.progress.y1 }, lines: [fixed(s) ? s.text.progressOk : s.text.progress], cls: 'page left' };
    return [header, ...boxes, { id: 'tag', area: m.tag, lines: tag, cls: 'page tag' }];
  },
  tone: (s) => (fixed(s) ? 'ok' : ''),
};
