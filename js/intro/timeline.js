// The intro as data: nine shots, each a still (or two stills it cuts between). Limited animation, as on a
// 1990 PC: nothing tweens, the picture is replaced whole. Pure — the screen module does the drawing.
import { flashOn } from './pager.js';

export const FLASH_MS = 500;                          // one on/off cycle; 2Hz is the ceiling for anything that flashes
const CTO = 'Backend is down. Front end is down. Database is down. Get in here! -CTO';

export const SHOTS = [
  { id: 'dark', ms: 3000, image: 'A_room_dark', flash: 'black', beepOnFlash: true },
  { id: 'help', ms: 2500, image: 'B_nightstand', lcd: 'flash', text: 'Help!', beepOnFlash: true },
  { id: 'asleep', ms: 3000, image: 'C_face_asleep', alt: 'C_eye_crack', altAt: 1800 },
  { id: 'arm', ms: 1500, image: 'B_arm' },
  { id: 'lit', ms: 2000, image: 'C_awake', alt: 'C_awake_lit', flash: 'alt' },
  { id: 'message', ms: 10000, image: 'B_nightstand', lcd: 'marquee', text: CTO },
  { id: 'misery', ms: 2000, image: 'C_misery' },
  { id: 'wide', ms: 1400, image: 'A_room_dark', title: 'dim' },                       // back to the wide dark room, steady in the pager's glow…
  { id: 'bedroom', ms: 15000, image: 'D_bedroom_vga', hero: true, clickAt: 0 },   // …click: the light is on, and this is the room
];
export const TOTAL_MS = SHOTS.reduce((n, s) => n + s.ms, 0);

export function nextShot(i) { return i + 1 < SHOTS.length ? i + 1 : null; }

/** Which whole picture is on screen at tMs into shot i. */
export function frameAt(shotIndex, tMs, { reduced = false } = {}) {
  const s = SHOTS[Math.min(SHOTS.length - 1, Math.max(0, shotIndex | 0))];
  const on = reduced || flashOn(tMs, FLASH_MS);
  let image = s.image, black = false;
  if (s.flash === 'black') black = !on;
  if (s.flash === 'alt' && !reduced && on) image = s.alt;
  if (s.altAt != null && (tMs >= s.altAt || (reduced && s.clickAt != null))) image = s.alt;   // reduced: the lamp is simply on
  const lcd = s.lcd ? { text: s.text, mode: reduced ? 'static' : s.lcd, on: s.lcd === 'flash' ? on : true } : null;
  return { image, black, lcd };
}

// Shot 9: the hero is sitting up in bed as the light comes on; the title comes up on the wall; they get up,
// flash into day clothes, take the laptop and walk out.
export const HERO_STEPS = [
  { at: 0, pose: 'situp', outfit: 'pj', do: 'title' },   // the light comes on: the title is on the wall, the hero sitting up in bed
  { at: 3900, do: 'rustle' },                        // the covers go back
  { at: 4600, pose: 'idle', outfit: 'pj', stand: true },
  { at: 5400, flash: true },
  { at: 5560, pose: 'idle', outfit: 'hoodie' },      // the clothes are off the floor and on the hero
  { at: 6700, take: true },                          // a beat later the laptop on the dresser is the hero's
  { at: 7400, walkTo: 'door' },
];

export function heroAt(tMs) {
  const h = { visible: false, pose: 'situp', outfit: 'pj', flash: false, titled: false, walking: false, standing: false, holding: false, stirring: false };
  for (const s of HERO_STEPS) {
    if (tMs < s.at) break;
    if (s.do === 'title') h.titled = true;
    if (s.do === 'rustle') h.stirring = true;
    if (s.pose) { h.visible = true; h.pose = s.pose; h.outfit = s.outfit; h.flash = false; }
    if (s.stand) h.standing = true;
    if (s.flash) h.flash = true;
    if (s.take) h.holding = true;
    if (s.walkTo) h.walking = true;
  }
  return h;
}

// ---- the way out of the bedroom: across the floor to the door, up to its threshold, through it ----
// Still limited animation: the door is two stills (shut, open), the hero is there and then is not.
const AMBLE = 60, AMBLE_UP = 40;                      // px/s: a sleepy walk
const DOOR_OPEN_MS = 350, DOOR_GONE_MS = 300, DOOR_SHUT_MS = 400;
const STEP = ['walk1', 'walk2', 'walk3', 'walk4'];

export function exitPlan({ standX, doorX, floorY, doorY = floorY }) {
  const across = Math.round((Math.abs(doorX - standX) / AMBLE) * 1000);
  const up = Math.round((Math.abs(floorY - doorY) / AMBLE_UP) * 1000);
  return { standX, doorX, floorY, doorY, across, up, open: DOOR_OPEN_MS, gone: DOOR_GONE_MS, shut: DOOR_SHUT_MS, total: across + up + DOOR_OPEN_MS + DOOR_GONE_MS + DOOR_SHUT_MS };
}

/** Where the hero is tMs into the plan. x is the sprite's left edge, y the row the feet stand on. */
export function exitAt(p, tMs) {
  const t = Math.max(0, tMs), flip = p.doorX < p.standX, step = STEP[Math.floor(t / 170) % 4];
  const at = (x, y, pose, visible, doorOpen, done = false) => ({ x, y, pose, flip, visible, doorOpen, done });
  if (t < p.across) return at(Math.round(p.standX + (p.doorX - p.standX) * (t / p.across)), p.floorY, step, true, false);
  let u = t - p.across;
  if (u < p.up) return at(p.doorX, Math.round(p.floorY + (p.doorY - p.floorY) * (u / p.up)), step, true, false);
  u -= p.up;
  if (u < p.open) return at(p.doorX, p.doorY, 'idle', true, true);
  if (u < p.open + p.gone) return at(p.doorX, p.doorY, 'idle', false, true);
  return at(p.doorX, p.doorY, 'idle', false, false, t >= p.total);
}
