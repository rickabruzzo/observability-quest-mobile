// Chapter 2 — Migrations · Fintech · the Cloud Engineer (spec: Chapters › 2; Warp brief 08). Data in the shape
// every scenario shares; js/screens/chapter.js plays it, the wall display is js/chapters/ch2-wall.js. Every word
// is a script key. Positions are brief 08's, checked against the built 320×200 files; areas { x0, x1, y0, y1 }
// are inclusive.

import { HERO_W } from '../engine/hero.js';
import { SCENE_W } from '../engine/room.js';
import { WALL } from './ch2-wall.js';

export const MANIFEST = 'assets/rooms/ch2.json';

export const ROOM = {
  image: 'R2_war_room',
  floorY: 192,
  walk: [0, SCENE_W - HERO_W],
  start: 156,
  heroScale: 1,
  // drawing order: where two overlap the later one wins, so the persona beats the whiteboard where he stands at it
  hotspots: [
    { id: 'wall', rect: { x: 113, y: 26, w: 197, h: 92 }, walk: false, look: 'ch2.look.wall', use: { scene: 'wall' } },
    { id: 'pc', rect: { x: 0, y: 76, w: 136, h: 112 }, standX: 82, look: 'ch2.look.pc', use: { scene: 'pc' } },
    { id: 'npc', rect: { x: 255, y: 52, w: 48, h: 120 }, standX: 184, look: 'ch2.look.npc', use: { action: 'persona' } },
  ],
};

/** The Cloud Engineer, at his board. He studies it between lines (R2_npc_look), scratches his head or makes a mark
 * now and then, talks only while his own words are on screen, and caps his marker for the win. */
export const PERSONA = {
  name: 'ch2.persona.name', class: 'ch2.persona.class', stats: 'ch2.persona.stats', flavor: 'ch2.persona.flavor',
  card: 'P2', art: 'assets/cards/P2_card.png', crop: { image: 'R2_war_room', x: 234, y: 34, w: 76, h: 48 },
  portrait: 'p2', where: 'top-left',
  loop: 'speak', frames: { talk: ['R2_npc_talk_1', 'R2_npc_talk_2'], rest: 'R2_npc_look', idle: ['R2_npc_scratch', 'R2_npc_mark'], win: 'R2_npc_win' },
  calls: [1, 2, 3].map((i) => `ch2.npc.call.${i}`),
  ask: 'ch2.npc.ask',
  options: { wrong: { id: 'wrong', key: 'ch2.decide.wrong', jab: 'ch2.decide.wrong.jab' }, hc: { key: 'ch2.decide.hc', show: 'ch2.decide.hc.show' } },
};

/** The whiteboard: the sheet taped to it carries one theory at a time; the fix paints the path (art) and the room gets it drawn. */
export const WALL_DISPLAY = {
  image: 'R2_wall_closeup',
  fixedImage: 'R2_wall_closeup_fixed',
  chart: 'ch2.wall.chart',
  painter: WALL,
  text: {
    pool: Array.from({ length: 6 }, (_, i) => `ch2.wall.stat.${i + 1}`),
    okPool: Array.from({ length: 3 }, (_, i) => `ch2.wall.ok.${i + 1}`),
  },
  room: { area: { x0: 115, x1: 307, y0: 28, y1: 115 } },
  close: {
    sheet: { x0: 49, x1: 107, y0: 32, y1: 100 },
    screen: { x0: 13, x1: 307, y0: 25, y1: 191 },       // a tap outside the board goes back to the room
  },
  // the path for those two credit unions, in the room, under his frame: it stops at his patch's left edge
  path: [[126, 75], [144, 75], [169, 73], [187, 78], [206, 73], [233, 71]],
};

/** The lent desk: everything is drawn inside its monitor's screen. */
export const PC = {
  image: 'R2_pc_closeup',
  screen: { x0: 80, x1: 240, y0: 31, y1: 136 },
  title: 'ch2.pc.title',
  menu: [
    { id: 'email', key: 'ch2.pc.menu.email', action: 'email' },
    { id: 'status', key: 'ch2.pc.menu.status', action: 'status' },
    { id: 'old', key: 'ch2.pc.menu.old', action: 'tool', tool: 'old' },
    { id: 'hc', key: 'ch2.pc.menu.hc', action: 'tool', tool: 'hc' },
    { id: 'leave', key: 'ch2.pc.menu.leave', action: 'leave' },
  ],
  emails: [1, 2, 3].map((i) => `ch2.pc.email.${i}`),
  reply: 'ch2.pc.email.reply',
  status: { before: 'ch2.pc.status.before', old: 'ch2.pc.status.old', found: 'ch2.pc.status.found', hc: 'ch2.pc.status.hc' },
  deploy: { item: 'ch2.pc.menu.deploy', line: 'ch2.pc.deploy', recovered: 'ch2.recovered' },
  leave: 'ch2.pc.leave', locked: 'ch2.pc.leave.locked',
};

export const TOOL_PIC = { x: 4, y: 20, w: 188, h: 176 };

/** Old Artifact: a grid of 350 green tiles. Every one of them green. */
function paintOld(g) {
  const P = TOOL_PIC;
  g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
  g.fillStyle = '#2A3346'; g.fillRect(P.x - 2, P.y - 2, P.w + 4, P.h + 4);
  g.fillStyle = '#0A120A'; g.fillRect(P.x, P.y, P.w, P.h);
  const cols = 25, rows = 14, cw = Math.floor((P.w - 8) / cols), chh = Math.floor((P.h - 8) / rows);   // 350 tiles
  for (let i = 0; i < cols * rows; i++) {
    g.fillStyle = (i * 7919) % 11 === 0 ? '#2E9A3A' : '#3CC83C';
    g.fillRect(P.x + 4 + (i % cols) * cw, P.y + 4 + Math.floor(i / cols) * chh, cw - 1, chh - 1);
  }
}

const step = (n) => ({
  prompts: [
    { key: `ch2.hc.step${n}.prompt.1`, right: true },
    { key: `ch2.hc.step${n}.prompt.2`, jab: `ch2.hc.step${n}.jab.2` },
    { key: `ch2.hc.step${n}.prompt.3`, jab: `ch2.hc.step${n}.jab.3` },
  ],
  result: `ch2.hc.step${n}.result`,
});

export const CH2 = {
  id: 2,
  manifest: MANIFEST,
  card: { title: 'ch2.card.title', line: 'ch2.card.line' },
  enter: 'ch2.room.enter',
  room: ROOM,
  persona: PERSONA,
  wall: WALL_DISPLAY,
  pc: PC,
  tools: {
    old: {
      kind: 'old', title: 'ch2.old.title', intro: 'ch2.old.intro', exit: 'ch2.old.exit', close: 'ch2.old.close',
      steps: [{ prompts: [1, 2, 3].map((i) => ({ key: `ch2.old.prompt.${i}`, jab: `ch2.old.jab.${i}` })) }],
      paint: paintOld,
    },
    hc: {
      kind: 'hc', title: 'ch2.hc.title', intro: 'ch2.hc.intro',
      steps: [step(1), step(2)],
      screens: 'assets/screens/ch2_hc.json',
    },
  },
  win: ['ch2.win', 'ch2.hero.line'],
  verdict: { key: 'ch2.verdict', portrait: 'assets/portrait_emily.png' },
};
