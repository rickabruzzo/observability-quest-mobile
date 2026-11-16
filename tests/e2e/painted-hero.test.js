// The painted hero in a browser (Warp brief 15): the sheet the page reads, the creator, the walks in a room, the mark,
// the intro in pyjamas, and the game without the sheet.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { startServer, windowed } from './_server.js';
import { SCRIPT } from '../../js/script.js';
import { CHAPTERS } from '../../js/chapters/index.js';
import { setHeroSheet, composeFigure, scaleFigure, HERO_W } from '../../js/engine/hero.js';
import { DEFAULT_HERO } from '../../js/engine/hero-parts.js';
import { WALKS } from '../../js/engine/walk.js';
import { heroScaleAt } from '../../js/engine/room.js';
import { openGame, ch, dismiss, tapSpot, inState, winOpen } from './_play.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

const MANIFEST = JSON.parse(readFileSync('assets/hero/hero.json', 'utf8')), CODES = readFileSync('tests/fixtures/hero-painted/sheet.codes');
setHeroSheet(MANIFEST, new Uint8Array(CODES), 506, 253);
const SIDE = WALKS.side.frames.map((f) => f.body), AWAY = WALKS.away.frames.map((f) => f.body);
const PHONES = [[844, 390], [667, 375], [800, 360]];
const region = (page, r) => page.evaluate((q) => [...document.querySelector('#scene').getContext('2d').getImageData(q.x, q.y, q.w, q.h).data].join(','), r);
const heroBox = (page) => page.evaluate(() => window.__oq.chapter.heroBox);
const into = async (n, page) => { await page.click('#class-card'); assert.equal(await dismiss(page), SCRIPT[CHAPTERS[n].enter]); };
const settle = async (page) => { await page.waitForFunction(() => window.__oq.chapter.walking === false && window.__oq.chapter.pose === 'idle', null, { timeout: 9000 }); await page.waitForTimeout(700); };   // past the tap marker
async function floorTap(page, x, y) { const sc = await page.locator('#scene').boundingBox(); await page.mouse.click(sc.x + (x / 320) * sc.width, sc.y + (y / 200) * sc.height); }
/** The scene's pixels inside the hero's drawn box, and the box. */
async function heroPixels(page) { const b = await heroBox(page); return { b, px: await region(page, { x: b.x, y: b.y, w: b.w, h: b.h }) }; }
/** Whether the scene shows a figure's pixels at (x, y): the share of its opaque pixels found there. */
const matches = (page, fig, x, y) => page.evaluate(([f, x, y]) => {
  const g = document.querySelector('#scene').getContext('2d'), d = g.getImageData(x, y, f.w, f.h).data;
  let n = 0, all = 0;
  for (let i = 0; i < f.data.length; i += 4) { if (!f.data[i + 3]) continue; all++; if (d[i] === f.data[i] && d[i + 1] === f.data[i + 1] && d[i + 2] === f.data[i + 2]) n++; }
  return n / all;
}, [{ w: fig.w, h: fig.h, data: [...fig.data] }, x, y]);

async function openCreator(opts = {}, init = null) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, ...opts });
  await windowed(ctx);
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e)); page.errors = errors;
  if (init) await init(page);
  await page.goto(server.baseURL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true);
  await page.click('#btn-start');
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  await page.waitForTimeout(400);
  return { ctx, page };
}
const previewPixels = (page) => page.evaluate(() => { const c = document.querySelector('#hero-view'); return c.getContext('2d').getImageData(0, 0, c.width, c.height).data.join(','); });

test('the codes the page reads from hero.png equal the fixture\'s sheet.codes', async () => {
  const { ctx, page } = await openCreator();
  await page.waitForFunction(() => window.__oq.heroReady === true, null, { timeout: 9000 });
  const read = await page.evaluate(async () => {
    const m = await (await fetch('assets/hero/hero.json')).json(), img = new Image();
    await new Promise((ok) => { img.onload = ok; img.src = 'assets/hero/' + m.image; });
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data, out = new Array(c.width * c.height);
    for (let i = 0; i < out.length; i++) out[i] = d[i * 4];
    return { w: c.width, h: c.height, hash: out.reduce((a, b, i) => (a * 31 + b * (i % 7 + 1)) >>> 0, 7), sample: out.slice(0, 400).join(','), len: out.length };
  });
  assert.deepEqual([read.w, read.h, read.len], [506, 253, CODES.length]);
  assert.equal(read.sample, [...CODES.subarray(0, 400)].join(','));
  assert.equal(read.hash, [...CODES].reduce((a, b, i) => (a * 31 + b * (i % 7 + 1)) >>> 0, 7), 'every code the page reads is the fixture\'s');
  await ctx.close();
});

test('the creator: no Body row; the preview changes with every option on both pages; thumbnails differ from their neighbours; Random and Start work', async () => {
  const { ctx, page } = await openCreator();
  await page.waitForFunction(() => window.__oq.heroReady === true, null, { timeout: 9000 });
  await page.waitForTimeout(100);
  assert.equal(await page.locator('.opt[data-key="body"]').count(), 0);
  let last = await previewPixels(page);
  for (const [tab, keys] of [['face', ['skin', 'hair', 'style', 'beard']], ['kit', ['hoodie', 'jeans', 'glasses']]]) {
    await page.click(`.tab[data-page="${tab}"]`); await page.waitForTimeout(50);
    for (const key of keys) {
      const values = await page.locator(`.opt[data-key="${key}"]`).evaluateAll((els) => els.map((e) => e.dataset.value));
      const pressed = await page.locator(`.opt[data-key="${key}"][aria-pressed="true"]`).getAttribute('data-value');
      for (const v of values.filter((v) => v !== pressed)) {
        await page.click(`.opt[data-key="${key}"][data-value="${v}"]`); await page.waitForTimeout(30);
        const now = await previewPixels(page);
        assert.notEqual(now, last, `${key} = ${v} changes the preview`); last = now;
      }
      if (['style', 'beard', 'glasses'].includes(key)) {
        const thumbs = await page.locator(`.opt[data-key="${key}"] canvas`).evaluateAll((cs) => cs.map((c) => c.getContext('2d').getImageData(0, 0, c.width, c.height).data.join(',')));
        assert.ok(thumbs.length >= 2 && thumbs.every((t) => /[1-9]/.test(t)), `${key}: thumbnails are drawn`);
        for (let i = 1; i < thumbs.length; i++) assert.notEqual(thumbs[i], thumbs[i - 1], `${key}: thumbnail ${i} differs from its neighbour`);
        assert.deepEqual(await page.locator(`.opt[data-key="${key}"] canvas`).first().evaluate((c) => [c.width, c.height]), [40, 44]);
      }
    }
  }
  const before = JSON.stringify(await page.evaluate(() => window.__oq.creator.hero));
  let changed = false; for (let i = 0; i < 5 && !changed; i++) { await page.click('#btn-random'); changed = JSON.stringify(await page.evaluate(() => window.__oq.creator.hero)) !== before; }
  assert.ok(changed, 'Random');
  await page.click('#btn-start-game'); await page.click('#btn-skip');
  await page.waitForFunction(() => document.body.dataset.screen === 'MENU');
  assert.deepEqual(page.errors, []);
  await ctx.close();
});
for (const [w, h] of PHONES) {
  test(`${w}x${h}: nothing in the creator overflows`, async () => {
    const { ctx, page } = await openCreator({ viewport: { width: w, height: h } });
    for (const tab of ['face', 'kit']) {
      await page.click(`.tab[data-page="${tab}"]`);
      const bad = await page.evaluate(([W, H]) => [...document.querySelectorAll('.opt, .tab, #name-btn, #btn-random, #btn-start-game, #hero-view, .sheet-label')].map((el) => [el.id || el.className, el.getBoundingClientRect()]).filter(([, r]) => r.left < -0.5 || r.top < 19.5 || r.right > W + 0.5 || r.bottom > H + 0.5).map(([n, r]) => `${n} ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.right)},${Math.round(r.bottom)}`), [w, h]);
      assert.deepEqual(bad, [], tab);
      const clipped = await page.evaluate(() => { const c = document.querySelector('#hero-view'), f = document.querySelector('.frame-inner'), r = c.getBoundingClientRect(), fr = f.getBoundingClientRect(); return r.top >= fr.top - 1 && r.bottom <= fr.bottom + 1; });
      assert.ok(clipped, 'the preview fits its frame top to bottom');
    }
    await ctx.close();
  });
}

test('a room: walking right shows the four side frames in order and he ends facing us; walking left is their mirror; his last row is on his floor row; heroBox matches the drawn pixels', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=2' });
  await into(2, page);
  const start = await ch(page), y = start.y;
  await floorTap(page, start.x - 50, y);                                               // left, but not so far that his box leaves the canvas
  await page.waitForFunction(() => window.__oq.chapter.walking === true);
  const seen = [], flips = new Set();
  for (let i = 0; i < 60 && await page.evaluate(() => window.__oq.chapter.walking); i++) {
    const s = await page.evaluate(() => ({ pose: window.__oq.chapter.pose, flip: window.__oq.chapter.flip, view: window.__oq.chapter.view }));
    if (s.pose === 'idle' || s.pose === 'stand') { await page.waitForTimeout(20); continue; }   // the plan is set before its first step; the settle holds the stance
    seen.push(s.pose); flips.add(s.flip);
    assert.equal(s.view, 'side');
    await page.waitForTimeout(40);
  }
  const bodies = [...new Set(seen)];
  assert.ok(bodies.length >= 3 && bodies.every((b) => SIDE.includes(b)), `side bodies seen: ${bodies}`);
  for (let i = 1; i < seen.length; i++) if (seen[i] !== seen[i - 1]) assert.equal(SIDE.indexOf(seen[i]), (SIDE.indexOf(seen[i - 1]) + 1) % 4, `in order: ${seen[i - 1]} → ${seen[i]}`);
  assert.deepEqual([...flips], [true], 'walking left is mirrored');
  await settle(page);
  assert.deepEqual(await page.evaluate(() => [window.__oq.chapter.view, window.__oq.chapter.pose]), ['front', 'idle'], 'he ends facing us');
  // the drawn box: its bottom on his floor row, its pixels where heroBox says, nothing of him outside it
  const { b, px } = await heroPixels(page), pos = await ch(page);
  assert.equal(b.y + b.h, pos.y, 'his last row is the row above his floor row');
  assert.equal(b.x + b.ax, pos.x, 'the anchor\'s column is on his x');
  const fig = scaleFigure(composeFigure(DEFAULT_HERO, 'front'), heroScaleAt(CHAPTERS[2].room, pos.y));
  assert.deepEqual([b.w, b.h], [fig.w, fig.h]);
  assert.ok(await matches(page, fig, b.x, b.y) > 0.97, 'the box holds the painted figure at this scale');
  // walking right: the same bodies, not mirrored
  await floorTap(page, start.x, y);
  await page.waitForFunction(() => window.__oq.chapter.walking === true);
  const right = new Set();
  for (let i = 0; i < 40 && await page.evaluate(() => window.__oq.chapter.walking); i++) { right.add(JSON.stringify(await page.evaluate(() => [window.__oq.chapter.pose, window.__oq.chapter.flip]))); await page.waitForTimeout(40); }
  for (const s of right) { const [pose, flip] = JSON.parse(s); assert.ok(SIDE.includes(pose) || pose === 'idle' || pose === 'stand', pose); assert.equal(flip, false); }
  await settle(page);
  assert.deepEqual(page.errors, []);
  await ctx.close();
});

test('the mark is on his chest when he faces us, and the same pixels after a walk to the left as after a walk to the right', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await into(1, page);
  const start = await ch(page), spotX = start.x - 40, y = start.y;
  await floorTap(page, spotX, y); await settle(page);
  const a = await heroPixels(page), at = await ch(page);
  const fig = scaleFigure(composeFigure(DEFAULT_HERO, 'front'), heroScaleAt(CHAPTERS[1].room, at.y));
  assert.ok(await matches(page, fig, a.b.x, a.b.y) > 0.97, 'the painted front figure, with its mark');
  const mark = MANIFEST.mark, full = composeFigure(DEFAULT_HERO, 'front'), blue = [2, 152, 236];
  const hasBlue = await page.evaluate(([b, m]) => { const g = document.querySelector('#scene').getContext('2d'), d = g.getImageData(b.x, b.y, b.w, b.h).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] === m[0] && d[i + 1] === m[1] && d[i + 2] === m[2]) n++; return n; }, [a.b, blue]);
  assert.ok(hasBlue >= 4, `the mark's blue is on his chest (${hasBlue} px)`);
  assert.ok(full.ax + mark.dx > 0 && full.ay + mark.dy > 0);
  await floorTap(page, spotX - 40, y); await settle(page);
  await floorTap(page, spotX, y); await settle(page);
  const b = await heroPixels(page);
  assert.deepEqual(b.b, a.b); assert.equal(b.px, a.px, 'the same pixels whichever way he walked there');
  await ctx.close();
});

test('room 5: a walk straight up the room uses the away frames and ends on his back for a beat; the pinball machine leaves him smaller', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=5' });
  await into(5, page);
  const h0 = (await heroBox(page)).h, start = await ch(page);
  // further up than across is a walk away from us (brief 15 C); the pinball machine's own leg is 67 across and 57 up, a side walk by that rule
  await floorTap(page, start.x + 4, start.y - 50);
  await page.waitForFunction(() => window.__oq.chapter.walking === true);
  const views = new Set(), poses = new Set(); let held = null;
  for (let i = 0; i < 80 && await page.evaluate(() => window.__oq.chapter.walking); i++) {
    const s = await page.evaluate(() => ({ view: window.__oq.chapter.view, pose: window.__oq.chapter.pose, flip: window.__oq.chapter.flip })); views.add(s.view); poses.add(s.pose);
    assert.equal(s.flip, false, 'toward and away are never mirrored');
    if (s.pose === 'back' && s.view === 'back') held = s;
    await page.waitForTimeout(30);
  }
  assert.ok(views.has('back'), `he walks away from us (${[...views]})`);
  assert.ok([...poses].some((p) => AWAY.includes(p)), `away frames: ${[...poses]}`);
  await page.waitForFunction(() => window.__oq.chapter.walking === false, null, { timeout: 9000 });
  const heldBack = await page.evaluate(() => [window.__oq.chapter.pose, window.__oq.chapter.view]);
  assert.ok(heldBack[0] === 'back' || heldBack[0] === 'idle', `held on his back, then front: ${heldBack}`);
  await settle(page);
  assert.ok((await heroBox(page)).h < h0, 'smaller a little further back');
  await tapSpot(page, 'pinball');
  await winOpen(page);
  const hb = await heroBox(page), pos = await ch(page);
  assert.equal(hb.y + hb.h, pos.y); assert.ok(hb.h < h0 - 20, `smaller at the back: ${hb.h} vs ${h0}`);
  assert.deepEqual([pos.x, pos.y], [238, 134]);
  await ctx.close();
});

test('the intro: he sits up in pale blue pyjamas with nothing of him below the blanket line; stands in pyjamas; the heap in his colours; then dressed', async () => {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  await windowed(ctx);
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', (e) => errors.push(e));
  await page.goto(server.baseURL, { waitUntil: 'load' }); await page.waitForFunction(() => window.__oq?.ready === true);
  await page.click('#btn-start'); await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR'); await page.waitForTimeout(400);
  await page.click('#btn-start-game');
  await page.waitForFunction(() => window.__oq.intro?.loaded === true);
  const tap = async () => { const b = await page.locator('#scene').boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); };
  for (let i = 0; i < 8; i++) { await page.waitForTimeout(300); await tap(); }
  await page.waitForFunction(() => window.__oq.intro.id === 'bedroom' && window.__oq.intro.hero?.pose === 'situp' && window.__oq.intro.hero.box);
  const sit = await page.evaluate(() => ({ ...window.__oq.intro.hero }));
  const pale = await page.evaluate((b) => { const d = document.querySelector('#scene').getContext('2d').getImageData(b.x, b.y, b.w, b.h).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 2] > d[i] + 20 && d[i + 2] > 180 && d[i + 1] > 150) n++; return n; }, sit.box);
  assert.ok(pale > 40, `pale blue pyjamas (${pale} px)`);
  const below = await page.evaluate(async ([line, box]) => {
    const m = window.__oq.intro.manifest, g = document.querySelector('#scene').getContext('2d');
    const img = new Image(); img.src = 'assets/intro/' + m.images.D_bedroom_vga; await img.decode();
    const c = document.createElement('canvas'); c.width = 320; c.height = 200; const p = c.getContext('2d'); p.drawImage(img, 0, 0, 320, 200);
    let n = 0; for (let y = line + 1; y <= 170; y++) for (let x = box.x; x < box.x + box.w; x++) { const a = g.getImageData(x, y, 1, 1).data, b = p.getImageData(x, y, 1, 1).data; if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]) n++; }
    return n;
  }, [sit.blanketLine, sit.box]);
  assert.equal(below, 0, 'below the blanket line the canvas is the plate: the cut at his waist never shows');
  await page.waitForFunction(() => window.__oq.intro.hero?.pose === 'idle' && window.__oq.intro.hero.outfit === 'pj', null, { timeout: 8000 });
  const stand = await page.evaluate(() => ({ ...window.__oq.intro.hero }));
  assert.equal(stand.pile, true);
  const m = await page.evaluate(() => window.__oq.intro.manifest);
  const heap = await page.evaluate(([x, y]) => { const d = document.querySelector('#scene').getContext('2d').getImageData(x + 20, y - 24, 60, 24).data; const cols = new Set(); for (let i = 0; i < d.length; i += 4) cols.add(`${d[i]},${d[i + 1]},${d[i + 2]}`); return [...cols]; }, [m.clothes.x, m.clothes.y]);
  assert.ok(heap.includes('43,54,71') || heap.some((c) => { const [r, g, b] = c.split(',').map(Number); return b > r + 10 && b > 50 && b < 120; }), `the heap is in his hoodie's ink and his jeans' indigo (${heap.length} colours)`);
  await page.waitForFunction(() => window.__oq.intro.hero?.outfit === 'hoodie' && window.__oq.intro.hero.pose === 'idle', null, { timeout: 6000 });
  assert.equal((await page.evaluate(() => window.__oq.intro.hero.pile)), false);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('with hero.png blocked, the creator and a room still work and no error is thrown', async () => {
  const { ctx, page } = await openCreator({}, (p) => p.route('**/assets/hero/hero.png', (r) => r.abort()));
  await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => window.__oq.heroReady), false);
  assert.equal(await page.locator('.sheet-row').count(), 4);
  assert.equal(await previewPixels(page), new Array(56 * 148 * 4).fill(0).join(','), 'no hero is drawn');
  await page.click('.opt[data-key="style"][data-value="fro"]');
  await page.click('#btn-start-game'); await page.click('#btn-skip');
  await page.waitForFunction(() => document.body.dataset.screen === 'MENU'); await page.waitForTimeout(400);
  await page.click('.menu-row[data-ch="1"]');
  await page.waitForFunction(() => document.body.dataset.screen === 'CHAPTER' && window.__oq.chapter?.state === 'card');
  await page.click('#class-card'); await dismiss(page);
  await floorTap(page, 60, 190); await page.waitForTimeout(800);
  const hb = await heroBox(page);
  assert.ok(hb.w > 0 && hb.h > 0, 'a nominal box without the sheet');
  assert.deepEqual(page.errors, []);
  await ctx.close();
});
