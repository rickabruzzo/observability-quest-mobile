// The conversation window clears the hero's head (Warp brief 18): in every room, at both phone sizes, the persona's first
// line opens a window that takes only the lines ending 2 CSS px above the top of his hair (at most four, at least two),
// stays clear of the persona's patch, and has a square portrait as tall as its name and its lines. Every expectation
// comes from the chapter's data, the room's manifest and the rule in js/engine/conversation.js; nothing names a room.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { startServer } from './_server.js';
import { CHAPTERS } from '../../js/chapters/index.js';
import { TALK_MAX, TALK_MIN, HEAD_CLEAR } from '../../js/engine/conversation.js';
import { openGame, ch, dismiss, tapSpot, closeCard, winOpen } from './_play.js';
import { SCRIPT } from '../../js/script.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

const PHONES = [[844, 390], [667, 375]];
const NS = Object.keys(CHAPTERS).map(Number);
const spot = (n) => CHAPTERS[n].room.hotspots.find((h) => h.use?.action === 'persona').id;

/** The open window against the scene, in CSS px: its outline box, its line count, the portrait and the words column, his head. */
const measure = (page) => page.evaluate(() => {
  const el = document.querySelector('.msg'), sc = document.querySelector('#scene').getBoundingClientRect(), r = el.getBoundingClientRect();
  const cs = getComputedStyle(el), ow = parseFloat(cs.outlineWidth) || 0, k = sc.width / 320, hb = window.__oq.chapter.heroBox;
  const P = el.querySelector('.msg-portrait').getBoundingClientRect(), T = el.querySelector('.msg-text').getBoundingClientRect();
  return {
    k, lines: window.__oq.chapter.window.lines, page: window.__oq.chapter.window.page, pages: window.__oq.chapter.window.pages,
    shown: el.querySelectorAll('.msg-line').length, line: parseFloat(getComputedStyle(el.querySelector('.msg-body')).lineHeight),
    box: { left: r.left - sc.left - ow, right: r.right - sc.left + ow, top: r.top - sc.top - ow, bottom: r.bottom - sc.top + ow },
    portrait: { w: P.width, h: P.height }, words: T.height,
    head: hb.y * k, hero: { left: hb.x * k, right: (hb.x + hb.w) * k },
  };
});

for (const n of NS) {
  const c = CHAPTERS[n], patch = JSON.parse(readFileSync(`assets/rooms/ch${n}.json`, 'utf8')).patches[c.room.image];
  for (const [w, h] of PHONES) {
    test(`room ${n}, ${w}x${h}: the persona's first line takes the lines that clear the hero's head, the portrait matches, every page holds that many`, async () => {
      const { ctx, page } = await openGame(browser, server, { w, h, query: `?ch=${n}` });
      await page.click('#class-card'); assert.equal(await dismiss(page), SCRIPT[c.enter]);
      await tapSpot(page, spot(n)); await closeCard(page); await winOpen(page);
      const m = await measure(page);
      const at = `room ${n} ${w}x${h}: ${m.lines} lines, bottom ${m.box.bottom.toFixed(1)}, head ${m.head.toFixed(1)}`;
      console.log(`# ${at}`);
      assert.ok(m.lines >= TALK_MIN && m.lines <= TALK_MAX, at);
      const over = m.box.right > m.hero.left && m.box.left < m.hero.right;
      if (!over) assert.equal(m.lines, TALK_MAX, `${at}: not over him, so four`);
      else {
        // clear of his head, unless two (the floor) do not clear him; and as many as fit: one more would not
        const clear = m.box.bottom <= m.head - HEAD_CLEAR + 0.5;
        assert.ok(clear || m.lines === TALK_MIN, `${at}: covers his head with more than ${TALK_MIN} lines`);
        if (m.lines < TALK_MAX) assert.ok(m.box.bottom + m.line > m.head - HEAD_CLEAR, `${at}: another line would have fitted`);
      }
      // clear of the persona's patch
      const p = { left: patch.x * m.k, right: (patch.x + patch.w) * m.k, top: patch.y * m.k, bottom: (patch.y + patch.h) * m.k };
      const hits = m.box.right > p.left + 0.5 && m.box.left < p.right - 0.5 && m.box.bottom > p.top + 0.5 && m.box.top < p.bottom - 0.5;
      assert.ok(!hits, `${at}: the window ${JSON.stringify(m.box)} is over the persona's patch ${JSON.stringify(p)}`);
      // the portrait: square, as tall as the name and the lines (to the whole pixel below)
      assert.ok(Math.abs(m.portrait.w - m.portrait.h) < 0.5, `${at}: portrait ${m.portrait.w}×${m.portrait.h}`);
      assert.ok(m.portrait.h <= m.words + 0.5 && m.portrait.h > m.words - 1, `${at}: portrait ${m.portrait.h} vs name and lines ${m.words}`);
      // every page holds that many lines, the last up to that many: the words are all there, paged by the window
      const id = (await ch(page)).window.id, same = async () => (await ch(page)).window?.id === id;
      for (let guard = 0; guard < 40; guard++) {
        if (!(await same())) break;
        const now = await measure(page);
        if (now.page < now.pages - 1) assert.equal(now.shown, m.lines, `${at}: page ${now.page + 1} of ${now.pages}`);
        else assert.ok(now.shown >= 1 && now.shown <= m.lines, `${at}: the last page has ${now.shown}`);
        const before = now.page;
        await page.click('.msg');
        if ((await same()) && (await ch(page)).window.page === before) await page.click('.msg');   // the first tap completed the typing
      }
      assert.deepEqual(page.errors, []);
      await ctx.close();
    });
  }
}
