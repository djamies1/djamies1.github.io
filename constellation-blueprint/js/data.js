/* ============================================================
   data.js — single source of truth.
   Every string, figure, camera preset and orbit position lives
   here so content review (and future edits) touch one file.

   ⚠ COMPLIANCE — READ BEFORE EDITING ⚠
   Everything in this file is compiled SOLELY from public sources
   (FCC Kuiper / Amazon Leo NGSO authorization & filings, Amazon
   press/blog posts, mainstream/trade reporting — retrieved Jul
   2026). Satellite counts, shell altitudes/inclinations, plane
   count and laser-link figures are public record.
   It is NOT derived from, informed by, or checked against any
   Amazon internal document or export-controlled (ITAR/EAR) data.
   Keep it that way: never add a figure without a public citation
   in PROVENANCE.

   The orbital geometry is SCHEMATIC (not to scale): the shell
   gaps and the Earth radius are exaggerated for legibility — in
   reality 590–630 km is a hair above a 6,371 km Earth. World
   units are arbitrary; the sheet is a drafting sheet, not an
   ephemeris.
   ============================================================ */

/* Fixed geometry, shared by drawing.js (draws it) and index.html
   (hand-authored parts reference the same numbers). Earth sits
   left-of-centre so the right margin can carry the shell table. */
export const GEOM = {
  cx: 560, cy: 540, R: 250,          // schematic Earth
  shells: [                          // r = drawn radius (NTS); alt/inc/n = public FCC figures
    { id: 's1', r: 288, alt: '590 km', inc: '33.0°', n: '1,156' },
    { id: 's2', r: 310, alt: '610 km', inc: '42.0°', n: '1,296' },
    { id: 's3', r: 332, alt: '630 km', inc: '51.9°', n: '784' },
  ],
  planes: { count: 9, rx: 332, ry: 116, tilt: 18 },   // the woven "cage" (schematic)
  geoR: 452,                         // far dashed GEO ring (NTS — really ~60× higher)
};

/* Hero cluster: six satellites on the upper-right limb, hand-placed so the
   coverage cone lands on the visible disk and the mesh reads cleanly. Positions
   are world px; links list index pairs (in-plane + cross-plane). Amber = OISL. */
export const CLUSTER = {
  sats: [
    { x: 752, y: 262 },   // 0 · hero (carries the coverage cone)
    { x: 651, y: 300 },   // 1 · aft, same plane
    { x: 843, y: 236 },   // 2 · fore, same plane
    { x: 704, y: 200 },   // 3 · adjacent plane, up
    { x: 826, y: 330 },   // 4 · adjacent plane, down
    { x: 918, y: 292 },   // 5 · next plane over
  ],
  links: [[0, 1], [0, 2], [0, 3], [0, 4], [2, 5], [4, 5], [3, 0]],
  sub: { x: 703, y: 336 },   // sub-satellite point (foot of the coverage cone) on the disk
  next: { x: 601, y: 372 },  // the next satellite's footprint centre (hand-off)
};

/* Camera presets: world point (px,py) centered at sheet (800,500) at zoom z.
   The system sits around Earth (560,540); scenes zoom INTO it in place. */
export const CAM = {
  full:   { px: 720, py: 524, z: 0.98 },   // whole system + shell table (money shot)
  leo:    { px: 588, py: 452, z: 1.12 },   // Earth + LEO shells + far GEO ring (scene 1)
  shells: { px: 520, py: 500, z: 1.06 },   // shells + the left-side shell callouts (scene 2)
  planes: { px: 560, py: 540, z: 1.14 },   // the plane cage, whole (scene 3)
  cover:  { px: 726, py: 316, z: 1.78 },   // hero sat + coverage cone to the disk (scene 4)
  mesh:   { px: 786, py: 288, z: 1.72 },   // the six-sat cluster + OISL mesh (scene 5)
  ground: { px: 556, py: 712, z: 1.62 },   // Earth surface + sparse gateways (scene 6)
};

/* Scenes drive the rail + progress bar. t = [start,end] as 0–100 % of the VISIBLE
   run. The draw-on intro is pre-rolled (START in timeline.js); the widget lands
   already-drawn at the first scene. panel = index into PANELS. */
export const SCENES = [
  { id: 'leo',    t: [0,    14.5],  title: 'Low Earth orbit',        panel: 1 },
  { id: 'shells', t: [14.5, 29.0],  title: 'Three shells, 3,236',    panel: 2 },
  { id: 'planes', t: [29.0, 43.5],  title: '98 orbital planes',      panel: 3 },
  { id: 'cover',  t: [43.5, 58.0],  title: 'Always one overhead',    panel: 4 },
  { id: 'mesh',   t: [58.0, 73.0],  title: 'A mesh of light',        panel: 5 },
  { id: 'ground', t: [73.0, 86.5],  title: 'Fewer ties to ground',   panel: 6 },
  { id: 'recap',  t: [86.5, 100],   title: 'One network in orbit',   panel: 7 },
];

/* Scroll length of the pinned stage, in viewport-heights. */
export const SCROLL_VH = 9.5;

/* Callout cards, one per scene (panel 0 is the authored overview — never shown;
   the widget lands on scene 1). Kept short so the card height barely shifts. */
export const PANELS = [
  {
    eyebrow: 'AMAZON LEO · CONSTELLATION',
    title: 'A network in orbit',
    rows: [
      ['What it is', '3,236 satellites, working as one'],
      ['How', 'Low orbit + laser crosslinks'],
      ['Shown', 'Public FCC / Amazon record only'],
    ],
    note: 'How thousands of low-orbit satellites and a mesh of laser links add up to a single global network. Built from public information only.',
  },
  {
    eyebrow: 'LOW EARTH ORBIT',
    title: 'Low, and fast',
    rows: [
      ['Leo orbit', '~590–630 km up'],
      ['Old way (GEO)', '35,786 km up'],
      ['Why it matters', '~20–40 ms, not ~600 ms'],
    ],
    note: 'Amazon Leo flies low — a few hundred kilometres up, not the 35,786 km of a traditional geostationary satellite. Short distance means low latency, but each satellite sees only a small patch of Earth.',
  },
  {
    eyebrow: 'THE CONSTELLATION',
    title: 'Three shells',
    rows: [
      ['590 km · 33.0°', '1,156 satellites'],
      ['610 km · 42.0°', '1,296 satellites'],
      ['630 km · 51.9°', '784 satellites'],
    ],
    note: 'The fleet is split across three altitude shells at rising inclinations, so coverage reaches from the equator toward the poles. Together: 3,236 satellites, per the FCC authorization.',
  },
  {
    eyebrow: 'ORBITAL PLANES',
    title: '98 planes',
    rows: [
      ['Planes', '98, evenly spread'],
      ['Per plane', 'A string of satellites'],
      ['Effect', 'A moving lattice over Earth'],
    ],
    note: 'The satellites ride in 98 orbital planes. Each plane is a ring of satellites; the rings are spaced around Earth so the whole sky stays evenly filled as everything orbits.',
  },
  {
    eyebrow: 'COVERAGE',
    title: 'Always one overhead',
    rows: [
      ['Each satellite', 'Lights a cell below it'],
      ['Cells overlap', 'No gaps between them'],
      ['As it moves', 'Hand off to the next'],
    ],
    note: 'A single low satellite only covers a small cell, so the cells are packed to overlap. As one satellite drops toward the horizon your link hands off to the next rising one — seamlessly.',
  },
  {
    eyebrow: 'OPTICAL MESH',
    title: 'A mesh of light',
    rows: [
      ['Between sats', 'Infrared laser links'],
      ['Each link', 'Up to ~100 Gbps'],
      ['Vs fibre', '~30% faster over distance'],
    ],
    note: 'Satellites talk to their neighbours with lasers, forming a mesh in space. Data can cross the constellation without touching the ground — and light in vacuum beats light in glass by about 30%.',
  },
  {
    eyebrow: 'GROUND CONTACT',
    title: 'Fewer ties to ground',
    rows: [
      ['Mesh routes', 'Traffic in orbit'],
      ['So gateways', 'Can be sparse'],
      ['Reach', 'Far from any ground station'],
    ],
    note: 'Because the mesh carries traffic between satellites, the network needs far fewer ground stations. A user with no gateway nearby is still served — the data rides the lasers to one that is.',
  },
  {
    eyebrow: 'ONE NETWORK',
    title: 'One network in orbit',
    rows: [
      ['Shells', '3, from 590–630 km'],
      ['Satellites', '3,236, in 98 planes'],
      ['Bound by', 'Laser crosslinks'],
    ],
    note: 'Thousands of satellites, three shells, ninety-eight planes, stitched together by laser light into a single moving network — closer, and so faster, than anything in high orbit.',
  },
];

/* Appendix (also the a11y content). Not rendered in the embeddable widget, but
   ui.js imports it — keep it exported. Every figure is public and cited. */
export const SPEC_TABLE = {
  caption: 'TABLE 1 — AMAZON LEO CONSTELLATION, PUBLIC FIGURES',
  head: ['Item', 'Value', 'Remarks'],
  rows: [
    ['Total satellites', '3,236', 'FCC authorization (2020)'],
    ['Shell 1', '1,156 sats · 590 km · 33.0°', 'Lower / lower-inclination'],
    ['Shell 2', '1,296 sats · 610 km · 42.0°', 'Mid'],
    ['Shell 3', '784 sats · 630 km · 51.9°', 'Higher latitudes'],
    ['Orbital planes', '98', 'Per public filing'],
    ['Deployment milestone', '50% (1,618) by Jul 2026', 'FCC condition; 100% by 2029'],
    ['Inter-satellite links', 'Optical (~1550 nm)', 'Up to ~100 Gbps; tested ~1,000 km'],
    ['Latency (LEO vs GEO)', '~20–40 ms vs ~500–700 ms', 'Public physics; GEO = 35,786 km'],
  ],
};

export const COMPONENT_NOTES = [
  { tag: 'SHELLS', title: 'Three orbital shells', body: 'Amazon Leo (formerly Project Kuiper) is authorized for 3,236 satellites across three shells: 1,156 at 590 km (33.0°), 1,296 at 610 km (42.0°) and 784 at 630 km (51.9°). Rising inclination extends coverage from equatorial toward higher latitudes. Altitudes are a few hundred km — "low Earth orbit" — versus 35,786 km for a geostationary satellite.' },
  { tag: 'PLANES', title: 'Planes and coverage', body: 'The satellites are distributed across 98 orbital planes. Each plane is a ring of satellites; a low satellite covers only a small ground cell, so cells are packed to overlap and users hand off from a setting satellite to a rising one. The result is continuous coverage from a constantly moving lattice.' },
  { tag: 'OPTICAL', title: 'Optical inter-satellite mesh', body: 'Satellites connect to neighbours with infrared laser terminals (optical inter-satellite links, ~1550 nm) at up to ~100 Gbps per link, tested over roughly 1,000 km. This forms a mesh in orbit: traffic can route satellite-to-satellite without a ground hop, and light through vacuum travels ~30% faster than through fibre. Fewer ground stations are then required.' },
  { tag: 'LATENCY', title: 'Why low orbit', body: 'Distance sets the floor on latency. A geostationary satellite sits 35,786 km up, giving ~500–700 ms round trips; a Leo satellite a few hundred km up gives ~20–40 ms. The trade is footprint: each low satellite covers far less ground, which is why a large constellation is needed for continuous global service.' },
];

export const PROVENANCE =
  'COMPILED SOLELY FROM PUBLIC SOURCES: FCC KUIPER/AMAZON LEO NGSO AUTHORIZATION & FILINGS · AMAZON PRESS & BLOG POSTS (OISL / AWS) · TRADE PRESS — RETRIEVED JUL 2026.<br>' +
  'SATELLITE COUNTS, SHELL ALTITUDES/INCLINATIONS, PLANE COUNT AND LASER-LINK FIGURES ARE PUBLIC RECORD. NOT DERIVED FROM ANY AMAZON INTERNAL DOCUMENT OR EXPORT-CONTROLLED (ITAR/EAR) DATA. ORBITAL GEOMETRY IS SCHEMATIC / NOT TO SCALE. NO REAL EPHEMERIS OR GROUND-STATION LOCATIONS. FOR FAMILIARIZATION ONLY.';
