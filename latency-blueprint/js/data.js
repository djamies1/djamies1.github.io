/* ============================================================
   data.js — single source of truth.

   ⚠ COMPLIANCE — READ BEFORE EDITING ⚠
   This sheet is generic physics: orbital altitudes and the
   latency / coverage they imply. Everything is textbook public
   knowledge and public industry figures (retrieved Jul 2026) —
   the lowest-risk sheet in the set. Amazon Leo appears only as
   "a LEO system at ~590 km." NOT derived from any Amazon internal
   document or export-controlled (ITAR/EAR) data.

   The diagram is SCHEMATIC (NTS): true altitudes span 590 km to
   35,786 km (≈60×), impossible to draw to scale, so heights are
   compressed and labelled. World units are arbitrary.
   ============================================================ */

/* Ground reference + the three orbit heights (drawn y, plus the public figures). */
export const GEOM = { groundY: 812, gx: 800 };
export const ORBITS = [
  { id: 'geo', label: 'GEO', alt: '35,786 km', y: 322, lat: '~500–700 ms', period: '24 h · fixed', foot: '~⅓ of Earth' },
  { id: 'meo', label: 'MEO', alt: '~8,000 km', y: 486, lat: '~120–150 ms', period: '~2–12 h', foot: 'regional' },
  { id: 'leo', label: 'LEO', alt: '~590 km',   y: 660, lat: '~20–40 ms',   period: '~90–120 min', foot: 'a small cell' },
];

/* Camera presets: world point (px,py) centered at sheet (800,500) at zoom z. */
export const CAM = {
  full:   { px: 800, py: 566, z: 0.90 },   // whole diagram (recap)
  alt:    { px: 800, py: 552, z: 0.98 },   // the altitude ladder
  lat:    { px: 800, py: 540, z: 1.02 },   // the signal paths (ground → orbit)
  foot:   { px: 800, py: 640, z: 0.88 },   // the coverage cones (wide GEO)
  motion: { px: 800, py: 662, z: 1.5 },    // LEO races overhead
  many:   { px: 800, py: 700, z: 1.16 },   // the LEO fleet + overlapping cells
  scale:  { px: 800, py: 772, z: 1.18 },   // the latency scale in context
};

export const SCENES = [
  { id: 'alt',    t: [0,    14.5],  title: 'Three heights',        panel: 1 },
  { id: 'lat',    t: [14.5, 29.0],  title: 'Distance is delay',    panel: 2 },
  { id: 'foot',   t: [29.0, 43.5],  title: 'The trade-off',        panel: 3 },
  { id: 'motion', t: [43.5, 58.0],  title: 'Low means fast',       panel: 4 },
  { id: 'many',   t: [58.0, 73.0],  title: 'So you need many',     panel: 5 },
  { id: 'scale',  t: [73.0, 86.5],  title: 'Where LEO sits',       panel: 6 },
  { id: 'recap',  t: [86.5, 100],   title: 'Why low orbit',        panel: 7 },
];

export const SCROLL_VH = 9.5;

export const PANELS = [
  {
    eyebrow: 'WHY LOW EARTH ORBIT',
    title: 'Close beats far',
    rows: [
      ['The idea', 'Fly low → answer fast'],
      ['The catch', 'Low → small + moving'],
      ['Shown', 'Public physics only'],
    ],
    note: 'Why satellite internet moved to low orbit — and what it costs you to be there. Generic orbital physics; Amazon Leo appears only as a LEO system at ~590 km.',
  },
  {
    eyebrow: 'ALTITUDE',
    title: 'Three heights',
    rows: [
      ['LEO', '~590 km'],
      ['MEO', '~8,000 km'],
      ['GEO', '35,786 km'],
    ],
    note: 'Satellites orbit at very different heights. Low Earth orbit is a few hundred kilometres up; geostationary orbit is nearly 36,000 km — about sixty times higher. That gap sets everything else.',
  },
  {
    eyebrow: 'LATENCY',
    title: 'Distance is delay',
    rows: [
      ['LEO', '~20–40 ms'],
      ['MEO', '~120–150 ms'],
      ['GEO', '~500–700 ms'],
    ],
    note: 'Radio travels at the speed of light, so the round-trip delay is set by distance. From low orbit it is tens of milliseconds; from geostationary orbit it is half a second or more — the difference between snappy and sluggish.',
  },
  {
    eyebrow: 'FOOTPRINT',
    title: 'The trade-off',
    rows: [
      ['GEO', 'sees ~⅓ of Earth'],
      ['LEO', 'sees a small cell'],
      ['Higher', 'wider view'],
    ],
    note: 'The catch: the higher you are, the more of Earth you can see. One geostationary satellite covers about a third of the planet; a low satellite sees only a small patch beneath it.',
  },
  {
    eyebrow: 'MOTION',
    title: 'Low means fast',
    rows: [
      ['LEO period', '~90–120 min'],
      ['GEO period', '24 h (fixed)'],
      ['Overhead', 'LEO races past'],
    ],
    note: 'Low satellites also move fast — a full orbit every hour and a half or so — racing across the sky. A geostationary satellite circles once a day, matching Earth’s spin, so it appears to hang still.',
  },
  {
    eyebrow: 'COVERAGE',
    title: 'So you need many',
    rows: [
      ['Each cell', 'Small'],
      ['And', 'Always moving'],
      ['Answer', 'Thousands of satellites'],
    ],
    note: 'A small patch that is always moving means no single low satellite can cover you for long. The fix is a constellation — thousands of satellites and packed, overlapping cells so one is always overhead.',
  },
  {
    eyebrow: 'IN CONTEXT',
    title: 'Where LEO sits',
    rows: [
      ['City fibre', '~5 ms'],
      ['LEO', '~20–40 ms'],
      ['GEO', '~500–700 ms'],
    ],
    note: 'On a latency scale, low orbit lands close to terrestrial broadband and well under the ~100 ms where delay starts to feel real — while geostationary sits far out past it. That is the whole point of going low.',
  },
  {
    eyebrow: 'WHY LEO',
    title: 'Close, but many',
    rows: [
      ['Close', 'Low latency'],
      ['Small + moving', 'Many satellites'],
      ['The bet', 'Worth the fleet'],
    ],
    note: 'Low orbit buys low latency; the price is a small, fast-moving footprint that only a big constellation can cover. Modern LEO broadband is the bet that the speed is worth the fleet.',
  },
];

export const SPEC_TABLE = {
  caption: 'TABLE 1 — ORBITS COMPARED (PUBLIC PHYSICS)',
  head: ['Orbit', 'Altitude', 'Round-trip latency', 'Period · footprint'],
  rows: [
    ['LEO', '~590 km', '~20–40 ms', '~90–120 min · small cell'],
    ['MEO', '~8,000 km', '~120–150 ms', '~2–12 h · regional'],
    ['GEO', '35,786 km', '~500–700 ms', '24 h fixed · ~⅓ of Earth'],
    ['Reference', 'City fibre', '~5–20 ms', 'Terrestrial'],
    ['Threshold', '—', '~100 ms', 'Where delay starts to feel real'],
  ],
};

export const COMPONENT_NOTES = [
  { tag: 'ALTITUDE', title: 'Three orbital regimes', body: 'Low Earth orbit (LEO) is a few hundred kilometres up (modern broadband systems ~340–630 km); medium Earth orbit (MEO) spans a few thousand to ~20,000 km; geostationary orbit (GEO) is at 35,786 km, where a 24-hour period matches Earth’s rotation so the satellite appears fixed. Amazon Leo is a LEO system at ~590 km.' },
  { tag: 'LATENCY', title: 'Distance sets delay', body: 'Radio waves travel at the speed of light (~300,000 km/s), so latency is governed by path length. A round trip to LEO is ~20–40 ms; to GEO, ~500–700 ms. For interactive use — video calls, gaming, cloud apps — anything under ~100 ms feels responsive, which is why LEO is transformative for satellite broadband.' },
  { tag: 'FOOTPRINT', title: 'Coverage vs altitude', body: 'The higher the orbit, the larger the area a satellite can see. One GEO satellite covers roughly a third of Earth (three cover almost all of it, minus the poles); a LEO satellite sees only a small cell beneath it. Low orbit trades wide coverage for low latency.' },
  { tag: 'CONSTELLATION', title: 'Why so many', body: 'A LEO satellite’s cell is small and it orbits every ~90–120 minutes, racing across the sky, so it can only serve any given user for minutes at a time. Continuous service therefore needs a constellation — hundreds to thousands of satellites with overlapping cells so a fresh one is always overhead as the last one sets.' },
];

export const PROVENANCE =
  'COMPILED FROM PUBLIC / TEXTBOOK PHYSICS AND PUBLIC INDUSTRY FIGURES — RETRIEVED JUL 2026.<br>' +
  'ORBITAL ALTITUDES, LATENCIES AND COVERAGE ARE GENERIC PUBLIC KNOWLEDGE. AMAZON LEO APPEARS ONLY AS A LEO SYSTEM AT ~590 km. NOT DERIVED FROM ANY AMAZON INTERNAL DOCUMENT OR EXPORT-CONTROLLED (ITAR/EAR) DATA. DIAGRAM IS SCHEMATIC / NOT TO SCALE (ALTITUDES COMPRESSED). FOR FAMILIARIZATION ONLY.';
