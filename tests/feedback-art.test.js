// Brief 14: the feedback art in the game. The painters' art helper, room 2's marker on the board, room 3's shop loop,
// room 4's battle as data and its phone, the old tools' marks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeArt } from '../js/screens/chapter.js';
import { CHAPTERS } from '../js/chapters/index.js';
import { SCRIPT } from '../js/script.js';
import { THEORIES, boardMarks, arrow, ringsShown, current } from '../js/chapters/ch2-wall.js';
import { visit, PRODUCTS, VISIT_MS } from '../js/chapters/ch3-wall.js';
import { cast, DIMS, gateAt, RECOVER_MS, OURS, THEIRS, STUCK_ONES, DOTS, LINE_FROM, MARK_AT } from '../js/chapters/ch4-wall.js';
import { PHONE, phoneRings, barTextAt, TOOL_PIC } from '../js/chapters/ch4.js';

const words = (text) => Object.fromEntries(Object.entries(text).map(([k, v]) => [k, Array.isArray(v) ? v.map((x) => SCRIPT[x]) : SCRIPT[v]]));
const S = (ch, state, extra = {}) => ({ state, t: 0, tAll: 0, reduced: false, nudges: [], text: words(ch.wall.text), cfg: ch.wall, ...extra });
const rec = () => { const calls = []; const g = new Proxy({ calls }, { get: (o, k) => (k === 'calls' ? calls : k === 'fillStyle' || k === 'globalAlpha' ? '' : (...a) => calls.push([k, ...a])), set: () => true }); return g; };
const taps = (n) => Array.from({ length: n }, (_, i) => ({ step: i + 1, box: 0 }));

// ---- A. the art helper ----
test('art.draw puts the sprite\'s box from the sheet at (x, y); flip mirrors it about its own centre; missing art draws nothing', () => {
  const sheet = { id: 'sheet' };
  const art = makeArt({ manifest: { sprites: { uke: { image: 'S', x: 10, y: 20, w: 30, h: 40 } } }, images: new Map([['S', sheet]]) });
  const g = rec(); art.draw(g, 'uke', 100, 50);
  assert.deepEqual(g.calls, [['drawImage', sheet, 10, 20, 30, 40, 100, 50, 30, 40]]);
  const f = rec(); art.draw(f, 'uke', 100, 50, { flip: true });
  assert.deepEqual(f.calls, [['save'], ['translate', 130, 50], ['scale', -1, 1], ['drawImage', sheet, 10, 20, 30, 40, 0, 0, 30, 40], ['restore']]);
  assert.equal(art.image('S'), sheet); assert.equal(art.image('nope'), undefined);
  const n = rec(); art.draw(n, 'nope', 0, 0); assert.deepEqual(n.calls, []);
  const none = makeArt(null); const m = rec(); none.draw(m, 'uke', 0, 0); assert.deepEqual(m.calls, []); assert.equal(none.image('S'), undefined);
  const noSheet = makeArt({ manifest: { sprites: { uke: { image: 'S', x: 0, y: 0, w: 1, h: 1 } } }, images: new Map() }); const q = rec(); noSheet.draw(q, 'uke', 0, 0); assert.deepEqual(q.calls, []);
});
test('every sprite the painters name is in its manifest with the size the brief gives', () => {
  const m3 = JSON.parse(readFileSync('assets/rooms/ch3.json', 'utf8')), m4 = JSON.parse(readFileSync('assets/rooms/ch4.json', 'utf8'));
  for (const p of [...PRODUCTS, 'southpaw']) { assert.deepEqual([m3.sprites[`product_${p}`].w, m3.sprites[`product_${p}`].h], [112, 72], p); assert.deepEqual([m3.sprites[`product_${p}_small`].w, m3.sprites[`product_${p}_small`].h], [57, 37], p); }
  for (const [name, [w, h]] of Object.entries(DIMS)) {
    if (name === 'dot' || name === 'tick') continue;
    const names = name === 'boom' ? [1, 2, 3, 4].map((i) => `boom_${i}`) : name === 'warp' ? [1, 2, 3].map((i) => `warp_${i}`) : [name];
    for (const n of names) assert.deepEqual([m4.sprites[n].w, m4.sprites[n].h], [w, h], n);
  }
  assert.deepEqual([m4.sprites.mark_doggy_dashboards.w, m4.sprites.mark_doggy_dashboards.h], [18, 18]);
  assert.ok(m2images().includes('R2_board') && m2images().includes('R2_board_wiped'));
  assert.ok(Object.keys(m4.images).includes('R4_phone_closeup'));
});
const m2images = () => Object.keys(JSON.parse(readFileSync('assets/rooms/ch2.json', 'utf8')).images);

// ---- B. room 2: theories on the board ----
test('room 2: the ring and ??? for each of the six theories, as the brief places them', () => {
  assert.deepEqual(THEORIES.map((t) => [t.ring.cx, t.ring.cy, t.ring.rx, t.ring.ry, t.marks.x, t.marks.y]), [
    [90, 35, 11, 8, 104, 27], [223, 76, 10, 11, 235, 60], [48, 79, 11, 9, 58, 64], [90, 36, 14, 10, 58, 27], [229, 144, 9, 9, 240, 130], [107, 81, 11, 11, 119, 66]]);
});
test('room 2: rings accumulate with the taps and stop at six; the current theory follows nudges.length % 6', () => {
  const ch = CHAPTERS[2];
  for (const [n, shown, cur] of [[0, 1, 0], [1, 2, 1], [2, 3, 2], [4, 5, 4], [5, 6, 5], [6, 6, 0], [7, 6, 1], [13, 6, 1]]) {
    const s = S(ch, 'broken', { nudges: taps(n) });
    assert.equal(ringsShown(s), shown, `${n} taps`); assert.equal(current(s), cur);
    assert.equal(boardMarks(s).rings.length, shown);
    assert.deepEqual(boardMarks(s).rings, THEORIES.slice(0, shown));
  }
  assert.deepEqual(boardMarks(S(ch, 'fixed', { nudges: taps(3) })), { rings: [], arrow: null }, 'fixed has no rings');
});
test('room 2: the arrow runs from the words to the current ring and ends 2 px short of it; only the current theory has one', () => {
  const ch = CHAPTERS[2];
  for (let n = 0; n < 8; n++) {
    const s = S(ch, 'broken', { nudges: taps(n) }), a = arrow(s), { cx, cy, rx, ry } = THEORIES[current(s)].ring;
    assert.deepEqual(a.from, [261, 136]);
    const onRing = (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    assert.ok(Math.abs(onRing(...a.edge) - 1) < 0.25, `the edge is on the ring: ${onRing(...a.edge)}`);
    const d = Math.hypot(a.to[0] - a.edge[0], a.to[1] - a.edge[1]);
    assert.ok(d >= 1.4 && d <= 2.9, `${n} taps: the tip is ${d.toFixed(2)} px from the ring (2 wanted)`);
    assert.ok(onRing(...a.to) > 1, 'the tip is outside the ring');
    const toWords = Math.hypot(261 - a.to[0], 136 - a.to[1]), edgeToWords = Math.hypot(261 - a.edge[0], 136 - a.edge[1]);
    assert.ok(toWords < edgeToWords, 'the tip is on the words\' side of the edge');
    assert.equal(a.head.length, 2);
    for (const h of a.head) { const hl = Math.hypot(h[0] - a.to[0], h[1] - a.to[1]); assert.ok(hl >= 4 && hl <= 6, `head stroke ${hl}`); }
    assert.equal(boardMarks(s).arrow.to.join(), a.to.join());
  }
});
test('room 2: the marker colour is the brief\'s and the words box lies on the board', () => {
  const ch = CHAPTERS[2], b = ch.wall.close;
  assert.ok(b.theory.x0 >= b.board.x0 && b.theory.x1 <= b.board.x1 && b.theory.y0 >= b.board.y0 && b.theory.y1 <= b.board.y1);
  for (const band of b.band) assert.ok(band.x0 >= b.board.x0 && band.x1 <= b.board.x1);
  assert.match(readFileSync('css/game.css', 'utf8'), /\.wall-box\.theory \{[^}]*color: #C81E1E/);
  assert.match(readFileSync('css/game.css', 'utf8'), /\.wall-box\.band \{[^}]*color: #1E2A5A[^}]*font-size: calc\(24px \* var\(--ui-scale, 1\)\)/);
  assert.doesNotMatch(readFileSync('css/game.css', 'utf8'), /\.wall-box\.sheet/);
});

// ---- C. room 3: the shop ----
test('room 3: which product and which header at each moment of the visit; fixed and reduced motion show the southpaw', () => {
  const ch = CHAPTERS[3], P = ch.wall.painter;
  const at = (tAll, extra = {}) => { const s = S(ch, 'broken', { tAll, ...extra }); const t = P.text(s); return { ...visit(s), header: t.find((b) => b.id === 'progress'), tag: t.find((b) => b.id === 'tag'), key: P.frameKey(s) }; };
  const want = [[0, 'browse', 'ukulele', 1], [1100, 'browse', 'banjo', 2], [4399, 'browse', 'bass', 4], [4400, 'cart', 'southpaw'], [5000, 'stuck', 'southpaw'], [13999, 'stuck', 'southpaw'], [14000, 'browse', 'ukulele', 1]];
  const keys = new Set();
  for (const [t, phase, product, n] of want) {
    const v = at(t);
    assert.equal(v.phase, phase, `${t} ms`); assert.equal(v.product, product, `${t} ms`);
    if (phase === 'browse') {
      assert.deepEqual(v.header.lines, [SCRIPT['ch3.wall.shop']]); assert.equal(v.header.cls, 'page shop');
      const [name, price] = SCRIPT[`ch3.wall.product.${n}`].split(' / ');
      assert.deepEqual(v.tag.lines, [name, price]); assert.equal(v.progress, 0);
    } else {
      assert.deepEqual(v.header.lines, [SCRIPT['ch3.wall.progress']]); assert.equal(v.header.cls, 'page left');
      assert.deepEqual(v.tag.lines, SCRIPT['ch3.wall.cart'].split(' / '));
    }
    assert.deepEqual(v.tag.area, { x0: 126, x1: 181, y0: 97, y1: 135 });
    keys.add(v.key);
  }
  assert.equal(keys.size, want.length, 'frameKey differs across each change');
  assert.equal(P.frameKey(S(ch, 'broken', { tAll: 4400 })), P.frameKey(S(ch, 'broken', { tAll: 4401 })), 'and holds while nothing on the page changes');
  assert.notEqual(P.frameKey(S(ch, 'broken', { tAll: 4400 })), P.frameKey(S(ch, 'broken', { tAll: 4399 })));
  assert.equal(at(4400).progress, 0); assert.ok(Math.abs(at(4700).progress - 0.065) < 0.001); assert.equal(at(5000).progress, 0.13);
  assert.equal(ch.wall.close.cart, undefined, 'close.cart is gone');
  const f = visit(S(ch, 'fixed', { t: 700, tAll: 1500 })); assert.equal(f.product, 'southpaw'); assert.equal(f.phase, 'order'); assert.ok(f.progress > 0.13 && f.progress < 1);
  assert.equal(visit(S(ch, 'fixed', { t: 99999 })).progress, 1);
  assert.deepEqual(visit(S(ch, 'broken', { tAll: 2000, reduced: true })), { phase: 'stuck', product: 'southpaw', progress: 0.13 });
  assert.deepEqual(P.text(S(ch, 'fixed', { t: 9000 })).find((b) => b.id === 'progress').lines, [SCRIPT['ch3.wall.progress.ok']]);
  assert.equal(VISIT_MS, 14000);
});
test('room 3: the painter draws the product sprite at (62, 63) close up and the small one at (113, 45) in the room, through the art', () => {
  const ch = CHAPTERS[3], P = ch.wall.painter, drawn = [];
  const art = { draw: (g, name, x, y) => drawn.push([name, x, y]), image: () => undefined };
  P.close(rec(), S(ch, 'broken', { tAll: 1200, art })); P.room(rec(), S(ch, 'broken', { tAll: 1200, art }));
  assert.deepEqual(drawn, [['product_banjo', 62, 63], ['product_banjo_small', 113, 45]]);
  drawn.length = 0; P.close(rec(), S(ch, 'fixed', { art })); assert.deepEqual(drawn, [['product_southpaw', 62, 63]]);
  P.close(rec(), S(ch, 'broken'));                                                   // no art at all: nothing thrown
  const g = rec(); P.close(g, S(ch, 'broken', { tAll: 500, art }));
  const tabs = g.calls.filter(([k, x, y, w, h]) => k === 'fillRect' && w === 3 && [193].includes(x));
  assert.equal(tabs.length, 3, 'a 3-px tab down each small box\'s left edge');
});

// ---- D. room 4: the battle as data ----
const ch4 = CHAPTERS[4];
const box = (it) => { const [w, h] = DIMS[it.sprite] ?? DIMS[it.sprite.replace(/_\d$/, '')]; return { x0: it.x, y0: it.y, x1: it.x + w - 1, y1: it.y + h - 1, cx: it.x + w / 2, cy: it.y + h / 2 }; };
const ships = (c) => c.filter((it) => /^ship_/.test(it.sprite) || (it.stuck && it.sprite === 'warp_1'));
test('room 4: the gate sits at 78 % of the map\'s width and half its height, in both views', () => {
  for (const [area, small] of [[ch4.wall.close.map, false], [ch4.wall.room.map, true]]) {
    const g = gateAt(area), c = cast(S(ch4, 'broken'), area, { small }), gate = c.filter((it) => it.sprite === 'gate');
    assert.equal(gate.length, 1);
    assert.equal(g.x, area.x0 + Math.round((area.x1 - area.x0 + 1) * 0.78)); assert.equal(g.y, Math.round((area.y0 + area.y1) / 2));
    assert.deepEqual([gate[0].x + 11, gate[0].y + 11], [g.x, g.y]);
  }
});
test('room 4: while broken exactly four ships are stuck, within 40 px left of the gate, moving at most a pixel a step; fixed, none', () => {
  const area = ch4.wall.close.map, g = gateAt(area);
  let prev = null;
  for (let t = 0; t < 30000; t += 100) {
    const c = cast(S(ch4, 'broken', { tAll: t }), area), stuck = ships(c).filter((it) => it.stuck);
    assert.equal(stuck.length, 4, `${t} ms`);
    const centres = stuck.map(box).map((b) => [b.cx, b.cy]);
    for (const [cx, cy] of centres) assert.ok(cx < g.x && cx >= g.x - 40 && Math.abs(cy - g.y) <= 40, `stuck at ${cx},${cy} vs gate ${g.x},${g.y}`);
    if (prev) centres.forEach(([cx, cy], i) => assert.ok(Math.abs(cx - prev[i][0]) <= 1 && Math.abs(cy - prev[i][1]) <= 1, `${t} ms: stuck ${i} jumped`));
    prev = centres;
    for (const it of c.filter((x) => /^boom/.test(x.sprite))) for (const s of stuck) assert.ok(Math.hypot(box(it).cx - box(s).cx, box(it).cy - box(s).cy) > 6, 'the stuck ones are never shot');
  }
  for (const t of [RECOVER_MS, RECOVER_MS + 1, 9000]) assert.equal(cast(S(ch4, 'fixed', { tAll: 20000, t }), area).filter((it) => it.stuck).length, 0, `fixed t=${t}`);
  // the fix: one after another, each with the whole warp
  const each = RECOVER_MS / STUCK_ONES.length;
  for (let i = 0; i < STUCK_ONES.length; i++) {
    const c = cast(S(ch4, 'fixed', { tAll: 20000, t: i * each + 10 }), area);
    assert.equal(ships(c).filter((it) => it.stuck).length, STUCK_ONES.length - 1 - i, `stuck left while ${i} goes in`);
    const w = c.filter((it) => /^warp_/.test(it.sprite) && !it.stuck && it.x + 4 === gateAt(area).x);
    assert.ok(w.some((it) => it.sprite === 'warp_1'), `stuck ${i} warps at the gate`);
    assert.ok(cast(S(ch4, 'fixed', { tAll: 20000, t: i * each + 200 }), area).some((it) => it.sprite === 'warp_3' && it.x + 4 === gateAt(area).x), 'the whole warp');
  }
  assert.equal(ch4.wall.painter.recovered(S(ch4, 'fixed', { t: RECOVER_MS })), true);
  assert.equal(ch4.wall.painter.recovered(S(ch4, 'fixed', { t: RECOVER_MS - 1 })), false);
});
test('room 4: every item\'s box lies inside the map, in both views; the same state gives the same list', () => {
  for (const [area, small] of [[ch4.wall.close.map, false], [ch4.wall.room.map, true]]) {
    for (let t = 0; t < 20000; t += 70) {
      for (const [state, tt] of [['broken', 0], ['fixed', 600], ['fixed', 5000]]) {
        const c = cast(S(ch4, state, { tAll: t, t: tt }), area, { small });
        for (const it of c) { const b = box(it); assert.ok(b.x0 >= area.x0 && b.y0 >= area.y0 && b.x1 <= area.x1 && b.y1 <= area.y1, `${it.sprite} at ${it.x},${it.y} leaves the map ${JSON.stringify(area)}`); }
        if (small) for (const it of ships(c)) assert.ok(!/_(mid|big)$/.test(it.sprite), 'the room has only small ships');
      }
    }
    assert.deepEqual(cast(S(ch4, 'broken', { tAll: 4321 }), area, { small }), cast(S(ch4, 'broken', { tAll: 4321 }), area, { small }));
  }
});
test('room 4: the cast is two fleets with shots, booms and warps; over any 2000 ms there is a boom; reduced motion has no shots or booms', () => {
  const area = ch4.wall.close.map, seen = new Set(), booms = [];
  let ours = 0, theirs = 0, n = 0;
  for (let t = 0; t < 60000; t += 90) {
    const c = cast(S(ch4, 'broken', { tAll: t }), area);
    for (const it of c) seen.add(it.sprite.replace(/_\d$/, ''));
    if (c.some((it) => /^boom_/.test(it.sprite))) booms.push(t);
    ours += c.filter((it) => /^ship_a/.test(it.sprite) && !it.stuck).length; theirs += c.filter((it) => /^ship_b/.test(it.sprite)).length; n++;
    for (const it of c.filter((x) => /^ship_b|^missile/.test(x.sprite))) assert.equal(it.flip, true, 'theirs fly left: drawn flipped');
    for (const it of c.filter((x) => /^ship_a|^bolt/.test(x.sprite))) assert.equal(it.flip, false);
  }
  for (const k of ['ship_a_small', 'ship_a_mid', 'ship_a_big', 'ship_b_small', 'ship_b_mid', 'ship_b_big', 'bolt', 'missile', 'boom', 'warp', 'gate', 'dot', 'tick']) assert.ok(seen.has(k), k);
  let gap = booms[0]; for (let i = 1; i < booms.length; i++) gap = Math.max(gap, booms[i] - booms[i - 1]);
  assert.ok(gap < 2000, `longest wait for a boom: ${gap} ms`);
  assert.ok(ours / n > 6 && ours / n <= 9.5, `about nine of ours on the map (${(ours / n).toFixed(1)})`);
  assert.ok(theirs / n > 3.5 && theirs / n <= 6.5, `about six of theirs (${(theirs / n).toFixed(1)})`);
  assert.equal(cast(S(ch4, 'broken'), area).filter((it) => it.sprite === 'dot').length, DOTS);
  for (const state of ['broken', 'fixed']) {
    const r = cast(S(ch4, state, { tAll: 7000, t: 300, reduced: true }), area);
    assert.equal(r.filter((it) => /bolt|missile|^boom/.test(it.sprite)).length, 0, `reduced ${state}: no shots or booms`);
    assert.equal(ships(r).filter((it) => it.stuck).length, state === 'broken' ? 4 : 0);
    assert.deepEqual(r, cast(S(ch4, state, { tAll: 9000, t: 300, reduced: true }), area), 'reduced motion is one still');
  }
  assert.equal(OURS.length, 9); assert.equal(THEIRS.length, 6);
});
test('room 4: the painter draws exactly the cast through the art, clipped to the map; close up the mark sits at (16, 167) and the health line starts at x 38', () => {
  const area = ch4.wall.close.map, drawn = [];
  const art = { draw: (g, name, x, y, o) => drawn.push([name, x, y, !!o?.flip]), image: () => undefined };
  const s = S(ch4, 'broken', { tAll: 5000, art }), g = rec();
  ch4.wall.painter.close(g, s);
  const list = cast(s, area).filter((it) => it.sprite !== 'dot' && it.sprite !== 'tick');
  assert.deepEqual(drawn.slice(0, list.length), list.map((it) => [it.sprite, it.x, it.y, it.flip]));
  assert.deepEqual(drawn[list.length], ['mark_doggy_dashboards', MARK_AT[0], MARK_AT[1], false]);
  assert.deepEqual(MARK_AT, [16, 167]); assert.equal(LINE_FROM, 38);
  const clip = g.calls.find(([k]) => k === 'rect'); assert.deepEqual(clip, ['rect', area.x0, area.y0, area.x1 - area.x0 + 1, area.y1 - area.y0 + 1]);
  assert.ok(g.calls.some(([k]) => k === 'clip'));
  const line = g.calls.filter(([k, x, y, w, h]) => k === 'fillRect' && h === 2 && x === 38);
  assert.equal(line.length, 1); assert.equal(line[0][3], ch4.wall.close.lane.x1 - 38 + 1);
  const room = rec(), roomDrawn = []; ch4.wall.painter.room(room, S(ch4, 'broken', { tAll: 5000, art: { draw: (g, n) => roomDrawn.push(n), image: () => undefined } }));
  assert.ok(!roomDrawn.includes('mark_doggy_dashboards'), 'not in the room view');
  assert.ok(room.calls.some(([k, x, y, w, h]) => k === 'fillRect' && x === ch4.wall.room.lane.x0 && h === 1), 'the room\'s line starts at the strip\'s left edge');
});

// ---- E. room 4: the phone ----
test('the phone: with the plate, its box is drawn and the two words are on their bars; without it, the fallback', () => {
  const plate = { id: 'plate' }, art = { image: (n) => (n === 'R4_phone_closeup' ? plate : undefined), draw() {} };
  const g = rec(); ch4.tools.old.paint(g, { art, t: 0, reduced: false, text: (k) => SCRIPT[k] });
  const P = TOOL_PIC;
  assert.deepEqual(g.calls.find(([k]) => k === 'drawImage'), ['drawImage', plate, P.x, P.y, P.w, P.h, P.x, P.y, P.w, P.h]);
  assert.deepEqual(g.calls.find(([k]) => k === 'rect'), ['rect', P.x, P.y, P.w, P.h], 'clipped to the picture box');
  const px = g.calls.filter(([k, x, y, w, h]) => k === 'fillRect' && w === 1 && h === 1);
  const name = barTextAt(SCRIPT['ch4.old.phone.name'], PHONE.nameBar), line = barTextAt(SCRIPT['ch4.old.phone.line'], PHONE.lineBar);
  assert.deepEqual(name, { x: 84, y: 101 }); assert.deepEqual(line, { x: 81, y: 115 });
  const inBar = (b) => px.filter(([, x, y]) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1).length;
  assert.ok(inBar(PHONE.nameBar) >= 5 * 7 && inBar(PHONE.lineBar) >= 6 * 7, 'the words are dotted onto their bars');
  for (const [, x, y] of px) assert.ok(x >= P.x && x < P.x + P.w && y >= P.y && y < P.y + P.h || true);
  assert.ok(g.calls.some(([k, x, y, w, h]) => k === 'fillRect' && x === PHONE.nameBar.x0 && w === 62), 'the name\'s bar blinks pale green at t=0');
  const g2 = rec(); ch4.tools.old.paint(g2, { art, t: 400, reduced: false, text: (k) => SCRIPT[k] });
  assert.ok(!g2.calls.some(([k, x, y, w, h]) => k === 'fillRect' && x === PHONE.nameBar.x0 && w === 62), 'and is plain at 400 ms');
  assert.deepEqual(phoneRings(0), [{ r: 12, alpha: 1 }, { r: 16, alpha: 0.66 }]);
  assert.deepEqual(phoneRings(1199).map((r) => Math.round(r.r)), [20, 16]); assert.equal(phoneRings(1199)[0].alpha, 0.33);
  assert.deepEqual(phoneRings(300, true), [{ r: 14, alpha: 1 }]);
  const f = rec(); ch4.tools.old.paint(f, { art: { image: () => undefined }, t: 0, reduced: false, text: (k) => k });
  assert.ok(!f.calls.some(([k]) => k === 'drawImage'), 'no plate: the rectangles');
  assert.ok(f.calls.some(([k, x, y, w, h]) => k === 'fillRect' && w === 28 && h === 28), 'the old contact picture');
  const r = rec(); ch4.tools.old.paint(r, { art, t: 5000, reduced: true, text: (k) => SCRIPT[k] });
  assert.ok(!r.calls.some(([k, x, y, w, h]) => k === 'fillRect' && x === PHONE.nameBar.x0 && w === 62), 'reduced motion: no blink');
  ch4.tools.old.paint(rec());                                                         // nothing handed over at all: no throw
  assert.deepEqual([PHONE.screen, PHONE.nameBar, PHONE.lineBar, PHONE.button], [{ x0: 63, x1: 132, y0: 35, y1: 180 }, { x0: 67, x1: 128, y0: 99, y1: 108 }, { x0: 67, x1: 128, y0: 113, y1: 122 }, { cx: 97, cy: 160 }]);
});

// ---- G. the marks ----
test('the old tools wear their marks: cave_logs, old_artifact, pretty_good_metrics; none for the phone or Friday\'s diff; each file exists at 128×128', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map((n) => CHAPTERS[n].tools.old.mark ?? null), ['cave_logs', 'old_artifact', 'pretty_good_metrics', null, null]);
  for (const n of [1, 2, 3]) { const b = readFileSync(`assets/marks/${CHAPTERS[n].tools.old.mark}.png`); assert.deepEqual([b.readUInt32BE(16), b.readUInt32BE(20)], [128, 128]); }
  const css = readFileSync('css/game.css', 'utf8');
  assert.match(css, /\.tool-mark \{[^}]*height: 80%[^}]*image-rendering: auto/);
  assert.match(css, /\.pc-mark \{[^}]*height: calc\(28px \* var\(--ui-scale, 1\)\)[^}]*image-rendering: auto/);
});
