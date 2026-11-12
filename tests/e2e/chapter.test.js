// Scenario 1 played in a browser: the shortest path, wrong prompts, the old tool, Look and Help, paging,
// the rotate gate stopping the clock, reduced motion, and the timing summary.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';
import { SCRIPT } from '../../js/script.js';
import { openGame, pickScenario, ch, run, winOpen, dismiss, tapSpot, toolOpen, promptsShown, prompt, playShortest } from './_play.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

const PHONES = [[844, 390], [667, 375]];

for (const [w, h] of PHONES) {
  test(`${w}x${h}: the shortest path scores 100, ends on the summary, and the phases add up`, async () => {
    const { ctx, page } = await openGame(browser, server, { w, h });
    await pickScenario(page);
    await playShortest(page);
    const s = await run(page);
    assert.equal(s.score, 100); assert.equal(s.done, true);
    const sum = Object.values(s.phases).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - s.total) <= 50, `phases ${sum} vs total ${s.total}`);
    assert.ok(s.phases.card > 0 && s.phases.room > 0 && s.phases.hc > 0 && s.phases.win > 0, JSON.stringify(s.phases));
    assert.equal(s.phases.old, 0);
    assert.match(await page.locator('#summary h2').innerText(), /\d+:\d\d/);
    assert.match(await page.locator('#sb-score').innerText(), /Score: 100 of 500/);
    for (const id of ['#btn-claim', '#btn-more', '#btn-copy']) assert.ok(await page.locator(id).isVisible(), id);
    assert.equal(await page.locator('#btn-claim').innerText(), SCRIPT['after.claim']);
    assert.match(await page.locator('#summary').innerText(), new RegExp(SCRIPT['after.prompt'].slice(0, 20)));
    const out = await page.evaluate(() => { const r = document.querySelector('#summary').getBoundingClientRect(), b = document.querySelector('#scene-box').getBoundingClientRect(); return [r.top >= b.top - 1, r.bottom <= b.bottom + 1, document.querySelector('#summary').scrollHeight <= document.querySelector('#summary').clientHeight + 1]; });
    assert.deepEqual(out, [true, true, true], 'summary fits the scene');
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });
}

test('Copy results prints one JSON line to the console', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  const lines = []; page.on('console', (m) => lines.push(m.text()));
  await playShortest(page);
  await page.click('#btn-copy');
  await page.waitForFunction(() => document.querySelector('#btn-copy').textContent === 'Copied');
  const json = lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).find((v) => v?.oq === 'run');
  assert.ok(json, lines.join('\n'));
  assert.equal(json.score, 100); assert.ok(json.total > 0 && json.phases && json.counts);
  await ctx.close();
});

test('one wrong Honeycomb prompt first scores 50; the prompt greys out and cannot be chosen again', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await page.click('#class-card');
  await dismiss(page);
  await tapSpot(page, 'workstation'); await toolOpen(page, 'hc'); await dismiss(page);
  await prompt(page, 2);
  assert.equal(await dismiss(page), SCRIPT['ch1.hc.step1.jab.3']);
  await promptsShown(page);
  assert.equal(await page.locator('.tool-prompts .prompt[data-index="2"]').isDisabled(), true);
  await page.locator('.tool-prompts .prompt[data-index="2"]').click({ force: true });
  await page.waitForTimeout(150);
  assert.equal((await ch(page)).window, null, 'a greyed prompt does nothing');
  assert.equal((await ch(page)).tool.wrong, 1);
  await prompt(page, 0); await dismiss(page);
  await prompt(page, 0); await dismiss(page);
  await dismiss(page); await dismiss(page); await dismiss(page);
  await page.waitForSelector('#summary');
  assert.equal((await run(page)).score, 50);
  assert.equal((await run(page)).counts.wrong, 1);
  assert.match(await page.locator('#sb-score').innerText(), /Score: 50 of 500/);
  await ctx.close();
});

test('the old tool: all three jabs, exit, score unchanged, time recorded under "old tool"', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await page.click('#class-card'); await dismiss(page);
  await tapSpot(page, 'terminal'); await toolOpen(page, 'old');
  assert.equal(await dismiss(page), SCRIPT['ch1.old.intro']);
  for (const i of [0, 1, 2]) {
    await prompt(page, i);
    assert.equal(await dismiss(page), SCRIPT[`ch1.old.jab.${i + 1}`]);
  }
  await promptsShown(page);
  assert.deepEqual(await page.locator('.tool-prompts .prompt[data-index]').evaluateAll((bs) => bs.map((b) => b.disabled)), [true, true, true]);
  await page.click('#tool-exit');
  assert.equal(await dismiss(page), SCRIPT['ch1.old.exit']);
  const s = await run(page);
  assert.equal((await ch(page)).state, 'room');
  assert.equal(s.phase, 'room');
  assert.ok(s.phases.old > 0, JSON.stringify(s.phases));
  assert.equal(s.counts.oldPrompts, 3); assert.equal(s.counts.wrong, 0);
  assert.match(await page.locator('#sb-score').innerText(), /Score: 0 of 500/);
  // and the Honeycomb path afterwards still scores 100: the old tool is free
  await tapSpot(page, 'workstation'); await toolOpen(page, 'hc'); await dismiss(page);
  await prompt(page, 0); await dismiss(page); await prompt(page, 0); await dismiss(page);
  await dismiss(page); await dismiss(page); await dismiss(page);
  await page.waitForSelector('#summary');
  assert.equal((await run(page)).score, 100);
  await ctx.close();
});

test('Look gives the look line from where you stand and returns to Use; Help opens and closes', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await page.click('#class-card'); await dismiss(page);
  assert.equal((await ch(page)).mode, 'use');
  assert.equal(await page.locator('#btn-use').getAttribute('aria-pressed'), 'true');
  await page.click('#btn-look');
  assert.equal((await ch(page)).mode, 'look');
  assert.equal(await page.locator('#btn-look').getAttribute('aria-pressed'), 'true');
  const x0 = (await ch(page)).x;
  await tapSpot(page, 'laptop');
  await winOpen(page);
  const c = await ch(page);
  assert.equal(c.window.text, SCRIPT['ch1.look.laptop']);
  assert.equal(c.mode, 'use'); assert.equal(c.walking, false); assert.equal(c.x, x0);
  await dismiss(page);
  await page.click('#btn-help');
  assert.equal(await dismiss(page), SCRIPT['help.window']);
  const s = await run(page);
  assert.equal(s.counts.looks, 1);
  assert.ok(s.visited.includes('laptop'));
  await ctx.close();
});

test('every hotspot answers: Use on each thing gives its line or opens its screen', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await page.click('#class-card'); await dismiss(page);
  for (const [id, key] of [['laptop', 'ch1.use.laptop'], ['contract', 'ch1.use.contract'], ['wallscreen', 'ch1.look.wallscreen']]) {
    await tapSpot(page, id);
    assert.equal(await dismiss(page), SCRIPT[key], id);
  }
  await page.click('#btn-look'); await tapSpot(page, 'terminal');
  assert.equal(await dismiss(page), SCRIPT['ch1.look.terminal']);
  await page.click('#btn-look'); await tapSpot(page, 'workstation');
  assert.equal(await dismiss(page), SCRIPT['ch1.look.workstation']);
  assert.equal((await run(page)).counts.visited, 5);
  await ctx.close();
});

test('667x375: the long entry line pages, nothing overflows the scene, every target is 44 px', async () => {
  const { ctx, page } = await openGame(browser, server, { w: 667, h: 375, query: '?ch=1' });
  const inScene = (sel) => page.evaluate((s) => {
    const b = document.querySelector('#scene-box').getBoundingClientRect();
    return [...document.querySelectorAll(s)].map((e) => { const r = e.getBoundingClientRect(); return r.left >= b.left - 0.5 && r.right <= b.right + 0.5 && r.top >= b.top - 0.5 && r.bottom <= b.bottom + 0.5 && e.scrollHeight <= e.clientHeight + 1; });
  }, sel);
  assert.ok((await inScene('#class-card')).every(Boolean), 'card');
  await page.click('#class-card');
  await winOpen(page);
  const w = (await ch(page)).window;
  assert.ok(w.pages >= 2, `${w.pages} pages`);
  assert.ok((await inScene('.msg')).every(Boolean), 'window inside the scene');
  assert.ok(await page.locator('.msg .msg-line').count() <= 3, 'three lines on a 375-px phone');
  const shown = [];
  while ((await ch(page)).window) {               // every page fits, and every word of the line is shown
    await page.click('.msg');                      // complete the typing
    if (!(await ch(page)).window) break;
    shown.push((await page.locator('.msg').innerText()).replace(/\s+/g, ' ').trim());
    assert.ok((await inScene('.msg')).every(Boolean));
    await page.click('.msg');
  }
  assert.equal(shown.join(' '), SCRIPT['ch1.room.enter']);
  const small = (sel) => page.locator(sel).evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).filter((r) => r.width < 44 || r.height < 44).map((r) => `${r.width}x${r.height}`));
  assert.deepEqual(await small('#btn-look, #btn-use, #btn-help'), []);
  const W = 667, H = 375;
  const onScreen = await page.locator('#btn-look, #btn-use, #btn-help').evaluateAll((els, [W, H]) => els.every((e) => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= W && r.top >= 20 && r.bottom <= H; }), [W, H]);
  assert.ok(onScreen, 'icon bar fits the right column');
  await tapSpot(page, 'terminal'); await toolOpen(page, 'old'); await dismiss(page); await promptsShown(page);
  assert.deepEqual(await small('.tool-prompts .prompt'), []);
  assert.ok((await inScene('.tool-prompts .prompt')).every(Boolean), 'old-tool prompts inside the scene');
  await page.click('#tool-exit'); await dismiss(page);
  await tapSpot(page, 'workstation'); await toolOpen(page, 'hc'); await dismiss(page); await promptsShown(page);
  assert.deepEqual(await small('.tool-prompts .prompt'), []);
  assert.ok((await inScene('.tool-prompts .prompt')).every(Boolean), 'Honeycomb prompts inside the scene');
  await ctx.close();
});

test('rotate to portrait mid-room: paused, the clock stops, and resumes on rotating back', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await page.click('#class-card'); await dismiss(page);
  await page.waitForTimeout(300);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => window.__oq.paused === true);
  const a = await run(page);
  assert.equal(a.held, true);
  await page.waitForTimeout(800);
  const b = await run(page);
  assert.equal(b.elapsed, a.elapsed, 'the clock moved under the rotate gate');
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForFunction(() => window.__oq.paused === false);
  await page.waitForTimeout(400);
  const c = await run(page);
  assert.equal(c.held, false);
  assert.ok(c.elapsed >= b.elapsed + 300, `${b.elapsed} -> ${c.elapsed}`);
  await ctx.close();
});

test('reduced motion: the hero never walks, text is instant, same result', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1', reduced: true });
  await page.click('#class-card');
  await winOpen(page);
  assert.equal(await page.locator('.msg').innerText().then((t) => t.length > 20), true, 'text typed at once');
  await dismiss(page);
  const x0 = (await ch(page)).x;
  await tapSpot(page, 'workstation');
  const c = await ch(page);
  assert.equal(c.walking, false);
  assert.notEqual(c.x, x0);
  await toolOpen(page, 'hc'); await dismiss(page);
  await prompt(page, 0); await dismiss(page); await prompt(page, 0); await dismiss(page);
  await dismiss(page); await dismiss(page); await dismiss(page);
  await page.waitForSelector('#summary');
  const s = await run(page);
  assert.equal(s.score, 100);
  assert.equal(s.counts.walkMs, 0);
  await ctx.close();
});

test('while a window is open, a floor tap does not walk', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await page.click('#class-card');
  await winOpen(page);
  const sc = await page.locator('#scene').boundingBox();
  const x0 = (await ch(page)).x;
  await page.mouse.click(sc.x + sc.width * 0.05, sc.y + sc.height * 0.95);
  await page.waitForTimeout(300);
  assert.equal((await ch(page)).walking, false);
  assert.equal((await ch(page)).x, x0);
  await ctx.close();
});
