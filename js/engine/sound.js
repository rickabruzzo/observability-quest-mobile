// One AudioContext for the whole game (brief 13 E). Phones let sound begin only inside a tap, an iPhone's ring switch on
// silent mutes Web Audio unless the page asks for the playback audio session, and every visit to a screen making its own
// context was how the intro went silent on a phone. Everything that makes sound connects to `out`, never to the destination.
// Nothing here may throw: sound is decoration.

export const MUTE_KEY = 'oq.muted';      // the key js/audio.js used: "1" muted, "0" not

export function createSound({
  AudioContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext,
  audioSession = globalThis.navigator?.audioSession,
  storage = safeStorage(),
} = {}) {
  let ctx = null, out = null, contexts = 0, dead = !AudioContextCtor, sessionAsked = false;
  let muted = read() === '1';

  function read() { try { return storage?.getItem(MUTE_KEY) ?? null; } catch { return null; } }
  function write(v) { try { storage?.setItem(MUTE_KEY, v); } catch { /* storage unavailable: the choice lasts the page */ } }
  function sessionType() { try { return audioSession?.type ?? null; } catch { return null; } }

  return {
    /** Call inside a tap. The first call asks the iPhone for the playback session and makes the one context; every call resumes it. */
    unlock() {
      if (!sessionAsked) {
        sessionAsked = true;
        try { if (audioSession) audioSession.type = 'playback'; } catch { /* no session API worth the name */ }
      }
      if (!ctx && !dead) {
        try {
          ctx = new AudioContextCtor(); contexts++;
          out = ctx.createGain(); out.gain.value = muted ? 0 : 1; out.connect(ctx.destination);
        } catch { ctx = null; out = null; dead = true; }
      }
      if (ctx && ctx.state !== 'running' && ctx.resume) { try { Promise.resolve(ctx.resume()).catch(() => {}); } catch { /* silent */ } }
    },
    /** The context, or null before the first unlock or where there is no Web Audio. */
    context() { return ctx; },
    /** The master gain: everything connects here. */
    get out() { return out; },
    get muted() { return muted; },
    setMuted(on) {
      muted = !!on;
      if (out) { try { out.gain.value = muted ? 0 : 1; } catch { /* silent */ } }
      write(muted ? '1' : '0');
    },
    suspend() { try { if (ctx?.suspend) Promise.resolve(ctx.suspend()).catch(() => {}); } catch { /* silent */ } },
    resume() { try { if (ctx?.resume) Promise.resolve(ctx.resume()).catch(() => {}); } catch { /* silent */ } },
    /** What this page's audio is doing, for the ?stats=1 readout: one photo of a phone says it all. */
    get info() {
      const state = !ctx ? 'none' : muted ? 'muted' : ctx.state;
      return { state, session: sessionType(), sampleRate: ctx?.sampleRate ?? null, contexts };
    },
  };
}

function safeStorage() { try { return globalThis.sessionStorage ?? null; } catch { return null; } }
