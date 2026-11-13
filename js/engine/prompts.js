// Tool screens, the pure part: bracketed prompts, step by step (spec: The gamified Honeycomb, No score).
//
// A tool is { kind: 'hc' | 'old', steps: [{ prompts: [{ key, right?, jab? }], result? }] }. A prompt that is
// not the direct one gives its line (the `jab` key) and greys out for the rest of that step: in Honeycomb it is
// a nudge that teaches something, in the old tool it is the joke. The direct one gives the step's result and
// moves on. The old tool has no direct prompt and never finishes. Nothing here is scored; `nudges` counts the
// other prompts picked, for the stopwatch (and, for the old tool, the missteps).

export function createTool(def) {
  return { def, step: 0, tried: def.steps.map(() => new Set()), nudges: 0, done: false };
}

/** The current step's prompts, with which are greyed out. */
export function promptsOf(t) {
  const step = t.def.steps[Math.min(t.step, t.def.steps.length - 1)];
  const tried = t.tried[Math.min(t.step, t.def.steps.length - 1)];
  return step.prompts.map((p, i) => ({ key: p.key, index: i, disabled: tried.has(i) }));
}

/**
 * Pick prompt `index` of the current step.
 * @returns {{outcome:'right', result:string, finished:boolean} | {outcome:'wrong', jab:string} | {outcome:'tried'} | {outcome:'done'}}
 */
export function choose(t, index) {
  if (t.done) return { outcome: 'done' };
  const step = t.def.steps[t.step];
  const p = step.prompts[index];
  if (!p || t.tried[t.step].has(index)) return { outcome: 'tried' };
  if (!p.right) {
    t.tried[t.step].add(index);
    t.nudges++;
    return { outcome: 'wrong', jab: p.jab };
  }
  const result = step.result;
  t.step++;
  t.done = t.step >= t.def.steps.length;
  return { outcome: 'right', result, finished: t.done };
}
