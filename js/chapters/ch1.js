// Chapter 1 — LLM Observability · Enterprise · Technical Decision Maker (spec: Chapters › 1, the 2026-11-12
// redesign). Data and the two product-screen pictures; js/screens/chapter.js plays it, the rules are
// js/engine/scenario.js and js/engine/vitals.js. Every word is a script key.
//
// Positions are the art hand-back's measurements on the 320x200 scene (assets/rooms/, built by
// tools/build_rooms.py); areas are { x0, x1, y0, y1 } inclusive.

export const MANIFEST = 'assets/rooms/ch1.json';

export const ROOM = {
  image: 'R1_exec_floor',
  floorY: 192,                         // the hero's feet
  walk: [0, 292],                      // the hero's left edge
  start: 142,                          // between the cube and the CTO's desk
  // listed in drawing order: where two overlap the later one wins, so the monitor beats the PC at its corner
  hotspots: [
    { id: 'pc', rect: { x: 0, y: 75, w: 135, h: 111 }, standX: 87, look: 'ch1.look.pc', use: { scene: 'pc' } },
    { id: 'cto', rect: { x: 206, y: 82, w: 100, h: 102 }, standX: 176, look: 'ch1.look.cto', use: { action: 'cto' } },
    { id: 'monitor', rect: { x: 114, y: 26, w: 92, h: 50 }, walk: false, look: 'ch1.look.monitor', use: { scene: 'monitor' } },
  ],
  // the CTO on the phone: room → talk_1 → room → talk_2, drawn at the manifest's patch position
  talk: ['R1_cto_talk_1', 'R1_cto_talk_2'],
};

/** Otto's vitals monitor: where the game draws, in the room and close up. */
export const MONITOR = {
  image: 'R1_monitor_closeup',
  chart: 'ch1.monitor.chart',
  pool: Array.from({ length: 10 }, (_, i) => `ch1.vitals.stat.${i + 1}`),
  okPool: Array.from({ length: 5 }, (_, i) => `ch1.vitals.ok.${i + 1}`),
  output: 'ch1.vitals.output',
  outputOk: 'ch1.vitals.output.ok',
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
    { id: 'email', key: 'ch1.pc.menu.email' },
    { id: 'vitals', key: 'ch1.pc.menu.vitals' },
    { id: 'old', key: 'ch1.pc.menu.old' },
    { id: 'hc', key: 'ch1.pc.menu.hc' },
    { id: 'leave', key: 'ch1.pc.menu.leave' },
  ],
  emails: [1, 2, 3, 4, 5].map((i) => `ch1.pc.email.${i}`),
  reply: 'ch1.pc.email.reply',
  vitals: { before: 'ch1.pc.vitals.before', old: 'ch1.pc.vitals.old', hc: 'ch1.pc.vitals.hc' },
  leave: 'ch1.pc.leave', locked: 'ch1.pc.leave.locked',
};

/** The CTO, on the phone with the Cave Logs renewal. */
export const CTO = {
  calls: [1, 2, 3].map((i) => `ch1.cto.call.${i}`),
  ask: 'ch1.cto.ask',
  sign: 'ch1.decide.sign', hc: 'ch1.decide.hc',
  jab: 'ch1.decide.sign.jab', show: 'ch1.decide.hc.show',
};

// ---- product-screen pictures (left half of the scene; the prompts take the right) ----

const PIC = { x: 6, y: 20, w: 148, h: 172 };

function frame(g, bg = '#141A26') {
  g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
  g.fillStyle = '#2A3346'; g.fillRect(PIC.x - 2, PIC.y - 2, PIC.w + 4, PIC.h + 4);
  g.fillStyle = bg; g.fillRect(PIC.x, PIC.y, PIC.w, PIC.h);
}

/** Cave Logs: a black window of JSON, every line technically true. */
function paintOld(g) {
  frame(g, '#050805');
  const widths = [90, 120, 60, 132, 100, 76, 128, 54, 110, 96, 136, 70, 118, 84, 102, 64, 126, 92, 58, 114];
  widths.forEach((w, i) => { g.fillStyle = i % 5 === 2 ? '#2E7A2E' : '#3CC83C'; g.fillRect(PIC.x + 6, PIC.y + 6 + i * 8, w, 3); });
}

/**
 * Honeycomb · SLOs. `stage` is how many right answers so far; `p` (0..1) is the reveal of the latest one.
 * 0: the burn line climbing. 1: twelve model calls fan out under one trace. 2: one of them glows — the cron.
 */
function paintHc(g, stage, p = 1) {
  frame(g);
  const bx = PIC.x + 10, by = PIC.y + 18, bw = PIC.w - 20;
  if (stage === 0) {
    g.fillStyle = '#2A3346'; for (let i = 0; i < 5; i++) g.fillRect(bx, by + i * 28, bw, 1);
    g.fillStyle = '#F96E10';                                         // the burn rate climbing, faster at the end
    for (let x = 0; x < bw; x++) { const y = Math.round(118 * Math.pow(x / bw, 2.2)); g.fillRect(bx + x, by + 128 - y, 2, 2); }
    g.fillStyle = '#E04040'; g.fillRect(bx, by + 2, 40, 4);
    return;
  }
  const n = 12, rowH = 11, shown = stage === 1 ? Math.ceil(n * p) : n;
  const widths = [40, 52, 34, 60, 46, 38, 118, 44, 56, 36, 50, 42];  // one call is starved
  for (let i = 0; i < shown; i++) {
    const glow = stage === 2 && i === 6;
    g.fillStyle = glow ? (p >= 1 || Math.floor(p * 8) % 2 ? '#FFB000' : '#F96E10') : '#0298EC';
    g.fillRect(bx + (i % 3) * 4, by + i * rowH, widths[i], 7);
    if (glow) { g.fillStyle = '#FFF3D0'; g.fillRect(bx + (i % 3) * 4, by + i * rowH, widths[i], 1); }
  }
  g.fillStyle = '#51368D'; g.fillRect(bx, by + n * rowH + 6, bw, 4);   // the parent trace
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
  card: { title: 'ch1.card.title', stats: 'ch1.card.stats', line: 'ch1.card.line' },
  enter: 'ch1.room.enter',
  room: ROOM,
  monitor: MONITOR,
  pc: PC,
  cto: CTO,
  tools: {
    old: {
      kind: 'old', title: 'ch1.old.title', intro: 'ch1.old.intro', exit: 'ch1.old.exit',
      steps: [{ prompts: [1, 2, 3].map((i) => ({ key: `ch1.old.prompt.${i}`, jab: `ch1.old.jab.${i}` })) }],
      paint: paintOld,
    },
    hc: {
      kind: 'hc', title: 'ch1.hc.title', intro: 'ch1.hc.intro',
      steps: [step(1), step(2)],
      paint: paintHc,
    },
  },
  win: ['ch1.win', 'ch1.hero.line'],
  verdict: { key: 'ch1.verdict', portrait: 'assets/portrait_christine.png' },
};
