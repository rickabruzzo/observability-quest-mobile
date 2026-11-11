// Placeholder sound for the intro: a pager beep and a lamp click from WebAudio, no files.
// Sound is decoration — every path here is silent rather than broken when audio is unavailable or blocked.

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
  return {
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
