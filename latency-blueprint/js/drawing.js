/* ============================================================
   drawing.js — boot-time generated furniture.
   The Earth surface, the three orbit levels, their satellites,
   the signal paths and the coverage cones are hand-authored in
   index.html; generated here: the sheet zones, the log latency
   scale (scene 6) and the LEO fleet row (scene 5).
   ============================================================ */

import { GEOM } from './data.js';

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
function sat(x, y, s, cls, parent) {
  const g = el('g', {}, parent);
  el('path', { d: `M${x} ${y - s} L${x + s} ${y} L${x} ${y + s} L${x - s} ${y} Z`, class: cls, 'stroke-width': 0.5 }, g);
  el('path', { d: `M${x - s - 3} ${y} H${x - s} M${x + s} ${y} H${x + s + 3}`, class: 'ln-low' }, g);
  return g;
}

function buildZones() {
  const g = $('zones');
  const COL_W = 1488 / 8, ROW_H = 888 / 5;
  let ticks = '';
  for (let k = 1; k < 8; k++) { const x = 56 + k * COL_W; ticks += `M${x} 24 V56 M${x} 944 V976 `; }
  for (let k = 1; k < 5; k++) { const y = 56 + k * ROW_H; ticks += `M24 ${y} H56 M1544 ${y} H1576 `; }
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

/* ---------- log latency scale (scene 6): 1–1000 ms ---------- */
const LX = (ms) => 200 + 400 * Math.log10(ms);
function buildScale() {
  const g = $('scale');
  const yAxis = 776;
  el('line', { class: 'ln-mid', x1: 200, y1: yAxis, x2: 1400, y2: yAxis }, g);
  for (const ms of [1, 10, 100, 1000]) {
    const x = LX(ms);
    el('path', { d: `M${x.toFixed(1)} ${yAxis} V${yAxis + 7}`, class: 'ln-dim' }, g);
    txt({ x, y: yAxis + 18, 'text-anchor': 'middle', 'font-size': 5.4, class: 't-low' }, `${ms} ms`, g);
  }
  txt({ x: 200, y: yAxis - 26, 'font-size': 6.6, class: 't-hi t-500', 'letter-spacing': '0.12em' }, 'ROUND-TRIP LATENCY', g);
  /* the "~100 ms feels instant" threshold */
  const tx = LX(100);
  el('path', { d: `M${tx.toFixed(1)} ${yAxis - 40} V${yAxis + 4}`, class: 'ln-mid dash-ext' }, g);
  txt({ x: tx + 6, y: yAxis - 32, 'font-size': 5, class: 't-mid' }, '~100 ms · delay starts to feel real', g);
  /* markers */
  const marks = [
    { ms: 5, name: 'CITY FIBRE', cls: 't-low' },
    { ms: 30, name: 'LEO', cls: 't-acc t-500' },
    { ms: 130, name: 'MEO', cls: 't-hi t-500' },
    { ms: 600, name: 'GEO', cls: 't-hi t-500' },
  ];
  for (const m of marks) {
    const x = LX(m.ms);
    el('circle', { cx: x, cy: yAxis, r: 2.6, class: m.ms === 30 ? 'ln-acc' : 'ln-hi', 'stroke-width': 0.9 }, g);
    el('path', { d: `M${x.toFixed(1)} ${yAxis - 14} V${yAxis - 3}`, class: 'ln-dim' }, g);
    txt({ x, y: yAxis - 18, 'text-anchor': 'middle', 'font-size': 5.6, class: m.cls, 'letter-spacing': '0.08em' }, m.name, g);
  }
}

/* ---------- the LEO fleet row (scene 5): sats + overlapping cells ---------- */
function buildManySats() {
  const g = $('many-sats');
  const y = 646, gy = GEOM.groundY;
  const xs = [360, 540, 720, 900, 1080, 1260];
  xs.forEach((x, i) => {
    sat(x, y, 3, 'ln-acc', g);
    /* a short coverage cone to the ground with a footprint tick */
    el('path', { d: `M${x} ${y + 4} L${x - 96} ${gy} M${x} ${y + 4} L${x + 96} ${gy}`, class: 'ln-acc dash-ext', 'stroke-width': 0.5 }, g);
    el('path', { d: `M${x - 96} ${gy} H${x + 96}`, class: 'ln-acc', 'stroke-width': 0.7 }, g);
  });
  txt({ x: 800, y: 600, 'text-anchor': 'middle', 'font-size': 6, class: 't-acc t-500', 'letter-spacing': '0.1em' }, 'A CONSTELLATION — CELLS OVERLAP, ONE IS ALWAYS OVERHEAD', g);
}

export function buildDrawing() {
  buildZones();
  buildScale();
  buildManySats();
}
