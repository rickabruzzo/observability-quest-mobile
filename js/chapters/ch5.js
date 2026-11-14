// Chapter 5 — Team Agents · Startup · the Build & Release Engineer (spec: Chapters › 5; Warp brief 08). Data in the shape every scenario shares;
// js/screens/chapter.js plays it, the wall display is js/chapters/ch5-wall.js. Every word is a script key.
// Positions are brief 08's, checked against the built 320×200 files; areas { x0, x1, y0, y1 } are inclusive.

import { HERO_W } from '../engine/hero.js';
import { SCENE_W } from '../engine/room.js';
import { WALL } from './ch5-wall.js';

export const MANIFEST = 'assets/rooms/ch5.json';

export const ROOM = {
  image: 'R5_loft',
  floorY: 192,
  walk: [0, SCENE_W - HERO_W],
  start: 136,
  heroScale: 1,
  // the atrium: the "wall" is a big monitor on a stand, the computer a laptop on a coffee table, the persona on the
  // couch; the pinball machine's backglass is Look only, kept clear of his head
  hotspots: [
    { id: 'wall', rect: { x: 115, y: 24, w: 90, h: 104 }, walk: false, look: 'ch5.look.wall', use: { scene: 'wall' } },
    { id: 'pc', rect: { x: 0, y: 128, w: 118, h: 68 }, standX: 104, look: 'ch5.look.pc', use: { scene: 'pc' } },
    { id: 'pinball', rect: { x: 250, y: 42, w: 68, h: 40 }, walk: false, look: 'ch5.look.pinball' },
    { id: 'npc', rect: { x: 232, y: 85, w: 88, h: 113 }, standX: 176, look: 'ch5.look.npc', use: { action: 'persona' } },
  ],
};

/** The Build & Release Engineer, on the couch with his laptop, one finger over the rollback key. */
export const PERSONA = {
  name: 'ch5.persona.name', class: 'ch5.persona.class', stats: 'ch5.persona.stats', flavor: 'ch5.persona.flavor',
  card: 'P5', art: 'assets/cards/P5_card.png', crop: { image: 'R5_loft', x: 204, y: 69, w: 116, h: 72 },
  portrait: 'p5', where: 'top-left',
  loop: 'speak', frames: { talk: ['R5_npc_talk_1', 'R5_npc_talk_2'], rest: null, idle: [], win: 'R5_npc_win' },
  calls: [1, 2, 3].map((i) => `ch5.npc.call.${i}`),
  ask: 'ch5.npc.ask',
  options: { wrong: { id: 'wrong', key: 'ch5.decide.wrong', jab: 'ch5.decide.wrong.jab' }, hc: { key: 'ch5.decide.hc', show: 'ch5.decide.hc.show' } },
};

/** The atrium monitor (ch5-wall.js): the chart, the inbox, three readouts, the chat panel. */
export const WALL_DISPLAY = {
  image: 'R5_wall_closeup',
  chart: 'ch5.wall.chart',
  painter: WALL,
  text: {
    pool: Array.from({ length: 6 }, (_, i) => `ch5.wall.stat.${i + 1}`),
    okPool: Array.from({ length: 3 }, (_, i) => `ch5.wall.ok.${i + 1}`),
    box1: 'ch5.wall.box.1', box2: 'ch5.wall.box.2', box3: 'ch5.wall.box.3', box3Ok: 'ch5.wall.box.ok.3',
  },
  room: {
    chart: { x0: 119, x1: 179, y0: 27, y1: 44 },
    inbox: { x0: 119, x1: 157, y0: 48, y1: 81 },
    lights: [{ x0: 162, x1: 179, y0: 48, y1: 53 }, { x0: 162, x1: 179, y0: 57, y1: 63 }, { x0: 162, x1: 179, y0: 67, y1: 81 }],
    chat: { x0: 183, x1: 200, y0: 27, y1: 81 },
  },
  close: {
    screen: { x0: 41, x1: 280, y0: 19, y1: 181 },
    chart: { x0: 50, x1: 158, y0: 27, y1: 74 },
    inbox: { x0: 50, x1: 156, y0: 84, y1: 174 },
    boxes: [{ x0: 165, x1: 214, y0: 27, y1: 74 }, { x0: 165, x1: 214, y0: 84, y1: 124 }, { x0: 165, x1: 214, y0: 134, y1: 174 }],
    chat: { x0: 223, x1: 272, y0: 27, y1: 158 },
  },
};

/** The lent computer: everything is drawn inside its screen. */
export const PC = {
  image: 'R5_pc_closeup',
  screen: { x0: 73, x1: 256, y0: 41, y1: 159 },
  title: 'ch5.pc.title',
  menu: [
    { id: 'email', key: 'ch5.pc.menu.email', action: 'email' },
    { id: 'status', key: 'ch5.pc.menu.status', action: 'status' },
    { id: 'old', key: 'ch5.pc.menu.old', action: 'tool', tool: 'old' },
    { id: 'hc', key: 'ch5.pc.menu.hc', action: 'tool', tool: 'hc' },
    { id: 'leave', key: 'ch5.pc.menu.leave', action: 'leave' },
  ],
  emails: [1, 2, 3].map((i) => `ch5.pc.email.${i}`),
  reply: 'ch5.pc.email.reply',
  status: { before: 'ch5.pc.status.before', old: 'ch5.pc.status.old', found: 'ch5.pc.status.found', hc: 'ch5.pc.status.hc' },
  deploy: { item: 'ch5.pc.menu.deploy', line: 'ch5.pc.deploy', recovered: 'ch5.recovered' },
  leave: 'ch5.pc.leave', locked: 'ch5.pc.leave.locked',
};

export const TOOL_PIC = { x: 4, y: 20, w: 188, h: 176 };

/** Friday's diff: a wall of red and green lines. Two thousand of them, more or less. */
function paintOld(g) {
  const P = TOOL_PIC;
  g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
  g.fillStyle = '#2A3346'; g.fillRect(P.x - 2, P.y - 2, P.w + 4, P.h + 4);
  g.fillStyle = '#0A0A0A'; g.fillRect(P.x, P.y, P.w, P.h);
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) >>> 0; return (seed >>> 8) / 16777216; };
  for (let y = P.y + 4; y < P.y + P.h - 4; y += 4) {
    const r = rnd(), kind = r < 0.42 ? '-' : r < 0.84 ? '+' : ' ';
    g.fillStyle = kind === '-' ? '#5A1A1A' : kind === '+' ? '#173A1C' : '#111';
    g.fillRect(P.x + 2, y, P.w - 4, 3);
    g.fillStyle = kind === '-' ? '#FF5A5A' : kind === '+' ? '#3CC83C' : '#555';
    g.fillRect(P.x + 6 + Math.floor(rnd() * 20), y + 1, 20 + Math.floor(rnd() * (P.w - 60)), 1);
  }
}

const step = (n) => ({
  prompts: [
    { key: `ch5.hc.step${n}.prompt.1`, right: true },
    { key: `ch5.hc.step${n}.prompt.2`, jab: `ch5.hc.step${n}.jab.2` },
    { key: `ch5.hc.step${n}.prompt.3`, jab: `ch5.hc.step${n}.jab.3` },
  ],
  result: `ch5.hc.step${n}.result`,
});

export const CH5 = {
  id: 5,
  manifest: MANIFEST,
  card: { title: 'ch5.card.title', line: 'ch5.card.line' },
  enter: 'ch5.room.enter',
  room: ROOM,
  persona: PERSONA,
  wall: WALL_DISPLAY,
  pc: PC,
  tools: {
    old: {
      kind: 'old', title: 'ch5.old.title', intro: 'ch5.old.intro', exit: 'ch5.old.exit', close: 'ch5.old.close',
      steps: [{ prompts: [1, 2, 3].map((i) => ({ key: `ch5.old.prompt.${i}`, jab: `ch5.old.jab.${i}` })) }],
      paint: paintOld,
    },
    hc: {
      kind: 'hc', title: 'ch5.hc.title', intro: 'ch5.hc.intro',
      steps: [step(1), step(2)],
      screens: 'assets/screens/ch5_hc.json',
    },
  },
  win: ['ch5.win', 'ch5.hero.line'],
  verdict: { key: 'ch5.verdict', portrait: 'assets/portrait_matt.png' },
};
