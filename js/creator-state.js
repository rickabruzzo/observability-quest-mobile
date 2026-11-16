// Character-creation state: pure functions over a hero config (see js/engine/hero-parts.js).

import { OPTIONS, DEFAULT_HERO, MIGRATE } from './engine/hero-parts.js';

export const NAME_MAX = 16;
export const DEFAULT_NAME = 'the Engineer';
export const FACE_ROWS = ['skin', 'hair', 'style', 'beard'];
export const KIT_ROWS = ['hoodie', 'jeans', 'glasses'];
export const LABELS = {
  skin: 'Skin', hair: 'Hair col.', style: 'Hair', beard: 'Beard',
  hoodie: 'Hoodie', jeans: 'Jeans', glasses: 'Glasses',
};

export function defaultHero() {
  return { ...DEFAULT_HERO, name: '' };
}

function coerce(key, value) {
  const list = OPTIONS[key];
  if (!list) return undefined;
  const v = typeof list[0] === 'number' ? Number(value) : value;
  return list.includes(v) ? v : undefined;
}

/** Sets one option; unknown key or value returns the same object. */
export function pick(hero, key, value) {
  const v = coerce(key, value);
  if (v === undefined) return hero;
  return { ...hero, [key]: v };
}

export function randomHero(rng = Math.random) {
  const roll = (list) => list[Math.floor(rng() * list.length)];
  const h = { name: '' };
  for (const [k, list] of Object.entries(OPTIONS)) h[k] = roll(list);
  return h;
}

/** Strips control characters, trims, clamps to NAME_MAX code points, trims again. Non-strings → ''. */
export function cleanName(s) {
  if (typeof s !== 'string') return '';
  const stripped = s.replace(/\p{C}/gu, '').trim();
  return [...stripped].slice(0, NAME_MAX).join('').trim();
}

/** Accepts an object or a JSON string; anything unusable becomes the default. A hero saved before the painted hero
 * still loads (brief 15 E): a `shoulder` style is `long`, a `long` beard is `short`, and `body` is ignored. */
export function sanitizeHero(input) {
  let obj = input;
  if (typeof input === 'string') { try { obj = JSON.parse(input); } catch { obj = null; } }
  if (!obj || typeof obj !== 'object') return defaultHero();
  const base = defaultHero();
  const out = {};
  for (const key of Object.keys(OPTIONS)) {
    const raw = MIGRATE[key]?.[obj[key]] ?? obj[key];
    const v = coerce(key, raw);
    out[key] = v === undefined ? base[key] : v;
  }
  out.name = cleanName(obj.name);
  return out;
}

export function displayName(hero) {
  return (hero && hero.name) || DEFAULT_NAME;
}
