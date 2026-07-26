# Amazon Leo — Economics (Public Estimates) Blueprint — Handoff

Scroll-driven, blueprint-style walkthrough of the **rough economics of a LEO broadband
network**: heavy upfront capex (satellites, launch, terminals) repaid over years by
recurring revenue and AWS pull-through — the classic infrastructure J-curve. A money-flow
sheet, sibling of the set — same cyanotype engine and embed contract.

## ⚠ Compliance — the defining requirement, doubly so here

This is the **economics** sheet, so it is the highest-care sheet in the set. **Every figure
is a public analyst estimate, a press report, or a public Amazon statement (retrieved Jul
2026). None is an Amazon internal figure, and none must be reconciled with, corrected by, or
replaced with an internal number.** The sheet is **illustrative and order-of-magnitude only.**

The compliance chrome is load-bearing — never remove any of it:
- persistent chip `PUBLIC ESTIMATES · NOT AMAZON FIGURES`;
- the on-sheet **disclaimer band** (`ILLUSTRATIVE — PUBLIC ANALYST & PRESS ESTIMATES ONLY · NOT AMAZON FIGURES`) that raises in scene 1 and stays up the whole time;
- the title-block general notes;
- the `PUBLIC DATA ONLY` / `PUBLIC ESTIMATES · NOT AMAZON FIGURES` finale stamp;
- the `PROVENANCE` string.

Built on a machine with no access to internal documentation. Not derived from any Amazon
internal document or export-controlled (ITAR/EAR) data. Figures move fast; dated "as of Jul
2026". Vet with the business before shipping anywhere internal.

## What makes this one different

It is a **money flow** read left→right (capital in → build → the fleet → service → revenue →
market) with a terminal razor-and-blades unit and an illustrative spend/earn J-curve. No
`--laser` amber — strictly cyanotype + cyan.

## Files

- `index.html` — the SVG. `#sheet` never transforms; `#world` holds the flow. Hand-authored:
  the spine + asset node (`#spine`), the disclaimer band (`#disclaimer`), and the flow boxes
  (`#capex`, `#build`, `#unit`, `#service`, `#revenue`, `#market`, `#jcurve`). `#zones` is
  filled at boot by `drawing.js`.
- `js/data.js` — single source of truth: `CAM` presets, `SCENES`, `SCROLL_VH`, `PANELS`, and
  the `SPEC_TABLE`/`COMPONENT_NOTES`/`PROVENANCE` appendix. The compliance banner at the top of
  the file is mandatory reading before any edit.
- `js/drawing.js` — minimal: just the sheet-edge zones (the flow is unique, hand-authored).
- `js/timeline.js` — one master GSAP timeline + one ScrollTrigger; camera is a raw `matrix()`
  on `#world`. The intro draws the spine; scene 1 raises the disclaimer (which then stays up);
  a shared `sceneZoom()` pans to each box; the recap adds the J-curve. Config global:
  `window.ECON_BP_CONFIG`.
- `js/ui.js` — **byte-identical to the family** (do not fork). `js/main.js` — identical except
  the `ECON_BP_CONFIG` name. `styles.css` — shared system; only reveal + mobile-hide lists
  differ. `embed.html` — throwaway dashboard mock.

## Embed contract (same as the family)

Player `index.html?mode=player&autoplay=1&loop=1`; scroll `index.html` (viewport-height iframe).
Params `mode`, `autoplay`, `loop`, `speed`. Override via `window.ECON_BP_CONFIG = { … }`.

## Public figures on the sheet (illustrative estimates, Jul 2026)

Capital >$10B committed (+~$1B 2026) · ~1,000 sats/yr (Kirkland) · ~83 launches · terminals
sub-$400 → sub-$200 · consumer ~$50–100/mo target · TAM ~$61B by 2030 · Leo revenue ~$20B/yr
by 2030 (reports) · share aim 25–35% · Starlink ~$11.4B 2025 (context). All public estimates,
none internal.

## Reduced motion

`buildStaticPoster()` renders the full money flow (disclaimer + all boxes + J-curve) with no
pin / scrub.
