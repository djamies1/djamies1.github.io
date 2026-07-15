/* ============================================================
   drawing.js — boot-time generated repetitive SVG geometry.
   Unique geometry is hand-authored in index.html; everything
   here is patterned (edge zones, roofline earthwork, obstruction
   cell, phased-array element row + per-element phase strip,
   indoor-unit internals, exploded-view leader labels).

   The array element count/pitch below is a TOKEN illustration —
   NOT an actual figure. See the compliance header in data.js.
   ============================================================ */

import { XLABELS } from './data.js';

const NS = 'http://www.w3.org/2000/svg';
const $ = (id) => document.getElementById(id);

function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent.appendChild(n);
  return n;
}
function txt(attrs, content, parent) {
  const n = el('text', attrs, parent);
  n.textContent = content;
  return n;
}
/* drawable path: participates in the scene-0 dash draw-on */
function dr(d, cls, parent) {
  return el('path', { d, class: `${cls} dr`, pathLength: '1' }, parent);
}

/* ---------- sheet edge coordinate zones (1–8 / A–E) ---------- */
function buildZones() {
  const g = $('zones');
  const COL_W = 1488 / 8, ROW_H = 888 / 5;
  let ticks = '';
  for (let k = 1; k < 8; k++) {
    const x = 56 + k * COL_W;
    ticks += `M${x} 24 V56 M${x} 944 V976 `;
  }
  for (let k = 1; k < 5; k++) {
    const y = 56 + k * ROW_H;
    ticks += `M24 ${y} H56 M1544 ${y} H1576 `;
  }
  el('path', { d: ticks.trim(), class: 'ln-dim' }, g);
  for (let k = 0; k < 8; k++) {
    const x = 56 + (k + 0.5) * COL_W;
    txt({ x, y: 45, 'text-anchor': 'middle', 'font-size': 8, class: 't-low' }, String(k + 1), g);
    txt({ x, y: 965, 'text-anchor': 'middle', 'font-size': 8, class: 't-low' }, String(k + 1), g);
  }
  const rows = ['A', 'B', 'C', 'D', 'E'];
  for (let k = 0; k < 5; k++) {
    const y = 56 + (k + 0.5) * ROW_H + 3;
    txt({ x: 40, y, 'text-anchor': 'middle', 'font-size': 8, class: 't-low' }, rows[k], g);
    txt({ x: 1560, y, 'text-anchor': 'middle', 'font-size': 8, class: 't-low' }, rows[k], g);
  }
}

/* ---------- earthwork ticks under the roofline / mounting surface ---------- */
function buildRooflineTicks() {
  const g = $('roof-ticks');
  let d = '';
  for (let x = 604; x <= 996; x += 16) d += `M${x} 600 l-8 10 `;
  dr(d.trim(), 'ln-dim', g);
}

/* ---------- obstruction / rain cell (link-scene furniture) ---------- */
function buildObstruction() {
  const g = $('obstruction-lines');
  let d = '';
  for (let x = 756; x <= 846; x += 12) d += `M${x} 286 L${x - 12} 340 `;
  el('path', { d: d.trim(), class: 'ln-mid', 'stroke-width': 0.6 }, g);
}

/* ---------- phased-array element row + per-element phase strip ----------
   Element row is a token 15 radiators along the panel face (elevation).
   The phase strip is a static sawtooth ramp — the visual "phase gradient"
   the steer scene tilts. Count/pitch are illustrative, not actual. */
function buildArray() {
  const row = $('array-elements');
  const N = 15, X0 = 714, X1 = 886, Y = 411;
  const step = (X1 - X0) / (N - 1);
  let stems = '';
  for (let i = 0; i < N; i++) {
    const x = X0 + i * step;
    stems += `M${x} ${Y} V${Y - 7} `;                  // radiator stem
    el('circle', { cx: x, cy: Y, r: 1.5, class: 'ln-acc', 'stroke-width': 0.5 }, row);
  }
  el('path', { d: stems.trim(), class: 'ln-mid', 'stroke-width': 0.7 }, row);

  /* per-element phase strip: bars of ramped height under the array */
  const strip = $('phase-strip');
  const BY = 470;                                       // strip baseline
  el('path', { d: `M${X0 - 4} ${BY} H${X1 + 4}`, class: 'ln-dim', 'stroke-width': 0.5 }, strip);
  let tips = '';
  for (let i = 0; i < N; i++) {
    const x = X0 + i * step;
    const ph = (i / (N - 1));                           // 0→1 linear phase ramp (token)
    const hgt = 4 + ph * 12;
    el('path', { d: `M${x} ${BY} V${BY - hgt}`, class: 'ln-acc', 'stroke-width': 0.7 }, strip);
    tips += `${i ? 'L' : 'M'}${x} ${BY - hgt} `;
  }
  el('path', { d: tips.trim(), class: 'ln-acc dash-ext', 'stroke-width': 0.5 }, strip);

  /* plan-view lattice inset: a token 6×6 dot grid (looking down at the face) */
  const face = $('face-dots');
  const FN = 6, FX = 936, FS = 9.4, FY = 350;             // token grid — NOT actual count/pitch
  for (let r = 0; r < FN; r++) {
    for (let c = 0; c < FN; c++) {
      el('circle', { cx: FX + c * FS, cy: FY + r * FS, r: 1.15, class: 'ln-low', 'stroke-width': 0.45 }, face);
    }
  }
}

/* ---------- indoor unit internals (extractable; clipped by the reveal) ----------
   Small Wi-Fi router board; one accented card is the Prometheus baseband. */
function buildRouter() {
  const g = $('router-row');
  el('rect', { x: 726, y: 712, width: 148, height: 60, rx: 3, class: 'ln-mid' }, g);
  el('path', { d: 'M736 726 H864 M736 738 H864 M736 750 H820', class: 'ln-dim', 'stroke-width': 0.5 }, g);
  /* the Prometheus baseband card (accent) */
  el('rect', { x: 736, y: 720, width: 44, height: 30, class: 'ln-acc', 'stroke-width': 1, id: 'card-prometheus' }, g);
  el('rect', { x: 748, y: 728, width: 20, height: 14, class: 'ln-acc', 'stroke-width': 0.5 }, g);
  el('path', { d: 'M748 735 H740 M768 735 H776', class: 'ln-acc', 'stroke-width': 0.4 }, g);
  /* Wi-Fi radiate ticks from the corner */
  el('path', { d: 'M862 720 q10 -8 20 0 M862 715 q14 -12 28 0', class: 'ln-low', 'stroke-width': 0.5 }, g);
}

/* ---------- exploded money-shot leader labels ---------- */
function buildXLabels() {
  const root = $('x-labels');
  for (const L of XLABELS) {
    const g = el('g', { id: L.id }, root);
    const col = L.col ?? (L.side === 'L' ? 560 : 1040);
    const anchor = L.side === 'L' ? 'end' : 'start';
    const tx = L.side === 'L' ? col - 4 : col + 4;
    el('circle', { cx: L.ax, cy: L.ay, r: 2.6, fill: 'var(--signal)', stroke: 'none' }, g);
    el('path', { d: `M${L.ax} ${L.ay} L${L.ex} ${L.ey} H${col}`, class: 'ln-acc', 'stroke-width': 1.1, pathLength: '1' }, g);
    txt({ x: tx, y: L.ey - 5, 'font-size': 15, 'text-anchor': anchor, class: 't-hi t-500', 'letter-spacing': '0.14em' }, L.t, g);
    txt({ x: tx, y: L.ey + 11, 'font-size': 9.5, 'text-anchor': anchor, class: 't-low', 'letter-spacing': '0.12em' }, L.s, g);
  }
}

export function buildDrawing() {
  buildZones();
  buildRooflineTicks();
  buildObstruction();
  buildArray();
  buildRouter();
  buildXLabels();
}
