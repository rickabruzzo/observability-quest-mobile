// Step-keyframe timeline: [[frame, value], ...] sorted by frame; loops at the last keyframe's frame.
export function at(frame, keyframes) {
  const loop = keyframes[keyframes.length - 1][0];
  const f = loop > 0 ? ((frame % loop) + loop) % loop : 0;
  let v = keyframes[0][1];
  for (const [kf, val] of keyframes) { if (kf <= f) v = val; else break; }
  return v;
}

// Deterministic small hash → [0, 1)
export function hash01(a, b = 0, c = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2246822519) >>> 0;
  h = (h ^ (h >>> 13)) * 1274126177 >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}
