// Chapter 3 — Frontend Observability · E-commerce · the Frontend Developer (spec: Chapters › 3; Warp brief 08). Data in the shape every scenario shares;
// js/screens/chapter.js plays it, the wall display is js/chapters/ch3-wall.js. Every word is a script key.
// Positions are brief 08's, checked against the built 320×200 files; areas { x0, x1, y0, y1 } are inclusive.

import { HERO_W } from '../engine/hero.js';
import { SCENE_W } from '../engine/room.js';
import { WALL } from './ch3-wall.js';

export const MANIFEST = 'assets/rooms/ch3.json';

export const ROOM = {
  image: 'R3_bullpen',
  floorY: 192,
  walk: [0, SCENE_W - HERO_W],
  start: 132,
  heroScale: 1,
  // mirrored: the computer is on the right, the persona on the left. The guitar leans inside the pc's rectangle,
  // so it is listed after it (the later, smaller target wins). The sign's hit area is padded to the minimum.
  hotspots: [
    { id: 'wall', rect: { x: 100, y: 30, w: 120, h: 65 }, walk: false, look: 'ch3.look.wall', use: { scene: 'wall' } },
    { id: 'pc', rect: { x: 190, y: 78, w: 130, h: 108 }, standX: 248, look: 'ch3.look.pc', use: { scene: 'pc' } },
    { id: 'guitar', rect: { x: 187, y: 84, w: 42, h: 72 }, walk: false, look: 'ch3.look.guitar', use: 'ch3.use.guitar' },
    { id: 'sign', rect: { x: 263, y: 46, w: 32, h: 28 }, walk: false, look: 'ch3.look.sign' },
    { id: 'npc', rect: { x: 8, y: 45, w: 94, h: 141 }, standX: 116, look: 'ch3.look.npc', use: { action: 'persona' } },
  ],
};

/** The Frontend Developer, at her standing desk on the left (so the conversation window sits top right). */
export const PERSONA = {
  name: 'ch3.persona.name', class: 'ch3.persona.class', stats: 'ch3.persona.stats', flavor: 'ch3.persona.flavor',
  card: 'P3', art: 'assets/cards/P3_card.png', crop: { image: 'R3_bullpen', x: 9, y: 14, w: 126, h: 79 },
  portrait: 'p3', where: 'top-right',
  loop: 'speak', frames: { talk: ['R3_npc_talk_1', 'R3_npc_talk_2'], rest: null, idle: [], win: 'R3_npc_win' },
  calls: [1, 2, 3].map((i) => `ch3.npc.call.${i}`),
  ask: 'ch3.npc.ask',
  options: { wrong: { id: 'wrong', key: 'ch3.decide.wrong', jab: 'ch3.decide.wrong.jab' }, hc: { key: 'ch3.decide.hc', show: 'ch3.decide.hc.show' } },
};

/** The wall TV showing the checkout page; the game draws the page and the TV's glow (ch3-wall.js). */
export const WALL_DISPLAY = {
  image: 'R3_wall_closeup',
  chart: 'ch3.wall.chart',
  painter: WALL,
  text: {
    pool: Array.from({ length: 5 }, (_, i) => `ch3.wall.stat.${i + 1}`),
    okPool: Array.from({ length: 3 }, (_, i) => `ch3.wall.ok.${i + 1}`),
    progress: 'ch3.wall.progress', progressOk: 'ch3.wall.progress.ok', cart: 'ch3.wall.cart',
  },
  room: {
    bezel: { x0: 97, x1: 223, y0: 26, y1: 100 },
    screen: { x0: 102, x1: 217, y0: 34, y1: 94 },
    progress: { x0: 120, x1: 209, y0: 36, y1: 40 },
    large: { x0: 111, x1: 171, y0: 46, y1: 80 },
    small: [{ x0: 176, x1: 208, y0: 46, y1: 55 }, { x0: 176, x1: 208, y0: 58, y1: 67 }, { x0: 176, x1: 208, y0: 71, y1: 80 }],
    lane: { x0: 111, x1: 208, y0: 84, y1: 90 },
  },
  close: {
    screen: { x0: 31, x1: 287, y0: 22, y1: 171 },
    progress: { x0: 54, x1: 265, y0: 39, y1: 51 },
    large: { x0: 54, x1: 183, y0: 60, y1: 137 },
    cart: { x0: 54, x1: 183, y0: 122, y1: 137 },
    small: [{ x0: 192, x1: 265, y0: 60, y1: 80 }, { x0: 192, x1: 265, y0: 88, y1: 109 }, { x0: 192, x1: 265, y0: 117, y1: 137 }],
    lane: { x0: 54, x1: 265, y0: 147, y1: 160 },
  },
};

/** The lent computer: everything is drawn inside its screen. */
export const PC = {
  image: 'R3_pc_closeup',
  screen: { x0: 31, x1: 204, y0: 44, y1: 154 },
  title: 'ch3.pc.title',
  menu: [
    { id: 'email', key: 'ch3.pc.menu.email', action: 'email' },
    { id: 'status', key: 'ch3.pc.menu.status', action: 'status' },
    { id: 'old', key: 'ch3.pc.menu.old', action: 'tool', tool: 'old' },
    { id: 'hc', key: 'ch3.pc.menu.hc', action: 'tool', tool: 'hc' },
    { id: 'leave', key: 'ch3.pc.menu.leave', action: 'leave' },
  ],
  emails: [1, 2, 3].map((i) => `ch3.pc.email.${i}`),
  reply: 'ch3.pc.email.reply',
  status: { before: 'ch3.pc.status.before', old: 'ch3.pc.status.old', found: 'ch3.pc.status.found', hc: 'ch3.pc.status.hc' },
  deploy: { item: 'ch3.pc.menu.deploy', line: 'ch3.pc.deploy', recovered: 'ch3.recovered' },
  leave: 'ch3.pc.leave', locked: 'ch3.pc.leave.locked',
};

export const TOOL_PIC = { x: 4, y: 20, w: 188, h: 176 };

/** Pretty Good Metrics: one big average and a flat line. Looks fine. */
function paintOld(g) {
  const P = TOOL_PIC;
  g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
  g.fillStyle = '#2A3346'; g.fillRect(P.x - 2, P.y - 2, P.w + 4, P.h + 4);
  g.fillStyle = '#0A120A'; g.fillRect(P.x, P.y, P.w, P.h);
  g.fillStyle = '#3CC83C'; g.font = '48px VT323, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('2.1 s', P.x + P.w / 2, P.y + P.h * 0.38);
  g.font = '16px VT323, monospace'; g.fillText('avg page load', P.x + P.w / 2, P.y + P.h * 0.58);
  g.fillRect(P.x + 12, P.y + Math.round(P.h * 0.78), P.w - 24, 2);                      // the flat line
  g.textAlign = 'start'; g.textBaseline = 'alphabetic';
}

const step = (n) => ({
  prompts: [
    { key: `ch3.hc.step${n}.prompt.1`, right: true },
    { key: `ch3.hc.step${n}.prompt.2`, jab: `ch3.hc.step${n}.jab.2` },
    { key: `ch3.hc.step${n}.prompt.3`, jab: `ch3.hc.step${n}.jab.3` },
  ],
  result: `ch3.hc.step${n}.result`,
});

export const CH3 = {
  id: 3,
  manifest: MANIFEST,
  card: { title: 'ch3.card.title', line: 'ch3.card.line' },
  enter: 'ch3.room.enter',
  room: ROOM,
  persona: PERSONA,
  wall: WALL_DISPLAY,
  pc: PC,
  tools: {
    old: {
      kind: 'old', title: 'ch3.old.title', intro: 'ch3.old.intro', exit: 'ch3.old.exit', close: 'ch3.old.close',
      steps: [{ prompts: [1, 2, 3].map((i) => ({ key: `ch3.old.prompt.${i}`, jab: `ch3.old.jab.${i}` })) }],
      paint: paintOld,
    },
    hc: {
      kind: 'hc', title: 'ch3.hc.title', intro: 'ch3.hc.intro',
      steps: [step(1), step(2)],
      screens: 'assets/screens/ch3_hc.json',
    },
  },
  win: ['ch3.win', 'ch3.hero.line'],
  verdict: { key: 'ch3.verdict', portrait: 'assets/portrait_graham.png' },
};
