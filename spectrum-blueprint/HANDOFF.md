# Amazon Leo — Radio Spectrum &amp; Licensing Blueprint — Handoff

Scroll-driven, blueprint-style walkthrough of **how radio spectrum works, which bands
Amazon Leo uses and why, and how satellite spectrum gets licensed**. The fifth sibling
of `rocket-`, `satellite-`, `gateway-` and `terminal-blueprint` — same cyanotype design
language, same engine, same embed contract. Content is 100% public FCC / ITU record.

## What makes this one different

The other four draw a physical object and explode it. Spectrum has no object, so the
"drawing" is a **logarithmic frequency chart** the camera pans across, left (low RF)
to right (microwave → optical). Everything else is the shared engine.

- **One warm accent.** The set is otherwise strictly cyanotype (blue field, white
  line work, cyan `--signal`). This sheet adds exactly one token — `--laser` (amber,
  `styles.css`) — reserved for the optical / laser band, to mark the jump from radio
  to light. Plus a single small **visible-light rainbow** (inline fills, generated in
  `drawing.js buildRainbow`) inside the scene-1 EM reference — the only place any
  ROYGBIV appears, and it is factually the visible slice of the spectrum.
- **No exploded view.** There is no `EXPLODE` / `XLABELS` data. Scene 7 is a licensing
  stack + a full-chart "money shot" instead.

## Files

- `index.html` — the SVG. `#sheet` (grid, frame, title block, notes, stamp) never
  transforms; `#world` (camera target) holds the chart. Empty container groups
  (`#bands`, `#axis-ticks`, `#em-strip`, `#license-boxes`, `#wave-rf` path) are filled
  at boot by `drawing.js`; the unique diagrams (`#rainfade`, `#ka-detail`, `#duplex`,
  `#optical`, `#license`) are hand-authored inline.
- `js/data.js` — single source of truth: `CAM` presets, `SCENES`, `SCROLL_VH`,
  `BANDS` (drives the brackets + spotlight), `LICENSE_STEPS` (drives the stack),
  `PANELS`, and the `SPEC_TABLE` / `COMPONENT_NOTES` / `PROVENANCE` appendix (a11y +
  citations; not rendered in the widget).
- `js/drawing.js` — boot-time generation: log axis ticks (`XF(ghz)` = the shared
  freq→x map, 260 px/decade), band brackets, the chirping wave, the rainbow, the
  license boxes.
- `js/timeline.js` — one master GSAP timeline + one ScrollTrigger. Camera is a raw
  `matrix()` on `#world`. Seven scenes pan/zoom across the chart; `spot()` dims the
  non-focus band brackets. Config global: `window.SPEC_BP_CONFIG`.
- `js/ui.js` — rail, panels, scene HUD, and the transport controls. **Byte-identical
  to the other four** (do not fork).
- `js/main.js` — boot + mode/param handling + transport wiring. Identical to the
  others except the `SPEC_BP_CONFIG` global name.
- `styles.css` — the shared cyanotype system + the one `--laser` token.
- `embed.html` — a throwaway dashboard mock showing the two embed patterns.

## Embed contract (same as the family)

- **Player mode** (fixed size, no scroll): `index.html?mode=player&autoplay=1&loop=1`
  in a fixed-height iframe. This is what the resume site embeds.
- **Scroll mode** (full scrollytelling): `index.html` in a **viewport-height** iframe
  (it pins and scrolls internally — never auto-height).
- Params: `mode`, `autoplay`, `loop`, `speed` (timeScale multiplier, `1` ≈ 100 s).
- `window.SPEC_BP_CONFIG = { … }` overrides params for programmatic embeds.

## Transport (v4, shared)

Restart · Prev · REW · Play · FF · Next, a `1×` speed readout, and a scrubbable
`role="slider"` progress bar (click / drag / keyboard / aria). Prev/Next jump to whole
scenes; the jump is instant because it drives the hoisted `headTween.progress()`
directly, bypassing ScrollTrigger's scrub-smoothing. See `js/timeline.js` `jumpToPercent`.

## Compliance (the defining requirement of the set)

Everything is public FCC / ITU regulatory record. The persistent chip
(`PUBLIC SOURCES · FCC / ITU · NTS`), the title-block general notes, the `PROVENANCE`
string, and the `PUBLIC DATA ONLY` finale stamp must stay on the sheet. The frequency
axis is schematic (NTS). No figure without a public citation. Not derived from any
Amazon internal document or export-controlled (ITAR/EAR) data.

## Reduced motion

`buildStaticPoster()` renders the full annotated chart with no pin / scrub.
