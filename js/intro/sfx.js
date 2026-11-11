// Placeholder sound for the intro: a pager beep and a lamp click from WebAudio, no files.
// Sound is decoration — every path here is silent rather than broken when audio is unavailable or blocked.

// Each action's sound, as a few synth parts: { type: 'square' | 'triangle' | 'noise', hz, to (slide target), at, ms, gain }.
// Short and quiet on purpose — PC-speaker manners. Stand-ins until the OPL soundtrack sub-project.
export const SOUNDS = {
  title: [{ type: 'square', hz: 392, at: 0, ms: 110, gain: 0.04 }, { type: 'square', hz: 523, at: 120, ms: 110, gain: 0.04 }, { type: 'square', hz: 659, at: 240, ms: 110, gain: 0.04 }, { type: 'square', hz: 784, at: 360, ms: 260, gain: 0.04 }],
  rustle: [{ type: 'noise', at: 0, ms: 90, gain: 0.03 }, { type: 'noise', at: 130, ms: 120, gain: 0.04 }],                 // sitting up in the sheets
  step: [{ type: 'triangle', hz: 110, to: 60, at: 0, ms: 90, gain: 0.09 }, { type: 'noise', at: 0, ms: 30, gain: 0.03 }],  // feet on the floor
  pickup: [{ type: 'square', hz: 523, at: 0, ms: 60, gain: 0.05 }, { type: 'square', hz: 659, at: 70, ms: 60, gain: 0.05 }, { type: 'square', hz: 784, at: 140, ms: 110, gain: 0.05 }],   // clothes on
  take: [{ type: 'square', hz: 784, at: 0, ms: 60, gain: 0.05 }, { type: 'square', hz: 1047, at: 70, ms: 130, gain: 0.05 }],                                                           // item into the hand
  door: [{ type: 'noise', at: 0, ms: 25, gain: 0.07 }, { type: 'triangle', hz: 180, to: 260, at: 40, ms: 220, gain: 0.05 }],   // latch, then the hinge
  shut: [{ type: 'triangle', hz: 90, to: 50, at: 0, ms: 140, gain: 0.1 }, { type: 'noise', at: 0, ms: 40, gain: 0.06 }],
};

export function createSfx({ AudioContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext, muted = () => false } = {}) {
  let ctx = null, dead = !AudioContextCtor;
  function audio() {
    if (dead || muted()) return null;
    try {
      if (!ctx) ctx = new AudioContextCtor();
      if (ctx.state === 'suspended' && ctx.resume) Promise.resolve(ctx.resume()).catch(() => {});
      return ctx;
    } catch { dead = true; return null; }
  }
  function tone(a, hz, at, ms, gain) {
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'square'; o.frequency.value = hz; g.gain.value = gain;
    o.connect(g); g.connect(a.destination);
    o.start(a.currentTime + at); o.stop(a.currentTime + at + ms / 1000);
  }
  function noise(a, at, ms, gain) {
    const n = Math.max(1, Math.floor(a.sampleRate * (ms / 1000))), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = a.createBufferSource(), g = a.createGain();
    src.buffer = buf; g.gain.value = gain; src.connect(g); g.connect(a.destination); src.start(a.currentTime + at);
  }
  function voice(a, p) {
    if (p.type === 'noise') return noise(a, p.at / 1000, p.ms, p.gain);
    const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + p.at / 1000;
    o.type = p.type; o.frequency.value = p.hz; g.gain.value = p.gain;
    if (p.to && o.frequency.linearRampToValueAtTime) { o.frequency.setValueAtTime?.(p.hz, t0); o.frequency.linearRampToValueAtTime(p.to, t0 + p.ms / 1000); }
    o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + p.ms / 1000);
  }
  return {
    /** Call inside a tap: phones only let sound start from one. */
    unlock() { audio(); },
    play(name) {
      const parts = SOUNDS[name]; if (!parts) return;
      const a = audio(); if (!a) return;
      try { for (const p of parts) voice(a, p); } catch { /* silent */ }
    },
    beep() {
      const a = audio(); if (!a) return;
      try { tone(a, 880, 0, 70, 0.05); tone(a, 660, 0.09, 70, 0.05); } catch { /* silent */ }
    },
    click() {
      const a = audio(); if (!a) return;
      try {
        const n = Math.max(1, Math.floor(a.sampleRate * 0.02)), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const src = a.createBufferSource(), g = a.createGain();
        src.buffer = buf; g.gain.value = 0.08; src.connect(g); g.connect(a.destination); src.start();
      } catch { /* silent */ }
    },
    close() { try { if (ctx && ctx.close) Promise.resolve(ctx.close()).catch(() => {}); } catch { /* silent */ } ctx = null; },
  };
}
