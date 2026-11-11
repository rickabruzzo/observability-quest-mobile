import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

async function openCreator(opts = {}, init = null) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { throw e; });
  if (init) await page.addInitScript(init);
  await page.goto(server.baseURL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true);
  await page.click('#btn-start');
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  await page.waitForTimeout(400); // past the double-tap guard, like a person would be
  return { ctx, page };
}
const hero = (page) => page.evaluate(() => window.__oq.creator.hero);

test('sheet: 5 FACE rows, 5 KIT rows, every option 44px+, hero drawn', async () => {
  const { ctx, page } = await openCreator();
  assert.equal(await page.locator('.sheet-row').count(), 5);
  const boxes = await page.locator('.opt').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => [r.width, r.height]));
  assert.ok(boxes.every(([w, h]) => w >= 44 && h >= 44), JSON.stringify(boxes.filter(([w, h]) => w < 44 || h < 44)));
  assert.equal(boxes.length, 3 + 4 + 5 + 5 + 3); // body, skin, hair colour, hair, beard
  await page.click('.tab[data-page="kit"]');
  assert.equal(await page.locator('.sheet-row').count(), 5); // name row + hoodie, jeans, glasses, holding
  const painted = await page.evaluate(() => {
    const c = document.querySelector('#hero-view'); const d = c.getContext('2d').getImageData(0, 0, 28, 72).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n;
  });
  assert.ok(painted > 600, `painted ${painted}`);
  await ctx.close();
});

test('picking updates state and the pressed marker; the beard follows the hair colour', async () => {
  const { ctx, page } = await openCreator();
  await page.click('.opt[data-key="hair"][data-value="ginger"]');
  await page.click('.opt[data-key="style"][data-value="fro"]');
  await page.click('.opt[data-key="beard"][data-value="long"]');
  const h = await hero(page);
  assert.equal(h.hair, 'ginger'); assert.equal(h.style, 'fro'); assert.equal(h.beard, 'long');
  assert.ok(!('beardCol' in h));
  assert.equal(await page.locator('.opt[data-key="style"][data-value="fro"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.opt[data-key="style"][data-value="standard"]').getAttribute('aria-pressed'), 'false');
  await ctx.close();
});

test('preset buttons replace appearance; RANDOM changes something', async () => {
  const { ctx, page } = await openCreator();
  await page.click('.opt[data-key="body"][data-value="fem"]');
  assert.equal((await hero(page)).hoodie, 'honey');
  const before = JSON.stringify(await hero(page));
  let changed = false;
  for (let i = 0; i < 5 && !changed; i++) { await page.click('#btn-random'); changed = JSON.stringify(await hero(page)) !== before; }
  assert.ok(changed);
  await ctx.close();
});

test('name sheet cleans input and shows on the button', async () => {
  const { ctx, page } = await openCreator();
  await page.click('.tab[data-page="kit"]');   // the name lives on the KIT page
  await page.click('#name-btn');
  await page.click('#name-btn').catch(() => {}); // a second tap while the sheet is open is ignored
  assert.equal(await page.locator('#name-sheet').count(), 1);
  await page.fill('#name-sheet input', '  Ada\u0007 Lovelace of the Night Shift  ');
  await page.click('#name-sheet button');
  assert.equal(await page.locator('#name-sheet').count(), 0);
  assert.equal((await hero(page)).name, 'Ada Lovelace of');
  assert.equal(await page.locator('#name-btn').innerText(), 'Ada Lovelace of');
  await ctx.close();
});

test('START persists and (past the intro) goes to PREVIEW; reload keeps the hero', async () => {
  const { ctx, page } = await openCreator();
  await page.click('.tab[data-page="kit"]');
  await page.click('.opt[data-key="hoodie"][data-value="lime"]');
  await page.click('#btn-start-game');
  await page.click('#btn-skip');
  await page.waitForFunction(() => document.body.dataset.screen === 'PREVIEW');
  assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('oq.hero')).hoodie), 'lime');
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true);
  await page.click('#btn-start');
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  assert.equal((await hero(page)).hoodie, 'lime');
  await ctx.close();
});

test('storage throwing does not break the creator or START', async () => {
  const { ctx, page } = await openCreator({}, () => { Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('denied'); } }); });
  await page.click('.opt[data-key="skin"][data-value="3"]');
  assert.equal((await hero(page)).skin, 3);
  await page.click('#btn-start-game');
  await page.click('#btn-skip');
  await page.waitForFunction(() => document.body.dataset.screen === 'PREVIEW');
  await ctx.close();
});

test('corrupt stored hero is sanitised', async () => {
  const { ctx, page } = await openCreator({}, () => { sessionStorage.setItem('oq.hero', '{"body":"robot","hoodie":"lime","name":42'); });
  const h = await hero(page);
  assert.equal(h.body, 'masc'); assert.equal(h.name, '');
  await ctx.close();
});

for (const [w, h] of [[667, 375], [800, 360], [844, 390], [932, 430]]) {
  test(`${w}x${h}: every sheet control is a 44px target fully inside the viewport, on both pages`, async () => {
    const { ctx, page } = await openCreator({ viewport: { width: w, height: h } });
    for (const tab of ['face', 'kit']) {
      await page.click(`.tab[data-page="${tab}"]`);
      const bad = await page.evaluate(([W, H]) => {
        const out = [];
        for (const el of document.querySelectorAll('.opt, .tab, #name-btn, #btn-random, #btn-start-game, #hero-view')) {
          const r = el.getBoundingClientRect();
          const target = el.id !== 'hero-view';
          if (r.left < -0.5 || r.top < 19.5 || r.right > W + 0.5 || r.bottom > H + 0.5) out.push(`${el.id || el.className} off-screen ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.right)},${Math.round(r.bottom)}`);
          if (target && (r.width < 44 || r.height < 44)) out.push(`${el.id || el.className} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
        return out;
      }, [w, h]);
      assert.deepEqual(bad, [], `${tab} page`);
    }
    await ctx.close();
  });
}

for (const [w, h] of [[1700, 1100], [1280, 800], [1240, 1044]]) {
  test(`the sheet scales up on a ${w}x${h} desktop window: hero whole in its frame, rows use the width`, async () => {
    const { ctx, page } = await openCreator({ viewport: { width: w, height: h }, hasTouch: false, isMobile: false });
    const m = await page.evaluate(() => {
      const r = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
      const opts = [...document.querySelectorAll('.opt')].map((e) => e.getBoundingClientRect());
      return { hero: r('#hero-view'), inner: r('.frame-inner'), scene: r('#scene-box'), right: Math.max(...opts.map((b) => b.right)), bottom: Math.max(...opts.map((b) => b.bottom)) };
    });
    assert.ok(Math.abs(m.hero.w / m.hero.h - 28 / 72) < 0.02, `hero stretched: ${JSON.stringify(m.hero)}`);
    // the sprite's empty side margins may tuck under the frame (as on a phone); the figure itself must not
    assert.ok(m.hero.w <= m.inner.w * 1.15 && m.hero.h <= m.inner.h + 1 && m.hero.y >= m.inner.y - 1, `hero does not fit its frame: ${JSON.stringify(m)}`);
    assert.ok(m.right > m.scene.x + m.scene.w * 0.6, `rows huddle in the corner: ${JSON.stringify(m)}`);
    assert.ok(m.right <= m.scene.x + m.scene.w + 1 && m.bottom <= m.scene.y + m.scene.h + 1, `rows overflow: ${JSON.stringify(m)}`);
    await ctx.close();
  });
}
