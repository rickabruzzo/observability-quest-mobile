# SCI Shell, Hero Sprite & Character Creation — Implementation Plan (v2 sub-project 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On branch `sci-adventure`, replace the v0.1 game shell with the landscape SCI shell, a pixel-exact port of the approved VGA hero sprite generator, and the Quest-for-Glory-style character creation sheet, ending in a preview room where the created hero walks — all playable from the title screen on a phone held sideways.

**Architecture:** Static ES modules, no build step. A tiny state machine (`js/game.js`) swaps screens; each screen owns a slice of DOM over one 320×200 `<canvas>` that CSS scales to the landscape viewport (`js/engine/stage.js`). The hero is composed procedurally from part masks by `js/engine/hero.js`, a line-for-line port of the Python reference `tools/hero_gen.py`; golden `.rgba` fixtures emitted by Python prove the port pixel for pixel. The creator is pure state (`js/creator-state.js`) plus a DOM view (`js/screens/creator.js`).

**Tech Stack:** HTML/CSS/ES2022 modules; `node --test` unit tests; Playwright e2e against `tests/e2e/_server.js`; Python 3 + Pillow for the reference generator and fixtures (`pytest`).

**Spec:** `docs/superpowers/specs/2026-11-10-sci-adventure-design.md` — sections *Constraints*, *Interface (SCI grammar, phone-sized)*, *Character creation*, *Art › Hero*, *Verification before handoff*.

## Global Constraints

- Landscape play; portrait shows the *Rotate your phone* gate; CLAIM/COMPLETE exempt (not built in this sub-project — the gate rule must still key off `body[data-screen]`).
- Logical scene **320×200**, `image-rendering: pixelated`, CSS-scaled to the largest 16:10 box that fits under a 20 px status bar; black letterbox columns either side, never narrower than **56 CSS px**; non-integer scale accepted.
- Hero sprite **28×72** logical px; outline `#1A1424`; parts and palettes exactly as `tools/hero_gen.py`.
- Every picker ≤ 5 choices; every tap target ≥ **44 CSS px**; two sheet pages (FACE, KIT), never a scroll.
- Fonts: **VT323** for all read text and numerals (≥ 18 px); **GloryQuest** (`assets/fonts/gloryquest/`, CC BY-SA, credit kept) for headings and sheet labels only. Silkscreen and Pixelify Sans are not loaded.
- Sheet colours: panel `#FFFFFF`, bands `#000`, labels `#3C3CB4`, selected/hints `#E04040`, frame `#8C3A1C` / `#4A1E0C` / `#C8723A`, jewels `#4CAF50`, hero backdrop `#3A4660`.
- `sessionStorage` key `oq.hero` holds the hero config; every storage access wrapped in try/catch; the game works with storage unavailable.
- Reduced motion (`prefers-reduced-motion: reduce`): the hero teleports instead of walking.
- Test viewports: **844×390, 667×375, 932×430** landscape; **390×844** portrait for the gate; **1280×800** desktop.
- Weight: everything this sub-project ships (HTML, CSS, JS, fonts) ≤ **600 KB**; title interactive without waiting on anything but `index.html`, `css/game.css`, `js/*`, the two fonts.
- No real competitor or customer names anywhere (none expected in this sub-project).
- Commits: author `Claude <noreply@anthropic.com>` with the attribution trailer; never push — Rick pushes.

## Review Focus

1. **Portrait rotation mid-walk** — the gate appears, the walk pauses, and on rotating back the hero is where it was (no jump, no double-fire). Test pinned in Task 10.
2. **`sessionStorage` throwing or absent** (private mode, iOS quirks) — the creator still works and START still advances. Test pinned in Task 9.
3. **Corrupt or stale `oq.hero`** (bad JSON, unknown option values, old shape) — sanitised to defaults, never a crash on load. Test pinned in Task 6.
4. **Extreme viewports** — 667×375 keeps 56-px columns and 44-px targets; 1280×800 doesn't blow the scene past the viewport; 932×430 columns don't swallow the sheet. Tests pinned in Tasks 3 and 10.
5. **Hostile name input** — 40 emoji, control characters, leading/trailing spaces: clamped to 16 visible characters, controls stripped, empty → "the Engineer". Test pinned in Task 6.

---

## File structure

**Remove (v0.1 game loop, kept on `main` and tag `v0.1-cyoa`):** `js/game.js` (rewritten), `js/screen.js`, `js/scenarios.js`, `tests/scenarios.test.js`, `tests/e2e/flow.test.js`, `tests/e2e/claim.test.js`, `tests/e2e/audio.test.js`, `tests/e2e/budget.test.js`, `tests/e2e/preview.test.js`, `tests/e2e/reduced-motion.test.js`, `tests/e2e/review-fixes.test.js`.

**Keep untouched (reused by later sub-projects):** `js/claim.js` + `tests/claim.test.js`, `js/text.js` + `tests/text.test.js`, `js/audio.js`, `js/audio/title-loop.js` + `tests/audio.test.js`, `js/anim/*` + `tests/anim*.test.js`, `tests/assets.test.js`, `tests/stamp.test.js`, `tools/*` (existing), `assets/*`, `tests/e2e/_server.js`, `anim-preview.html`.

**Create:**
- `tools/hero_gen.py` (exists) — reference generator; gains walk frames and a `--fixtures` mode. `tools/tests/test_hero_gen.py`.
- `tests/fixtures/hero/<name>.json|.rgba|.png` — golden configs and pixels.
- `js/engine/hero-parts.js` — palettes, option lists, presets, `BODIES`, walk-frame table (data only).
- `js/engine/hero.js` — `composeHero`, `drawHero`, `drawHeroCrop`.
- `js/engine/stage.js` — `fitStage`, `applyStage`, status-bar setter, orientation watcher.
- `js/engine/walk.js` — walk planning/stepping math.
- `js/creator-state.js` — pure reducer: presets, pick, random, sanitise, name.
- `js/screens/title.js`, `js/screens/creator.js`, `js/screens/preview.js`.
- `js/game.js` — state machine + `window.__oq`.
- `index.html`, `css/game.css` — rewritten for the landscape shell.
- Tests: `tests/hero.test.js`, `tests/stage.test.js`, `tests/walk.test.js`, `tests/creator-state.test.js`, `tests/fonts.test.js`, `tests/e2e/shell.test.js`, `tests/e2e/creator.test.js`, `tests/e2e/walk-preview.test.js`, `tests/e2e/weight.test.js`.

---

### Task 1: Retire the v0.1 game loop on the branch

**Files:**
- Delete: `js/screen.js`, `js/scenarios.js`, `tests/scenarios.test.js`, `tests/e2e/flow.test.js`, `tests/e2e/claim.test.js`, `tests/e2e/audio.test.js`, `tests/e2e/budget.test.js`, `tests/e2e/preview.test.js`, `tests/e2e/reduced-motion.test.js`, `tests/e2e/review-fixes.test.js`
- Modify: `js/game.js` → replace contents with a stub that exports nothing and sets `window.__oq = { ready: true, v: 2 }` (rewritten fully in Task 8)
- Modify: `README.md` — add a "v2 (sci-adventure)" section stating v0.1 lives on `main`/`v0.1-cyoa` and this branch is the SCI rebuild.

**Interfaces:**
- Produces: a branch where `npm test` runs only tests whose modules still exist.

- [ ] **Step 1: Remove the files**

```bash
git rm -q js/screen.js js/scenarios.js tests/scenarios.test.js tests/e2e/flow.test.js tests/e2e/claim.test.js tests/e2e/audio.test.js tests/e2e/budget.test.js tests/e2e/preview.test.js tests/e2e/reduced-motion.test.js tests/e2e/review-fixes.test.js
```

- [ ] **Step 2: Stub `js/game.js`** so `index.html` still loads without errors (the real module arrives in Task 8).

- [ ] **Step 3: Run the unit suite**

Run: `npm test`
Expected: all remaining tests PASS (claim, text, audio, anim, anim-scenes, assets, stamp); nothing imports a removed module.

- [ ] **Step 4: README section, then commit**

```bash
git add -A && git commit -m "chore(v2): retire v0.1 game loop and its e2e on sci-adventure; v0.1 stays on main"
```

---

### Task 2: Reference hero generator in `tools/` with walk frames and fixtures

**Files:**
- Modify: `tools/hero_gen.py` (the approved reference generator, already committed; the geometry in it is normative — add the data tables, poses and the fixtures CLI below)
- Create: `tools/tests/test_hero_gen.py`
- Create: `tests/fixtures/hero/` (generated)

**Interfaces:**
- Produces (Python): `hero(**config, pose='idle') -> PIL.Image RGBA 28×72`; `CONFIG_KEYS`, `OPTIONS` (dict of option lists), `PRESETS`, `BODIES`, `WALK` (frame table); CLI `python3 tools/hero_gen.py --fixtures <dir>` writes, for each fixture name, `<name>.json` (config + pose), `<name>.rgba` (28·72·4 bytes, row-major RGBA) and `<name>.png`.
- Consumed by Task 4 (JS port must match every fixture byte for byte).

Normative data the JS port copies verbatim:

```python
OPTIONS = {
  'body': ['masc', 'fem', 'nb'], 'skin': [0, 1, 2, 3, 4],
  'hair': ['black', 'brown', 'blonde', 'ginger', 'violet'],
  'length': ['buzz', 'short', 'medium', 'long'],
  'style': ['straight', 'curly', 'spiky', 'locs', 'undercut'],
  'beard': ['none', 'stubble', 'goatee', 'full', 'big'],
  'beardCol': ['black', 'brown', 'blonde', 'ginger', 'violet'],
  'hoodie': ['honey', 'ink', 'teal', 'indigo', 'lime'],
  'jeans': ['indigo', 'black', 'light', 'grey', 'khaki'],
  'glasses': ['none', 'round', 'square', 'thick'],
  'hold': ['laptop', 'coffee', 'phone', 'duck', 'pager'],
}
POSES = ['idle', 'walk1', 'walk2', 'walk3', 'walk4']
# per-pose offsets applied to the idle masks: (legL_dx, legR_dx, shoeL_dx, shoeR_dx, bob_dy, armL_dy, armR_dy)
WALK = {'idle': (0, 0, 0, 0, 0, 0, 0), 'walk1': (-1, 1, -2, 2, 0, 1, -1), 'walk2': (0, 0, 0, 0, 1, 0, 0),
        'walk3': (1, -1, 2, -2, 0, -1, 1), 'walk4': (0, 0, 0, 0, 1, 0, 0)}
```

Fixture set (names → config, pose): `masc-idle` (preset masc), `masc-walk1..4`, `fem-idle` (preset fem), `nb-idle` (preset nb), `var-full-beard` (masc, skin 3, buzz, full beard, thick, honey, khaki, duck), `var-locs` (nb, skin 2, blonde, long, locs, goatee, round, lime, indigo, laptop), `var-curly` (fem, skin 4, ginger, medium, curly, none, indigo hoodie, light jeans, pager).

- [ ] **Step 1: Write the failing Python tests**

```python
# tools/tests/test_hero_gen.py
import json, os, subprocess, sys
from tools import hero_gen

def test_hero_is_28_by_72_rgba():
    im = hero_gen.hero(**hero_gen.PRESETS['masc'])
    assert im.size == (28, 72) and im.mode == 'RGBA'

def test_every_option_value_renders():
    for key, values in hero_gen.OPTIONS.items():
        for v in values:
            cfg = {**hero_gen.PRESETS['masc'], key: v}
            assert hero_gen.hero(**cfg).size == (28, 72)

def test_every_pose_renders_and_differs_from_idle():
    base = hero_gen.hero(**hero_gen.PRESETS['masc'], pose='idle').tobytes()
    for p in hero_gen.POSES[1:]:
        assert hero_gen.hero(**hero_gen.PRESETS['masc'], pose=p).tobytes() != base

def test_silhouette_edge_is_outline_colour():
    im = hero_gen.hero(**hero_gen.PRESETS['masc'])
    px = im.load()
    top = next(y for y in range(72) if px[13, y][3])        # first opaque pixel down the centre column
    bottom = next(y for y in range(71, -1, -1) if px[9, y][3])  # last opaque pixel up the left-shoe column
    assert px[13, top][:3] == hero_gen.OUTLINE[:3]
    assert px[9, bottom][:3] == hero_gen.OUTLINE[:3]

def test_deterministic():
    a = hero_gen.hero(**hero_gen.PRESETS['fem']).tobytes(); b = hero_gen.hero(**hero_gen.PRESETS['fem']).tobytes()
    assert a == b

def test_fixtures_cli_writes_json_rgba_png(tmp_path):
    subprocess.run([sys.executable, 'tools/hero_gen.py', '--fixtures', str(tmp_path)], check=True)
    names = sorted(p[:-5] for p in os.listdir(tmp_path) if p.endswith('.json'))
    assert 'masc-idle' in names and 'masc-walk3' in names and 'var-locs' in names
    for n in names:
        cfg = json.load(open(tmp_path / f'{n}.json'))
        assert set(cfg) == set(hero_gen.CONFIG_KEYS) | {'pose'}
        assert os.path.getsize(tmp_path / f'{n}.rgba') == 28 * 72 * 4
        assert (tmp_path / f'{n}.png').exists()
```

- [ ] **Step 2: Run them to verify they fail**

Run: `python3 -m pytest tools/tests/test_hero_gen.py -q`
Expected: FAIL — `ModuleNotFoundError: tools.hero_gen`.

- [ ] **Step 3: Implement `tools/hero_gen.py`**

Keep the existing masks → shading → details → outline pipeline exactly, then: expose `OPTIONS`, `POSES`, `WALK`, `CONFIG_KEYS = list(OPTIONS)`, `PRESETS` (masc/fem/nb as in the scratch file, with `length` instead of `len`); make `hero()` take `pose` and apply the `WALK` offsets to the leg/shoe spans, the `bob_dy` to everything above the legs, and `armL_dy`/`armR_dy` to the arm+hand spans; add `write_fixtures(dir)` and the `--fixtures` CLI. Shading rules stay exactly: highlight `hl` columns on the left of each part row, shade `sh` on the right, top row light; outline = silhouette 4-neighbour edge.

- [ ] **Step 4: Run the tests**

Run: `python3 -m pytest tools/tests/test_hero_gen.py -q`
Expected: 6 passed.

- [ ] **Step 5: Generate the committed fixtures and the full Python suite**

Run: `python3 tools/hero_gen.py --fixtures tests/fixtures/hero && ls tests/fixtures/hero | wc -l && python3 -m pytest tools/tests -q`
Expected: `30` files (10 fixtures × 3); all Python tests pass.

- [ ] **Step 6: Commit**

```bash
git add tools/hero_gen.py tools/tests/test_hero_gen.py tests/fixtures/hero
git commit -m "feat(hero): reference VGA hero generator with walk frames and golden fixtures"
```

---

### Task 3: Stage fitting math

**Files:**
- Create: `js/engine/stage.js`
- Test: `tests/stage.test.js`

**Interfaces:**
- Produces: `fitStage(vw, vh, { statusH = 20, minCol = 56 } = {}) → { sceneW, sceneH, colW, scale }` — pure; `sceneW/sceneH` are CSS px of the 320×200 box, `colW` the letterbox column width, `scale = sceneW / 320`. `applyStage(root, fit)` writes CSS custom properties `--scene-w`, `--scene-h`, `--col-w` (px strings) on `root`. `isPortrait(w, h) → h > w`.
- Consumed by Task 8 (resize handler) and Task 9 (sheet geometry).

- [ ] **Step 1: Write the failing tests**

```js
// tests/stage.test.js
import test from 'node:test'; import assert from 'node:assert/strict';
import { fitStage, isPortrait } from '../js/engine/stage.js';

test('844x390: height-bound, 16:10, columns split the rest', () => {
  const f = fitStage(844, 390);
  assert.equal(f.sceneH, 370); assert.equal(f.sceneW, 592); assert.equal(f.colW, 126);
  assert.ok(Math.abs(f.scale - 1.85) < 0.001);
});
test('667x375: columns never below 56, scene shrinks to fit', () => {
  const f = fitStage(667, 375);
  assert.ok(f.colW >= 56); assert.ok(f.sceneW + 2 * f.colW <= 667); assert.equal(Math.round(f.sceneW / f.sceneH * 10), 16);
});
test('1280x800: scene never taller than the viewport minus the bar', () => {
  const f = fitStage(1280, 800);
  assert.equal(f.sceneH, 780); assert.equal(f.sceneW, 1248); assert.equal(f.colW, 16);
});
test('932x430 keeps 16:10 and fills the height', () => {
  const f = fitStage(932, 430); assert.equal(f.sceneH, 410); assert.equal(f.sceneW, 656);
});
test('isPortrait', () => { assert.equal(isPortrait(390, 844), true); assert.equal(isPortrait(844, 390), false); });
```

Note: 1280×800 → colW 16 is below `minCol`; the rule is *height first, then shrink only if columns would go below minCol AND the viewport is a phone* — define: `if (colW < minCol && vw < 1024) shrink to colW = minCol`. On desktop the columns may be thin; the icon bar falls back to a row (later sub-project).

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/stage.test.js`
Expected: FAIL — cannot find module `js/engine/stage.js`.

- [ ] **Step 3: Implement `fitStage`, `applyStage`, `isPortrait` in `js/engine/stage.js`**

`sceneH = vh - statusH; sceneW = floor(sceneH * 1.6)`; if `(vw - sceneW)/2 < minCol && vw < 1024` → `sceneW = vw - 2*minCol; sceneH = floor(sceneW / 1.6)`; `colW = floor((vw - sceneW)/2)`. Integers throughout.

- [ ] **Step 4: Run to verify pass**

Run: `node --test tests/stage.test.js`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add js/engine/stage.js tests/stage.test.js && git commit -m "feat(stage): landscape scene fitting math"
```

---

### Task 4: Hero renderer — pixel-exact port

**Files:**
- Create: `js/engine/hero-parts.js`, `js/engine/hero.js`
- Test: `tests/hero.test.js`

**Interfaces:**
- Produces: in `hero-parts.js`: `OPTIONS`, `POSES`, `WALK`, `PRESETS`, `SKIN`, `HAIR`, `HOODIE`, `JEANS`, `BODIES`, `OUTLINE` — same names and values as the Python. In `hero.js`: `composeHero(config, pose = 'idle') → Uint8ClampedArray(28*72*4)` (row-major RGBA, transparent = 0,0,0,0); `HERO_W = 28`, `HERO_H = 72`; `drawHero(ctx, config, pose, x, y, scale = 1, { flip = false } = {})` paints with `fillRect` per pixel (no ImageData smoothing issues) — flip mirrors horizontally about the sprite's own centre; `drawHeroCrop(ctx, config, crop, scale)` where `crop = { x, y, w, h }` in sprite px, painting at (0,0) — used for picker thumbnails; `HEAD_CROP = { x: 4, y: 0, w: 20, h: 21 }`, `HAND_CROP = { x: 0, y: 30, w: 12, h: 20 }`.
- Consumes: Task 2's fixtures.

- [ ] **Step 1: Write the failing tests**

```js
// tests/hero.test.js
import test from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { composeHero, HERO_W, HERO_H, drawHero, drawHeroCrop, HEAD_CROP } from '../js/engine/hero.js';
import { OPTIONS, PRESETS, POSES } from '../js/engine/hero-parts.js';

const DIR = 'tests/fixtures/hero/';
const names = readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));

test('fixtures exist', () => assert.ok(names.length >= 10));

for (const n of names) {
  test(`matches Python fixture ${n}`, () => {
    const { pose, ...cfg } = JSON.parse(readFileSync(DIR + n + '.json', 'utf8'));
    const want = readFileSync(DIR + n + '.rgba');
    const got = Buffer.from(composeHero(cfg, pose).buffer);
    assert.equal(got.length, HERO_W * HERO_H * 4);
    const firstDiff = got.findIndex((b, i) => b !== want[i]);
    assert.equal(firstDiff, -1, `first differing byte ${firstDiff} → pixel ${Math.floor(firstDiff / 4) % 28},${Math.floor(firstDiff / 4 / 28)}`);
  });
}

test('every option value and pose composes without throwing', () => {
  for (const [k, vs] of Object.entries(OPTIONS)) for (const v of vs) composeHero({ ...PRESETS.masc, [k]: v });
  for (const p of POSES) composeHero(PRESETS.fem, p);
});

function fakeCtx() { const calls = []; return { calls, fillStyle: '', fillRect(x, y, w, h) { calls.push([x, y, w, h, this.fillStyle]); } }; }

test('drawHero paints scale-sized rects at the offset; flip mirrors x', () => {
  const a = fakeCtx(); drawHero(a, PRESETS.masc, 'idle', 10, 20, 2);
  assert.ok(a.calls.every(([, , w, h]) => w === 2 && h === 2));
  assert.ok(a.calls.every(([x, y]) => x >= 10 && y >= 20));
  const b = fakeCtx(); drawHero(b, PRESETS.masc, 'idle', 10, 20, 2, { flip: true });
  const xsA = new Set(a.calls.map(([x]) => x)), xsB = new Set(b.calls.map(([x]) => x));
  assert.deepEqual([...xsB].sort((p, q) => p - q), [...xsA].map((x) => 10 + (27 * 2) - (x - 10)).sort((p, q) => p - q));
});

test('drawHeroCrop paints only inside the crop', () => {
  const c = fakeCtx(); drawHeroCrop(c, PRESETS.masc, HEAD_CROP, 2);
  assert.ok(c.calls.length > 0);
  assert.ok(c.calls.every(([x, y]) => x < HEAD_CROP.w * 2 && y < HEAD_CROP.h * 2));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/hero.test.js`
Expected: FAIL — cannot find module `js/engine/hero.js`.

- [ ] **Step 3: Implement `hero-parts.js` (data) and `hero.js` (port)**

Port `tools/hero_gen.py` function by function: `ramp` (use `Math.floor(channel * k)`, clamp 255), `rect`, `ellipse` (same inequality on doubles), the `Canvas` class with `fill/shade/outline/px`, the body/leg/hood/torso/arm/neck/head/hair/beard/glasses/item stamps in the same order, `WALK` offsets applied identically. `composeHero` returns the RGBA buffer; `drawHero` iterates pixels and `fillRect`s with `rgb(r,g,b)` strings; flip maps `x → 27 - x`.

- [ ] **Step 4: Run to verify pass**

Run: `node --test tests/hero.test.js`
Expected: all fixtures match (the per-fixture message names the first differing pixel when one doesn't — fix the port, never the fixture).

- [ ] **Step 5: Commit**

```bash
git add js/engine/hero-parts.js js/engine/hero.js tests/hero.test.js
git commit -m "feat(hero): JS renderer, pixel-exact against the Python reference"
```

---

### Task 5: Walk math

**Files:**
- Create: `js/engine/walk.js`
- Test: `tests/walk.test.js`

**Interfaces:**
- Produces: `planWalk(fromX, toX, { speed = 60 } = {}) → { fromX, toX, dir: 1|-1, duration }` (`speed` in logical px/s; `duration` in ms, `0` when `fromX === toX`); `stepWalk(plan, elapsedMs) → { x, pose, done, flip }` where `pose` cycles `walk1..walk4` at **10 fps** (100 ms per frame), `x` rounds to an integer, `flip = dir < 0`, and when `done` the pose is `idle` and `x === toX`. `WALK_FPS = 10`.
- Consumed by Task 11.

- [ ] **Step 1: Write the failing tests**

```js
// tests/walk.test.js
import test from 'node:test'; import assert from 'node:assert/strict';
import { planWalk, stepWalk } from '../js/engine/walk.js';

test('duration from distance and speed', () => { assert.equal(planWalk(0, 120).duration, 2000); assert.equal(planWalk(50, 50).duration, 0); });
test('direction and flip', () => { assert.equal(planWalk(100, 20).dir, -1); assert.equal(stepWalk(planWalk(100, 20), 10).flip, true); });
test('pose cycles at 10 fps and x interpolates', () => {
  const p = planWalk(0, 60); // 1000 ms
  assert.equal(stepWalk(p, 0).pose, 'walk1'); assert.equal(stepWalk(p, 150).pose, 'walk2'); assert.equal(stepWalk(p, 350).pose, 'walk4'); assert.equal(stepWalk(p, 450).pose, 'walk1');
  assert.equal(stepWalk(p, 500).x, 30);
});
test('done at the end, idle, exact target', () => {
  const s = stepWalk(planWalk(0, 60), 1000); assert.equal(s.done, true); assert.equal(s.pose, 'idle'); assert.equal(s.x, 60);
  assert.equal(stepWalk(planWalk(0, 60), 5000).x, 60);
});
```

- [ ] **Step 2: Run to verify failure** — `node --test tests/walk.test.js` → FAIL, module not found.
- [ ] **Step 3: Implement `js/engine/walk.js`.**
- [ ] **Step 4: Run to verify pass** — `node --test tests/walk.test.js` → 4 passed.
- [ ] **Step 5: Commit** — `git add js/engine/walk.js tests/walk.test.js && git commit -m "feat(walk): walk planning and 10fps stepping"`

---

### Task 6: Creator state (pure)

**Files:**
- Create: `js/creator-state.js`
- Test: `tests/creator-state.test.js`

**Interfaces:**
- Produces: `defaultHero() → PRESETS.masc + { name: '' }`; `applyPreset(hero, body) → hero` (whole preset replaces appearance, keeps `name`); `pick(hero, key, value) → hero` — rejects unknown key/value (returns the same object); picking `hair` also sets `beardCol` to the same value **iff** `beardCol === previous hair`; `randomHero(rng = Math.random) → hero` (every key from its option list, `beardCol = hair`, `name` kept empty); `sanitizeHero(any) → hero` (unknown or missing keys → defaults from `defaultHero()`, invalid values per key → default for that key, `name` through `cleanName`); `cleanName(s) → string` — strips control chars (`\p{C}`), trims, clamps to **16** code points, trims again, never throws on non-strings (non-string → `''`); `displayName(hero) → hero.name || 'the Engineer'`; `FACE_ROWS = ['body','skin','hair','length','style','beard','beardCol']`, `KIT_ROWS = ['hoodie','jeans','glasses','hold']`; `LABELS` (row key → sheet label, e.g. `beardCol: 'Beard col.'`, `hold: 'Holding'`).
- Consumes: `OPTIONS`, `PRESETS` from `js/engine/hero-parts.js`.
- Consumed by Task 9.

- [ ] **Step 1: Write the failing tests**

```js
// tests/creator-state.test.js
import test from 'node:test'; import assert from 'node:assert/strict';
import { defaultHero, applyPreset, pick, randomHero, sanitizeHero, cleanName, displayName, FACE_ROWS, KIT_ROWS } from '../js/creator-state.js';
import { OPTIONS, PRESETS } from '../js/engine/hero-parts.js';

test('default is the masc preset with an empty name', () => assert.deepEqual(defaultHero(), { ...PRESETS.masc, name: '' }));
test('preset replaces appearance, keeps the name', () => {
  const h = applyPreset({ ...defaultHero(), name: 'Ada' }, 'fem'); assert.equal(h.hoodie, PRESETS.fem.hoodie); assert.equal(h.name, 'Ada');
});
test('pick validates key and value', () => {
  const h = defaultHero(); assert.equal(pick(h, 'hoodie', 'plaid'), h); assert.equal(pick(h, 'cape', 'red'), h); assert.equal(pick(h, 'hoodie', 'lime').hoodie, 'lime');
});
test('beard colour follows hair until changed on its own', () => {
  let h = defaultHero(); h = pick(h, 'hair', 'ginger'); assert.equal(h.beardCol, 'ginger');
  h = pick(h, 'beardCol', 'black'); h = pick(h, 'hair', 'violet'); assert.equal(h.beardCol, 'black');
});
test('random stays inside the option lists, 200 rolls', () => {
  for (let i = 0; i < 200; i++) { const h = randomHero(); for (const [k, vs] of Object.entries(OPTIONS)) assert.ok(vs.includes(h[k]), k); assert.equal(h.beardCol, h.hair); }
});
test('sanitize repairs garbage', () => {
  assert.deepEqual(sanitizeHero(null), defaultHero());
  assert.deepEqual(sanitizeHero('{not json'), defaultHero());
  const h = sanitizeHero({ body: 'robot', hoodie: 'lime', len: 'long', name: 42 });
  assert.equal(h.body, 'masc'); assert.equal(h.hoodie, 'lime'); assert.equal(h.length, defaultHero().length); assert.equal(h.name, '');
});
test('cleanName strips controls, trims, clamps to 16 code points', () => {
  assert.equal(cleanName('  Ada\u0007 Lovelace  '), 'Ada Lovelace');
  assert.equal([...cleanName('🐝'.repeat(40))].length, 16);
  assert.equal(cleanName(undefined), ''); assert.equal(cleanName({}), '');
});
test('displayName falls back', () => { assert.equal(displayName(defaultHero()), 'the Engineer'); assert.equal(displayName({ ...defaultHero(), name: 'Ada' }), 'Ada'); });
test('rows cover every option exactly once', () => assert.deepEqual([...FACE_ROWS, ...KIT_ROWS].sort(), Object.keys(OPTIONS).sort()));
```

- [ ] **Step 2: Run to verify failure** — `node --test tests/creator-state.test.js` → FAIL, module not found.
- [ ] **Step 3: Implement `js/creator-state.js`** (pure functions; `sanitizeHero` accepts an object or a JSON string).
- [ ] **Step 4: Run to verify pass** — `node --test tests/creator-state.test.js` → 9 passed.
- [ ] **Step 5: Commit** — `git add js/creator-state.js tests/creator-state.test.js && git commit -m "feat(creator): pure creator state — presets, pick, random, sanitize, name"`

---

### Task 7: Fonts and shell CSS

**Files:**
- Modify: `css/game.css` (rewrite)
- Create: `tests/fonts.test.js`
- Modify: `README.md` — credits line for GloryQuest (CC BY-SA 3.0, "the12thdoctor", FontStruct link) and VT323 (OFL)

**Interfaces:**
- Produces CSS the screens rely on: `:root` vars `--scene-w/--scene-h/--col-w` (set by JS), colours from Global Constraints; layout: `#statusbar` (20 px, `#D8D8D8`, VT323 20 px, `display:flex; justify-content:space-between`), `#stage` grid `[col] [scene] [col]` using the vars, `#scene` canvas `width: var(--scene-w); height: var(--scene-h); image-rendering: pixelated`, `#col-l`/`#col-r` flex columns bottom-aligned with `padding-bottom: 18px` and `env(safe-area-inset-left/right)` padding, `#overlay` absolutely over the scene for DOM screens, `#rotate` gate shown by `@media (orientation: portrait) and (max-width: 700px)` **except** when `body[data-screen="CLAIM"]` or `body[data-screen="COMPLETE"]`; `.btn-sierra` (white, `2px solid #111`, `box-shadow: 3px 3px 0 #555`, GloryQuest 18 px, min 100×52); sheet classes `.sheet`, `.sheet-row`, `.sheet-label`, `.opt`, `.opt.on`, `.sw`, `.frame`, `.jewel`, `.tab`, `.tab.on` with the exact colours above; `@font-face` for VT323 (existing woff2) and GloryQuest (`assets/fonts/gloryquest/gloryquest.otf`); `@media (prefers-reduced-motion: reduce)` disables transitions.
- Consumed by Tasks 8–11.

- [ ] **Step 1: Write the failing test**

```js
// tests/fonts.test.js
import test from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const css = readFileSync('css/game.css', 'utf8');
test('only VT323 and GloryQuest are declared', () => {
  const faces = [...css.matchAll(/@font-face\s*{[^}]*font-family:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(faces)].sort(), ['GloryQuest', 'VT323']);
  assert.ok(!/Silkscreen|Pixelify/.test(css));
});
test('font files and licences ship together', () => {
  for (const f of ['assets/fonts/vt323-latin-400-normal.woff2', 'assets/fonts/LICENSE-vt323.txt', 'assets/fonts/gloryquest/gloryquest.otf', 'assets/fonts/gloryquest/license.txt', 'assets/fonts/gloryquest/readme.txt']) assert.ok(existsSync(f), f);
});
test('no read text below 18px and the sheet colours are the spec colours', () => {
  for (const m of css.matchAll(/font-size:\s*(\d+)px/g)) assert.ok(Number(m[1]) >= 16, `font-size ${m[1]}px`);
  for (const c of ['#3C3CB4', '#E04040', '#8C3A1C', '#4A1E0C', '#C8723A', '#4CAF50', '#3A4660', '#D8D8D8']) assert.ok(css.toUpperCase().includes(c), c);
});
test('rotate gate is CSS-driven and exempts the form screens', () => {
  assert.match(css, /@media\s*\(orientation:\s*portrait\)/);
  assert.match(css, /data-screen="CLAIM"/); assert.match(css, /data-screen="COMPLETE"/);
});
test('README credits GloryQuest', () => assert.match(readFileSync('README.md', 'utf8'), /GloryQuest.*the12thdoctor/s));
```

(16 px is the floor for GloryQuest sheet labels per spec; VT323 read text is set at 20/24 px.)

- [ ] **Step 2: Run to verify failure** — `node --test tests/fonts.test.js` → FAIL (old CSS declares Silkscreen/Pixelify; README lacks credit).
- [ ] **Step 3: Rewrite `css/game.css`** per the interface; add the README credit.
- [ ] **Step 4: Run to verify pass** — `node --test tests/fonts.test.js` → 5 passed; `npm test` all green.
- [ ] **Step 5: Commit** — `git add css/game.css tests/fonts.test.js README.md && git commit -m "feat(shell): landscape SCI shell CSS; VT323 + GloryQuest only"`

---

### Task 8: Shell HTML, state machine, rotate gate, title screen

**Files:**
- Modify: `index.html` (rewrite), `js/game.js` (rewrite)
- Create: `js/screens/title.js`, `tests/e2e/shell.test.js`

**Interfaces:**
- Produces: `index.html` with `#statusbar` (`#sb-title` "Observability Quest", `#sb-score` "Score: 0 of 300"), `#stage` → `#col-l`, `#scene-box` (contains `<canvas id="scene" width="320" height="200">` and `#overlay`), `#col-r`; `#rotate` gate (`aria-live="polite"`, copy "Turn your phone sideways to play"); `<body data-screen="LOADING">`. `js/game.js`: `const screens = { TITLE, CREATOR, PREVIEW }`, each `{ enter(ctx), exit() }`; `go(name)` calls `exit` then `enter`, sets `body[data-screen]`, guards re-entry within **350 ms** (`ADVANCE_GUARD_MS`); shared `ctx = { canvas, ctx2d, overlay, colL, colR, hero (config), reducedMotion, setScore(n) }`; resize → `fitStage` + `applyStage` + `canvas` CSS size; `window.__oq = { ready, state, hero, go, fit, paused }`; portrait watcher sets `__oq.paused = true` and the rAF loop skips updates while paused. `title.js`: draws a placeholder title card on the canvas (black, "OBSERVABILITY QUEST" in GloryQuest honey via DOM over the canvas) and a `.btn-sierra#btn-start` in `#col-r`; START → `go('CREATOR')`.
- Consumes: Tasks 3, 7.

- [ ] **Step 1: Write the failing e2e tests**

```js
// tests/e2e/shell.test.js
import test, { before, after } from 'node:test'; import assert from 'node:assert/strict';
import { chromium } from 'playwright'; import { startServer } from './_server.js';
let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });
export async function open(width, height, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, ...opts });
  const page = await ctx.newPage(); page.on('pageerror', (e) => { throw e; });
  await page.goto(server.baseURL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true, null, { timeout: 15000 });
  return { ctx, page };
}
const box = (page, sel) => page.locator(sel).boundingBox();

for (const [w, h] of [[844, 390], [667, 375], [932, 430]]) {
  test(`${w}x${h}: scene is 16:10 under the bar, columns >= 56, no overflow`, async () => {
    const { ctx, page } = await open(w, h);
    const sb = await box(page, '#statusbar'), sc = await box(page, '#scene'), cl = await box(page, '#col-l');
    assert.equal(Math.round(sb.height), 20);
    assert.ok(Math.abs(sc.width / sc.height - 1.6) < 0.02);
    assert.ok(sc.y >= 20 && sc.y + sc.height <= h + 1);
    assert.ok(cl.width >= 56);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    assert.equal(await page.evaluate(() => document.body.dataset.screen), 'TITLE');
    await ctx.close();
  });
}
test('portrait shows the rotate gate and pauses; landscape hides it', async () => {
  const { ctx, page } = await open(390, 844);
  assert.equal(await page.locator('#rotate').isVisible(), true);
  assert.equal(await page.evaluate(() => window.__oq.paused), true);
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(100);
  assert.equal(await page.locator('#rotate').isVisible(), false);
  assert.equal(await page.evaluate(() => window.__oq.paused), false);
  await ctx.close();
});
test('desktop never sees the gate and START reaches the creator once per tap', async () => {
  const { ctx, page } = await open(1280, 800, { isMobile: false, hasTouch: false });
  assert.equal(await page.locator('#rotate').isVisible(), false);
  const b = await box(page, '#btn-start'); assert.ok(b.width >= 44 && b.height >= 44);
  await page.click('#btn-start'); await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  assert.equal(await page.evaluate(() => window.__oq.transitions), 1);
  await ctx.close();
});
```

(`__oq.transitions` counts `go()` calls that actually switched screens *after* the initial LOADING→TITLE, so one START tap → 1.)

- [ ] **Step 2: Run to verify failure** — `node --test tests/e2e/shell.test.js` → FAIL (old shell; `#statusbar` missing).
- [ ] **Step 3: Rewrite `index.html`, `js/game.js`; create `js/screens/title.js`** (CREATOR and PREVIEW registered as placeholder screens that only set `data-screen` until Tasks 9 and 11 fill them).
- [ ] **Step 4: Run to verify pass** — `node --test tests/e2e/shell.test.js` → 5 passed.
- [ ] **Step 5: Commit** — `git add index.html js/game.js js/screens/title.js tests/e2e/shell.test.js && git commit -m "feat(shell): landscape stage, rotate gate, state machine, placeholder title"`

---

### Task 9: Character creation screen

**Files:**
- Create: `js/screens/creator.js`, `tests/e2e/creator.test.js`
- Modify: `js/game.js` (register the real CREATOR screen)

**Interfaces:**
- Produces: `creator.js` exporting `{ enter(ctx), exit() }`. `enter` builds, inside `#overlay`, the sheet per the spec's *Sheet language*: `.sheet` white panel with black bands; top row — `label "Name :"` + `<button id="name-btn">` showing the name or "optional"; tabs `<button class="tab" data-page="face|kit">`; `.frame` with the jewels and a `<canvas id="hero-view" width="28" height="72">` CSS-scaled to 112×288 (`drawHero` at scale 1, pixelated); `.sheet-row` per key of the current page: `.sheet-label` + `.opt` buttons (`data-key`, `data-value`, `aria-pressed`), swatches for `skin/hair/beardCol/hoodie/jeans`, body row as three 70-px text buttons (Masc/Fem/Enby), thumbnails for `length/style/beard/glasses` (`drawHeroCrop(HEAD_CROP, 2)` → 40×42) and `hold` (`HAND_CROP`, 2 → 24×40); hint text `.hint`. `#col-l` gets `#btn-random`, `#col-r` gets `#btn-start-game` ("Start"). Name: `#name-btn` opens `#name-sheet` (a full-overlay panel: label, `<input maxlength="24" autocomplete="off" enterkeyhint="done">`, "Done" button) — on Done, `cleanName` → state, panel closes. State changes re-render only the affected row's `aria-pressed` and the hero canvas. Start → `sessionStorage.setItem('oq.hero', JSON.stringify(hero))` in try/catch → `ctx.hero = hero` → `go('PREVIEW')`. On `enter`, state = `sanitizeHero(sessionStorage.getItem('oq.hero'))`. `__oq.creator = { hero, page }` for tests.
- Consumes: Tasks 4, 6, 7, 8.

- [ ] **Step 1: Write the failing e2e tests**

```js
// tests/e2e/creator.test.js
import test, { before, after } from 'node:test'; import assert from 'node:assert/strict';
import { chromium } from 'playwright'; import { startServer } from './_server.js';
let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });
async function openCreator(opts = {}, init = null) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, ...opts });
  const page = await ctx.newPage(); page.on('pageerror', (e) => { throw e; });
  if (init) await page.addInitScript(init);
  await page.goto(server.baseURL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true);
  await page.click('#btn-start'); await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  return { ctx, page };
}
const hero = (page) => page.evaluate(() => window.__oq.creator.hero);

test('sheet: 7 FACE rows, 4 KIT rows, every option 44px+, hero drawn', async () => {
  const { ctx, page } = await openCreator();
  assert.equal(await page.locator('.sheet-row').count(), 7);
  const boxes = await page.locator('.opt').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => [r.width, r.height]));
  assert.ok(boxes.every(([w, h]) => w >= 44 && h >= 44));
  assert.ok(boxes.length <= 5 * 7 + 3);
  await page.click('.tab[data-page="kit"]'); assert.equal(await page.locator('.sheet-row').count(), 4);
  const painted = await page.evaluate(() => { const c = document.querySelector('#hero-view'); const d = c.getContext('2d').getImageData(0, 0, 28, 72).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; });
  assert.ok(painted > 600);
  await ctx.close();
});
test('picking updates state; hair drags beard colour until beard colour is picked', async () => {
  const { ctx, page } = await openCreator();
  await page.click('.opt[data-key="hair"][data-value="ginger"]'); assert.equal((await hero(page)).beardCol, 'ginger');
  await page.click('.opt[data-key="beardCol"][data-value="black"]'); await page.click('.opt[data-key="hair"][data-value="violet"]');
  const h = await hero(page); assert.equal(h.hair, 'violet'); assert.equal(h.beardCol, 'black');
  assert.equal(await page.locator('.opt[data-key="hair"][data-value="violet"]').getAttribute('aria-pressed'), 'true');
  await ctx.close();
});
test('preset buttons replace appearance; RANDOM changes something', async () => {
  const { ctx, page } = await openCreator();
  await page.click('.opt[data-key="body"][data-value="fem"]'); assert.equal((await hero(page)).hoodie, 'honey');
  const before = JSON.stringify(await hero(page)); let changed = false;
  for (let i = 0; i < 5 && !changed; i++) { await page.click('#btn-random'); changed = JSON.stringify(await hero(page)) !== before; }
  assert.ok(changed);
  await ctx.close();
});
test('name sheet cleans input and shows on the button', async () => {
  const { ctx, page } = await openCreator();
  await page.click('#name-btn'); await page.fill('#name-sheet input', '  Ada\u0007 Lovelace of the Night Shift  '); await page.click('#name-sheet button');
  assert.equal((await hero(page)).name, 'Ada Lovelace of');
  assert.equal(await page.locator('#name-btn').innerText(), 'Ada Lovelace of');
  await ctx.close();
});
test('START persists and goes to PREVIEW; reload keeps the hero', async () => {
  const { ctx, page } = await openCreator();
  await page.click('.tab[data-page="kit"]'); await page.click('.opt[data-key="hoodie"][data-value="lime"]');
  await page.click('#btn-start-game'); await page.waitForFunction(() => document.body.dataset.screen === 'PREVIEW');
  assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('oq.hero')).hoodie), 'lime');
  await page.reload({ waitUntil: 'load' }); await page.waitForFunction(() => window.__oq?.ready === true);
  await page.click('#btn-start'); await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  assert.equal((await hero(page)).hoodie, 'lime');
  await ctx.close();
});
test('storage throwing does not break the creator or START', async () => {
  const { ctx, page } = await openCreator({}, () => { Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('denied'); } }); });
  await page.click('.opt[data-key="skin"][data-value="4"]'); assert.equal((await hero(page)).skin, 4);
  await page.click('#btn-start-game'); await page.waitForFunction(() => document.body.dataset.screen === 'PREVIEW');
  await ctx.close();
});
test('corrupt stored hero is sanitised', async () => {
  const { ctx, page } = await openCreator({}, () => { sessionStorage.setItem('oq.hero', '{"body":"robot","hoodie":"lime","name":42'); });
  const h = await hero(page); assert.equal(h.body, 'masc'); assert.equal(h.name, '');
  await ctx.close();
});
```

(Note the `skin` data-value is a string in the DOM; `pick` must coerce numeric option keys — `skin` — with `Number()` before validating.)

- [ ] **Step 2: Run to verify failure** — `node --test tests/e2e/creator.test.js` → FAIL (no `.sheet-row`).
- [ ] **Step 3: Implement `js/screens/creator.js`; register in `js/game.js`.**
- [ ] **Step 4: Run to verify pass** — `node --test tests/e2e/creator.test.js` → 7 passed; `npm test` green.
- [ ] **Step 5: Commit** — `git add js/screens/creator.js js/game.js tests/e2e/creator.test.js && git commit -m "feat(creator): QFG-style character sheet with live hero, random, name, persistence"`

---

### Task 10: Preview room — the hero walks

**Files:**
- Create: `js/screens/preview.js`, `tests/e2e/walk-preview.test.js`
- Modify: `js/game.js` (register PREVIEW; rAF loop calls `screen.tick(dt)` when present and not paused)

**Interfaces:**
- Produces: `preview.js` `{ enter(ctx), exit(), tick(dtMs) }`. `enter` paints a placeholder room on the 320×200 canvas (wall `#4A5A78` rows 0–111, floor `#6B5A48` rows 112–199, a dark window rect and a desk rect — flat fills, no art) and the hero standing with feet on **floor line y = 180** (`drawHero(ctx2d, hero, pose, x, 180 - 72, 1, { flip })`), starting `x = 146`. Tap on the scene box → logical tap x = `floor((clientX - rect.left) / scale)`; the hero's left edge target is `clamp(tapX - 14, 0, 292)` (sprite centred under the tap) → `planWalk(curX, targetX)`; under `ctx.reducedMotion` the hero is placed at the target immediately with pose `idle`. `tick` advances with `stepWalk`, redraws room + hero. `#col-r` gets `#btn-redo` ("Sheet") → `go('CREATOR')`. `__oq.preview = { x, pose, walking }`.
- Consumes: Tasks 4, 5, 8, 9.

- [ ] **Step 1: Write the failing e2e tests**

```js
// tests/e2e/walk-preview.test.js
import test, { before, after } from 'node:test'; import assert from 'node:assert/strict';
import { chromium } from 'playwright'; import { startServer } from './_server.js';
let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });
async function openPreview(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, ...opts });
  const page = await ctx.newPage(); page.on('pageerror', (e) => { throw e; });
  await page.goto(server.baseURL, { waitUntil: 'load' }); await page.waitForFunction(() => window.__oq?.ready === true);
  await page.click('#btn-start'); await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  await page.click('#btn-start-game'); await page.waitForFunction(() => document.body.dataset.screen === 'PREVIEW');
  return { ctx, page };
}
const pv = (page) => page.evaluate(() => window.__oq.preview);

test('tap right: hero walks right over time, lands at the tap, ends idle', async () => {
  const { ctx, page } = await openPreview();
  const sc = await page.locator('#scene').boundingBox(); const x0 = (await pv(page)).x;
  await page.mouse.click(sc.x + sc.width * 0.85, sc.y + sc.height * 0.9);
  await page.waitForTimeout(150); const mid = await pv(page);
  assert.ok(mid.walking && mid.x > x0 && /^walk[1-4]$/.test(mid.pose));
  await page.waitForFunction(() => window.__oq.preview.walking === false, null, { timeout: 6000 });
  const end = await pv(page); assert.equal(end.pose, 'idle'); assert.ok(Math.abs(end.x - (Math.floor(0.85 * 320) - 14)) <= 1, `x=${end.x}`);
  await ctx.close();
});
test('tap left flips the sprite', async () => {
  const { ctx, page } = await openPreview();
  const sc = await page.locator('#scene').boundingBox();
  await page.mouse.click(sc.x + sc.width * 0.1, sc.y + sc.height * 0.9); await page.waitForTimeout(120);
  assert.equal((await pv(page)).flip, true);
  await ctx.close();
});
test('reduced motion teleports', async () => {
  const { ctx, page } = await openPreview({ reducedMotion: 'reduce' });
  const sc = await page.locator('#scene').boundingBox();
  await page.mouse.click(sc.x + sc.width * 0.85, sc.y + sc.height * 0.9); await page.waitForTimeout(50);
  const p = await pv(page); assert.equal(p.walking, false); assert.equal(p.pose, 'idle'); assert.ok(p.x > 200);
  await ctx.close();
});
test('rotating to portrait mid-walk pauses; rotating back resumes from the same x', async () => {
  const { ctx, page } = await openPreview();
  const sc = await page.locator('#scene').boundingBox();
  await page.mouse.click(sc.x + sc.width * 0.9, sc.y + sc.height * 0.9); await page.waitForTimeout(120);
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(50);
  const a = (await pv(page)).x; await page.waitForTimeout(300); const b = (await pv(page)).x;
  assert.equal(a, b);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForFunction(() => window.__oq.preview.walking === false, null, { timeout: 6000 });
  await ctx.close();
});
test('Sheet button returns to the creator with the same hero', async () => {
  const { ctx, page } = await openPreview();
  await page.click('#btn-redo'); await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  assert.equal((await page.evaluate(() => window.__oq.creator.hero)).body, 'masc');
  await ctx.close();
});
```

- [ ] **Step 2: Run to verify failure** — `node --test tests/e2e/walk-preview.test.js` → FAIL (`__oq.preview` undefined).
- [ ] **Step 3: Implement `js/screens/preview.js`; add the rAF `tick` loop and pause behaviour in `js/game.js`.** Walk time is based on `performance.now()` deltas accumulated only while not paused, so a pause freezes the plan's elapsed time.
- [ ] **Step 4: Run to verify pass** — `node --test tests/e2e/walk-preview.test.js` → 5 passed.
- [ ] **Step 5: Commit** — `git add js/screens/preview.js js/game.js tests/e2e/walk-preview.test.js && git commit -m "feat(preview): placeholder room; tap-to-walk with 10fps cycle, flip, reduced motion, pause"`

---

### Task 11: Weight guard and docs

**Files:**
- Create: `tests/e2e/weight.test.js`
- Modify: `docs/backlog.md` (append the sub-project-1 deferrals), `README.md` (how to run v2 locally and on a phone: `npm run serve`, same Wi-Fi, landscape)

**Interfaces:**
- Produces: a test that totals the bytes of `index.html`, `css/game.css`, every `js/**/*.js` reachable from `index.html` (walk `import` statements), and the two font files, asserting ≤ 600 KB; and that `window.__oq.ready` is true with the network restricted to those files (Playwright `route` aborting everything else).

- [ ] **Step 1: Write the failing test** (`weight.test.js` as described; expected byte list printed on failure).
- [ ] **Step 2: Run** — `node --test tests/e2e/weight.test.js` → FAIL only if the budget or the isolation is broken; if it passes immediately, add a deliberate `assert.ok(total < 1)` locally to watch it fail, then restore (the test must be seen to fail once).
- [ ] **Step 3: Fix anything the test reveals; write the docs.**
- [ ] **Step 4: Run everything** — `npm test && npm run e2e && python3 -m pytest tools/tests -q` → all green.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "test(weight): sub-project 1 ships under 600KB; docs for running v2"`

---

## Self-review notes

- Spec coverage for this sub-project: landscape + gate (T7, T8), 320×200 scaling (T3, T8), fonts and legibility (T7), hero sprite 28×72 procedural with golden match (T2, T4), walk cycle 10 fps and flip (T5, T10), character creation — presets, ≤5 pickers, random, two pages, name, thumbnails as crops, persistence (T6, T9), reduced motion (T10), weight (T11). Deferred to later sub-projects: icon bar, message windows, status-bar score ticking, rooms/hotspots, type/sit-up/turn poses, audio, title art, intro.
- Names are consistent: `composeHero/drawHero/drawHeroCrop/HEAD_CROP/HAND_CROP` (T4 → T9), `planWalk/stepWalk` (T5 → T10), `fitStage/applyStage` (T3 → T8), `sanitizeHero/pick/randomHero/applyPreset/cleanName` (T6 → T9), `go()/__oq` (T8 → T9/T10).
- Review Focus items each have a pinned test: rotation mid-walk (T10), storage throwing (T9), corrupt `oq.hero` (T6, T9), extreme viewports (T3, T8), hostile name (T6, T9).
