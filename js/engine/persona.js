// The persona card (Warp brief 07), the pure part: the stats, the picture, the options a conversation ends in.
// The card's DOM is js/screens/chapter.js; whether it opens is the scenario's (firstTalk in scenario.js).

/** The script's option slots that every conversation with the persona may end in. */
export const OPTION_KEYS = { show: 'persona.show', leave: 'persona.leave' };

/** `Name number · Name number · …` → [[name, number], …]. A part with no number keeps its text and an empty number. */
export function parseStats(text) {
  return String(text).split(/\s*·\s*/).filter(Boolean).map((s) => {
    const m = s.match(/^(.*?)\s+(\d+)$/);
    return m ? [m[1], m[2]] : [s, ''];
  });
}

/**
 * What the card's picture is: the card art when the chapter names one and it exists, else the persona cropped
 * from the room plate ({ image, x, y, w, h } in the 320×200 scene). The card is never empty.
 */
export function cardPicture(persona, hasArt) {
  if (persona.art && hasArt) return { kind: 'art', src: persona.art };
  return { kind: 'crop', ...persona.crop };
}

/**
 * The options the persona's conversation ends in: before a tool has been tried, show the card again or leave;
 * after, the decision (the wrong instinct, Honeycomb) and the card again. Showing the card is never a wrong choice.
 */
export function personaOptions(s) {
  return s.tried ? ['sign', 'hc', 'show'] : ['show', 'leave'];
}

// ---- the persona in the room (brief 08): which frame over the plate ----

/** One talk frame: plate (or the rest frame), talk 1, plate, talk 2. */
export const TALK_MS = 320;
const IDLE_GAP = [4000, 10000], IDLE_HOLD = [600, 1000];   // between idle frames, and how long one shows

/** A cheap integer hash: deterministic noise from a number. */
function hash(n) {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}

/**
 * The persona's frame at `t` ms: a frame name from the room's manifest, or null for the plate.
 * frames: { talk: [a, b], rest: name|null, idle?: [names], win?: name }. `talking`: their own line is on screen;
 * `loop: 'always'` keeps them talking unless `quiet` (scenario 1's CTO, on a call); `won`: the win frame holds;
 * reduced motion rests (and shows the win frame, a still).
 */
export function personaFrame({ t, talking = false, quiet = false, won = false, reduced = false, loop = 'speak', frames, seed = 1 }) {
  const rest = frames.rest ?? null;
  if (won && frames.win) return frames.win;
  if (reduced) return rest;
  const speaking = loop === 'always' ? !quiet : talking;
  if (speaking) return [rest, frames.talk[0], rest, frames.talk[1]][Math.floor(Math.max(0, t) / TALK_MS) % 4];
  const idle = frames.idle || [];
  if (!idle.length) return rest;
  let at = 0;
  for (let n = 0; n < 100000; n++) {
    const gap = IDLE_GAP[0] + (hash(n * 3 + seed * 7) % (IDLE_GAP[1] - IDLE_GAP[0] + 1));
    const hold = IDLE_HOLD[0] + (hash(n * 5 + seed * 11) % (IDLE_HOLD[1] - IDLE_HOLD[0] + 1));
    if (t < at + gap) return rest;
    if (t < at + gap + hold) return idle[hash(n * 13 + seed) % idle.length];
    at += gap + hold;
  }
  return rest;
}

// ---- the card's picture moves a little (brief 08) ----

export const CARD_FRAME_MS = 180;

/** The card's extra frame at `t`: card → 1 → 2 → 3 → 2 → 1 and round again; null is the card itself. */
export function cardFrameAt(t, frames, reduced = false) {
  if (reduced || !frames || !frames.length) return null;
  const cycle = [null, ...frames, ...frames.slice(0, -1).reverse()];
  return cycle[Math.floor(Math.max(0, t) / CARD_FRAME_MS) % cycle.length];
}

export const PHONE_STEP_MS = 120;

/**
 * Knight Watch's phone: notifications scrolling up a w×h screen, 1 px rows every other pixel, moving up 1 px every
 * PHONE_STEP_MS. Returns [{ y, w }] in screen px (each row: a dark bar w wide with a red dot at its left end).
 */
export function phoneRows(t, { w, h }, reduced = false) {
  const offset = reduced ? 0 : Math.floor(Math.max(0, t) / PHONE_STEP_MS);
  const rows = [];
  for (let y = 0; y < h; y++) {
    const k = y + offset;
    if (k % 2) continue;
    rows.push({ y, w: 2 + (hash(k >> 1) % Math.max(1, w - 1)) });
  }
  return rows;
}
