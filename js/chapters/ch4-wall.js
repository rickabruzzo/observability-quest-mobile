// Scenario 4's wall display: the wall of space (brief 14 D). Two fleets on the star map — ours in blue flying right for
// the gate, theirs in amber coming in from the right edge above and below it and crossing our lanes — bolts and
// missiles, ships that are hit going up in a boom and coming back in from their own edge, ours warping in at the
// gate. Behind them the far fleet, a hundred-odd dots drifting toward the gate. The story is the four of ours that
// hang just left of the gate and cannot get in: each jitters a pixel, flashes the warp's first frame now and then
// with the door not opening, and has a red tick blinking above it; the fix sends them in one after another. Under
// the map a flat green health line, both states (that is the joke), and a chat column where the pilots' lines
// scroll up: `lag` in nine languages, then, fixed, `o7`. In the room the chat is grey bars and the ships are the
// small ones. Everything is a function of the painter's state: `cast(s, area)` is the list the painter draws.
// Shape: see ch1-wall.js.

export const RECOVER_MS = 1500;
const STEP_MS = 100, CHAT_MS = 700, CHAT_LINES = 8;
const DOT = '#DCE8FF', STUCK = '#FF6A4A', GREEN = '#3CE070', BAR = '#4A5468';
export const FRAME_MS = 90;                               // a boom's or a warp's frame
const BOOM_MS = 4 * FRAME_MS, WARP_MS = 3 * FRAME_MS;
export const GATE_AT = 0.78;                              // of the map's width; half its height
const GONE_MS = 500, GAP_MS = 400;                        // after a boom, and after a warp or an exit, before the lane's next ship
const BOLT_SPEED = 110, BOLT_MS = 420, MISSILE_SPEED = 80, MISSILE_MS = 520;   // px/s and lifetime
const FLASH_EVERY = 1500, TICK_EVERY = 600;               // a stuck one flashes warp_1; its tick blinks
export const DOTS = 120;
export const MARK_AT = [16, 167], LINE_FROM = 38;         // Doggy Dashboards' mark under the map, close up; where the health line starts there

/** Every sprite's size, so the cast is data without the manifest. */
export const DIMS = {
  ship_a_small: [7, 5], ship_a_mid: [11, 7], ship_a_big: [19, 9], ship_b_small: [7, 5], ship_b_mid: [11, 7], ship_b_big: [19, 9],
  bolt: [5, 1], missile: [5, 3], boom: [11, 11], warp: [9, 9], gate: [23, 23], dot: [1, 1], tick: [3, 1],
};

/** Our lanes: where each ship flies (its lane as a share of the map's height, converging on the gate), how long the run
 * takes, its phase, how often it fires. Small ones the most common, one big one. */
export const OURS = [
  { size: 'big', lane: 0.50, travel: 9000, phase: 0, fire: 900 },
  { size: 'mid', lane: 0.18, travel: 6000, phase: 1300, fire: 700 },
  { size: 'mid', lane: 0.70, travel: 6400, phase: 3100, fire: 700 },
  { size: 'mid', lane: 0.36, travel: 5800, phase: 4700, fire: 700 },
  { size: 'small', lane: 0.08, travel: 4200, phase: 600, fire: 500 },
  { size: 'small', lane: 0.27, travel: 3800, phase: 2200, fire: 500 },
  { size: 'small', lane: 0.60, travel: 4600, phase: 3500, fire: 500 },
  { size: 'small', lane: 0.82, travel: 4000, phase: 1900, fire: 500 },
  { size: 'small', lane: 0.92, travel: 4400, phase: 2800, fire: 500 },
];
/** Theirs: in from the right edge at `from` (a share of the height), out at the left edge at `to`, crossing our lanes.
 * The one marked `always` is shot on every run: there is always something being shot at. */
export const THEIRS = [
  { size: 'big', from: 0.10, to: 0.62, travel: 8000, phase: 2000, fire: 1100 },
  { size: 'mid', from: 0.90, to: 0.30, travel: 5600, phase: 800, fire: 900 },
  { size: 'mid', from: 0.04, to: 0.80, travel: 5200, phase: 4300, fire: 900 },
  { size: 'small', from: 0.96, to: 0.45, travel: 2200, phase: 1500, fire: 650, always: true },
  { size: 'small', from: 0.14, to: 0.95, travel: 3600, phase: 3300, fire: 650 },
  { size: 'small', from: 0.84, to: 0.05, travel: 4400, phase: 200, fire: 650 },
];
/** The four that cannot get in: an arc just left of the gate (offsets from its centre), one mid and three small. */
export const STUCK_ONES = [
  { size: 'mid', dx: -30, dy: -18 }, { size: 'small', dx: -34, dy: -6 }, { size: 'small', dx: -34, dy: 8 }, { size: 'small', dx: -30, dy: 20 },
];

function hash(n) {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
const step = (s) => (s.reduced ? 0 : Math.floor(s.tAll / STEP_MS));
const fixed = (s) => s.state === 'fixed';
const time = (s) => (s.reduced ? 0 : s.tAll);

/** The gate's centre in a map area. */
export const gateAt = (a) => ({ x: a.x0 + Math.round((a.x1 - a.x0 + 1) * GATE_AT), y: Math.round((a.y0 + a.y1) / 2) });

/**
 * Where a lane is in its run at `t` ms: the runs follow one another, each either a clean run (flight, then `tail`
 * ms at the far end, then a gap) or one cut short by a hit (flight to the hit, the boom, then gone a moment).
 * `hitAt(c)` says where in run `c` the ship is hit (ms into the flight), or null.
 */
function runAt(t, travel, tail, hitAt) {
  let at = 0;
  for (let c = 0; c < 100000; c++) {
    const hit = hitAt(c);
    const len = hit !== null ? hit + BOOM_MS + GONE_MS : travel + tail + GAP_MS;
    if (t < at + len) return { c, tau: t - at, hit };
    at += len;
  }
  return { c: 0, tau: 0, hit: null };
}
/** One in three runs ends in a hit (the big ones one in five), on the left side of the map, well clear of the gate and
 * the stuck ones: ours between a quarter and six tenths of the way there, theirs after they have crossed past it. */
function hitRule(seed, travel, big, always, theirs) {
  const from = theirs ? 0.55 : 0.25;
  return (c) => {
    const h = hash(seed * 131 + c * 17 + 5);
    if (always) return Math.round(travel * 0.6);
    if (h % (big ? 5 : 3) !== 0) return null;
    return Math.round(travel * (from + ((h >>> 8) % 35) / 100));
  };
}

const lerp = (a, b, f) => a + (b - a) * f;
const dims = (name) => DIMS[name] ?? DIMS[name.replace(/_\d$/, '')];
/** An item's box, kept inside the area (a ship at the edge is still on the map). */
function clampItem(it, a) {
  const [w, h] = dims(it.sprite);
  it.x = Math.max(a.x0, Math.min(a.x1 - w + 1, Math.round(it.x)));
  it.y = Math.max(a.y0, Math.min(a.y1 - h + 1, Math.round(it.y)));
  return it;
}
/** A ship at `tau` into a flight, from its start to its end (centres), and the shots it has in the air. */
function flight({ sprite, fromX, fromY, toX, toY, curve, travel, fire, dir, shotSprite, shotSpeed, shotMs }, tau, until, flip, out, a) {
  const [w, h] = dims(sprite);
  const pos = (ms) => { const f = Math.min(1, ms / travel); return [lerp(fromX, toX, f), lerp(fromY, toY, curve ? f * f : f)]; };
  const [cx, cy] = pos(tau);
  out.push(clampItem({ sprite, x: cx - w / 2, y: cy - h / 2, flip, stuck: false }, a));
  if (!fire) return;
  for (let k = Math.floor(tau / fire); k >= 0 && k >= Math.floor((tau - shotMs) / fire); k--) {   // the shots fired in the last shotMs
    const e = k * fire + Math.round(fire * 0.4);
    if (e > until || e > tau) continue;
    const age = tau - e;
    if (age < 0 || age >= shotMs) continue;
    const [sx, sy] = pos(e), [sw, sh] = dims(shotSprite);
    const x = dir > 0 ? sx + w / 2 + 1 + (shotSpeed * age) / 1000 : sx - w / 2 - 1 - sw - (shotSpeed * age) / 1000;
    if (x < a.x0 || x + sw - 1 > a.x1) continue;
    out.push({ sprite: shotSprite, x: Math.round(x), y: Math.round(sy - sh / 2), flip, stuck: false });
  }
}
function boom(x, y, tau, out, a) {
  const n = Math.min(3, Math.floor(tau / FRAME_MS));
  out.push(clampItem({ sprite: `boom_${n + 1}`, x: x - 5, y: y - 5, flip: false, stuck: false }, a));     // the centre pixel on the ship's centre
}
function warp(x, y, tau, out, a) {
  const n = Math.min(2, Math.floor(tau / FRAME_MS));
  out.push(clampItem({ sprite: `warp_${n + 1}`, x: x - 4, y: y - 4, flip: false, stuck: false }, a));
}

/**
 * Everything on the map at this moment, in drawing order: the far fleet's dots, the gate, our ships and theirs with
 * their shots, booms and warps, the stuck ones (`stuck: true`) with their ticks. Each item is { sprite, x, y, flip,
 * stuck } with (x, y) its top-left; every box lies inside `area`. `small` (the room) makes every ship a small one.
 * The same state gives the same list. Reduced motion: a still with no shots or booms.
 */
export function cast(s, area, { small = false } = {}) {
  const a = area, W = a.x1 - a.x0 + 1, H = a.y1 - a.y0 + 1, g = gateAt(a), t = time(s), out = [];
  const size = (sz) => (small ? 'small' : sz);
  // the far fleet: dots drifting in toward the gate from the map's edges, each on its own ray and phase
  for (let j = 0; j < DOTS; j++) {
    const h = hash(j * 7 + 1), ang = ((h % 3600) / 3600) * Math.PI * 2, speed = 0.6 + ((h >>> 12) % 10) / 10;
    const c = Math.cos(ang), sn = Math.sin(ang);
    const kx = c > 0 ? (a.x1 - g.x) / c : c < 0 ? (a.x0 - g.x) / c : Infinity, ky = sn > 0 ? (a.y1 - g.y) / sn : sn < 0 ? (a.y0 - g.y) / sn : Infinity;
    const k = Math.min(kx, ky), r = 1 - (((step(s) * speed) / 240 + ((h >>> 4) % 100) / 100) % 1);
    out.push(clampItem({ sprite: 'dot', x: g.x + c * k * r, y: g.y + sn * k * r, flip: false, stuck: false }, a));
  }
  out.push({ sprite: 'gate', x: g.x - 11, y: g.y - 11, flip: false, stuck: false });
  // ours: left edge to the gate, converging on it; a clean run ends in a warp
  OURS.forEach((o, i) => {
    const sprite = `ship_a_${size(o.size)}`, [w, h] = dims(sprite);
    const run = runAt(t + o.phase, o.travel, WARP_MS, hitRule(i + 1, o.travel, o.size === 'big', false, false));
    const path = { sprite, fromX: a.x0 + w / 2, fromY: a.y0 + H * o.lane, toX: g.x, toY: g.y, curve: true, travel: o.travel, fire: s.reduced ? 0 : o.fire, dir: 1, shotSprite: 'bolt', shotSpeed: BOLT_SPEED, shotMs: BOLT_MS };
    if (run.hit !== null) {
      if (run.tau < run.hit) flight(path, run.tau, run.hit, false, out, a);
      else if (!s.reduced && run.tau < run.hit + BOOM_MS) { const f = run.hit / o.travel; boom(lerp(path.fromX, path.toX, f), lerp(path.fromY, path.toY, f * f), run.tau - run.hit, out, a); }
    } else if (run.tau < o.travel) flight(path, run.tau, o.travel, false, out, a);
    else if (!s.reduced && run.tau < o.travel + WARP_MS) warp(g.x, g.y, run.tau - o.travel, out, a);
  });
  // theirs: in from the right edge, across our lanes, out at the left; drawn flipped (every ship faces right)
  THEIRS.forEach((o, i) => {
    const sprite = `ship_b_${size(o.size)}`, [w, h] = dims(sprite);
    const run = runAt(t + o.phase, o.travel, 0, hitRule(i + 20, o.travel, o.size === 'big', !!o.always, true));
    const path = { sprite, fromX: a.x1 - w / 2, fromY: a.y0 + H * o.from, toX: a.x0 + w / 2, toY: a.y0 + H * o.to, curve: false, travel: o.travel, fire: s.reduced ? 0 : o.fire, dir: -1, shotSprite: 'missile', shotSpeed: MISSILE_SPEED, shotMs: MISSILE_MS };
    if (run.hit !== null) {
      if (run.tau < run.hit) flight(path, run.tau, run.hit, true, out, a);
      else if (!s.reduced && run.tau < run.hit + BOOM_MS) { const f = run.hit / o.travel; boom(lerp(path.fromX, path.toX, f), lerp(path.fromY, path.toY, f), run.tau - run.hit, out, a); }
    } else if (run.tau < o.travel) flight(path, run.tau, o.travel, true, out, a);
  });
  // the stuck ones: an arc just left of the gate, each jittering a pixel, flashing warp_1 with the door shut, a tick above;
  // the fix sends them in one after another over RECOVER_MS, each with the whole warp
  const each = RECOVER_MS / STUCK_ONES.length;
  STUCK_ONES.forEach((o, i) => {
    const sprite = `ship_a_${size(o.size)}`, [w, h] = dims(sprite);
    if (fixed(s)) {
      if (s.reduced) return;
      const at = i * each;
      if (s.t >= at + WARP_MS) return;
      if (s.t >= at) { warp(g.x, g.y, s.t - at, out, a); return; }
    }
    const k = step(s), jx = s.reduced ? 0 : hash(k * 7 + i * 3) % 2, jy = s.reduced ? 0 : hash(k * 11 + i * 5 + 1) % 2;
    const cx = g.x + o.dx + jx, cy = g.y + o.dy + jy;
    const flashing = !s.reduced && !fixed(s) && ((t + i * 370) % FLASH_EVERY) < FRAME_MS;
    out.push(clampItem(flashing ? { sprite: 'warp_1', x: cx - 4, y: cy - 4, flip: false, stuck: true } : { sprite, x: cx - w / 2, y: cy - h / 2, flip: false, stuck: true }, a));
    if (s.reduced || ((t + i * 200) % TICK_EVERY) < TICK_EVERY / 2) out.push(clampItem({ sprite: 'tick', x: cx - 1, y: cy - h / 2 - 3, flip: false, stuck: true }, a));
  });
  return out;
}

/** The chat lines showing now: the newest at the bottom, scrolling up one line every CHAT_MS. */
function chat(s, n) {
  const pool = fixed(s) ? s.text.okPool : s.text.pool, k = s.reduced ? pool.length : Math.floor(s.tAll / CHAT_MS) + s.nudges.length;
  const out = [];
  for (let j = n - 1; j >= 0; j--) out.push(pool[((k - j) % pool.length + pool.length) % pool.length]);
  return out;
}

/** Draws exactly the cast, clipped to the map's area: dots and ticks are the painter's own pixels, the rest sprites. */
function drawCast(g, s, area, list) {
  g.save(); g.beginPath(); g.rect(area.x0, area.y0, area.x1 - area.x0 + 1, area.y1 - area.y0 + 1); g.clip();
  for (const it of list) {
    if (it.sprite === 'dot') { g.fillStyle = DOT; g.fillRect(it.x, it.y, 1, 1); }
    else if (it.sprite === 'tick') { g.fillStyle = STUCK; g.fillRect(it.x, it.y, 3, 1); }
    else s.art?.draw(g, it.sprite, it.x, it.y, { flip: it.flip });
  }
  g.restore();
}

export const WALL = {
  image: (s) => s.cfg.image,
  frameKey: (s) => `${s.state}:${step(s)}:${s.reduced ? 0 : Math.floor(s.tAll / FRAME_MS)}:${s.nudges.length}:${fixed(s) ? Math.min(RECOVER_MS, Math.floor(s.t / FRAME_MS) * FRAME_MS) : 0}`,
  recovered: (s) => s.reduced || s.t >= RECOVER_MS,
  hits: (s) => [{ area: s.cfg.close.chat, box: 0 }],
  room(g, s) {
    const m = s.cfg.room;
    drawCast(g, s, m.map, cast(s, m.map, { small: true }));
    g.fillStyle = GREEN; g.fillRect(m.lane.x0, Math.round((m.lane.y0 + m.lane.y1) / 2), m.lane.x1 - m.lane.x0 + 1, 1);
    const c = m.chat, rows = Math.floor((c.y1 - c.y0) / 6), k = step(s) >> 3;        // grey bars: the chat, too small to read
    g.fillStyle = BAR;
    for (let i = 0; i < rows; i++) g.fillRect(c.x0 + 2, c.y0 + 2 + i * 6, Math.round((c.x1 - c.x0 - 4) * (0.4 + ((hash(i + k) % 60) / 100))), 3);
  },
  close(g, s) {
    const m = s.cfg.close;
    drawCast(g, s, m.map, cast(s, m.map));
    s.art?.draw(g, 'mark_doggy_dashboards', MARK_AT[0], MARK_AT[1]);                 // Doggy Dashboards' mark at the left end of the strip (brief 14 G)
    g.fillStyle = GREEN; const ly = Math.round((m.lane.y0 + m.lane.y1) / 2); g.fillRect(LINE_FROM, ly, m.lane.x1 - LINE_FROM + 1, 2);
  },
  /** The chat column: the lines scrolling up. */
  text(s) {
    return [{ id: 'chat', area: s.cfg.close.chat, lines: chat(s, CHAT_LINES), cls: 'chat' }];
  },
  tone: (s) => (fixed(s) ? 'ok' : ''),
};
