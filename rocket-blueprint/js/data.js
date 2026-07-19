/* ============================================================
   data.js — single source of truth.
   Every string, figure, camera preset and explode offset lives
   here so content review (and future edits) touch one file.
   World units: 1 m = 8 u. Vehicle axis x=800, tip y=108, aft y=892.
   ============================================================ */

/* Camera presets: world point (px,py) centered at sheet (800,500) at zoom z.
   py values account for that scene's cumulative explode offsets. */
export const CAM = {
  full:       { px: 800,  py: 500, z: 1.0 },
  fairing:    { px: 800,  py: 178, z: 2.9 },
  payload:    { px: 800,  py: 180, z: 3.4 },
  gs2:        { px: 800,  py: 278, z: 2.5 },   // upper stack lifted −60 by now
  interstage: { px: 800,  py: 452, z: 3.2 },
  gs1:        { px: 800,  py: 650, z: 1.8 },
  engines:    { px: 985,  py: 830, z: 2.2 },   // frames aft module + DETAIL A inset
  exploded:   { px: 800,  py: 454, z: 0.78 },
};

/* Full exploded-view offsets (world units). Groups take a shared y lift;
   the fairing halves carry extra x/rotation on top of their group
   (total fairing offset = groups['asm-fairing'] + halves y = −185).
   Home = all zeros → reassembly is a tween back to 0. */
export const EXPLODE = {
  groups: {
    'asm-fairing': -120,
    'asm-payload': -120,
    'asm-gs2': -70,
    'asm-interstage': -32,
    'asm-gs1': 0,
    'asm-aft': 74,
  },
  halves: {
    'fairing-l': { x: -115, y: -65, rotation: -12 },
    'fairing-r': { x:  115, y: -65, rotation:  12 },
  },
};

/* Staging-gap lift applied when GS2 separates (scene 3 onward). */
export const STAGING_LIFT = -60;

/* Scenes drive the rail + progress bar. t = [start,end] as a 0–100 % of the
   VISIBLE run. The draw-on intro is pre-rolled (see START in timeline.js) so the
   widget lands already-drawn at the first component scene; scrolling pans into it.
   These % are the master timeline's scene bounds (14→100) remapped to 0→100.
   panel = index into PANELS. */
export const SCENES = [
  { id: 'fairing',    t: [0, 14.0],    title: 'The nose cone',          panel: 1 },
  { id: 'payload',    t: [14.0, 30.2], title: 'The satellites onboard', panel: 2 },
  { id: 'gs2',        t: [30.2, 43.0], title: 'The upper stage',        panel: 3 },
  { id: 'interstage', t: [43.0, 52.3], title: 'Steering it home',       panel: 4 },
  { id: 'gs1',        t: [52.3, 66.3], title: 'The booster',            panel: 5 },
  { id: 'engines',    t: [66.3, 80.2], title: 'Seven main engines',     panel: 6 },
  { id: 'exploded',   t: [80.2, 100],  title: 'Every part',             panel: 7 },
];

/* Scroll length of the pinned stage, in viewport-heights. */
export const SCROLL_VH = 9;

export const PANELS = [
  {
    eyebrow: 'BLUE ORIGIN · NEW GLENN',
    title: 'New Glenn',
    rows: [
      ['What it is', 'A heavy-lift rocket'],
      ['Height', '98 m — a 30-storey building'],
      ['Launches', 'Amazon Leo satellites'],
    ],
    note: 'The heavy-lift rocket that carries Amazon Leo satellites to orbit — partly reusable, and named for astronaut John Glenn. An illustration from public information only, not to scale.',
  },
  {
    eyebrow: 'THE NOSE CONE',
    title: 'The nose cone',
    rows: [
      ['Job', 'Protects the satellites'],
      ['Made of', 'Two clamshell halves'],
      ['Then', 'Splits off in space'],
    ],
    note: 'A wide protective shell over the satellites for the ride up through the atmosphere. Once above the air, the two halves split open and drop away.',
  },
  {
    eyebrow: 'THE PAYLOAD',
    title: 'The satellites onboard',
    rows: [
      ['This launch', '48 Amazon Leo satellites'],
      ['Stacked', 'Four tiers on a carrier'],
      ['Part of', '24 launches booked'],
    ],
    note: 'This rocket’s biggest single load: 48 Leo satellites stacked on a carrier — the first of two dozen New Glenn launches booked for the network. The carrier drawn here is illustrative.',
  },
  {
    eyebrow: 'THE UPPER STAGE',
    title: 'The upper stage',
    rows: [
      ['Its job', 'Carries the satellites to orbit'],
      ['Where', 'Fires in space, above the air'],
      ['Reused?', 'No — the one part used once'],
    ],
    note: 'Once the booster drops away, this smaller top stage carries the satellites the rest of the way — and can restart its engines to place them in exactly the right orbit.',
  },
  {
    eyebrow: 'BRINGING THE BOOSTER BACK',
    title: 'Steering it home',
    rows: [
      ['Four fins', 'Steer it through re-entry'],
      ['Like', 'Flying it back like a glider'],
      ['Goal', 'Land the booster to reuse it'],
    ],
    note: 'Four fins near the top of the booster steer it through the fiery return, flying the empty booster back toward a landing so it can be used again.',
  },
  {
    eyebrow: 'THE BOOSTER',
    title: 'The booster',
    rows: [
      ['The big part', 'Does the heavy lifting'],
      ['Lands', 'Upright on a ship at sea'],
      ['Reused', '25+ flights'],
    ],
    note: 'The tall lower stage does the heavy lifting off the pad, then flies back to land upright on a ship at sea — built to fly 25 or more times.',
  },
  {
    eyebrow: 'THE ENGINES',
    title: 'Seven main engines',
    rows: [
      ['Count', '7 at the base'],
      ['Fuel', 'Natural gas + oxygen'],
      ['Landing', '3 relight to touch down'],
    ],
    note: 'Seven big engines fire together at liftoff. A protective skirt shields them on the way back, and three relight to set the booster down gently.',
  },
  {
    eyebrow: 'EVERY PART',
    title: 'Every part, laid out',
    rows: [
      ['Reused', 'The booster'],
      ['Used once', 'Upper stage + nose cone'],
      ['Drawing', 'Illustrative · not to scale'],
    ],
    note: 'Hit replay — or scroll back — to run it again.',
  },
];

/* Exploded money-shot labels. ax/ay are anchors in EXPLODED coordinates
   (base geometry + EXPLODE offsets). side L: elbow→col at x 560 (text-end);
   side R: elbow→col at x 1040 (text-start). */
export const XLABELS = [
  { id: 'xl-fairing', side: 'L', ax: 648, ay: 2,   ex: 600, ey: 10,  t: 'NOSE CONE',      s: 'PROTECTS THE SATELLITES' },
  { id: 'xl-payload', side: 'R', ax: 822, ay: 49,  ex: 960, ey: 20,  t: 'THE SATELLITES', s: '48 ONBOARD · STACKED IN TIERS' },
  { id: 'xl-gs2',     side: 'L', ax: 772, ay: 268, ex: 620, ey: 240, t: 'UPPER STAGE',    s: 'CARRIES SATS TO ORBIT' },
  { id: 'xl-inter',   side: 'R', ax: 848, ay: 425, ex: 980, ey: 410, t: 'STEERING FINS',  s: 'FLY THE BOOSTER HOME' },
  { id: 'xl-gs1',     side: 'L', ax: 772, ay: 650, ex: 620, ey: 640, t: 'THE BOOSTER',    s: 'LANDS UPRIGHT · REUSED 25+ TIMES' },
  { id: 'xl-aft',     side: 'R', ax: 836, ay: 930, ex: 980, ey: 918, t: 'ENGINE BAY',     s: 'LANDING LEGS + HEAT SKIRT' },
  { id: 'xl-be4',     side: 'L', ax: 778, ay: 968, ex: 620, ey: 972, t: 'SEVEN ENGINES',  s: 'FIRE AT LIFTOFF' },
];

/* Outro: full spec table + per-component prose (also the a11y content). */
export const SPEC_TABLE = {
  caption: 'TABLE 1 — NEW GLENN GENERAL SPECIFICATIONS (7-ENGINE / 2-STAGE CONFIGURATION)',
  head: ['Item', 'Value', 'Remarks'],
  rows: [
    ['Overall height', '98 m (322 ft)', 'About a 30-storey building'],
    ['Core diameter', '7.0 m (23 ft)', 'Single-barrel through both stages'],
    ['Payload to LEO', '45,000 kg', 'Reusable-booster mission profile'],
    ['Payload to GTO', '13,600 kg', ''],
    ['First stage (GS1)', '57.5 m · 7× BE-4', 'LNG/LOX · 19,928 kN at liftoff · 25+ flights'],
    ['Second stage (GS2)', '23.4 m · 2× BE-3U', 'LH2/LOX · 1,779 kN vac · Isp 445 s · expendable'],
    ['Payload fairing', 'Ø7.0 m, 2-pc composite', '~2× usable volume of 5 m-class fairings'],
    ['Booster landing', 'LPV-1 “Jacklyn”', 'Sea platform ~600 km downrange'],
    ['Amazon Leo payload', '48 satellites', '4-tier dispenser · LN-01 · first of 24 launches'],
  ],
};

export const COMPONENT_NOTES = [
  { tag: 'FAIRING', title: 'Payload fairing', body: 'Two composite halves, seven metres across — roughly twice the usable volume of the 5 m fairings most heavy payloads fly in today. The extra width is what lets a full four-tier Leo stack ride in one launch.' },
  { tag: 'PAYLOAD', title: 'Amazon Leo satellite stack', body: 'The LN-01 configuration carries 48 Leo satellites on a four-tier dispenser — the largest single Leo payload to date, and the first of 24 contracted New Glenn launches for the constellation. The dispenser drawn here is representative; the flight hardware design is not public.' },
  { tag: 'GS2', title: 'Second stage', body: 'A 23.4 m hydrolox stage powered by two vacuum-optimized BE-3U engines totalling 1,779 kN. High specific impulse (445 s) and restart capability let it deliver multi-orbit constellations, then dispose of itself. It is the expendable part of the vehicle.' },
  { tag: 'FWD MODULE', title: 'Interstage / forward module', body: 'Structurally part of the booster: it shelters the second stage’s nozzles at liftoff, carries ground umbilicals, and mounts the four actuated fins that steer the empty booster through re-entry.' },
  { tag: 'GS1', title: 'First stage', body: 'The 57.5 m reusable booster. Around 850 m³ of liquid oxygen and 710 m³ of liquefied natural gas feed the engines; two large aft strakes give the returning stage lift and cross-range. Rated for at least 25 flights.' },
  { tag: 'AFT + BE-4', title: 'Aft module and engines', body: 'Seven BE-4 engines — oxygen-rich staged combustion, ~2,850 kN each — deliver 19,928 kN at liftoff. The 8.5 m skirt protects the cluster during re-entry and stows six landing legs; three engines relight to land on the sea platform Jacklyn.' },
];

export const PROVENANCE =
  'SOURCES: BLUE ORIGIN PUBLIC MATERIALS · WIKIPEDIA (NEW GLENN) · NASASPACEFLIGHT · AMAZON LEO ANNOUNCEMENTS — RETRIEVED JUL 2026.<br>' +
  'REPRESENTATIVE GEOMETRY, NOT FOR ENGINEERING USE. NOT AFFILIATED WITH OR ENDORSED BY BLUE ORIGIN. DRAWN FOR AMAZON LEO FAMILIARIZATION.';
