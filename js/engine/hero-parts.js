// Hero sprite data — copied verbatim from tools/hero_gen.py (the normative reference).
// Keep the two in step: tests/hero.test.js proves the renderer against the Python fixtures.

export const OPTIONS = {
  body: ['masc', 'fem', 'nb'],
  skin: [0, 1, 2, 3, 4],
  hair: ['black', 'brown', 'blonde', 'ginger', 'violet'],
  length: ['buzz', 'short', 'medium', 'long'],
  style: ['straight', 'curly', 'spiky', 'locs', 'undercut'],
  beard: ['none', 'stubble', 'goatee', 'full', 'big'],
  beardCol: ['black', 'brown', 'blonde', 'ginger', 'violet'],
  hoodie: ['honey', 'ink', 'teal', 'indigo', 'lime'],
  jeans: ['indigo', 'black', 'light', 'grey', 'khaki'],
  glasses: ['none', 'round', 'square', 'thick'],
  hold: ['laptop', 'coffee', 'phone', 'duck', 'pager'],
};
export const CONFIG_KEYS = Object.keys(OPTIONS);
export const POSES = ['idle', 'walk1', 'walk2', 'walk3', 'walk4'];
// per-pose offsets applied to the idle masks: [legL_dx, legR_dx, shoeL_dx, shoeR_dx, bob_dy, armL_dy, armR_dy]
export const WALK = {
  idle: [0, 0, 0, 0, 0, 0, 0],
  walk1: [-1, 1, -2, 2, 0, 1, -1],
  walk2: [0, 0, 0, 0, 1, 0, 0],
  walk3: [1, -1, 2, -2, 0, -1, 1],
  walk4: [0, 0, 0, 0, 1, 0, 0],
};
export const PRESETS = {
  masc: { body: 'masc', skin: 1, hair: 'black', length: 'short', style: 'straight', beard: 'stubble', beardCol: 'black', hoodie: 'ink', jeans: 'indigo', glasses: 'none', hold: 'laptop' },
  fem: { body: 'fem', skin: 2, hair: 'brown', length: 'long', style: 'straight', beard: 'none', beardCol: 'brown', hoodie: 'honey', jeans: 'black', glasses: 'round', hold: 'coffee' },
  nb: { body: 'nb', skin: 0, hair: 'violet', length: 'medium', style: 'undercut', beard: 'none', beardCol: 'violet', hoodie: 'teal', jeans: 'grey', glasses: 'square', hold: 'phone' },
};

export const OUTLINE = '#1a1424';
export const SKIN = ['#F6D8BE', '#E5B48E', '#C2865A', '#8F5B38', '#5A3826'];
export const HAIR = { black: '#262430', brown: '#5C3A1E', blonde: '#D9B85A', ginger: '#C0522A', violet: '#7B4FB8' };
export const HOODIE = { honey: '#E8A000', ink: '#2B3647', teal: '#1F8FD6', indigo: '#51368D', lime: '#5FA81A' };
export const JEANS = { indigo: '#34497E', black: '#23232A', light: '#7F9CC4', grey: '#5B5F66', khaki: '#B59B6A' };

// torso spans, arm columns, leg columns, shoe columns (inclusive column ranges)
export const BODIES = {
  masc: { shoulder: [6, 21], armL: [5, 7], armR: [20, 22], torso: [8, 19], waist: [8, 19], hip: [8, 19], legL: [8, 12], legR: [15, 19], shoeL: [6, 12], shoeR: [15, 21], neck: [12, 15], headRx: 5.6 },
  fem: { shoulder: [7, 20], armL: [6, 7], armR: [20, 21], torso: [8, 19], waist: [9, 18], hip: [8, 19], legL: [9, 12], legR: [15, 18], shoeL: [7, 12], shoeR: [15, 20], neck: [12, 15], headRx: 5.3 },
  nb: { shoulder: [6, 21], armL: [5, 7], armR: [20, 22], torso: [8, 19], waist: [9, 18], hip: [8, 19], legL: [8, 12], legR: [15, 19], shoeL: [6, 12], shoeR: [15, 21], neck: [12, 15], headRx: 5.5 },
};
