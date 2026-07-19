# Amazon Leo Customer Terminal — Blueprint (handoff)

Fourth and final piece of the blueprint suite, after `../rocket-blueprint`,
`../satellite-blueprint` and `../gateway-blueprint`. Same stack and design
language — they are meant to live as adjacent sub-tabs. A scroll-driven +
player-mode animated blueprint of a **generic Amazon Leo customer terminal**.

---

## ⚠️ COMPLIANCE — READ FIRST

This piece exists to be shown publicly, so the guardrails are the point, not
decoration.

- **Public sources only.** Every figure is compiled from Amazon’s own public
  posts, the Amazon Science customer-terminal antenna interview, the FCC
  Ka-band authorization, and the Nov 2025 Amazon Leo terminal-lineup coverage
  (SpaceNews / Via Satellite / Tom’s Hardware / GeekWire), plus DCD and
  eoPortal. Retrieved Jul 2026. Nothing is derived from, or checked against,
  any Amazon internal schematic, document, or export-controlled (ITAR/EAR)
  technical data.

- **THE ARRAY LATTICE IS ILLUSTRATIVE.** Phased-array beamforming is
  classically export-controlled. The element grid on the panel, the plan-view
  lattice inset, and the unit cell in Detail A all use an obviously **token**
  count/spacing. **Never annotate the array with a real element count, pitch,
  lattice geometry, or beamforming/phase parameter.** The words
  “REPRESENTATIVE LATTICE — NOT ACTUAL COUNT/GEOMETRY” appear on the sheet, in
  general note 5, in the panel copy, in the outro and in `PROVENANCE`. Keep
  them there.

- **The products are public; their internals are not.** Model names and
  headline dimensions/weights/speeds (Nano / Pro / Ultra) are Amazon’s own
  published figures and may be quoted. Everything under the skin — array
  geometry, RF chain, Prometheus microarchitecture, thermals — stays generic
  and `REF`.

- The compliance surface is **seven places**: cover notice, persistent chip,
  title-block general notes, the finale stamp, the outro provenance,
  `js/data.js` header, and this file. If you add a figure, add its public
  citation to `PROVENANCE` in `js/data.js`. No Amazon logo/smile/wordmark.

The final Playwright gate greps the content files for internal-data leakage and
asserts the representative-lattice caveat is present. Keep it green.

---

## Run modes

Serve the folder over http (ES modules). Two modes, one build:

| URL | Mode | Use |
|---|---|---|
| `index.html` | scroll | the sub-tab experience — pinned, scroll-scrubbed |
| `index.html?mode=player` | player | poster frame, click ▶ to play |
| `index.html?mode=player&autoplay=1&loop=1` | player | dashboard widget, plays itself |

Player params: `autoplay`, `loop`, `speed` (timeScale, default 1.25 ≈ 80 s run).
A global `window.UT_BP_CONFIG = { mode, autoplay, loop, speed }` sets the same
options without query strings. Reduced-motion (or missing GSAP) renders a
static exploded poster in either mode.

## Embedding

- **Scroll version:** the iframe **must be viewport-height** (`height: 100vh`).
  The pin needs real scroll distance; an auto-height iframe collapses it.
- **Widget version:** `?mode=player` in a fixed-size iframe of any dimensions —
  it is time-driven and never scrolls. See `embed.html` for both.

## Architecture

- `index.html` — cover → pinned `.stage` (inline SVG `viewBox 0 0 1600 1000`) → outro.
- `js/data.js` — **single source of truth**: figures, copy, `CAM`/`CAM_MOBILE`,
  `EXPLODE`, `SCENES`, `PANELS`, `XLABELS`, `SPEC_TABLE`, `COMPONENT_NOTES`,
  `PROVENANCE`. Edit content here.
- `js/timeline.js` — one master timeline (duration 100) + one ScrollTrigger
  (pin `.stage`, `SCROLL_VH = 9`, scrub). Player mode drives the same timeline
  with time instead of scroll.
- `js/drawing.js` — boot-time generated repetitive geometry (zones, roofline
  ticks, obstruction cell, array element row + phase strip + plan-view lattice,
  indoor board, exploded leader labels).
- `js/ui.js` — panels, rail, transport, outro, aria-live (data-driven).
- `js/main.js` — boot + mode wiring.

### Camera (matrix, not GSAP transforms)

The camera writes a raw `matrix(z,0,0,z, 800−z·px, 500−z·py)` onto `#world`.
**Never** animate GSAP `x/y/scale` on `#world`: its bbox mutates as parts move
and the cached transform origin drifts. Leaf groups with **static** bboxes
(beam, wavefront, phase strip, satellites) may use `rotation`/`svgOrigin`.

### Beam-steering (the hero) — the flat panel never moves

This is the terminal’s counterpart to the gateway’s mechanically-tracking dish,
and the opposite idea: the panel is fixed; the **beam** is steered in silicon.

- `#beam`, `#wavefront` and the satellite carriers `#car-a`/`#car-b` all rotate
  about the **same** array phase-centre pivot (`svgOrigin '800 415'`), and the
  LEO pass arc `#orbit` is a circle about that pivot — so the beam stays pointed
  at the satellite by construction. One steer angle drives all of them.
- `#phase-strip` tilts in place about its own centre (`'800 466'`) — the
  per-element phase gradient that “sets the beam angle”.
- **`#asm-panel` is never rotated.** The steer-lock test asserts
  `rotation(#beam) == rotation(#car-a)` and `rotation(#asm-panel) == 0`.
- Handover: a **fast** (~0.6 s) re-steer flips the beam/wavefront/phase-strip to
  the rising satellite, with a beam alpha blink — “re-steers in a blink, nothing
  mechanical to slew”. Deliberately quicker than the gateway’s dish slew.

### Cutaway + explode

- The indoor unit opens with a shared `<clipPath>` (`#clip-in` / `#clip-in-r`,
  height 0→74) revealing `#in-cut` (hatch) + `#router-row` (board). Before the
  explode slides the router clear, the clip is **widened** with a `.set()` so it
  doesn’t get cut off — same avionics-bay trick as the siblings.
- The flat panel explodes as a **vertical layer stack**: cover up, array PCB up,
  Prometheus board / thermal / baseplate down; the fixed mount drops; the router
  extracts sideways. Reassembly tweens every offset back to 0; the end state is
  `#world` ≈ identity.

### SVG arc sweep-flag gotcha (cost a debugging session on the gateway)

For an **over-the-top arc drawn left → right** (the LEO pass dome), the flags are
`A r r 0 0 1` — sweep-flag **1**. With sweep-flag 0 the arc renders **below** the
chord (a “smile”) *and* lands on the wrong centre, which would also break the
satellite-locking. Verify any dome/arc with `getBBox()` after editing.

### Draw-on & conventions

`pathLength="1"` + `stroke-dasharray: 1.02` → animate `strokeDashoffset` 1.02→0.
The default (no JS) state is fully drawn. Include **every** stroke class you want
drawn in scene 0 — `.ln-hi/.ln-mid/.ln-low/.ln-dim/.ln-acc` all need to be in the
draw tweens or an accent path stays invisible. Dashed conventions
(`.dash-hid`, `.dash-ext`, `.cl`) fade in, never dash-draw. No SVG filters;
grids/hatch are `<pattern>`s; `<use>`/`<symbol>` children carry inline styles.

### Readability & audience (v2 — Leo Finance)

This suite is shown to a **non-technical finance audience**, so the copy is plain-language and
high-level: the scene cards (`PANELS`), leader labels (`XLABELS`) and on-diagram annotations
avoid specs/units/acronyms and keep only a few headline numbers (e.g. up to 1 Gbps, under
$400, under 50 ms, 3,236 satellites). The engineering detail lives in the outro appendix
(`SPEC_TABLE` / `COMPONENT_NOTES`, lightly de-jargoned), and the compliance caveats
(public-sources / representative-lattice / NTS / `PUBLIC DATA ONLY` stamp) are unchanged.

Diagram labels are authored in small world units, so `js/main.js` enlarges every `#bp text`
by `TEXT_SCALE` (1.65) at boot — the title block grows ×1.20 (fixed drafting box) and the
finale stamp is left as-is. Tune the constant there, not the per-label `font-size`s. Scene
cards (`.panel`) are bumped in `styles.css`. For auto-play readability each card fades in as
its scene's camera settles and holds until the next scene; defaults are `speed` 1.0 /
`AUTOSCROLL_SECS` 104 — so every card stays up ~6–8 s.

### Embeddable-widget restructure

This piece is meant to be dropped straight into another app as **just the blueprint
square** — the cover header and the outro spec appendix are removed from `index.html`
(`buildOutro()` is no longer called; the appendix data still lives in `js/data.js`). The
page is the pinned `.stage` alone, carrying its own transport (play/prev/next + progress)
and the on-sheet compliance (persistent chip, title-block general notes, `PUBLIC DATA ONLY`
stamp).

The **draw-on intro is dropped**: the widget lands already-drawn at the start of the first
component scene, then the first scroll/play pans into the component (so scrolling produces
obvious motion right away — landing *settled* left a dead zone). Mechanically the master
timeline is unchanged — the stroke-by-stroke draw still exists at `t < START` (`START = 14`
in `timeline.js`) so seeking past it builds the finished sheet — but both modes start at
`START` and treat `[START,100]` as the visible run. Scroll uses a proxy playhead that maps
scroll 0→1 onto master `t START→100`; player plays from `START`; progress is reported in
visible % so the rail/progress bar ignore the intro. `SCENES` in `js/data.js` are the master
scene bounds (14→100) remapped to 0→100 and no longer list the draw scene. To restore the
full intro, set `START = 0` and re-add the draw scene to `SCENES`.

A **start cue** (`.startcue` in `index.html` / `styles.css`, wired in `js/main.js`) overlays
the landing: a prominent play button plus a "scroll to explore" hint (mono, cyan). Click
plays hands-free; it fades on the first interaction (`pointerdown/wheel/keydown/touch/scroll`).
In player mode the note drops the scroll hint; with `autoplay` it's dismissed immediately.

## Responsive / a11y

- Portrait phones (`max-width:900px` portrait) slice-crop the sheet and recenter
  on the terminal axis with `CAM_MOBILE`. Margin annotations, both Details and
  the plan-view lattice inset are `display:none` on mobile — the panels carry the
  info, and the compliance caveats live in mobile-safe places (panel copy, notes,
  the phase-strip caption).
- Skip link → `#specs`; `aria-live` announces each scene; rail buttons carry
  `aria-current`; reduced-motion renders the static poster.

## Verification

`python -m http.server` from the repo root, then Playwright (chromium + firefox)
against `/terminal-blueprint/`. The scratchpad `t1`–`t7` suites cover static
disclaimer surfaces, scrub 8-panel exclusivity + end-identity + reverse residue,
the steer-lock assertion, per-scene dwell shots, mobile/reduced-motion/a11y, and
the final content audit. **Only ever `git add terminal-blueprint`** — the repo
has unrelated working-tree changes.

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
