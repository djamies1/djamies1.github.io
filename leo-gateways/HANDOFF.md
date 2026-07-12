# Leo Gateways Globe — Engineering Handoff

Reference implementation of an interactive 3D "ground gateway network" globe:
auto-rotating dark earth with glowing gateway nodes (active vs planned), hover
tooltips, a click-to-focus showcase (camera fly-in + detail card with an
animated SVG satellite dish), and cascading region/country filters that rotate
the camera and highlight country polygons on the globe.

This document is written to be consumed by an engineer or AI assistant porting
the visual into another web app.

- **Live demo:** https://djamies1.github.io/leo-gateways/
- **Source (browse):** https://github.com/djamies1/djamies1.github.io/tree/main/leo-gateways
- **Data:** 100% dummy/fictional, seeded for the visual shell. ⚠️ If you wire in
  real gateway data, keep it in your private codebase — never push it back to a
  public repo.

## Raw file links (fetch these directly)

| File | Purpose | Raw URL |
|---|---|---|
| `index.html` | Shell: HUD markup, filter bar, detail card, dish SVG `<template>`, loading veil, CDN script tags | https://raw.githubusercontent.com/djamies1/djamies1.github.io/main/leo-gateways/index.html |
| `styles.css` | Design tokens, glass panels, marker/tooltip/card styles, all dish + HUD animations, responsive + reduced-motion | https://raw.githubusercontent.com/djamies1/djamies1.github.io/main/leo-gateways/styles.css |
| `js/data.js` | Gateway schema + 36-site dummy dataset, region camera POVs, atlas name map, derived helpers | https://raw.githubusercontent.com/djamies1/djamies1.github.io/main/leo-gateways/js/data.js |
| `js/globe.js` | All globe.gl configuration: markers, rings, polygons, camera/controls, texture fallback | https://raw.githubusercontent.com/djamies1/djamies1.github.io/main/leo-gateways/js/globe.js |
| `js/state.js` | Interaction state machine + every camera move and timing | https://raw.githubusercontent.com/djamies1/djamies1.github.io/main/leo-gateways/js/state.js |
| `js/ui.js` | Tooltip, detail card open/close, cascading filters, HUD counts, UTC clock, count-up | https://raw.githubusercontent.com/djamies1/djamies1.github.io/main/leo-gateways/js/ui.js |
| `js/main.js` | Boot: texture preload w/ fallback chain, module wiring, veil fade, opening descent, resize, ESC | https://raw.githubusercontent.com/djamies1/djamies1.github.io/main/leo-gateways/js/main.js |

## Stack & dependencies

Vanilla HTML/CSS/JS ES modules. **No build step.** Two libraries, loaded as UMD
globals from CDN (both exist on npm under the same names):

```html
<script src="https://cdn.jsdelivr.net/npm/globe.gl@2.46.1/dist/globe.gl.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js"></script>
```

Runtime-fetched assets (CDN): `three-globe@2.45.2` example textures
(`earth-dark.jpg`, `night-sky.png`, `earth-topology.png`) and
`world-atlas@2.0.2/countries-110m.json` for country polygons.

Run locally: any static server from the folder's parent, e.g.
`python -m http.server 8123` → `http://localhost:8123/leo-gateways/`.
(ES modules + `fetch` — `file://` will not work.)

## Data schema (`js/data.js`)

```js
{
  id: 'GGT-USW-01',            // site code
  name: 'Umatilla Gateway',
  city: 'Umatilla, Oregon',
  country: 'United States',    // must match world-atlas properties.name (see ATLAS_NAME_MAP)
  region: 'AMERICAS',          // 'AMERICAS' | 'EMEA' | 'APAC'
  lat: 45.918, lng: -119.289,
  status: 'ACTIVE',            // 'ACTIVE' | 'PLANNED'
  antennas: 12,
  capacityGbps: 140,
  connectedSats: 38,           // 0 when PLANNED
  rfsDate: '2025-Q3',          // ready-for-service quarter
  notes: 'Primary US-West anchor; …'
}
```

`REGIONS` holds a hand-tuned camera POV (`{lat,lng,altitude}`) per region —
predefined framing was chosen over computed centroids because EMEA spans
Tromsø→Cape Town and APAC centroids break across the antimeridian. Country
focus *does* use the arithmetic centroid of matching sites (safe while no
country in the dataset spans ±180°).

## Architecture decisions worth keeping

1. **Markers are DOM elements** (globe.gl `htmlElementsData` layer), not the
   points layer. This buys CSS glow/hover/hollow styling, native
   mouse events, and per-state class transitions. Each marker root is a 0×0 div;
   an inner `.ggt-anchor` (28×28 touch target) centers itself with
   `translate(-50%,-50%)`, so the visual is anchored to the coordinate
   regardless of the library's anchor convention.
2. **Pulses/bursts are the rings layer.** Ambient ring datums are the gateway
   objects themselves so identity-based data joins keep emitters in phase across
   filter changes; the click burst and selected-node halo are extra datums with
   `__burst` / `__boost` flags that the color/radius/speed accessors branch on.
3. **Country highlight is the polygons layer**, fed from one lazy fetch of
   world-atlas 110m TopoJSON → `topojson.feature(...)` → indexed by
   `properties.name` into a Map (with `ATLAS_NAME_MAP` for display-name
   mismatches like `United States` → `United States of America`). If the fetch
   fails, filters still work — polygons are just skipped.
4. **One state machine owns everything** (`js/state.js`):
   `AMBIENT → REGION_FOCUS → COUNTRY_FOCUS`, plus `GATEWAY_DETAIL` reachable
   from any state (snapshots the prior state and restores it on close). Every
   transition bumps a `camToken`; all delayed callbacks (card open, controls
   re-enable, auto-rotate resume) check the token first — this is what makes
   rapid filter-spam safe.
5. **Click showcase choreography** (desktop): t=0 freeze rotation + disable
   controls + ring burst + `pointOfView({lat, lng: lng+14, altitude: 0.75}, 1600)`
   (the +14° longitude offset parks the node left-of-center, clear of the
   380px right-side card) → t=650ms card slides in + dish draw-in starts →
   t=900ms connected-sats count-up → t=1600ms controls re-enabled. Mobile
   offsets latitude instead (`lat-10`) so the node clears the bottom sheet.
6. **The satellite dish is inline SVG** in `<template id="dishTemplate">`,
   cloned into the card on every open (cloning restarts CSS animations for
   free). Every drawn path has `pathLength="1"` so the draw-in is a single
   `stroke-dashoffset: 1 → 0` keyframe with staggered delays. The slow
   "tracking sway" lives on an inner `.dish-rock` group so its CSS transform
   composes with the geometry instead of replacing it.

## Gotchas (hard-won)

- **Never re-call `.htmlElementsData()` after init** — it rebuilds the marker
  DOM and orphans the cached element map. All marker restyling (dim /
  background / select) is CSS classes toggled on cached elements.
- **Set `controls.autoRotate = false` *before* any `pointOfView()` call**,
  or the tween endpoint drifts while the globe keeps spinning. Re-enable only
  after the return tween lands (token-guarded timeout).
- globe.gl fires `onGlobeClick` after orbit drags; a pointerdown-distance
  guard (>8px = drag, ignore) prevents drags from closing the detail card.
- Horizon culling: `htmlElementVisibilityModifier` toggles an `is-behind`
  class; the CSS also kills `pointer-events` on the anchor so back-side nodes
  aren't hoverable.
- Clamp `renderer().setPixelRatio(min(devicePixelRatio, 1.75))` — the single
  biggest mobile GPU saver.
- Texture failure fallback: if `earth-dark.jpg` fails from both CDNs, skip the
  texture and style the bare sphere (`globeMaterial().color.set('#0d1b2e')` +
  `showGraticules(true)`) so failure still looks designed.
- `prefers-reduced-motion`: no auto-rotate, 300ms camera moves, no rings, dish
  renders pre-drawn (CSS media query + a JS flag read once at boot).

## Porting notes

- **React:** use `react-globe.gl` (same underlying lib) — `js/globe.js` config
  maps ~1:1 onto `<Globe>` props; `js/state.js` transfers nearly verbatim into
  a hook/store; keep the marker-element factory + class-toggling approach via
  the same `htmlElement` accessor.
- **Bundlers:** `import Globe from 'globe.gl'` and
  `import { feature } from 'topojson-client'` replace the UMD globals; the ESM
  dist of globe.gl expects `three` to be resolvable (fine under a bundler,
  which is exactly why the no-build version uses UMD).
- Design tokens (deep-space navy + cyan) are all CSS custom properties at the
  top of `styles.css` — restyle by swapping the token block.

## Verification

A Playwright driver (24 checks) exercised: veil lift, 36 markers, tooltip
show/hide, full click showcase (card, dish, count-up, marker states), ESC
close + camera return, region/country filter cascade + scope HUD + polygon
tint, planned-site card, auto-rotate resume, mobile bottom sheet,
reduced-motion, and blocked-texture fallback. Reproduce the gist: serve the
folder, click nodes/filters, and watch the console — it should stay clean
(zero errors, zero `[atlas]` name-mismatch warnings).
