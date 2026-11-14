// Chapter 1 — Agent Observability · Enterprise · the CTO (spec: Chapters › 1, the 2026-11-12 redesign). Data
// in the shape every scenario shares (brief 08); js/screens/chapter.js plays it, the rules are
// js/engine/scenario.js, the wall display is js/chapters/ch1-wall.js over js/engine/vitals.js. Every word is a
// script key.
//
// Positions are the art hand-back's measurements on the 320x200 scene (assets/rooms/, built by
// tools/build_rooms.py); areas are { x0, x1, y0, y1 } inclusive.

import { HERO_W } from '../engine/hero.js';
import { SCENE_W } from '../engine/room.js';
import { WALL } from './ch1-wall.js';

export const MANIFEST = 'assets/rooms/ch1.json';

export const ROOM = {
  image: 'R1_exec_floor',
  floorY: 192,                         // the hero's feet
  walk: [0, SCENE_W - HERO_W],         // the hero's left edge
  start: 128,                          // between the cube and the CTO's desk (the 56-px hero's left edge: brief 09)
  heroScale: 1,
  // listed in drawing order: where two overlap the later one wins, so the monitor beats the PC at its corner.
  // Stand points are for the 56-px hero (brief 09, item 8): the same centres as before, the CTO's re-measured.
  hotspots: [
    { id: 'pc', rect: { x: 0, y: 75, w: 135, h: 111 }, standX: 73, look: 'ch1.look.pc', use: { scene: 'pc' } },
    { id: 'cto', rect: { x: 206, y: 82, w: 100, h: 102 }, standX: 148, look: 'ch1.look.cto', use: { action: 'persona' } },
    { id: 'monitor', rect: { x: 114, y: 26, w: 92, h: 50 }, walk: false, look: 'ch1.look.monitor', use: { scene: 'wall' } },
  ],
};

/** Otto's vitals monitor, the wall display: where the game draws, in the room and close up; the painter is ch1-wall.js. */
export const MONITOR = {
  image: 'R1_monitor_closeup',
  chart: 'ch1.monitor.chart',
  painter: WALL,
  text: {
    pool: Array.from({ length: 10 }, (_, i) => `ch1.vitals.stat.${i + 1}`),
    okPool: Array.from({ length: 5 }, (_, i) => `ch1.vitals.ok.${i + 1}`),
    output: 'ch1.vitals.output',
    outputOk: 'ch1.vitals.output.ok',
  },
  // Nudged from the art hand-back (Warp brief 03): the traces sit inside their panel's frame rather than on
  // it (room lane 118–180 × 30–50 → 120–178 × 32–48; close-up 27–224 × 26–91 → 29–222 × 29–88), and the
  // lights cover the art's chips exactly: room (120,54) (142,54) (164,54) → (119,54) (141,54) (163,54); close-up
  // (31,104) (100,104) (169,104) → one row lower, (31,105) (100,105) (169,105), 10×5 inside each chip's rim.
  room: {
    lane: { x0: 120, x1: 178, y0: 32, y1: 48 },
    lights: [[119, 54], [141, 54], [163, 54]], lightSize: [4, 2],
    output: { x0: 183, x1: 203, y0: 30, y1: 72 },
  },
  close: {
    lane: { x0: 29, x1: 222, y0: 29, y1: 88 },
    boxes: [{ x0: 27, x1: 87, y0: 116, y1: 164 }, { x0: 95, x1: 156, y0: 116, y1: 164 }, { x0: 164, x1: 224, y0: 116, y1: 164 }],
    boxHits: [{ x0: 27, x1: 87, y0: 100, y1: 164 }, { x0: 95, x1: 156, y0: 100, y1: 164 }, { x0: 164, x1: 224, y0: 100, y1: 164 }],
    lights: [[31, 105], [100, 105], [169, 105]], lightSize: [10, 5],
    output: { x0: 232, x1: 293, y0: 26, y1: 164 },
    screen: { x0: 18, x1: 301, y0: 16, y1: 174 },     // a tap outside the glass goes back to the room
  },
};

/** The hero's 80s PC: everything is drawn inside its screen. */
export const PC = {
  image: 'R1_pc_closeup',
  screen: { x0: 66, x1: 254, y0: 30, y1: 162 },
  title: 'ch1.pc.title',
  menu: [
    { id: 'email', key: 'ch1.pc.menu.email', action: 'email' },
    { id: 'vitals', key: 'ch1.pc.menu.vitals', action: 'status' },
    { id: 'old', key: 'ch1.pc.menu.old', action: 'tool', tool: 'old' },
    { id: 'hc', key: 'ch1.pc.menu.hc', action: 'tool', tool: 'hc' },
    { id: 'leave', key: 'ch1.pc.menu.leave', action: 'leave' },
  ],
  emails: [1, 2, 3, 4, 5].map((i) => `ch1.pc.email.${i}`),
  reply: 'ch1.pc.email.reply',
  status: { before: 'ch1.pc.vitals.before', old: 'ch1.pc.vitals.old', found: 'ch1.pc.vitals.found', hc: 'ch1.pc.vitals.hc' },
  // once the cause is found: deploy the fix, watch Otto recover on the monitor, hear from him
  deploy: { item: 'ch1.pc.menu.deploy', line: 'ch1.pc.deploy', recovered: 'ch1.otto.recovered' },
  leave: 'ch1.pc.leave', locked: 'ch1.pc.leave.locked',
};

/** The persona: the CTO, on the phone with the Cave Logs renewal. Her lines are the script's `CTO: …` lines; they
 * show in the conversation window with her close-up portrait (assets/portrait_p1.png and its frames), which sits
 * top left because she stands on the right. Her card (brief 07): name, class, four stats and a line of flavor from
 * the script; the picture is the card art (`P1` in assets/cards/cards.json), or, if that file is missing, the CTO
 * cropped from the room plate. In the room she talks on the phone the whole time (loop 'always'): room → talk_1 →
 * room → talk_2 at the manifest's patch; she has no rest, idle or win frame (Rick approved her loop). */
export const PERSONA = {
  name: 'ch1.persona.name', class: 'ch1.persona.class', stats: 'ch1.persona.stats', flavor: 'ch1.persona.flavor',
  card: 'P1', art: 'assets/cards/P1_card.png', crop: { image: 'R1_exec_floor', x: 192, y: 62, w: 112, h: 70 },
  portrait: 'p1', where: 'top-left',
  loop: 'always', frames: { talk: ['R1_cto_talk_1', 'R1_cto_talk_2'], rest: null, idle: [], win: null },
  calls: [1, 2, 3].map((i) => `ch1.cto.call.${i}`),
  ask: 'ch1.cto.ask',
  // her own instinct is to sign the contract (the option keeps its old id, `sign`, for the room's tests)
  options: { wrong: { id: 'sign', key: 'ch1.decide.sign', jab: 'ch1.decide.sign.jab' }, hc: { key: 'ch1.decide.hc', show: 'ch1.decide.hc.show' } },
};

// ---- product-screen pictures ----
// Both tools draw their picture in the same rectangle (the Honeycomb pictures' own size, from
// assets/screens/ch1_hc.json); the prompts take the column from 61.5% of the scene (brief 06).

export const TOOL_PIC = { x: 4, y: 20, w: 188, h: 176 };

/** Cave Logs: a black window of JSON, every line technically true. */
function paintOld(g) {
  const P = TOOL_PIC;
  g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
  g.fillStyle = '#2A3346'; g.fillRect(P.x - 2, P.y - 2, P.w + 4, P.h + 4);
  g.fillStyle = '#050805'; g.fillRect(P.x, P.y, P.w, P.h);
  const widths = [90, 160, 60, 172, 120, 76, 150, 54, 130, 96, 176, 70, 138, 84, 112, 64, 156, 92, 58, 134, 100];
  widths.forEach((w, i) => { g.fillStyle = i % 5 === 2 ? '#2E7A2E' : '#3CC83C'; g.fillRect(P.x + 6, P.y + 6 + i * 8, Math.min(w, P.w - 12), 3); });
}

const step = (n) => ({
  prompts: [
    { key: `ch1.hc.step${n}.prompt.1`, right: true },
    { key: `ch1.hc.step${n}.prompt.2`, jab: `ch1.hc.step${n}.jab.2` },
    { key: `ch1.hc.step${n}.prompt.3`, jab: `ch1.hc.step${n}.jab.3` },
  ],
  result: `ch1.hc.step${n}.result`,
});

export const CH1 = {
  id: 1,
  manifest: MANIFEST,
  card: { title: 'ch1.card.title', line: 'ch1.card.line' },
  enter: 'ch1.room.enter',
  room: ROOM,
  persona: PERSONA,
  wall: MONITOR,
  pc: PC,
  tools: {
    old: {
      kind: 'old', title: 'ch1.old.title', intro: 'ch1.old.intro', exit: 'ch1.old.exit', close: 'ch1.old.close',
      steps: [{ prompts: [1, 2, 3].map((i) => ({ key: `ch1.old.prompt.${i}`, jab: `ch1.old.jab.${i}` })) }],
      paint: paintOld,
    },
    hc: {
      kind: 'hc', title: 'ch1.hc.title', intro: 'ch1.hc.intro',
      steps: [step(1), step(2)],
      screens: 'assets/screens/ch1_hc.json',     // one picture per stage, drawn by js/engine/screens.js
    },
  },
  win: ['ch1.win', 'ch1.hero.line'],
  verdict: { key: 'ch1.verdict', portrait: 'assets/portrait_christine.png' },
};
