// Web Audio synth: title loop + UI blips. No audio files — everything is generated.
import { TEMPO, TRACKS, VOICES, loopBeats, midiToHz } from './audio/title-loop.js';

const MUTE_KEY = 'oq.muted';
const LOOP_GAIN = 1.0;
const IN_GAME_GAIN = 0.4;

function readMuted() { try { return sessionStorage.getItem(MUTE_KEY) === '1'; } catch { return false; } }
function writeMuted(v) { try { sessionStorage.setItem(MUTE_KEY, v ? '1' : '0'); } catch { /* ignore */ } }

export function createAudio() {
  let ctx = null, master = null, loopGain = null;
  let pulse25 = null, noise = null;
  let muted = readMuted();
  let running = false;
  let loopTimer = null;
  let nextLoopAt = 0;
  let volume = 1;
  const nodes = new Set();

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : volume;
    master.connect(ctx.destination);
    loopGain = ctx.createGain();
    loopGain.gain.value = LOOP_GAIN;
    loopGain.connect(master);
    // 25% duty pulse as a PeriodicWave
    const N = 32, real = new Float32Array(N), imag = new Float32Array(N);
    for (let n = 1; n < N; n++) imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * 0.25);
    pulse25 = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
    // 1s white-noise buffer for drums
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function tone({ note, at, dur, voice, dest, detune = 0 }) {
    const o = ctx.createOscillator();
    if (voice.wave === 'pulse25') o.setPeriodicWave(pulse25); else o.type = voice.wave;
    o.frequency.value = midiToHz(note);
    o.detune.value = detune;
    const g = ctx.createGain();
    const gate = Math.max(0.02, dur * 0.92);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(voice.gain, at + voice.attack);
    g.gain.setValueAtTime(voice.gain, at + gate);
    g.gain.linearRampToValueAtTime(0, at + gate + voice.release);
    o.connect(g).connect(dest);
    o.start(at);
    o.stop(at + gate + voice.release + 0.01);
    nodes.add(o); o.onended = () => nodes.delete(o);
  }

  function drum(hit, at, dest) {
    const g = ctx.createGain();
    g.connect(dest);
    if (hit === 'k') {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(180, at);
      o.frequency.exponentialRampToValueAtTime(45, at + 0.12);
      g.gain.setValueAtTime(VOICES.drums.gain * 1.1, at);
      g.gain.exponentialRampToValueAtTime(0.001, at + 0.14);
      o.connect(g); o.start(at); o.stop(at + 0.15);
      nodes.add(o); o.onended = () => nodes.delete(o);
    } else {
      const s = ctx.createBufferSource();
      s.buffer = noise;
      const f = ctx.createBiquadFilter();
      f.type = hit === 'h' ? 'highpass' : 'bandpass';
      f.frequency.value = hit === 'h' ? 7000 : 1800;
      const amp = hit === 'h' ? 0.22 : 0.55, len = hit === 'h' ? 0.04 : 0.11;
      g.gain.setValueAtTime(VOICES.drums.gain * amp, at);
      g.gain.exponentialRampToValueAtTime(0.001, at + len);
      s.connect(f).connect(g); s.start(at); s.stop(at + len + 0.01);
      nodes.add(s); s.onended = () => nodes.delete(s);
    }
  }

  function scheduleLoop(startAt) {
    const spb = 60 / TEMPO;
    for (const [name, voice] of [['lead', VOICES.lead], ['bass', VOICES.bass], ['arp', VOICES.arp]]) {
      let t = startAt;
      for (const [note, beats] of TRACKS[name]) {
        const dur = beats * spb;
        if (note > 0) tone({ note, at: t, dur, voice, dest: loopGain });
        t += dur;
      }
    }
    let t = startAt;
    for (const [hit, beats] of TRACKS.drums) { if (hit !== '-') drum(hit, t, loopGain); t += beats * spb; }
    return startAt + loopBeats * spb;
  }

  function armNext() {
    const lead = Math.max(0.05, nextLoopAt - ctx.currentTime - 0.75);
    loopTimer = setTimeout(() => {
      if (!running) return;
      nextLoopAt = scheduleLoop(nextLoopAt);
      armNext();
    }, lead * 1000);
  }

  const api = {
    get running() { return running; },
    get muted() { return muted; },
    get context() { return ctx; },

    /** Call from a user gesture. Creates/resumes the AudioContext. */
    async unlock() {
      const c = ensure();
      if (!c) return false;
      if (c.state === 'suspended') { try { await c.resume(); } catch { /* ignore */ } }
      return true;
    },

    playLoop() {
      if (!ensure() || running) return;
      running = true;
      nextLoopAt = scheduleLoop(ctx.currentTime + 0.05);
      armNext();
    },

    stopLoop() {
      running = false;
      if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
      for (const n of nodes) { try { n.stop(); } catch { /* already stopped */ } }
      nodes.clear();
    },

    /** Lower the loop under gameplay (spec: continue at reduced volume). */
    setLoopLevel(inGame) {
      if (!loopGain) return;
      loopGain.gain.setTargetAtTime(inGame ? IN_GAME_GAIN : LOOP_GAIN, ctx.currentTime, 0.3);
    },

    setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (master && !muted) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.02);
    },

    /** Page hidden → suspend the context (stops the loop playing under a locked phone); visible → resume. */
    setHidden(hidden) {
      if (!ctx) return;
      if (hidden) { ctx.suspend?.().catch?.(() => {}); }
      else if (running && !muted) { ctx.resume?.().catch?.(() => {}); }
    },

    toggleMute() {
      muted = !muted;
      writeMuted(muted);
      if (master) master.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.02);
      return muted;
    },

    /** Short UI sounds: advance | select | win | lose | fanfare */
    blip(name) {
      if (!ctx || muted) return;
      const t = ctx.currentTime + 0.01;
      const v = { wave: 'square', gain: 0.12, attack: 0.002, release: 0.03 };
      const seq = {
        advance: [[81, 0.05]],
        select: [[76, 0.06], [83, 0.08]],
        win: [[72, 0.08], [76, 0.08], [79, 0.08], [84, 0.22]],
        lose: [[64, 0.12], [60, 0.12], [55, 0.3]],
        fanfare: [[67, 0.1], [72, 0.1], [76, 0.1], [79, 0.3], [76, 0.1], [79, 0.5]],
      }[name] || [[81, 0.05]];
      let at = t;
      for (const [note, dur] of seq) { tone({ note, at, dur, voice: v, dest: master }); at += dur; }
    },
  };
  return api;
}
