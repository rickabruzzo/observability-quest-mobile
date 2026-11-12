// Rooms, the pure part. A room is data:
//   { paint(g), floorY, walk: [minX, maxX], start, hotspots: [{ id, rect: {x,y,w,h}, standX, look, use }] }
// x values for the hero are the sprite's left edge, as everywhere in the engine. `look` is a script key;
// `use` is a script key, or { tool: name } to open a tool screen. The screen (js/screens/chapter.js) does
// the drawing and the DOM.

import { HERO_W } from './hero.js';

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

export function clampWalk(room, x) {
  return Math.max(room.walk[0], Math.min(room.walk[1], Math.round(x)));
}

/** Where the hero goes for a floor tap at logical x: feet under the tap, inside the walk range. */
export function walkTarget(room, tapX) {
  return clampWalk(room, tapX - Math.floor(HERO_W / 2));
}

/** Hotspots in the shape js/engine/cursor.js's actionAt takes. */
export function cursorSpots(room) {
  return room.hotspots.map((h) => ({ ...h.rect, spot: h }));
}

/** Problems with a room's data, as sentences; [] when it is sound. `script` is the key → text map. */
export function checkRoom(room, script) {
  const out = [];
  if (!(room.walk[0] <= room.start && room.start <= room.walk[1])) out.push(`start ${room.start} outside the walk range`);
  for (const h of room.hotspots) {
    const r = h.rect;
    if (r.x < 0 || r.y < 0 || r.x + r.w > SCENE_W || r.y + r.h > SCENE_H) out.push(`${h.id}: rect outside the scene`);
    if (r.w < MIN_HIT || r.h < MIN_HIT) out.push(`${h.id}: rect too small (${r.w}x${r.h} < ${MIN_HIT})`);
    if (!(room.walk[0] <= h.standX && h.standX <= room.walk[1])) out.push(`${h.id}: standX ${h.standX} outside the walk range`);
    for (const k of [h.look, typeof h.use === 'string' ? h.use : null]) if (k && !script[k]) out.push(`${h.id}: no script slot ${k}`);
    if (!h.look) out.push(`${h.id}: no look line`);
  }
  return out;
}
