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

### Readability (polish pass)

Diagram labels are authored in small world units, so `js/main.js` enlarges every
`#bp text` by `TEXT_SCALE` (1.4) at boot — the title block grows ×1.15 (it lives in a
fixed drafting box) and the finale stamp is left as-is. Tune the constant there, not the
per-label `font-size`s. The scene cards (`.panel`) are bumped in `styles.css`. For
auto-play readability each card now fades in as its scene's camera settles (not at the
scene tail) and holds until the next scene, and the defaults are `speed` 1.25 /
`AUTOSCROLL_SECS` 80 — so every card stays up long enough to read (~5 s).

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
