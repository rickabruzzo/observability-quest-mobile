// Tool screens, the pure part: bracketed prompts, step by step, and the score (spec: Scoring).
//
// A tool is { kind: 'hc' | 'old', steps: [{ prompts: [{ key, right?, jab? }], result? }] }. A wrong prompt
// gives its jab and greys out for the rest of that step; a right one gives the step's result and moves on.
// The old tool has only wrong prompts, never finishes, and scores nothing: it is the joke.

export const CLEAN = 100;   // the Honeycomb path with no wrong prompt inside the Honeycomb screen
export const MESSY = 50;    // a wrong prompt was tried in it first, at any step

export function createTool(def) {
  return { def, step: 0, tried: def.steps.map(() => new Set()), wrong: 0, done: false };
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
    if (t.def.kind === 'hc') t.wrong++;
    return { outcome: 'wrong', jab: p.jab };
  }
  const result = step.result;
  t.step++;
  t.done = t.step >= t.def.steps.length;
  return { outcome: 'right', result, finished: t.done };
}

/** Points this screen earns: 100 clean, 50 after any wrong prompt, 0 unfinished or the old tool. */
export function toolScore(t) {
  if (t.def.kind !== 'hc' || !t.done) return 0;
  return t.wrong ? MESSY : CLEAN;
}
