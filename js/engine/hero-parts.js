// Hero sprite data — copied verbatim from tools/hero_gen.py (the normative reference).
// Keep the two in step: tests/hero.test.js proves the renderer against the Python fixtures.

export const OPTIONS = {
  body: ['masc', 'fem', 'nb'],
  skin: [0, 1, 2, 3],
  hair: ['black', 'brown', 'blonde', 'ginger', 'violet'],          // colour; the beard takes it too
  style: ['mohawk', 'standard', 'shoulder', 'long', 'fro'],           // mohawk = buzzed sides, short textured top
  beard: ['none', 'short', 'long'],
  hoodie: ['honey', 'ink', 'teal', 'indigo', 'lime'],
  jeans: ['indigo', 'black', 'light', 'grey', 'khaki'],
  glasses: ['none', 'glasses'],
  hold: ['laptop', 'coffee', 'phone', 'duck', 'pager'],
};
export const CONFIG_KEYS = Object.keys(OPTIONS);
export const POSES = ['idle', 'walk1', 'walk2', 'walk3', 'walk4', 'situp'];   // situp: upright in bed, legs under the blanket
export const OUTFITS = ['hoodie', 'pj'];
export const PJ = { top: '#A9C4EC', stripe: '#7F9CC4', bottom: '#A9C4EC' };
export const SIT_DY = 20;
// per-pose offsets applied to the idle masks: [legL_dx, legR_dx, shoeL_dx, shoeR_dx, bob_dy, armL_dy, armR_dy]
export const WALK = {
  idle: [0, 0, 0, 0, 0, 0, 0],
  walk1: [-1, 1, -2, 2, 0, 1, -1],
  walk2: [0, 0, 0, 0, 1, 0, 0],
  walk3: [1, -1, 2, -2, 0, -1, 1],
  walk4: [0, 0, 0, 0, 1, 0, 0],
};
export const PRESETS = {
  masc: { body: 'masc', skin: 0, hair: 'black', style: 'standard', beard: 'short', hoodie: 'ink', jeans: 'indigo', glasses: 'none', hold: 'laptop' },
  fem: { body: 'fem', skin: 1, hair: 'brown', style: 'long', beard: 'none', hoodie: 'honey', jeans: 'black', glasses: 'glasses', hold: 'coffee' },
  nb: { body: 'nb', skin: 0, hair: 'violet', style: 'mohawk', beard: 'none', hoodie: 'teal', jeans: 'grey', glasses: 'glasses', hold: 'phone' },
};

export const OUTLINE = '#1a1424';
export const SKIN = ['#E5B48E', '#C2865A', '#8F5B38', '#5A3826'];
export const HAIR = { black: '#262430', brown: '#5C3A1E', blonde: '#D9B85A', ginger: '#C0522A', violet: '#7B4FB8' };
export const HOODIE = { honey: '#E8A000', ink: '#2B3647', teal: '#1F8FD6', indigo: '#51368D', lime: '#5FA81A' };
export const JEANS = { indigo: '#34497E', black: '#23232A', light: '#7F9CC4', grey: '#5B5F66', khaki: '#B59B6A' };

// torso spans, arm columns, leg columns, shoe columns (inclusive column ranges)
export const BODIES = {
  masc: { shoulder: [6, 21], armL: [5, 7], armR: [20, 22], torso: [8, 19], waist: [8, 19], hip: [8, 19], legL: [8, 12], legR: [15, 19], shoeL: [6, 12], shoeR: [15, 21], neck: [12, 15], headRx: 5.6 },
  fem: { shoulder: [7, 20], armL: [6, 7], armR: [20, 21], torso: [8, 19], waist: [9, 18], hip: [8, 19], legL: [9, 12], legR: [15, 18], shoeL: [7, 12], shoeR: [15, 20], neck: [12, 15], headRx: 5.3 },
  nb: { shoulder: [6, 21], armL: [5, 7], armR: [20, 22], torso: [8, 19], waist: [9, 18], hip: [8, 19], legL: [8, 12], legR: [15, 19], shoeL: [6, 12], shoeR: [15, 21], neck: [12, 15], headRx: 5.5 },
};

// The Honeycomb logomark on the hoodie's chest: assets/hc_logomark.png taken down to 4x4 sprite pixels —
// the big blue hexagon top right, green beside it, orange at the left, honey below. Brand colours.
export const HC_MARK = { blue: '#0298EC', green: '#64BA00', orange: '#F96E10', honey: '#FFB000' };
export const HC_MARK_PIXELS = [[14, 32, 'blue'], [15, 32, 'blue'], [13, 33, 'green'], [14, 33, 'blue'], [15, 33, 'blue'],
  [12, 34, 'orange'], [13, 34, 'green'], [13, 35, 'honey']];
