# Observability Quest Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, single-page mobile web port of the Observability Quest badge game with animated scenes, original chiptune audio, a placeholder prize-claim form, and a staff-redeemable completion screen.

**Architecture:** Plain ES modules loaded by one `index.html`, no bundler. Pure logic (copy data, text pagination, animation timelines, audio sequence) lives in dependency-free modules tested with `node --test`; DOM and canvas code lives in `game.js` and `js/anim/` and is tested end-to-end with Playwright. Art is drawn on a 640×428 canvas (2px logical grid) scaled to the phone with `image-rendering: pixelated`; animation sprites and clean plates are produced at build time by Python tools from the Gemini edits.

**Tech Stack:** HTML/CSS/ES2022 modules; Web Audio API; Canvas 2D; Node 22 (`node --test`) for unit tests; Playwright (pre-installed in the workspace) for e2e; Python 3 + Pillow + NumPy + OpenCV for asset tooling, `pytest` for tool tests. Vercel static hosting.

**Spec:** `docs/superpowers/specs/2026-11-09-observability-quest-mobile-design.md` (plus `docs/animation-handoff.md` for animation coordinates and picks).

## Global Constraints

- No build step, no framework, no bundler. `index.html` + `css/` + `js/` + `assets/` deploy as-is.
- Only external script: HubSpot `//js.hsforms.net/forms/embed/v2.js`, loaded on the claim screen only. Fonts self-hosted, OFL-licensed.
- Palette (exact): Slate `#25303E`, Cobalt `#0278CD`, Pacific `#0298EC`, Lime `#64BA00`, Honey `#FFB000`, Tango `#F96E10`, Indigo `#51368D`, Denim `#01487B`. Text-box border Tango; names/highlights Honey; titles Pacific; start/play-again prompts Lime; body text `#DCF0FF` (badge `220,240,255`).
- Art renders on a 640×428 canvas; all overlay drawing snaps to the 2px grid; `image-rendering: pixelated`.
- Copy is transcribed verbatim from `source/badge/__init__.py` except: Emily → `SR VP OPERATIONS`; Matt → `PRESIDENT, GO-TO-MARKET`; scenario 4 narrator → `JESSITRON` / `ENG MANAGER OF DEVELOPER RELATIONS` with `portrait_jessitron.png`.
- Layout target 390×844, flex 360–430 wide; respect `env(safe-area-inset-*)`.
- Once loaded, no network until the form. All assets preloaded on the title screen.
- Total page weight ≤ 3 MB; title screen interactive < 2 s on throttled 4G.
- `prefers-reduced-motion: reduce` → stills only, no fades, typewriter instant.
- Composited animation frames are palette-snapped to the plate's colors (frames are JPEG).
- Commit after every task. Commit messages end with the attribution lines from the session.

## Review Focus

1. A copy page whose text is longer than the box at 360 wide must paginate, never clip or overflow — Task 3 tests the paginator at the narrowest width with the longest real page (S4 intro 0).
2. Tapping NEXT repeatedly during a typewriter reveal must first complete the page, then advance once — never skip a page — Task 4 e2e asserts page count seen equals pages produced.
3. Reloading the completion screen after REDEEMED must stay redeemed; reloading mid-game must return to the title (no half state) — Task 6 e2e covers both.
4. The HubSpot script failing to load (offline) must still let the player reach the completion screen — Task 6 unit-tests the fallback path with an injected loader that rejects.
5. An attendee with reduced-motion enabled must see every scene as a still and the game must still be playable end to end — Task 10 e2e runs the full flow with `reducedMotion: 'reduce'`.

---

### Task 1: Repository scaffold and asset import

**Files:**
- Create: `package.json`, `README.md`, `.gitignore` (copy from working folder), `tests/.gitkeep`, `tools/requirements.txt`
- Create: `assets/` populated — 11 scene/portrait PNGs at 640×428 from `scratch/exports/`, `portrait_jessitron.png` = `scratch/exports/jessitron/portrait_jessitron_640_1.png` (FPO), `hc_logo_white.png`, `hc_logomark.png` from `source/badge/assets/`
- Create: `source/badge/__init__.py` (copy, reference only)
- Create: `docs/animation-handoff.md` (copy from working folder)

**Interfaces:**
- Produces: `npm test` runs `node --test tests/`; `npm run e2e` runs `node --test tests/e2e/`; `npm run serve` serves the root on :8080 (`python3 -m http.server 8080`).

- [ ] **Step 1: Write the asset-presence test**

```js
// tests/assets.test.js
import test from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
const NAMES = ['title_screen','s1_llm','s2_microservices','s3_ecommerce','s4_spaghetti','s5_payments',
  'portrait_christine','portrait_emily','portrait_graham','portrait_jessitron','portrait_matt','portrait_charity'];
function pngSize(p){ const b=readFileSync(p); assert.equal(b.toString('latin1',1,4),'PNG',p); return [b.readUInt32BE(16), b.readUInt32BE(20)]; }
test('all game images are 640x428 PNG', () => { for (const n of NAMES) assert.deepEqual(pngSize(`assets/${n}.png`), [640,428], n); });
test('total assets under 3MB', () => { let t=0; for (const n of NAMES) t+=statSync(`assets/${n}.png`).size; assert.ok(t < 3*1024*1024, `${t} bytes`); });
```

- [ ] **Step 2: Run, expect FAIL (files missing)** — `npm test` → ENOENT.
- [ ] **Step 3: Create `package.json`** (`"type":"module"`, scripts above, no dependencies) and copy assets into place per Files. `git init`, first commit of scaffold.
- [ ] **Step 4: Run `npm test`, expect PASS.**
- [ ] **Step 5: Commit** — `chore: scaffold repo and import 640x428 assets`

### Task 2: Scenario data

**Files:**
- Create: `js/scenarios.js`
- Test: `tests/scenarios.test.js`

**Interfaces:**
- Produces: `export const SCENARIOS` — array of 5 `{ id:'s1_llm', image:'s1_llm', intro:[string,string], narrator:{ name, title, portrait }, choiceA:{ title, sub }, choiceB:{ title, sub }, winText, loseText }`. `export const VERDICTS` — `{0..5: string}` Charity body text only (no header lines). `export const CHARITY = { name:'CHARITY MAJORS', title:'CTO & CO-FOUNDER', portrait:'portrait_charity' }`. `export const HOW_TO_PLAY` string.

- [ ] **Step 1: Write tests**

```js
test('five scenarios, two intro pages each, CTA last', () => {
  assert.equal(SCENARIOS.length, 5);
  for (const s of SCENARIOS) {
    assert.equal(s.intro.length, 2);
    const last = s.intro[1].trim().split('\n').pop();
    assert.ok(last === last.toUpperCase() && last.endsWith('?'), `${s.id}: ${last}`);
    assert.match(s.intro[0], /^[A-Z &]+\n[A-Z ]+\n\n/);   // ROLE\nCOMPANY\n\n
  }
});
test('roster updates', () => {
  assert.deepEqual(SCENARIOS[1].narrator, { name:'EMILY NAKASHIMA', title:'SR VP OPERATIONS', portrait:'portrait_emily' });
  assert.deepEqual(SCENARIOS[3].narrator, { name:'JESSITRON', title:'ENG MANAGER OF DEVELOPER RELATIONS', portrait:'portrait_jessitron' });
  assert.deepEqual(SCENARIOS[4].narrator, { name:'MATT NELSON', title:'PRESIDENT, GO-TO-MARKET', portrait:'portrait_matt' });
});
test('verdicts 0..5 and copy spot-checks', () => {
  assert.deepEqual(Object.keys(VERDICTS).map(Number).sort(), [0,1,2,3,4,5]);
  assert.ok(VERDICTS[5].startsWith('Perfect score.'));
  assert.ok(SCENARIOS[0].loseText.endsWith('The incident is now your personality.'));
  assert.equal(SCENARIOS[2].choiceB.sub, 'Avg load: 2.1s. Looks fine.');
});
```

- [ ] **Step 2: Run, expect FAIL** (module missing).
- [ ] **Step 3: Implement `js/scenarios.js`** — transcribe from `source/badge/__init__.py` `SCENARIOS` and the verdict dict; split `choice_a`/`choice_b` on `\n` into `{title, sub}`; apply the three roster changes; mark Jessitron `// PLACEHOLDER portrait: variant 1 FPO until Jess picks`. `HOW_TO_PLAY` = the spec's draft copy.
- [ ] **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit** — `feat: port scenario copy and roster`

### Task 3: Text engine — wrap, paginate, intro header

**Files:**
- Create: `js/text.js`
- Test: `tests/text.test.js`

**Interfaces:**
- Produces:
  - `parseIntro(text) → { header: {role, company} | null, body }` — header present when lines 0,1 non-empty and line 2 empty.
  - `introLead(role, company) → string` — `"You are a {Role} at {Company}. "` with badge smart-casing (`of a an the and or but in on at to for nor by` lower; ≤3-char all-caps words kept).
  - `wrap(text, maxWidth, measure) → string[]` — `measure(str)→number`; `\n` hard breaks; empty line for blank paragraph.
  - `paginate(lines, { lineHeight, blankHeight, boxHeight, firstPageTop }) → string[][]` — CTA line (ALL CAPS, ends `?`) always alone on its own page; mid-sentence page break adds `...` to the end of the last line and start of the next page's first line; trailing blanks trimmed.
  - `isCTA(line) → boolean`.

- [ ] **Step 1: Write tests** (measure stub = `s => s.length * 8`)

```js
test('parseIntro splits header', () => {
  const r = parseIntro('LEAD ENGINEER\nCUSTOMER SERVICE PLATFORM\n\nBody.');
  assert.deepEqual(r.header, { role:'LEAD ENGINEER', company:'CUSTOMER SERVICE PLATFORM' }); assert.equal(r.body, 'Body.');
  assert.equal(parseIntro('No header here.').header, null);
});
test('introLead smart casing', () => {
  assert.equal(introLead('DIRECTOR OF PLATFORM ENGINEERING','MUSIC INSTRUMENT BRAND'), 'You are a Director of Platform Engineering at Music Instrument Brand. ');
  assert.equal(introLead('CTO','FINTECH COMPANY'), 'You are a CTO at Fintech Company. ');
});
test('wrap respects width and hard breaks', () => {
  assert.deepEqual(wrap('aaa bbb ccc\n\nddd', 8*7, s=>s.length*8), ['aaa bbb','ccc','','ddd']);
});
test('CTA isolated on its own page', () => {
  const pages = paginate(['one','two','HOW DO YOU INVESTIGATE?'], { lineHeight:13, blankHeight:6, boxHeight:60, firstPageTop:0 });
  assert.deepEqual(pages.at(-1), ['HOW DO YOU INVESTIGATE?']); assert.equal(pages.length, 2);
});
test('ellipsis on mid-sentence break only', () => {
  const p = paginate(['Your team just','wired twelve'], { lineHeight:13, blankHeight:6, boxHeight:13, firstPageTop:0 });
  assert.deepEqual(p, [['Your team just...'], ['...wired twelve']]);
  const q = paginate(['Done.','Next thing'], { lineHeight:13, blankHeight:6, boxHeight:13, firstPageTop:0 });
  assert.deepEqual(q, [['Done.'], ['Next thing']]);
});
test('longest real page fits at narrowest width', async () => {
  const { SCENARIOS } = await import('../js/scenarios.js');
  const { header, body } = parseIntro(SCENARIOS[3].intro[0]);
  const lines = wrap(introLead(header.role, header.company) + body, 328, s => s.length * 9); // 360 wide, 16px inset, ~9px/char
  const pages = paginate(lines, { lineHeight:22, blankHeight:10, boxHeight:150, firstPageTop:0 });
  for (const pg of pages) assert.ok(pg.filter(l=>l!=='').length * 22 + pg.filter(l=>l==='').length * 10 <= 150);
});
```

- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement `js/text.js`** per Interfaces (port the badge `start_text` logic; no DOM access).
- [ ] **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit** — `feat: text wrap and pagination engine`

### Task 4: Game shell — screens, canvas art, typewriter, controls

**Files:**
- Create: `index.html`, `css/game.css`, `js/game.js`, `js/screen.js` (canvas + text box DOM helpers), `assets/fonts/` (two OFL pixel fonts + `LICENSE` files)
- Test: `tests/e2e/flow.test.js`, `tests/e2e/_server.js` (starts `http.server` on a free port, exports `baseURL`)

**Interfaces:**
- Consumes: `SCENARIOS`, `VERDICTS`, `CHARITY`, `HOW_TO_PLAY`; `text.js` functions.
- Produces: `window.__oq` debug handle `{ state, page, pages, score, scenario, go(stateName) }` for e2e. State names: `TITLE, HOWTO, INTRO, CHOICE, WIN, LOSE, FINAL, CLAIM, COMPLETE`. DOM ids: `#art` (canvas 640×428), `#textbox`, `#controls`, buttons `#btn-start, #btn-begin, #btn-back, #btn-next, #opt-a, #opt-b, #btn-continue, #btn-claim`. `data-screen` attribute on `<body>` = current state. Art drawing goes through `drawStill(name)` in `screen.js`, which Task 8 replaces with the animation layer.
- Fonts: choose body + small from {Pixelify Sans, VT323, Silkscreen, Press Start 2P}; body sized so ≥ 32 chars fit at 360 wide. Record the choice in README.

- [ ] **Step 1: Write e2e test** (Playwright, chromium, iPhone 14 viewport 390×844 and widths 360/430)

```js
test('full flow, all-Honeycomb run, at 390', async () => { /* click #btn-start, #btn-begin; for each scenario: click #btn-next until data-screen=CHOICE, click #opt-a, click #btn-next until #btn-continue visible, click; assert data-screen=FINAL, __oq.score===5, verdict text contains 'Perfect score.' */ });
test('pages never clip at 360/390/430', async () => { /* at each width, traverse every INTRO/WIN page via __oq.go + __oq.pages; assert #textbox .line elements count === current page lines and textbox.scrollHeight <= clientHeight */ });
test('NEXT during typewriter completes page, does not skip', async () => { /* at INTRO page 0, click #btn-next immediately 3×; assert __oq.page === 1 (not 2+) */ });
test('BACK from first intro page is disabled; BACK from page 1 returns to 0', ...);
test('mixed run scores 3 and shows the right verdict', ...);
```

- [ ] **Step 2: Run, expect FAIL** (no index.html).
- [ ] **Step 3: Implement** `index.html` (viewport meta, `<canvas id="art">`, textbox, controls, module script), `css/game.css` (palette tokens, safe-area padding, pixelated canvas, Tango 2px text box, 48px min tap targets, Lime blinking START at 900ms), `js/screen.js` (`drawStill(name)`, `setBoxLines(lines, {header})`, `typewrite(lines, msPerChar=25) → {done, finishNow()}`, `setControls(...)`), `js/game.js` (state machine mirroring the badge `update()`; INTRO uses `parseIntro`+`introLead`; CHOICE taps select immediately (`navigator.vibrate?.(15)`, Honey double-flash on the chosen option before transition); WIN/LOSE show narrator header; FINAL counts the score up 0→N in the control bar; FINAL shows Charity + verdict; `#btn-claim` → CLAIM state stubbed to Task 6; `__oq` handle; preload all 12 images + logos before enabling START).
- [ ] **Step 4: Run e2e, expect PASS**; take screenshots of each screen to `scratch/shots/` (gitignored) and eyeball against `source/badge-screenshots/`.
- [ ] **Step 5: Commit** — `feat: playable game shell with canvas art and typewriter`

### Task 5: Audio — synth, UI blips, original title loop

**Files:**
- Create: `js/audio.js`, `js/audio/title-loop.js`, `tools/render-loop.mjs`
- Test: `tests/audio.test.js`

**Interfaces:**
- Produces: `js/audio/title-loop.js` exports `TEMPO` (bpm), `TRACKS` — `{ lead:[[midi|0, beats],...], bass:[...], arp:[...], drums:[['k'|'s'|'h', beats],...] }`; `loopBeats` total. `js/audio.js` exports `createAudio() → { unlock(), playLoop(), stopLoop(), setVolume(v), muted, toggleMute(), blip(name) }` with `name ∈ {advance, select, win, lose, fanfare}`; synth = pulse-wave lead (25% duty), triangle bass, square arp, noise drums; muted state in `sessionStorage['oq.muted']`. `tools/render-loop.mjs` renders the loop to 16-bit WAV at 44.1k using the same note data (pure JS, no AudioContext).

- [ ] **Step 1: Write tests**

```js
test('loop length 30–45 s and tracks aligned', () => {
  const secs = loopBeats * 60 / TEMPO; assert.ok(secs >= 30 && secs <= 45, secs);
  for (const t of Object.values(TRACKS)) assert.equal(t.reduce((a,[,b])=>a+b,0), loopBeats);
});
test('lead stays in a sane range and is not a single repeated phrase', () => {
  const notes = TRACKS.lead.filter(([n])=>n>0).map(([n])=>n);
  assert.ok(Math.min(...notes) >= 55 && Math.max(...notes) <= 91);
  assert.ok(new Set(notes.slice(0,16).join()+'|').size > 1 && TRACKS.lead.length >= 48);
});
test('render-loop writes a WAV of the right length', async () => { /* run tools/render-loop.mjs to scratch/title-loop-preview.wav; parse header; duration within ±0.1 s of loopBeats*60/TEMPO */ });
```

- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Compose `title-loop.js`** — original, Sierra-adventure idiom: 4-bar brass-style fanfare intro, then an 8-bar A theme and 8-bar B theme over an arpeggiated I–vi–IV–V bass in a major key, ~120 bpm, pulse lead; must not quote any existing melody. Implement `audio.js` and `render-loop.mjs`.
- [ ] **Step 4: Run, expect PASS.** Copy `scratch/title-loop-preview.wav` to Rick's folder `scratch/` for listening.
- [ ] **Step 5: Wire into game**: `unlock()` + `playLoop()` on START; loop continues at 0.4 volume after HOWTO (constant `LOOP_IN_GAME = true`); blips on advance/select/win/lose/fanfare; mute toggle button `#btn-mute` on every screen. e2e: after START, `__oq.audio.running === true`.
- [ ] **Step 6: Commit** — `feat: original chiptune loop, UI blips, mute`

### Task 6: Claim form (placeholder + HubSpot slot) and completion screen

**Files:**
- Create: `js/claim.js`
- Modify: `js/game.js` (CLAIM, COMPLETE states), `index.html`, `css/game.css`
- Test: `tests/claim.test.js`, `tests/e2e/claim.test.js`

**Interfaces:**
- Produces: `js/claim.js` exports `HUBSPOT = { portalId:'', formId:'', region:'na1' }` (empty = placeholder mode), `mountClaimForm(container, { onSubmitted, loadScript = defaultLoader }) → Promise<'hubspot'|'placeholder'|'fallback'>`, `isValidEmail(s)`, `getEventCode(search) → string` (reads `?e=`), `redeemed = { get(), set() }` on `localStorage['oq.redeemed']`. DOM: `#claim-email`, `#btn-claim-submit`, `#complete`, `#btn-redeem`, `#btn-play-again`.

- [ ] **Step 1: Unit tests**

```js
test('placeholder mode when no HUBSPOT ids', async () => { assert.equal(await mountClaimForm(fakeContainer(), {onSubmitted(){}}), 'placeholder'); });
test('fallback when script loader rejects', async () => { HUBSPOT.portalId='1'; HUBSPOT.formId='x'; const r = await mountClaimForm(fakeContainer(), {onSubmitted(){}, loadScript: () => Promise.reject(new Error('offline'))}); assert.equal(r,'fallback'); });
test('isValidEmail', () => { assert.ok(isValidEmail('a@b.co')); assert.ok(!isValidEmail('nope')); });
test('getEventCode', () => { assert.equal(getEventCode('?e=reinvent26'), 'reinvent26'); assert.equal(getEventCode(''), ''); });
```

- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement** `claim.js`; CLAIM state renders the text box as a form (Honey label "WORK EMAIL", dark field, Lime `CLAIM PRIZE`), placeholder submit → COMPLETE; HubSpot path creates the form into `#hs-form` and restyles via `css/game.css` selectors on `.hs-form`; fallback shows "We'll grab your email at the booth" and a CONTINUE button. COMPLETE: panel `YOU FINISHED OBSERVABILITY QUEST`, `SCORE N/5`, `SHOW THIS SCREEN TO HONEYCOMB BOOTH STAFF`; `#btn-redeem` → `confirm()`-free inline confirm (two taps) → `redeemed.set()`, grey panel, REDEEMED stamp; on COMPLETE entry, if `redeemed.get()` render redeemed; `#btn-play-again` → TITLE with score reset.
- [ ] **Step 4: e2e**: reach CLAIM, submit `a@b.co`, assert COMPLETE and score text; tap redeem twice, reload with `#complete` hash → still redeemed; reload mid-INTRO → TITLE.
- [ ] **Step 5: Commit** — `feat: prize claim placeholder, HubSpot slot, redeemable completion`

### Task 7: Asset tooling — palette snap, region composite, clean plates

**Files:**
- Create: `tools/palette.py`, `tools/composite.py`, `tools/plates.py`, `tools/build_anim.py`, `tools/requirements.txt` (Pillow, numpy, opencv-python-headless, pytest)
- Create (output, committed): `assets/anim/` — `portrait_<name>_blink.png`, `_talk1.png`, `_talk2.png` (cropped region PNGs + `.json` with `{x,y,w,h}`), `s3_product_drums.png`, `s3_product_keys.png`, `s3_product_guitar.png` (+ json), plates `s5_plate.png`, `s4_plate.png`, `s3_plate.png`, `s5_coin_gold.png`
- Test: `tools/tests/test_palette.py`, `tools/tests/test_composite.py`, `tools/tests/test_plates.py`

**Interfaces:**
- Produces: `palette.snap(img: ndarray, palette: ndarray) → ndarray` nearest-color per pixel; `palette.extract(img, max_colors=64) → ndarray`. `composite.align(plate, edit, region, search=6) → (dx, dy)` minimizing MAE inside region; `composite.cut(plate, edit, region, search=6, snap_to=plate) → (patch: ndarray, bbox)` returns the region of `edit` shifted by best offset and palette-snapped to `plate`'s palette. `plates.remove(img, rects, bg=(0,0,0)) → ndarray` fills rects with bg; `plates.inpaint(img, mask) → ndarray` via `cv2.inpaint(..., 3, cv2.INPAINT_TELEA)`. `build_anim.py` runs the whole pipeline from `scratch/` into `assets/anim/` using the coordinates in `docs/animation-handoff.md` (as constants at the top of the file).

- [ ] **Step 1: Write tests** (synthetic 32×32 images)

```python
def test_snap_maps_to_nearest_palette_color(): ...  # pixel (10,10,10) with palette {(0,0,0),(255,255,255)} → (0,0,0)
def test_snap_output_only_contains_palette_colors(): ...
def test_align_recovers_known_shift(): ...  # shift edit by (3,-2), expect align → (3,-2)
def test_cut_returns_region_from_edit_snapped(): ...
def test_remove_fills_rects_black(): ...
def test_inpaint_fills_mask_without_black_hole(): ...
```

- [ ] **Step 2: `pytest tools/tests`, expect FAIL.**
- [ ] **Step 3: Implement** the three modules, then `build_anim.py`: decode JPEG frames, resize to 640×428 NEAREST, for portraits cut eye band (blink) and mouth/jaw (talk) using the face regions located by diffing still vs frame (largest changed blob, dilated 4px, clamped to 2px grid), for S3 cut the left-panel product+price region (`x 24–206, y 92–300`) from `s3_drums_1`, `s3_keys_1`, and the still; plates per spec (S5 without coins and PAY2 box; S4 without "!!"; S3 left panel background from inpaint); `s5_coin_gold.png` cut from the still (USER coin `x70–101, y216–243`) plus silver/copper variants (`palette.recolor` by hue/saturation shift, then snapped to a 4-color ramp).
- [ ] **Step 4: Run `pytest`, then `python3 tools/build_anim.py`**; write `scratch/anim_review.png` contact sheet (plate + each patch pasted back) and inspect it; expect no visible seams and only hard colors.
- [ ] **Step 5: Commit** — `feat: animation asset pipeline and generated frames`

### Task 8: Animation framework and portraits

**Files:**
- Create: `js/anim/layer.js`, `js/anim/clock.js`, `js/anim/sprites.js`, `js/anim/portrait.js`, `anim-preview.html`
- Modify: `js/screen.js` (`drawStill` delegates to layer)
- Test: `tests/anim.test.js`, `tests/e2e/preview.test.js`

**Interfaces:**
- Produces: `clock.quantize(ms, fps) → frameIndex`; `clock.reducedMotion()`. `layer.createLayer(canvas) → { show(sceneModule, opts), stop(), still(name) }` where a scene module is `{ assets: string[], draw(ctx, frame, state) }`; layer runs `requestAnimationFrame`, quantizes to `fps` (default 10), draws plate then `draw()`, draws the still only under reduced motion. `sprites.load(names) → Promise<Map<name,{img,x,y,w,h}>>` reading `assets/anim/<name>.png` + `.json`. `portrait.js` exports `blinkOpen(frame, seed) → boolean` (deterministic: closed for 1 frame every 30–50 frames from seed) and `mouthFrame(frame, typing) → 0|1|2` (0 when not typing; cycles 0,1,2,1 at 10 fps while typing), and `portraitScene(name) → sceneModule`.

- [ ] **Step 1: Tests**

```js
test('quantize', () => { assert.equal(quantize(0,10),0); assert.equal(quantize(99,10),0); assert.equal(quantize(100,10),1); });
test('blink is rare and deterministic', () => { const closed=[...Array(500).keys()].filter(f=>!blinkOpen(f,7)); assert.ok(closed.length>=8 && closed.length<=18); assert.deepEqual(closed, [...Array(500).keys()].filter(f=>!blinkOpen(f,7))); });
test('mouth still when not typing, cycles when typing', () => { assert.equal(mouthFrame(5,false),0); assert.deepEqual([0,1,2,3].map(f=>mouthFrame(f,true)), [0,1,2,1]); });
```

- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement** modules; `anim-preview.html` shows a grid of every scene/portrait canvas with a "typing" toggle and fps readout; `screen.js` uses `layer.still(name)` for scenes until Task 9 provides modules.
- [ ] **Step 4: e2e** `preview.test.js`: load `anim-preview.html`, wait 2 s, assert each canvas changed between two snapshots (non-identical `toDataURL`) except under reduced motion where all are identical.
- [ ] **Step 5: Commit** — `feat: canvas animation layer and portrait blink/talk`

### Task 9: Scene animations

**Files:**
- Create: `js/anim/title.js`, `js/anim/s1.js`, `js/anim/s2.js`, `js/anim/s3.js`, `js/anim/s4.js`, `js/anim/s5.js`, `js/anim/flash.js` (shared path-flash for S1/S4), `js/anim/timeline.js`
- Create: `assets/anim/s1_paths.json`, `assets/anim/s4_paths.json` (copied from `scratch/anim_data/`), `assets/anim/s2_routes.json` (the polylines from the handoff, ×1 in 640 space)
- Test: `tests/anim-scenes.test.js`

**Interfaces:**
- Consumes: layer/sprites from Task 8; coordinates from `docs/animation-handoff.md`.
- Produces: `timeline.at(frame, keyframes) → state` (step keyframes `[[frame, value],...]`, loops at the last frame). `s5.coinTimeline(frame) → { coins: ['silver'|'gold'|'copper'|'spin:n'][5], pay2Wobble: boolean }`; `s3.productTimeline(frame) → { product:'drums'|'keys'|'guitar', barPct: 0..100, rightPanel:'none'|'sold'|'warning' }`; `flash.positions(frame, paths, speed, count) → [{path, index}]`. Each scene module exports `default { assets, draw }`.

- [ ] **Step 1: Tests for the pure timelines**

```js
test('S5: coins go silver→gold left to right, PAY2 copper, BANK gold last', () => {
  assert.deepEqual(coinTimeline(0).coins, ['silver','silver','silver','silver','silver']);
  const t = [...Array(400).keys()].map(coinTimeline);
  const firstGold = i => t.findIndex(s => s.coins[i]==='gold');
  assert.ok(firstGold(0) < firstGold(1) && firstGold(1) < firstGold(2));
  assert.ok(t.some(s => s.coins[3]==='copper')); assert.ok(!t.some(s => s.coins[3]==='gold'));
  assert.ok(firstGold(4) > t.findIndex(s => s.coins[3]==='copper'));
});
test('S3: cycle drums→keys→guitar; guitar stalls at 13 with warning; others reach 100 and SOLD', () => { /* sample one full cycle */ });
test('flash positions advance along path and wrap', ...);
```

- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement** each scene per the handoff table and coordinates (title twinkle/pulse/shimmer; S1 monitor text scroll + glitch + LEDs + character bob + cable flashes; S2 request dots along routes + occasional red flash on one service; S3 product cycle with bar fill and SOLD/WARNING right panel — SOLD drawn in Lime in the pixel font on the black right panel; S4 out-of-sync panel flashes + "!!" bounce + tube flashes; S5 coin pop/spin/land/twinkle, PAY2 wobble, copper, BANK gold after a longer pause). All drawing on the 2px grid.
- [ ] **Step 4: Run tests; open `anim-preview.html` via Playwright and save a 3-second frame strip per scene to `scratch/shots/anim_<scene>.png`; inspect.**
- [ ] **Step 5: Commit** — `feat: animated title and five scenes`

### Task 10: Integration, budget, reduced motion, docs

**Files:**
- Modify: `js/game.js`, `js/screen.js` (scene modules per state; lazy-load a scene's anim assets when its INTRO begins; portraits on WIN/LOSE/FINAL with `typing` tied to the typewriter)
- Create: `README.md` (final), fill `ASSET_PROMPTS.md` frame entries from `scratch/anim_gen/gen.py`, `vercel.json` only if headers are needed
- Test: `tests/e2e/reduced-motion.test.js`, `tests/e2e/budget.test.js`

- [ ] **Step 1: Tests**: full flow with `reducedMotion:'reduce'` passes and each scene canvas is identical across 1 s; full flow normal passes with canvases changing; `budget.test.js` sums transferred bytes via Playwright `response` events for a full run and asserts < 3 MB, and title-screen `domInteractive` < 2000 ms under `page.route` throttling.
- [ ] **Step 2: Run, expect FAIL** (scenes not wired / budget unmeasured).
- [ ] **Step 3: Implement** wiring and lazy loading; versioned asset paths (`?v=<git short sha>` written by a tiny `tools/stamp.mjs` into `index.html`, run before deploy).
- [ ] **Step 4: Run all tests** (`npm test && npm run e2e && pytest tools/tests`), expect PASS. Full screenshot set to `scratch/shots/final/`.
- [ ] **Step 5: Commit** — `feat: integrate scene animations, budget and reduced-motion checks`
- [ ] **Step 6: Sync** the repo tree (excluding `scratch/`, `node_modules/`) into Rick's `Documents/Observability Quest Mobile`, and put the latest `scratch/shots/final/` and `title-loop-preview.wav` into his `scratch/`.
