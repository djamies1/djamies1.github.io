/* ============================================================
   data.js — single source of truth.
   Every string, figure, camera preset and explode offset lives
   here so content review (and future edits) touch one file.

   ⚠ COMPLIANCE — READ BEFORE EDITING ⚠
   Everything in this file is compiled SOLELY from public sources
   (Amazon Leo / Project Kuiper press and blog posts, FCC filings
   — FCC 20-102 and ELS/IBFS earth-station applications —
   re:Invent 2025 coverage, eoPortal, trade press; retrieved
   Jul 2026). The site geometry is a GENERIC LEO ground gateway,
   drawn NTS (not to scale). It is NOT derived from, informed by,
   or checked against any Amazon internal schematic, document, or
   export-controlled (ITAR/EAR) technical data. NO REAL SITE
   LOCATION is depicted or named anywhere. Keep it that way:
   never add a figure here without a public citation in
   PROVENANCE, and never add a place name.

   World units are arbitrary (sheet is NTS). Site axis x=800,
   orbit arc apex y≈137, grade line y=640, shelter section
   y 692–802, backhaul single-line strip y≈856–934.
   ============================================================ */

/* Camera presets: world point (px,py) centered at sheet (800,500) at zoom z. */
export const CAM = {
  full:     { px: 800, py: 500, z: 1.0 },
  antenna:  { px: 900, py: 478, z: 1.85 },  // dish + radome + DETAIL A inset
  tracking: { px: 800, py: 400, z: 1.3 },   // sky arc + dish sweep
  rf:       { px: 800, py: 330, z: 1.65 },  // feeder beam close-up (cam pans to rfB mid-scene)
  rfB:      { px: 760, py: 610, z: 1.3 },   // diversity beat: site B in the strip
  shelter:  { px: 800, py: 742, z: 2.3 },
  backhaul: { px: 800, py: 858, z: 2.35 },
  network:  { px: 800, py: 505, z: 1.02 },  // wide pull: whole site + DETAIL B site plan
  exploded: { px: 800, py: 552, z: 1.1 },
};

/* Full exploded-view offsets (world units). `groups` take a y lift;
   `parts` carry x/y/rotation for laterally-extracted modules.
   Home = all zeros → reassembly is a tween back to 0. */
export const EXPLODE = {
  groups: {
    'asm-dishmount': -78,
    'asm-pedestal': 0,
    'asm-net': 0,
  },
  parts: {
    'radome':   { x: -135, y: -150, rotation: -10 },  // lifted aside like a lid
    'rack-row': { x: 170,  y: 0,    rotation: 0 },    // racks slide out of the shelter
    'sh-roof':  { x: 0,    y: -44,  rotation: 0 },
    'ttc-dish': { x: -85,  y: -25,  rotation: 0 },
  },
};

/* Scenes: t = [start,end] on a 0–100 timeline; panel = index into PANELS. */
export const SCENES = [
  { id: 'draw',     t: [0, 14],   title: 'Site elevation',       panel: 0 },
  { id: 'antenna',  t: [14, 26],  title: 'The gateway antenna',  panel: 1 },
  { id: 'tracking', t: [26, 38],  title: 'Tracking a pass',      panel: 2 },
  { id: 'rf',       t: [38, 49],  title: 'The feeder link',      panel: 3 },
  { id: 'shelter',  t: [49, 60],  title: 'Inside the shelter',   panel: 4 },
  { id: 'backhaul', t: [60, 71],  title: 'Backhaul to the cloud', panel: 5 },
  { id: 'network',  t: [71, 82],  title: 'Fleet & TT&C',         panel: 6 },
  { id: 'exploded', t: [82, 100], title: 'Full breakdown',       panel: 7 },
];

/* Scroll length of the pinned stage, in viewport-heights. */
export const SCROLL_VH = 9;

export const PANELS = [
  {
    eyebrow: 'SHEET 1 · SITE ELEVATION',
    title: 'Amazon Leo ground gateway',
    rows: [
      ['Role', 'Space ↔ internet & cloud'],
      ['Planned', '300+ stations globally'],
      ['Feeder link', 'Ka-band'],
      ['Backhaul', 'PoP → fiber → AWS'],
      ['Siting', 'Often remote'],
    ],
    note: 'A generic representation from public figures only — production gateway hardware and site layouts aren’t public, and no real location is depicted. Deliberately NTS.',
  },
  {
    eyebrow: 'SCENE 01 · THE ANTENNA',
    title: 'Gateway antenna',
    rows: [
      ['Type', 'Parabolic tracker (rep.)'],
      ['Protection', 'Radome — typ.'],
      ['Protoflight', '2.4 m dishes (FCC ELS)'],
      ['Production', 'Not public'],
    ],
    note: 'The protoflight campaign used 2.4 m tracking dishes per FCC filings. Production antenna design, size and count per site are not public — this dish is generic.',
  },
  {
    eyebrow: 'SCENE 02 · TRACKING',
    title: 'Tracking a pass',
    rows: [
      ['Mount', 'EL over AZ (generic)'],
      ['Pass', 'Minutes per satellite'],
      ['Handover', 'Continuous'],
      ['Fleet', 'Next sat always rising'],
    ],
    note: 'LEO satellites race across the sky, horizon to horizon, in minutes. Gateway antennas track each pass and hand traffic to the next satellite without dropping it.',
  },
  {
    eyebrow: 'SCENE 03 · FEEDER LINK',
    title: 'Ka-band feeder link',
    rows: [
      ['Uplink', '27.5–30.0 GHz'],
      ['Downlink', '17.7–20.2 GHz'],
      ['Grant', 'FCC 20-102'],
      ['Security', 'AES-256 end-to-end'],
      ['Weather', 'Diversity + mesh'],
    ],
    note: 'Heavy rain attenuates Ka-band. If a site fades, traffic can shift to another gateway — via the ground network and the optical mesh in orbit.',
  },
  {
    eyebrow: 'SCENE 04 · EQUIPMENT SHELTER',
    title: 'Inside the shelter',
    rows: [
      ['Baseband', 'Prometheus — same silicon'],
      ['Timing', 'GNSS-disciplined'],
      ['Power', 'UPS — generic'],
      ['Layout', 'Generic section'],
    ],
    note: 'The same custom ASIC family that flies on the satellites and sits in customer terminals also runs the gateway — one silicon design, ground to orbit.',
  },
  {
    eyebrow: 'SCENE 05 · BACKHAUL',
    title: 'To the cloud',
    rows: [
      ['Path', 'Gateway → PoP → fiber'],
      ['Cloud', 'Direct to AWS (D2A)'],
      ['Private', 'PNI at major colos'],
      ['Encryption', 'AES-256'],
    ],
    note: 'Each gateway talks to a Point of Presence that connects into fiber internet and AWS — enterprises can land traffic straight in their VPC via Transit or Direct Connect gateways.',
  },
  {
    eyebrow: 'SCENE 06 · FLEET & TT&C',
    title: 'A global ground fleet',
    rows: [
      ['Stations', '300+ planned'],
      ['TT&C', 'Separate antenna fleet'],
      ['Mesh', 'OISL reroute in space'],
      ['Backhaul for', 'Verizon · Vodafone · NTT/JSAT'],
    ],
    note: 'Gateways carry customer data; separate TT&C antennas keep the satellites healthy. Telcos use the same gateways to backhaul rural 4G/5G towers.',
  },
  {
    eyebrow: 'SCENE 07 · FULL BREAKDOWN',
    title: 'One gateway, opened up',
    rows: [
      ['Data', 'Public sources only'],
      ['Geometry', 'Generic — NTS'],
      ['Derived from', 'No internal material'],
      ['Locations', 'None depicted'],
    ],
    note: 'Hit replay — or scroll back — to run the breakdown again.',
  },
];

/* Exploded money-shot labels. ax/ay are anchors in EXPLODED coordinates
   (base geometry + EXPLODE offsets). side L: elbow→col (text-end);
   side R: elbow→col (text-start). col overrides the default 560/1040. */
export const XLABELS = [
  { id: 'xl-radome',   side: 'L', ax: 620,  ay: 262, ex: 574,  ey: 240, t: 'RADOME',              s: 'WEATHER PROTECTION · PHANTOM — TYP' },
  { id: 'xl-feed',     side: 'R', ax: 800,  ay: 284, ex: 1000, ey: 260, t: 'FEED — PRIME FOCUS',  s: 'GEOMETRY GENERIC' },
  { id: 'xl-dish',     side: 'R', ax: 905,  ay: 341, ex: 1000, ey: 322, t: 'PARABOLIC REFLECTOR', s: 'TRACKING FEEDER ANTENNA — GENERIC' },
  { id: 'xl-pedestal', side: 'R', ax: 830,  ay: 585, ex: 1000, ey: 560, t: 'EL-OVER-AZ PEDESTAL', s: 'TRACKS EVERY PASS — GENERIC' },
  { id: 'xl-ttc',      side: 'L', ax: 538,  ay: 562, ex: 500,  ey: 590, t: 'TT&C ANTENNA', col: 460, s: 'TELEMETRY · TRACKING · COMMAND' },
  { id: 'xl-shelter',  side: 'L', ax: 664,  ay: 760, ex: 590,  ey: 780, t: 'EQUIPMENT SHELTER',   s: 'BASEBAND · TIMING · POWER — GENERIC' },
  { id: 'xl-racks',    side: 'R', ax: 1052, ay: 744, ex: 1096, ey: 716, t: 'BASEBAND RACKS', col: 1150, s: 'PROMETHEUS — SAME SILICON AS THE FLEET' },
  { id: 'xl-net',      side: 'R', ax: 944,  ay: 862, ex: 1096, ey: 838, t: 'BACKHAUL PATH', col: 1150, s: 'GATEWAY → PoP → FIBER → AWS' },
];

/* Outro: full spec table + per-component prose (also the a11y content). */
export const SPEC_TABLE = {
  caption: 'TABLE 1 — AMAZON LEO GROUND GATEWAY, PUBLIC FIGURES (GENERIC REPRESENTATION)',
  head: ['Item', 'Value', 'Remarks'],
  rows: [
    ['Role', 'Feeder link: space ↔ ground network', 'Carries customer data between satellites and internet / cloud'],
    ['Planned scale', '300+ gateway stations, globally', 'Revealed at AWS re:Invent 2025; sites on six continents'],
    ['Feeder link', 'Ka-band · up 27.5–30.0 GHz · down 17.7–20.2 GHz', 'Per FCC 20-102 grant; exact gateway sub-band use not public'],
    ['Prototype antennas', '2.4 m parabolic trackers (+1.3 m, later 2.8 m)', 'Protoflight-era FCC ELS/IBFS filings — production hardware not public'],
    ['Baseband', 'Prometheus custom SoC', 'Same silicon family as the satellites and customer terminals'],
    ['Backhaul', 'Gateway → PoP → fiber → AWS / internet', 'Points of Presence interface into fiber and AWS'],
    ['Cloud access', 'Direct to AWS (D2A) · Private Network Interconnect (PNI)', 'Transit / Direct Connect gateways; PNI at major colocation sites'],
    ['Encryption', 'AES-256, end-to-end', 'Satellite ↔ gateway ↔ cloud traffic encrypted'],
    ['TT&C', 'Separate antenna fleet', 'Telemetry, orbit maintenance, collision avoidance, software updates'],
    ['Telco backhaul', 'Verizon · Vodafone/Vodacom · NTT + SKY Perfect JSAT', 'Public partnerships — rural 4G/5G cell backhaul over Leo'],
    ['Service', '< 50 ms latency · up to 1 Gbps (Leo Ultra)', 'Terminal tiers: Ultra 1 Gbps↓ · Pro 400 Mbps · Nano 100 Mbps'],
    ['Constellation', '3,236 satellites · 98 planes · 590/610/630 km', 'OISL mesh can route traffic to a distant gateway'],
  ],
};

export const COMPONENT_NOTES = [
  { tag: 'ANTENNA', title: 'Gateway antenna', body: 'Amazon describes its ground stations simply as “satellite dishes,” often in remote places. During the 2023 Protoflight campaign the Texas gateway used 2.4 m parabolic tracking antennas (with 1.3 m units, and a 2.8 m antenna added by later filing) — those figures come from FCC experimental and earth-station applications. Production gateway antennas, their size, and how many stand at each site have never been published, so the dish drawn here is a generic tracking antenna under a typical radome.' },
  { tag: 'TRACKING', title: 'Tracking & handover', body: 'A satellite at 590–630 km crosses the sky in minutes, so a gateway antenna is never still: it follows each pass horizon to horizon, then swings back for the next satellite — which is always already rising. The elevation-over-azimuth pedestal drawn here is the classic generic arrangement for LEO tracking, not an Amazon design.' },
  { tag: 'FEEDER LINK', title: 'Ka-band feeder link', body: 'The FCC authorized the system across Ka-band: 17.7–20.2 GHz space-to-Earth and 27.5–30.0 GHz Earth-to-space. Which sub-bands the gateways use versus customer terminals is not public, so this sheet quotes only the granted ranges. Traffic is encrypted end-to-end with AES-256. Heavy rain attenuates Ka-band — one reason the network can steer traffic to an alternate site.' },
  { tag: 'SHELTER', title: 'Equipment shelter', body: 'Every figure inside the shelter is generic except one: the baseband runs on Prometheus, Amazon’s custom chip that combines a base station, modem and backhaul link in one ASIC — the same silicon family that flies on every satellite and sits in every customer terminal. Rack layout, power and timing arrangements drawn here are typical earth-station practice, not Amazon’s.' },
  { tag: 'BACKHAUL', title: 'PoP, fiber and AWS', body: 'Amazon’s networking engineers describe the architecture publicly: gateway stations communicate with a Point of Presence, which connects into fiber internet and interfaces with AWS. Enterprises can ride that path straight into their own cloud — Direct to AWS (D2A) attaches Leo traffic to a Transit Gateway or Direct Connect Gateway, and Private Network Interconnect (PNI) lands it at major colocation facilities instead.' },
  { tag: 'TT&C', title: 'TT&C antennas', body: 'Alongside the gateways, a separate fleet of telemetry, tracking and control antennas keeps the satellites themselves healthy — monitoring, orbit maintenance, collision-avoidance maneuvers and software updates. TT&C frequencies and site details are not public; the smaller dish drawn here is symbolic.' },
  { tag: 'FLEET', title: 'A global ground fleet', body: 'Amazon plans more than 300 gateway stations across North and South America, Europe, Africa, Asia and Oceania. The optical mesh in orbit means the serving gateway is not always the nearest one — traffic can cross the sky at light speed and come down wherever capacity and weather are best. Telcos including Verizon, Vodafone/Vodacom and NTT with SKY Perfect JSAT have publicly partnered to backhaul cellular networks over the system. No real gateway location is shown in this drawing.' },
];

export const PROVENANCE =
  'GENERIC REPRESENTATION — COMPILED SOLELY FROM PUBLIC SOURCES: AMAZON LEO / PROJECT KUIPER PRESS & BLOG POSTS · FCC 20-102 AND FCC ELS/IBFS EARTH-STATION FILINGS · AWS RE:INVENT 2025 COVERAGE · EOPORTAL · TRADE PRESS — RETRIEVED JUL 2026.<br>' +
  'NOT DERIVED FROM ANY AMAZON INTERNAL SCHEMATIC, DOCUMENT, OR EXPORT-CONTROLLED (ITAR/EAR) TECHNICAL DATA. NO REAL SITE LOCATION IS DEPICTED OR NAMED. GEOMETRY IS NOT TO SCALE AND NOT FOR ENGINEERING USE. DRAWN FOR FAMILIARIZATION ONLY.';
