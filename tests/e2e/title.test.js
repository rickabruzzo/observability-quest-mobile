// The title screen in a browser (Warp brief 16): the picture, the wordmark's two layers, the subtitle, the small print,
// the breathing glow, the Start beat, reduced motion, and the placeholder when the art is refused.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { startServer, windowed } from './_server.js';
import { SCRIPT } from '../../js/script.js';
import { GLOW } from '../../js/title/timeline.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

const M = JSON.parse(readFileSync('assets/title/title.json', 'utf8'));
const PHONES = [[844, 390], [667, 375]];
async function open(w = 844, h = 390, { reduced = false, init = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await windowed(ctx);
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e)); page.errors = errors;
  if (init) await init(page);
  await page.goto(server.baseURL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true, null, { timeout: 15000 });
  return { ctx, page };
}
const loaded = (page) => page.waitForFunction(() => window.__oq.title?.loaded === true, null, { timeout: 9000 });
const px = (page, x, y) => page.evaluate(([x, y]) => [...document.querySelector('#scene').getContext('2d').getImageData(x, y, 1, 1).data].slice(0, 3), [x, y]);
/** A DOM box in scene pixels (320×200), and in CSS px. */
const sceneBox = (page, sel) => page.evaluate((s) => { const el = document.querySelector(s), sc = document.querySelector('#scene').getBoundingClientRect(), r = el.getBoundingClientRect(), k = sc.width / 320; return { x: (r.left - sc.left) / k, y: (r.top - sc.top) / k, w: r.width / k, h: r.height / k, css: { x: r.left, y: r.top, w: r.width, h: r.height }, k, sc: { x: sc.left, y: sc.top, w: sc.width, h: sc.height } }; }, sel);
const meets = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

for (const [w, h] of PHONES) {
  test(`${w}x${h}: the picture, the two wordmark layers at the manifest's box, the subtitle and the small print where the brief puts them`, async () => {
    const { ctx, page } = await open(w, h);
    await loaded(page); await page.waitForTimeout(150);
    // the canvas: a sky pixel, an orange nightstand pixel, the pager's screen dark
    const sky = await px(page, 150, 12), stand = await px(page, 230, 180), screen = await px(page, M.screen.x + Math.floor(M.screen.w / 2), M.screen.y + Math.floor(M.screen.h / 2));
    assert.ok(sky[2] >= sky[0] && sky[2] > 8 && sky[0] < 60 && sky[1] < 60, `a night-sky pixel (dark, bluer than red): ${sky}`);
    assert.ok(stand[0] > 100 && stand[0] > stand[1] && stand[0] > stand[2] + 60, `an orange nightstand pixel: ${stand}`);
    assert.ok(screen[0] < 90 && screen[1] < 110 && screen[2] < 110, `the pager's screen is dark: ${screen}`);
    // the wordmark's layers
    const layers = await page.evaluate(() => [...document.querySelectorAll('.title-layer')].map((im) => ({ cls: im.className, alt: im.alt, src: im.src.split('/').pop(), ok: im.complete && im.naturalWidth > 0, nw: im.naturalWidth, nh: im.naturalHeight })));
    assert.deepEqual(layers, [
      { cls: 'title-layer title-glow', alt: '', src: 'T_wordmark_glow.png', ok: true, nw: 194, nh: 68 },
      { cls: 'title-layer title-letters', alt: 'Observability Quest I', src: 'T_wordmark.png', ok: true, nw: 194, nh: 68 }], 'the glow under the letters');
    for (const sel of ['.title-glow', '.title-letters']) {
      const b = await sceneBox(page, sel), want = { x: b.sc.x + (M.layer.x / 320) * b.sc.w, y: b.sc.y + (M.layer.y / 200) * b.sc.h, w: (M.layer.w / 320) * b.sc.w, h: (M.layer.h / 200) * b.sc.h };
      for (const k of ['x', 'y', 'w', 'h']) assert.ok(Math.abs(b.css[k] - want[k]) <= 1, `${sel} ${k}: ${b.css[k]} vs ${want[k]}`);
      assert.ok(b.x <= M.letters.x && b.x + b.w >= M.letters.x + M.letters.w, 'the layer holds the letters (and their clear margin)');
      assert.ok(M.letters.x + M.letters.w <= M.frame.x, `the letters' right edge (${M.letters.x + M.letters.w}) is left of the window frame (${M.frame.x})`);
      assert.equal(await page.evaluate((s) => getComputedStyle(document.querySelector(s)).imageRendering, sel), 'pixelated');
    }
    // the subtitle
    const sub = await sceneBox(page, '.title-sub'), subStyle = await page.evaluate(() => { const el = document.querySelector('.title-sub'), cs = getComputedStyle(el); return { font: parseFloat(cs.fontSize), lines: Math.round(el.getBoundingClientRect().height / parseFloat(cs.fontSize)), text: el.textContent, nowrap: cs.whiteSpace, color: cs.color, scrollW: el.scrollWidth, clientW: el.clientWidth }; });
    assert.equal(subStyle.text, 'So you want to be on-call?');
    assert.ok(Math.abs(subStyle.font - 0.115 * sub.sc.h) < 0.6, `type ${subStyle.font} vs ${0.115 * sub.sc.h}`);
    assert.equal(subStyle.lines, 1); assert.equal(subStyle.nowrap, 'nowrap'); assert.equal(subStyle.color, 'rgb(220, 240, 255)');
    assert.ok(subStyle.scrollW <= subStyle.clientW + 1, 'one line that fits its box');
    assert.ok(sub.css.x >= sub.sc.x - 0.5 && sub.css.x + sub.css.w <= sub.sc.x + sub.sc.w + 0.5 && sub.css.y >= sub.sc.y && sub.css.y + sub.css.h <= sub.sc.y + sub.sc.h, 'inside the scene');
    assert.ok(Math.abs(sub.css.y - (sub.sc.y + 0.4725 * sub.sc.h)) <= 1, 'its top at 47.25 %');
    assert.ok(!meets(sub, { x: M.screen.x, y: M.screen.y, w: M.screen.w, h: M.screen.h }), `the subtitle's box is clear of the pager's screen: ${JSON.stringify(sub)}`);
    const print = await sceneBox(page, '.title-print');
    assert.ok(!meets(sub, print), 'and clear of the small print');
    // the small print
    const logo = await page.evaluate(() => { const im = document.querySelector('.title-logo'); return { src: im.src.split('/').pop(), alt: im.alt, nw: im.naturalWidth, nh: im.naturalHeight, h: im.getBoundingClientRect().height, rendering: getComputedStyle(im).imageRendering }; });
    assert.deepEqual([logo.src, logo.alt, logo.nw, logo.nh, logo.rendering], ['hc_logo_white.png', 'Honeycomb', 163, 48, 'auto']);
    assert.ok(logo.h >= 24, `logo ${logo.h} CSS px high`);
    const logoBox = await sceneBox(page, '.title-logo'), credit = await sceneBox(page, '.title-credit');
    const stretch = { x: M.print.x, y: 0, w: M.print.w, h: 200 };
    for (const [name, b] of [['logo', logoBox], ['credit', credit]]) assert.ok(b.x >= stretch.x - 0.5 && b.x + b.w <= stretch.x + stretch.w + 0.5, `${name} inside print's stretch: ${JSON.stringify(b)}`);
    assert.ok(credit.y >= logoBox.y + logoBox.h - 0.5, 'the credit is under the logo');
    assert.ok(print.y + print.h <= 200 * 0.98 + 0.5 && print.y + print.h >= 200 * 0.96, `the block's bottom 2 % above the scene's: ${print.y + print.h}`);
    const cred = await page.evaluate(() => { const el = document.querySelector('.title-credit'); return { lines: [...el.querySelectorAll('span')].map((s) => s.textContent), font: parseFloat(getComputedStyle(el).fontSize), color: getComputedStyle(el).color }; });
    assert.deepEqual(cred.lines.join(' '), SCRIPT['title.credit']); assert.equal(cred.lines.length, 2); assert.ok(cred.lines[0].endsWith('(CC BY-SA).'));
    assert.ok(cred.font >= 16 - 0.01, `credit type ${cred.font}`); assert.equal(cred.color, 'rgb(130, 130, 130)');
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });
}

test('over two seconds the glow\'s opacity takes at least three different values, all from the list; the stars twinkle', async () => {
  const { ctx, page } = await open();
  await loaded(page);
  const seen = new Set(), stars = new Set();
  for (let i = 0; i < 20; i++) { seen.add(await page.evaluate(() => getComputedStyle(document.querySelector('.title-glow')).opacity)); stars.add(JSON.stringify(await page.evaluate(() => window.__oq.title.stars))); await page.waitForTimeout(110); }
  assert.ok(seen.size >= 3, `glow values: ${[...seen]}`);
  for (const v of seen) assert.ok(GLOW.includes(Number(v)), v);
  assert.ok(stars.size >= 2, 'the stars change');
  const on = await page.evaluate(() => window.__oq.title.stars);
  for (const i of on) { const s = M.stars[i]; const c = await px(page, s.x, s.y); assert.deepEqual(c, [1, 3, 5].map((k) => parseInt(s.on.slice(k, k + 2), 16)), `star ${i} is on in its colour`); }
  await ctx.close();
});

test('Start: the pager lights and one beep sounds within 100 ms, the creator opens between 500 and 900 ms, a second tap changes nothing', async () => {
  const { ctx, page } = await open();
  await loaded(page);
  const centre = [M.screen.x + Math.floor(M.screen.w / 2), M.screen.y + Math.floor(M.screen.h / 2)];
  assert.notDeepEqual(await px(page, ...centre), [6, 248, 5]);
  const t0 = Date.now();
  await page.click('#btn-start');                                   // the handler runs inside the tap: by the time the click returns the pager is lit
  assert.deepEqual(await px(page, ...centre), [6, 248, 5], 'the pager\'s screen is #06F805 within the tap');
  const s = await page.evaluate(() => ({ lit: window.__oq.title.lit, beeps: window.__oq.title.beeps, state: window.__oq.sound.info.state, screen: document.body.dataset.screen, disabled: document.querySelector('#btn-start').disabled }));
  assert.deepEqual([s.lit, s.beeps, s.screen, s.disabled], [true, 1, 'TITLE', true]);
  assert.equal(s.state, 'running', 'the beep sounded through the game\'s one context');
  await page.click('#btn-start', { force: true }).catch(() => {});
  await page.waitForFunction(() => window.__oq.title.beeps === 2, null, { timeout: 1000 });
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR', null, { timeout: 2000 });
  const dt = Date.now() - t0;
  assert.ok(dt >= 500 && dt <= 900, `the creator opened after ${dt} ms`);
  assert.equal(await page.evaluate(() => window.__oq.transitions), 1, 'one transition for two taps');
  assert.deepEqual(page.errors, []);
  await ctx.close();
});

test('reduced motion: the glow stays at 1, no star changes over three seconds, Start still lights the pager', async () => {
  const { ctx, page } = await open(844, 390, { reduced: true });
  await loaded(page); await page.waitForTimeout(100);
  const quiet = () => page.evaluate((q) => [...document.querySelector('#scene').getContext('2d').getImageData(q.x, q.y, q.w, q.h).data].join(','), M.quiet);
  const a = quiet(), glows = new Set();
  for (let i = 0; i < 12; i++) { glows.add(await page.evaluate(() => getComputedStyle(document.querySelector('.title-glow')).opacity)); await page.waitForTimeout(250); }
  assert.deepEqual([...glows], ['1']);
  assert.equal(await quiet(), await a, 'the sky is still');
  assert.deepEqual(await page.evaluate(() => window.__oq.title.stars), []);
  await page.click('#btn-start'); await page.waitForTimeout(60);
  assert.equal(await page.evaluate(() => window.__oq.title.lit), true);
  assert.deepEqual(await px(page, M.screen.x + Math.floor(M.screen.w / 2), M.screen.y + Math.floor(M.screen.h / 2)), [6, 248, 5]);
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR', null, { timeout: 2000 });
  await ctx.close();
});

test('with T_title.png refused: the lettered placeholder shows and Start opens the creator', async () => {
  const { ctx, page } = await open(844, 390, { init: (p) => p.route('**/assets/title/T_title.png', (r) => r.abort()) });
  await page.waitForFunction(() => window.__oq.title?.failed === true, null, { timeout: 9000 });
  assert.equal(await page.locator('.title-card h1').count(), 1);
  assert.equal(await page.locator('.title-art').count(), 0);
  assert.equal(await page.evaluate(() => window.__oq.title.loaded), false);
  await page.click('#btn-start');
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR', null, { timeout: 2000 });
  assert.deepEqual(page.errors, []);
  await ctx.close();
});
