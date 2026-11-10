// Canvas animation layer: draws a scene's still, then its module's overlays, at a quantised frame rate.
import { quantize, reducedMotion } from './clock.js';
import { warm } from './sprites.js';

export const W = 640, H = 428;

/**
 * createLayer(canvas, getImage) → { show(scene, opts), setState(partial), stop(), still(name) }
 *  - getImage(name) returns a preloaded HTMLImageElement for a still asset.
 *  - scene: { still, assets: string[], optional?, draw(ctx, frame, state), fps? }
 */
export function createLayer(canvas, getImage, { fps = 10 } = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;
  let raf = 0, scene = null, state = {}, t0 = 0, lastFrame = -1, token = 0;

  function drawStill(name) {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const img = getImage(name);
    if (img) ctx.drawImage(img, 0, 0, W, H);
  }

  function frameNow() { return quantize(performance.now() - t0, scene?.fps || fps); }

  function render(frame) {
    drawStill(scene.still);
    try { scene.draw(ctx, frame, state); } catch (e) { console.error(e); }
  }

  function tick() {
    if (!scene) return;
    const f = frameNow();
    if (f !== lastFrame) { lastFrame = f; render(f); }
    raf = requestAnimationFrame(tick);
  }

  const api = {
    get scene() { return scene; },
    get frame() { return lastFrame; },
    still(name) { api.stop(); drawStill(name); },
    setState(partial) { state = { ...state, ...partial }; },
    stop() { if (raf) cancelAnimationFrame(raf); raf = 0; scene = null; lastFrame = -1; },
    async show(next, initialState = {}) {
      api.stop();
      const my = ++token;
      state = { ...initialState };
      drawStill(next.still);                // show the approved still immediately
      if (reducedMotion()) return;          // and leave it there under reduced motion
      if (next.assets?.length) {
        try { await warm(next.assets, { optional: !!next.optional }); } catch (e) { console.error(e); return; }
      }
      if (next.init) { try { await next.init(); } catch (e) { console.error(e); } }
      if (my !== token) return;             // a newer show() superseded us
      scene = next; t0 = performance.now(); lastFrame = -1;
      tick();
    },
  };
  return api;
}
