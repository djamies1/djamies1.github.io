/* ============================================================
   data.js — single source of truth.
   Every string, figure and camera preset lives here so content
   review (and future edits) touch one file.

   ⚠ COMPLIANCE — READ BEFORE EDITING ⚠
   Everything in this file is compiled SOLELY from public sources
   (FCC Kuiper / Amazon Leo authorization & filings, Amazon
   press/blog posts incl. the "Kuiper + AWS" post, mainstream/
   trade reporting — retrieved Jul 2026). Frequencies, terminal
   tiers, latency figures and the gateway→AWS routing are public
   record.
   It is NOT derived from, informed by, or checked against any
   Amazon internal document or export-controlled (ITAR/EAR) data.
   Keep it that way: never add a figure without a public citation
   in PROVENANCE.

   The diagram is a SCHEMATIC one-line signal-flow drawing (NTS).
   No real gateway or AWS-Region location is shown; the "AWS
   Region" is a generic labelled node. World units are arbitrary.
   ============================================================ */

/* Camera presets: world point (px,py) centered at sheet (800,500) at zoom z.
   The path runs left→right (terminal → space → gateway → AWS); scenes pan
   across and zoom into each station, like the spectrum chart. */
export const CAM = {
  full:  { px: 815, py: 496, z: 0.95 },   // the whole path (overview + money shot)
  term:  { px: 306, py: 596, z: 1.55 },   // the customer terminal (scene 2)
  up:    { px: 430, py: 452, z: 1.44 },   // the uplink hop to the satellite (scene 3)
  mesh:  { px: 650, py: 262, z: 1.62 },   // the laser mesh across the top (scene 4)
  down:  { px: 968, py: 470, z: 1.44 },   // the downlink + ground gateway (scene 5)
  aws:   { px: 1332, py: 636, z: 1.46 },  // fibre → AWS Region → endpoints (scene 6)
};

/* Scenes drive the rail + progress bar. t = [start,end] as 0–100 % of the VISIBLE
   run. panel = index into PANELS. */
export const SCENES = [
  { id: 'ends',  t: [0,    14.5],  title: 'The whole path',        panel: 1 },
  { id: 'term',  t: [14.5, 29.0],  title: 'It starts at the dish', panel: 2 },
  { id: 'up',    t: [29.0, 43.5],  title: 'Up to the satellite',   panel: 3 },
  { id: 'mesh',  t: [43.5, 58.0],  title: 'Across the laser mesh', panel: 4 },
  { id: 'down',  t: [58.0, 73.0],  title: 'Down to a gateway',     panel: 5 },
  { id: 'aws',   t: [73.0, 86.5],  title: 'Straight into AWS',     panel: 6 },
  { id: 'recap', t: [86.5, 100],   title: 'The full round trip',   panel: 7 },
];

/* Scroll length of the pinned stage, in viewport-heights. */
export const SCROLL_VH = 9.5;

/* Callout cards, one per scene (panel 0 is the authored overview — never shown;
   the widget lands on scene 1). */
export const PANELS = [
  {
    eyebrow: 'AMAZON LEO · DATA PATH',
    title: 'Your data’s journey',
    rows: [
      ['What it is', 'One packet, terminal → cloud'],
      ['The trick', 'Laser mesh + AWS on the ground'],
      ['Shown', 'Public FCC / Amazon record only'],
    ],
    note: 'The whole round trip your data takes — from a rooftop terminal, up to orbit, across a laser mesh, down to a gateway, and straight into AWS. Built from public information only.',
  },
  {
    eyebrow: 'END TO END',
    title: 'Five links, one path',
    rows: [
      ['From', 'Your Leo terminal'],
      ['To', 'AWS, or the internet'],
      ['Round trip', '~20–40 ms'],
    ],
    note: 'A packet crosses five links: up to a satellite, across the optical mesh, down to a gateway, over fibre, and into a cloud region — and back. Low orbit keeps the whole trip to tens of milliseconds.',
  },
  {
    eyebrow: 'THE TERMINAL',
    title: 'It starts at the dish',
    rows: [
      ['Nano', 'up to 100 Mbps'],
      ['Pro', 'up to 400 Mbps'],
      ['Ultra', 'up to 1 Gbps'],
    ],
    note: 'Your data leaves a flat Ka-band phased-array terminal — Nano, Pro or Ultra — transmitting up to the satellite around 27.5–30 GHz. No dish to aim; the beam steers electronically.',
  },
  {
    eyebrow: 'TO ORBIT',
    title: 'Up to the satellite',
    rows: [
      ['Altitude', '~590 km (low)'],
      ['One-way', '~10–20 ms'],
      ['Old way (GEO)', '~250+ ms one-way'],
    ],
    note: 'The uplink reaches a satellite only a few hundred kilometres up — not the 35,786 km of geostationary. Short distance is the whole point: latency stays in the tens of milliseconds.',
  },
  {
    eyebrow: 'IN ORBIT',
    title: 'Across the laser mesh',
    rows: [
      ['Between sats', 'Infrared laser links'],
      ['Each link', 'up to ~100 Gbps'],
      ['Ground hops', 'None needed'],
    ],
    note: 'In space the packet can hop satellite-to-satellite over laser crosslinks toward the satellite nearest its exit point — routing across the sky without coming down to the ground on the way.',
  },
  {
    eyebrow: 'TO THE GROUND',
    title: 'Down to a gateway',
    rows: [
      ['Downlink', 'Ka 17.7–20.2 GHz'],
      ['Gateway', 'RF → fibre'],
      ['Placement', 'Few, well-sited'],
    ],
    note: 'The packet comes down to a ground gateway, which converts the radio link to high-capacity fibre. Because the mesh does the long-haul in orbit, relatively few gateways are needed.',
  },
  {
    eyebrow: 'INTO AWS',
    title: 'Straight into your cloud',
    rows: [
      ['Fibre to', 'Nearest AWS Region'],
      ['Then', 'Your VPC / private net'],
      ['Or', 'The internet'],
    ],
    note: 'Each gateway is wired to the nearest AWS Region over dedicated fibre. From there traffic can go straight into your private AWS network, on to another cloud, or out to the internet — the integration that sets Leo apart.',
  },
  {
    eyebrow: 'END TO END',
    title: 'The full round trip',
    rows: [
      ['The path', 'Terminal → sat → mesh → gateway → AWS'],
      ['Latency', '~20–40 ms round trip'],
      ['Private', 'Into AWS, not just the internet'],
    ],
    note: 'Terminal to orbit, across the mesh, down to a gateway, over fibre, into the cloud — and back, in tens of milliseconds. The laser mesh and native AWS on-ramp are what make the path short and private.',
  },
];

/* Appendix (also the a11y content). ui.js imports it — keep it exported. */
export const SPEC_TABLE = {
  caption: 'TABLE 1 — AMAZON LEO DATA PATH, PUBLIC FIGURES',
  head: ['Stage', 'Value', 'Remarks'],
  rows: [
    ['Terminal (user)', 'Nano 100 / Pro 400 / Ultra 1,000 Mbps', 'Ka-band electronically-steered phased arrays'],
    ['Uplink (Earth→space)', '27.5–30.0 GHz', 'Per FCC authorization'],
    ['Satellite altitude', '~590–630 km', 'Low Earth orbit'],
    ['Inter-satellite links', 'Optical (~1550 nm), ≤100 Gbps', 'Laser mesh; no ground hop per link'],
    ['Downlink (space→Earth)', '17.7–20.2 GHz', 'Per FCC authorization'],
    ['Gateway', 'RF → dedicated fibre', 'Aggregates to the terrestrial backbone'],
    ['Cloud on-ramp', 'Nearest AWS Region', 'Then VPC / private network / internet'],
    ['Round-trip latency', '~20–40 ms', 'Public physics; GEO ≈ 500–700 ms'],
  ],
};

export const COMPONENT_NOTES = [
  { tag: 'TERMINAL', title: 'The customer terminal', body: 'Amazon Leo offers three Ka-band terminals — Nano (up to ~100 Mbps), Pro (up to ~400 Mbps) and Ultra (up to ~1 Gbps / ~400 Mbps up). All use flat electronically-steered phased arrays (no moving dish) and transmit to the satellite in the ~27.5–30 GHz uplink band.' },
  { tag: 'SPACE', title: 'Uplink, mesh, downlink', body: 'The uplink reaches a satellite at ~590–630 km. In orbit, optical inter-satellite links (~1550 nm, up to ~100 Gbps) let the packet hop satellite-to-satellite toward the exit point without a ground hop per link. The downlink returns to Earth in the ~17.7–20.2 GHz band.' },
  { tag: 'AWS', title: 'Gateway and AWS on-ramp', body: 'A ground gateway converts the radio downlink to high-capacity fibre. Per Amazon’s public materials, every gateway connects back to the nearest AWS Region over dedicated fibre; traffic can then route into a customer’s private AWS network, on to another cloud, or out to the internet. Locations shown here are generic and schematic.' },
  { tag: 'LATENCY', title: 'Why it is fast', body: 'Distance sets latency. With satellites only a few hundred kilometres up, the end-to-end round trip is on the order of ~20–40 ms, versus ~500–700 ms for a geostationary satellite at 35,786 km. The optical mesh keeps long-haul traffic in orbit rather than making multiple ground hops.' },
];

export const PROVENANCE =
  'COMPILED SOLELY FROM PUBLIC SOURCES: FCC KUIPER/AMAZON LEO AUTHORIZATION & FILINGS · AMAZON PRESS & BLOG POSTS (TERMINALS · OISL · "KUIPER + AWS") · TRADE PRESS — RETRIEVED JUL 2026.<br>' +
  'FREQUENCIES, TERMINAL TIERS, LATENCY FIGURES AND THE GATEWAY→AWS ROUTING ARE PUBLIC RECORD. NOT DERIVED FROM ANY AMAZON INTERNAL DOCUMENT OR EXPORT-CONTROLLED (ITAR/EAR) DATA. SIGNAL-FLOW DIAGRAM IS SCHEMATIC / NOT TO SCALE. NO REAL GATEWAY OR AWS-REGION LOCATION IS SHOWN. FOR FAMILIARIZATION ONLY.';
