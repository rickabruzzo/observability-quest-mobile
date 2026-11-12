// The intro cutscene: cuts between stills, LCD text, the bedroom reveal, and every way out of it.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

async function openIntro(opts = {}, prep, query = '') {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, ...opts });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e));
  if (prep) await prep(page);
  await page.goto(server.baseURL + query, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true);
  await page.click('#btn-start');
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  await page.waitForTimeout(400);
  await page.click('#btn-start-game');
  return { ctx, page, errors };
}
const intro = (page) => page.evaluate(() => ({ ...window.__oq.intro }));
const running = (page) => page.waitForFunction(() => window.__oq.intro?.loaded === true);
const tapScene = async (page) => { const b = await page.locator('#scene').boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); };
/** Fraction of pixels in a logical rect darker than `max` on every channel. */
const darkFraction = (page, r, max = 60) => page.evaluate(({ r, max }) => {
  const d = document.getElementById('scene').getContext('2d').getImageData(r.x, r.y, r.w, r.h).data;
  let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] <= max && d[i + 1] <= max && d[i + 2] <= max) n++;
  return n / (d.length / 4);
}, { r, max });
const FULL = { x: 0, y: 0, w: 320, h: 200 };

test('START opens the intro on the dark room', async () => {
  const { ctx, page, errors } = await openIntro();
  await page.waitForFunction(() => document.body.dataset.screen === 'INTRO');
  const s = await intro(page);
  assert.equal(s.id, 'dark'); assert.equal(s.shot, 0); assert.equal(s.done, false);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('the dark room cuts to black and back; shots advance on their own', async () => {
  const { ctx, page } = await openIntro();
  await running(page);
  let sawBlack = false, sawRoom = false;
  for (let i = 0; i < 30 && !(sawBlack && sawRoom); i++) {
    const f = await darkFraction(page, FULL, 0);
    if (f === 1) sawBlack = true; else sawRoom = true;
    await page.waitForTimeout(60);
  }
  assert.ok(sawBlack, 'never fully black'); assert.ok(sawRoom, 'never showed the room');
  await page.waitForFunction(() => window.__oq.intro.shot >= 1, null, { timeout: 5000 });
  assert.equal((await intro(page)).id, 'help');
  await ctx.close();
});

test('a tap advances exactly one shot; Help! is on the LCD', async () => {
  const { ctx, page } = await openIntro();
  await running(page);
  await page.waitForTimeout(300);
  await tapScene(page);
  await page.waitForFunction(() => window.__oq.intro.shot === 1);
  const lcd = await page.evaluate(() => window.__oq.intro.manifest.lcd);
  let lit = 0;
  for (let i = 0; i < 12 && !lit; i++) { lit = await darkFraction(page, lcd); await page.waitForTimeout(50); }
  assert.ok(lit > 0.03, `LCD text never drawn (${lit})`);
  await page.waitForTimeout(300);
  await tapScene(page);
  await page.waitForTimeout(100);
  assert.equal((await intro(page)).shot, 2);
  await ctx.close();
});

test('a tap in the first 250 ms of a shot is ignored', async () => {
  const { ctx, page } = await openIntro();
  await running(page);
  await page.waitForTimeout(300);
  await tapScene(page); await tapScene(page);
  await page.waitForTimeout(80);
  assert.equal((await intro(page)).shot, 1);
  await ctx.close();
});

test('Skip goes to the scenario menu once, however fast it is pressed', async () => {
  const { ctx, page, errors } = await openIntro();
  await page.waitForFunction(() => document.body.dataset.screen === 'INTRO');
  const before = await page.evaluate(() => window.__oq.transitions);
  await page.locator('#btn-skip').dblclick();
  await page.waitForFunction(() => document.body.dataset.screen === 'MENU', null, { timeout: 3000 });
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => window.__oq.transitions), before + 1);
  assert.equal(await page.evaluate(() => document.body.dataset.screen), 'MENU');
  assert.equal(await page.locator('#btn-skip').count(), 0);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('tapping through every shot ends in the scenario menu', async () => {
  const { ctx, page } = await openIntro();
  await running(page);
  for (let i = 0; i < 9; i++) { await page.waitForTimeout(300); await tapScene(page); }
  await page.waitForFunction(() => document.body.dataset.screen === 'MENU', null, { timeout: 3000 });
  await ctx.close();
});

test('the bedroom shot shows the title and walks the hero out', async () => {
  const { ctx, page } = await openIntro();
  await running(page);
  for (let i = 0; i < 8; i++) { await page.waitForTimeout(300); await tapScene(page); }
  await page.waitForFunction(() => window.__oq.intro.id === 'bedroom' && window.__oq.intro.hero);   // its first painted frame
  const first = await intro(page);                                        // the hero is in bed the moment the light comes on
  assert.ok(first.t < 600, `checked late (${first.t})`);
  assert.deepEqual([first.hero?.visible, first.hero?.pose, first.hero?.outfit], [true, 'situp', 'pj']);
  assert.equal(await page.locator('.intro-title').count(), 1, 'the title is on the wall the moment the light comes on');
  await page.waitForFunction(() => window.__oq.intro.t > 900);
  // the title is the app's own wordmark, drawn on the wall, with the subtitle lettered under it
  assert.equal(await page.locator('.intro-title').getAttribute('aria-label'), 'Observability Quest I: So you want to be on-call?');
  assert.match(await page.locator('.intro-title').innerText(), /^So you want to be on-call\?$/);     // the I is in the wordmark, after QUEST
  const blue = await page.evaluate(() => {
    const r = window.__oq.intro.manifest.logo, d = document.getElementById('scene').getContext('2d').getImageData(r.x, r.y, r.w, r.h).data;
    let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 2] > 140 && d[i + 2] > d[i] + 50) n++;
    return n / (d.length / 4);
  });
  assert.ok(blue > 0.2, `wordmark not on the wall (${blue})`);
  const box = await page.locator('.intro-title').boundingBox(), sc = await page.locator('#scene').boundingBox();
  assert.ok(box.x >= sc.x && box.x + box.width <= sc.x + sc.width + 1 && box.y >= sc.y, 'title outside the scene');
  await page.waitForFunction(() => window.__oq.intro.hero?.visible && window.__oq.intro.hero.pose === 'situp');
  // day clothes lie on the floor in the hero's own colours until the change, then they are on the hero
  const m = await page.evaluate(() => window.__oq.intro.manifest);
  const pileBox = { x: m.clothes.x, y: m.clothes.y - 10, w: 20, h: 10 };
  const grab = (r) => page.evaluate((r) => [...document.getElementById('scene').getContext('2d').getImageData(r.x, r.y, r.w, r.h).data].join(), r);
  assert.equal((await intro(page)).hero.pile, true);
  const withPile = await grab(pileBox);
  await page.waitForFunction(() => window.__oq.intro.hero?.outfit === 'hoodie', null, { timeout: 5000 });
  assert.equal((await intro(page)).hero.pile, false);
  assert.notEqual(await grab(pileBox), withPile, 'the clothes are still on the floor');
  // the laptop is taken once they are dressed, Sierra inventory style (the plate cut is checked in its own test)
  await page.waitForFunction(() => window.__oq.intro.hero?.holding === true, null, { timeout: 4000 });
  // the way out is the profile view: side on across the floor and up to the threshold, no back view
  await page.waitForFunction(() => window.__oq.intro.hero?.view === 'side', null, { timeout: 6000 });
  assert.match((await intro(page)).hero.pose, /^(w[1-8]|stand)$/);
  // out through the door: it opens, the hero is gone, then the next screen
  await page.waitForFunction(() => window.__oq.intro.hero?.doorOpen === true, null, { timeout: 6000 });
  await page.waitForFunction(() => window.__oq.intro.hero?.doorOpen === true && window.__oq.intro.hero.visible === false, null, { timeout: 3000 });
  // every action is heard, in order: title, sitting up, feet on the floor, clothes on, item taken, door, door
  await page.waitForFunction(() => window.__oq.intro.sounds.includes('shut') || document.body.dataset.screen !== 'INTRO', null, { timeout: 9000 }).catch(() => {});
  const heard = await page.evaluate(() => window.__oq.intro.sounds.slice());
  assert.deepEqual(heard.filter((n) => n !== 'beep'), ['click', 'title', 'rustle', 'step', 'pickup', 'take', 'door', 'shut']);   // the light, then each action
  await page.waitForFunction(() => document.body.dataset.screen === 'MENU', null, { timeout: 9000 });
  await ctx.close();
});

test('rotating to portrait freezes the intro; rotating back resumes the same shot', async () => {
  const { ctx, page } = await openIntro();
  await running(page);
  await page.waitForTimeout(400);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => window.__oq.paused === true);
  const a = await intro(page);
  await page.waitForTimeout(700);
  const b = await intro(page);
  assert.equal(b.t, a.t); assert.equal(b.shot, a.shot);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForFunction((t) => window.__oq.intro.t > t || window.__oq.intro.shot > 0, a.t);
  const c = await intro(page);
  assert.ok(c.shot === a.shot ? c.t > a.t : c.shot === a.shot + 1, JSON.stringify([a, c]));
  await ctx.close();
});

test('if the pictures cannot load the game carries on to the scenario menu', async () => {
  const { ctx, page } = await openIntro({}, (page) => page.route('**/assets/intro/*.png', (r) => r.abort()));
  await page.waitForFunction(() => document.body.dataset.screen === 'MENU', null, { timeout: 8000 });
  await ctx.close();
});

test('if the manifest is broken the game carries on to the scenario menu', async () => {
  const { ctx, page } = await openIntro({}, (page) => page.route('**/assets/intro/intro.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"images":' })));
  await page.waitForFunction(() => document.body.dataset.screen === 'MENU', null, { timeout: 8000 });
  await ctx.close();
});

test('reduced motion: no black frames, no flashing, ends without input', async () => {
  const { ctx, page } = await openIntro({ reducedMotion: 'reduce' });
  await running(page);
  for (let i = 0; i < 25; i++) {
    const s = await intro(page);
    if (s.id !== 'dark') break;
    assert.ok(await darkFraction(page, FULL, 0) < 1, 'black frame under reduced motion');
    await page.waitForTimeout(100);
  }
  for (let i = 0; i < 9; i++) { if (await page.evaluate(() => document.body.dataset.screen) !== 'INTRO') break; await page.waitForTimeout(300); await tapScene(page).catch(() => {}); if ((await intro(page)).id === 'bedroom') break; }
  await page.waitForFunction(() => document.body.dataset.screen === 'MENU', null, { timeout: 5000 });
  await ctx.close();
});

test('Skip is a full-size target on a small phone', async () => {
  const { ctx, page } = await openIntro({ viewport: { width: 667, height: 375 } });
  await page.waitForFunction(() => document.body.dataset.screen === 'INTRO');
  const b = await page.locator('#btn-skip').boundingBox();
  assert.ok(b.width >= 44 && b.height >= 44, JSON.stringify(b));
  assert.ok(b.x >= 0 && b.x + b.width <= 667 && b.y >= 0 && b.y + b.height <= 375, JSON.stringify(b));
  await ctx.close();
});

test('if a picture never arrives the game still reaches the scenario menu', async () => {
  const { ctx, page } = await openIntro({}, (page) => page.route('**/assets/intro/C_misery.png', () => { /* never answered */ }));
  await page.waitForFunction(() => document.body.dataset.screen === 'MENU', null, { timeout: 9000 });
  await ctx.close();
});

test('back to the sheet and Start again: one Skip, one title, taps still advance one shot', async () => {
  const { ctx, page } = await openIntro({}, undefined, '?preview=1');       // the preview room has the way back to the sheet
  for (let round = 0; round < 2; round++) {
    await running(page);
    await page.click('#btn-skip');
    await page.waitForFunction(() => document.body.dataset.screen === 'PREVIEW');
    await page.waitForTimeout(400); await page.click('#btn-redo');
    await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
    await page.waitForTimeout(400); await page.click('#btn-start-game');
    await page.waitForFunction(() => document.body.dataset.screen === 'INTRO');
  }
  await running(page);
  assert.equal(await page.locator('#btn-skip').count(), 1);
  assert.equal(await page.locator('.intro-title').count(), 0);
  assert.equal((await intro(page)).shot, 0);
  await page.waitForTimeout(300); await tapScene(page); await page.waitForTimeout(80);
  assert.equal((await intro(page)).shot, 1);
  await ctx.close();
});

test('the hero stands where the manifest says', async () => {
  const { ctx, page } = await openIntro({}, (page) => page.route('**/assets/intro/intro.json', async (r) => {
    const res = await r.fetch(); const m = await res.json(); m.stand = { x: 150 };
    await r.fulfill({ response: res, json: m });
  }));
  await running(page);
  for (let i = 0; i < 8; i++) { await page.waitForTimeout(300); await tapScene(page); }
  await page.waitForFunction(() => window.__oq.intro.hero?.pose === 'idle', null, { timeout: 5000 });
  assert.equal((await intro(page)).hero.view, 'front', 'standing in the bedroom, facing the player');
  assert.equal((await intro(page)).hero.x, 150);
  await ctx.close();
});

test('the laptop is on the dresser until it is taken into inventory; the hero carries nothing', async () => {
  const { ctx, page } = await openIntro();
  await running(page);
  if (!(await page.evaluate(() => !!window.__oq.intro.manifest.images.D_laptop_gone))) { await ctx.close(); return; }   // placeholder art has no such still
  for (let i = 0; i < 8; i++) { await page.waitForTimeout(300); await tapScene(page); }
  await page.waitForFunction(() => window.__oq.intro.hero?.visible && window.__oq.intro.hero.pose === 'situp');
  assert.equal((await intro(page)).hero.plate, 'D_bedroom_vga');
  await page.waitForFunction(() => window.__oq.intro.hero?.holding === true, null, { timeout: 9000 });
  assert.equal((await intro(page)).hero.plate, 'D_laptop_gone');
  await page.waitForFunction(() => window.__oq.intro.hero?.doorOpen === true, null, { timeout: 8000 });
  assert.equal((await intro(page)).hero.plate, 'D_door_open');
  await ctx.close();
});

test('when the dark shot is the same room, the title is already on its wall, dimmed', async () => {
  for (const [dark, want] of [[true, 1], [false, 0]]) {
    const { ctx, page } = await openIntro({}, (page) => page.route('**/assets/intro/intro.json', async (r) => {
      const res = await r.fetch(); const m = await res.json(); m.darkTitle = dark;
      await r.fulfill({ response: res, json: m });
    }));
    await running(page);
    for (let i = 0; i < 7; i++) { await page.waitForTimeout(300); await tapScene(page); }
    await page.waitForFunction(() => window.__oq.intro.id === 'wide');
    await page.waitForTimeout(150);
    assert.equal(await page.locator('.intro-title.dim').count(), want, `darkTitle ${dark}`);
    await page.waitForFunction(() => window.__oq.intro.id === 'bedroom' && window.__oq.intro.hero, null, { timeout: 4000 });
    assert.equal(await page.locator('.intro-title').count(), 1); assert.equal(await page.locator('.intro-title.dim').count(), 0);
    await ctx.close();
  }
});
