// Scenario 1's wall display: Otto's vitals monitor. The model is js/engine/vitals.js (the heartbeat lane, three
// readout boxes, three lights, the output line); this painter draws it in the room (motion only) and close up
// (with the text), in the shape every wall painter shares (see js/screens/chapter.js › the wall display):
//   room(g, s), close(g, s), text(s), hits(s), frameKey(s), recovered(s), image(s)
// where s = { state: 'broken'|'found'|'fixed', t, tAll, reduced, nudges: [{ step, box }], text, cfg }.

import { vitalsFrame, beatSamples, stepAt } from '../engine/vitals.js';

const GLITCH = '#@%&*?!/<>';

const mode = (s) => (s.state === 'fixed' ? 'ok' : 'critical');
const frame = (s) => vitalsFrame(s.t, { state: mode(s), reduced: s.reduced, nudges: s.nudges, pool: s.text.pool, okPool: s.text.okPool, output: s.text.output, outputOk: s.text.outputOk });
const traceColour = (f) => (f.tone === 'green' ? '#3CE070' : '#FF5A3C');

function drawLane(g, lane, samples, colour, thick) {
  const h = lane.y1 - lane.y0, step = (lane.x1 - lane.x0 + 1) / samples.length;
  g.fillStyle = colour;
  samples.forEach((v, i) => {
    const y = Math.round(lane.y0 + v * h);
    const prev = i ? Math.round(lane.y0 + samples[i - 1] * h) : y;
    const top = Math.min(y, prev), bot = Math.max(y, prev);               // join the samples so spikes read as lines
    g.fillRect(Math.round(lane.x0 + i * step), top, Math.max(1, Math.round(step)), Math.max(thick, bot - top + 1));
  });
}
function drawLights(g, where, f, size) {
  where.forEach(([lx, ly], i) => {                         // an unlit light is dark, not the art's idle chip
    g.fillStyle = f.lights[i] ? (f.tone === 'green' ? '#3CE070' : '#FF3030') : '#2A0C0C';
    g.fillRect(lx, ly, size[0], size[1]);
  });
}

export const WALL = {
  frame,
  image: (s) => s.cfg.image,
  frameKey: (s) => `${s.state}:${stepAt(s.t)}:${s.nudges.length}`,
  /** Otto has finished his sentence. */
  recovered: (s) => { const o = frame(s).output; return o.shown >= o.text.length; },
  hits: (s) => s.cfg.close.boxHits.map((area, box) => ({ area, box })),
  /** The room: the trace, the lights, a cursor typing in the output panel. Motion only; the boxes are 18 px here. */
  room(g, s) {
    const m = s.cfg.room, f = frame(s);
    drawLane(g, m.lane, beatSamples(s.t, mode(s), m.lane.x1 - m.lane.x0 + 1, s.reduced), traceColour(f), 1);
    drawLights(g, m.lights, f, m.lightSize);
    const o = m.output, per = Math.floor((o.x1 - o.x0 - 1) / 3), rows = Math.floor((o.y1 - o.y0 - 4) / 5);
    const shown = Math.min(per * rows - 1, f.output.glitch ? 0 : f.output.shown);   // a long answer fills the panel, never spills
    g.fillStyle = f.tone === 'green' ? '#2A9A50' : '#6A7090';
    for (let i = 0; i < shown; i++) g.fillRect(o.x0 + 2 + (i % per) * 3, o.y0 + 3 + Math.floor(i / per) * 5, 2, 2);
    if (f.output.cursor || f.output.glitch) {
      g.fillStyle = f.output.glitch ? '#FF3030' : '#E8ECF4';
      g.fillRect(o.x0 + 2 + (shown % per) * 3, o.y0 + 2 + Math.floor(shown / per) * 5, 2, 4);
    }
  },
  /** Close up: the lane and the lights on the canvas; the boxes and the output line are text (see text). */
  close(g, s) {
    const m = s.cfg.close, f = frame(s);
    const n = Math.floor((m.lane.x1 - m.lane.x0 + 1) / 2);
    drawLane(g, m.lane, beatSamples(s.t, mode(s), n, s.reduced), traceColour(f), 2);
    drawLights(g, m.lights, f, m.lightSize);
  },
  /** The three readout boxes (two lines each, garbled the step they change) and Otto's output with its cursor. */
  text(s) {
    const m = s.cfg.close, f = frame(s);
    const boxes = f.boxes.map((b, i) => ({ id: `box${i}`, area: m.boxes[i], lines: b.lines, cls: 'mon-box', mod: b.garble ? 'garble' : '' }));
    const o = f.output;
    const line = o.glitch ? [...o.text].map((c, i) => (c === ' ' ? ' ' : GLITCH[(i * 7 + f.step) % GLITCH.length])).join('') : o.text.slice(0, o.shown);
    return [...boxes, { id: 'out', area: m.output, lines: [line], cls: 'mon-out', cursor: o.cursor, wrap: true }];
  },
  /** The whole display reads green once fixed. */
  tone: (s) => (s.state === 'fixed' ? 'ok' : ''),
};
