// Chapter 1 — LLM Observability · Enterprise · Technical Decision Maker (spec: Chapters › 1).
// Data and placeholder pictures only; js/screens/chapter.js plays it. Every word is a script key.
//
// PLACEHOLDER ART: the room is flat code-drawn shapes, built for a timing run. When the real background
// arrives, replace ROOM.paint (and, if the objects move, the rects and stand points in ROOM.hotspots) —
// nothing else reads positions.

export const FLOOR_Y = 186;          // the hero's feet

const PLACES = {                     // logical px on the 320x200 scene; standX is the hero's left edge
  wallscreen:  { rect: { x: 96, y: 12, w: 96, h: 56 }, standX: 130 },
  laptop:      { rect: { x: 18, y: 76, w: 42, h: 36 }, standX: 26 },
  contract:    { rect: { x: 62, y: 84, w: 40, h: 32 }, standX: 68 },
  terminal:    { rect: { x: 198, y: 62, w: 40, h: 58 }, standX: 204 },
  workstation: { rect: { x: 252, y: 56, w: 60, h: 64 }, standX: 262 },
};

function label(g, text, x, y) {     // tiny placeholder tags, drawn as blocks of the label colour
  g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(x, y, text.length * 4 + 3, 7);
  g.fillStyle = '#FFE9A8';
  for (let i = 0; i < text.length; i++) if (text[i] !== ' ') g.fillRect(x + 2 + i * 4, y + 2, 3, 3);
}

function paintRoom(g) {
  g.fillStyle = '#1B2333'; g.fillRect(0, 0, 320, 120);            // the exec floor at night: dark wall
  g.fillStyle = '#26324A';                                          // glass wall panels
  for (let x = 4; x < 320; x += 52) g.fillRect(x, 6, 46, 100);
  g.fillStyle = '#0E1420'; g.fillRect(0, 106, 320, 14);             // skirting
  g.fillStyle = '#4B4E5C'; g.fillRect(0, 120, 320, 80);             // floor band
  g.fillStyle = '#3E414E'; for (let y = 128; y < 200; y += 12) g.fillRect(0, y, 320, 1);
  // the wall screen: Otto frozen mid-sentence
  g.fillStyle = '#0A0D14'; g.fillRect(100, 16, 88, 48);
  g.fillStyle = '#E8ECF4'; g.fillRect(104, 20, 80, 40);
  g.fillStyle = '#5A8FD8'; g.fillRect(108, 26, 46, 6);
  g.fillStyle = '#9AA6B8'; g.fillRect(108, 36, 60, 4); g.fillRect(108, 44, 38, 4);
  g.fillStyle = '#20242E'; g.fillRect(148, 44, 2, 5);                // the cursor
  // the desk with the laptop and the contract
  g.fillStyle = '#6B4A30'; g.fillRect(12, 104, 96, 10); g.fillStyle = '#4A321E'; g.fillRect(16, 114, 6, 30); g.fillRect(98, 114, 6, 30);
  g.fillStyle = '#C8CCD4'; g.fillRect(24, 88, 30, 16); g.fillStyle = '#304060'; g.fillRect(26, 90, 26, 12);   // laptop
  g.fillStyle = '#F2EEDC'; g.fillRect(68, 96, 26, 8); g.fillStyle = '#B01818'; g.fillRect(70, 98, 8, 2);       // contract
  // the Cave Logs terminal on its stand
  g.fillStyle = '#2A2A2A'; g.fillRect(202, 66, 32, 26); g.fillStyle = '#081008'; g.fillRect(205, 69, 26, 20);
  g.fillStyle = '#3CC83C'; g.fillRect(207, 72, 12, 2); g.fillRect(207, 76, 18, 2); g.fillRect(207, 80, 8, 2);
  g.fillStyle = '#333'; g.fillRect(214, 92, 8, 26); g.fillRect(206, 116, 24, 4);
  // the Honeycomb workstation
  g.fillStyle = '#6B4A30'; g.fillRect(250, 100, 66, 8); g.fillStyle = '#4A321E'; g.fillRect(254, 108, 6, 36); g.fillRect(306, 108, 6, 36);
  g.fillStyle = '#10141C'; g.fillRect(258, 60, 50, 38); g.fillStyle = '#1F2A3C'; g.fillRect(261, 63, 44, 32);
  g.fillStyle = '#FFB000'; g.fillRect(278, 70, 8, 8); g.fillStyle = '#0298EC'; g.fillRect(270, 82, 24, 3);   // a hex-ish mark
  label(g, 'OTTO', 104, 66); label(g, 'LAPTOP', 18, 78); label(g, 'CONTRACT', 62, 86); label(g, 'CAVE LOGS', 196, 56); label(g, 'HONEYCOMB', 256, 50);
}

export const ROOM = {
  paint: paintRoom,
  floorY: FLOOR_Y,
  walk: [0, 292],
  start: 142,
  hotspots: [
    { id: 'wallscreen', ...PLACES.wallscreen, look: 'ch1.look.wallscreen' },
    { id: 'laptop', ...PLACES.laptop, look: 'ch1.look.laptop', use: 'ch1.use.laptop' },
    { id: 'contract', ...PLACES.contract, look: 'ch1.look.contract', use: 'ch1.use.contract' },
    { id: 'terminal', ...PLACES.terminal, look: 'ch1.look.terminal', use: { tool: 'old' } },
    { id: 'workstation', ...PLACES.workstation, look: 'ch1.look.workstation', use: { tool: 'hc' } },
  ],
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
    g.fillStyle = "#F96E10";                                         // the burn rate climbing, faster at the end
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
  card: { title: 'ch1.card.title', stats: 'ch1.card.stats', line: 'ch1.card.line' },
  enter: 'ch1.room.enter',
  room: ROOM,
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
