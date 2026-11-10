// "Quest for the Missing Span" — original title loop for Observability Quest Mobile.
// Written for this project in the late-'80s Sierra adventure idiom (AdLib / MT-32 feel):
// a brass-style fanfare, a marching A theme, a lifting B theme, arpeggiated bass.
// It does not quote or paraphrase any existing composition.
//
// Format: every track is a list of [note, beats]. note is a MIDI number (0 = rest);
// drums use 'k' kick, 's' snare, 'h' hat, '-' rest. All tracks sum to loopBeats.

export const TEMPO = 120;          // bpm, 4/4
export const BEATS_PER_BAR = 4;

// Voice settings shared by the browser synth (audio.js) and the offline renderer (tools/render-loop.mjs).
export const VOICES = {
  lead:  { wave: 'pulse25', gain: 0.22, attack: 0.005, release: 0.08 },
  bass:  { wave: 'triangle', gain: 0.30, attack: 0.005, release: 0.06 },
  arp:   { wave: 'square',   gain: 0.07, attack: 0.002, release: 0.04 },
  drums: { gain: 0.28 },
};

// MIDI note names for readability
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71;
const C5 = 72, D5 = 74, E5 = 76, F5 = 77, G5 = 79, A5 = 81;
const R = 0; // rest

// ---- lead: 20 bars ----
const LEAD_BARS = [
  // fanfare (I)
  [[G4, .75], [G4, .25], [C5, 1], [E5, 1], [G5, 1]],
  [[E5, .5], [F5, .5], [G5, 1.5], [R, .5], [D5, 1]],
  [[C5, .75], [C5, .25], [E5, 1], [D5, 1], [B4, 1]],
  [[C5, 2], [R, 1], [G4, .5], [B4, .5]],
  // A theme — the march
  [[C5, 1], [E5, 1], [G5, 1.5], [E5, .5]],
  [[F5, 1], [E5, 1], [D5, 2]],
  [[B4, 1], [D5, 1], [F5, 1.5], [D5, .5]],
  [[E5, 1], [D5, 1], [C5, 2]],
  [[A4, 1], [C5, 1], [E5, 1.5], [C5, .5]],
  [[D5, 1], [C5, 1], [B4, 2]],
  [[G4, .5], [A4, .5], [B4, 1], [C5, 1], [D5, 1]],
  [[E5, 1.5], [D5, .5], [C5, 2]],
  // B theme — the lift
  [[F5, 1], [E5, .5], [F5, .5], [G5, 2]],
  [[A5, 1], [G5, 1], [F5, 1], [E5, 1]],
  [[D5, 1], [E5, .5], [D5, .5], [C5, 1], [B4, 1]],
  [[C5, 1], [D5, 1], [E5, 2]],
  [[F5, 1], [E5, .5], [F5, .5], [G5, 1], [A5, 1]],
  [[G5, 1], [E5, 1], [C5, 1], [E5, 1]],
  [[D5, 1], [B4, 1], [G4, 1], [B4, 1]],
  [[C5, 3], [R, 1]],
];

// chord per bar: root midi (octave 2) and chord tones (octave 4) for the arp
const CH = {
  C:  { root: 36, fifth: 43, arp: [60, 64, 67, 72] },
  F:  { root: 41, fifth: 48, arp: [65, 69, 72, 77] },
  G:  { root: 43, fifth: 50, arp: [67, 71, 74, 79] },
  Am: { root: 45, fifth: 52, arp: [57, 60, 64, 69] },
};
const CHORDS = ['C', 'C', 'G', 'C', 'C', 'F', 'G', 'C', 'Am', 'G', 'G', 'C', 'F', 'F', 'G', 'C', 'F', 'C', 'G', 'C'];

const bassBar = (c) => [[c.root, 1], [c.root, 1], [c.fifth, 1], [c.root, 1]];
const arpBar = (c) => { const [a, b, d, e] = c.arp; return [a, b, d, e, d, b, a, b].map((n) => [n, .5]); };
const DRUM_BAR = [['k', .5], ['h', .5], ['s', .5], ['h', .5], ['k', .5], ['h', .5], ['s', .5], ['h', .5]];
const DRUM_FILL = [['k', .5], ['h', .5], ['s', .5], ['s', .5], ['k', .5], ['s', .25], ['s', .25], ['s', .5], ['s', .5]];

const flat = (bars) => bars.flat();

export const TRACKS = {
  lead: flat(LEAD_BARS),
  bass: flat(CHORDS.map((k) => bassBar(CH[k]))),
  arp: flat(CHORDS.map((k) => arpBar(CH[k]))),
  drums: flat(CHORDS.map((_, i) => (i < 2 ? [['-', 4]] : i === 3 || i === 11 || i === 19 ? DRUM_FILL : DRUM_BAR))),
};

export const loopBeats = LEAD_BARS.length * BEATS_PER_BAR; // 80 beats = 40 s at 120 bpm

export const midiToHz = (m) => 440 * 2 ** ((m - 69) / 12);
