# Amazon Leo — Constellation &amp; Optical Mesh Blueprint — Handoff

Scroll-driven, blueprint-style walkthrough of **how thousands of low-orbit Amazon Leo
satellites form a single network**: three altitude shells, ninety-eight orbital planes,
overlapping coverage cells, and a mesh of laser crosslinks. The sixth sibling of
`rocket-`, `satellite-`, `gateway-`, `terminal-` and `spectrum-blueprint` — same cyanotype
design language, same engine, same embed contract. Content is 100% public FCC / Amazon
record.

## What makes this one different

The object blueprints draw one thing and explode it; the spectrum sheet pans a chart. This
one is a **system** view — a wireframe Earth with orbits around it — so the camera **zooms
in place** around a fixed globe-and-orbits diagram (like the object blueprints), rather
than panning. The one warm `--laser` accent (amber) is reserved for the optical
inter-satellite mesh, exactly as in `spectrum-blueprint`.

All curved geometry uses `<circle>` / `<ellipse>` elements and **quadratic Béziers** — no
SVG elliptical-arc (`A`) commands — so there is no sweep-flag to get wrong.

## Files

- `index.html` — the SVG. `#sheet` (grid, frame, title block, notes, stamp) never
  transforms; `#world` (camera target) holds the diagram. The hand-authored pieces are the
  wireframe Earth (`#earth`), the shell table (`#shell-tab`), the scene labels
  (`#lbl-*`), the mesh spec box (`#mesh-note`) and the ground note (`#ground-note`). Empty
  container groups (`#zones`, `#graticule`, `#shells`, `#planes`, `#sats`, `#geo-ring`,
  `#coverage`, `#cluster`, `#mesh`, `#gateways`) are filled at boot by `drawing.js`.
- `js/data.js` — single source of truth: `GEOM` (Earth centre/radius, the three shells,
  the plane cage, the GEO ring radius), `CLUSTER` (the six hero satellites + their OISL
  links + the coverage footprints), `CAM` presets, `SCENES`, `SCROLL_VH`, `PANELS`, and the
  `SPEC_TABLE` / `COMPONENT_NOTES` / `PROVENANCE` appendix (a11y + citations; not rendered
  in the widget).
- `js/drawing.js` — boot-time generation: sheet zones, the graticule, the three shell
  circles, the woven plane cage, the satellite beads, the far GEO ring, the hero cluster,
  the amber OISL mesh, the coverage cone + footprints + hand-off, and the sparse gateways.
- `js/timeline.js` — one master GSAP timeline + one ScrollTrigger. Camera is a raw
  `matrix()` on `#world`. Seven scenes zoom/frame the diagram; the cage and beads dim while
  the coverage / mesh scenes carry the frame. Config global: `window.CON_BP_CONFIG`.
- `js/ui.js` — rail, panels, scene HUD, and the transport controls. **Byte-identical to the
  rest of the family** (do not fork).
- `js/main.js` — boot + mode/param handling + transport wiring. Identical to the others
  except the `CON_BP_CONFIG` global name.
- `styles.css` — the shared cyanotype system + the one `--laser` token. Only the "start
  hidden" reveal list and the mobile margin-hide list differ from the siblings.
- `embed.html` — a throwaway dashboard mock showing the two embed patterns.

## Embed contract (same as the family)

- **Player mode** (fixed size, no scroll): `index.html?mode=player&autoplay=1&loop=1`
  in a fixed-height iframe. This is what the app views embed.
- **Scroll mode** (full scrollytelling): `index.html` in a **viewport-height** iframe
  (it pins and scrolls internally — never auto-height).
- Params: `mode`, `autoplay`, `loop`, `speed` (timeScale multiplier, `1` ≈ 100 s).
- `window.CON_BP_CONFIG = { … }` overrides params for programmatic embeds.

## Transport (v4, shared)

Restart · Prev · REW · Play · FF · Next, a `1×` speed readout, and a scrubbable
`role="slider"` progress bar (click / drag / keyboard / aria). Prev/Next jump to whole
scenes.

## Compliance (the defining requirement of the set)

Everything is public FCC / Amazon record. The persistent chip
(`PUBLIC SOURCES · FCC / AMAZON · NTS`), the title-block general notes, the `PROVENANCE`
string, and the `PUBLIC DATA ONLY` finale stamp must stay on the sheet. **The orbital
geometry is schematic (NTS): shell gaps and Earth radius are exaggerated for legibility,
and there is NO real ephemeris and NO real ground-station location** — the gateways in
scene 6 are generic and unplaced. No figure without a public citation. Not derived from any
Amazon internal document or export-controlled (ITAR/EAR) data.

## Public figures on the sheet

3,236 satellites · shells 590 km/33.0°/1,156 · 610 km/42.0°/1,296 · 630 km/51.9°/784 ·
98 orbital planes · FCC 50%-by-Jul-2026 milestone · OISL ~1550 nm, ≤100 Gbps, ~1,000 km
demonstrated, ~30% faster than fibre · LEO ~20–40 ms vs GEO (35,786 km) ~500–700 ms.

## Reduced motion

`buildStaticPoster()` renders the full annotated system (all groups revealed) with no
pin / scrub.
