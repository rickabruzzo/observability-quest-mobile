// The ending in a browser (Warp brief 17): Claim → Charity's two lines → the sunrise coda → the staff screen → Play more.
// Starts from a session with one scenario already solved (oq.done seeded); never plays a scenario.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { startServer, windowed } from './_server.js';
import { SCRIPT } from '../../js/script.js';
import { displayName } from '../../js/creator-state.js';
import { WALKS } from '../../js/engine/walk.js';
import { codaLine } from '../../js/coda/timeline.js';
import { throughIntro, charitySays, dismissMsg } from './_play.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

const M = JSON.parse(readFileSync('assets/coda/coda.json', 'utf8'));
const PHONES = [[844, 390], [667, 375]];
const WALK_BODIES = [...WALKS.side.frames, ...WALKS.toward.frames].map((f) => f.body);

/** A page on the menu with scenario 1 solved and nothing claimed. */
async function openMenu(w = 844, h = 390, { reduced = false, init = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await windowed(ctx);
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e)); page.errors = errors;
  await page.addInitScript(() => { if (!sessionStorage.getItem('oq.seeded')) { sessionStorage.setItem('oq.done', '{"v":2,"done":{"1":0}}'); sessionStorage.setItem('oq.seeded', '1'); localStorage.removeItem('oq.redeemed'); } });
  if (init) await init(page);
  await page.goto(server.baseURL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true);
  await throughIntro(page);
  assert.equal(await page.evaluate(() => document.body.dataset.screen), 'MENU');
  return { ctx, page };
}
const screen = (page) => page.evaluate(() => document.body.dataset.screen);
const coda = (page) => page.evaluate(() => ({ ...window.__oq.coda, hero: window.__oq.coda.hero }));
const seen = (page) => page.evaluate(() => [...window.__seen]);
const watchText = (page) => page.evaluate(() => { window.__seen = new Set([document.body.innerText]); new MutationObserver(() => window.__seen.add(document.body.innerText)).observe(document.body, { subtree: true, childList: true, characterData: true }); });
/** The open narration window's text and box in scene px. */
const narration = (page) => page.evaluate(() => { const el = document.querySelector('.msg'); if (!el) return null; const sc = document.querySelector('#scene').getBoundingClientRect(), r = el.getBoundingClientRect(), k = sc.width / 320; return { text: el.dataset.text, bottom: (r.bottom - sc.top) / k, left: (r.left - sc.left) / k, portrait: !!el.querySelector('.msg-portrait') }; });
/** The open window shows the whole of `line` at once: one window a line, no page turned in the middle of a sentence. */
const whole = (page, line) => page.waitForFunction((want) => { const el = document.querySelector('.msg'); return !!el && !el.classList.contains('more') && el.innerText.replace(/\s+/g, ' ').trim() === want; }, line, { timeout: 5000 });
const px = (page, x, y) => page.evaluate(([x, y]) => [...document.querySelector('#scene').getContext('2d').getImageData(x, y, 1, 1).data].slice(0, 3), [x, y]);

for (const [w, h] of PHONES) {
  test(`${w}x${h}: Claim from the menu — Charity's two lines, the coda's three (name filled, above windowBottom), the walk out, the sun up, then the staff screen`, async () => {
    const { ctx, page } = await openMenu(w, h);
    await watchText(page);
    const name = displayName(await page.evaluate(() => window.__oq.hero));
    await page.click('#btn-menu-claim');
    const c = await charitySays(page);
    assert.deepEqual(c.lines, [SCRIPT['final.clean'], SCRIPT['final.count.one']]);
    await page.waitForFunction(() => document.body.dataset.screen === 'CODA', null, { timeout: 3000 });
    await page.waitForFunction(() => window.__oq.coda?.loaded === true, null, { timeout: 9000 });
    // beat 0 → 1: the door opens, he walks out down and right, the door shuts once he is clear
    await page.waitForFunction(() => window.__oq.coda.beat === 1 && window.__oq.coda.hero?.visible, null, { timeout: 4000 });
    const frames = new Set(), xs = []; let doorShut = false, maxSkyPx = 0;
    for (let i = 0; i < 40 && !(await coda(page)).waiting; i++) {
      const s = await coda(page);
      if (s.hero) { xs.push(s.hero.x); if (WALK_BODIES.includes(s.hero.pose)) frames.add(s.hero.pose); assert.ok(s.hero.x >= M.doorway.x && s.hero.x <= M.stand.x, `x ${s.hero.x}`); }
      if (!s.doorOpen) { doorShut = true; assert.ok(s.hero.x >= M.door.x + M.door.w + 20 - 1, `the door shuts only once he is clear (x ${s.hero.x})`); }
      await page.waitForTimeout(40);
    }
    assert.ok(frames.size >= 2, `walk frames: ${[...frames]}`); assert.ok(doorShut, 'the door shut');
    for (let i = 1; i < xs.length; i++) assert.ok(xs[i] >= xs[i - 1], 'never left');
    await page.waitForFunction(() => window.__oq.coda.waiting === true, null, { timeout: 6000 });
    const end = await coda(page);
    assert.deepEqual([end.hero.x, end.hero.y, end.hero.view], [M.stand.x, M.floorY, 'side'], 'he ends with his feet at stand.x on floorY, side on');
    assert.equal(end.frame, 0);
    // the three lines, each a plain window top left ending above windowBottom
    const lines = ['coda.1', 'coda.2', 'coda.3'].map((k) => codaLine(k, name));         // a line that begins with the name begins with a capital
    assert.ok(/^[A-Z]/.test(lines[2]));
    const n1 = await narration(page);
    assert.equal(n1.text, lines[0]); assert.equal(n1.portrait, false); assert.ok(n1.bottom <= M.windowBottom + 0.5, `window bottom ${n1.bottom} vs ${M.windowBottom}`);
    await whole(page, lines[0]);
    await dismissMsg(page);
    // beat 2: the sun rises, clipped to the sky; the frame goes 1, 2, 3
    await page.waitForFunction(() => window.__oq.coda.beat === 2, null, { timeout: 3000 });
    const sunYs = [], frameSeq = new Set(); let outsideSky = 0;
    // just under the sky, where the sun would be drawn if it were not clipped: the canvas there must be the frame's own pixel
    const outside = [[M.sun.x + 4, M.sky.y + M.sky.h + 1], [M.sun.x + Math.floor(M.sun.w / 2), M.sky.y + M.sky.h + 2], [M.sun.x + M.sun.w - 4, M.sky.y + M.sky.h + 1]];
    await page.evaluate(async (m) => {
      window.__frames = await Promise.all(m.images.frames.map((f) => new Promise((ok) => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = 320; c.height = 200; c.getContext('2d').drawImage(img, 0, 0); ok(c.getContext('2d')); }; img.src = 'assets/coda/' + f; })));
    }, M);
    for (let i = 0; i < 50 && !(await coda(page)).waiting; i++) {
      const r = await page.evaluate((pts) => {
        const g = document.querySelector('#scene').getContext('2d'), c = window.__oq.coda, f = window.__frames[c.frame];
        return { sun: c.sun, frame: c.frame, bad: pts.filter(([x, y]) => [...g.getImageData(x, y, 1, 1).data].slice(0, 3).join() !== [...f.getImageData(x, y, 1, 1).data].slice(0, 3).join()).length };
      }, outside);
      sunYs.push(r.sun); frameSeq.add(r.frame); outsideSky += r.bad;
      await page.waitForTimeout(90);
    }
    for (let i = 1; i < sunYs.length; i++) assert.ok(sunYs[i] <= sunYs[i - 1], 'the sun never moves down');
    assert.ok(sunYs.some((y) => y > M.sun.y1 && y < M.sun.y0), 'it was seen on its way up');
    assert.equal(outsideSky, 0, 'no sun pixel outside the sky');
    await page.waitForFunction(() => window.__oq.coda.waiting === true, null, { timeout: 6000 });
    const s2 = await coda(page);
    assert.equal(s2.sun, M.sun.y1); assert.equal(s2.frame, 3, 'frame 3 when the sun stops');
    assert.ok([0, 1, 2].every((f) => frameSeq.has(f)), `frames 0, 1, 2 on the way up: ${[...frameSeq]}`);
    const n2 = await narration(page); assert.equal(n2.text, lines[1]); assert.ok(n2.bottom <= M.windowBottom + 0.5);
    await whole(page, lines[1]);
    await dismissMsg(page);
    // beat 3: he faces us; the shades flag follows 400 ms later
    await page.waitForFunction(() => window.__oq.coda.beat === 3 && window.__oq.coda.waiting === true, null, { timeout: 3000 });
    const s3 = await coda(page); assert.equal(s3.hero.view, 'front'); assert.equal(s3.hero.shades, true);
    const n3 = await narration(page); assert.equal(n3.text, lines[2]); assert.ok(n3.text.toLowerCase().includes(name.toLowerCase())); assert.ok(n3.bottom <= M.windowBottom + 0.5);
    await whole(page, lines[2]);
    await dismissMsg(page);
    await page.waitForFunction(() => document.body.dataset.screen === 'COMPLETE', null, { timeout: 3000 });
    assert.doesNotMatch((await seen(page)).join('\n'), /prize desk opens/, 'claim.soon is never shown');
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });
}

test('Skip goes to COMPLETE from any beat', async () => {
  for (const beat of [0, 1, 2]) {
    const { ctx, page } = await openMenu();
    await page.click('#btn-menu-claim'); await charitySays(page);
    await page.waitForFunction(() => document.body.dataset.screen === 'CODA'); await page.waitForFunction(() => window.__oq.coda.loaded === true, null, { timeout: 9000 });
    if (beat >= 1) await page.waitForFunction(() => window.__oq.coda.beat === 1, null, { timeout: 3000 });
    if (beat === 2) { await page.waitForFunction(() => window.__oq.coda.waiting === true, null, { timeout: 6000 }); await dismissMsg(page); await page.waitForFunction(() => window.__oq.coda.beat === 2, null, { timeout: 3000 }); }
    await page.click('#btn-skip');
    await page.waitForFunction(() => document.body.dataset.screen === 'COMPLETE', null, { timeout: 3000 });
    assert.deepEqual(page.errors, []);
    await ctx.close();
  }
});

test('reduced motion: no walk frames, the door open and him standing at once, the sun at y1 at once', async () => {
  const { ctx, page } = await openMenu(844, 390, { reduced: true });
  await page.click('#btn-menu-claim'); await charitySays(page);
  await page.waitForFunction(() => document.body.dataset.screen === 'CODA'); await page.waitForFunction(() => window.__oq.coda.loaded === true, null, { timeout: 9000 });
  await page.waitForFunction(() => window.__oq.coda.beat === 1 && window.__oq.coda.hero, null, { timeout: 3000 });
  const poses = new Set();
  for (let i = 0; i < 8; i++) { poses.add((await coda(page)).hero.pose); await page.waitForTimeout(40); }
  assert.deepEqual([...poses], ['stand'], `no walk frames: ${[...poses]}`);
  const s = await coda(page); assert.deepEqual([s.hero.x, s.hero.y, s.doorOpen], [M.stand.x, M.floorY, true]);
  await page.waitForFunction(() => window.__oq.coda.waiting === true, null, { timeout: 3000 }); await dismissMsg(page);
  await page.waitForFunction(() => window.__oq.coda.beat === 2 && window.__oq.coda.waiting === true, null, { timeout: 3000 });
  const s2 = await coda(page); assert.equal(s2.sun, M.sun.y1); assert.equal(s2.frame, 3);
  await ctx.close();
});

test('COMPLETE: the four strings; REDEEMED sticks across a reload; Play more keeps the solved mark and the button reads "My prize", which opens COMPLETE with no Charity and no coda', async () => {
  const { ctx, page } = await openMenu(667, 375);
  await page.click('#btn-menu-claim'); await charitySays(page);
  await page.waitForFunction(() => document.body.dataset.screen === 'CODA');
  await page.click('#btn-skip');
  await page.waitForFunction(() => document.body.dataset.screen === 'COMPLETE');
  assert.equal(await page.evaluate(() => window.__oq.claimed), true);
  assert.equal(await page.locator('#complete h2').innerText(), SCRIPT['complete.title']);
  assert.equal(await page.locator('.complete-instr').innerText(), SCRIPT['complete.instr']);
  assert.equal(await page.locator('#btn-redeem').innerText(), SCRIPT['complete.redeem']);
  assert.equal(await page.locator('#btn-again').innerText(), SCRIPT['complete.again']);
  assert.equal(await page.locator('.complete-note').innerText(), SCRIPT['complete.again.note']);
  const m = await page.evaluate(() => {
    const sc = document.querySelector('#scene').getBoundingClientRect(), card = document.querySelector('#complete').getBoundingClientRect();
    const fonts = [...document.querySelectorAll('#complete h2, #complete p, #complete button')].map((e) => parseFloat(getComputedStyle(e).fontSize));
    const btns = [...document.querySelectorAll('#complete button')].map((b) => b.getBoundingClientRect().height);
    return { inside: card.left >= sc.left - 0.5 && card.right <= sc.right + 0.5 && card.top >= sc.top - 0.5 && card.bottom <= sc.bottom + 0.5, minFont: Math.min(...fonts), btns, overflow: document.querySelector('#complete').scrollHeight > document.querySelector('#complete').clientHeight + 1 };
  });
  assert.ok(m.inside, 'the card is inside the scene at 667×375'); assert.ok(m.minFont >= 16, `type ${m.minFont}`); assert.ok(m.btns.every((h) => h >= 44), `buttons ${m.btns}`); assert.equal(m.overflow, false);
  await page.click('#btn-redeem');
  assert.equal(await page.locator('#btn-redeem').innerText(), SCRIPT['complete.redeemed']); assert.equal(await page.locator('#btn-redeem').isDisabled(), true);
  await page.reload({ waitUntil: 'load' }); await page.waitForFunction(() => window.__oq?.ready === true);
  assert.equal(await page.evaluate(() => window.__oq.claimed), true, 'claimed survives a reload in the session');
  await throughIntro(page);
  assert.equal(await page.locator('.menu-row[data-ch="1"] .mr-tick').count(), 1, 'the solved mark is kept');
  assert.equal(await page.locator('#btn-menu-claim').innerText(), SCRIPT['complete.show']);
  await page.click('#btn-menu-claim');
  await page.waitForFunction(() => document.body.dataset.screen === 'COMPLETE', null, { timeout: 3000 });
  assert.equal(await page.locator('#charity').count(), 0);
  assert.equal(await page.locator('#btn-redeem').innerText(), SCRIPT['complete.redeemed'], 'still redeemed after the reload'); assert.equal(await page.locator('#btn-redeem').isDisabled(), true);
  await page.waitForTimeout(400);                                   // past the double-tap guard, like a person
  await page.click('#btn-again');
  await page.waitForFunction(() => document.body.dataset.screen === 'MENU');
  assert.deepEqual(page.errors, []);
  await ctx.close();
});

test('with coda.json refused: three windows over black, then COMPLETE', async () => {
  const { ctx, page } = await openMenu(844, 390, { init: (p) => p.route('**/assets/coda/coda.json', (r) => r.abort()) });
  await page.click('#btn-menu-claim'); await charitySays(page);
  await page.waitForFunction(() => document.body.dataset.screen === 'CODA');
  await page.waitForFunction(() => window.__oq.coda.failed === true, null, { timeout: 9000 });
  const name = displayName(await page.evaluate(() => window.__oq.hero));
  for (const k of ['coda.1', 'coda.2', 'coda.3']) {
    await page.waitForSelector('.msg', { timeout: 3000 });
    assert.deepEqual(await px(page, 160, 150), [0, 0, 0], 'black');
    assert.equal((await narration(page)).text, codaLine(k, name));
    await dismissMsg(page);
  }
  await page.waitForFunction(() => document.body.dataset.screen === 'COMPLETE', null, { timeout: 3000 });
  assert.deepEqual(page.errors, []);
  await ctx.close();
});
