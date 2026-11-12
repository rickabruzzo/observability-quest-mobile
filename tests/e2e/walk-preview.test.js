import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

async function openPreview(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { throw e; });
  await page.goto(server.baseURL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true);
  await page.click('#btn-start');
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  await page.waitForTimeout(400);
  await page.click('#btn-start-game');
  await page.click('#btn-skip');                      // START now opens the intro
  await page.waitForFunction(() => document.body.dataset.screen === 'PREVIEW');
  await page.waitForTimeout(400);
  return { ctx, page };
}
const pv = (page) => page.evaluate(() => window.__oq.preview);

test('tap right: hero walks right over time, lands at the tap, ends idle', async () => {
  const { ctx, page } = await openPreview();
  const sc = await page.locator('#scene').boundingBox();
  const x0 = (await pv(page)).x;
  await page.mouse.click(sc.x + sc.width * 0.85, sc.y + sc.height * 0.9);
  await page.waitForTimeout(90);
  const mid = await pv(page);
  assert.ok(mid.walking && mid.x > x0 && /^w[1-8]$/.test(mid.pose), JSON.stringify(mid));
  await page.waitForFunction(() => window.__oq.preview.walking === false, null, { timeout: 6000 });
  const end = await pv(page);
  assert.equal(end.pose, 'idle');
  assert.ok(Math.abs(end.x - (Math.floor(0.85 * 320) - 14)) <= 1, `x=${end.x}`);
  await ctx.close();
});

test('the room reports the side view while walking and the front view at rest', async () => {
  const { ctx, page } = await openPreview();
  const sc = await page.locator('#scene').boundingBox();
  assert.equal((await pv(page)).view, 'front', 'standing still, facing the player');
  await page.mouse.click(sc.x + sc.width * 0.85, sc.y + sc.height * 0.9);
  await page.waitForFunction(() => window.__oq.preview.view === 'side', null, { timeout: 2000 });
  const mid = await pv(page);
  assert.ok(/^w[1-8]$/.test(mid.pose), `side view but pose ${mid.pose}`);
  // walking left is the same side view, mirrored
  await page.waitForFunction(() => window.__oq.preview.walking === false, null, { timeout: 6000 });
  assert.deepEqual([(await pv(page)).view, (await pv(page)).pose], ['front', 'idle']);
  await page.mouse.click(sc.x + sc.width * 0.05, sc.y + sc.height * 0.9);
  await page.waitForFunction(() => window.__oq.preview.view === 'side' && window.__oq.preview.flip === true, null, { timeout: 2000 });
  await page.waitForFunction(() => window.__oq.preview.walking === false, null, { timeout: 6000 });
  assert.equal((await pv(page)).view, 'front');
  await ctx.close();
});

test('tap left flips the sprite', async () => {
  const { ctx, page } = await openPreview();
  const sc = await page.locator('#scene').boundingBox();
  await page.mouse.click(sc.x + sc.width * 0.1, sc.y + sc.height * 0.9);
  await page.waitForTimeout(60);
  assert.equal((await pv(page)).flip, true);
  await ctx.close();
});

test('reduced motion teleports', async () => {
  const { ctx, page } = await openPreview({ reducedMotion: 'reduce' });
  const sc = await page.locator('#scene').boundingBox();
  await page.mouse.click(sc.x + sc.width * 0.85, sc.y + sc.height * 0.9);
  await page.waitForTimeout(50);
  const p = await pv(page);
  assert.equal(p.walking, false); assert.equal(p.pose, 'idle'); assert.equal(p.view, 'front'); assert.ok(p.x > 200, `x=${p.x}`);
  await ctx.close();
});

test('rotating to portrait mid-walk pauses; rotating back resumes from the same x', async () => {
  const { ctx, page } = await openPreview();
  const sc = await page.locator('#scene').boundingBox();
  await page.mouse.click(sc.x + sc.width * 0.95, sc.y + sc.height * 0.9);
  await page.waitForTimeout(60);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(50);
  const a = (await pv(page)).x;
  assert.ok((await pv(page)).walking, 'still mid-walk when rotated');
  await page.waitForTimeout(300);
  const b = (await pv(page)).x;
  assert.equal(a, b, 'frozen while portrait');
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(40);                      // one or two frames after resuming
  const c = (await pv(page)).x;
  assert.ok(c >= a && c - a <= 20, `resumed from ${a}, now ${c}`);  // continues from where it froze, no jump
  await page.waitForFunction(() => window.__oq.preview.walking === false, null, { timeout: 6000 });
  await ctx.close();
});

test('Sheet button returns to the creator with the same hero', async () => {
  const { ctx, page } = await openPreview();
  await page.click('#btn-redo');
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  assert.equal((await page.evaluate(() => window.__oq.creator.hero)).body, 'masc');
  await ctx.close();
});

// ---- Sierra's cursor, for mouse and for thumbs ----
const at = async (page, lx, ly) => { const b = await page.locator('#scene').boundingBox(); return { x: b.x + (lx + 0.5) * (b.width / 320), y: b.y + (ly + 0.5) * (b.height / 200) }; };

test('with a mouse: a walking figure over the floor, a hand over something usable', async () => {
  const { ctx, page } = await openPreview({ viewport: { width: 1280, height: 720 }, hasTouch: false, isMobile: false });
  let p = await at(page, 80, 185); await page.mouse.move(p.x, p.y);
  await page.waitForFunction(() => window.__oq.preview.cursor === 'walk');
  const walkCss = await page.evaluate(() => document.getElementById('scene-box').style.cursor);
  assert.match(walkCss, /^url\("data:image\/png/);
  p = await at(page, 220, 100); await page.mouse.move(p.x, p.y);
  await page.waitForFunction(() => window.__oq.preview.cursor === 'hand');
  const handCss = await page.evaluate(() => document.getElementById('scene-box').style.cursor);
  assert.match(handCss, /^url\("data:image\/png/); assert.notEqual(handCss, walkCss);
  await ctx.close();
});

test('on a phone: no cursor, but a tap shows the walker where it lands and the hand on a usable thing', async () => {
  const { ctx, page } = await openPreview();
  assert.equal(await page.evaluate(() => document.getElementById('scene-box').style.cursor), '');
  let p = await at(page, 60, 186); await page.mouse.click(p.x, p.y);
  await page.waitForFunction(() => window.__oq.preview.marker?.icon === 'walk');
  assert.ok(Math.abs((await pv(page)).marker.x - 60) <= 1);
  await page.waitForFunction(() => window.__oq.preview.marker === null, null, { timeout: 2000 });      // it goes away
  await page.waitForFunction(() => window.__oq.preview.walking === false, null, { timeout: 6000 });
  p = await at(page, 220, 100); await page.mouse.click(p.x, p.y);
  await page.waitForFunction(() => window.__oq.preview.marker?.icon === 'hand');
  await page.waitForFunction(() => window.__oq.preview.walking === false, null, { timeout: 6000 });
  await page.waitForFunction(() => /desk/i.test(document.querySelector('.room-ui')?.textContent || ''));  // it walks over, then looks
  assert.ok(Math.abs((await pv(page)).x - 150) <= 2, 'did not walk to the desk');
  await ctx.close();
});

test('leaving the room clears the cursor', async () => {
  const { ctx, page } = await openPreview({ viewport: { width: 1280, height: 720 }, hasTouch: false, isMobile: false });
  const p = await at(page, 80, 185); await page.mouse.move(p.x, p.y);
  await page.waitForFunction(() => window.__oq.preview.cursor === 'walk');
  await page.click('#btn-redo');
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  assert.equal(await page.evaluate(() => document.getElementById('scene-box').style.cursor), '');
  await ctx.close();
});
