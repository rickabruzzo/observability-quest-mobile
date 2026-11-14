// Every scenario is data (Warp brief 08): the rooms pass checkRoom, every key exists in the script, the
// persona's frames exist in the room's manifest, the hero's stand points are brief 09's, and the chapter screen
// names no scenario.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHAPTERS } from '../js/chapters/index.js';
import { checkRoom, MIN_HIT } from '../js/engine/room.js';
import { SCRIPT } from '../js/script.js';
import { HERO_W } from '../js/engine/hero.js';
import { AVAILABLE, SCENARIOS } from '../js/menu.js';

const ids = Object.keys(CHAPTERS).map(Number);
const keysIn = (v) => JSON.stringify(v).match(/"(ch\d\.[a-z0-9.]+|ui\.[a-z.]+|persona\.[a-z]+|help\.[a-z]+)"/g)?.map((k) => JSON.parse(k)) ?? [];

test('every built scenario is on the menu, and the menu offers only built ones', () => {
  assert.deepEqual(AVAILABLE, ids);
  assert.ok(ids.every((n) => SCENARIOS.includes(n)));
});

for (const n of ids) {
  const ch = CHAPTERS[n];
  test(`scenario ${n}: the room passes checkRoom against the real script; every target is MIN_HIT or bigger`, () => {
    assert.equal(ch.id, n);
    assert.deepEqual(checkRoom(ch.room, SCRIPT), []);
    assert.deepEqual(ch.room.walk, [0, 320 - HERO_W]); assert.equal(ch.room.floorY, 192);
    for (const h of ch.room.hotspots) assert.ok(h.rect.w >= MIN_HIT && h.rect.h >= MIN_HIT, `${h.id} ${h.rect.w}x${h.rect.h}`);
    for (const h of ch.room.hotspots) if (h.walk !== false) assert.ok(h.standX + HERO_W <= 320, h.id);
  });
  test(`scenario ${n}: every script key its data names exists`, () => {
    const missing = [...new Set(keysIn(ch))].filter((k) => !SCRIPT[k]);
    assert.deepEqual(missing, []);
  });
  test(`scenario ${n}: the shape every scenario shares`, () => {
    assert.ok(ch.card.title && ch.card.line && !ch.card.stats);
    assert.ok(ch.enter && ch.manifest && ch.verdict.key && ch.verdict.portrait);
    assert.ok(ch.persona.name && ch.persona.class && ch.persona.stats && ch.persona.flavor && ch.persona.portrait && ch.persona.where);
    assert.ok(Array.isArray(ch.persona.calls) && ch.persona.calls.length === 3 && ch.persona.ask);
    assert.ok(ch.persona.options.wrong.key && ch.persona.options.wrong.jab && ch.persona.options.hc.key && ch.persona.options.hc.show);
    assert.ok(Array.isArray(ch.persona.frames.talk) && ch.persona.frames.talk.length === 2);
    assert.ok(ch.wall.chart && ch.wall.image && ch.wall.painter && typeof ch.wall.painter.room === 'function' && typeof ch.wall.painter.close === 'function');
    assert.ok(['pc', 'wall'].every((s) => ch.room.hotspots.some((h) => h.use?.scene === s)), 'a computer and a wall display');
    assert.ok(ch.room.hotspots.some((h) => h.use?.action === 'persona'), 'the persona');
    assert.ok(ch.room.hotspots.find((h) => h.use?.scene === 'wall').walk === false, 'the wall never walks');
    assert.ok(ch.pc.menu.some((i) => i.action === 'status') && ch.pc.menu.some((i) => i.action === 'tool' && i.tool === 'old') && ch.pc.menu.some((i) => i.action === 'tool' && i.tool === 'hc') && ch.pc.menu.at(-1).action === 'leave');
    assert.ok(ch.pc.status.before && ch.pc.status.old && ch.pc.status.found && ch.pc.status.hc);
    assert.ok(ch.pc.deploy.item && ch.pc.deploy.line && ch.pc.deploy.recovered && ch.pc.leave && ch.pc.locked && ch.pc.reply && ch.pc.emails.length >= 3);
    const { old, hc } = ch.tools;
    assert.equal(old.kind, 'old'); assert.ok(old.steps[0].prompts.every((p) => !p.right && p.jab) && old.close && old.exit && typeof old.paint === 'function');
    assert.equal(hc.kind, 'hc'); assert.equal(hc.steps.length, 2);
    for (const s of hc.steps) { assert.equal(s.prompts.length, 3); assert.equal(s.prompts[0].right, true); assert.ok(s.prompts.slice(1).every((p) => !p.right && p.jab)); assert.ok(s.result); }
    assert.ok(hc.screens.endsWith(`ch${n}_hc.json`));
    assert.ok(Array.isArray(ch.win) && ch.win.length >= 2);
  });
  test(`scenario ${n}: the persona's frames and the close-ups are in the room's manifest; the card is in cards.json`, () => {
    const m = JSON.parse(readFileSync(ch.manifest, 'utf8'));
    const names = new Set(Object.keys(m.images));
    for (const f of [ch.room.image, ch.wall.image, ch.pc.image, ...ch.persona.frames.talk, ch.persona.frames.rest, ch.persona.frames.win, ...(ch.persona.frames.idle || []), ch.wall.fixedImage].filter(Boolean)) assert.ok(names.has(f), f);
    assert.ok(m.patches[ch.room.image], 'a patch for the persona\'s frames');
    const cards = JSON.parse(readFileSync('assets/cards/cards.json', 'utf8'));
    assert.ok(cards.cards[ch.persona.card], ch.persona.card);
    assert.equal(ch.persona.art, `assets/cards/${cards.cards[ch.persona.card]}`);
  });
}

test('brief 09\'s stand points for the 56-px hero', () => {
  const at = (n, id) => CHAPTERS[n].room.hotspots.find((h) => h.id === id).standX;
  const PC = { 1: 73, 2: 82, 3: 248, 4: 81, 5: 104 }, NPC = { 2: 184, 3: 116, 4: 148, 5: 176 }, START = { 1: 128, 2: 156, 3: 132, 4: 136, 5: 136 };
  for (const n of ids) { assert.equal(at(n, 'pc'), PC[n], `pc ${n}`); assert.equal(CHAPTERS[n].room.start, START[n], `start ${n}`); }
  for (const n of ids.filter((n) => n > 1)) assert.equal(at(n, 'npc'), NPC[n], `npc ${n}`);
  assert.equal(at(1, 'cto'), 148);
});

test('scenario 3 is mirrored and has the sign and the guitar; scenario 5 the pinball machine; scenario 4 the manager\'s line', { skip: !CHAPTERS[5] && 'scenarios 3–5 come with the second pull request' }, () => {
  const r3 = CHAPTERS[3].room, by = Object.fromEntries(r3.hotspots.map((h) => [h.id, h]));
  assert.ok(by.pc.rect.x > 160 && by.npc.rect.x < 100);
  assert.equal(by.sign.walk, false); assert.equal(by.sign.look, 'ch3.look.sign'); assert.ok(!by.sign.use);
  assert.equal(by.guitar.walk, false); assert.equal(by.guitar.look, 'ch3.look.guitar'); assert.equal(by.guitar.use, 'ch3.use.guitar');
  assert.equal(CHAPTERS[3].persona.where, 'top-right');
  const by5 = Object.fromEntries(CHAPTERS[5].room.hotspots.map((h) => [h.id, h]));
  assert.equal(by5.pinball.walk, false); assert.equal(by5.pinball.look, 'ch5.look.pinball');
  assert.deepEqual(CHAPTERS[4].win, ['ch4.win', 'ch4.hero.line', 'ch4.manager.line']);
});

test('the chapter screen names no scenario: no CTO, Otto, Einar, whiteboard or company in js/screens/chapter.js', () => {
  const src = readFileSync('js/screens/chapter.js', 'utf8');
  const names = /\b(cto|CTO|otto|Otto|Einar|Kestrel|Converso|Twang|Nullpoint|whiteboard|monitor|vitals|Cave Logs|Claw)\b/;
  const hits = src.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => names.test(l));
  assert.deepEqual(hits, []);
  assert.ok(!/from '\.\.\/chapters\/ch\d\.js'/.test(src), 'chapters come through js/chapters/index.js');
});
