/* ============================================================
   data.js — single source of truth.

   ⚠ COMPLIANCE — READ BEFORE EDITING ⚠
   Everything here is compiled SOLELY from public sources (FCC
   Kuiper authorization & milestone conditions, ULA/Arianespace/
   Blue Origin/SpaceX & Amazon launch announcements, public launch
   trackers and trade press — retrieved Jul 2026). Launch counts,
   cadence, the FCC deadlines and the deployment status are public
   record; the "actual" figure is from public trackers and is
   approximate. It is NOT derived from any Amazon internal document
   or export-controlled (ITAR/EAR) data. Never add a figure without
   a public citation in PROVENANCE.

   The chart is SCHEMATIC (NTS): a representative burn-up. World
   units are arbitrary; figures are approximate and move quickly.
   ============================================================ */

/* Chart geometry, shared by drawing.js and the hand-authored curves in index.html.
   XY(year) and YS(sats) below are the same maps used to place everything. */
export const CHART = {
  x0: 190, x1: 1430, y0: 720, yTop: 250,   // plot box (px)
  year0: 2024, year1: 2030,                 // x-axis span
  satMax: 3500,                             // y-axis top
  gate50: 1618, gate100: 3236,              // FCC milestones
};
export const XY = (year) => CHART.x0 + ((year - CHART.year0) / (CHART.year1 - CHART.year0)) * (CHART.x1 - CHART.x0);
export const YS = (sats) => CHART.y0 - (sats / CHART.satMax) * (CHART.y0 - CHART.yTop);

/* Public launch manifest (approximate; the original 2022 deal was ~83 launches). */
export const MANIFEST = [
  { v: 'Vulcan Centaur', n: '38',    who: 'ULA' },
  { v: 'Ariane 6',       n: '18',    who: 'Arianespace' },
  { v: 'New Glenn',      n: '12–27', who: 'Blue Origin' },
  { v: 'Falcon 9',       n: '13+',   who: 'SpaceX' },
  { v: 'Atlas V',        n: '9',     who: 'ULA · early' },
];

/* Camera presets: world point (px,py) centered at sheet (800,500) at zoom z. */
export const CAM = {
  full:   { px: 810, py: 500, z: 0.94 },   // whole chart (money shot)
  target: { px: 720, py: 336, z: 1.34 },   // the 3,236 goal line (top)
  clock:  { px: 900, py: 430, z: 1.3 },    // the deadline verticals + gates
  manif:  { px: 430, py: 430, z: 1.42 },   // the launch-manifest legend
  ramp:   { px: 560, py: 620, z: 1.5 },    // the cadence / rising curve
  gap:    { px: 760, py: 590, z: 1.6 },    // the required-vs-actual shortfall @ Jul 2026
  feeder: { px: 560, py: 760, z: 1.5 },    // Kirkland production feeder
};

export const SCENES = [
  { id: 'target', t: [0,    14.5],  title: 'The target: 3,236',     panel: 1 },
  { id: 'clock',  t: [14.5, 29.0],  title: 'Use it or lose it',     panel: 2 },
  { id: 'manif',  t: [29.0, 43.5],  title: 'The launch manifest',   panel: 3 },
  { id: 'ramp',   t: [43.5, 58.0],  title: 'Cadence building',      panel: 4 },
  { id: 'gap',    t: [58.0, 73.0],  title: 'Behind the line',       panel: 5 },
  { id: 'feeder', t: [73.0, 86.5],  title: 'Built in Kirkland',     panel: 6 },
  { id: 'recap',  t: [86.5, 100],   title: 'A race against time',   panel: 7 },
];

export const SCROLL_VH = 9.5;

export const PANELS = [
  {
    eyebrow: 'AMAZON LEO · DEPLOYMENT',
    title: 'Building the fleet',
    rows: [
      ['Goal', '3,236 satellites in orbit'],
      ['Against', 'A hard FCC clock'],
      ['Shown', 'Public launch record only'],
    ],
    note: 'How Amazon Leo gets built: the largest commercial launch procurement in history, racing a use-it-or-lose-it FCC deadline. Public figures only, approximate, as of Jul 2026.',
  },
  {
    eyebrow: 'THE TARGET',
    title: '3,236 satellites',
    rows: [
      ['Authorized', '3,236'],
      ['Shells', '3 (590–630 km)'],
      ['Status', 'Deploying'],
    ],
    note: 'The FCC licence is for 3,236 satellites across three shells. Getting them all up is the whole game — and the licence comes with deadlines attached.',
  },
  {
    eyebrow: 'THE CLOCK',
    title: 'Use it or lose it',
    rows: [
      ['Half up by', 'Jul 2026 (1,618)'],
      ['All up by', 'Jul 2029'],
      ['Rule', 'FCC NGSO milestone'],
    ],
    note: 'To stop operators warehousing orbital spectrum, the FCC requires 50% of a constellation deployed within 6 years and 100% within 9 — for Leo, half by mid-2026, all by 2029.',
  },
  {
    eyebrow: 'THE MANIFEST',
    title: 'The largest buy ever',
    rows: [
      ['Launches', '~83+'],
      ['Vehicles', '5 rocket families'],
      ['Lead', 'Vulcan (38) · Ariane 6 (18)'],
    ],
    note: 'Amazon booked the largest commercial launch procurement in history — across Vulcan Centaur, Ariane 6, New Glenn, Falcon 9 and (early) Atlas V — to move thousands of satellites fast.',
  },
  {
    eyebrow: 'THE RAMP',
    title: 'Cadence building',
    rows: [
      ['First production', '2025'],
      ['Apr 2026', '3 launches / 26 days'],
      ['Target', '20+ / yr → 30+ / yr'],
    ],
    note: 'Deployment starts slow and has to accelerate hard: from the first production launches in 2025 to a peak of three launches in under a month in Apr 2026, aiming for 20+ missions a year and beyond.',
  },
  {
    eyebrow: 'WHERE IT STANDS',
    title: 'Behind the line',
    rows: [
      ['Required by Jul 2026', '1,618 (50%)'],
      ['Actual (public)', '~300'],
      ['So', 'Extension requested'],
    ],
    note: 'As of mid-2026 the fleet is a few hundred satellites — well short of the 1,618 the milestone calls for — so Amazon has asked the FCC for more time, citing launch-vehicle availability. (Public trackers; approximate.)',
  },
  {
    eyebrow: 'THE FEEDER',
    title: 'Built in Kirkland',
    rows: [
      ['Rate', 'up to 5 / day'],
      ['Per year', '~1,000'],
      ['Role', 'Paces the launches'],
    ],
    note: 'The satellites are produced at Amazon’s Kirkland, WA factory at up to five per day — around a thousand a year at full rate. Production and launch capacity together set how fast the fleet can grow.',
  },
  {
    eyebrow: 'THE BUILD-OUT',
    title: 'A race against the clock',
    rows: [
      ['Fleet', 'toward 3,236'],
      ['Procurement', '~$10B+ committed'],
      ['Constraint', 'The FCC gates'],
    ],
    note: 'A multi-billion-dollar, multi-provider deployment racing a regulatory deadline — the whole build-out in one chart. Public figures only, approximate, as of Jul 2026.',
  },
];

export const SPEC_TABLE = {
  caption: 'TABLE 1 — AMAZON LEO DEPLOYMENT, PUBLIC FIGURES (APPROX, JUL 2026)',
  head: ['Item', 'Value', 'Remarks'],
  rows: [
    ['Authorized fleet', '3,236 satellites', 'FCC 2020 authorization'],
    ['FCC milestone 50%', '1,618 by Jul 2026', 'Use-it-or-lose-it condition'],
    ['FCC milestone 100%', '3,236 by Jul 2029', 'Extension requested'],
    ['Launch procurement', '~83+ launches, 5 families', 'Largest commercial buy in history'],
    ['— Vulcan / Ariane 6', '38 / 18', 'ULA / Arianespace'],
    ['— New Glenn / Falcon 9 / Atlas V', '12–27 / 13+ / 9', 'Blue Origin / SpaceX / ULA'],
    ['Cadence', 'Apr 2026: 3 launches / 26 d', 'Target 20+/yr, then 30+/yr'],
    ['Production', 'Up to 5 sats/day (~1,000/yr)', 'Kirkland, WA factory'],
    ['Capital', '~$10B+ committed', '+~$1B in 2026 (public reports)'],
  ],
};

export const COMPONENT_NOTES = [
  { tag: 'TARGET & CLOCK', title: 'The fleet and the deadline', body: 'Amazon Leo is FCC-authorized for 3,236 satellites. The authorization carries the standard NGSO milestones: 50% of the constellation (1,618 satellites) deployed within six years — by ~Jul 2026 — and 100% within nine years, ~Jul 2029. Missing them puts the licence at risk, so deployment is a race against the clock.' },
  { tag: 'MANIFEST', title: 'The launch manifest', body: 'To deploy quickly Amazon assembled the largest commercial launch procurement in history: ~83+ launches across five vehicle families — 38 Vulcan Centaur (ULA), 18 Ariane 6 (Arianespace), 12–27 New Glenn (Blue Origin), plus Falcon 9 (SpaceX) and early Atlas V (ULA). Figures are approximate and public.' },
  { tag: 'RAMP & GAP', title: 'Cadence vs the milestone', body: 'Production launches began in 2025 and cadence has been ramping — three launches in 26 days in Apr 2026, with a target of 20+ missions in 2026 and 30+ in 2027. As of mid-2026 public trackers put the fleet at a few hundred satellites, short of the 1,618 the 50% milestone requires, so Amazon has publicly sought an FCC extension citing launch-vehicle availability.' },
  { tag: 'FEEDER', title: 'Kirkland production', body: 'Satellites are built at Amazon’s full-rate factory in Kirkland, WA, at up to five per day (about a thousand a year). Together with launch capacity, production rate sets the ceiling on how fast the constellation can be completed. Amazon has publicly committed well over $10 billion to the programme.' },
];

export const PROVENANCE =
  'COMPILED SOLELY FROM PUBLIC SOURCES: FCC KUIPER AUTHORIZATION & MILESTONE CONDITIONS · ULA / ARIANESPACE / BLUE ORIGIN / SPACEX & AMAZON LAUNCH ANNOUNCEMENTS · PUBLIC LAUNCH TRACKERS · TRADE PRESS — RETRIEVED JUL 2026.<br>' +
  'LAUNCH COUNTS, CADENCE, FCC DEADLINES AND DEPLOYMENT STATUS ARE PUBLIC RECORD; THE "ACTUAL" FIGURE IS FROM PUBLIC TRACKERS AND IS APPROXIMATE. NOT DERIVED FROM ANY AMAZON INTERNAL DOCUMENT OR EXPORT-CONTROLLED (ITAR/EAR) DATA. BURN-UP CHART IS SCHEMATIC / NOT TO SCALE. FIGURES APPROXIMATE, AS OF JUL 2026. FOR FAMILIARIZATION ONLY.';
