/* ============================================================
   data.js — single source of truth.
   Every string, figure, camera preset and explode offset lives
   here so content review (and future edits) touch one file.

   ⚠ COMPLIANCE — READ BEFORE EDITING ⚠
   Everything in this file is compiled SOLELY from public sources
   (Amazon Leo / Project Kuiper press and blog posts, the Amazon
   Science customer-terminal antenna interview, FCC Ka-band
   authorization, and the Nov 2025 Amazon Leo terminal-lineup
   coverage; retrieved Jul 2026). The terminal drawn here is a
   GENERIC customer terminal, drawn NTS (not to scale). It is NOT
   derived from, informed by, or checked against any Amazon
   internal schematic, document, or export-controlled (ITAR/EAR)
   technical data.

   Phased-array beamforming is classically export-controlled. The
   ARRAY LATTICE IS ILLUSTRATIVE: the element grid uses an
   obviously token count and spacing — NO ACTUAL ELEMENT COUNT,
   LATTICE GEOMETRY, OR BEAMFORMING/PHASE DATA is depicted. Keep it
   that way: never add a figure here without a public citation in
   PROVENANCE, and never annotate the array with a real element
   count, pitch, or beamforming parameter.

   World units are arbitrary (sheet is NTS). Terminal axis x=800,
   orbit arc apex y≈120, array face / steer pivot (800,415),
   roofline y=600, indoor section y 660–820, network single-line
   strip y≈856–934.
   ============================================================ */

/* Camera presets: world point (px,py) centered at sheet (800,500) at zoom z. */
export const CAM = {
  full:     { px: 800, py: 500, z: 1.0 },
  array:    { px: 840, py: 398, z: 1.72 },  // panel face + element row + plan-view lattice inset
  steer:    { px: 800, py: 312, z: 1.22 },  // sky arc + steered beam + wavefront
  link:     { px: 800, py: 268, z: 1.55 },  // user-link band close-up (pans down to obstruction beat)
  indoor:   { px: 800, py: 730, z: 2.05 },  // indoor unit cutaway
  models:   { px: 520, py: 432, z: 1.66 },  // DETAIL B — the three-model comparison
  network:  { px: 800, py: 502, z: 1.0 },   // wide pull: whole terminal + end-to-end strip
  exploded: { px: 800, py: 476, z: 1.04 },
};

/* Full exploded-view offsets (world units). `groups` take a y lift;
   `parts` carry x/y/rotation for extracted layers/modules.
   Home = all zeros → reassembly is a tween back to 0.
   The flat panel opens as a vertical layer stack (cover up, boards
   down); the mount drops; the indoor router slides clear. */
export const EXPLODE = {
  groups: {
    'asm-panel': -34,
    'asm-mount': 46,
    'asm-net': 0,
  },
  parts: {
    'cover':      { x: 0,   y: -116, rotation: 0 },  // radome skin lifts off like a lid
    'array-pcb':  { x: 0,   y: -58,  rotation: 0 },  // phased-array board
    'prom-board': { x: 0,   y: 10,   rotation: 0 },  // Prometheus baseband board
    'thermal':    { x: 0,   y: 48,   rotation: 0 },  // heat-spreader plate
    'baseplate':  { x: 0,   y: 88,   rotation: 0 },  // chassis / baseplate
    'router-row': { x: 214, y: 0,    rotation: 0 },  // indoor unit slides clear of the wall
  },
};

/* Scenes drive the rail + progress bar. t = [start,end] as a 0–100 % of the
   VISIBLE run. The draw-on intro is pre-rolled (see START in timeline.js) so the
   widget lands already-drawn at the first component scene; scrolling pans into it.
   These % are the master timeline's scene bounds (14→100) remapped to 0→100.
   panel = index into PANELS. */
export const SCENES = [
  { id: 'array',    t: [0, 14.0],    title: 'The flat antenna',      panel: 1 },
  { id: 'steer',    t: [14.0, 27.9], title: 'Aiming without moving', panel: 2 },
  { id: 'link',     t: [27.9, 40.7], title: 'The link to space',     panel: 3 },
  { id: 'indoor',   t: [40.7, 53.5], title: 'Into the home',         panel: 4 },
  { id: 'models',   t: [53.5, 66.3], title: 'Three sizes',           panel: 5 },
  { id: 'network',  t: [66.3, 79.1], title: 'From you to the cloud', panel: 6 },
  { id: 'exploded', t: [79.1, 100],  title: 'Every part',            panel: 7 },
];

/* Scroll length of the pinned stage, in viewport-heights. */
export const SCROLL_VH = 9;

export const PANELS = [
  {
    eyebrow: 'AMAZON LEO · CUSTOMER TERMINAL',
    title: 'The customer terminal',
    rows: [
      ['What it is', 'The customer’s antenna'],
      ['Links', 'Home ↔ space'],
      ['Sizes', 'Nano · Pro · Ultra'],
    ],
    note: 'The flat antenna a customer installs to join the satellite network. This is an illustration built from public information only — not a real Amazon drawing, and deliberately not to scale.',
  },
  {
    eyebrow: 'THE ANTENNA',
    title: 'A flat antenna, no dish',
    rows: [
      ['Not', 'A moving dish'],
      ['But', 'A flat panel'],
      ['Made of', 'Hundreds of tiny antennas'],
    ],
    note: 'Instead of a dish, the terminal is a flat panel packed with hundreds of tiny antennas working together. The pattern drawn here is illustrative only.',
  },
  {
    eyebrow: 'AIMING THE SIGNAL',
    title: 'It aims without moving',
    rows: [
      ['Moving parts', 'None'],
      ['Aims by', 'Electronics'],
      ['Handover', 'Instant'],
    ],
    note: 'The panel never moves. It steers its signal electronically to follow a satellite across the sky, then switches to the next one in a blink — nothing mechanical to turn.',
  },
  {
    eyebrow: 'THE LINK TO SPACE',
    title: 'The link to space',
    rows: [
      ['Direction', 'Two-way'],
      ['Delay', 'Under 50 ms'],
      ['Security', 'Encrypted'],
    ],
    note: 'A fast two-way radio link to the satellite passing overhead. In heavy rain the link adapts to stay connected rather than dropping.',
  },
  {
    eyebrow: 'INTO THE HOME',
    title: 'Into the home',
    rows: [
      ['Indoors', 'A Wi-Fi router'],
      ['One cable', 'Data + power'],
      ['Runs on', 'Prometheus chip'],
    ],
    note: 'A single cable links the outdoor panel to an indoor Wi-Fi unit. It runs on Prometheus — the same custom Amazon chip used across the satellites and ground stations.',
  },
  {
    eyebrow: 'THE FAMILY',
    title: 'One family, three sizes',
    rows: [
      ['Nano', 'Portable'],
      ['Pro', 'Under $400'],
      ['Ultra', 'Up to 1 Gbps'],
    ],
    note: 'Three models share the same flat-antenna design: the portable Nano, the everyday Pro, and the high-capacity Ultra for business and government.',
  },
  {
    eyebrow: 'THE BIG PICTURE',
    title: 'From you to the cloud',
    rows: [
      ['Up', 'To a satellite'],
      ['Across', 'By laser'],
      ['Down', 'Ground station → cloud'],
    ],
    note: 'Your signal goes up to a satellite, can hop across the network by laser, and comes down at a ground station that connects to the internet and AWS — all in under 50 ms.',
  },
  {
    eyebrow: 'THE WHOLE TERMINAL',
    title: 'Every part, laid out',
    rows: [
      ['Based on', 'Public info only'],
      ['Drawing', 'Not to scale'],
      ['Antenna', 'Representative only'],
    ],
    note: 'Hit replay — or scroll back — to run it again.',
  },
];

/* Exploded money-shot labels. ax/ay are anchors in EXPLODED coordinates
   (base geometry + EXPLODE offsets). side L: elbow→col (text-end);
   side R: elbow→col (text-start). col overrides the default 560/1040. */
export const XLABELS = [
  { id: 'xl-cover',   side: 'L', ax: 726, ay: 300, ex: 596,  ey: 280, t: 'WEATHER COVER',       s: 'PROTECTS THE ANTENNA' },
  { id: 'xl-array',   side: 'R', ax: 872, ay: 356, ex: 1002, ey: 336, t: 'THE FLAT ANTENNA',    s: 'REPRESENTATIVE — NOT ACTUAL LAYOUT' },
  { id: 'xl-prom',    side: 'R', ax: 838, ay: 430, ex: 1002, ey: 412, t: 'PROMETHEUS CHIP',     s: 'SAME CHIP ACROSS THE NETWORK' },
  { id: 'xl-thermal', side: 'L', ax: 726, ay: 466, ex: 596,  ey: 452, t: 'COOLING PLATE',       s: 'CARRIES HEAT AWAY' },
  { id: 'xl-base',    side: 'L', ax: 726, ay: 506, ex: 596,  ey: 524, t: 'BASE / CHASSIS',       s: 'THE BODY IT MOUNTS TO' },
  { id: 'xl-mount',   side: 'R', ax: 800, ay: 604, ex: 1002, ey: 586, t: 'FIXED MOUNT',          s: 'NEVER MOVES · AIMS ELECTRONICALLY' },
  { id: 'xl-router',  side: 'R', ax: 1030, ay: 742, ex: 1092, ey: 716, col: 1150, t: 'INDOOR UNIT', s: 'Wi-Fi ROUTER · ONE CABLE' },
];

/* Outro: full spec table + per-component prose (also the a11y content). */
export const SPEC_TABLE = {
  caption: 'TABLE 1 — AMAZON LEO CUSTOMER TERMINAL, PUBLIC FIGURES (GENERIC REPRESENTATION)',
  head: ['Item', 'Value', 'Remarks'],
  rows: [
    ['Role', 'Customer terminal: space ↔ home / office', 'The flat antenna a customer mounts to reach the constellation'],
    ['Lineup', 'Leo Nano · Leo Pro · Leo Ultra', 'Rebrand from Project Kuiper; lineup shown at Amazon Leo reveal, Nov 2025'],
    ['Leo Nano', '~7 in square · 2.2 lb · up to 100 Mbps↓ · portable', 'Residential / government / IoT / ground-mobility (2023: 7 in / 1 lb)'],
    ['Leo Pro', '< 11 in square · ~5 lb · up to 400 Mbps↓ · target < $400', 'Standard terminal; single-aperture phased array ~12 in diameter'],
    ['Leo Ultra', '~20 × 30 in · ~43 lb · up to 1 Gbps↓ / 400 Mbps↑', 'Enterprise / government / telecom; full-duplex phased array + custom silicon'],
    ['Antenna', 'Phased array · hundreds of elements per aperture', 'Electronic beam steering — no moving parts (Amazon Science interview)'],
    ['Aperture', 'Single overlapping Tx/Rx lattice', '2020 breakthrough — one lattice for both bands; ~3× smaller than legacy'],
    ['User link', 'Ka-band · Rx ~18–20 GHz · Tx ~28–30 GHz', 'Customer-terminal figures per Amazon Science; within the FCC Ka grant'],
    ['Baseband', 'Prometheus custom SoC', 'Same silicon family as the satellites and ground gateways'],
    ['Security', 'AES-256, end-to-end', 'Encrypted terminal ↔ satellite ↔ cloud'],
    ['End to end', 'Terminal → satellite → mesh → gateway → AWS / internet', 'Optical (laser) mesh, 100 Gbps, can route via a distant gateway; under 50 ms latency'],
    ['Constellation', '3,236 satellites · 98 planes · 590/610/630 km', 'Terminals track passes across this LEO shell'],
  ],
};

export const COMPONENT_NOTES = [
  { tag: 'LINEUP', title: 'Three published terminals', body: 'Amazon publicly shows three customer terminals, renamed at the Amazon Leo rebrand in November 2025: the portable Leo Nano (about 7 inches square, 2.2 lb, up to 100 Mbps), the standard Leo Pro (under 11 inches square, roughly 5 lb, up to 400 Mbps, targeted below $400 to build), and the enterprise-grade Leo Ultra (about 20 by 30 inches, ~43 lb, up to 1 Gbps down and 400 Mbps up). The products themselves are public; their internal antenna and silicon design is not, so everything below the skin here is generic.' },
  { tag: 'ANTENNA', title: 'A flat phased array', body: 'Instead of a dish, a customer terminal is a flat phased array: hundreds of tiny antennas share one aperture and, as Amazon’s antenna lead puts it, work “on the same aperture, creating a focused beam of radio waves.” There are no moving parts — the beam is pointed by adjusting the phase of each element. The lattice drawn here is deliberately illustrative: the real element count, spacing and geometry are export-controlled and not public.' },
  { tag: 'APERTURE', title: 'One lattice, two bands', body: 'The hard part in Ka-band is that receive (~18–20 GHz) and transmit (~28–30 GHz) sit far apart, which normally needs two separate antennas. Amazon’s 2020 breakthrough combined both into a single overlapping aperture by “looking at each antenna element uniquely,” yielding one lattice about three times smaller than legacy designs. How that is actually laid out is not public — the unit cell shown in Detail A is representative.' },
  { tag: 'STEERING', title: 'Steering & handover', body: 'A satellite at 590–630 km crosses the sky in minutes. A dish would have to physically slew to follow it; a phased array simply shifts the phase gradient across its face, tilting the beam electronically. When one satellite sets, the terminal re-steers to the next one rising — in effectively no time, with nothing mechanical to move. This is the terminal’s counterpart to the gateway’s tracking dish.' },
  { tag: 'SILICON', title: 'Prometheus baseband', body: 'The terminal runs on Prometheus, Amazon’s custom baseband chip, which the company describes as combining a 5G-class modem, a cellular base station’s traffic handling and a microwave-backhaul link in a single ASIC. It is the same silicon family that flies on every satellite and sits in every ground gateway — one design, from the rooftop to orbit.' },
  { tag: 'INDOOR', title: 'Into the home', body: 'The outdoor panel connects to an indoor Wi-Fi unit over a single cable that carries both data and power, and the indoor unit serves the customer’s devices. Router internals, cabling and power arrangements drawn here are typical customer-premises practice, not an Amazon design.' },
  { tag: 'NETWORK', title: 'Terminal to cloud', body: 'From the panel, traffic goes up to a satellite, optionally hops across the optical mesh in orbit, and comes down at a ground gateway that connects through a Point of Presence into fiber, the internet and AWS — all under 50 ms. The terminal is the near end of the same path the gateway sheet draws from the far end.' },
];

export const PROVENANCE =
  'GENERIC REPRESENTATION — COMPILED SOLELY FROM PUBLIC SOURCES: AMAZON LEO / PROJECT KUIPER PRESS & BLOG POSTS · AMAZON SCIENCE CUSTOMER-TERMINAL ANTENNA INTERVIEW · FCC KA-BAND AUTHORIZATION · AMAZON LEO TERMINAL-LINEUP COVERAGE (SPACENEWS / VIA SATELLITE / TOM’S HARDWARE / GEEKWIRE, NOV 2025) · DATACENTERDYNAMICS · EOPORTAL — RETRIEVED JUL 2026. HISTORICAL FIGURES FLAGGED (e.g. LEO NANO 1 LB IN 2023 → 2.2 LB IN THE 2025 LINEUP).<br>' +
  'NOT DERIVED FROM ANY AMAZON INTERNAL SCHEMATIC, DOCUMENT, OR EXPORT-CONTROLLED (ITAR/EAR) TECHNICAL DATA. THE ARRAY LATTICE IS ILLUSTRATIVE — NO ACTUAL ELEMENT COUNT, GEOMETRY, OR BEAMFORMING DATA IS DEPICTED. GEOMETRY IS NOT TO SCALE AND NOT FOR ENGINEERING USE. DRAWN FOR FAMILIARIZATION ONLY.';
