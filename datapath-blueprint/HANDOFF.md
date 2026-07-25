# Amazon Leo — End-to-End Data Path Blueprint — Handoff

Scroll-driven, blueprint-style walkthrough of **the journey a packet takes on Amazon Leo**:
from a Ka-band terminal, up to a low-orbit satellite, across the optical laser mesh, down
to a ground gateway, over dedicated fibre, and into the nearest AWS Region. The seventh
sibling of the blueprint set — same cyanotype design language, same engine, same embed
contract. Content is 100% public FCC / Amazon record.

## What makes this one different

It is a **one-line signal-flow diagram** that reads left→right (like the spectrum chart,
not an exploded object). The camera pans/zooms along the path; the intro **draws the whole
route left→right** (the packet's flow), then each scene zooms to a station and reveals its
label. The one warm `--laser` accent (amber) marks the optical inter-satellite mesh
segment; everything else is cyanotype. This sheet is the connective tissue of the set — its
stations are the terminal, satellite, gateway and spectrum blueprints seen as one flow, and
it is the clearest view of the **AWS integration** (gateway → nearest AWS Region → your VPC).

## Files

- `index.html` — the SVG. `#sheet` (grid/frame/title block/notes/stamp) never transforms;
  `#world` (camera target) holds the path. The stations are hand-authored groups:
  `#ground`, `#term-glyph`/`#term-lbl`/`#term-detail`, `#uplink`/`#up-lbl`, `#sats`/
  `#mesh-links`/`#mesh-lbl`, `#downlink`/`#down-lbl`, `#gw-glyph`/`#gw-lbl`, `#fibre`,
  `#aws-glyph`/`#aws-lbl`, and the `#lat-bar` latency summary. `#zones` is filled at boot by
  `drawing.js`.
- `js/data.js` — single source of truth: `CAM` presets, `SCENES`, `SCROLL_VH`, `PANELS`,
  and the `SPEC_TABLE` / `COMPONENT_NOTES` / `PROVENANCE` appendix (a11y + citations).
- `js/drawing.js` — minimal: just the sheet-edge zones (the stations are unique, so they
  are hand-authored, not generated).
- `js/timeline.js` — one master GSAP timeline + one ScrollTrigger. Camera is a raw
  `matrix()` on `#world`. The intro draws the route L→R; seven scenes pan to each station.
  Config global: `window.PATH_BP_CONFIG`.
- `js/ui.js` — rail, panels, scene HUD, transport. **Byte-identical to the family** (do not fork).
- `js/main.js` — boot + mode/param handling + transport. Identical except the
  `PATH_BP_CONFIG` global name.
- `styles.css` — the shared cyanotype system + the one `--laser` token. Only the reveal
  list and mobile-hide list differ from the siblings.
- `embed.html` — a throwaway dashboard mock showing the two embed patterns.

## Embed contract (same as the family)

- **Player mode** (fixed size, no scroll): `index.html?mode=player&autoplay=1&loop=1`.
- **Scroll mode** (full scrollytelling): `index.html` in a **viewport-height** iframe.
- Params: `mode`, `autoplay`, `loop`, `speed` (timeScale multiplier, `1` ≈ 100 s).
- `window.PATH_BP_CONFIG = { … }` overrides params for programmatic embeds.

## Transport (v4, shared)

Restart · Prev · REW · Play · FF · Next, a `1×` speed readout, and a scrubbable
`role="slider"` progress bar. Prev/Next jump to whole scenes.

## Compliance (the defining requirement of the set)

Everything is public FCC / Amazon record. The persistent chip
(`PUBLIC SOURCES · FCC / AMAZON · NTS`), the title-block general notes, the `PROVENANCE`
string, and the `PUBLIC DATA ONLY` finale stamp must stay on the sheet. The diagram is a
schematic one-line drawing (NTS). **The "AWS Region" is a generic labelled node — NO real
gateway or AWS-Region location is shown.** No AWS/partner logos or branding. No figure
without a public citation. Not derived from any Amazon internal document or export-controlled
(ITAR/EAR) data.

## Public figures on the sheet

Terminals Nano 100 / Pro 400 / Ultra 1,000 Mbps · Ka uplink 27.5–30 GHz · downlink
17.7–20.2 GHz · satellite ~590 km · OISL ~1550 nm, ≤100 Gbps · gateway RF→fibre → nearest
AWS Region → VPC / private network / internet · round trip ~20–40 ms (vs GEO ~500–700 ms).

## Reduced motion

`buildStaticPoster()` renders the full annotated path (all stations + labels + latency bar)
with no pin / scrub.
