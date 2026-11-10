# Asset Checklist — Observability Quest Mobile

Export every image from the **Firefly 1K originals** (Gemini 3.1 / Nano Banana 2, 3:2) at
**640 × 428 px, Resample = Nearest Neighbor (preserve hard edges)**, PNG, sRGB, no transparency.
Drop exports into `scratch/exports/` with the exact filename below. Approved files move to `assets/`.

If a 1K original has a slightly different aspect, crop to 3:2 first (center crop unless the
composition says otherwise), then resize.

## Title
- [x] `title_screen.png` — 640×428 — exported 2026-11-09 from 1536×1024 Firefly original → `scratch/exports/`

## Scenes
- [x] `s1_llm.png` — 640×428 — Intercom / LLM server room — exported 2026-11-09 from 1536×1024 Firefly original → `scratch/exports/`
- [x] `s2_microservices.png` — 640×428 — Nubank / cloud + service boxes — exported 2026-11-09 from 1536×1024 Firefly original; "Payments" label typo fixed 2026-11-09 (see ASSET_PROMPTS.md) — **approved by Rick 2026-11-09, in `assets/`**
- [x] `s3_ecommerce.png` — 640×428 — Fender / guitar storefront — exported 2026-11-09 from 1536×1024 Firefly original → `scratch/exports/`
- [x] `s4_spaghetti.png` — 640×428 — Duolingo / 3×3 tool panels — exported 2026-11-09 from 1536×1024 Firefly original → `scratch/exports/`
- [x] `s5_payments.png` — 640×428 — Moov / USER→APP→PAY1→PAY2→BANK — exported 2026-11-09 from 1536×1024 Firefly original → `scratch/exports/`

## Portraits
- [x] `portrait_christine.png` — 640×428 — Christine Yen, CEO & Co-Founder — exported 2026-11-09 as exact 2× nearest-neighbor of the approved 320×214 badge file (the widened 3:2 1K original is not in Firefly; Firefly only has the square original) → `scratch/exports/`
- [x] `portrait_emily.png` — 640×428 — Emily Nakashima, Sr VP Operations — exported 2026-11-09 as exact 2× nearest-neighbor of the approved 320×214 badge file (the widened 3:2 1K original is not in Firefly; Firefly only has the square original) → `scratch/exports/`
- [x] `portrait_graham.png` — 640×428 — Graham Siener, SVP Product — exported 2026-11-09 as exact 2× nearest-neighbor of the approved 320×214 badge file (the widened 3:2 1K original is not in Firefly; Firefly only has the square original) → `scratch/exports/`
- [ ] `portrait_jessitron.png` — 640×428 — **NEW** — Jessitron, Eng Manager of Developer Relations — see ASSET_PROMPTS.md
- [x] `portrait_matt.png` — 640×428 — Matt Nelson, President, Go-To-Market — exported 2026-11-09 as exact 2× nearest-neighbor of the approved 320×214 badge file (the widened 3:2 1K original is not in Firefly; Firefly only has the square original) → `scratch/exports/`
- [x] `portrait_charity.png` — 640×428 — Charity Majors, CTO & Co-Founder — exported 2026-11-09 as exact 2× nearest-neighbor of the approved 320×214 badge file (the widened 3:2 1K original is not in Firefly; Firefly only has the square original) → `scratch/exports/`
- [ ] `portrait_julie.png` — placeholder only; not exported. Removed once Jessitron is approved.

## Logos (already have, no export needed)
- [x] `hc_logo_white.png` — 163×48 (from badge; may be re-exported from brand source at 2× if a crisp version exists)
- [x] `hc_logomark.png` — 48×48

## Also for ASSET_PROMPTS.md
- [ ] Copy the **full** prompt text out of Firefly for each image above (the UI truncates it).
- [ ] Note generation date and whether a reference image was attached.

## Not needed
- The 320×214 badge files (kept in `source/badge/assets/` for reference only).
- Fonts — builder sources freely licensed web fonts.
- Audio — composed in code.
