/* ============================================================
   drawing.js — boot-time generated repetitive SVG geometry.
   Unique geometry is hand-authored in index.html; everything
   here is patterned (edge zones, earthwork ticks, rain cell,
   baseband racks, exploded-view leader labels).
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

/* ---------- earthwork ticks under the grade line ---------- */
function buildGradeTicks() {
  const g = $('grade-ticks');
  let d = '';
  for (let x = 582; x <= 1046; x += 16) d += `M${x} 640 l-8 10 `;
  dr(d.trim(), 'ln-dim', g);
}

/* ---------- rain cell (rf scene furniture) ---------- */
function buildRain() {
  const g = $('rain-lines');
  let d = '';
  for (let x = 750; x <= 846; x += 12) d += `M${x} 190 L${x - 12} 246 `;
  el('path', { d: d.trim(), class: 'ln-mid', 'stroke-width': 0.6 }, g);
}

/* ---------- baseband racks (4, generic; #2 carries Prometheus) ---------- */
function buildRacks() {
  const g = $('rack-row');
  el('path', { d: 'M706 706 H890 M726 706 V712 M774 706 V712 M822 706 V712 M870 706 V712', class: 'ln-low' }, g);
  const xs = [706, 754, 802, 850];
  xs.forEach((x, i) => {
    el('rect', { x, y: 712, width: 40, height: 74, class: 'ln-mid' }, g);
    for (const y of [718, 740, 762]) {
      const acc = i === 1 && y === 740;  // the Prometheus card
      el('rect', {
        x: x + 4, y, width: 32, height: 16,
        class: acc ? 'ln-acc' : 'ln-dim',
        ...(acc ? { 'stroke-width': 1, id: 'card-prometheus' } : {}),
      }, g);
      if (acc) {
        el('rect', { x: x + 14, y: y + 4, width: 12, height: 8, class: 'ln-acc', 'stroke-width': 0.5 }, g);
        el('path', { d: `M${x + 14} ${y + 8} H${x + 8} M${x + 26} ${y + 8} H${x + 32}`, class: 'ln-acc', 'stroke-width': 0.4 }, g);
      }
    }
  });
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
  buildGradeTicks();
  buildRain();
  buildRacks();
  buildXLabels();
}
