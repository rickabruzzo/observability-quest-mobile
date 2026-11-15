// Rooms, the pure part. A room is data:
//   { image, floor: [[x, y], …], horizonY?, anchors: [{ y, h }, …], fronts: [{ poly, baseY }], start: { x, y },
//     hotspots: [{ id, rect: {x,y,w,h}, stand: { x, y }, walk, look, use }] }
// The floor is a polygon in scene pixels of where the hero's feet may be (bare floor only). His scale is linear
// in his feet's y and zero at the horizon line: one anchor (the figure's height h with his feet on line y) plus
// horizonY, or two anchors, which fix the horizon themselves (Warp brief 11). `fronts` are pieces of the plate he
// can stand behind: a piece is redrawn over him when his feet are above its base line. A hero position is his
// feet's centre point. `look` is a script key; `use` is a script key, { tool: name } to open a tool screen,
// { scene: name } to open a close-up, or { action: name } for the chapter's own logic. `walk: false` acts at once
// from where the hero stands (no stand point needed). The screen (js/screens/chapter.js) does the drawing and the DOM.

import { HERO_H } from './hero.js';

export const SCENE_W = 320, SCENE_H = 200;
export const MIN_HIT = 28;    // logical px: 48 CSS px on a 667x375 phone (scale ~1.73), the spec's padded hit rect

/** The hotspot under logical (x, y); the one listed last wins where two overlap (it is drawn on top). */
export function hotspotAt(room, x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  for (let i = room.hotspots.length - 1; i >= 0; i--) {
    const h = room.hotspots[i], r = h.rect;
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return h;
  }
  return null;
}

/** Hotspots in the shape js/engine/cursor.js's actionAt takes. */
export function cursorSpots(room) {
  return room.hotspots.map((h) => ({ ...h.rect, spot: h }));
}

// ---- depth: his scale from his feet's y ----

/** Where the horizon is: given, or fixed by two anchors. */
export function horizonOf(room) {
  const a = room.anchors || [];
  if (a.length >= 2) {
    const [p, q] = a, k = (p.h - q.h) / (p.y - q.y);          // px of height per px of y
    return p.y - p.h / k;
  }
  return room.horizonY ?? 40;
}

/** The figure's height in scene px when his feet are on line y. */
export function heroHeightAt(room, y) {
  const H = horizonOf(room), a = (room.anchors || [])[0];
  if (!a || a.y === H) return HERO_H;
  return Math.max(0, (a.h * (y - H)) / (a.y - H));
}

/** The sprite's scale (1 is the 136-px figure on the 144-px canvas) with his feet on line y. */
export function heroScaleAt(room, y) {
  return heroHeightAt(room, y) / HERO_H;
}

// ---- the floor polygon ----

const EPS = 1e-6;

/** Whether p is inside the polygon, its edges included. */
export function insidePoly(poly, p) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (distToSegment(p, poly[i], poly[j]) < 1e-6) return true;                     // on an edge
    if ((yi > p.y) !== (yj > p.y) && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export const insideFloor = (room, p) => insidePoly(room.floor, p);

function closestOnSegment(p, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.y - ay) * dy) / len2)) : 0;
  return { x: ax + dx * t, y: ay + dy * t };
}
function distToSegment(p, a, b) { const c = closestOnSegment(p, a, b); return Math.hypot(p.x - c.x, p.y - c.y); }

/** The nearest point of the floor to p (p itself when it is on the floor), in whole pixels. */
export function nearestFloorPoint(room, p) {
  if (insideFloor(room, p)) return { x: Math.round(p.x), y: Math.round(p.y) };
  let best = null, bd = Infinity;
  const poly = room.floor;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const c = closestOnSegment(p, poly[j], poly[i]), d = Math.hypot(p.x - c.x, p.y - c.y);
    if (d < bd) { bd = d; best = c; }
  }
  // round, then nudge onto the floor if rounding took it off (a corner can round outwards)
  const r = { x: Math.round(best.x), y: Math.round(best.y) };
  if (insideFloor(room, r)) return r;
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) { const q = { x: r.x + dx, y: r.y + dy }; if (insideFloor(room, q)) return q; }
  return r;
}

/** Whether the whole segment a→b stays on the floor (sampled every pixel). */
export function segmentOnFloor(room, a, b) {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)));
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    if (!insideFloor(room, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })) return false;
  }
  return true;
}

/**
 * The way from a to b across the floor: a straight line when it stays on the floor, else the shortest route
 * through the floor's corners (a visibility graph over the polygon's vertices, Dijkstra by hand). Both ends
 * are first brought onto the floor. Returns the points to walk through, a and b included.
 */
export function planPath(room, a, b) {
  const from = nearestFloorPoint(room, a), to = nearestFloorPoint(room, b);
  if (from.x === to.x && from.y === to.y) return [from];
  if (segmentOnFloor(room, from, to)) return [from, to];
  // corners, pulled a hair inward so a path along an edge is still "on the floor"
  const nodes = [from, to, ...room.floor.map(([x, y]) => inwardCorner(room, x, y))];
  const n = nodes.length, dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false);
  const see = (i, j) => segmentOnFloor(room, nodes[i], nodes[j]);
  dist[0] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] === Infinity || u === 1) break;
    done[u] = true;
    for (let v = 0; v < n; v++) {
      if (done[v] || !see(u, v)) continue;
      const d = dist[u] + Math.hypot(nodes[v].x - nodes[u].x, nodes[v].y - nodes[u].y);
      if (d < dist[v]) { dist[v] = d; prev[v] = u; }
    }
  }
  if (dist[1] === Infinity) return [from, to];                                       // no route through the corners: cut across
  const out = [];
  for (let v = 1; v >= 0; v = prev[v]) { out.unshift(nodes[v]); if (v === 0) break; }
  return out;
}

/** A corner moved one pixel toward the floor's inside, so walking by it stays on the floor. */
function inwardCorner(room, x, y) {
  for (const [dx, dy] of [[0, 0], [1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const p = { x: x + dx, y: y + dy };
    if (insideFloor(room, p) && (dx || dy || true)) { if (dx === 0 && dy === 0) continue; return p; }
  }
  return { x, y };
}

/** The fronts that cover a hero whose feet are on line y: those whose base line is nearer than his feet. */
export function frontsOver(room, y) {
  return (room.fronts || []).filter((f) => y < f.baseY);
}

/** Problems with a room's data, as sentences; [] when it is sound. `script` is the key → text map. */
export function checkRoom(room, script) {
  const out = [];
  if (!Array.isArray(room.floor) || room.floor.length < 3) out.push('no floor polygon');
  if (!(room.anchors || []).length) out.push('no scale anchor');
  if (!room.start || !insideFloor(room, room.start)) out.push(`start ${JSON.stringify(room.start)} is not on the floor`);
  for (const h of room.hotspots) {
    const r = h.rect;
    if (r.x < 0 || r.y < 0 || r.x + r.w > SCENE_W || r.y + r.h > SCENE_H) out.push(`${h.id}: rect outside the scene`);
    if (r.w < MIN_HIT || r.h < MIN_HIT) out.push(`${h.id}: rect too small (${r.w}x${r.h} < ${MIN_HIT})`);
    if (h.walk !== false && !(h.stand && insideFloor(room, h.stand))) out.push(`${h.id}: stand ${JSON.stringify(h.stand)} is not on the floor`);
    for (const k of [h.look, typeof h.use === 'string' ? h.use : null]) if (k && !script[k]) out.push(`${h.id}: no script slot ${k}`);
    if (!h.look) out.push(`${h.id}: no look line`);
  }
  return out;
}
