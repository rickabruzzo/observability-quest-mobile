// Brief 14: the feedback art in the game, in a browser. Room 2's theories on the board and the wiped board after the
// fix; room 3's products cycling in colour and the stuck southpaw; room 4's battle inside its map, and the phone;
// the old tools' marks; the hero facing the same way whichever way he walked.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { startServer } from './_server.js';
import { SCRIPT } from '../../js/script.js';
import { CHAPTERS } from '../../js/chapters/index.js';
import { THEORIES } from '../../js/chapters/ch2-wall.js';
import { PHONE } from '../../js/chapters/ch4.js';
import { openGame, ch, dismiss, tapSpot, inState, pcPick, toolOpen, prompt, promptsShown, winOpen } from './_play.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

const PHONES = [[844, 390], [667, 375]];
const PIC = { x: 4, y: 20, w: 188, h: 176 };
const spot = (n, what) => CHAPTERS[n].room.hotspots.find((h) => (what === 'persona' ? h.use?.action === 'persona' : h.use?.scene === what)).id;
const into = async (n, page) => { await page.click('#class-card'); assert.equal(await dismiss(page), SCRIPT[CHAPTERS[n].enter]); };
const toPc = async (n, page) => { await tapSpot(page, spot(n, 'pc')); await inState(page, 'pc'); };
const toWall = async (n, page) => { await tapSpot(page, spot(n, 'wall')); assert.equal(await dismiss(page), SCRIPT[CHAPTERS[n].wall.chart]); assert.equal((await ch(page)).state, 'wall'); };
async function solveHc(n, page) {
  const c = CHAPTERS[n];
  await pcPick(page, c.pc.menu.find((i) => i.tool === 'hc').id); await toolOpen(page, 'hc');
  assert.equal(await dismiss(page), SCRIPT[c.tools.hc.intro]);
  for (const step of c.tools.hc.steps) { await prompt(page, 0); assert.equal(await dismiss(page), SCRIPT[step.result]); }
  await inState(page, 'pc');
}
/** Deploys the fix and stops on the recovering close-up (the display is fixed; its line is not yet dismissed). */
async function deployToRecover(n, page) {
  await pcPick(page, 'deploy'); assert.equal(await dismiss(page), SCRIPT[CHAPTERS[n].pc.deploy.line]);
  await page.waitForFunction(() => window.__oq.chapter.state === 'recover', null, { timeout: 9000 });
}
const px = (page, x, y) => page.evaluate(([x, y]) => [...document.querySelector('#scene').getContext('2d').getImageData(x, y, 1, 1).data].slice(0, 3).join(','), [x, y]);
const region = (page, r) => page.evaluate((q) => [...document.querySelector('#scene').getContext('2d').getImageData(q.x, q.y, q.w, q.h).data].join(','), r);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',');
/** A DOM box in scene pixels. */
const sceneBox = (page, sel) => page.evaluate((s) => { const el = document.querySelector(s), sc = document.querySelector('#scene').getBoundingClientRect(), r = el.getBoundingClientRect(), k = sc.width / 320; return { x0: (r.left - sc.left) / k, x1: (r.right - sc.left) / k, y0: (r.top - sc.top) / k, y1: (r.bottom - sc.top) / k }; }, sel);
/** A sprite's pixels from a sheet, decoded in the page: [[x, y, 'r,g,b'], …] for its opaque pixels. */
const spritePixels = (page, manifestUrl, name) => page.evaluate(async ([url, n]) => {
  const m = await (await fetch(url)).json(), sp = m.sprites[n], img = new Image();
  await new Promise((ok, fail) => { img.onload = ok; img.onerror = fail; img.src = url.slice(0, url.lastIndexOf('/') + 1) + m.images[sp.image]; });
  const c = document.createElement('canvas'); c.width = sp.w; c.height = sp.h; const g = c.getContext('2d'); g.drawImage(img, sp.x, sp.y, sp.w, sp.h, 0, 0, sp.w, sp.h);
  const d = g.getImageData(0, 0, sp.w, sp.h).data, out = [];
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] === 255) out.push([(i / 4) % sp.w, Math.floor(i / 4 / sp.w), `${d[i]},${d[i + 1]},${d[i + 2]}`]);
  return out;
}, [manifestUrl, name]);
/** How many of a sprite's opaque pixels the scene shows at (x, y). */
const matches = (page, pixels, x, y) => page.evaluate(([pix, x, y]) => {
  const g = document.querySelector('#scene').getContext('2d');
  let n = 0;
  for (const [dx, dy, rgb] of pix) { const d = g.getImageData(x + dx, y + dy, 1, 1).data; if (`${d[0]},${d[1]},${d[2]}` === rgb) n++; }
  return n / pix.length;
}, [pixels, x, y]);

// ---- B. room 2 ----
for (const [w, h] of PHONES) {
  test(`${w}x${h} room 2: the board, a ring and its words per tap, the words inside the board; the wiped board after the fix with the new theory above and below the path`, async () => {
    const { ctx, page } = await openGame(browser, server, { w, h, query: '?ch=2' });
    await into(2, page); await toWall(2, page);
    assert.equal(await page.evaluate(() => window.__oq.chapter.wall.image), 'R2_board');
    await page.waitForTimeout(150);
    const red = hex('#C81E1E');
    const ringTop = (i) => [THEORIES[i].ring.cx, THEORIES[i].ring.cy - THEORIES[i].ring.ry];
    assert.equal(await px(page, ...ringTop(0)), red, 'theory 1\'s ring is on the board from the start');
    assert.notEqual(await px(page, ...ringTop(1)), red, 'theory 2\'s is not yet');
    assert.equal(await px(page, THEORIES[0].marks.x + 2, THEORIES[0].marks.y), red, 'its ??? is there (the first ? glyph\'s top-centre pixel)');
    const words = () => page.locator('.wall-box[data-id="theory"]').innerText();
    assert.equal((await words()).replace(/\s+/g, ' '), SCRIPT['ch2.wall.stat.1'].replace(' / ', ' '));
    const box = await sceneBox(page, '.wall-box[data-id="theory"]'), b = CHAPTERS[2].wall.close.board;
    assert.ok(box.x0 >= b.x0 - 0.5 && box.x1 <= b.x1 + 1.5 && box.y0 >= b.y0 - 0.5 && box.y1 <= b.y1 + 1.5, `the words lie inside the board: ${JSON.stringify(box)}`);
    const spill = await page.evaluate(() => [...document.querySelectorAll('.wall-box[data-id="theory"] .fit')].some((s) => s.scrollWidth > s.clientWidth + 1));
    assert.equal(spill, false, 'the words wrap inside the box rather than running out of it');
    const sc = await page.locator('#scene').boundingBox();
    const tapBoard = () => page.mouse.click(sc.x + (160 / 320) * sc.width, sc.y + (120 / 200) * sc.height);
    await tapBoard(); await page.waitForTimeout(150);
    assert.equal(await px(page, ...ringTop(1)), red, 'a tap adds the next ring');
    assert.equal(await px(page, ...ringTop(0)), red, 'and the first stays');
    assert.equal((await words()).replace(/\s+/g, ' '), SCRIPT['ch2.wall.stat.2'].replace(' / ', ' '));
    assert.equal((await ch(page)).state, 'wall', 'a tap on the board is not a tap off the glass');
    for (let i = 0; i < 5; i++) { await tapBoard(); await page.waitForTimeout(60); }
    await page.waitForTimeout(150);
    for (let i = 0; i < 6; i++) assert.equal(await px(page, ...ringTop(i)), red, `after six taps ring ${i + 1} stays`);
    await page.click('#btn-back'); await inState(page, 'room');
    await toPc(2, page); await solveHc(2, page); await deployToRecover(2, page);
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.__oq.chapter.wall.image), 'R2_board_wiped');
    assert.equal(await page.locator('.wall-box[data-id="theory"]').count(), 0);
    const [l1, l2] = [await sceneBox(page, '.wall-box[data-id="band1"]'), await sceneBox(page, '.wall-box[data-id="band2"]')];
    assert.equal(await page.locator('.wall-box[data-id="band1"]').innerText(), 'THEORY 7'); assert.equal(await page.locator('.wall-box[data-id="band2"]').innerText(), 'NODE 17');
    assert.ok(l1.y1 <= 98.5 && l2.y0 >= 115.5, `above and below the path (y ≈ 105): ${JSON.stringify([l1, l2])}`);
    assert.notEqual(await px(page, ...ringTop(0)), red, 'no rings on the wiped board');
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });
}

// ---- C. room 3 ----
test('room 3: each product in turn in colour, then the southpaw with the bar at 13 %; the words never over the picture; the covers hold still in the room', async () => {
  const { ctx, page } = await openGame(browser, server, { w: 844, h: 390, query: '?ch=3' });
  await into(3, page);
  // in the room first: her fingertips (persona.covers) do not change while the page cycles
  const covers = CHAPTERS[3].persona.covers, grab = async () => (await Promise.all(covers.map((c) => region(page, c)))).join('|');
  const a = await grab(); await page.waitForTimeout(1300); assert.equal(await grab(), a, 'nothing changes where she stands in front of the TV');
  const roomPic = CHAPTERS[3].wall.room.picture, smallUke = await spritePixels(page, 'assets/rooms/ch3.json', 'product_ukulele_small');
  await page.waitForFunction(() => window.__oq.chapter.wall.frame?.product === 'ukulele', null, { timeout: 15000 });
  assert.ok(await matches(page, smallUke, roomPic.x, roomPic.y) > 0.9, 'the small ukulele shows on the TV in the room');
  await toWall(3, page);
  const pic = CHAPTERS[3].wall.close.picture, tag = CHAPTERS[3].wall.close.tag;
  for (const [n, name] of ['ukulele', 'banjo', 'acoustic', 'bass'].entries()) {
    const pixels = await spritePixels(page, 'assets/rooms/ch3.json', `product_${name}`);
    assert.ok(pixels.every(([x, y]) => !(pic.x + x >= tag.x0 && pic.x + x <= tag.x1 && pic.y + y >= tag.y0 && pic.y + y <= tag.y1)), `${name} leaves the tag's corner empty`);
    await page.waitForFunction((p) => window.__oq.chapter.wall.frame?.product === p && window.__oq.chapter.wall.frame?.phase === 'browse', name, { timeout: 16000 });
    await page.waitForTimeout(120);
    assert.ok(await matches(page, pixels, pic.x, pic.y) > 0.9, `the ${name} is on the page`);
    assert.equal(await page.locator('.wall-box[data-id="progress"]').innerText(), SCRIPT['ch3.wall.shop']);
    const [pname, price] = SCRIPT[`ch3.wall.product.${n + 1}`].split(' / ');
    assert.deepEqual(await page.locator('.wall-box[data-id="tag"] .fit').allInnerTexts(), [pname, price]);
    const t = await sceneBox(page, '.wall-box[data-id="tag"]');
    assert.ok(t.x0 >= tag.x0 - 0.5 && t.x1 <= tag.x1 + 1.5 && t.y0 >= tag.y0 - 0.5 && t.y1 <= tag.y1 + 1.5, JSON.stringify(t));
  }
  const southpaw = await spritePixels(page, 'assets/rooms/ch3.json', 'product_southpaw');
  await page.waitForFunction(() => window.__oq.chapter.wall.frame?.phase === 'stuck', null, { timeout: 16000 });
  await page.waitForTimeout(120);
  assert.ok(await matches(page, southpaw, pic.x, pic.y) > 0.9, 'the southpaw is on the page');
  assert.equal(await page.evaluate(() => window.__oq.chapter.wall.frame.progress), 0.13);
  assert.equal(await page.locator('.wall-box[data-id="progress"]').innerText(), SCRIPT['ch3.wall.progress']);
  assert.equal(await page.evaluate(() => document.querySelector('.wall-box[data-id="progress"]').className), 'wall-box page left', 'the header is laid out again as the bar once the visit moves on');
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.wall-box[data-id="progress"]')).color), 'rgb(43, 47, 54)', 'in the page\'s ink, not the shop\'s pale');
  assert.deepEqual(await page.locator('.wall-box[data-id="tag"] .fit').allInnerTexts(), SCRIPT['ch3.wall.cart'].split(' / '));
  const p = CHAPTERS[3].wall.close.progress, filled = Math.round((p.x1 - p.x0 - 1) * 0.13);
  assert.equal(await px(page, p.x0 + filled - 1, p.y0 + 3), hex('#A9CBFF'), 'the bar is filled to 13 %');
  assert.notEqual(await px(page, p.x0 + filled + 3, p.y0 + 3), hex('#A9CBFF'));
  assert.equal(await px(page, CHAPTERS[3].wall.close.small[0].x0 + 2, CHAPTERS[3].wall.close.small[0].y0 + 5), hex('#C0392B'), 'a red tab on a small box while broken');
  assert.deepEqual(page.errors, []);
  await ctx.close();
});

// ---- D, E, G. room 4 ----
test('room 4: the map changes frame to frame and nothing outside it does; the phone shows the plate, the name on its bar and a ring round the button; the mark and the health line', async () => {
  const { ctx, page } = await openGame(browser, server, { w: 844, h: 390, query: '?ch=4' });
  await into(4, page); await toWall(4, page);
  const m = CHAPTERS[4].wall.close, map = { x: m.map.x0, y: m.map.y0, w: m.map.x1 - m.map.x0 + 1, h: m.map.y1 - m.map.y0 + 1 };
  const outside = [{ x: 0, y: 0, w: 320, h: m.map.y0 }, { x: 0, y: m.map.y1 + 1, w: 320, h: 200 - m.map.y1 - 1 }, { x: 0, y: 0, w: m.map.x0, h: 200 }, { x: m.map.x1 + 1, y: 0, w: 320 - m.map.x1 - 1, h: 200 }];
  const outsidePx = async () => (await Promise.all(outside.map((r) => region(page, r)))).join('|');
  const a = await region(page, map), o = await outsidePx();
  let changed = false;
  for (let i = 0; i < 10 && !changed; i++) { await page.waitForTimeout(120); changed = (await region(page, map)) !== a; }
  assert.ok(changed, 'the battle moves');
  assert.equal(await outsidePx(), o, 'nothing outside the map changes because of the battle');
  const mark = await spritePixels(page, 'assets/rooms/ch4.json', 'mark_doggy_dashboards');
  assert.ok(await matches(page, mark, 16, 167) > 0.95, 'Doggy Dashboards\' mark at (16, 167)');
  const ly = Math.round((m.lane.y0 + m.lane.y1) / 2), green = hex('#3CE070');
  for (const x of [34, 35, 36, 37]) assert.notEqual(await px(page, x, ly), green, `no health-line pixel at x ${x}`);
  assert.equal(await px(page, 38, ly), green); assert.equal(await px(page, 200, ly), green);
  const gate = await spritePixels(page, 'assets/rooms/ch4.json', 'gate'), g = { x: m.map.x0 + Math.round(map.w * 0.78) - 11, y: Math.round((m.map.y0 + m.map.y1) / 2) - 11 };
  assert.ok(await matches(page, gate, g.x, g.y) > 0.6, 'the gate sits at 78 % of the map (ships may cross it)');
  await page.click('#btn-back'); await inState(page, 'room');
  // the phone
  await toPc(4, page); await pcPick(page, 'old'); await toolOpen(page, 'old');
  assert.equal(await page.locator('.pc-item img, .tool-title img').count(), 0, 'the phone has no page mark');
  assert.equal(await dismiss(page), SCRIPT['ch4.old.intro']); await promptsShown(page);
  const platePx = await page.evaluate(async () => {
    const img = new Image(); await new Promise((ok) => { img.onload = ok; img.src = 'assets/rooms/R4_phone_closeup.png'; });
    const c = document.createElement('canvas'); c.width = 320; c.height = 200; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    return [[70, 40], [120, 170], [10, 30], [180, 190]].map(([x, y]) => [...g.getImageData(x, y, 1, 1).data].slice(0, 3).join(','));
  });
  for (const [i, [x, y]] of [[70, 40], [120, 170], [10, 30], [180, 190]].entries()) assert.equal(await px(page, x, y), platePx[i], `the plate's pixel at ${x},${y}`);
  const ink = hex(PHONE.ink), nb = PHONE.nameBar;
  const inkInBar = await page.evaluate(([b, ink]) => { const d = document.querySelector('#scene').getContext('2d').getImageData(b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (`${d[i]},${d[i + 1]},${d[i + 2]}` === ink) n++; return n; }, [nb, ink]);
  assert.ok(inkInBar >= 30, `EINAR is dotted on the name's bar (${inkInBar} ink pixels)`);
  let ringSeen = false;
  for (let i = 0; i < 12 && !ringSeen; i++) {
    ringSeen = await page.evaluate(([cx, cy]) => { const g = document.querySelector('#scene').getContext('2d'); for (let r = 12; r <= 20; r++) { const d = g.getImageData(cx + r, cy, 1, 1).data; if (d[1] > 140 && d[0] < 120 && d[2] < 120 && Math.abs(d[1] - d[0]) > 60) return true; } return false; }, [PHONE.button.cx, PHONE.button.cy]);
    if (!ringSeen) await page.waitForTimeout(100);
  }
  assert.ok(ringSeen, 'a green ring round the call button');
  const t1 = await region(page, PIC); await page.waitForTimeout(250);
  assert.notEqual(await region(page, PIC), t1, 'it rings: the picture moves');
  assert.deepEqual(page.errors, []);
  await ctx.close();
});

// ---- G. the marks ----
for (const [w, h] of PHONES) {
  test(`${w}x${h}: in scenarios 1 to 3 the old tool's button and title bar carry that scenario's 128-px mark, left of the words and 60–100 % of the bar; scenario 5 has none`, async () => {
    for (const n of [1, 2, 3, 5]) {
      const { ctx, page } = await openGame(browser, server, { w, h, query: `?ch=${n}` });
      await into(n, page); await toPc(n, page);
      const c = CHAPTERS[n], markName = c.tools.old.mark ?? null;
      const btn = await page.locator('.pc-item[data-id="old"] img').evaluateAll((els) => els.map((e) => ({ src: e.src, nw: e.naturalWidth, nh: e.naturalHeight, h: e.getBoundingClientRect().height })));
      if (!markName) { assert.deepEqual(btn, []); }
      else {
        assert.equal(btn.length, 1); assert.ok(btn[0].src.endsWith(`assets/marks/${markName}.png`)); assert.deepEqual([btn[0].nw, btn[0].nh], [128, 128]);
        assert.ok(Math.abs(btn[0].h - 28 * (await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-scale')) || 1))) < 1, `button mark ${btn[0].h} px tall`);
      }
      assert.equal(await page.locator('.pc-item[data-id="old"]').innerText(), SCRIPT[c.pc.menu.find((i) => i.tool === 'old').key]);
      await pcPick(page, 'old'); await toolOpen(page, 'old');
      const bar = await page.evaluate(() => {
        const t = document.querySelector('.tool-title'), img = t.querySelector('img'), words = t.querySelector('.tool-title-text');
        const r = t.getBoundingClientRect(), wr = words.getBoundingClientRect(), ir = img?.getBoundingClientRect();
        return { barH: r.height, words: words.textContent, img: img ? { src: img.src, nw: img.naturalWidth, nh: img.naturalHeight, h: ir.height, right: ir.right, wordsLeft: wr.left, broken: img.naturalWidth === 0 } : null };
      });
      assert.equal(bar.words, SCRIPT[c.tools.old.title]);
      if (!markName) assert.equal(bar.img, null, 'scenario 5 shows no mark and no broken image');
      else {
        assert.ok(bar.img && bar.img.src.endsWith(`assets/marks/${markName}.png`) && !bar.img.broken, JSON.stringify(bar));
        assert.deepEqual([bar.img.nw, bar.img.nh], [128, 128]);
        assert.ok(bar.img.h >= bar.barH * 0.6 - 0.5 && bar.img.h <= bar.barH + 0.5, `mark ${bar.img.h} of bar ${bar.barH}`);
        assert.ok(bar.img.right <= bar.img.wordsLeft + 0.5, 'wholly left of the words');
      }
      await ctx.close();
    }
  });
}
test('a mark that 404s leaves the title\'s words in place, with no broken-image box', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await page.route('**/assets/marks/*.png', (r) => r.abort());
  await into(1, page); await toPc(1, page); await pcPick(page, 'old'); await toolOpen(page, 'old');
  await page.waitForTimeout(300);
  assert.equal(await page.locator('.tool-title .tool-title-text').innerText(), SCRIPT['ch1.old.title']);
  assert.equal(await page.locator('.tool-title img, .pc-item img').count(), 0, 'the failed mark is gone');
  assert.deepEqual(page.errors, []);
  await ctx.close();
});

// ---- F.2 the hero faces the same way whichever way he walked ----
test('the hero standing at one spot looks the same whether he walked there from the right or from the left', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await into(1, page);
  const sc = await page.locator('#scene').boundingBox();
  const floorTap = (x, y) => page.mouse.click(sc.x + (x / 320) * sc.width, sc.y + (y / 200) * sc.height);
  const settle = async () => { await page.waitForFunction(() => window.__oq.chapter.walking === false, null, { timeout: 9000 }); await page.waitForTimeout(700); };   // past the tap marker
  const start = await ch(page);
  const spotX = start.x - 40, y = start.y;
  await floorTap(spotX, y); await settle();                                           // walked left to the spot
  const at = await ch(page); assert.ok(at.x < start.x, 'he walked left');
  const hb = await page.evaluate(() => window.__oq.chapter.heroBox);
  const a = await region(page, { x: hb.x - 2, y: hb.y - 2, w: hb.w + 4, h: hb.h + 4 });
  await floorTap(spotX - 40, y); await settle();                                      // away, further left
  await floorTap(spotX, y); await settle();                                           // and back, from the left
  const back = await ch(page); assert.deepEqual([back.x, back.y], [at.x, at.y], 'the same spot');
  const hb2 = await page.evaluate(() => window.__oq.chapter.heroBox); assert.deepEqual(hb2, hb);
  assert.equal(await region(page, { x: hb.x - 2, y: hb.y - 2, w: hb.w + 4, h: hb.h + 4 }), a, 'the same pixels: the front view is never mirrored');
  await ctx.close();
});
