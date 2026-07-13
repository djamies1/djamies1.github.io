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

/* Scenes: label = timeline label; t = [start,end] on a 0–100 timeline;
   rail/aria naming; panel = index into PANELS. */
export const SCENES = [
  { id: 'draw',       t: [0, 14],   title: 'General arrangement', panel: 0 },
  { id: 'fairing',    t: [14, 26],  title: 'Payload fairing',     panel: 1 },
  { id: 'payload',    t: [26, 40],  title: 'Amazon Leo stack',    panel: 2 },
  { id: 'gs2',        t: [40, 51],  title: 'Second stage GS2',    panel: 3 },
  { id: 'interstage', t: [51, 59],  title: 'Forward module',      panel: 4 },
  { id: 'gs1',        t: [59, 71],  title: 'First stage GS1',     panel: 5 },
  { id: 'engines',    t: [71, 83],  title: 'Aft module & BE-4',   panel: 6 },
  { id: 'exploded',   t: [83, 100], title: 'Full breakdown',      panel: 7 },
];

/* Scroll length of the pinned stage, in viewport-heights. */
export const SCROLL_VH = 9;

export const PANELS = [
  {
    eyebrow: 'SHEET 1 · GENERAL ARRANGEMENT',
    title: 'New Glenn',
    rows: [
      ['Height', '98 m · 322 ft'],
      ['Diameter', '7.0 m'],
      ['Stages', '2'],
      ['To LEO', '45,000 kg'],
      ['To GTO', '13,600 kg'],
    ],
    note: 'Heavy-lift, partially reusable. Named for Mercury astronaut John Glenn, the first American to orbit the Earth.',
  },
  {
    eyebrow: 'SCENE 01 · PAYLOAD FAIRING',
    title: 'Payload fairing',
    rows: [
      ['Diameter', '7.0 m'],
      ['Construction', '2-pc composite'],
      ['Usable volume', '~2× a 5 m fairing'],
    ],
    note: 'Shields the payload through max-Q, then the halves jettison once the vehicle is above the discernible atmosphere.',
  },
  {
    eyebrow: 'SCENE 02 · AMAZON LEO STACK',
    title: 'Leo satellite stack',
    rows: [
      ['Satellites', '48'],
      ['Dispenser', '4-tier · 12 per tier'],
      ['Mission', 'LN-01 configuration'],
      ['Contract', 'First of 24 launches'],
    ],
    note: 'Amazon Leo’s largest single payload to date. Dispenser depiction is representative — the flight design isn’t public.',
  },
  {
    eyebrow: 'SCENE 03 · SECOND STAGE',
    title: 'GS2',
    rows: [
      ['Length', '23.4 m'],
      ['Engines', '2× BE-3U'],
      ['Propellant', 'LH2 + LOX'],
      ['Thrust (vac)', '1,779 kN'],
      ['Specific impulse', '445 s'],
      ['Burn time', '644 s'],
    ],
    note: 'Expendable, restartable hydrolox stage — relights to circularize and to place multi-orbit payloads.',
  },
  {
    eyebrow: 'SCENE 04 · FORWARD MODULE',
    title: 'Interstage',
    rows: [
      ['Houses', '2× BE-3U nozzles'],
      ['Fins', '4× actuated'],
      ['Also carries', 'Ground umbilicals'],
    ],
    note: 'The four forward fins steer the returning booster through re-entry — flying it like a glider back to the landing vessel.',
  },
  {
    eyebrow: 'SCENE 05 · FIRST STAGE',
    title: 'GS1',
    rows: [
      ['Length', '57.5 m'],
      ['Propellant', 'LNG + LOX'],
      ['LOX tank', '~850 m³'],
      ['LNG tank', '~710 m³'],
      ['Strakes', '2 aft'],
      ['Rated for', '25+ flights'],
    ],
    note: 'The booster flies back to a vertical landing on the sea platform Jacklyn, ~600 km downrange in the Atlantic.',
  },
  {
    eyebrow: 'SCENE 06 · AFT MODULE & ENGINES',
    title: 'BE-4 × 7',
    rows: [
      ['Engines', '7× BE-4'],
      ['Cycle', 'Ox-rich staged combustion'],
      ['Liftoff thrust', '19,928 kN'],
      ['Per engine', '~2,850 kN'],
      ['Burn time', '~190 s'],
      ['Landing gear', '6 legs, stowed'],
    ],
    note: 'The Ø8.5 m skirt shields the cluster through re-entry. Three engines relight for the landing burn.',
  },
  {
    eyebrow: 'SCENE 07 · FULL BREAKDOWN',
    title: 'Seven assemblies',
    rows: [
      ['Reused', 'GS1 booster'],
      ['Expended', 'GS2 + fairing'],
      ['Liftoff mass class', 'Heavy-lift'],
    ],
    note: 'Scroll back up to reassemble the vehicle — or continue below for the full specification table.',
  },
];

/* Exploded money-shot labels. ax/ay are anchors in EXPLODED coordinates
   (base geometry + EXPLODE offsets). side L: elbow→col at x 560 (text-end);
   side R: elbow→col at x 1040 (text-start). */
export const XLABELS = [
  { id: 'xl-fairing', side: 'L', ax: 648, ay: 2,   ex: 600, ey: 10,  t: 'PAYLOAD FAIRING',    s: '2-PC COMPOSITE' },
  { id: 'xl-payload', side: 'R', ax: 822, ay: 49,  ex: 960, ey: 20,  t: 'LEO SATELLITE STACK', s: '48 SATELLITES · LN-01' },
  { id: 'xl-gs2',     side: 'L', ax: 772, ay: 268, ex: 620, ey: 240, t: 'SECOND STAGE — GS2', s: '2× BE-3U · LH2 / LOX' },
  { id: 'xl-inter',   side: 'R', ax: 848, ay: 425, ex: 980, ey: 410, t: 'FORWARD MODULE',     s: '4× ACTUATED FINS' },
  { id: 'xl-gs1',     side: 'L', ax: 772, ay: 650, ex: 620, ey: 640, t: 'FIRST STAGE — GS1',  s: '57.5 m · 25+ FLIGHTS' },
  { id: 'xl-aft',     side: 'R', ax: 836, ay: 930, ex: 980, ey: 918, t: 'AFT MODULE',         s: '6 LEGS · Ø 8.5 m SKIRT' },
  { id: 'xl-be4',     side: 'L', ax: 778, ay: 968, ex: 620, ey: 972, t: 'BE-4 × 7',           s: '19,928 kN LIFTOFF' },
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
