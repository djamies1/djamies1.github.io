/* ============================================================
   data.js — single source of truth.

   ⚠⚠ COMPLIANCE — READ THIS FIRST ⚠⚠
   This is an ECONOMICS sheet and therefore the highest-care sheet
   in the set. EVERY figure here is a PUBLIC ANALYST OR PRESS
   ESTIMATE (or a public Amazon statement), retrieved Jul 2026 —
   NOT an Amazon internal figure, and NOT to be reconciled with,
   corrected by, or replaced with any internal number. This sheet
   is ILLUSTRATIVE. If in doubt, leave it out.

   The persistent disclaimer ("ILLUSTRATIVE — PUBLIC ESTIMATES
   ONLY · NOT AMAZON FIGURES"), the notes, and the stamp are
   load-bearing compliance chrome — never remove them. Figures are
   approximate and move fast; the sheet is dated "as of Jul 2026".
   Amounts are order-of-magnitude and schematic (NTS).
   ============================================================ */

/* Camera presets: world point (px,py) centered at sheet (800,500) at zoom z.
   A left→right "money flow": capital in → build → service → revenue → market,
   with an illustrative spend/earn curve below. */
export const CAM = {
  full:   { px: 770, py: 486, z: 0.92 },   // the whole flow (recap)
  disc:   { px: 770, py: 250, z: 1.08 },   // the disclaimer band
  capex:  { px: 250, py: 420, z: 1.48 },   // capital in
  build:  { px: 520, py: 430, z: 1.4 },    // what it buys (cost stack)
  unit:   { px: 720, py: 590, z: 1.44 },   // terminal unit economics
  rev:    { px: 1000, py: 430, z: 1.4 },   // service → revenue
  market: { px: 1290, py: 410, z: 1.4 },   // TAM / market
  bet:    { px: 770, py: 664, z: 1.06 },   // the spend-now / earn-later curve
};

export const SCENES = [
  { id: 'disc',   t: [0,    14.5],  title: 'Ground rules',        panel: 1 },
  { id: 'capex',  t: [14.5, 29.0],  title: 'The upfront bet',     panel: 2 },
  { id: 'build',  t: [29.0, 43.5],  title: 'Where it goes',       panel: 3 },
  { id: 'unit',   t: [43.5, 58.0],  title: 'The terminal unit',   panel: 4 },
  { id: 'rev',    t: [58.0, 73.0],  title: 'What it might earn',   panel: 5 },
  { id: 'market', t: [73.0, 86.5],  title: 'The market',          panel: 6 },
  { id: 'recap',  t: [86.5, 100],   title: 'Spend now, earn later', panel: 7 },
];

export const SCROLL_VH = 9.5;

export const PANELS = [
  {
    eyebrow: 'AMAZON LEO · ECONOMICS',
    title: 'The shape of the bet',
    rows: [
      ['What', 'Cost in, revenue out'],
      ['Basis', 'Public estimates only'],
      ['Not', 'Amazon internal figures'],
    ],
    note: 'The rough economics of a LEO network — spend a lot upfront, earn it back over years. Every number here is a public analyst or press estimate, illustrative, as of Jul 2026. Not Amazon figures.',
  },
  {
    eyebrow: 'GROUND RULES',
    title: 'Public estimates only',
    rows: [
      ['Every figure', 'Analyst / press'],
      ['None is', 'Amazon internal'],
      ['Treat as', 'Illustrative'],
    ],
    note: 'Before any numbers: this sheet is built entirely from public reporting and analyst estimates and is illustrative only. It is not, and must not be reconciled with, any internal Amazon figure.',
  },
  {
    eyebrow: 'THE UPFRONT BET',
    title: 'Spend first',
    rows: [
      ['Committed', '>$10B (public)'],
      ['2026', '~+$1B (reports)'],
      ['Nature', 'Heavy, early'],
    ],
    note: 'Public reporting puts Amazon’s commitment to the programme at well over $10 billion, rising by roughly a billion in 2026 — a large, front-loaded infrastructure bet before meaningful revenue arrives.',
  },
  {
    eyebrow: 'WHERE IT GOES',
    title: 'Satellites, launch, boxes',
    rows: [
      ['Satellites', '~1,000 / yr (build)'],
      ['Launch', '~83 (largest buy)'],
      ['Terminals', 'sub-$400 → sub-$200'],
    ],
    note: 'The spend goes three main places: building satellites (~1,000/yr at Kirkland), buying launch (the largest commercial procurement ever), and terminals — which Amazon says cost under $400 to make, targeting under $200 at scale.',
  },
  {
    eyebrow: 'THE UNIT',
    title: 'Razor and blades',
    rows: [
      ['Make for', 'sub-$400 (Pro)'],
      ['Sell', 'Nearer cost / subsidised'],
      ['Recoup', 'Monthly service'],
    ],
    note: 'The terminal is the classic razor-and-blades play: sell the hardware cheap — at or below cost — to win a subscriber, then earn it back over months of recurring service. Cheaper terminals mean more subscribers.',
  },
  {
    eyebrow: 'WHAT IT MIGHT EARN',
    title: 'Recurring revenue',
    rows: [
      ['Consumer', '~$50–100 / mo (target)'],
      ['Plus', 'Enterprise + AWS'],
      ['Shape', 'Recurring, growing'],
    ],
    note: 'Revenue is recurring: a monthly consumer price reportedly targeted around $50–100, plus enterprise contracts and AWS pull-through. The AWS tie-in is the differentiator analysts point to as the margin story.',
  },
  {
    eyebrow: 'THE MARKET',
    title: 'How big is the prize',
    rows: [
      ['TAM', '~$61B by 2030 (analyst)'],
      ['Leo revenue', '~$20B by 2030 (reports)'],
      ['Share aim', '25–35% (analyst)'],
    ],
    note: 'Analysts size the satellite-broadband market at roughly $61 billion by 2030; public reporting has floated ~$20 billion in annual Leo revenue by 2030, implying a large share. For scale, Starlink reported ~$11.4B in 2025.',
  },
  {
    eyebrow: 'THE BET',
    title: 'Spend now, earn later',
    rows: [
      ['Now', 'Heavy capex'],
      ['Later', 'Recurring + AWS'],
      ['Illustrative', 'Public estimates'],
    ],
    note: 'The whole shape in one line: a deep, early spend that a large recurring-revenue base and AWS pull-through are meant to repay over years — the classic infrastructure J-curve. Illustrative; public estimates only, as of Jul 2026.',
  },
];

export const SPEC_TABLE = {
  caption: 'TABLE 1 — LEO ECONOMICS, PUBLIC ESTIMATES ONLY (ILLUSTRATIVE, JUL 2026)',
  head: ['Item', 'Public estimate', 'Source type'],
  rows: [
    ['Capital committed', '>$10B (+~$1B in 2026)', 'Press reports'],
    ['Satellite production', '~1,000 / yr (5/day, Kirkland)', 'Amazon / press'],
    ['Launch procurement', '~83 launches (largest ever)', 'Launch providers / press'],
    ['Terminal build cost', '<$400 (Pro), target <$200', 'Amazon statements'],
    ['Consumer price', '~$50–100 / mo (target)', 'Reports / analyst'],
    ['Market (TAM)', '~$61B by 2030', 'Analyst'],
    ['Leo revenue', '~$20B/yr by 2030', 'Press reports'],
    ['Market share aim', '25–35%', 'Analyst'],
    ['Starlink (context)', '~$11.4B 2025 revenue', 'Reports / analyst'],
  ],
};

export const COMPONENT_NOTES = [
  { tag: 'DISCLAIMER', title: 'Read this first', body: 'Every figure on this sheet is a public analyst estimate, a press report, or a public Amazon statement, retrieved Jul 2026. Nothing here is an Amazon internal figure, and nothing here should be reconciled with, corrected by, or replaced with an internal number. The sheet is illustrative and order-of-magnitude only.' },
  { tag: 'COSTS', title: 'The upfront spend', body: 'Public reporting puts Amazon’s commitment to the programme above $10 billion, with roughly a further $1 billion in 2026. The money goes to building satellites (~1,000/yr at the Kirkland factory), buying launch (the largest commercial launch procurement in history), and terminals, which Amazon says cost under $400 to produce (Pro), targeting under $200 at scale.' },
  { tag: 'REVENUE', title: 'The earning side', body: 'Revenue is recurring: a consumer monthly price reportedly targeted around $50–100, plus enterprise contracts and AWS pull-through. The terminal is a razor-and-blades unit — sold near or below cost to win a subscriber, then recouped over months of service. Analysts frame AWS integration as the margin differentiator versus Starlink.' },
  { tag: 'MARKET', title: 'The prize', body: 'Analyst estimates size the satellite-broadband market at roughly $61 billion by 2030; public reporting has cited ~$20 billion in annual Leo revenue by 2030 (with some analysts modelling higher later in the decade) and market-share ambitions of 25–35%. For scale, Starlink publicly reported ~$11.4B revenue in 2025. All figures approximate and public.' },
];

export const PROVENANCE =
  'COMPILED SOLELY FROM PUBLIC ANALYST ESTIMATES, PRESS REPORTS AND PUBLIC AMAZON STATEMENTS — RETRIEVED JUL 2026.<br>' +
  'ILLUSTRATIVE AND ORDER-OF-MAGNITUDE ONLY. EVERY FIGURE IS A PUBLIC ESTIMATE — NONE IS AN AMAZON INTERNAL FIGURE, AND NONE IS TO BE RECONCILED WITH INTERNAL DATA. NOT DERIVED FROM ANY AMAZON INTERNAL DOCUMENT OR EXPORT-CONTROLLED (ITAR/EAR) DATA. AMOUNTS SCHEMATIC / NOT TO SCALE. FIGURES APPROXIMATE, AS OF JUL 2026. FOR FAMILIARIZATION ONLY.';
