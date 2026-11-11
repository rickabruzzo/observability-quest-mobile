// Landscape stage fitting: the 320×200 scene scaled to the largest 16:10 box under the
// status bar, letterboxed by two thumb columns. Pure math; applyStage writes CSS vars.

export const SCENE_W = 320;
export const SCENE_H = 200;
export const STATUS_H = 20;
export const MIN_COL = 56;

/**
 * @param {number} vw viewport width (CSS px)
 * @param {number} vh viewport height (CSS px)
 * @returns {{ sceneW: number, sceneH: number, colW: number, scale: number }}
 */
export function fitStage(vw, vh, { statusH = STATUS_H, minCol = MIN_COL } = {}) {
  let sceneH = Math.max(0, vh - statusH);
  let sceneW = Math.floor(sceneH * (SCENE_W / SCENE_H));
  // Height first; shrink when the thumb columns would get thinner than minCol (any width —
  // a 4:3 tablet or a squarish desktop window otherwise pushes the columns off-screen).
  if ((vw - sceneW) / 2 < minCol) {
    sceneW = Math.max(0, vw - 2 * minCol);
    sceneH = Math.floor(sceneW / (SCENE_W / SCENE_H));
  }
  const colW = Math.max(0, Math.floor((vw - sceneW) / 2));
  return { sceneW, sceneH, colW, scale: sceneW / SCENE_W };
}

/** Writes the fit as CSS custom properties on `root` (usually document.documentElement). */
export function applyStage(root, fit) {
  root.style.setProperty('--scene-w', `${fit.sceneW}px`);
  root.style.setProperty('--scene-h', `${fit.sceneH}px`);
  root.style.setProperty('--col-w', `${fit.colW}px`);
}

export function isPortrait(w, h) {
  return h > w;
}
