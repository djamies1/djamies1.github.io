# Amazon Leo — Constellation Deployment Blueprint — Handoff

Scroll-driven, blueprint-style walkthrough of **how the Amazon Leo fleet gets built**: a
burn-up chart of cumulative satellites against time, the FCC use-it-or-lose-it deadlines,
the multi-provider launch manifest (the largest commercial launch procurement in history),
the cadence ramp, the required-vs-actual gap (extension requested), and the Kirkland
production feeder. A finance/ops-flavoured sibling of the set — same cyanotype engine and
embed contract. Content is 100% public launch / FCC record; **figures approximate, as of
Jul 2026.**

## What makes this one different

It is a **data chart** (a burn-up), not an object or a network. The camera zooms around one
chart, revealing the manifest, the required and actual curves, and the shortfall. There is
**no `--laser` amber** here — nothing optical — so the sheet is strictly cyanotype + cyan.

## Files

- `index.html` — the SVG. `#sheet` never transforms; `#world` holds the chart. Hand-authored
  pieces: the chart skeleton (`#chart` — axes + FCC gate horizontals + deadline verticals),
  the required/actual burn-up curves (`#curve-req`, `#curve-act`), the shortfall bracket
  (`#gap`), and the scene labels (`#lbl-*`). Empty groups `#axis-ticks` and `#manifest` are
  filled at boot by `drawing.js`.
- `js/data.js` — single source of truth: `CHART` (plot box + axis spans) with `XY()`/`YS()`
  maps, `MANIFEST` (the five launch vehicles + counts), `CAM` presets, `SCENES`, `SCROLL_VH`,
  `PANELS`, and the `SPEC_TABLE` / `COMPONENT_NOTES` / `PROVENANCE` appendix.
- `js/drawing.js` — boot-time generation: sheet zones, chart axis ticks (years + satellite
  counts), and the launch-manifest legend from `MANIFEST`.
- `js/timeline.js` — one master GSAP timeline + one ScrollTrigger. Camera is a raw `matrix()`
  on `#world`; the intro draws the chart skeleton, then scenes zoom around it. Config global:
  `window.DEP_BP_CONFIG`.
- `js/ui.js` — **byte-identical to the family** (do not fork). `js/main.js` — identical except
  the `DEP_BP_CONFIG` global name. `styles.css` — shared system; only the reveal + mobile-hide
  lists differ. `embed.html` — throwaway dashboard mock.

## Embed contract (same as the family)

Player: `index.html?mode=player&autoplay=1&loop=1` (fixed iframe). Scroll: `index.html`
(viewport-height iframe). Params `mode`, `autoplay`, `loop`, `speed`. Override via
`window.DEP_BP_CONFIG = { … }`.

## Compliance (the defining requirement of the set)

Everything is public launch / FCC record. The persistent chip
(`PUBLIC SOURCES · FCC / LAUNCH RECORD · NTS`), the title-block general notes, the
`PROVENANCE` string, and the `PUBLIC DATA ONLY` / `PUBLIC LAUNCH RECORD · NO INTERNAL DATA`
finale stamp must stay on the sheet. The burn-up is schematic (NTS); **launch counts,
cadence, FCC deadlines and status are public, and the "actual" figure is from public
trackers and is approximate.** The `~$10B+` capital figure is from public reports. Not
derived from any Amazon internal document or export-controlled (ITAR/EAR) data. Because
figures move fast, the sheet is dated "as of Jul 2026".

## Public figures on the sheet (approx, Jul 2026)

Fleet 3,236 · FCC 50% (1,618) by Jul 2026, 100% by 2029 (extension requested) · ~83+ launches
across 5 families (Vulcan 38 · Ariane 6 18 · New Glenn 12–27 · Falcon 9 13+ · Atlas V 9) ·
Apr 2026: 3 launches/26 days; target 20+/yr → 30+/yr · actual ~300 (public trackers) ·
Kirkland up to 5 sats/day (~1,000/yr) · ~$10B+ committed.

## Reduced motion

`buildStaticPoster()` renders the full chart (skeleton + curves + manifest + labels) with no
pin / scrub.
