#!/usr/bin/env node
// Render the title loop to a 16-bit mono WAV without Web Audio, so it can be listened to
// outside the browser. Usage: node tools/render-loop.mjs out.wav
import { writeFileSync } from 'node:fs';
import { TEMPO, TRACKS, VOICES, loopBeats, midiToHz } from '../js/audio/title-loop.js';

const RATE = 44100;
const out = process.argv[2] || 'scratch/title-loop-preview.wav';
const secPerBeat = 60 / TEMPO;
const total = Math.round(loopBeats * secPerBeat * RATE);
const buf = new Float32Array(total + RATE); // tail room for releases

function osc(wave, phase) {
  const p = phase - Math.floor(phase);
  switch (wave) {
    case 'pulse25': return p < 0.25 ? 1 : -1;
    case 'square': return p < 0.5 ? 1 : -1;
    case 'triangle': return 4 * Math.abs(p - 0.5) - 1;
    default: return Math.sin(2 * Math.PI * p);
  }
}

function env(t, dur, attack, release) {
  if (t < attack) return t / attack;
  if (t > dur) return Math.max(0, 1 - (t - dur) / release);
  return 1;
}

function renderTonal(track, voice) {
  let t0 = 0;
  for (const [note, beats] of track) {
    const dur = beats * secPerBeat;
    if (note > 0) {
      const hz = midiToHz(note);
      const gate = dur * 0.92;
      const n = Math.round((gate + voice.release) * RATE);
      const start = Math.round(t0 * RATE);
      for (let i = 0; i < n && start + i < buf.length; i++) {
        const t = i / RATE;
        buf[start + i] += voice.gain * env(t, gate, voice.attack, voice.release) * osc(voice.wave, t * hz);
      }
    }
    t0 += dur;
  }
}

let seed = 1;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff * 2 - 1; };

function renderDrums(track, voice) {
  let t0 = 0;
  for (const [hit, beats] of track) {
    const start = Math.round(t0 * RATE);
    if (hit === 'k') {
      const n = Math.round(0.14 * RATE);
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / RATE; const hz = 140 * Math.exp(-t * 18) + 45;
        ph += hz / RATE;
        buf[start + i] += voice.gain * 1.1 * Math.exp(-t * 22) * Math.sin(2 * Math.PI * ph);
      }
    } else if (hit === 's') {
      const n = Math.round(0.11 * RATE);
      for (let i = 0; i < n; i++) { const t = i / RATE; buf[start + i] += voice.gain * 0.55 * Math.exp(-t * 32) * rnd(); }
    } else if (hit === 'h') {
      const n = Math.round(0.04 * RATE);
      let prev = 0;
      for (let i = 0; i < n; i++) { const t = i / RATE; const w = rnd(); const hp = w - prev; prev = w; buf[start + i] += voice.gain * 0.22 * Math.exp(-t * 70) * hp; }
    }
    t0 += beats * secPerBeat;
  }
}

renderTonal(TRACKS.lead, VOICES.lead);
renderTonal(TRACKS.bass, VOICES.bass);
renderTonal(TRACKS.arp, VOICES.arp);
renderDrums(TRACKS.drums, VOICES.drums);

// trim to exact loop length, normalize to -1 dBFS
const samples = buf.subarray(0, total);
let peak = 0; for (const s of samples) peak = Math.max(peak, Math.abs(s));
const k = peak > 0 ? 0.89 / peak : 1;
const pcm = Buffer.alloc(total * 2);
for (let i = 0; i < total; i++) pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * k * 32767))), i * 2);

const header = Buffer.alloc(44);
header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8);
header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
header.writeUInt32LE(RATE, 24); header.writeUInt32LE(RATE * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
writeFileSync(out, Buffer.concat([header, pcm]));
console.log(`${out}: ${(total / RATE).toFixed(2)}s`);
