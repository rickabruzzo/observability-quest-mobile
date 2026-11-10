# SDD ledger — plan: docs/superpowers/plans/2026-11-09-observability-quest-mobile.md
Spec: docs/superpowers/specs/2026-11-09-observability-quest-mobile-design.md (read)
Branch: feat/mobile-port from main@94051f7. Repo is fresh (no prior code).
Pre-flight (shared interfaces):
- T2→T3: text.test imports SCENARIOS[3].intro[0] — T2 produces intro:[string,string] with ROLE\nCOMPANY\n\n header. OK.
- T2→T4: game consumes SCENARIOS/VERDICTS/CHARITY/HOW_TO_PLAY; choiceA/choiceB {title,sub}; narrator {name,title,portrait}. OK.
- T3→T4: parseIntro/introLead/wrap/paginate/isCTA. wrap takes measure(str)→px; game must supply canvas measureText. OK.
- T4→T5: audio wiring exposes __oq.audio.running — T5 Produces createAudio() has no `running`; Ruling: add `running` getter (true after playLoop) to createAudio. cost if wrong: trivial.
- T4→T8: screen.drawStill(name) replaced by layer.still(name)/show(). OK.
- T7→T8/T9: assets/anim/<name>.png + .json {x,y,w,h}; sprites.load reads both. OK.
- T8→T9: sceneModule {assets, draw(ctx, frame, state)}; timeline/flash helpers in T9. OK.
- T6→T10: getEventCode feeds HubSpot hidden field; versioned asset paths via tools/stamp.mjs. OK.
Ruling: fresh repo — initial commit on main holds docs only; all code on feat/mobile-port. cost if wrong: none.
Task 1: complete (commits 94051f7..1a3b69f, tests: npm test → # duration_ms 56.447619)
Task 2: complete (commits 1a3b69f..bf38da8, tests: npm test → # duration_ms 119.463645)
Task 3: complete (commits bf38da8..fdad744, tests: npm test → # duration_ms 149.843752)
Task 4: Ruling: fonts chosen by measurement (Pixelify Sans 700 20px body, Silkscreen small) since Rick is away; VT323 and Press Start 2P bundled so he can swap via CSS tokens — cost if wrong: one CSS token change.
Task 4: complete (commits fdad744..246c0c1, tests: sh -c 'npm test && node --test --test-concurrency=1 tests/e2e/flow.test.js' → # duration_ms 20391.069356)
Task 5: complete (commits 246c0c1..826838d, tests: sh -c 'npm test && node --test --test-concurrency=1 tests/e2e/audio.test.js' → # duration_ms 1426.425566)
Task 6: Ruling: completion screen persists via localStorage['oq.complete'] (score) so a reload after finishing lands back on COMPLETE; PLAY AGAIN clears it but keeps oq.redeemed — cost if wrong: a cleared-storage edge case only.
Task 6: complete (commits 826838d..37f1991, tests: sh -c 'npm test && node --test --test-concurrency=1 tests/e2e/claim.test.js' → # duration_ms 15289.850394)
Task 7: Ruling: the approved stills are not hard-palette images (S4 has ~48k distinct shades), so "snap to the plate's palette" is implemented as snapping to the colors present in the plate within 24px of the patch (local_palette), not a global top-N palette — cost if wrong: patches look slightly posterised vs. surroundings; none seen.
Task 7: Ruling: S4 "!!" sprite excludes the left sparkle (which sits on the INFRA panel) — it stays static; the "!!" and right sparkle bounce. Plate filled from measured panel geometry (bevel ends x=531, interior strip y 261–279) rather than inpainting, which smeared the edge — cost if wrong: a few px of panel edge wrong; verified by zoom.
Task 7: Ruling: silver/copper coins derived by luminance-mapping the gold coin's shading onto 5-stop ramps (lum_remap), not HSV recolor — HSV collapsed the detail. cost if wrong: coin tint taste; Rick can adjust ramps.
Task 7: minor: Graham's talk frames carry the model's slight skin-tone shift inside the mouth patch; visible as a lighter blob at 2x. Acceptable; re-generation or tighter crop if Rick objects.
Task 7: complete (commits 37f1991..7cabfe4, tests: python3 -m pytest tools/tests -q → 11 passed in 0.08s)
Task 8: Ruling: no full-frame clean plates shipped; scenes draw still + small 'blank' patches + sprites (s4_bang_blank, s5_coin_blank_i, s3_product_blank; PAY2 cleared by a black rect in code). Saves ~1.1MB; reduced-motion shows the exact approved still. cost if wrong: none visible.
Task 8: complete (commits 7cabfe4..8acefbb, tests: sh -c 'npm test && node --test --test-concurrency=1 tests/e2e/preview.test.js' → # duration_ms 9449.631816)
Task 9: Ruling: S2 service-box rects estimated from the art (handoff gave only route endpoints); red flash is a translucent tint + border so a few px of error is invisible — cost if wrong: none visible.
Task 9: Ruling: S3 'loading' state shows the right panel black with a "loading..." label while the bar fills (the still's WARNING content only makes sense once stalled); SOLD panel adds "Page load 0.9 sec" — copy Rick may want to change. cost if wrong: one string.
Task 9: Ruling: title logo is now drawn by the title scene module (drawStatic + pulse), replacing screen.drawTitle; reduced-motion gets still + static logo.
Task 9: complete (commits 8acefbb..9864e5e, tests: sh -c 'npm test && node --test --test-concurrency=1 tests/e2e/preview.test.js' → # duration_ms 11455.634721)
Task 10: Ruling: "interactive < 2s" is met by a two-phase preload — title art + fonts first (title visible, music/mute live), then the 11 other stills behind a disabled START showing LOADING n%. The spec's "no network after Start" holds for stills; scene sprite patches load with their scene per the spec's animation section, and a failed sprite load degrades to the still. cost if wrong: a ~1s wait at START on slow wifi.
Task 10: Ruling: all PNGs losslessly recompressed with oxipng (pixel-identical, verified against git HEAD); full-run transfer 2.72 MB.
Task 10: note: tests/stamp.test.js was written together with tools/stamp.mjs and passed first run — TDD lapse on a 10-line tool; test still guards the behaviour.
Task 10: Ruling: no vercel.json — Vercel's static defaults (revalidate on each load) plus stamped index.html references are sufficient; asset filenames don't change between deploys except via content, and a stale cached asset is harmless.
Task 10: complete (commits 9864e5e..b796a99, tests: sh -c 'npm test && python3 -m pytest tools/tests -q && node --test --test-concurrency=1 tests/e2e/reduced-motion.test.js tests/e2e/budget.test.js' → # duration_ms 26919.487971)
Final review: fresh reviewer (opus) on 94051f7..9952887. Verdict: with fixes. Fix pass (one, commit c7ade86), each RED→GREEN; suites after: unit 38/38, tools 14/14, e2e 30/30.
Final: fixed #1 resize soft-lock on CHOICE/CLAIM/COMPLETE — review-fixes 'resize on CHOICE…' + 'resize on CLAIM…' RED→GREEN
Final: fixed #2 ellipsis pushing a line past the box — text.test 'ellipsis never pushes…' + e2e 'no line is wider than the box at 360x640' RED→GREEN (paginate now takes measure/maxWidth; reflow + fitPages)
Final: fixed #3 double-tap skipping a one-page outcome — e2e 'double-tap…' RED→GREEN (350ms advance guard; NEXT stays a no-op until it swaps)
Final: fixed #4 completion/claim clipped on short viewports — e2e 'short viewport (375x548)…' RED→GREEN (box scrolls on CLAIM/COMPLETE; panels centre only when room; scrollTop reset on content change)
Final: fixed #5 landscape unusable — e2e 'landscape (844x390)…' RED→GREEN (stage width derived from viewport height, min box ~200px)
Final: fixed #6 malformed ?e= breaks boot — claim.test + e2e RED→GREEN (try/catch around decodeURIComponent)
Final: fixed #7 HubSpot: ready timeout → fallback (claim.test RED→GREEN); fallback keeps the email field and shows it on COMPLETE for staff (spec's version, e2e RED→GREEN); 'no redirect' documented at the HUBSPOT slot; hidden fields dispatch input/change; LOADING FORM… placeholder.
Final: fixed #8 opaque rectangular portrait patches — tools test_changed_alpha + test_build_outputs RED→GREEN (alpha = changed pixels, median-filtered, dilated 2; stale outputs removed on failure; S3 palette now includes the new product's quantised colours)
Final: fixed #9 START awaited AudioContext.resume — unlock no longer awaited; visibilitychange suspends/resumes the context (verified by audio e2e still green; iOS behaviour itself not testable here)
Final: fixed (re-graded Important) phase-2 preload used Promise.all — now allSettled, and showScene re-fetches a missing still before showing (covered by existing flows; no dedicated test — cost if wrong: a black scene art area)
Final: Ruling: reviewer's 'Declined to judge' list — prize fraud via cleared storage (spec design, stands); placeholder captures no email (by design until HubSpot); iOS mute switch silences audio (platform; audioSession override is Rick's call); redeemed flag survives PLAY AGAIN (spec); sprites load after START (ruled Task 10); unversioned module imports (ruled Task 10); real-device behaviour and Lighthouse not run (Rick's phone test) — all stand.
Final: minor (deferred): black art area after reloading onto COMPLETE until phase-2 loads (portrait_charity not in title assets)
Final: minor (deferred): layer.still() does not bump the show() token; a slow pending show could animate over COMPLETE
Final: minor (deferred): image-rendering: crisp-edges listed after pixelated (should be first)
Final: minor (deferred): S5 coin/PAY2 sprites sit on odd x/width (off the 2px grid by 1px)
Final: minor (deferred): aria-live on the typewriter box floods screen readers; announce on done instead
Final: minor (deferred): user-scalable=no blocks pinch zoom (accessibility)
Final: minor (deferred): reduced-motion e2e checks title + S1 only, not every scene
Final: minor (deferred): caret can extend ~10px past a full-width line while typing
Final: minor (deferred): Graham's talk frames carry the model's lighter jaw (needs regeneration or hand-pixelling)
Final: minor (deferred): christine_talk1 ≈ still, so her flap is effectively two-frame
