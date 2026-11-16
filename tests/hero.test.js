// The painted hero (Warp brief 15): Art Claude's figures put together from the sheet's codes and the manifest, exactly
// as tools/build_hero_painted.py composed the fixtures; the Honeycomb mark on the chest; which body for which state.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { setHeroSheet, composeFigure, composeProp, bodyFor, drawHero, placeHero, drawPreview, drawHeadThumb, silhouette, HERO_W, HERO_H, PREVIEW, THUMB, heroReady } from '../js/engine/hero.js';
import { HC_MARK, HC_MARK_PIXELS } from '../js/engine/hc-mark.js';
import { DEFAULT_HERO, OPTIONS } from '../js/engine/hero-parts.js';

const DIR = 'tests/fixtures/hero-painted/';
export const MANIFEST = JSON.parse(readFileSync('assets/hero/hero.json', 'utf8'));
export const CODES = new Uint8Array(readFileSync(DIR + 'sheet.codes'));
/** Installs the sheet from the fixtures (Node has no PNG decoder); the manifest gives the sheet's size by its pieces. */
export function installSheet() {
  const w = Math.max(...Object.values(MANIFEST.bodies).map((b) => b.x + b.w), ...Object.values(MANIFEST.heads).flatMap((h) => Object.values(h).map((e) => e.x + e.w)));
  const W = CODES.length % 506 === 0 ? 506 : w;              // the built sheet is 506 wide; its codes are row-major
  setHeroSheet(MANIFEST, CODES, W, CODES.length / W);
}
installSheet();
const names = readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
/** A fixture's config in the game's shape. */
const cfgOf = (f) => ({ ...f.look, style: f.style, beard: f.beard ? 'short' : 'none', glasses: f.glasses ? 'glasses' : 'none' });

test('the sheet is installed from the fixtures and its codes are the manifest\'s size', () => {
  assert.ok(heroReady()); assert.equal(CODES.length, 506 * 253);
  assert.deepEqual(MANIFEST.parts, ['hoodie', 'jeans', 'skin', 'hair', 'grey', 'outline']); assert.equal(MANIFEST.erase, 255);
});
test('fixtures exist', () => assert.ok(names.length >= 10, `${names.length}`));
for (const n of names) {
  test(`reproduces ${n} byte for byte, with its w, h, ax, ay`, () => {
    const f = JSON.parse(readFileSync(DIR + n + '.json', 'utf8')), want = readFileSync(DIR + n + '.rgba');
    const fig = composeFigure(cfgOf(f), f.body, f.outfit, { mark: false });
    assert.deepEqual([fig.w, fig.h, fig.ax, fig.ay], [f.w, f.h, f.ax, f.ay]);
    const got = Buffer.from(fig.data.buffer);
    assert.equal(got.length, want.length);
    const firstDiff = got.findIndex((b, i) => b !== want[i]);
    assert.equal(firstDiff, -1, `first differing byte ${firstDiff} → pixel ${Math.floor(firstDiff / 4) % f.w},${Math.floor(firstDiff / 4 / f.w)}`);
    assert.equal(fig.view, MANIFEST.bodies[f.body].view);
  });
}
test('the figure\'s last row is the body\'s last row: soles, or the cut at the waist for pj_sit; the standard front figure is 136 rows', () => {
  for (const body of Object.keys(MANIFEST.bodies)) {
    const fig = composeFigure(DEFAULT_HERO, body, body.startsWith('pj') ? 'pj' : 'hoodie'), b = MANIFEST.bodies[body];
    assert.equal(fig.h - fig.ay, b.h - b.ay, `${body}: rows below the anchor`);
    let low = -1; for (let y = 0; y < fig.h; y++) for (let x = 0; x < fig.w; x++) if (fig.data[(y * fig.w + x) * 4 + 3]) low = y;
    assert.equal(low, fig.h - 1, `${body}: the last row is painted`);
  }
  assert.equal(composeFigure(DEFAULT_HERO, 'front').h, 136);
  assert.equal(composeFigure({ ...DEFAULT_HERO, style: 'fro' }, 'front').h, 142, 'the afro stands six rows above short hair');
});
test('the mark: on front, toward_l and toward_r in the hoodie, its 32 pixels at (ax + dx, ay + dy) in the official colours; nowhere else, not in pyjamas', () => {
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const at = (fig, x, y) => { const o = (y * fig.w + x) * 4; return [fig.data[o], fig.data[o + 1], fig.data[o + 2], fig.data[o + 3]]; };
  const { dx, dy, bodies } = MANIFEST.mark;
  assert.deepEqual(bodies, ['front', 'toward_l', 'toward_r']);
  for (const body of bodies) {
    const fig = composeFigure(DEFAULT_HERO, body), plain = composeFigure(DEFAULT_HERO, body, 'hoodie', { mark: false });
    let differ = 0;
    for (const [mx, my, colour] of HC_MARK_PIXELS) assert.deepEqual(at(fig, fig.ax + dx + mx, fig.ay + dy + my), [...rgb(HC_MARK[colour]), 255], `${body} ${mx},${my}`);
    for (let i = 0; i < fig.data.length; i += 4) if (fig.data[i] !== plain.data[i] || fig.data[i + 1] !== plain.data[i + 1] || fig.data[i + 2] !== plain.data[i + 2]) differ++;
    assert.equal(differ, HC_MARK_PIXELS.length, `${body}: only the mark's pixels differ from the plain figure`);
  }
  for (const body of Object.keys(MANIFEST.bodies).filter((b) => !bodies.includes(b))) {
    const outfit = body.startsWith('pj') ? 'pj' : 'hoodie';
    assert.deepEqual(composeFigure(DEFAULT_HERO, body, outfit).data, composeFigure(DEFAULT_HERO, body, outfit, { mark: false }).data, `${body}: no mark`);
  }
  assert.deepEqual(composeFigure(DEFAULT_HERO, 'front', 'pj').data, composeFigure(DEFAULT_HERO, 'front', 'pj', { mark: false }).data, 'no mark on pyjamas');
});
test('which body for each state (table C)', () => {
  assert.equal(bodyFor('idle'), 'front'); assert.equal(bodyFor('idle', 'pj'), 'pj_front');
  assert.equal(bodyFor('stand'), 'side'); assert.equal(bodyFor('back'), 'back');
  assert.equal(bodyFor('situp', 'pj'), 'pj_sit'); assert.equal(bodyFor('situp'), 'pj_sit');
  for (const b of ['walk_contact', 'walk_down', 'walk_pass', 'walk_up', 'toward_l', 'toward_r', 'away_l', 'away_r']) assert.equal(bodyFor(b), b);
  assert.equal(bodyFor('w3'), 'front', 'an unknown pose stands');
});
test('every option value composes every body without throwing; an unknown colour falls back to the default\'s', () => {
  for (const [k, vs] of Object.entries(OPTIONS)) for (const v of vs) for (const body of Object.keys(MANIFEST.bodies)) assert.ok(composeFigure({ ...DEFAULT_HERO, [k]: v }, body));
  assert.deepEqual(composeFigure({ ...DEFAULT_HERO, hoodie: 'plaid', style: 'locs' }, 'front').data, composeFigure(DEFAULT_HERO, 'front').data);
});
test('pyjamas: the hoodie and jeans parts take the pj ramps, the same on everyone; skin and hair stay his own', () => {
  const a = composeFigure({ ...DEFAULT_HERO, hoodie: 'honey', jeans: 'khaki' }, 'pj_front', 'pj'), b = composeFigure({ ...DEFAULT_HERO, hoodie: 'teal', jeans: 'black' }, 'pj_front', 'pj');
  assert.deepEqual(a.data, b.data);
  const c = composeFigure({ ...DEFAULT_HERO, skin: 3 }, 'pj_front', 'pj');
  assert.notDeepEqual(a.data, c.data);
});
test('placeHero: the anchor\'s column on feetX, the last row above feetY, dy moves the figure down; the front view never mirrors, the side view does', () => {
  const p = placeHero(DEFAULT_HERO, 'idle', 100, 180, 1);
  assert.deepEqual([p.x + p.ax, p.y + p.h, p.w, p.h], [100, 180, 48, 136]);
  assert.equal(placeHero(DEFAULT_HERO, 'walk_contact', 100, 180, 1, { dy: 2 }).y, p.y + 2 - (112 - 136 + 136 - 112));   // the walk bodies are the same height
  assert.equal(placeHero(DEFAULT_HERO, 'walk_down', 100, 180, 0.5, { dy: 2 }).y, placeHero(DEFAULT_HERO, 'walk_down', 100, 180, 0.5).y + 1, 'dy scales with him');
  const f = placeHero(DEFAULT_HERO, 'idle', 100, 180, 1, { flip: true });
  assert.equal(f.flip, false); assert.deepEqual(f.fig.data, p.fig.data);
  const s = placeHero(DEFAULT_HERO, 'stand', 100, 180, 1), sf = placeHero(DEFAULT_HERO, 'stand', 100, 180, 1, { flip: true });
  assert.equal(sf.flip, true); assert.equal(sf.ax, s.w - 1 - s.ax, 'the anchor\'s column moves with the mirror');
  assert.equal(placeHero(DEFAULT_HERO, 'idle', 100, 180, 1.7).scale, 1, 'never larger than 1');
  assert.equal(placeHero(DEFAULT_HERO, 'toward_l', 100, 180, 1, { flip: true }).flip, false, 'toward and away are never mirrored');
  assert.equal(placeHero(DEFAULT_HERO, 'away_r', 100, 180, 1, { flip: true }).flip, false);
});
test('drawHero paints whole pixels in runs inside its box; the preview and the thumbnail are placed as E says; the silhouette is flat', () => {
  const calls = [], g = { fillStyle: '', fillRect(x, y, w, h) { calls.push([x, y, w, h, this.fillStyle]); } };
  const box = drawHero(g, DEFAULT_HERO, 'idle', 60, 190, 0.8);
  assert.ok(calls.length > 100);
  assert.ok(calls.every(([x, y, w, h]) => Number.isInteger(x) && Number.isInteger(y) && h === 1 && x >= box.x && x + w <= box.x + box.w && y >= box.y && y < box.y + box.h));
  const pc = [], pg = { fillStyle: '', fillRect(x, y, w, h) { pc.push([x, y, w, h]); } };
  const pv = drawPreview(pg, DEFAULT_HERO);
  assert.deepEqual([pv.x + 24, pv.y + pv.h], [Math.floor(PREVIEW.w / 2), PREVIEW.h]); assert.deepEqual(PREVIEW, { w: 56, h: 148 });
  assert.ok(pc.every(([x, y, w]) => x >= 0 && x + w <= PREVIEW.w && y >= 0 && y < PREVIEW.h));
  const tc = [], tg = { fillStyle: '', fillRect(x, y, w, h) { tc.push([x, y, w, h]); } };
  assert.equal(drawHeadThumb(tg, DEFAULT_HERO), true); assert.deepEqual(THUMB, { w: 40, h: 44, dx: -20, dy: -36 });
  assert.ok(tc.length > 200 && tc.every(([x, y]) => x >= 0 && x < THUMB.w && y >= 0 && y < THUMB.h));
  const fig = composeFigure(DEFAULT_HERO, 'front'), sil = silhouette(fig, [255, 255, 255]);
  for (let i = 0; i < fig.data.length; i += 4) assert.ok(fig.data[i + 3] ? sil.data[i] === 255 && sil.data[i + 3] === 255 : sil.data[i + 3] === 0);
  const clothes = composeProp('clothes', DEFAULT_HERO);
  assert.deepEqual([clothes.w, clothes.h, clothes.ax, clothes.ay], [35, 23, 17, 23]);
  assert.notDeepEqual(clothes.data, composeProp('clothes', { ...DEFAULT_HERO, hoodie: 'honey' }).data, 'the heap takes his hoodie colour');
});
test('without the sheet nothing is drawn and nothing throws', () => {
  setHeroSheet(null);
  assert.equal(heroReady(), false); assert.equal(composeFigure(DEFAULT_HERO, 'front'), null);
  const g = { fillStyle: '', fillRect() { throw new Error('drew'); } };
  assert.equal(drawHero(g, DEFAULT_HERO, 'idle', 0, 0, 1), null); assert.equal(drawPreview(g, DEFAULT_HERO), null); assert.equal(drawHeadThumb(g, DEFAULT_HERO), false);
  assert.equal(composeProp('clothes', DEFAULT_HERO), null);
  installSheet();
});
test('HERO_W and HERO_H are the nominal canvas the rooms scale by', () => { assert.equal(HERO_W, 56); assert.equal(HERO_H, 144); });
