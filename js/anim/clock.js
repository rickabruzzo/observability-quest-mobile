// Animation clock: quantise wall time to a low frame rate for the 1989 feel.

export function quantize(ms, fps) {
  return Math.floor((ms * fps) / 1000);
}

export function reducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
