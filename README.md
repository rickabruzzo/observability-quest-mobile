# Observability Quest Mobile

Mobile web port of Honeycomb's *Observability Quest* badge game (Pimoroni Tufty 2350 / BadgeOS).
Scan a QR at the booth, play five customer-story scenarios, claim a prize.

Plain HTML/CSS/JS, no build step. See `docs/superpowers/specs/` for the design and
`docs/superpowers/plans/` for the implementation plan.

## Develop

```
npm test          # unit tests (node --test)
npm run e2e       # Playwright end-to-end tests
npm run serve     # http://localhost:8080
```

Asset tooling (Python): `pip install -r tools/requirements.txt`, then `python3 tools/build_anim.py`.
