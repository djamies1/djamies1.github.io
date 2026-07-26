# Why Low Earth Orbit — Geometry &amp; Latency Blueprint — Handoff

Scroll-driven, blueprint-style primer on **why satellite internet moved to low orbit**: how
altitude sets latency (LEO ~20–40 ms vs GEO ~500–700 ms) and coverage footprint, why a
small fast-moving cell needs a constellation, and where LEO lands on a latency scale. The
most broadly-reusable, lowest-risk sheet in the set — same cyanotype engine and embed
contract. Content is **generic public/textbook physics**; Amazon Leo appears only as "a LEO
system at ~590 km".

## What makes this one different

It is a **physics/geometry explainer**, not tied to any one operator — an Earth surface with
an altitude ladder (LEO / MEO / GEO), latency labels, coverage cones, and a latency scale.
The camera zooms between facets. No `--laser` amber (nothing optical) — strictly cyanotype +
cyan. Because it is generic, it doubles as an intro/opener for the whole set (it goes deeper
than the Constellation sheet's LEO-vs-GEO moment).

## Files

- `index.html` — the SVG. `#sheet` never transforms; `#world` holds the diagram. Hand-authored:
  the Earth surface + ground station (`#earth`), the altitude ladder (`#ladder`), the three
  orbits + satellites (`#orbits` → `#orb-geo/#orb-meo/#orb-leo`), and the scene overlays
  (`#alt-labels`, `#latency`, `#foot`, `#motion`). Empty groups `#many-sats` (the LEO fleet)
  and `#scale` (the log latency scale) are filled at boot by `drawing.js`.
- `js/data.js` — single source of truth: `GEOM` + `ORBITS` (the three regimes with drawn y
  and public figures), `CAM` presets, `SCENES`, `SCROLL_VH`, `PANELS`, and the
  `SPEC_TABLE`/`COMPONENT_NOTES`/`PROVENANCE` appendix.
- `js/drawing.js` — boot-time generation: sheet zones, the log latency scale (1–1000 ms with
  fibre/LEO/MEO/GEO markers and the ~100 ms threshold), and the LEO fleet row.
- `js/timeline.js` — one master GSAP timeline + one ScrollTrigger; camera is a raw `matrix()`
  on `#world`. The intro draws Earth + ladder + satellites, then a shared `sceneZoom()` helper
  zooms to each facet. The recap fades the busiest elements for a clean ladder. Config global:
  `window.LAT_BP_CONFIG`.
- `js/ui.js` — **byte-identical to the family** (do not fork). `js/main.js` — identical except
  the `LAT_BP_CONFIG` name. `styles.css` — shared system; only reveal + mobile-hide lists
  differ. `embed.html` — throwaway dashboard mock.

## Embed contract (same as the family)

Player `index.html?mode=player&autoplay=1&loop=1`; scroll `index.html` (viewport-height iframe).
Params `mode`, `autoplay`, `loop`, `speed`. Override via `window.LAT_BP_CONFIG = { … }`.

## Compliance

Generic public physics — the lowest-risk sheet. The persistent chip
(`PUBLIC PHYSICS · GENERIC · NTS`), the title-block notes, the `PROVENANCE` string and the
`PUBLIC DATA ONLY` / `PUBLIC PHYSICS · NO INTERNAL DATA` stamp stay on the sheet. Altitudes,
latencies and coverage are generic public knowledge; Amazon Leo appears only as a LEO system
at ~590 km. Not derived from any Amazon internal document or export-controlled (ITAR/EAR) data.
Schematic (NTS): true altitudes span 590 km to 35,786 km (~60×), so heights are compressed and
labelled.

## Public figures on the sheet

LEO ~590 km / ~20–40 ms / ~90–120 min · MEO ~8,000 km / ~120–150 ms · GEO 35,786 km /
~500–700 ms / 24 h fixed / ~⅓ of Earth · city fibre ~5 ms · ~100 ms = where delay starts to
feel real.

## Reduced motion

`buildStaticPoster()` renders the full diagram (ladder + all overlays + fleet + scale) with no
pin / scrub.
