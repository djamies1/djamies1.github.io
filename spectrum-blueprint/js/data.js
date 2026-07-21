/* ============================================================
   data.js — single source of truth.
   Every string, figure, camera preset and band position lives
   here so content review (and future edits) touch one file.

   ⚠ COMPLIANCE — READ BEFORE EDITING ⚠
   Everything in this file is compiled SOLELY from public sources
   (FCC authorizations & filings, ITU/WRC records, Ofcom, Amazon
   press/blog posts, mainstream reporting — retrieved Jul 2026).
   Frequencies and licensing rules are public regulatory record.
   It is NOT derived from, informed by, or checked against any
   Amazon internal document or export-controlled (ITAR/EAR) data.
   Keep it that way: never add a figure without a public citation
   in PROVENANCE.

   The frequency axis is SCHEMATIC (log scale, NTS). World units
   are arbitrary; the sheet is a drafting sheet, not a datasheet.
   ============================================================ */

/* Camera presets: world point (px,py) centered at sheet (800,500) at zoom z.
   The chart is a wide horizontal frequency axis, so scenes pan left→right. */
export const CAM = {
  full:    { px: 800,  py: 500, z: 1.0 },
  wave:    { px: 400,  py: 320, z: 1.6 },   // top motif + EM rainbow reference
  bands:   { px: 600,  py: 606, z: 1.15 },  // the whole band ruler
  ka:      { px: 500,  py: 716, z: 1.7 },   // Ka bracket + DETAIL A
  why:     { px: 865,  py: 406, z: 1.8 },   // rain-fade plot
  duplex:  { px: 1008, py: 786, z: 1.7 },   // up/down + reuse
  optical: { px: 1324, py: 712, z: 1.75 },  // optical band + laser detail (amber)
  license: { px: 1290, py: 372, z: 1.5 },   // the licensing stack
};

/* Scenes drive the rail + progress bar. t = [start,end] as a 0–100 % of the
   VISIBLE run. The draw-on intro is pre-rolled (see START in timeline.js) so the
   widget lands already-drawn at the first scene; scrolling pans across the chart.
   These % are the master timeline's scene bounds (14→100) remapped to 0→100.
   panel = index into PANELS. */
export const SCENES = [
  { id: 'wave',    t: [0,    14.0],  title: 'What spectrum is',        panel: 1 },
  { id: 'bands',   t: [14.0, 29.1],  title: 'The bands, end to end',   panel: 2 },
  { id: 'ka',      t: [29.1, 43.0],  title: 'Amazon Leo runs on Ka',   panel: 3 },
  { id: 'why',     t: [43.0, 57.0],  title: 'Why Ka, not Ku',          panel: 4 },
  { id: 'duplex',  t: [57.0, 72.1],  title: 'Uplink, downlink, reuse', panel: 5 },
  { id: 'optical', t: [72.1, 86.0],  title: 'Beyond radio: lasers',    panel: 6 },
  { id: 'license', t: [86.0, 100],   title: 'Licensing the sky',       panel: 7 },
];

/* Scroll length of the pinned stage, in viewport-heights. */
export const SCROLL_VH = 9.5;

/* Frequency bands drawn as brackets above the axis. f0/f1 in GHz map through the
   log axis (drawing.js XF); the optical block sits past the scale break so it
   carries explicit ox0/ox1. hero = the Amazon Leo band (cyan); laser = optical
   (the one amber accent). */
export const BANDS = [
  { id: 'inc', f0: 1,  f1: 12, label: 'L · S · C · X', sub: 'INCUMBENTS · CROWDED' },
  { id: 'ku',  f0: 12, f1: 17, label: 'Ku',            sub: 'STARLINK' },
  { id: 'ka',  f0: 17, f1: 30, label: 'Ka',            sub: 'AMAZON LEO', hero: true },
  { id: 'qv',  f0: 37, f1: 75, label: 'Q · V',         sub: 'FUTURE' },
  { id: 'opt', ox0: 1230, ox1: 1440, label: 'OPTICAL', sub: 'LASER CROSSLINKS', laser: true },
];

/* Licensing stack boxes (scene 7), top → bottom. */
export const LICENSE_STEPS = [
  { n: '1', title: 'ITU — GLOBAL', sub: 'A world body carves the airwaves into', sub2: 'services and bands (set at the WRC).', accent: true },
  { n: '2', title: 'FCC — NATIONAL', sub: 'Nations license operators. The US files', sub2: 'in "rounds": apply together, share equally.', accent: true },
  { n: '3', title: 'EPFD — GUARDRAIL', sub: 'New low-orbit systems must dim their signal', sub2: 'to protect older satellites up in high orbit.', accent: true },
  { n: '4', title: 'MILESTONES', sub: 'Use it or lose it: half the fleet up within', sub2: '6 years, all of it within 9 — a hard deadline.', accent: true },
];

/* Callout cards, one per scene (panel-0 overview is authored but never shown —
   the widget lands on scene 1). Kept short so the card height barely shifts. */
export const PANELS = [
  {
    eyebrow: 'AMAZON LEO · SPECTRUM',
    title: 'Radio spectrum',
    rows: [
      ['What it is', 'The airwaves, split into bands'],
      ['Leo uses', 'Ka-band radio + laser light'],
      ['Shown', 'Public FCC / ITU record only'],
    ],
    note: 'How a satellite network picks its slice of the airwaves — and how it is allowed to use it. Built from public information only.',
  },
  {
    eyebrow: 'WHAT SPECTRUM IS',
    title: 'One family of waves',
    rows: [
      ['Radio & light', 'The same thing, different speed'],
      ['Higher frequency', 'Shorter wavelength'],
      ['Visible light', 'Just a tiny slice'],
    ],
    note: 'Radio and light are the same kind of wave — frequency just says how fast it wiggles. Satellites work in radio, far below what your eye can see.',
  },
  {
    eyebrow: 'THE BANDS',
    title: 'The bands, end to end',
    rows: [
      ['Low bands', 'Crowded with old users'],
      ['Higher up', 'More room, newer systems'],
      ['The catch', 'Higher is trickier to use'],
    ],
    note: 'Spectrum is divided into named bands from low to high. The low bands are packed with decades of incumbents, so new satellite systems climb higher to find open room.',
  },
  {
    eyebrow: 'AMAZON LEO · Ka-BAND',
    title: 'Leo runs on Ka',
    rows: [
      ['Downlink', '17.7–20.2 GHz'],
      ['Uplink', '27.5–30 GHz'],
      ['Antennas', 'Flat Ka phased arrays'],
    ],
    note: 'Amazon Leo works in Ka-band: it receives around 17–20 GHz and transmits around 27–30 GHz, through flat electronically-steered antennas about 30 cm across.',
  },
  {
    eyebrow: 'WHY Ka, NOT Ku',
    title: 'Room vs. rain',
    rows: [
      ['Go higher', 'More bandwidth, more speed'],
      ['The cost', 'Rain fades high bands more'],
      ['The fix', 'Low orbit + adaptive coding'],
    ],
    note: 'Higher bands carry more data, but rain absorbs them more. Ku is tougher in weather yet crowded; Ka is roomier. A low orbit and coding that adapts in real time keep Ka reliable.',
  },
  {
    eyebrow: 'ONE LINK, TWO WAYS',
    title: 'Up, down, reuse',
    rows: [
      ['Uplink', 'Ground → satellite'],
      ['Downlink', 'Satellite → ground'],
      ['Reuse', 'Same band, many beams'],
    ],
    note: 'Each link splits into an uplink and a downlink on different frequencies so they never collide. The same band is reused across many spot beams, multiplying total capacity.',
  },
  {
    eyebrow: 'BEYOND RADIO',
    title: 'Laser crosslinks',
    rows: [
      ['Between sats', 'Infrared laser light'],
      ['Speed', 'Up to ~100 Gbps per link'],
      ['Licence', 'None needed for light'],
    ],
    note: 'In space, satellites talk to each other with laser light instead of radio. Light needs no spectrum licence, never gets congested, and carries enormous bandwidth.',
  },
  {
    eyebrow: 'LICENSING THE SKY',
    title: 'Licensing the sky',
    rows: [
      ['Global', 'ITU sets the bands'],
      ['National', 'FCC grants the rights'],
      ['Keep it', 'Hit the deadlines'],
    ],
    note: 'Nobody owns the air. The ITU divides it globally, regulators like the FCC grant slices, rules protect older satellites, and you must deploy on time or lose the licence.',
  },
];

/* Appendix (also the a11y content). Not rendered in the widget. */
export const SPEC_TABLE = {
  caption: 'TABLE 1 — AMAZON LEO SPECTRUM, PUBLIC FIGURES',
  head: ['Item', 'Value', 'Remarks'],
  rows: [
    ['User & gateway links', 'Ka-band', 'Electronically-steered phased arrays, ~30 cm'],
    ['Downlink (space→Earth)', '17.7–18.6 & 18.8–20.2 GHz', 'Per FCC authorization'],
    ['Uplink (Earth→space)', '27.5–30.0 GHz', 'Per FCC authorization'],
    ['MSS feeder links', '19.4–19.6 & 29.1–29.5 GHz', 'Additional grant'],
    ['Inter-satellite links', 'Optical (~1550 nm)', 'Infrared laser, up to ~100 Gbps; no RF licence'],
    ['Constellation', '3,236 satellites', 'FCC condition: 1,618 (50%) deployed by Jul 2026'],
    ['Licensing path', 'ITU → FCC processing round', 'Equal priority within a round; EPFD limits protect GSO'],
    ['Deployment milestones', '50% / 6 yr · 100% / 9 yr', 'Standard NGSO rule'],
  ],
};

export const COMPONENT_NOTES = [
  { tag: 'SPECTRUM', title: 'What spectrum is', body: 'Radio and visible light are the same electromagnetic wave at different frequencies. "Spectrum" is the usable range of radio frequencies; it is divided into named bands (from low VHF up through microwave Ka, Q and V) and, higher still, into infrared and visible light used by lasers.' },
  { tag: 'Ka-BAND', title: 'Why Amazon Leo uses Ka', body: 'Amazon Leo (formerly Project Kuiper) is authorized in Ka-band: roughly 17.7–20.2 GHz space-to-Earth and 27.5–30.0 GHz Earth-to-space, plus feeder-link slices near 19.4/29.1 GHz. Ka offers large contiguous bandwidth for high capacity and allows compact ~30 cm phased arrays; the trade is greater rain fade, managed by the low orbit and adaptive coding. Starlink, by contrast, serves users in the lower Ku-band.' },
  { tag: 'OPTICAL', title: 'Optical inter-satellite links', body: 'Between satellites, Leo uses infrared laser terminals (~1550 nm, up to ~100 Gbps per link) rather than radio. Light is unlicensed, uncongested and very high bandwidth — ideal for a mesh in orbit. Radio is used to reach the ground; light is used across the sky.' },
  { tag: 'LICENSING', title: 'How spectrum is licensed', body: 'The ITU allocates spectrum globally at World Radiocommunication Conferences; national regulators (e.g. the FCC) then license operators. In the US, NGSO systems apply in "processing rounds" and share spectrum with equal priority within a round. EPFD limits (from WRC-97/2000) cap the interference low-orbit systems may cause to geostationary satellites, and deployment milestones require 50% of a constellation within 6 years and 100% within 9.' },
];

export const PROVENANCE =
  'COMPILED SOLELY FROM PUBLIC SOURCES: FCC KUIPER AUTHORIZATION & NGSO FILINGS · ITU / WRC RECORDS (EPFD) · OFCOM · AMAZON PRESS & BLOG POSTS · TRADE PRESS — RETRIEVED JUL 2026.<br>' +
  'FREQUENCIES AND LICENSING RULES ARE PUBLIC REGULATORY RECORD. NOT DERIVED FROM ANY AMAZON INTERNAL DOCUMENT OR EXPORT-CONTROLLED (ITAR/EAR) DATA. FREQUENCY AXIS IS SCHEMATIC / NOT TO SCALE. FOR FAMILIARIZATION ONLY.';
