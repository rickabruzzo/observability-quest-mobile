// Character-creation state: pure functions over a hero config (see js/engine/hero-parts.js).

import { OPTIONS, PRESETS } from './engine/hero-parts.js';

export const NAME_MAX = 16;
export const DEFAULT_NAME = 'the Engineer';
export const FACE_ROWS = ['body', 'skin', 'hair', 'length', 'style', 'beard', 'beardCol'];
export const KIT_ROWS = ['hoodie', 'jeans', 'glasses', 'hold'];
export const LABELS = {
  body: 'Body', skin: 'Skin', hair: 'Hair', length: 'Length', style: 'Style', beard: 'Beard', beardCol: 'Beard col.',
  hoodie: 'Hoodie', jeans: 'Jeans', glasses: 'Glasses', hold: 'Holding',
};
export const BODY_LABELS = { masc: 'Masc', fem: 'Fem', nb: 'Enby' };

export function defaultHero() {
  return { ...PRESETS.masc, name: '' };
}

/** A preset replaces the whole appearance and keeps the name. */
export function applyPreset(hero, body) {
  if (!PRESETS[body]) return hero;
  return { ...PRESETS[body], name: hero.name ?? '' };
}

function coerce(key, value) {
  const list = OPTIONS[key];
  if (!list) return undefined;
  const v = typeof list[0] === 'number' ? Number(value) : value;
  return list.includes(v) ? v : undefined;
}

/** Sets one option; unknown key or value returns the same object. Hair drags beard colour until it is picked on its own. */
export function pick(hero, key, value) {
  if (key === 'body') return applyPreset(hero, value);
  const v = coerce(key, value);
  if (v === undefined) return hero;
  const next = { ...hero, [key]: v };
  if (key === 'hair' && hero.beardCol === hero.hair) next.beardCol = v;
  return next;
}

export function randomHero(rng = Math.random) {
  const roll = (list) => list[Math.floor(rng() * list.length)];
  const h = { name: '' };
  for (const [k, list] of Object.entries(OPTIONS)) h[k] = roll(list);
  h.beardCol = h.hair;
  return h;
}

/** Strips control characters, trims, clamps to NAME_MAX code points, trims again. Non-strings → ''. */
export function cleanName(s) {
  if (typeof s !== 'string') return '';
  const stripped = s.replace(/\p{C}/gu, '').trim();
  return [...stripped].slice(0, NAME_MAX).join('').trim();
}

/** Accepts an object or a JSON string; anything unusable becomes the default. */
export function sanitizeHero(input) {
  let obj = input;
  if (typeof input === 'string') { try { obj = JSON.parse(input); } catch { obj = null; } }
  if (!obj || typeof obj !== 'object') return defaultHero();
  const base = defaultHero();
  const out = {};
  for (const key of Object.keys(OPTIONS)) {
    const v = coerce(key, obj[key]);
    out[key] = v === undefined ? base[key] : v;
  }
  out.name = cleanName(obj.name);
  return out;
}

export function displayName(hero) {
  return (hero && hero.name) || DEFAULT_NAME;
}
