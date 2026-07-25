# LEO Broadband — Two Architectures (Leo vs Starlink) Blueprint — Handoff

Scroll-driven, blueprint-style **public comparison** of the two big low-Earth-orbit
broadband networks — **Amazon Leo** (left) and **Starlink** (right) — across constellation,
spectrum & terminals, the optical mesh, ground integration, and launch. The eighth sibling
of the blueprint set — same cyanotype engine and embed contract. Content is compiled solely
from **public sources for both operators**; it is neutral, uses no company logos, and is
dated "as of Jul 2026" (the numbers move fast).

## What makes this one different

It is a **two-column comparison table**, not an object or a flow. A centre divider splits
AMAZON LEO (cyan — the set's hero) from STARLINK (plain ink); the camera pans **down** the
table row by row. The one warm `--laser` accent (amber) marks the **OPTICAL MESH** row —
the single dimension where the two architectures converge. Values hug the centre divider so
the comparison survives a narrow portrait crop.

## Files

- `index.html` — the SVG. `#sheet` (grid/frame/title block/notes/stamp) never transforms;
  `#world` (camera target) holds the table. Empty container groups `#divider`, `#headers`,
  `#rows` (and `#zones`) are filled at boot by `drawing.js`; `#anno`/`#lead-recap` is the
  hand-authored recap line.
- `js/data.js` — single source of truth: `GEOM` (divider x, row spacing, the two column
  x-anchors), `ROWS` (the five comparison rows — `mesh:true` tints a row amber), `CAM`
  presets, `SCENES`, `SCROLL_VH`, `PANELS`, and the `SPEC_TABLE` / `COMPONENT_NOTES` /
  `PROVENANCE` appendix (a11y + citations).
- `js/drawing.js` — boot-time generation: the sheet-edge zones, the centre divider, the two
  column headers (+ public status line), and the five rows from `ROWS`.
- `js/timeline.js` — one master GSAP timeline + one ScrollTrigger. Camera is a raw
  `matrix()` on `#world`; the intro draws the divider, then a shared `sceneRow()` helper
  pans down and reveals each row. Config global: `window.CMP_BP_CONFIG`.
- `js/ui.js` — rail, panels, scene HUD, transport. **Byte-identical to the family** (do not fork).
- `js/main.js` — boot + mode/param handling + transport. Identical except the
  `CMP_BP_CONFIG` global name.
- `styles.css` — the shared cyanotype system + the one `--laser` token. Only the reveal
  list and mobile-hide list differ; the base table stays visible without JS.
- `embed.html` — a throwaway dashboard mock showing the two embed patterns.

## Embed contract (same as the family)

- **Player mode** (fixed size, no scroll): `index.html?mode=player&autoplay=1&loop=1`.
- **Scroll mode** (full scrollytelling): `index.html` in a **viewport-height** iframe.
- Params: `mode`, `autoplay`, `loop`, `speed` (timeScale multiplier, `1` ≈ 100 s).
- `window.CMP_BP_CONFIG = { … }` overrides params for programmatic embeds.

## Transport (v4, shared)

Restart · Prev · REW · Play · FF · Next, a `1×` speed readout, and a scrubbable
`role="slider"` progress bar. Prev/Next jump to whole scenes.

## Compliance (the defining requirement of the set)

Everything is public record for **both** operators. The persistent chip
(`PUBLIC COMPARISON · FCC / PRESS · NTS`), the title-block general notes, the `PROVENANCE`
string, and the `PUBLIC DATA ONLY` / `PUBLIC COMPARISON · NO INTERNAL DATA` finale stamp
must stay on the sheet. It is neutral and factual; **no company logos or branding**; figures
are approximate and dated (as of Jul 2026). Not derived from any Amazon internal document or
export-controlled (ITAR/EAR) data — this matters doubly here because the sheet names a
competitor: keep it to what is publicly reported for each.

## Public figures on the sheet (as of Jul 2026)

Amazon Leo: 3,236 sats · 3 shells 590–630 km · 98 planes · Ka-band · Nano/Pro/Ultra to
~1 Gbps · OISL ~100 Gbps · gateways → nearest AWS Region · buys launch across 5 rocket
families · deploying, commercial mid-2026.
Starlink: ~9,000 operational (toward ~42,000) · 340–570 km · Ku-band + direct-to-cell ·
OISL ~200 Gbps · own gateways + fibre · own Falcon 9 / Starship · operational, ~10M+ subs,
~$11.4B 2025 revenue (public/analyst).

## Reduced motion

`buildStaticPoster()` renders the full comparison table (headers + all rows + recap) with no
pin / scrub.
