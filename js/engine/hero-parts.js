// Hero sprite data — copied verbatim from tools/hero_gen.py (the normative reference, era-look size).
// Keep the two in step: tests/hero.test.js proves the renderer against the Python fixtures.

import { HC_MARK, HC_MARK_PIXELS } from './hc-mark.js';
export { HC_MARK, HC_MARK_PIXELS };          // the official logomark reduced by tools/hc_mark.py; never drawn here

export const OPTIONS = {
  body: ['masc', 'fem', 'nb'],
  skin: [0, 1, 2, 3],
  hair: ['black', 'brown', 'blonde', 'ginger', 'violet'],          // colour; the beard takes it too
  style: ['mohawk', 'standard', 'shoulder', 'long', 'fro'],           // mohawk = buzzed sides, short textured top
  beard: ['none', 'short', 'long'],
  hoodie: ['honey', 'ink', 'teal', 'indigo', 'lime'],
  jeans: ['indigo', 'black', 'light', 'grey', 'khaki'],
  glasses: ['none', 'glasses'],
};
export const CONFIG_KEYS = Object.keys(OPTIONS);
export const POSES = ['idle', 'walk1', 'walk2', 'walk3', 'walk4', 'situp'];   // situp: upright in bed, legs under the blanket
export const OUTFITS = ['hoodie', 'pj'];
export const PJ = { top: '#A9C4EC', stripe: '#7F9CC4', bottom: '#A9C4EC' };
export const SIT_DY = 40;                    // sitting up: the upper body sits this much lower
export const SIT_CUT = 78;                   // ...and the covers come to the waist: nothing below this figure row is drawn
// per-pose offsets applied to the idle masks: [legL_dx, legR_dx, shoeL_dx, shoeR_dx, bob_dy, armL_dy, armR_dy]
export const WALK = {
  idle: [0, 0, 0, 0, 0, 0, 0],
  walk1: [-2, 2, -4, 4, 0, 2, -2],
  walk2: [0, 0, 0, 0, 2, 0, 0],
  walk3: [2, -2, 4, -4, 0, -2, 2],
  walk4: [0, 0, 0, 0, 2, 0, 0],
};
export const PRESETS = {
  masc: { body: 'masc', skin: 0, hair: 'black', style: 'standard', beard: 'short', hoodie: 'ink', jeans: 'indigo', glasses: 'none' },
  fem: { body: 'fem', skin: 1, hair: 'brown', style: 'long', beard: 'none', hoodie: 'honey', jeans: 'black', glasses: 'glasses' },
  nb: { body: 'nb', skin: 0, hair: 'violet', style: 'mohawk', beard: 'none', hoodie: 'teal', jeans: 'grey', glasses: 'glasses' },
};

export const OUTLINE = '#1a1424';
export const SKIN = ['#E5B48E', '#C2865A', '#8F5B38', '#5A3826'];
export const HAIR = { black: '#262430', brown: '#5C3A1E', blonde: '#D9B85A', ginger: '#C0522A', violet: '#7B4FB8' };
export const HOODIE = { honey: '#E8A000', ink: '#2B3647', teal: '#1F8FD6', indigo: '#51368D', lime: '#5FA81A' };
export const JEANS = { indigo: '#34497E', black: '#23232A', light: '#7F9CC4', grey: '#5B5F66', khaki: '#B59B6A' };
export const SOLE = '#8A8A94';               // the shoes' pale sole, two rows at the floor
export const TOP = 4;                        // the figure is drawn this far down the canvas, so its soles sit on the last row
export const FLOOR = 143;                    // the lowest opaque row of a standing figure, both views (HERO_H - 1)
// The face, front on: the left edge of each eye's 4-px white; the two drawstring columns.
export const EYES = [19, 33];
export const DRAWSTRINGS = [24, 31];
// Where the mark's table is anchored: high on the chest, wearer's right of the drawstrings; on the profile, the chest's leading side.
export const HC_MARK_AT = [15, 47];
export const HC_MARK_SIDE_AT = [32, 47];

// torso spans, arm columns, leg columns, shoe columns (inclusive column ranges)
export const BODIES = {
  masc: { shoulder: [5, 50], armL: [4, 9], armR: [46, 51], torso: [10, 45], waist: [10, 45], hip: [10, 45], legL: [11, 25], legR: [30, 44], shoeL: [8, 25], shoeR: [30, 47], neck: [24, 31], headRx: 11.5 },
  fem: { shoulder: [7, 48], armL: [6, 9], armR: [46, 49], torso: [10, 45], waist: [12, 43], hip: [10, 45], legL: [12, 25], legR: [30, 43], shoeL: [10, 25], shoeR: [30, 45], neck: [24, 31], headRx: 11.0 },
  nb: { shoulder: [5, 50], armL: [4, 9], armR: [46, 51], torso: [10, 45], waist: [11, 44], hip: [10, 45], legL: [11, 25], legR: [30, 44], shoeL: [8, 25], shoeR: [30, 47], neck: [24, 31], headRx: 11.3 },
};

// ---- profile view (facing right; the game mirrors it for left) ----
// Copied verbatim from tools/hero_gen.py; tests/hero-side.test.js proves js/engine/hero-side.js
// against the Python fixtures in tests/fixtures/hero-side.
export const SIDE_POSES = ['stand', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8'];
// The walk, as joint angles in degrees from straight down (+ = forward). One leg's eight frames; the other leg
// and the arms use the same table half a cycle away. The front leg reaches out nearly straight and lands on the
// heel, the back leg trails with the knee bent and the heel lifting, the swinging leg folds at the knee as it
// passes, and each arm swings against its own leg with the elbow a little bent. The body dips on the two wide
// frames.                        thigh, shin
export const SIDE_LEG = [[26, 12], [16, 2], [2, -4], [-12, -22], [-22, -46], [-8, -62], [12, -48], [26, -10]];
export const SIDE_BOB = [3, 1, 0, 2, 3, 1, 0, 2];   // exactly what keeps the planted shoe on one floor row
export const THIGH = 22, SHIN = 22, UPPER = 20, FORE = 18;
export const LEG_W = 10, ARM_W = 8;
