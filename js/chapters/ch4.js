// Chapter 4 — Hidden Failures · Gaming · the SRE on call (spec: Chapters › 4; Warp brief 08). Data in the shape every scenario shares;
// js/screens/chapter.js plays it, the wall display is js/chapters/ch4-wall.js. Every word is a script key.
// Positions are brief 08's, checked against the built 320×200 files; areas { x0, x1, y0, y1 } are inclusive.

import { HERO_W } from '../engine/hero.js';
import { SCENE_W } from '../engine/room.js';
import { WALL } from './ch4-wall.js';

export const MANIFEST = 'assets/rooms/ch4.json';

export const ROOM = {
  image: 'R4_ops_room',
  floorY: 192,
  walk: [0, SCENE_W - HERO_W],
  start: 136,
  heroScale: 1,
  // the wall of space is first: where the computer and the persona overlap it, the smaller targets win
  hotspots: [
    { id: 'wall', rect: { x: 30, y: 2, w: 260, h: 100 }, walk: false, look: 'ch4.look.wall', use: { scene: 'wall' } },
    { id: 'pc', rect: { x: 10, y: 88, w: 126, h: 98 }, standX: 81, look: 'ch4.look.pc', use: { scene: 'pc' } },
    { id: 'npc', rect: { x: 205, y: 78, w: 98, h: 107 }, standX: 148, look: 'ch4.look.npc', use: { action: 'persona' } },
  ],
};

/** The SRE on call, thumb over Einar's number. Her card is Knight Watch: no painted frames, but a phone on her belt
 * whose screen the game fills with notifications scrolling up (x 84–89, y 56–61 on the 128×80 card). */
export const PERSONA = {
  name: 'ch4.persona.name', class: 'ch4.persona.class', stats: 'ch4.persona.stats', flavor: 'ch4.persona.flavor',
  card: 'P4', art: 'assets/cards/P4_card.png', crop: { image: 'R4_ops_room', x: 209, y: 59, w: 110, h: 69 },
  overlay: { kind: 'phone', x: 84, y: 56, w: 6, h: 6 },
  portrait: 'p4', where: 'top-left',
  loop: 'speak', frames: { talk: ['R4_npc_talk_1', 'R4_npc_talk_2'], rest: null, idle: [], win: 'R4_npc_win' },
  calls: [1, 2, 3].map((i) => `ch4.npc.call.${i}`),
  ask: 'ch4.npc.ask',
  options: { wrong: { id: 'wrong', key: 'ch4.decide.wrong', jab: 'ch4.decide.wrong.jab' }, hc: { key: 'ch4.decide.hc', show: 'ch4.decide.hc.show' } },
};

/** The wall of space (ch4-wall.js): the fleet, the flat green line, the chat column. */
export const WALL_DISPLAY = {
  image: 'R4_wall_closeup',
  chart: 'ch4.wall.chart',
  painter: WALL,
  text: {
    pool: Array.from({ length: 8 }, (_, i) => `ch4.wall.stat.${i + 1}`),
    okPool: Array.from({ length: 4 }, (_, i) => `ch4.wall.ok.${i + 1}`),
  },
  room: {
    map: { x0: 34, x1: 234, y0: 7, y1: 80 },
    lane: { x0: 34, x1: 234, y0: 84, y1: 88 },
    chat: { x0: 236, x1: 285, y0: 15, y1: 98 },
  },
  close: {
    screen: { x0: 13, x1: 304, y0: 7, y1: 182 },
    map: { x0: 13, x1: 242, y0: 7, y1: 161 },
    lane: { x0: 13, x1: 239, y0: 171, y1: 182 },
    chat: { x0: 244, x1: 304, y0: 16, y1: 172 },
  },
};

/** The lent computer: everything is drawn inside its screen. */
export const PC = {
  image: 'R4_pc_closeup',
  screen: { x0: 33, x1: 285, y0: 34, y1: 147 },
  title: 'ch4.pc.title',
  menu: [
    { id: 'email', key: 'ch4.pc.menu.email', action: 'email' },
    { id: 'status', key: 'ch4.pc.menu.status', action: 'status' },
    { id: 'old', key: 'ch4.pc.menu.old', action: 'tool', tool: 'old' },
    { id: 'hc', key: 'ch4.pc.menu.hc', action: 'tool', tool: 'hc' },
    { id: 'leave', key: 'ch4.pc.menu.leave', action: 'leave' },
  ],
  emails: [1, 2, 3].map((i) => `ch4.pc.email.${i}`),
  reply: 'ch4.pc.email.reply',
  status: { before: 'ch4.pc.status.before', old: 'ch4.pc.status.old', found: 'ch4.pc.status.found', hc: 'ch4.pc.status.hc' },
  deploy: { item: 'ch4.pc.menu.deploy', line: 'ch4.pc.deploy', recovered: 'ch4.recovered' },
  leave: 'ch4.pc.leave', locked: 'ch4.pc.leave.locked',
};

export const TOOL_PIC = { x: 4, y: 20, w: 188, h: 176 };

/** Page Einar: a phone screen with one contact and a ringing mark. */
function paintOld(g) {
  const P = TOOL_PIC;
  g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
  g.fillStyle = '#2A3346'; g.fillRect(P.x - 2, P.y - 2, P.w + 4, P.h + 4);
  g.fillStyle = '#0A120A'; g.fillRect(P.x, P.y, P.w, P.h);
  const px = P.x + Math.round(P.w / 2) - 34, py = P.y + 14, pw = 68, ph = P.h - 28;        // the phone
  g.fillStyle = '#1A1C22'; g.fillRect(px - 4, py - 6, pw + 8, ph + 12);
  g.fillStyle = '#0E2A14'; g.fillRect(px, py, pw, ph);
  g.fillStyle = '#3CC83C';
  g.fillRect(px + 20, py + 18, 28, 28);                                                    // the contact's picture
  g.fillStyle = '#0E2A14'; g.fillRect(px + 29, py + 24, 10, 10); g.fillRect(px + 25, py + 36, 18, 8);
  g.fillStyle = '#3CC83C';
  g.fillRect(px + 14, py + 54, 40, 3); g.fillRect(px + 22, py + 62, 24, 2);                 // name, number
  for (let i = 0; i < 3; i++) { g.fillStyle = i === 1 ? '#3CC83C' : '#2E9A3A'; g.fillRect(px + 8 + i * 18, py + ph - 34, 14, 14); }   // call, hang up, call again
  g.fillStyle = '#3CC83C'; g.fillRect(px + 30, py + ph - 14, 8, 8);                        // ringing
  for (let r = 1; r <= 3; r++) { g.fillRect(px + 30 - r * 5, py + ph - 10, 2, 1); g.fillRect(px + 38 + r * 5 - 1, py + ph - 10, 2, 1); }
}

const step = (n) => ({
  prompts: [
    { key: `ch4.hc.step${n}.prompt.1`, right: true },
    { key: `ch4.hc.step${n}.prompt.2`, jab: `ch4.hc.step${n}.jab.2` },
    { key: `ch4.hc.step${n}.prompt.3`, jab: `ch4.hc.step${n}.jab.3` },
  ],
  result: `ch4.hc.step${n}.result`,
});

export const CH4 = {
  id: 4,
  manifest: MANIFEST,
  card: { title: 'ch4.card.title', line: 'ch4.card.line' },
  enter: 'ch4.room.enter',
  room: ROOM,
  persona: PERSONA,
  wall: WALL_DISPLAY,
  pc: PC,
  tools: {
    old: {
      kind: 'old', title: 'ch4.old.title', intro: 'ch4.old.intro', exit: 'ch4.old.exit', close: 'ch4.old.close',
      steps: [{ prompts: [1, 2, 3].map((i) => ({ key: `ch4.old.prompt.${i}`, jab: `ch4.old.jab.${i}` })) }],
      paint: paintOld,
    },
    hc: {
      kind: 'hc', title: 'ch4.hc.title', intro: 'ch4.hc.intro',
      close: '[Close Claw Codez]',       // needs a script slot (ch4.hc.close); the string stands in meanwhile
      steps: [step(1), step(2)],
      screens: 'assets/screens/ch4_hc.json',
    },
  },
  win: ['ch4.win', 'ch4.hero.line', 'ch4.manager.line'],
  verdict: { key: 'ch4.verdict', portrait: 'assets/portrait_jessitron.png' },
};
