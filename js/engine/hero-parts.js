// The hero's options and colours (Warp brief 15). The figure itself is painted (assets/hero/, built by
// tools/build_hero_painted.py from Art Claude's paintings) and js/engine/hero.js puts it together; nothing here draws.
// The colour tables stay as they were: the creator's swatches read them, and tools/tests/test_build_hero_set.py holds
// the sheet's ramps to them.

import { HC_MARK, HC_MARK_PIXELS } from './hc-mark.js';
export { HC_MARK, HC_MARK_PIXELS };          // the official logomark reduced by tools/hc_mark.py; never drawn here

export const OPTIONS = {
  skin: [0, 1, 2, 3],
  hair: ['black', 'brown', 'blonde', 'ginger', 'violet'],          // colour; the beard takes it too
  style: ['standard', 'long', 'fro', 'mohawk'],                    // the painted heads
  beard: ['none', 'short'],
  hoodie: ['honey', 'ink', 'teal', 'indigo', 'lime'],
  jeans: ['indigo', 'black', 'light', 'grey', 'khaki'],
  glasses: ['none', 'glasses'],
};
export const CONFIG_KEYS = Object.keys(OPTIONS);
export const OUTFITS = ['hoodie', 'pj'];
/** The figure Rick approved: today's default, without a body. */
export const DEFAULT_HERO = { skin: 0, hair: 'black', style: 'standard', beard: 'short', hoodie: 'ink', jeans: 'indigo', glasses: 'none' };
/** What a hero saved before the painted hero becomes. */
export const MIGRATE = { style: { shoulder: 'long' }, beard: { long: 'short' } };

export const OUTLINE = '#1a1424';
export const SKIN = ['#E5B48E', '#C2865A', '#8F5B38', '#5A3826'];
export const HAIR = { black: '#262430', brown: '#5C3A1E', blonde: '#D9B85A', ginger: '#C0522A', violet: '#7B4FB8' };
export const HOODIE = { honey: '#E8A000', ink: '#2B3647', teal: '#1F8FD6', indigo: '#51368D', lime: '#5FA81A' };
export const JEANS = { indigo: '#34497E', black: '#23232A', light: '#7F9CC4', grey: '#5B5F66', khaki: '#B59B6A' };
