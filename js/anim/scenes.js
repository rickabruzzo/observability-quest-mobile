// Registry: scene module for a still asset name. Scenes without a module animate nothing.
import { portraitScene } from './portrait.js';

const PORTRAIT_SEEDS = { portrait_christine: 1, portrait_emily: 2, portrait_graham: 3, portrait_jessitron: 4, portrait_matt: 5, portrait_charity: 6 };
const SCENES = {};

export function registerScene(name, factory) { SCENES[name] = factory; }

/** Returns a scene module for `name`, or a still-only module. */
export function sceneFor(name) {
  if (SCENES[name]) return SCENES[name]();
  if (name in PORTRAIT_SEEDS) return portraitScene(name, { seed: PORTRAIT_SEEDS[name] });
  return { name, still: name, assets: [], draw() {} };
}

export function animatedNames() {
  return [...Object.keys(SCENES), ...Object.keys(PORTRAIT_SEEDS)];
}
