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

/* Scenes: t = [start,end] on a 0–100 timeline; panel = index into PANELS. */
export const SCENES = [
  { id: 'draw',     t: [0, 14],   title: 'Terminal elevation',    panel: 0 },
  { id: 'array',    t: [14, 26],  title: 'The phased array',      panel: 1 },
  { id: 'steer',    t: [26, 38],  title: 'Steering the beam',     panel: 2 },
  { id: 'link',     t: [38, 49],  title: 'The user link',         panel: 3 },
  { id: 'indoor',   t: [49, 60],  title: 'Into the home',         panel: 4 },
  { id: 'models',   t: [60, 71],  title: 'Three terminals',       panel: 5 },
  { id: 'network',  t: [71, 82],  title: 'End to end',            panel: 6 },
  { id: 'exploded', t: [82, 100], title: 'Full breakdown',        panel: 7 },
];

/* Scroll length of the pinned stage, in viewport-heights. */
export const SCROLL_VH = 9;

export const PANELS = [
  {
    eyebrow: 'SHEET 1 · TERMINAL ELEVATION',
    title: 'Amazon Leo customer terminal',
    rows: [
      ['Role', 'Space ↔ home / office'],
      ['Antenna', 'Flat phased array'],
      ['Steering', 'Electronic — no moving parts'],
      ['User link', 'Ka-band'],
      ['Family', 'Nano · Pro · Ultra'],
    ],
    note: 'A generic representation from public figures only. The array lattice is illustrative — not an actual element count or geometry — and nothing here is derived from internal or export-controlled data. Deliberately NTS.',
  },
  {
    eyebrow: 'SCENE 01 · THE ARRAY',
    title: 'A phased-array face',
    rows: [
      ['Elements', 'Hundreds per aperture'],
      ['Apertures', 'Tx + Rx in one lattice'],
      ['Breakthrough', 'Single aperture, 2020'],
      ['Depiction', 'Representative lattice'],
    ],
    note: 'Hundreds of tiny antennas share one aperture. Amazon’s 2020 breakthrough folded transmit and receive into a single lattice — hard in Ka-band, where the two bands sit far apart. The grid drawn here is illustrative only.',
  },
  {
    eyebrow: 'SCENE 02 · BEAM STEERING',
    title: 'Steered in silicon',
    rows: [
      ['Method', 'Per-element phase'],
      ['Moving parts', 'None'],
      ['Tracking', 'Follows each pass'],
      ['Handover', 'Re-steers in a blink'],
    ],
    note: 'The panel never moves. Shifting the phase across the elements tilts the combined beam, so it can follow a satellite across the sky — then jump to the next one electronically, with no mechanical slew.',
  },
  {
    eyebrow: 'SCENE 03 · USER LINK',
    title: 'The Ka-band user link',
    rows: [
      ['Receive', '18–20 GHz'],
      ['Transmit', '28–30 GHz'],
      ['Security', 'AES-256 end-to-end'],
      ['Latency', '< 50 ms'],
      ['Weather', 'Adapts, not drops'],
    ],
    note: 'The terminal receives around 18–20 GHz and transmits around 28–30 GHz. Rain and obstructions attenuate Ka-band, so the link adapts its coding and rate rather than dropping the connection.',
  },
  {
    eyebrow: 'SCENE 04 · INTO THE HOME',
    title: 'Into the home',
    rows: [
      ['Indoor unit', 'Wi-Fi router'],
      ['Cabling', 'Single cable — data + power'],
      ['Baseband', 'Prometheus — same silicon'],
      ['Output', 'Wi-Fi to devices'],
    ],
    note: 'One cable carries data and power between the outdoor panel and an indoor Wi-Fi unit. The terminal runs on Prometheus — the same custom baseband chip family used in the satellites and ground gateways.',
  },
  {
    eyebrow: 'SCENE 05 · THREE TERMINALS',
    title: 'One family, three sizes',
    rows: [
      ['Nano', '~7 in · 100 Mbps · portable'],
      ['Pro', '~11 in · 400 Mbps · < $400'],
      ['Ultra', '~20×30 in · up to 1 Gbps'],
      ['Shared', 'Phased array + Prometheus'],
    ],
    note: 'Three published terminals share the same phased-array approach: the portable Nano, the standard Pro, and the enterprise-grade Ultra (up to 1 Gbps down / 400 up). Sizes and speeds are Amazon’s own figures.',
  },
  {
    eyebrow: 'SCENE 06 · END TO END',
    title: 'Terminal to cloud',
    rows: [
      ['Hop 1', 'Terminal ↔ satellite'],
      ['In space', 'OISL mesh (100 Gbps)'],
      ['Ground', 'Gateway → PoP → fiber'],
      ['Cloud', 'AWS / internet'],
    ],
    note: 'The panel links up to a satellite at 590–630 km; the optical mesh can carry traffic across the constellation to a distant gateway, which lands it on fiber, the internet and AWS — under 50 ms end to end.',
  },
  {
    eyebrow: 'SCENE 07 · FULL BREAKDOWN',
    title: 'One terminal, opened up',
    rows: [
      ['Data', 'Public sources only'],
      ['Geometry', 'Generic — NTS'],
      ['Lattice', 'Illustrative — not actual'],
      ['Derived from', 'No internal material'],
    ],
    note: 'Hit replay — or scroll back — to run the breakdown again.',
  },
];

/* Exploded money-shot labels. ax/ay are anchors in EXPLODED coordinates
   (base geometry + EXPLODE offsets). side L: elbow→col (text-end);
   side R: elbow→col (text-start). col overrides the default 560/1040. */
export const XLABELS = [
  { id: 'xl-cover',   side: 'L', ax: 726, ay: 300, ex: 596,  ey: 280, t: 'RADOME / COVER',      s: 'WEATHER SKIN — TYP' },
  { id: 'xl-array',   side: 'R', ax: 872, ay: 356, ex: 1002, ey: 336, t: 'PHASED-ARRAY PCB',    s: 'REPRESENTATIVE LATTICE — NOT ACTUAL COUNT' },
  { id: 'xl-prom',    side: 'R', ax: 838, ay: 430, ex: 1002, ey: 412, t: 'PROMETHEUS BASEBAND', s: 'SAME SILICON AS SATELLITES & GATEWAYS' },
  { id: 'xl-thermal', side: 'L', ax: 726, ay: 466, ex: 596,  ey: 452, t: 'THERMAL PLATE',       s: 'HEAT SPREADER — GENERIC' },
  { id: 'xl-base',    side: 'L', ax: 726, ay: 506, ex: 596,  ey: 524, t: 'BASEPLATE / CHASSIS',  s: 'MOUNT INTERFACE — GENERIC' },
  { id: 'xl-mount',   side: 'R', ax: 800, ay: 604, ex: 1002, ey: 586, t: 'MOUNT — FIXED',        s: 'NO MOVING PARTS · BEAM STEERS IN SILICON' },
  { id: 'xl-router',  side: 'R', ax: 1030, ay: 742, ex: 1092, ey: 716, col: 1150, t: 'INDOOR UNIT', s: 'Wi-Fi ROUTER · SINGLE CABLE' },
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
    ['End to end', 'Terminal → satellite → mesh → gateway → AWS / internet', 'OISL mesh (100 Gbps) can route via a distant gateway; < 50 ms latency'],
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
