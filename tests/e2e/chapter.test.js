// Scenario 1 on its real room, played in a browser: the PC and its menu, Otto's vitals monitor, the Honeycomb
// screens from their pictures, cause found → fix deployed → Otto recovers, the CTO's decision, missteps and
// Charity (no score), paging and targets on a small phone, the rotate gate, reduced motion, the summary.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';
import { SCRIPT } from '../../js/script.js';
import { openGame, pickScenario, ch, run, winOpen, dismiss, tapSpot, toolOpen, promptsShown, prompt, playShortest, inState, pcPick, toPc, solveHc, leavePc, askCto, winLines, deployAndRecover, charitySays, shown } from './_play.js';
import { readFileSync } from 'node:fs';
import { CH1 } from '../../js/chapters/ch1.js';
import { HERO_H } from '../../js/engine/hero.js';
import { TOP } from '../../js/engine/hero-parts.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

const PHONES = [[844, 390], [667, 375]];
const PIC = { x: 4, y: 20, w: 188, h: 176 };
const into = async (page) => { await page.click('#class-card'); assert.equal(await dismiss(page), SCRIPT['ch1.room.enter']); };
const scen = (page) => page.evaluate(() => window.__oq.chapter.scenario);
const otto = (page) => page.evaluate(() => ({ state: window.__oq.chapter.otto, tone: window.__oq.chapter.vitals.tone }));
/** Records every piece of text that ever appears on the page, so a test can say "never showed X". */
const watchText = (page) => page.evaluate(() => {
  window.__seen = new Set([document.body.innerText]);
  new MutationObserver(() => window.__seen.add(document.body.innerText)).observe(document.body, { subtree: true, childList: true, characterData: true });
});
const seen = (page) => page.evaluate(() => [...window.__seen].join('\n'));
/** Pixels of the scene canvas inside the picture rectangle, as a string (to compare two moments). */
const picPixels = (page) => page.evaluate((P) => [...document.querySelector('#scene').getContext('2d').getImageData(P.x, P.y, P.w, P.h).data].join(','), PIC);

for (const [w, h] of PHONES) {
  test(`${w}x${h}: the shortest path (PC → Honeycomb → deploy → recovery → leave → CTO → Get Honeycomb) wins, Solved ticks up, no score anywhere`, async () => {
    const { ctx, page } = await openGame(browser, server, { w, h });
    await watchText(page);
    assert.equal(await page.locator('#sb-done').innerText(), 'Solved: 0 of 5');
    await pickScenario(page);
    await playShortest(page);
    assert.equal(await page.locator('#sb-done').innerText(), 'Solved: 1 of 5');
    const s = await run(page);
    assert.equal(s.missteps, 0); assert.equal(s.done, true); assert.ok(!('score' in s));
    const sum = Object.values(s.phases).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - s.total) <= 50, `phases ${sum} vs total ${s.total}`);
    for (const p of ['card', 'room', 'pc', 'hc', 'deploy', 'cto', 'win']) assert.ok(s.phases[p] > 0, `${p}: ${JSON.stringify(s.phases)}`);
    assert.equal(s.phases.old, 0); assert.equal(s.phases.monitor, 0);
    assert.match(await page.locator('#summary h2').innerText(), /\d+:\d\d/);
    assert.match(await page.locator('#summary').innerText(), /Missteps\s+0/);
    const fits = await page.evaluate(() => { const r = document.querySelector('#summary').getBoundingClientRect(), b = document.querySelector('#scene-box').getBoundingClientRect(), e = document.querySelector('#summary'); return r.top >= b.top - 1 && r.bottom <= b.bottom + 1 && e.scrollHeight <= e.clientHeight + 1; });
    assert.ok(fits, 'summary fits the scene');
    await page.click('#btn-claim');
    await charitySays(page);
    assert.doesNotMatch(await seen(page), /score|of 500|of 100\b/i, 'no score on any screen of scenario 1');
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });
}

test('the room\'s and the Honeycomb screen\'s pictures are loaded before the class card lets go', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await page.click('#class-card');
  await winOpen(page);
  assert.equal(await page.evaluate(() => window.__oq.chapter.loaded), true);
  assert.equal(await page.evaluate(() => window.__oq.chapter.screensLoaded), true);
  assert.equal(await page.evaluate(() => window.__oq.chapter.state), 'room');
  await ctx.close();
});

test('Copy results prints one JSON line to the console, with missteps and no score', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  const lines = []; page.on('console', (m) => lines.push(m.text()));
  await playShortest(page);
  await page.click('#btn-copy');
  await page.waitForFunction(() => document.querySelector('#btn-copy').textContent === 'Copied');
  const json = lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).find((v) => v?.oq === 'run');
  assert.ok(json, lines.join('\n'));
  assert.equal(json.missteps, 0); assert.ok(!('score' in json));
  assert.ok(json.phases.deploy > 0 && 'nudges' in json.counts && 'signed' in json.counts);
  await ctx.close();
});

test('the Honeycomb screen: stage 0 drawn on opening, each direct prompt wipes in the next picture, the prompts clear of it', async () => {
  for (const [w, h] of PHONES) {
    const { ctx, page } = await openGame(browser, server, { w, h, query: '?ch=1' });
    await into(page); await toPc(page); await pcPick(page, 'hc'); await toolOpen(page, 'hc');
    const lit = await page.evaluate((P) => { const d = document.querySelector('#scene').getContext('2d').getImageData(P.x + 20, P.y + 20, 1, 1).data; return d[0] + d[1] + d[2]; }, PIC);
    assert.ok(lit > 60, `stage 0 is drawn (pixel sum ${lit})`);
    await dismiss(page); await promptsShown(page);
    const layout = await page.evaluate((P) => {
      const c = document.querySelector('#scene').getBoundingClientRect(), k = c.width / 320, b = document.querySelector('#scene-box').getBoundingClientRect();
      const picRight = c.left + (P.x + P.w + 2) * k, titleBottom = document.querySelector('.tool-title').getBoundingClientRect().bottom;
      return [...document.querySelectorAll('.tool-prompts .prompt')].map((e) => { const r = e.getBoundingClientRect(); return { text: e.textContent.slice(0, 20), ok: r.left >= picRight && r.right <= b.right + 0.5 && r.top >= titleBottom && r.bottom <= b.bottom + 0.5 && r.height >= 44 && r.width >= 44 }; });
    }, PIC);
    assert.equal(layout.length, 4, 'three prompts and the close button');
    assert.deepEqual(layout.filter((l) => !l.ok), [], `${w}x${h}`);
    let before = await picPixels(page);
    for (const step of [1, 2]) {
      await prompt(page, 0);
      await winOpen(page);                                          // the result: the reveal is over
      assert.equal((await ch(page)).tool.step, step);
      const now = await picPixels(page);
      assert.notEqual(now, before, `stage ${step} looks like stage ${step - 1}`);
      before = now;
      await dismiss(page);
      if (step === 1) await promptsShown(page);
    }
    await ctx.close();
  }
});

test('all four Honeycomb nudges, then the direct prompts: no misstep; the nudges are counted; Charity is clean', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await into(page); await toPc(page); await pcPick(page, 'hc'); await toolOpen(page, 'hc'); await dismiss(page);
  for (const i of [1, 2]) { await prompt(page, i); assert.equal(await dismiss(page), SCRIPT[`ch1.hc.step1.jab.${i + 1}`]); }
  await promptsShown(page);
  assert.equal(await page.locator('.tool-prompts .prompt[data-index="2"]').isDisabled(), true);
  await page.locator('.tool-prompts .prompt[data-index="2"]').click({ force: true });
  await page.waitForTimeout(150);
  assert.equal((await ch(page)).window, null, 'a greyed prompt does nothing');
  await prompt(page, 0); await dismiss(page);
  for (const i of [1, 2]) { await prompt(page, i); assert.equal(await dismiss(page), SCRIPT[`ch1.hc.step2.jab.${i + 1}`]); }
  await prompt(page, 0); assert.equal(await dismiss(page), SCRIPT['ch1.hc.step2.result']);
  await inState(page, 'pc');
  await deployAndRecover(page); await inState(page, 'pc');
  await leavePc(page); await askCto(page); await page.click('#decide-hc'); await winLines(page);
  const s = await run(page);
  assert.equal(s.missteps, 0); assert.equal(s.counts.nudges, 4);
  await page.click('#btn-claim');
  const { lines } = await charitySays(page);
  assert.deepEqual(lines.slice(0, 2), [SCRIPT['final.clean'], SCRIPT['final.count.one']]);
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
    assert.equal(await dismiss(page), shown(`ch1.cto.call.${n}`));
    await inState(page, 'room');
  }
  assert.ok((await run(page)).phases.cto > 0);
  await ctx.close();
});

test('the cause found and the fix deployed: Otto stays critical until the deploy, the deploy item comes and goes, the vitals line follows', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await into(page); await toPc(page);
  await pcPick(page, 'vitals');
  assert.equal(await dismiss(page), SCRIPT['ch1.pc.vitals.before']);
  await pcPick(page, 'email');
  assert.equal(await page.locator('.pc-item').count(), 5);
  for (let i = 1; i <= 5; i++) assert.equal(await page.locator(`.pc-item[data-id="email-${i}"]`).innerText(), SCRIPT[`ch1.pc.email.${i}`]);
  await pcPick(page, 'email-4');
  assert.equal(await dismiss(page), SCRIPT['ch1.pc.email.reply']);
  assert.equal(await page.locator('.pc-item[data-id="deploy"]').count(), 0, 'nothing to deploy yet');
  await pcPick(page, 'hc'); await solveHc(page);
  await inState(page, 'pc');
  assert.deepEqual(await otto(page), { state: 'found', tone: 'red' }, 'found is not fixed');
  assert.equal(await page.locator('.pc-item[data-id="deploy"]').innerText(), SCRIPT['ch1.pc.menu.deploy']);
  await pcPick(page, 'vitals');
  assert.equal(await dismiss(page), SCRIPT['ch1.pc.vitals.found']);
  await pcPick(page, 'deploy');
  assert.equal(await dismiss(page), SCRIPT['ch1.pc.deploy']);
  await page.waitForFunction(() => window.__oq.chapter.state === 'recover');
  assert.deepEqual(await otto(page), { state: 'deployed', tone: 'green' });
  await winOpen(page);                                              // Otto speaks once he has finished his sentence
  assert.equal(await page.locator('.mon-out').innerText().then((t) => t.trim()), SCRIPT['ch1.vitals.output.ok']);
  assert.equal(await dismiss(page), SCRIPT['ch1.otto.recovered']);
  await inState(page, 'pc');
  assert.equal(await page.locator('.pc-item[data-id="deploy"]').count(), 0, 'used once, then gone');
  await pcPick(page, 'vitals');
  assert.equal(await dismiss(page), SCRIPT['ch1.pc.vitals.hc']);
  await pcPick(page, 'hc'); await toolOpen(page, 'hc'); await promptsShown(page);
  assert.equal(await page.locator('.tool-prompts .prompt[data-index]').count(), 0, 'a finished Honeycomb screen is only a Close');
  await page.click('#tool-exit'); await inState(page, 'pc');
  const s = await run(page);
  assert.equal(s.counts.emails, 1); assert.ok(s.phases.deploy > 0);
  await ctx.close();
});

test('found but not deployed at the CTO: Get Honeycomb → "show me" → the deploy prompt alone → recovery → the win', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await into(page); await toPc(page); await pcPick(page, 'hc'); await solveHc(page); await inState(page, 'pc');
  await leavePc(page);
  assert.equal((await otto(page)).tone, 'red');
  await askCto(page);
  await page.click('#decide-hc');
  assert.equal(await dismiss(page), shown('ch1.decide.hc.show'));
  await inState(page, 'pc');
  assert.deepEqual(await page.locator('.pc-item').evaluateAll((bs) => bs.map((b) => b.dataset.id)), ['deploy'], 'one prompt over the PC');
  await deployAndRecover(page);
  await winLines(page);
  assert.equal((await run(page)).missteps, 0);
  await ctx.close();
});

test('Cave Logs only, then the CTO: Get Honeycomb → "show me" → the investigation → deploy → the win; the Cave Logs picks are missteps', async () => {
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
  assert.equal((await ch(page)).x, 73, 'the hero stands at the PC');
  await askCto(page);
  await page.click('#decide-hc');
  assert.equal(await dismiss(page), shown('ch1.decide.hc.show'));
  await solveHc(page);
  await inState(page, 'pc');
  await deployAndRecover(page);
  await winLines(page);
  const s = await run(page);
  assert.equal(s.missteps, 3);
  assert.ok(s.phases.old > 0);
  assert.equal(s.counts.oldPrompts, 3); assert.equal(s.counts.vitals, 1);
  await page.click('#btn-claim');
  const { lines } = await charitySays(page);
  assert.equal(lines[0], SCRIPT['final.grief']);
  await ctx.close();
});

test('Sign first: the jab, a misstep, the prompt greys and the choice comes back; backing out of "show me" returns to the room', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await into(page); await toPc(page);
  await pcPick(page, 'hc'); await toolOpen(page, 'hc'); await dismiss(page);
  await prompt(page, 1); await dismiss(page);                       // a nudge: tried, but no misstep
  await promptsShown(page); await page.click('#tool-exit'); await inState(page, 'pc');
  await leavePc(page); await askCto(page);
  await page.click('#decide-sign');
  assert.equal(await dismiss(page), SCRIPT['ch1.decide.sign.jab']);
  await inState(page, 'decide');
  assert.equal(await page.locator('#decide-sign').isDisabled(), true);
  assert.equal((await scen(page)).signed, true);
  await page.click('#decide-hc');
  assert.equal(await dismiss(page), shown('ch1.decide.hc.show'));
  await toolOpen(page, 'hc');
  await prompt(page, 0); await dismiss(page);                       // one step done, then back out
  await promptsShown(page);
  await page.click('#tool-exit');
  await inState(page, 'room');
  await askCto(page);
  assert.equal(await page.locator('#decide-sign').isDisabled(), true, 'still greyed');
  await page.click('#decide-hc');
  assert.equal(await dismiss(page), shown('ch1.decide.hc.show'));
  await toolOpen(page, 'hc');
  assert.equal((await ch(page)).tool.step, 1, 'progress kept');
  await prompt(page, 0); assert.equal(await dismiss(page), SCRIPT['ch1.hc.step2.result']);
  await inState(page, 'pc');
  await deployAndRecover(page);
  await winLines(page);
  const s = await run(page);
  assert.equal(s.missteps, 1);
  assert.equal(s.counts.signed, 1); assert.equal(s.counts.nudges, 1);
  assert.equal(await page.locator('#sb-done').innerText(), 'Solved: 1 of 5');
  await page.click('#btn-claim');
  const { lines } = await charitySays(page);
  assert.equal(lines[0], SCRIPT['final.grief']);
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
  await deployAndRecover(page); await inState(page, 'pc');
  await leavePc(page);
  assert.notEqual(x0, 73); assert.equal((await ch(page)).x, 73);
  await askCto(page);
  assert.equal((await ch(page)).walking, false);
  await page.click('#decide-hc');
  await winLines(page);
  const s = await run(page);
  assert.equal(s.missteps, 0); assert.equal(s.counts.walkMs, 0);
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

// ---- the persona speaks from a close-up portrait (Warp brief 10) ----
const PATCH = JSON.parse(readFileSync('assets/rooms/ch1.json', 'utf8')).patches[CH1.room.image];
/** The open window, measured against the scene: its box, its portrait, its name, the hero's x. */
const talkWindow = (page) => page.evaluate(() => {
  const el = document.querySelector('.msg'), sc = document.querySelector('#scene').getBoundingClientRect();
  const r = el.getBoundingClientRect(), c = el.querySelector('.msg-portrait canvas'), name = el.querySelector('.msg-name');
  let painted = 0;
  if (c) { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i]) painted++; }
  const fontPx = Math.min(...[...el.querySelectorAll('.msg-line, .msg-name')].map((n) => parseFloat(getComputedStyle(n).fontSize)));
  return { talk: el.classList.contains('talk'), name: name?.textContent ?? null, text: el.dataset.text, fontPx,
    box: { x: r.left - sc.left, y: r.top - sc.top, w: r.width, h: r.height }, scene: { w: sc.width, h: sc.height },
    canvas: c ? { w: c.width, h: c.height, css: c.getBoundingClientRect().height, painted } : null, heroX: window.__oq.chapter.x };
});

for (const [w, h] of PHONES) {
  test(`${w}x${h}: the CTO speaks from her portrait — her name, a painted picture, the window beside her and off the hero's body; narration has no portrait`, async () => {
    const { ctx, page } = await openGame(browser, server, { w, h, query: '?ch=1' });
    await into(page);
    await tapSpot(page, 'cto');
    await winOpen(page);
    const m = await talkWindow(page);
    assert.equal(m.talk, true, 'a conversation window');
    assert.equal(m.name, SCRIPT['ch1.persona.name']);
    assert.equal(m.text, shown('ch1.cto.call.1'));                                   // the CTO: prefix is dropped
    assert.notEqual(m.text, SCRIPT['ch1.cto.call.1']);
    assert.ok(m.canvas && m.canvas.w > 0 && m.canvas.h > 0, 'the portrait has a size');
    assert.ok(m.canvas.painted > m.canvas.w * m.canvas.h * 0.5, `the portrait is painted (${m.canvas.painted})`);
    assert.ok(m.canvas.css >= 96, `portrait ${m.canvas.css} CSS px tall`);
    assert.ok(m.fontPx >= 14, `font ${m.fontPx}`);
    // inside the scene
    assert.ok(m.box.x >= -0.5 && m.box.y >= -0.5 && m.box.x + m.box.w <= m.scene.w + 0.5 && m.box.y + m.box.h <= m.scene.h + 0.5, JSON.stringify(m.box));
    const k = m.scene.w / 320;
    assert.ok(m.box.x + m.box.w <= PATCH.x * k + 0.5, `clear of the CTO: window right ${m.box.x + m.box.w} vs patch ${PATCH.x * k}`);
    // the hero stands at her desk, his head under the top of the scene: the window ends above his shoulders
    const shoulders = (CH1.room.floorY - HERO_H + TOP + 40) * k;
    assert.ok(m.box.y + m.box.h <= shoulders + 0.5, `window bottom ${m.box.y + m.box.h} vs the hero's shoulders ${shoulders}`);
    // she keeps talking in the room while her line is up (not reduced motion)
    const frames = new Set();
    for (let i = 0; i < 10; i++) { frames.add(await page.evaluate(() => window.__oq.chapter.ctoFrame)); await page.waitForTimeout(110); }
    assert.ok(frames.size > 1, 'the CTO\'s talk frames play while she speaks');
    await dismiss(page);
    await inState(page, 'room');
    // narration about her: an ordinary window, no portrait, no name
    await page.click('#btn-look'); await tapSpot(page, 'cto');
    await winOpen(page);
    const n = await talkWindow(page);
    assert.equal(n.talk, false); assert.equal(n.canvas, null); assert.equal(n.name, null);
    assert.equal(await dismiss(page), SCRIPT['ch1.look.cto']);
    await ctx.close();
  });
}

test('reduced motion: the portrait is the still, and her line is complete at once', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1', reduced: true });
  await into(page);
  await tapSpot(page, 'cto');
  await winOpen(page);
  const m = await talkWindow(page);
  assert.equal(m.talk, true); assert.ok(m.canvas.painted > 0);
  const a = await page.evaluate(() => document.querySelector('.msg-portrait canvas').toDataURL());
  await page.waitForTimeout(700);
  const b = await page.evaluate(() => document.querySelector('.msg-portrait canvas').toDataURL());
  assert.equal(a, b, 'the still does not move');
  await ctx.close();
});
