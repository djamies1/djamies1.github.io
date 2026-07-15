# New Glenn Blueprint — Engineering Handoff

Scroll-driven, blueprint-style exploded-view visualization of Blue Origin's New Glenn
launch vehicle, built as a work showcase for Amazon Leo. The vehicle draws itself onto
an engineering sheet, then scrolling scrubs it apart component by component — fairing,
Leo satellite stack, GS2, forward module, GS1, aft module/BE-4 — ending in a full
exploded view with leader labels, reassembly, and a spec table.

- **Live:** `https://djamies1.github.io/rocket-blueprint/`
- **Embed demo:** `https://djamies1.github.io/rocket-blueprint/embed.html`

## Stack

Plain static files, **no build step**. ES modules + two vendored classic scripts.
Zero runtime network requests outside the folder (GSAP and fonts are vendored) — safe
for locked-down corporate environments.

- GSAP 3.13.0 + ScrollTrigger (`vendor/`, free license post-Webflow)
- Space Grotesk 500/700 + IBM Plex Mono 400/500 (`fonts/`, OFL, latin subsets)

```
index.html    sheet chrome + the full inline SVG (hand-authored vehicle geometry)
styles.css    design tokens (:root block at top), panels, responsive, reduced-motion
embed.html    THE iframe embed reference (also the smoke-test target)
js/data.js    single source of truth: every figure, string, camera preset, explode offset
js/drawing.js boot-generated repetitive geometry (edge zones, satellites, engine cluster, x-labels)
js/timeline.js master timeline + the single ScrollTrigger + camera
js/ui.js      panels / progress rail / outro table, all rendered from data.js
js/main.js    boot order: geometry → UI → fonts.ready → timeline (or static poster)
```

## Two run modes

**Scroll mode (default)** — the full-page scrollytelling piece. The cover has an
"AUTO-PLAY THE BREAKDOWN" button and the stage has a transport cluster
(restart / prev / play-pause / next) that smoothly drives the scroll for you
(~80 s full run); any real user input (wheel, touch, key, click outside the controls)
hands control straight back to manual scrolling.

**Player mode (`?mode=player`)** — built for dashboard widgets and fixed-size panels.
No scrolling at all: the same master timeline is time-driven with transport controls
and a scene-ticked progress bar. Works at **any** container size — a 380 px sidebar
column gets the narrow layout (cropped sheet, bottom-sheet panels, top-right controls)
automatically, because the media queries evaluate against the iframe's own viewport.

| URL param | Effect |
|---|---|
| `mode=player` | enables player mode |
| `autoplay` | starts playing immediately (otherwise parks on a poster frame — drawn vehicle + overview panel) |
| `loop` | repeats forever with a ~2.6 s hold on the finished sheet |
| `speed=N` | timeScale; default `1.25` ≈ 80 s per run (`2` ≈ 50 s, `3` ≈ 33 s) |

All params can also be set via `window.ROCKET_BP_CONFIG = { mode, autoplay, loop, speed }`
before the module loads (for native mounts).

**Dashboard sidebar snippet (the launch-dashboard case):**

```html
<iframe src=".../rocket-blueprint/index.html?mode=player&autoplay=1&loop=1"
        title="New Glenn — animated blueprint"
        style="display:block; width:100%; height:660px; border:0"></iframe>
```

`embed.html` is a working mock of exactly this: a dashboard grid with the widget in a
400 px sticky sidebar, plus the full-page scroll embed below it.

## ⚠️ Embedding into the work app

**Preferred: iframe (this is bulletproof).**

```html
<iframe src=".../rocket-blueprint/index.html"
        title="New Glenn launch vehicle — animated blueprint"
        style="display:block; width:100%; height:100vh; border:0"></iframe>
```

- **Scroll mode: the iframe MUST be viewport-sized (e.g. `height:100vh`) so it scrolls
  internally. Never use an auto-height / "seamless" iframe that grows to content height —
  the page inside would have no scroll, ScrollTrigger would never fire, and the piece
  stays frozen on the cover.** This is the number-one integration mistake.
  (**Player mode has no such constraint** — any fixed size works; that's what it's for.)
- An iframe is its own browsing context, so the pinning (`position: fixed`) is immune to
  any `transform`/`filter` on the host app's ancestors. React apps can wrap this in a
  plain component that renders the iframe.

**Alternative: copy the folder into the app and render `index.html`'s body inline.**
Only if you must. Two rules:

1. Mount it with **no transformed ancestors** (no `transform`, `filter`, `perspective`,
   `will-change` on anything above `.stage`), or pinning breaks.
2. If the app scrolls inside a custom container rather than the window, set the config
   hook **before** the module loads:

```html
<script>window.ROCKET_BP_CONFIG = { scroller: '#your-scroll-host', pinType: 'transform' };</script>
```

Do **not** add `ScrollTrigger.normalizeScroll(true)` — it hijacks native scrolling and
misbehaves inside iframes.

## How the animation works

- **One master timeline (duration 100)**. In scroll mode a single ScrollTrigger scrubs
  it while pinning `.stage` for ~9 viewport-heights (`SCROLL_VH` in `data.js`); in player
  mode the same timeline is simply played with `timeScale(speed)` (paused/looped per
  params) — that's the whole difference between the modes. Scene labels sit at the
  fractions in `SCENES`. Everything — camera, component motion, dash draws, HTML panel
  in/outs — is a tween on that timeline, so reverse-scrubbing is correct by construction.
  No snap (momentum + iframes fight it); the rail and transport prev/next give precise
  navigation. If snap is ever wanted:
  `snap: { snapTo: 'labelsDirectional', duration: {min:.15,max:.5} }`.
- **Scroll-mode auto-play** tweens the scroll position itself (`startAutoScroll` in
  `timeline.js`) — note it must call `scrollTo` with `behavior:'instant'` because the
  page's CSS `scroll-behavior:smooth` would otherwise swallow per-frame scroll writes.
- **Camera** = transform of the `#world` group; the sheet chrome (`#sheet`) never zooms.
  The camera tweens a plain `{px,py,z}` object and writes a raw `matrix()` attribute
  (`applyCam`). **Don't refactor this to GSAP `x/y/scale` shorthands**: GSAP resolves
  SVG transform origins against the element's bounding box, and `#world`'s bbox mutates
  as components move — the cached origin drifts and the camera lands off-target.
- **Explode offsets** live in `data.js` `EXPLODE` (groups + fairing halves). Home = all
  zeros, so reassembly is a tween back to 0. The exploded-view leader labels
  (`XLABELS`) are authored in *exploded* coordinates.
- **Draw-on**: every hand-authored path has `pathLength="1"`, so drawing is one
  `stroke-dashoffset 1.02 → 0` tween (1.02, not 1.0 — Safari leaves end-cap dots
  otherwise). Dashed-convention lines (hidden geometry, centerlines, extension lines)
  can't dash-draw, so they fade.
- **Camera presets** exist per breakpoint (`CAM` desktop / `CAM_MOBILE` portrait ≤900px)
  and the whole timeline rebuilds through `gsap.matchMedia` when the breakpoint flips.

## Content and data hygiene

- Every figure/string renders from `js/data.js` — content review is one file.
- All figures are public (Blue Origin materials, Wikipedia, NASASpaceflight, Amazon Leo
  announcements; retrieved Jul 2026). The geometry is **representative, not engineering-
  accurate**, and the title block + general notes say so on the sheet itself.
- The Leo dispenser depiction is deliberately generic — the flight design is not public.
- No Blue Origin logo/wordmark anywhere (text labels only). Vehicle name and figures are
  nominative use; the footer carries a non-affiliation line.
- No flight-history/mission-log content by design.

## Readability (polish pass)

Diagram labels are authored in small world units, so `js/main.js` enlarges every
`#bp text` by `TEXT_SCALE` (1.4) at boot — the title block grows ×1.15 (it lives in a
fixed drafting box) and the finale stamp is left as-is. Tune the constant there, not the
per-label `font-size`s. The scene cards (`.panel`) are bumped in `styles.css`. For
auto-play readability each card now fades in as its scene's camera settles (not at the
scene tail) and holds until the next scene, and the defaults are `speed` 1.25 /
`AUTOSCROLL_SECS` 80 — so every card stays up long enough to read (~5 s).

## Responsive, reduced motion, a11y

- ≤900px portrait: the SVG switches `preserveAspectRatio` to `slice` (crops the sheet
  margins; the vehicle band x 620–980 survives), panels become a bottom sheet, margin
  annotations/DETAIL A hide (`display:none` via media query), camera uses looser
  vehicle-centered presets, and a compact DWG chip replaces the cropped title block.
- `prefers-reduced-motion`: no pin, no scrub — the page renders a static exploded
  poster (offsets + labels applied once) with all eight panels re-flowed into the
  document, then the spec table. Same path runs if GSAP fails to load.
- The SVG is `aria-hidden`; the outro `<article>` is the accessible content (real
  `<table>` + prose from the same `data.js`). Skip link first in tab order; rail dots
  are real buttons; scene changes announce via one polite `aria-live` region.

## Performance guardrails (keep these when editing)

- Scrub animates **only** group transforms, opacity, and `stroke-dashoffset`.
- **No SVG filters, ever** — "glow" is layered strokes. No `vector-effect:
  non-scaling-stroke` (per-frame stroke recompute; line weight scaling reads as
  authentic magnification anyway).
- Grid and hatching are `<pattern>` fills, never individual lines.
- `will-change: transform` on the `<svg>` root only.
- Satellites are `<use>` glyphs revealed by group opacity — don't dash-draw through
  `<use>` shadow trees (Safari), and style symbol children with **inline styles**
  (document CSS doesn't reliably pierce the shadow tree; inline styles clone with it).
- Arrow markers paint even when a stroke is dash-hidden — hide marker-bearing paths
  with opacity as well.

## Verification

Serve from the **repo root** (`python -m http.server 8123`) →
`http://localhost:8123/rocket-blueprint/`. Ad-hoc Playwright scripts (repo root has
`@playwright/test`) were used for: scene screenshots at label fractions, reverse-scrub
residue probes, end-state assertions (`#world` back to `matrix(1,0,0,1,0,0)`, wrappers
at 0), reduced-motion context (no pin spacer, poster + panels in flow), 390×844 sweep,
iframe smoke test against `embed.html`, and a zero-external-requests check.

## Editing guide

- **Change a figure/label:** edit `js/data.js` only (panels, outro, x-labels all follow).
- **Retune a camera framing:** `CAM` / `CAM_MOBILE` in `data.js` + `timeline.js`.
- **Adjust scene pacing:** the label fractions in `SCENES` are documentation; the actual
  beat positions are the literal times in each `scene*()` function in `timeline.js`
  (timeline units 0–100, ≈9 units per viewport-height of scroll).
- **Vehicle geometry:** hand-authored in `index.html` (1 m = 8 units, axis x=800,
  fairing tip y=108, aft plane y=892). Anything patterned (satellites, engine cluster,
  edge zones, exploded labels) is generated in `js/drawing.js`.
