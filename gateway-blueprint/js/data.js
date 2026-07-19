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
    'rack-row': { x: 235,  y: 0,    rotation: 0 },    // racks slide clear of the shelter
    'sh-roof':  { x: 0,    y: -44,  rotation: 0 },
    'ttc-dish': { x: -85,  y: -25,  rotation: 0 },
  },
};

/* Scenes drive the rail + progress bar. t = [start,end] as a 0–100 % of the
   VISIBLE run. The draw-on intro is pre-rolled (see START in timeline.js) so the
   widget lands already-drawn at the first component scene; scrolling pans into it.
   These % are the master timeline's scene bounds (14→100) remapped to 0→100.
   panel = index into PANELS. */
export const SCENES = [
  { id: 'antenna',  t: [0, 14.0],    title: 'The dish',              panel: 1 },
  { id: 'tracking', t: [14.0, 27.9], title: 'Following a satellite', panel: 2 },
  { id: 'rf',       t: [27.9, 40.7], title: 'The link to space',     panel: 3 },
  { id: 'shelter',  t: [40.7, 53.5], title: 'Inside the building',   panel: 4 },
  { id: 'backhaul', t: [53.5, 66.3], title: 'On to the cloud',       panel: 5 },
  { id: 'network',  t: [66.3, 79.1], title: 'A global network',      panel: 6 },
  { id: 'exploded', t: [79.1, 100],  title: 'Every part',            panel: 7 },
];

/* Scroll length of the pinned stage, in viewport-heights. */
export const SCROLL_VH = 9;

export const PANELS = [
  {
    eyebrow: 'AMAZON LEO · GROUND STATION',
    title: 'Amazon Leo ground station',
    rows: [
      ['What it is', 'A dish that talks to space'],
      ['Job', 'Connects satellites to the internet'],
      ['Planned', '300+ worldwide'],
    ],
    note: 'A ground station links the satellites overhead to the internet and cloud. An illustration from public information only — no real location is shown, and it’s not to scale.',
  },
  {
    eyebrow: 'THE DISH',
    title: 'The dish',
    rows: [
      ['Type', 'A steerable satellite dish'],
      ['Cover', 'A dome shields it from weather'],
      ['Shown', 'Generic — not a real design'],
    ],
    note: 'A large dish antenna, usually under a protective dome. Its exact size and design aren’t public, so the one drawn here is generic.',
  },
  {
    eyebrow: 'FOLLOWING A SATELLITE',
    title: 'Following a satellite',
    rows: [
      ['Speed', 'Satellites cross in minutes'],
      ['So', 'The dish swivels to follow'],
      ['Handover', 'Passes to the next one'],
    ],
    note: 'Low satellites race across the sky in minutes, so the dish is never still — it tracks each pass, then swings back to catch the next satellite rising.',
  },
  {
    eyebrow: 'THE LINK TO SPACE',
    title: 'The link to space',
    rows: [
      ['Direction', 'Two-way radio to satellites'],
      ['Security', 'Encrypted end to end'],
      ['Bad weather', 'Traffic shifts to another site'],
    ],
    note: 'A high-capacity two-way radio link to the satellites. Heavy rain can weaken it, so the network can shift traffic to another ground station.',
  },
  {
    eyebrow: 'INSIDE THE BUILDING',
    title: 'Inside the building',
    rows: [
      ['Runs on', 'Prometheus — Amazon’s chip'],
      ['Same chip', 'Across the whole network'],
      ['Also', 'Power and timing gear'],
    ],
    note: 'The equipment inside runs on Prometheus, the same custom Amazon chip used on the satellites and in customer terminals — one design, ground to orbit.',
  },
  {
    eyebrow: 'ON TO THE CLOUD',
    title: 'On to the cloud',
    rows: [
      ['Path', 'Station → fiber → internet'],
      ['Cloud', 'Connects straight to AWS'],
      ['Encryption', 'End to end'],
    ],
    note: 'From the station, traffic joins fiber internet and connects to AWS — businesses can route it straight into their own cloud.',
  },
  {
    eyebrow: 'A GLOBAL NETWORK',
    title: 'A global network',
    rows: [
      ['Scale', '300+ stations planned'],
      ['Where', 'Six continents'],
      ['Also used by', 'Verizon · Vodafone · NTT'],
    ],
    note: 'More than 300 ground stations are planned worldwide. Phone companies like Verizon, Vodafone and NTT also use them to reach remote cell towers.',
  },
  {
    eyebrow: 'EVERY PART',
    title: 'Every part, laid out',
    rows: [
      ['Based on', 'Public information only'],
      ['Drawing', 'Not to scale'],
      ['Location', 'None shown'],
    ],
    note: 'Hit replay — or scroll back — to run it again.',
  },
];

/* Exploded money-shot labels. ax/ay are anchors in EXPLODED coordinates
   (base geometry + EXPLODE offsets). side L: elbow→col (text-end);
   side R: elbow→col (text-start). col overrides the default 560/1040. */
export const XLABELS = [
  { id: 'xl-radome',   side: 'L', ax: 620,  ay: 262, ex: 574,  ey: 240, t: 'WEATHER DOME',    s: 'SHIELDS THE DISH' },
  { id: 'xl-feed',     side: 'R', ax: 800,  ay: 284, ex: 1000, ey: 260, t: 'SIGNAL PICKUP',   s: 'AT THE FOCUS' },
  { id: 'xl-dish',     side: 'R', ax: 905,  ay: 341, ex: 1000, ey: 322, t: 'THE DISH',        s: 'STEERABLE · GENERIC' },
  { id: 'xl-pedestal', side: 'R', ax: 830,  ay: 585, ex: 1000, ey: 560, t: 'STEERABLE MOUNT', s: 'FOLLOWS EVERY PASS' },
  { id: 'xl-ttc',      side: 'L', ax: 538,  ay: 562, ex: 500,  ey: 590, t: 'CONTROL ANTENNA', col: 460, s: 'KEEPS SATELLITES HEALTHY' },
  { id: 'xl-shelter',  side: 'L', ax: 664,  ay: 760, ex: 590,  ey: 780, t: 'EQUIPMENT BUILDING', s: 'BRAINS · POWER · TIMING' },
  { id: 'xl-racks',    side: 'R', ax: 1085, ay: 744, ex: 1110, ey: 716, t: 'THE ELECTRONICS', col: 1150, s: 'PROMETHEUS — NETWORK CHIP' },
  { id: 'xl-net',      side: 'R', ax: 944,  ay: 862, ex: 1096, ey: 838, t: 'TO THE CLOUD', col: 1150, s: 'STATION → FIBER → AWS' },
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
  { tag: 'ANTENNA', title: 'Gateway antenna', body: 'Amazon describes its ground stations simply as “satellite dishes,” often in remote places. During the 2023 Protoflight campaign the test gateway used 2.4 m parabolic tracking antennas (with 1.3 m units, and a 2.8 m antenna added by later filing) — those figures come from FCC experimental and earth-station applications. Production gateway antennas, their size, and how many stand at each site have never been published, so the dish drawn here is a generic tracking antenna under a typical radome.' },
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
