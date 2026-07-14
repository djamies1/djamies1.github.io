/* ============================================================
   data.js — single source of truth.
   Every string, figure, camera preset and explode offset lives
   here so content review (and future edits) touch one file.

   ⚠ COMPLIANCE — READ BEFORE EDITING ⚠
   Everything in this file is compiled SOLELY from public sources
   (Amazon press/blog posts, FCC filings, eoPortal, mainstream
   reporting — retrieved Jul 2026). The spacecraft geometry is a
   GENERIC LEO broadband satellite, drawn NTS (not to scale).
   It is NOT derived from, informed by, or checked against any
   Amazon internal schematic, document, or export-controlled
   (ITAR/EAR) technical data. Keep it that way: never add a
   figure here without a public citation in PROVENANCE.

   World units are arbitrary (sheet is NTS). Craft axis x=800,
   wing tip y≈132, nadir deck y≈806, Earth arc near y≈900.
   ============================================================ */

/* Camera presets: world point (px,py) centered at sheet (800,500) at zoom z. */
export const CAM = {
  full:     { px: 800, py: 500, z: 1.0 },
  bus:      { px: 800, py: 640, z: 2.0 },
  array:    { px: 688, py: 772, z: 2.05 },  // nadir deck + DETAIL B inset
  oisl:     { px: 800, py: 420, z: 1.15 },  // wide: ghost neighbors in frame
  avionics: { px: 764, py: 648, z: 2.55 },
  power:    { px: 782, py: 318, z: 1.75 },  // wing + sun vector
  prop:     { px: 972, py: 608, z: 2.05 },  // thruster flank + DETAIL A inset
  exploded: { px: 800, py: 468, z: 0.78 },
};

/* Full exploded-view offsets (world units). `groups` take a y lift;
   `parts` carry x/y/rotation for the laterally-extracted modules.
   Home = all zeros → reassembly is a tween back to 0. */
export const EXPLODE = {
  groups: {
    'asm-wing': -130,
    'asm-bus': 0,
    'asm-nadir': 112,
  },
  parts: {
    'av-stack': { x: -185, y: 0,   rotation: 0 },
    'oisl-l':   { x: -95,  y: -12, rotation: 0 },
    'oisl-r':   { x: 95,   y: -12, rotation: 0 },
    'prop-mod': { x: 150,  y: -30, rotation: 0 },
  },
};

/* Scenes: label = timeline label; t = [start,end] on a 0–100 timeline;
   rail/aria naming; panel = index into PANELS. */
export const SCENES = [
  { id: 'draw',     t: [0, 14],   title: 'General arrangement',  panel: 0 },
  { id: 'bus',      t: [14, 25],  title: 'Bus & structure',      panel: 1 },
  { id: 'array',    t: [25, 38],  title: 'Ka-band phased array', panel: 2 },
  { id: 'oisl',     t: [38, 49],  title: 'Optical mesh links',   panel: 3 },
  { id: 'avionics', t: [49, 59],  title: 'Avionics — Prometheus', panel: 4 },
  { id: 'power',    t: [59, 70],  title: 'Power & solar wing',   panel: 5 },
  { id: 'prop',     t: [70, 82],  title: 'Propulsion & ADCS',    panel: 6 },
  { id: 'exploded', t: [82, 100], title: 'Full breakdown',       panel: 7 },
];

/* Scroll length of the pinned stage, in viewport-heights. */
export const SCROLL_VH = 9;

export const PANELS = [
  {
    eyebrow: 'SHEET 1 · GENERAL ARRANGEMENT',
    title: 'Amazon Leo satellite',
    rows: [
      ['Class', 'LEO broadband'],
      ['Design life', '7 years'],
      ['Mass', '~540–570 kg (est.)'],
      ['Orbit shells', '590 / 610 / 630 km'],
      ['Disposal', 'Fully demisable'],
    ],
    note: 'A generic representation from public figures only — real dimensions and layout aren’t public, so this sheet is deliberately NTS.',
  },
  {
    eyebrow: 'SCENE 01 · BUS & STRUCTURE',
    title: 'Spacecraft bus',
    rows: [
      ['Form', 'Trapezoidal bus'],
      ['Brightness', 'Dielectric mirror film'],
      ['Deployment', 'Wax-actuated releases'],
      ['Thermal', 'Radiators (generic)'],
    ],
    note: 'The mirror film scatters sunlight away from Earth so the satellite appears dimmer to ground-based astronomy.',
  },
  {
    eyebrow: 'SCENE 02 · KA-BAND PHASED ARRAY',
    title: 'Phased-array antennas',
    rows: [
      ['Band', 'Ka'],
      ['Receive', '18–20 GHz'],
      ['Transmit', '28–30 GHz'],
      ['Aperture', 'Ø ~30 cm'],
      ['Steering', 'Electronic — no gimbals'],
      ['Peak service', '1 Gbps (Leo Ultra)'],
    ],
    note: 'Hundreds of tiny elements shift phase to steer beams instantly between users — no moving parts. Antenna count shown is representative.',
  },
  {
    eyebrow: 'SCENE 03 · OPTICAL MESH',
    title: 'Inter-satellite links',
    rows: [
      ['Link', 'Infrared laser'],
      ['Rate', 'Up to 100 Gbps'],
      ['Reach', 'Up to ~2,600 km'],
      ['Role', 'Orbital mesh backbone'],
    ],
    note: 'When no gateway is in view, traffic hops satellite-to-satellite across the mesh until one is — moving data at light speed in vacuum.',
  },
  {
    eyebrow: 'SCENE 04 · AVIONICS',
    title: 'Prometheus SoC',
    rows: [
      ['Processor', 'Custom Amazon silicon'],
      ['Throughput', 'Up to 1 Tbps / satellite'],
      ['Combines', 'Base station + modem + backhaul'],
      ['Fleet-wide', 'Same chip family on the ground'],
    ],
    note: 'One ASIC design runs the satellites, the customer terminals and the gateway antennas — the whole network speaks the same silicon.',
  },
  {
    eyebrow: 'SCENE 05 · POWER',
    title: 'Solar wing',
    rows: [
      ['Array', 'Deployable, sun-tracking'],
      ['Storage', 'Battery module'],
      ['Eclipse ops', 'Battery-powered'],
      ['Detail', 'Cell layout representative'],
    ],
    note: 'The wing articulates to track the Sun through each ~95-minute orbit; batteries carry the load through Earth’s shadow.',
  },
  {
    eyebrow: 'SCENE 06 · PROPULSION & ADCS',
    title: 'Krypton Hall thruster',
    rows: [
      ['Thruster', 'Hall-effect (in-house)'],
      ['Propellant', 'Krypton'],
      ['Station-keeping', 'Within ±9 km'],
      ['Duties', 'Raise · maintain · deorbit'],
      ['Attitude', 'Star trackers · RWs · GNSS'],
    ],
    note: 'Electric propulsion raises the orbit, dodges debris and — at end of life — deorbits the craft for a controlled, complete burn-up.',
  },
  {
    eyebrow: 'SCENE 07 · FULL BREAKDOWN',
    title: 'Seven assemblies',
    rows: [
      ['Data', 'Public sources only'],
      ['Geometry', 'Generic — NTS'],
      ['Derived from', 'No internal material'],
    ],
    note: 'Hit replay — or scroll back — to run the breakdown again.',
  },
];

/* Exploded money-shot labels. ax/ay are anchors in EXPLODED coordinates
   (base geometry + EXPLODE offsets). side L: elbow→col (text-end);
   side R: elbow→col (text-start). col overrides the default 560/1040. */
export const XLABELS = [
  { id: 'xl-wing',  side: 'L', ax: 725,  ay: 150, ex: 640,  ey: 150, t: 'SOLAR WING',          s: 'DEPLOYABLE · SUN-TRACKING' },
  { id: 'xl-adcs',  side: 'R', ax: 846,  ay: 504, ex: 986,  ey: 462, t: 'ATTITUDE CONTROL',    s: 'STAR TRACKERS · RWs · GNSS' },
  { id: 'xl-bus',   side: 'R', ax: 904,  ay: 668, ex: 986,  ey: 680, t: 'BUS STRUCTURE',       s: 'TRAPEZOIDAL · MIRROR FILM' },
  { id: 'xl-av',    side: 'L', ax: 543,  ay: 640, ex: 526,  ey: 640, t: 'AVIONICS — PROMETHEUS', col: 520, s: 'UP TO 1 TBPS PER SATELLITE' },
  { id: 'xl-nadir', side: 'L', ax: 700,  ay: 892, ex: 622,  ey: 916, t: 'PHASED-ARRAY DECK',   s: 'KA-BAND · Ø ~30 CM TYP' },
  { id: 'xl-oisl',  side: 'R', ax: 1028, ay: 566, ex: 1090, ey: 600, t: 'OISL TERMINALS', col: 1150, s: '100 GBPS LASER MESH' },
  { id: 'xl-prop',  side: 'R', ax: 1094, ay: 528, ex: 1130, ey: 500, t: 'PROPULSION MODULE', col: 1150, s: 'KRYPTON HALL-EFFECT' },
];

/* Outro: full spec table + per-component prose (also the a11y content). */
export const SPEC_TABLE = {
  caption: 'TABLE 1 — AMAZON LEO SATELLITE, PUBLIC FIGURES (GENERIC REPRESENTATION)',
  head: ['Item', 'Value', 'Remarks'],
  rows: [
    ['Satellite class', 'LEO broadband', 'Ka-band user/gateway links + optical crosslinks'],
    ['Mass', '~540–570 kg', 'Third-party estimate from launch masses — not official'],
    ['Design life', '7 years', 'Then controlled deorbit; fully demisable on reentry'],
    ['Phased array', 'Ka · Rx 18–20 GHz · Tx 28–30 GHz', 'Ø ~30 cm apertures, electronically steered'],
    ['Optical links', 'Up to 100 Gbps per link', 'Infrared lasers, links to ~2,600 km'],
    ['Processing', 'Up to 1 Tbps per satellite', 'Prometheus custom SoC'],
    ['Propulsion', 'Krypton Hall-effect thruster', 'In-house design; station-keeping within ±9 km'],
    ['Attitude control', 'Star trackers, sun sensors, GNSS, reaction wheels, magnetorquers', 'Auto-detumble after deployment'],
    ['Brightness mitigation', 'Dielectric mirror film', 'Scatters sunlight away from ground observers'],
    ['Constellation', '3,236 satellites · 98 planes', 'Shells at 590 / 610 / 630 km; ~400 in orbit Jul 2026'],
    ['Rides to orbit', 'Atlas V · Falcon 9 · Ariane 6 · New Glenn · Vulcan', 'Multi-provider launch strategy'],
  ],
};

export const COMPONENT_NOTES = [
  { tag: 'BUS', title: 'Bus & structure', body: 'Amazon describes a trapezoidal bus that packs efficiently around the launch dispenser. The nadir side carries a dielectric mirror film that scatters sunlight away from Earth, dimming the satellite for ground-based astronomy. Wax-actuated release mechanisms free the deployables once safely in orbit.' },
  { tag: 'ARRAY', title: 'Ka-band phased array', body: 'The satellite talks to terminals and gateways through electronically-steered Ka-band phased arrays — roughly 30 cm apertures receiving at 18–20 GHz and transmitting at 28–30 GHz. Beams re-point in microseconds with no moving parts. The antenna count and placement drawn here are representative; the real layout is not public.' },
  { tag: 'OISL', title: 'Optical inter-satellite links', body: 'Infrared laser terminals link each satellite to its neighbors at up to 100 Gbps over distances up to ~2,600 km, forming a mesh network in orbit. Traffic can cross the mesh until a satellite is in view of a ground gateway.' },
  { tag: 'AVIONICS', title: 'Prometheus SoC', body: 'Amazon’s custom system-on-chip combines the jobs of a 5G base station, a 5G modem and a microwave backhaul link in one ASIC, processing up to a terabit per second on each satellite. The same silicon family runs the customer terminals and gateway antennas.' },
  { tag: 'POWER', title: 'Solar wing & batteries', body: 'A deployable, sun-tracking solar array charges the battery module that carries the spacecraft through each eclipse. Cell counts, wing dimensions and battery chemistry are not public — the wing drawn here is a generic representation.' },
  { tag: 'PROPULSION', title: 'Krypton Hall-effect thruster', body: 'An in-house Hall-effect thruster ionizes krypton and accelerates it electrically — low thrust, high efficiency. It raises the satellite from drop-off to its working shell, holds station within ±9 km, dodges debris, and executes the end-of-life deorbit burn-down.' },
  { tag: 'ADCS', title: 'Attitude control', body: 'Star trackers, sun sensors and GNSS receivers tell the satellite where it is and where it points; reaction wheels and magnetorquers turn and steady it. After separation the satellites auto-detumble — the standard toolkit of modern LEO spacecraft, drawn here generically.' },
];

export const PROVENANCE =
  'GENERIC REPRESENTATION — COMPILED SOLELY FROM PUBLIC SOURCES: AMAZON LEO / PROJECT KUIPER PRESS & BLOG POSTS · FCC FILINGS · EOPORTAL · WIKIPEDIA · TRADE PRESS — RETRIEVED JUL 2026.<br>' +
  'NOT DERIVED FROM ANY AMAZON INTERNAL SCHEMATIC, DOCUMENT, OR EXPORT-CONTROLLED (ITAR/EAR) TECHNICAL DATA. GEOMETRY IS NOT TO SCALE AND NOT FOR ENGINEERING USE. DRAWN FOR FAMILIARIZATION ONLY.';
