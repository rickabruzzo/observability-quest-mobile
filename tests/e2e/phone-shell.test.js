// Brief 13: the game on a real phone. The server serves only the deploy; Start goes full screen where the API exists;
// one audio context, unlocked by the first tap, with a Sound button; the ?stats=1 readout; the ?swipe=1 experiment.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

// Stubs the two phone APIs before any script runs and counts their calls (the browser is headless: the real ones would refuse).
const STUB = (mode) => `
  window.__fs = { fs: 0, lock: 0 };
  Object.defineProperty(Element.prototype, 'requestFullscreen', { value: function (o) { window.__fs.fs++; window.__fs.opts = o; return ${mode === 'reject' ? "Promise.reject(new Error('denied'))" : 'Promise.resolve()'}; }, configurable: true });
  Object.defineProperty(window.screen, 'orientation', { value: { lock(o) { window.__fs.lock++; window.__fs.to = o; return ${mode === 'reject' ? "Promise.reject(new Error('denied'))" : 'Promise.resolve()'}; } }, configurable: true });
`;
async function open({ w = 844, h = 390, mobile = true, query = '', stub = null, ctxOpts = {} } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile, ...ctxOpts });
  if (stub) await ctx.addInitScript(STUB(stub));
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e)); page.errors = errors;
  await page.goto(server.baseURL + query, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true, null, { timeout: 15000 });
  return { ctx, page };
}
const fsCalls = (page) => page.evaluate(() => window.__fs);
const soundInfo = (page) => page.evaluate(() => window.__oq.sound.info);
const box = (page, sel) => page.locator(sel).boundingBox();
const overlaps = (a, b) => a && b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

test('the server serves the deploy and nothing else', async () => {
  for (const p of ['briefs/PROTOCOL.md', 'handbacks/2026-11-14-art-playtest-requests.md', 'README.md', 'package.json', 'tests/e2e/_server.js']) {
    const r = await fetch(server.baseURL + p); assert.equal(r.status, 404, p);
  }
  const js = await fetch(server.baseURL + 'js/game.js'); assert.equal(js.status, 200); assert.equal(js.headers.get('content-type'), 'text/javascript');
  const m = await fetch(server.baseURL + 'manifest.webmanifest'); assert.equal(m.status, 200); assert.equal(m.headers.get('content-type'), 'application/manifest+json');
  assert.equal((await m.json()).short_name, 'o11y Quest');
  const otf = await fetch(server.baseURL + 'assets/fonts/gloryquest/gloryquest.otf'); assert.equal(otf.status, 200); assert.equal(otf.headers.get('content-type'), 'font/otf');
  const webp = (await fetch(server.baseURL + 'assets/intro/intro.json')).ok; assert.ok(webp);
});

for (const stub of ['resolve', 'reject']) {
  test(`phone: Start asks for full screen once, then the lock (${stub}); the game is on the creator either way`, async () => {
    const { ctx, page } = await open({ stub });
    assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), true, 'the test context is a touch screen');
    assert.equal(await page.evaluate(() => document.body.dataset.fs), 'yes');
    assert.deepEqual(await fsCalls(page), { fs: 0, lock: 0 });
    await page.click('#btn-start');
    await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
    await page.waitForTimeout(50);
    const c = await fsCalls(page);
    assert.equal(c.fs, 1); assert.deepEqual(c.opts, { navigationUI: 'hide' });
    assert.equal(c.lock, stub === 'resolve' ? 1 : 0, 'the lock follows a granted full screen only'); if (stub === 'resolve') assert.equal(c.to, 'landscape');
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });
}
test('desktop: Start never asks for full screen', async () => {
  const { ctx, page } = await open({ w: 1280, h: 800, mobile: false, stub: 'resolve' });
  await page.click('#btn-start');
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  await page.waitForTimeout(50);
  assert.deepEqual(await fsCalls(page), { fs: 0, lock: 0 });
  await ctx.close();
});
test('the rotate gate in portrait: tapping it asks for full screen and the lock, and shows the Android line', async () => {
  const { ctx, page } = await open({ w: 390, h: 844, stub: 'resolve' });
  assert.equal(await page.locator('#rotate').isVisible(), true);
  assert.equal(await page.locator('#rotate .fs-yes').isVisible(), true);
  assert.equal(await page.locator('#rotate .fs-no').isVisible(), false);
  await page.click('#rotate');
  await page.waitForTimeout(50);
  const c = await fsCalls(page); assert.equal(c.fs, 1); assert.equal(c.lock, 1);
  await ctx.close();
});
test('an iPhone (no Fullscreen API) sees the rotation-lock line and nothing is asked for', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  await ctx.addInitScript(`Object.defineProperty(Element.prototype, 'requestFullscreen', { value: undefined, configurable: true });`);
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e));
  await page.goto(server.baseURL, { waitUntil: 'load' }); await page.waitForFunction(() => window.__oq?.ready === true);
  assert.equal(await page.evaluate(() => document.body.dataset.fs), 'no');
  assert.equal(await page.locator('#rotate .fs-no').isVisible(), true);
  assert.equal(await page.locator('#rotate .fs-yes').isVisible(), false);
  await page.click('#rotate');
  assert.deepEqual(errors, []);
  await ctx.close();
});
test('an iPad (the API is there, and so is navigator.standalone): nothing goes full screen by itself', async () => {
  // iPad Safari takes a tap-driven game's taps for typing in full screen, warns and throws the page out (review of brief 13)
  for (const [w, h] of [[1024, 768], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    await ctx.addInitScript(STUB('resolve'));
    await ctx.addInitScript(`Object.defineProperty(Navigator.prototype, 'standalone', { get() { return false; }, configurable: true });`);
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e));
    await page.goto(server.baseURL, { waitUntil: 'load' }); await page.waitForFunction(() => window.__oq?.ready === true);
    assert.equal(await page.evaluate(() => document.body.dataset.fs), 'no');
    if (w > h) { await page.click('#btn-start'); await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR'); }
    else { assert.equal(await page.locator('#rotate .fs-no').isVisible(), true); await page.click('#rotate'); }
    await page.waitForTimeout(50);
    assert.deepEqual(await fsCalls(page), { fs: 0, lock: 0 });
    assert.deepEqual(errors, []);
    await ctx.close();
  }
});

test('sound: the first tap unlocks one context, it stays one through the intro, and the Sound button mutes and the choice survives a reload', async () => {
  const { ctx, page } = await open();
  assert.equal((await soundInfo(page)).state, 'none');
  await page.click('#btn-start');
  await page.waitForFunction(() => window.__oq.sound.info.state === 'running', null, { timeout: 5000 });
  assert.equal((await soundInfo(page)).contexts, 1);
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR'); await page.waitForTimeout(400);
  await page.click('#btn-start-game');
  await page.waitForFunction(() => document.body.dataset.screen === 'INTRO'); await page.waitForTimeout(400);
  assert.equal((await soundInfo(page)).contexts, 1, 'the intro shares the game\'s context');
  assert.equal((await soundInfo(page)).state, 'running');
  assert.equal(await page.getAttribute('#btn-sound', 'aria-pressed'), 'true');
  await page.click('#btn-sound');
  assert.equal((await soundInfo(page)).state, 'muted');
  assert.equal(await page.getAttribute('#btn-sound', 'aria-pressed'), 'false');
  assert.equal(await page.locator('#btn-sound .state').innerText(), 'off');
  await page.reload({ waitUntil: 'load' }); await page.waitForFunction(() => window.__oq?.ready === true);
  assert.equal(await page.getAttribute('#btn-sound', 'aria-pressed'), 'false', 'muted survives a reload');
  assert.equal(await page.evaluate(() => window.__oq.sound.muted), true);
  await page.click('#btn-start');
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  assert.equal((await soundInfo(page)).state, 'muted');
  await page.click('#btn-sound');
  assert.equal((await soundInfo(page)).state, 'running');
  assert.equal(await page.locator('#btn-sound .state').innerText(), 'on');
  assert.deepEqual(page.errors, []);
  await ctx.close();
});

for (const [w, h] of [[844, 390], [667, 375], [800, 360]]) {
  test(`${w}x${h}: the Sound button is on screen, 44x44 and clear of every control on the title, the creator and a room`, async () => {
    const { ctx, page } = await open({ w, h, query: '?ch=1' });
    const check = async (screen) => {
      const b = await box(page, '#btn-sound');
      assert.ok(b, `${screen}: #btn-sound missing`);
      assert.ok(b.x >= 0 && b.y >= 20 && b.x + b.width <= w + 0.5 && b.y + b.height <= h + 0.5, `${screen} ${w}x${h}: off screen ${JSON.stringify(b)}`);
      assert.ok(b.width >= 44 && b.height >= 44, `${screen} ${w}x${h}: ${b.width}x${b.height}`);
      const others = await page.evaluate(() => [...document.querySelectorAll('button, .msg, .tool-prompts, .pc-item, .opt, #name-btn')].filter((e) => e.id !== 'btn-sound' && e.offsetParent !== null).map((e) => { const r = e.getBoundingClientRect(); return { id: e.id || e.className, x: r.x, y: r.y, width: r.width, height: r.height }; }));
      for (const o of others) assert.ok(!overlaps(b, o), `${screen} ${w}x${h}: Sound overlaps ${o.id}`);
    };
    await check('title');
    await page.click('#btn-start'); await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR'); await page.waitForTimeout(400);
    await check('creator');
    await page.click('#tab-kit'); await check('creator kit');
    await page.click('#btn-start-game'); await page.click('#btn-skip');
    await page.waitForFunction(() => document.body.dataset.screen === 'CHAPTER' && window.__oq.chapter?.state === 'card'); await page.waitForTimeout(400);
    await check('room card');
    await page.click('.msg').catch(() => {});
    await page.waitForFunction(() => window.__oq.chapter.state !== 'card', null, { timeout: 9000 }).catch(() => {});
    await check('room');
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });
}

test('?stats=1 puts the sound readout in the bar; without it the title is unchanged', async () => {
  const plain = await open();
  assert.equal(await plain.page.locator('#sb-title').innerText(), 'Observability Quest');
  await plain.page.click('#btn-start'); await plain.page.waitForTimeout(700);
  assert.equal(await plain.page.locator('#sb-title').innerText(), 'Observability Quest');
  await plain.ctx.close();
  const { ctx, page } = await open({ query: '?stats=1' });
  await page.waitForFunction(() => document.getElementById('sb-title').textContent.includes('sound:'), null, { timeout: 3000 });
  assert.match(await page.locator('#sb-title').innerText(), /^Observability Quest · sound: none · (no session API|\w+) · no context$/);
  await page.click('#btn-start');
  await page.waitForFunction(() => document.getElementById('sb-title').textContent.includes('sound: running'), null, { timeout: 3000 });
  assert.match(await page.locator('#sb-title').innerText(), /^Observability Quest · sound: running · (no session API|\w+) · \d+$/);
  const sb = await box(page, '#statusbar'); assert.equal(Math.round(sb.height), 20);
  await ctx.close();
});

test('?swipe=1: the document scrolls 80 px and the scene does not move; without it the document is the viewport', async () => {
  const plain = await open();
  assert.deepEqual(await plain.page.evaluate(() => [document.documentElement.scrollHeight, innerHeight]), [390, 390]);
  await plain.ctx.close();
  const { ctx, page } = await open({ query: '?swipe=1' });
  assert.deepEqual(await page.evaluate(() => [document.documentElement.scrollHeight, innerHeight]), [470, 390]);
  const before = await box(page, '#scene');
  await page.evaluate(() => window.scrollTo(0, 80)); await page.waitForTimeout(50);
  assert.equal(await page.evaluate(() => window.scrollY), 80);
  assert.deepEqual(await box(page, '#scene'), before);
  assert.equal(await page.evaluate(() => document.body.dataset.screen), 'TITLE');
  await ctx.close();
});

test('the status bar text starts at the safe-area inset, 10 px at least', async () => {
  const { ctx, page } = await open();
  const pad = await page.evaluate(() => { const s = getComputedStyle(document.getElementById('statusbar')); return [s.paddingLeft, s.paddingRight]; });
  assert.deepEqual(pad, ['10px', '10px']);
  await ctx.close();
});
