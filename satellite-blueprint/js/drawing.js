/* ============================================================
   drawing.js — boot-time generated repetitive SVG geometry.
   Unique geometry is hand-authored in index.html; everything
   here is patterned (edge zones, solar-cell grids, antenna
   apertures, exploded-view leader labels).
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

/* ---------- solar wing cell grid (3 panels × 5 cols × 3 rows) ---------- */
function buildWingCells() {
  const g = $('wing-cells');
  let d = '';
  for (const y0 of [132, 236, 340]) {
    for (const x of [755, 785, 815, 845]) d += `M${x} ${y0} V${y0 + 92} `;
    d += `M725 ${y0 + 30.7} H875 M725 ${y0 + 61.3} H875 `;
  }
  dr(d.trim(), 'ln-dim', g);
}

/* ---------- nadir phased-array apertures (3, representative) ---------- */
function buildApertures() {
  const g = $('apertures');
  for (const x of [716, 776, 836]) {
    el('rect', { x, y: 781, width: 48, height: 21, rx: 3, class: 'ln-hi dr', pathLength: '1' }, g);
    el('rect', { x: x + 4, y: 785, width: 40, height: 13, rx: 2, class: 'ln-dim dr', pathLength: '1' }, g);
    dr(`M${x + 24} 802 V806`, 'ln-low', g);
  }
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
  buildWingCells();
  buildApertures();
  buildXLabels();
}
