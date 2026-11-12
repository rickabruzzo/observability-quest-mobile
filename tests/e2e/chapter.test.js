// Scenario 1 on its real room, played in a browser: the PC and its menu, Otto's vitals monitor, the CTO's
// decision, both tools, the scores, paging and targets on a small phone, the rotate gate stopping the clock,
// reduced motion, and the timing summary.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';
import { SCRIPT } from '../../js/script.js';
import { openGame, pickScenario, ch, run, winOpen, dismiss, tapSpot, toolOpen, promptsShown, prompt, playShortest, inState, pcPick, toPc, solveHc, leavePc, askCto, winLines } from './_play.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

const PHONES = [[844, 390], [667, 375]];
const into = async (page) => { await page.click('#class-card'); assert.equal(await dismiss(page), SCRIPT['ch1.room.enter']); };
const scen = (page) => page.evaluate(() => window.__oq.chapter.scenario);

for (const [w, h] of PHONES) {
  test(`${w}x${h}: the shortest path (PC → Honeycomb clean → leave → CTO → Get Honeycomb) scores 100 and the phases add up`, async () => {
    const { ctx, page } = await openGame(browser, server, { w, h });
    await pickScenario(page);
    await playShortest(page);
    const s = await run(page);
    assert.equal(s.score, 100); assert.equal(s.done, true);
    const sum = Object.values(s.phases).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - s.total) <= 50, `phases ${sum} vs total ${s.total}`);
    for (const p of ['card', 'room', 'pc', 'hc', 'cto', 'win']) assert.ok(s.phases[p] > 0, `${p}: ${JSON.stringify(s.phases)}`);
    assert.equal(s.phases.old, 0); assert.equal(s.phases.monitor, 0);
    assert.match(await page.locator('#summary h2').innerText(), /\d+:\d\d/);
    assert.match(await page.locator('#sb-score').innerText(), /Score: 100 of 500/);
    assert.equal(await page.locator('#btn-claim').innerText(), SCRIPT['after.claim']);
    const fits = await page.evaluate(() => { const r = document.querySelector('#summary').getBoundingClientRect(), b = document.querySelector('#scene-box').getBoundingClientRect(), e = document.querySelector('#summary'); return r.top >= b.top - 1 && r.bottom <= b.bottom + 1 && e.scrollHeight <= e.clientHeight + 1; });
    assert.ok(fits, 'summary fits the scene');
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });
}

test('the room\'s pictures are loaded before the class card lets go, and the room is the real art', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await page.click('#class-card');
  await winOpen(page);
  assert.equal(await page.evaluate(() => window.__oq.chapter.loaded), true);
  assert.equal(await page.evaluate(() => window.__oq.chapter.state), 'room');
  await ctx.close();
});

test('Copy results prints one JSON line to the console', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  const lines = []; page.on('console', (m) => lines.push(m.text()));
  await playShortest(page);
  await page.click('#btn-copy');
  await page.waitForFunction(() => document.querySelector('#btn-copy').textContent === 'Copied');
  const json = lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).find((v) => v?.oq === 'run');
  assert.ok(json, lines.join('\n'));
  assert.equal(json.score, 100); assert.ok(json.phases.pc > 0 && 'signed' in json.counts);
  await ctx.close();
});

test('one wrong Honeycomb prompt first scores 50; the prompt greys out and cannot be chosen again', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await into(page); await toPc(page); await pcPick(page, 'hc'); await toolOpen(page, 'hc'); await dismiss(page);
  await prompt(page, 2);
  assert.equal(await dismiss(page), SCRIPT['ch1.hc.step1.jab.3']);
  await promptsShown(page);
  assert.equal(await page.locator('.tool-prompts .prompt[data-index="2"]').isDisabled(), true);
  await page.locator('.tool-prompts .prompt[data-index="2"]').click({ force: true });
  await page.waitForTimeout(150);
  assert.equal((await ch(page)).window, null, 'a greyed prompt does nothing');
  await solveHc(page, { intro: false });
  await inState(page, 'pc');
  await leavePc(page); await askCto(page); await page.click('#decide-hc'); await winLines(page);
  assert.equal((await run(page)).score, 50);
  assert.equal((await run(page)).counts.wrong, 1);
  await ctx.close();
});

test('Leave computer is locked before any tool is tried — opening one and backing out does not count — and is never greyed', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await into(page); await toPc(page);
  await pcPick(page, 'leave');
  assert.equal(await dismiss(page), SCRIPT['ch1.pc.leave.locked']);
  assert.equal((await ch(page)).state, 'pc');
  await pcPick(page, 'hc'); await toolOpen(page, 'hc'); await dismiss(page); await promptsShown(page);
  await page.click('#tool-exit');
  await inState(page, 'pc');
  await pcPick(page, 'old'); await toolOpen(page, 'old'); await dismiss(page); await promptsShown(page);
  await page.click('#tool-exit');
  assert.equal(await dismiss(page), SCRIPT['ch1.old.exit']);
  assert.equal(await page.locator('.pc-item[data-id="leave"]').isDisabled(), false);
  await pcPick(page, 'leave');
  assert.equal(await dismiss(page), SCRIPT['ch1.pc.leave.locked'], 'backing out of both tools tried nothing');
  assert.equal((await scen(page)).tried, false);
  await ctx.close();
});

test('the CTO before a tool is tried: her three calls in order, the last one repeats', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await into(page);
  for (const n of [1, 2, 3, 3]) {
    await tapSpot(page, 'cto');
    assert.equal(await dismiss(page), SCRIPT[`ch1.cto.call.${n}`]);
    await inState(page, 'room');
  }
  assert.ok((await run(page)).phases.cto > 0);
  await ctx.close();
});

test('Cave Logs only, then the CTO: Get Honeycomb → "show me" → the investigation opens on the spot → the win', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await into(page); await toPc(page);
  await pcPick(page, 'old'); await toolOpen(page, 'old');
  assert.equal(await dismiss(page), SCRIPT['ch1.old.intro']);
  for (const i of [0, 1, 2]) { await prompt(page, i); assert.equal(await dismiss(page), SCRIPT[`ch1.old.jab.${i + 1}`]); }
  await promptsShown(page);
  assert.deepEqual(await page.locator('.tool-prompts .prompt[data-index]').evaluateAll((bs) => bs.map((b) => b.disabled)), [true, true, true]);
  await page.click('#tool-exit');
  assert.equal(await dismiss(page), SCRIPT['ch1.old.exit']);
  await inState(page, 'pc');
  await pcPick(page, 'vitals');
  assert.equal(await dismiss(page), SCRIPT['ch1.pc.vitals.old']);
  await leavePc(page);
  assert.equal((await ch(page)).x, 87, 'the hero stands at the PC');
  await askCto(page);
  await page.click('#decide-hc');
  assert.equal(await dismiss(page), SCRIPT['ch1.decide.hc.show']);
  await solveHc(page);
  await winLines(page);
  const s = await run(page);
  assert.equal(s.score, 100, 'the old tool is free');
  assert.ok(s.phases.old > 0);
  assert.equal(s.counts.oldPrompts, 3); assert.equal(s.counts.vitals, 1);
  await ctx.close();
});

test('Sign first: the jab, 50 points, the prompt greys and the choice comes back; backing out of "show me" returns to the room', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await into(page); await toPc(page);
  await pcPick(page, 'old'); await toolOpen(page, 'old'); await dismiss(page);
  await prompt(page, 0); await dismiss(page);
  await page.click('#tool-exit'); await dismiss(page);
  await leavePc(page); await askCto(page);
  await page.click('#decide-sign');
  assert.equal(await dismiss(page), SCRIPT['ch1.decide.sign.jab']);
  await inState(page, 'decide');
  assert.equal(await page.locator('#decide-sign').isDisabled(), true);
  assert.equal((await scen(page)).signed, true);
  await page.click('#decide-hc');
  assert.equal(await dismiss(page), SCRIPT['ch1.decide.hc.show']);
  await toolOpen(page, 'hc'); await dismiss(page);
  await prompt(page, 0); await dismiss(page);                     // one step done, then back out
  await promptsShown(page);
  await page.click('#tool-exit');
  await inState(page, 'room');
  await askCto(page);
  assert.equal(await page.locator('#decide-sign').isDisabled(), true, 'still greyed');
  await page.click('#decide-hc');
  assert.equal(await dismiss(page), SCRIPT['ch1.decide.hc.show']);
  await toolOpen(page, 'hc');
  assert.equal((await ch(page)).tool.step, 1, 'progress kept');
  await prompt(page, 0); assert.equal(await dismiss(page), SCRIPT['ch1.hc.step2.result']);
  await winLines(page);
  const s = await run(page);
  assert.equal(s.score, 50);
  assert.equal(s.counts.signed, 1); assert.equal(s.counts.wrong, 0);
  assert.match(await page.locator('#sb-score').innerText(), /Score: 50 of 500/);
  await ctx.close();
});

test('the PC: emails answer and return to the menu; Check Otto\'s vitals follows the investigation; a finished Honeycomb screen is only a Close', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await into(page); await toPc(page);
  await pcPick(page, 'vitals');
  assert.equal(await dismiss(page), SCRIPT['ch1.pc.vitals.before']);
  await pcPick(page, 'email');
  assert.equal(await page.locator('.pc-item').count(), 5);
  for (let i = 1; i <= 5; i++) assert.equal(await page.locator(`.pc-item[data-id="email-${i}"]`).innerText(), SCRIPT[`ch1.pc.email.${i}`]);
  await pcPick(page, 'email-4');
  assert.equal(await dismiss(page), SCRIPT['ch1.pc.email.reply']);
  await page.waitForSelector('.pc-item[data-id="leave"]');
  await pcPick(page, 'hc'); await solveHc(page);
  await inState(page, 'pc');
  assert.equal((await page.evaluate(() => window.__oq.chapter.vitals)).tone, 'green', 'Otto recovers');
  await pcPick(page, 'vitals');
  assert.equal(await dismiss(page), SCRIPT['ch1.pc.vitals.hc']);
  await pcPick(page, 'hc'); await toolOpen(page, 'hc'); await promptsShown(page);
  assert.equal(await page.locator('.tool-prompts .prompt[data-index]').count(), 0);
  await page.click('#tool-exit'); await inState(page, 'pc');
  assert.equal((await run(page)).counts.emails, 1);
  await ctx.close();
});

test('the monitor close-up: the chart once a visit, a tap steps a box, Back and a tap off the glass return to the room', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await into(page);
  const x0 = (await ch(page)).x;
  await tapSpot(page, 'monitor');
  assert.equal(await dismiss(page), SCRIPT['ch1.monitor.chart']);
  assert.equal((await ch(page)).state, 'monitor');
  assert.equal((await ch(page)).x, x0, 'no walk');
  const texts = () => page.locator('.mon-box').evaluateAll((els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim()));
  const before = (await page.evaluate(() => window.__oq.chapter.vitals)).boxes.map((b) => b.stat);
  const sc = await page.locator('#scene').boundingBox();
  await page.mouse.click(sc.x + (125 / 320) * sc.width, sc.y + (140 / 200) * sc.height);    // box 2
  const after = (await page.evaluate(() => window.__oq.chapter.vitals)).boxes.map((b) => b.stat);
  assert.notEqual(after[1], before[1], 'the tapped box moved on');
  assert.equal(new Set(after).size, 3);
  await page.waitForTimeout(250);
  const pool = Array.from({ length: 10 }, (_, i) => SCRIPT[`ch1.vitals.stat.${i + 1}`].replace(' / ', ' '));
  assert.ok((await texts()).some((t) => pool.includes(t)), `${await texts()}`);
  await page.click('#btn-back');
  await inState(page, 'room');
  await tapSpot(page, 'monitor');
  assert.equal(await dismiss(page), SCRIPT['ch1.monitor.chart'], 'once per visit');
  await page.mouse.click(sc.x + 0.5 * sc.width, sc.y + (190 / 200) * sc.height);             // off the glass
  await inState(page, 'room');
  assert.equal((await run(page)).counts.monitor, 2);
  assert.ok((await run(page)).phases.monitor > 0);
  await ctx.close();
});

test('the CTO talks on the phone, and stops while a window about her is open', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await into(page);
  const frames = new Set();
  for (let i = 0; i < 12; i++) { frames.add(await page.evaluate(() => window.__oq.chapter.ctoFrame)); await page.waitForTimeout(110); }
  assert.deepEqual([...frames].sort(), [0, 1, 2]);
  await page.click('#btn-look'); await tapSpot(page, 'cto');
  await winOpen(page);
  for (let i = 0; i < 6; i++) { assert.equal(await page.evaluate(() => window.__oq.chapter.ctoFrame), 0); await page.waitForTimeout(110); }
  assert.equal(await dismiss(page), SCRIPT['ch1.look.cto']);
  await ctx.close();
});

test('Look gives the look line from where you stand and returns to Use; Help opens and closes', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await into(page);
  for (const id of ['pc', 'monitor', 'cto']) {
    await page.click('#btn-look');
    assert.equal((await ch(page)).mode, 'look');
    const x0 = (await ch(page)).x;
    await tapSpot(page, id);
    await winOpen(page);
    const c = await ch(page);
    assert.equal(c.window.text, SCRIPT[`ch1.look.${id}`]);
    assert.equal(c.mode, 'use'); assert.equal(c.walking, false); assert.equal(c.x, x0); assert.equal(c.state, 'room');
    await dismiss(page);
  }
  await page.click('#btn-help');
  assert.equal(await dismiss(page), SCRIPT['help.window']);
  assert.equal((await run(page)).counts.looks, 3);
  await ctx.close();
});

test('667x375: the entry line pages; the PC menu, the emails and the monitor text stay inside their screens; every target is 44 px', async () => {
  const { ctx, page } = await openGame(browser, server, { w: 667, h: 375, query: '?ch=1' });
  const inside = (sel, area) => page.evaluate(([s, a]) => {
    const c = document.querySelector('#scene').getBoundingClientRect(), k = c.width / 320;
    const box = a ? { left: c.left + a.x0 * k - 0.5, right: c.left + (a.x1 + 1) * k + 0.5, top: c.top + a.y0 * k - 0.5, bottom: c.top + (a.y1 + 1) * k + 0.5 } : document.querySelector('#scene-box').getBoundingClientRect();
    return [...document.querySelectorAll(s)].filter((e) => { const r = e.getBoundingClientRect(); return !(r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom); }).map((e) => e.className + ' ' + e.textContent.slice(0, 30));
  }, [sel, area]);
  const small = (sel) => page.locator(sel).evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).filter((r) => r.width < 44 || r.height < 44).map((r) => `${r.width}x${r.height}`));
  await page.click('#class-card');
  await winOpen(page);
  assert.ok((await ch(page)).window.pages >= 2);
  assert.ok(await page.locator('.msg .msg-line').count() <= 5);           // a narrow window may be five lines tall on this phone
  assert.deepEqual(await inside('.msg'), []);
  await dismiss(page);
  assert.deepEqual(await small('#btn-look, #btn-use, #btn-help'), []);
  const PCS = { x0: 66, x1: 254, y0: 30, y1: 162 };
  await toPc(page);
  assert.deepEqual(await inside('.pc-title, .pc-item', PCS), []);
  assert.deepEqual(await small('.pc-item'), []);
  await pcPick(page, 'email');
  assert.deepEqual(await inside('.pc-title, .pc-item', PCS), []);
  assert.deepEqual(await small('.pc-item'), []);
  const clipped = await page.locator('.pc-item').evaluateAll((els) => els.filter((e) => e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
  assert.deepEqual(clipped, [], 'email subjects are shown whole');
  await pcPick(page, 'email-1'); await dismiss(page);
  await pcPick(page, 'hc'); await toolOpen(page, 'hc'); await dismiss(page); await promptsShown(page);
  assert.deepEqual(await small('.tool-prompts .prompt'), []);
  assert.deepEqual(await inside('.tool-prompts .prompt'), []);
  await prompt(page, 0); await dismiss(page);
  await page.click('#tool-exit'); await inState(page, 'pc');
  await leavePc(page);
  await tapSpot(page, 'monitor'); await dismiss(page);
  await page.waitForTimeout(300);
  const boxes = [{ x0: 27, x1: 87, y0: 116, y1: 164 }, { x0: 95, x1: 156, y0: 116, y1: 164 }, { x0: 164, x1: 224, y0: 116, y1: 164 }];
  for (let i = 0; i < 3; i++) assert.deepEqual(await inside(`.mon-box[data-box="${i}"] .fit`, boxes[i]), [], `box ${i}`);
  assert.deepEqual(await inside('.mon-out', { x0: 232, x1: 293, y0: 26, y1: 164 }), []);
  const font = await page.locator('.mon-box .fit').first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  assert.ok(font >= 18, `${font}px`);
  assert.deepEqual(await small('#btn-back'), []);
  await page.click('#btn-back'); await inState(page, 'room');
  await askCto(page);
  assert.deepEqual(await small('#decide-sign, #decide-hc'), []);
  assert.deepEqual(await inside('#decide-sign, #decide-hc'), []);
  await ctx.close();
});

test('rotate to portrait mid-room: paused, the clock stops, and resumes on rotating back', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await into(page);
  await page.waitForTimeout(300);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => window.__oq.paused === true);
  const a = await run(page);
  assert.equal(a.held, true);
  await page.waitForTimeout(800);
  assert.equal((await run(page)).elapsed, a.elapsed, 'the clock moved under the rotate gate');
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForFunction(() => window.__oq.paused === false);
  await page.waitForTimeout(400);
  const c = await run(page);
  assert.equal(c.held, false);
  assert.ok(c.elapsed >= a.elapsed + 300, `${a.elapsed} -> ${c.elapsed}`);
  await ctx.close();
});

test('reduced motion: no walking, a still monitor and CTO, instant text, the same result', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1', reduced: true });
  await page.click('#class-card');
  await winOpen(page);
  assert.ok((await page.locator('.msg').innerText()).length > 20, 'text typed at once');
  await dismiss(page);
  const v1 = await page.evaluate(() => window.__oq.chapter.vitals);
  await page.waitForTimeout(700);
  const v2 = await page.evaluate(() => window.__oq.chapter.vitals);
  assert.deepEqual(v1.boxes, v2.boxes); assert.deepEqual(v1.lights, v2.lights);
  assert.equal(await page.evaluate(() => window.__oq.chapter.ctoFrame), 0);
  const x0 = (await ch(page)).x;
  await tapSpot(page, 'pc');
  await inState(page, 'pc');
  await pcPick(page, 'hc'); await solveHc(page); await inState(page, 'pc');
  await leavePc(page);
  assert.notEqual(x0, 87); assert.equal((await ch(page)).x, 87);
  await askCto(page);
  assert.equal((await ch(page)).walking, false);
  await page.click('#decide-hc');
  await winLines(page);
  const s = await run(page);
  assert.equal(s.score, 100); assert.equal(s.counts.walkMs, 0);
  await ctx.close();
});

test('while a window is open, a floor tap does not walk', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await page.click('#class-card');
  await winOpen(page);
  const sc = await page.locator('#scene').boundingBox();
  const x0 = (await ch(page)).x;
  await page.mouse.click(sc.x + sc.width * 0.5, sc.y + sc.height * 0.95);
  await page.waitForTimeout(300);
  assert.equal((await ch(page)).walking, false);
  assert.equal((await ch(page)).x, x0);
  await ctx.close();
});
