/* ============================================================
   data.js — single source of truth.
   Every string, figure and camera preset lives here so content
   review (and future edits) touch one file.

   ⚠ COMPLIANCE — READ BEFORE EDITING ⚠
   Everything in this file is compiled SOLELY from public sources
   for BOTH operators (FCC/ITU filings, Amazon & SpaceX press,
   mainstream/trade reporting, analyst estimates — retrieved Jul
   2026). It is a neutral, factual public comparison.
   It is NOT derived from, informed by, or checked against any
   Amazon internal document or export-controlled (ITAR/EAR) data,
   and uses no company logos or branding. Never add a figure
   without a public citation in PROVENANCE. Figures move fast —
   the sheet is dated "as of Jul 2026".

   The layout is SCHEMATIC (NTS): a two-column drafting comparison,
   AMAZON LEO (left) vs STARLINK (right). World units are arbitrary.
   ============================================================ */

/* Layout constants shared by drawing.js (draws the table) and the camera. */
export const GEOM = {
  dividerX: 800,
  headerY: 170,
  rowY0: 312, rowGap: 128,     // rows at 312, 440, 568, 696, 824
  leoX: 744,                    // Amazon Leo values: right-aligned toward the divider
  slX: 856,                     // Starlink values: left-aligned from the divider
};

/* Comparison rows (top → bottom). leo = cyan (the set's hero), sl = plain ink.
   mesh:true tints the row amber — the one dimension where the two converge. */
export const ROWS = [
  { id: 'con',    dim: 'CONSTELLATION',        leo: ['3,236 satellites', '3 shells · 590–630 km · 98 planes'], sl: ['~9,000 up, toward 42,000', 'lower shells · 340–570 km'] },
  { id: 'spec',   dim: 'SPECTRUM & TERMINALS', leo: ['Ka-band user links', 'Nano / Pro / Ultra — up to 1 Gbps'], sl: ['Ku-band user links', 'dish + Direct-to-Cell to phones'] },
  { id: 'mesh',   dim: 'OPTICAL MESH',         leo: ['laser crosslinks', '~100 Gbps per link'], sl: ['laser crosslinks', '~200 Gbps per link'], mesh: true },
  { id: 'ground', dim: 'TO THE GROUND',        leo: ['gateways → nearest AWS Region', 'native cloud on-ramp'], sl: ['own gateway network', '+ fibre backhaul'] },
  { id: 'launch', dim: 'LAUNCH',               leo: ['buys launch · 5 providers', 'Atlas V·Vulcan·New Glenn·Ariane 6·Falcon 9'], sl: ['flies its own rockets', 'Falcon 9 / Starship — vertical'] },
];

/* Camera presets: world point (px,py) centered at sheet (800,500) at zoom z.
   The comparison is a vertical table; scenes pan DOWN it row by row. */
export const CAM = {
  full:   { px: 800, py: 512, z: 0.84 },   // the whole table (thesis wide + money shot)
  thesis: { px: 800, py: 250, z: 1.04 },   // the two column headers + the bet
  con:    { px: 800, py: 322, z: 1.5 },    // row 1
  spec:   { px: 800, py: 448, z: 1.5 },    // row 2
  mesh:   { px: 800, py: 574, z: 1.5 },    // row 3 (amber)
  ground: { px: 800, py: 700, z: 1.5 },    // row 4
  launch: { px: 800, py: 820, z: 1.5 },    // row 5
};

export const SCENES = [
  { id: 'thesis', t: [0,    14.5],  title: 'Two bets, one idea',    panel: 1 },
  { id: 'con',    t: [14.5, 29.0],  title: 'Constellation',         panel: 2 },
  { id: 'spec',   t: [29.0, 43.5],  title: 'Spectrum & terminals',  panel: 3 },
  { id: 'mesh',   t: [43.5, 58.0],  title: 'Where they agree',      panel: 4 },
  { id: 'ground', t: [58.0, 73.0],  title: 'The big divergence',    panel: 5 },
  { id: 'launch', t: [73.0, 86.5],  title: 'Buy vs build',          panel: 6 },
  { id: 'recap',  t: [86.5, 100],   title: 'Same sky, two bets',    panel: 7 },
];

export const SCROLL_VH = 9.5;

export const PANELS = [
  {
    eyebrow: 'LEO BROADBAND · COMPARISON',
    title: 'Two architectures',
    rows: [
      ['Left', 'Amazon Leo'],
      ['Right', 'Starlink'],
      ['Shown', 'Public sources · both'],
    ],
    note: 'A neutral, public side-by-side of the two big low-orbit broadband networks — same idea, two very different bets. No internal or proprietary data.',
  },
  {
    eyebrow: 'TWO APPROACHES',
    title: 'Two bets, one idea',
    rows: [
      ['Amazon', 'AWS + enterprise'],
      ['SpaceX', 'Scale + owns the rocket'],
      ['Both', 'Low-orbit broadband'],
    ],
    note: 'Same goal — fast internet from low orbit — reached two ways. Amazon leans on AWS and enterprise; SpaceX on sheer scale, a head start, and vertical integration. Figures as of Jul 2026.',
  },
  {
    eyebrow: 'CONSTELLATION',
    title: 'Size & altitude',
    rows: [
      ['Amazon Leo', '3,236 · 590–630 km'],
      ['Starlink', '~9,000 → 42,000 · lower'],
      ['Both', 'Low Earth orbit'],
    ],
    note: 'Starlink is far larger and flies lower; Amazon Leo is a leaner fleet across three defined shells. Both live in low orbit for the same reason — short distance, low latency.',
  },
  {
    eyebrow: 'SPECTRUM & TERMINALS',
    title: 'Bands & boxes',
    rows: [
      ['Amazon Leo', 'Ka · gigabit terminals'],
      ['Starlink', 'Ku · direct-to-cell'],
      ['Split', 'Enterprise vs mass-market'],
    ],
    note: 'Leo runs Ka-band with a gigabit-class enterprise terminal (Ultra); Starlink runs Ku-band and adds direct-to-cell to ordinary phones. Different bands, different customers.',
  },
  {
    eyebrow: 'OPTICAL MESH',
    title: 'Where they agree',
    rows: [
      ['Amazon Leo', 'laser mesh ~100 Gbps'],
      ['Starlink', 'laser mesh ~200 Gbps'],
      ['Both', 'Route in orbit'],
    ],
    note: 'This is the point of convergence: both stitch their satellites together with optical laser crosslinks and route traffic across the sky, cutting the number of ground stations each needs.',
  },
  {
    eyebrow: 'TO THE GROUND',
    title: 'The big divergence',
    rows: [
      ['Amazon Leo', 'into AWS'],
      ['Starlink', 'own network'],
      ['Why', 'Cloud-native vs owned'],
    ],
    note: 'The clearest difference. Leo’s gateways hand traffic straight into the nearest AWS Region — a native cloud on-ramp. Starlink runs its own gateway-and-fibre network end to end.',
  },
  {
    eyebrow: 'LAUNCH',
    title: 'Buy vs build',
    rows: [
      ['Amazon Leo', 'buys 5 providers'],
      ['Starlink', 'flies its own'],
      ['SpaceX edge', 'Vertical integration'],
    ],
    note: 'Amazon runs the largest commercial launch procurement ever, across five rocket families. SpaceX simply launches Starlink on its own Falcon 9 and Starship — controlling cost and cadence.',
  },
  {
    eyebrow: 'TWO BETS',
    title: 'Same sky, two bets',
    rows: [
      ['Amazon', 'AWS · cheaper terminals'],
      ['SpaceX', 'Scale · first mover'],
      ['Shown', 'Public comparison only'],
    ],
    note: 'Two credible paths to the same market: Amazon’s cloud-integrated, enterprise-first bet against SpaceX’s scale-and-speed, own-everything bet. A public snapshot as of Jul 2026 — the numbers keep moving.',
  },
];

export const SPEC_TABLE = {
  caption: 'TABLE 1 — LEO BROADBAND, PUBLIC COMPARISON (AS OF JUL 2026)',
  head: ['Dimension', 'Amazon Leo', 'Starlink'],
  rows: [
    ['Constellation', '3,236 sats · 3 shells 590–630 km · 98 planes', '~9,000 operational, toward 42,000 · 340–570 km'],
    ['User spectrum', 'Ka-band', 'Ku-band (+ direct-to-cell)'],
    ['Terminals', 'Nano / Pro / Ultra (to ~1 Gbps)', 'Standard dish; phones via D2C'],
    ['Inter-satellite', 'Optical, ~100 Gbps', 'Optical, ~200 Gbps'],
    ['Ground / backhaul', 'Gateways → nearest AWS Region', 'Own gateways + fibre'],
    ['Launch', 'Buys: Atlas V·Vulcan·New Glenn·Ariane 6·Falcon 9', 'Own: Falcon 9 / Starship (vertical)'],
    ['Status', 'Deploying · commercial mid-2026', 'Operational · ~10M+ subs · ~$11.4B 2025 rev'],
  ],
};

export const COMPONENT_NOTES = [
  { tag: 'AMAZON LEO', title: 'Amazon Leo (public)', body: 'Formerly Project Kuiper. FCC-authorized for 3,236 satellites across three shells (590/610/630 km); Ka-band user links; Nano/Pro/Ultra terminals up to ~1 Gbps; optical inter-satellite links (~100 Gbps); gateways route to the nearest AWS Region; launch bought across five rocket families. Deploying through 2026, commercial service targeted mid-2026.' },
  { tag: 'STARLINK', title: 'Starlink (public)', body: 'SpaceX’s constellation — roughly 9,000 operational satellites as of mid-2026 (authorized toward ~42,000) at lower shells (~340–570 km); Ku-band user links plus direct-to-cell; optical inter-satellite links (~200 Gbps); its own gateway-and-fibre network; launched on SpaceX’s own Falcon 9 and Starship. Operational with ~10M+ subscribers and ~$11.4B 2025 revenue (public/analyst figures).' },
  { tag: 'CONVERGE', title: 'Where they agree', body: 'Both are low-orbit (hundreds of km) broadband constellations that use optical laser crosslinks to form a mesh in space and reduce ground-station dependence. The core physics and the mesh approach are shared; the bets diverge on spectrum, terminals, ground integration and launch.' },
  { tag: 'DIVERGE', title: 'Where they diverge', body: 'Amazon’s bet is cloud-native and enterprise-first: Ka-band, a gigabit enterprise terminal, and gateways wired straight into AWS. SpaceX’s bet is scale and speed: a much larger fleet, a big first-mover subscriber base, direct-to-cell, and full vertical integration by launching on its own rockets.' },
];

export const PROVENANCE =
  'COMPILED SOLELY FROM PUBLIC SOURCES FOR BOTH OPERATORS: FCC/ITU FILINGS · AMAZON & SPACEX PRESS · TRADE PRESS & ANALYST ESTIMATES — RETRIEVED JUL 2026.<br>' +
  'A NEUTRAL PUBLIC COMPARISON. NOT DERIVED FROM ANY AMAZON INTERNAL DOCUMENT OR EXPORT-CONTROLLED (ITAR/EAR) DATA. NO COMPANY LOGOS OR BRANDING. FIGURES ARE APPROXIMATE AND MOVE QUICKLY (AS OF JUL 2026). SCHEMATIC / NOT TO SCALE. FOR FAMILIARIZATION ONLY.';
