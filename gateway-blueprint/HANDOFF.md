# Amazon Leo Ground Gateway (GGT) Blueprint — Engineering Handoff

Scroll-driven, blueprint-style exploded-view breakdown of a **generic** Amazon Leo
ground gateway, built as a work showcase — third of the suite alongside
`../rocket-blueprint/` and `../satellite-blueprint/` (same design language; they're
meant to live as adjacent tabs). The site draws itself onto an engineering sheet,
then each scene tours the system — the tracking antenna and its radome, a live
LEO pass with satellite handover, the Ka-band feeder link and rain-fade diversity,
the equipment shelter and Prometheus baseband, the PoP/fiber/AWS backhaul path,
and the wider fleet with TT&C — ending in a full exploded view, reassembly, and a
"PUBLIC DATA ONLY" stamp.

- **Live:** `https://djamies1.github.io/gateway-blueprint/`
- **Embed demo:** `https://djamies1.github.io/gateway-blueprint/embed.html`

## ⚠️ COMPLIANCE — READ FIRST

**Everything in this piece is compiled solely from public sources** (Amazon Leo /
Project Kuiper press and blog posts, FCC 20-102 and FCC ELS/IBFS earth-station
filings, AWS re:Invent 2025 coverage, eoPortal, trade press — retrieved Jul 2026).
**It is not derived from, informed by, or checked against any Amazon internal
schematic, document, or export-controlled (ITAR/EAR) technical data.** The
geometry is a *generic LEO ground gateway*, drawn **NTS (not to scale)** —
production gateway antennas, site layouts and equipment arrangements have never
been published, and the sheet says so on its face (title block `SCALE: NTS`,
general notes, the persistent `PUBLIC SOURCES · REPRESENTATIVE · NTS` chip, the
cover notice, the closing stamp, and the outro provenance block).

**NO REAL SITE LOCATIONS, EVER.** Real GGT locations and deployment dates may be
Amazon-confidential, and this repo is public. The site-plan inset is labeled
"TYPICAL SITE PLAN — LOCATION GENERIC", the general notes carry a dedicated
no-location line, and alternate sites are named only "SITE A/B". Never add a
place name, coordinate, or map to this folder. (The sibling `leo-gateways/`
globe uses fictional site data for the same reason.)

**Editing rule: never add a figure without a public citation.** Every string
renders from `js/data.js` — content review is one file. If a figure can't be
publicly sourced, it doesn't go in. Dimension lines are deliberately unvalued
(`REF`); the only quoted antenna size (2.4 m) is explicitly labeled as the
protoflight-era figure from FCC ELS filings, not production hardware.

## Stack

Plain static files, **no build step**. ES modules + two vendored classic scripts.
Zero runtime network requests outside the folder (GSAP and fonts are vendored) —
safe for locked-down corporate environments.

- GSAP 3.13.0 + ScrollTrigger (`vendor/`, free license post-Webflow)
- Space Grotesk 500/700 + IBM Plex Mono 400/500 (`fonts/`, OFL, latin subsets)

```
index.html    sheet chrome + the full inline SVG (hand-authored site geometry)
styles.css    design tokens (:root block at top), panels, responsive, reduced-motion
embed.html    THE iframe embed reference (also the smoke-test target)
js/data.js    single source of truth: every figure, string, camera preset, explode offset
js/drawing.js boot-generated repetitive geometry (edge zones, grade ticks, rain, racks, x-labels)
js/timeline.js master timeline + the single ScrollTrigger + camera
js/ui.js      panels / progress rail / outro table, all rendered from data.js
js/main.js    boot order: geometry → UI → fonts.ready → timeline (or static poster)
```

## Two run modes

**Scroll mode (default)** — the full-page scrollytelling piece (the sub-tab
version). The cover has an "AUTO-PLAY THE BREAKDOWN" button and the stage has a
transport cluster (restart / prev / play-pause / next) that smoothly drives the
scroll for you (~80 s full run); any real user input (wheel, touch, key, click
outside the controls) hands control straight back to manual scrolling.

**Player mode (`?mode=player`)** — built for dashboard widgets and fixed-size
panels. No scrolling at all: the same master timeline is time-driven with
transport controls and a scene-ticked progress bar. Works at **any** container
size — a 380 px sidebar column gets the narrow layout automatically, because the
media queries evaluate against the iframe's own viewport.

| URL param | Effect |
|---|---|
| `mode=player` | enables player mode |
| `autoplay` | starts playing immediately (otherwise parks on a poster frame — drawn site + overview panel) |
| `loop` | repeats forever with a ~2.6 s hold on the finished sheet |
| `speed=N` | timeScale; default `1.25` ≈ 80 s per run (`2` ≈ 50 s, `3` ≈ 33 s) |

All params can also be set via `window.GGT_BP_CONFIG = { mode, autoplay, loop, speed }`
before the module loads (for native mounts).

**Dashboard sidebar snippet:**

```html
<iframe src=".../gateway-blueprint/index.html?mode=player&autoplay=1&loop=1"
        title="Generic Leo ground gateway — animated blueprint"
        style="display:block; width:100%; height:660px; border:0"></iframe>
```

`embed.html` is a working mock of exactly this: a dashboard grid with the widget
in a 400 px sticky sidebar, plus the full-page scroll embed below it.

## ⚠️ Embedding into the work app

**Preferred: iframe (this is bulletproof).**

```html
<iframe src=".../gateway-blueprint/index.html"
        title="Generic Amazon Leo ground gateway — animated blueprint"
        style="display:block; width:100%; height:100vh; border:0"></iframe>
```

- **Scroll mode: the iframe MUST be viewport-sized (e.g. `height:100vh`) so it
  scrolls internally. Never use an auto-height / "seamless" iframe that grows to
  content height — the page inside would have no scroll, ScrollTrigger would never
  fire, and the piece stays frozen on the cover.** This is the number-one
  integration mistake. (**Player mode has no such constraint** — any fixed size
  works; that's what it's for.)
- An iframe is its own browsing context, so the pinning (`position: fixed`) is
  immune to any `transform`/`filter` on the host app's ancestors. React apps can
  wrap this in a plain component that renders the iframe.

**Alternative: copy the folder into the app and render `index.html`'s body inline.**
Only if you must. Two rules:

1. Mount it with **no transformed ancestors** (no `transform`, `filter`,
   `perspective`, `will-change` on anything above `.stage`), or pinning breaks.
2. If the app scrolls inside a custom container rather than the window, set the
   config hook **before** the module loads:

```html
<script>window.GGT_BP_CONFIG = { scroller: '#your-scroll-host', pinType: 'transform' };</script>
```

Do **not** add `ScrollTrigger.normalizeScroll(true)` — it hijacks native scrolling
and misbehaves inside iframes.

## How the animation works

- **One master timeline (duration 100)**. In scroll mode a single ScrollTrigger
  scrubs it while pinning `.stage` for ~9 viewport-heights (`SCROLL_VH` in
  `data.js`); in player mode the same timeline is simply played with
  `timeScale(speed)` — that's the whole difference between the modes. Scene labels
  sit at the fractions in `SCENES`. Everything — camera, component motion, dash
  draws, HTML panel in/outs — is a tween on that timeline, so reverse-scrubbing is
  correct by construction. No snap (momentum + iframes fight it); the rail and
  transport prev/next give precise navigation.
- **Camera** = transform of the `#world` group; the sheet chrome (`#sheet`) never
  zooms. The camera tweens a plain `{px,py,z}` object and writes a raw `matrix()`
  attribute (`applyCam`). **Don't refactor this to GSAP `x/y/scale` shorthands**:
  GSAP resolves SVG transform origins against the element's bounding box, and
  `#world`'s bbox mutates as components move — the cached origin drifts and the
  camera lands off-target. (Leaf groups with *static* bboxes can safely use
  `rotation` + `svgOrigin`, and do — see the tracking scene.)
- **The tracking scene's geometry trick**: the dish (`#dish-tilt`), the feeder
  beam (`#beam`) and both satellite carriers (`#car-a`/`#car-b`) are leaf groups
  that rotate about the **same** `svgOrigin '800 505'` (the elevation trunnion),
  and the pass arc is a circle about that exact pivot. One rotation value drives
  dish, beam and satellite together, so they stay visually locked with no
  per-frame math. If you retune the pass, keep the arc centered on the pivot.
- **Explode offsets** live in `data.js` `EXPLODE` (`groups` = y lifts, `parts` =
  x/y/rotation for the extracted modules; the radome's tilt rotates about
  svgOrigin `'800 486'`). Home = all zeros, so reassembly is a tween back to 0.
  The exploded-view leader labels (`XLABELS`) are authored in *exploded*
  coordinates.
- **Shelter cutaway**: the hatched wall pocket (`#sh-cut`) and the extractable
  rack row (`#rack-row`) share one animatable `<clipPath>` rect (`#clip-sh-r`).
  The clip window is widened with a timeline `.set()` just before the explode so
  the racks can slide clear — if you retune explode timing, keep that set()
  before the part tweens.
- **Draw-on**: every hand-authored path has `pathLength="1"`, so drawing is one
  `stroke-dashoffset 1.02 → 0` tween (1.02, not 1.0 — Safari leaves end-cap dots
  otherwise). Dashed-convention lines (radome phantom, hidden racks, extension
  lines, centerline) can't dash-draw, so they fade. The fiber "flows" by sliding
  its dash pattern (`strokeDashoffset` on `#fiber-flow` — cheap).
- **SVG arc-flag gotcha (cost us a milestone)**: for an over-the-top dome from
  left to right, the flags are `A r r 0 1 1` (large-arc **and** sweep). With
  sweep=0 the "large" arc renders *below* the chord — an upside-down bowl that
  looks right in no scene and wrong in all of them. Check `getBBox()` when in
  doubt.
- **Camera presets** exist per breakpoint (`CAM` desktop / `CAM_MOBILE` portrait
  ≤900px) and the whole timeline rebuilds through `gsap.matchMedia` when the
  breakpoint flips.

## Readability & embeddable-widget restructure (v2 — Leo Finance)

Shown to a **non-technical finance audience**, so the copy is plain-language: the scene
cards (`PANELS`), leader labels (`XLABELS`) and on-diagram annotations avoid specs/units/
acronyms and keep only a few headline numbers. The detailed spec appendix (`SPEC_TABLE` /
`COMPONENT_NOTES`) still lives in `js/data.js` but is no longer rendered. Compliance caveats
(public-sources / representative / NTS / no-real-location / stamp) are unchanged.

Diagram labels are enlarged at boot in `js/main.js` — `TEXT_SCALE` 1.65 (title block ×1.20,
finale stamp left as-is); tune the constant, not the per-label `font-size`s. Scene cards
(`.panel`) are bumped in `styles.css`. Pace: `speed` 1.0 / `AUTOSCROLL_SECS` 104 (~6–8 s/card).

The page is a **self-contained widget**: the cover header and outro appendix are stripped
from `index.html` (`buildOutro()` no longer called); the pinned `.stage` carries its own
transport + on-sheet compliance. The **draw-on intro is dropped** — the widget lands at
`START = 14` (first component scene, fully drawn) and the first scroll/play pans into it;
`SCENES` in `js/data.js` are the master bounds (14→100) remapped to 0→100. A **start cue**
(`.startcue`) overlays a persistent play button + "scroll to explore" hint that plays from
the current scroll position and only hides while auto-playing.

## Responsive, reduced motion, a11y

- ≤900px portrait: the SVG switches `preserveAspectRatio` to `slice` (crops the
  sheet margins; the site band x 620–980 survives — sky, dish, shelter and the
  core backhaul nodes all live inside it), panels become a bottom sheet, margin
  annotations + DETAIL A/B + site-B hide (`display:none` via media query), camera
  uses looser site-centered presets, and the transport drops below the full-width
  compliance chip.
- `prefers-reduced-motion`: no pin, no scrub — the page renders a static exploded
  poster (offsets + labels + open shelter bay applied once; the beam and
  satellites hide because they'd read wrong detached from the exploded dish)
  with all eight panels re-flowed into the document, then the spec table. Same
  path runs if GSAP fails to load.
- The SVG is `aria-hidden`; the outro `<article>` is the accessible content (real
  `<table>` + prose from the same `data.js`). Skip link first in tab order; rail
  dots are real buttons; scene changes announce via one polite `aria-live` region.

## Performance guardrails (keep these when editing)

- Scrub animates **only** group transforms, opacity, `stroke-dashoffset`, and a
  few stroke-color accents on small node counts.
- **No SVG filters, ever** — "glow" is layered strokes. No `vector-effect:
  non-scaling-stroke` (per-frame stroke recompute; line weight scaling reads as
  authentic magnification anyway).
- Grid and hatching are `<pattern>` fills, never individual nodes.
- `will-change: transform` on the `<svg>` root only.
- Satellite glyphs are `<use>` of `#sym-sat` — style symbol children with
  **inline styles** (document CSS doesn't reliably pierce the shadow tree).
- Arrow markers paint even when a stroke is dash-hidden — hide marker-bearing
  paths with opacity as well (`#dims` and `#beam` do this).

## Verification

Serve from the **repo root** (`python -m http.server 8123`) →
`http://localhost:8123/gateway-blueprint/`. Ad-hoc Playwright scripts (repo root
has `@playwright/test`) cover: per-scene panel-exclusivity sweep with screenshots,
draw-on completion, tracking-lock assertion (dish/beam/satellite share one angle),
deep reverse-scrub residue probes, end-state assertions (`#world` back to
`matrix(1,0,0,1,0,0)`, movers at 0), player mode (no pin spacer, poster frame at
13.8%, pause/next transport), 390×844 sweep, reduced-motion context, skip-link
tab order, aria-live announcements, Firefox spot-check, iframe smoke test against
`embed.html`, a zero-external-requests check, and an automated disclaimer-surface
audit **including a no-real-locations grep** of the content files.

## Editing guide

- **Change a figure/label:** edit `js/data.js` only (panels, outro, x-labels all
  follow). Cite a public source or don't add it — and never a location; see the
  compliance section.
- **Retune a camera framing:** `CAM` in `data.js` / `CAM_MOBILE` in `timeline.js`.
- **Adjust scene pacing:** the label fractions in `SCENES` are documentation; the
  actual beat positions are the literal times in each `scene*()` function in
  `timeline.js` (timeline units 0–100, ≈9 units per viewport-height of scroll).
- **Site geometry:** hand-authored in `index.html` (arbitrary units, NTS; axis
  x=800, orbit arc apex y≈137, trunnion pivot (800,505), grade y=640, shelter
  section y 692–802, backhaul strip y≈856–934; keep mobile-critical art inside
  x 620–980). Anything patterned (edge zones, grade ticks, rain, racks, exploded
  labels) is generated in `js/drawing.js`.

## Design pass (v3 — professional polish)

- **Documentary spotlight**: each component scene dims every non-focus assembly
  (`stroke-opacity`/`fill-opacity` ATTRIBUTE tweens — never `opacity`/`autoAlpha`, so
  they can't fight the reveal choreography; children's own opacity animations multiply
  through). Focus maps live at the bottom of `build()` in `js/timeline.js`
  (`SPOT_GROUPS` + `spot()` calls; `DIM 0.32`, `SOFT 0.55`). Desktop only — the mobile
  slice crop reframes scenes. The finale relights everything before the explode.
- **Scene HUD**: `.scene-hud` (bottom-left) shows `NN / NN — Scene title`, driven from
  `announceScene()` in `js/ui.js`; seeded at boot via `onProgress(0)` in `js/main.js`.
- **Rail tooltips**: hover/focus a rail dot shows the section title
  (`data-title` + CSS `::after`).
- **Card polish**: ghost chapter numeral (`.panel-num`, top-right) + a signal-cyan
  drafting tick before each eyebrow.
- **Load-in fade**: `html.is-booting` hides the stage, `html.is-ready` (added once
  `document.fonts.ready` resolves, in both boot paths) fades it in — smooth
  materialize inside dashboard iframes; no-JS static fallback never hides.
- **Sheet depth**: `.stage-vignette` div (between `#bp` and `.panels`) adds a gentle
  corner falloff under all UI layers.
- **Cleanup**: dead cover / outro / skip-link CSS removed (their DOM left in v2);
  autoscroll's input-guard now whitelists `.startcue-play` (was the defunct
  `.cover-play`); `embed.html` speed guidance corrected (speed is a multiplier,
  1 ≈ 100 s; lower = slower).
- Verified: scratchpad `v3.mjs` (18 checks: fade/HUD/tooltips/numerals/spotlight
  dim–relight both scrub directions/player poster) + `wv.mjs` regression — all green.
