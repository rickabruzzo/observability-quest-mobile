// The intro as data: nine shots, each a still (or two stills it cuts between). Limited animation, as on a
// 1990 PC: nothing tweens, the picture is replaced whole. Pure — the screen module does the drawing.
import { flashOn } from './pager.js';
import { SIDE_POSES } from '../engine/hero-side.js';
import { STRIDE_PX } from '../engine/walk.js';

export const FLASH_MS = 500;                          // one on/off cycle; 2Hz is the ceiling for anything that flashes
const CTO = 'Backend is down. Front end is down. Database is down. Get in here! -CTO';

export const SHOTS = [
  { id: 'dark', ms: 3000, image: 'A_room_dark', flash: 'black', beepOnFlash: true },
  { id: 'help', ms: 2500, image: 'B_nightstand', lcd: 'flash', text: 'Help!', beepOnFlash: true },
  { id: 'asleep', ms: 3000, image: 'C_face_asleep', alt: 'C_eye_crack', altAt: 1800 },
  { id: 'arm', ms: 1500, image: 'B_arm' },
  { id: 'lit', ms: 2000, image: 'C_awake', alt: 'C_awake_lit', flash: 'alt' },
  { id: 'message', ms: 5000, image: 'B_nightstand', lcd: 'marquee', text: CTO },
  { id: 'misery', ms: 2000, image: 'C_misery' },
  { id: 'wide', ms: 1400, image: 'A_room_dark', title: 'dim' },                       // back to the wide dark room, steady in the pager's glow…
  { id: 'bedroom', ms: 15000, image: 'D_bedroom_vga', hero: true, clickAt: 0, heroScale: 0.85 },   // …click: the light is on, and this is the room.
  // heroScale: the 136-px hero would overtop his own 132-px door, so the bedroom draws him at 0.85 (brief 09).
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
// The whole exit is the profile view — there is no back view, so the few steps up to the threshold are
// walked side on too, and the hero stays side on at the door rather than turning to face the player for
// one beat before vanishing. The frame comes from distance travelled, the same rule the room walk uses.
const AMBLE = 100, AMBLE_UP = 66;                     // px/s: a sleepy walk — about a step and a half a second on the 76-px stride at 0.85
const DOOR_OPEN_MS = 350, DOOR_GONE_MS = 300, DOOR_SHUT_MS = 400;
const STEP = SIDE_POSES.slice(1);                     // w1..w8
const PER_FRAME_PX = STRIDE_PX / STEP.length;
// The frame for a distance walked, in the hero's own pixels: a hero drawn at heroScale covers heroScale × STRIDE_PX scene px per cycle.
const frameAfter = (px, heroScale = 1) => STEP[Math.floor(Math.abs(px) / heroScale / PER_FRAME_PX) % STEP.length];

export function exitPlan({ standX, doorX, floorY, doorY = floorY, heroScale = 1 }) {
  const across = Math.round((Math.abs(doorX - standX) / AMBLE) * 1000);
  const up = Math.round((Math.abs(floorY - doorY) / AMBLE_UP) * 1000);
  return { standX, doorX, floorY, doorY, heroScale, across, up, open: DOOR_OPEN_MS, gone: DOOR_GONE_MS, shut: DOOR_SHUT_MS, total: across + up + DOOR_OPEN_MS + DOOR_GONE_MS + DOOR_SHUT_MS };
}

/** Where the hero is tMs into the plan. x is the sprite's left edge, y the row the feet stand on. */
export function exitAt(p, tMs) {
  const t = Math.max(0, tMs), flip = p.doorX < p.standX;
  const at = (x, y, pose, visible, doorOpen, done = false) => ({ x, y, pose, view: 'side', flip, visible, doorOpen, done });
  if (t < p.across) {
    const x = Math.round(p.standX + (p.doorX - p.standX) * (t / p.across));
    return at(x, p.floorY, frameAfter(x - p.standX, p.heroScale), true, false);
  }
  let u = t - p.across;
  const acrossPx = Math.abs(p.doorX - p.standX);
  if (u < p.up) {
    const y = Math.round(p.floorY + (p.doorY - p.floorY) * (u / p.up));
    return at(p.doorX, y, frameAfter(acrossPx + Math.abs(y - p.floorY), p.heroScale), true, false);   // the cycle carries on up
  }
  u -= p.up;
  if (u < p.open) return at(p.doorX, p.doorY, 'stand', true, true);
  if (u < p.open + p.gone) return at(p.doorX, p.doorY, 'stand', false, true);
  return at(p.doorX, p.doorY, 'stand', false, false, t >= p.total);
}
