// The intro as data: nine shots, each a still (or two stills it cuts between). Limited animation, as on a
// 1990 PC: nothing tweens, the picture is replaced whole. Pure — the screen module does the drawing.
import { flashOn } from './pager.js';

export const FLASH_MS = 500;                          // one on/off cycle; 2Hz is the ceiling for anything that flashes
const CTO = 'Backend is down. Website is down. Database is down. Get in here! -CTO';

export const SHOTS = [
  { id: 'dark', ms: 3000, image: 'A_room_dark', flash: 'black', beepOnFlash: true },
  { id: 'help', ms: 2500, image: 'B_nightstand', lcd: 'flash', text: 'Help!', beepOnFlash: true },
  { id: 'asleep', ms: 3000, image: 'C_face_asleep', alt: 'C_eye_crack', altAt: 1800 },
  { id: 'arm', ms: 1500, image: 'B_arm' },
  { id: 'lit', ms: 2000, image: 'C_awake', alt: 'C_awake_lit', flash: 'alt' },
  { id: 'message', ms: 5000, image: 'B_nightstand', lcd: 'marquee', text: CTO },
  { id: 'misery', ms: 2000, image: 'C_misery' },
  { id: 'lamp', ms: 1500, image: 'B_lamp', alt: 'B_lamp_lit', altAt: 700, clickAt: 700 },
  { id: 'bedroom', ms: 8000, image: 'D_bedroom_vga', hero: true },
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

// Shot 9: the title comes up on the wall, the hero sits up, stands, flashes into day clothes and walks out.
export const HERO_STEPS = [
  { at: 600, do: 'title' },
  { at: 1600, pose: 'situp', outfit: 'pj' },
  { at: 2800, pose: 'idle', outfit: 'pj', stand: true },
  { at: 3600, flash: true },
  { at: 3760, pose: 'idle', outfit: 'hoodie' },
  { at: 4400, walkTo: 'door' },
];

export function heroAt(tMs) {
  const h = { visible: false, pose: 'situp', outfit: 'pj', flash: false, titled: false, walking: false, standing: false };
  for (const s of HERO_STEPS) {
    if (tMs < s.at) break;
    if (s.do === 'title') h.titled = true;
    if (s.pose) { h.visible = true; h.pose = s.pose; h.outfit = s.outfit; h.flash = false; }
    if (s.stand) h.standing = true;
    if (s.flash) h.flash = true;
    if (s.walkTo) h.walking = true;
  }
  return h;
}
