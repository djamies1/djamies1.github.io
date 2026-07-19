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

/* Scenes drive the rail + progress bar. t = [start,end] as a 0–100 % of the
   VISIBLE run. The draw-on intro is pre-rolled (see START in timeline.js) so the
   widget lands already-drawn at the first component scene; scrolling pans into it.
   These % are the master timeline's scene bounds (14→100) remapped to 0→100.
   panel = index into PANELS. */
export const SCENES = [
  { id: 'bus',      t: [0, 12.8],    title: 'The satellite body',   panel: 1 },
  { id: 'array',    t: [12.8, 27.9], title: 'The antennas',         panel: 2 },
  { id: 'oisl',     t: [27.9, 40.7], title: 'Laser links in space', panel: 3 },
  { id: 'avionics', t: [40.7, 52.3], title: 'The onboard brain',    panel: 4 },
  { id: 'power',    t: [52.3, 65.1], title: 'Solar power',          panel: 5 },
  { id: 'prop',     t: [65.1, 79.1], title: 'Staying in orbit',     panel: 6 },
  { id: 'exploded', t: [79.1, 100],  title: 'Every part',           panel: 7 },
];

/* Scroll length of the pinned stage, in viewport-heights. */
export const SCROLL_VH = 9;

export const PANELS = [
  {
    eyebrow: 'AMAZON LEO · SATELLITE',
    title: 'Amazon Leo satellite',
    rows: [
      ['What it is', 'A broadband satellite'],
      ['Orbit', 'Low — about 600 km up'],
      ['Fleet', '3,236 satellites'],
    ],
    note: 'One of thousands of satellites that beam internet down to Earth. An illustration from public information only — real dimensions aren’t public, so it’s deliberately not to scale.',
  },
  {
    eyebrow: 'THE BODY',
    title: 'The satellite body',
    rows: [
      ['Shape', 'Packs tightly for launch'],
      ['Coating', 'Dims its glare for astronomers'],
      ['Life', 'About 7 years'],
    ],
    note: 'The main body holds everything together. A mirror-like film scatters sunlight away from Earth so the satellite is less visible to ground telescopes.',
  },
  {
    eyebrow: 'THE ANTENNAS',
    title: 'The antennas',
    rows: [
      ['How', 'Flat antennas, no dishes'],
      ['Aim by', 'Electronics — no motors'],
      ['Shown', 'Illustrative, not the real layout'],
    ],
    note: 'Flat antennas send and receive to customers and ground stations, aiming their beams electronically. The pattern drawn here is illustrative only.',
  },
  {
    eyebrow: 'IN ORBIT · LASER LINKS',
    title: 'Laser links in space',
    rows: [
      ['How', 'Laser beams between satellites'],
      ['Speed', 'Up to 100 Gbps per link'],
      ['Why', 'Reaches distant ground stations'],
    ],
    note: 'When no ground station is in view, a satellite passes traffic to its neighbours by laser — building a high-speed network across the sky at the speed of light.',
  },
  {
    eyebrow: 'THE BRAIN',
    title: 'The onboard brain',
    rows: [
      ['Runs on', 'Prometheus — Amazon’s chip'],
      ['Same chip', 'Across the whole network'],
      ['Handles', 'All the traffic onboard'],
    ],
    note: 'A custom Amazon chip called Prometheus runs the satellite — the same chip family used in the ground stations and customer terminals, so the whole network speaks one design.',
  },
  {
    eyebrow: 'POWER',
    title: 'Solar power',
    rows: [
      ['Power', 'A solar wing that tracks the Sun'],
      ['Storage', 'Batteries for the dark side'],
      ['Orbit', 'Circles Earth every ~95 min'],
    ],
    note: 'A solar wing turns to follow the Sun and charges batteries that carry the satellite through the shadow on the night side of each orbit.',
  },
  {
    eyebrow: 'STAYING IN ORBIT',
    title: 'Staying in orbit',
    rows: [
      ['Engine', 'A small electric thruster'],
      ['Jobs', 'Holds orbit · dodges debris'],
      ['End of life', 'Steers down to burn up'],
    ],
    note: 'A gentle electric thruster nudges the satellite: raising its orbit, holding position, avoiding debris, and — at the end of life — steering it down to burn up completely.',
  },
  {
    eyebrow: 'EVERY PART',
    title: 'Every part, laid out',
    rows: [
      ['Based on', 'Public information only'],
      ['Drawing', 'Not to scale'],
      ['Layout', 'Representative only'],
    ],
    note: 'Hit replay — or scroll back — to run it again.',
  },
];

/* Exploded money-shot labels. ax/ay are anchors in EXPLODED coordinates
   (base geometry + EXPLODE offsets). side L: elbow→col (text-end);
   side R: elbow→col (text-start). col overrides the default 560/1040. */
export const XLABELS = [
  { id: 'xl-wing',  side: 'L', ax: 725,  ay: 150, ex: 640,  ey: 150, t: 'SOLAR WING',       s: 'FOLLOWS THE SUN' },
  { id: 'xl-adcs',  side: 'R', ax: 846,  ay: 504, ex: 986,  ey: 462, t: 'POINTING CONTROL', s: 'KEEPS ANTENNAS ON TARGET' },
  { id: 'xl-bus',   side: 'R', ax: 904,  ay: 668, ex: 986,  ey: 680, t: 'THE BODY',         s: 'HOLDS IT TOGETHER' },
  { id: 'xl-av',    side: 'L', ax: 543,  ay: 640, ex: 526,  ey: 640, t: 'PROMETHEUS CHIP', col: 520, s: 'THE ONBOARD BRAIN' },
  { id: 'xl-nadir', side: 'L', ax: 700,  ay: 892, ex: 622,  ey: 916, t: 'THE ANTENNAS',     s: 'FLAT · REPRESENTATIVE LAYOUT' },
  { id: 'xl-oisl',  side: 'R', ax: 1028, ay: 566, ex: 1090, ey: 600, t: 'LASER LINKS', col: 1150, s: 'SATELLITE-TO-SATELLITE · 100 GBPS' },
  { id: 'xl-prop',  side: 'R', ax: 1094, ay: 528, ex: 1130, ey: 500, t: 'ELECTRIC THRUSTER', col: 1150, s: 'HOLDS ORBIT · AVOIDS DEBRIS' },
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
