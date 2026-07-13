/* ============================================================
   drawing.js — boot-time generated repetitive SVG geometry.
   Unique geometry is hand-authored in index.html; everything
   here is patterned (edge zones, satellite glyphs, engine
   clusters, exploded-view leader labels).
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

/* ---------- Leo satellite stack: pyramid into the ogive (2/2/4/4 visible) ---------- */
function buildSatellites() {
  const tiers = [
    { y: 140, dx: [-12.5, 12.5] },            // inside the nose taper
    { y: 162, dx: [-12.5, 12.5] },
    { y: 184, dx: [-21, -12.5, 12.5, 21] },   // full-width cylinder section
    { y: 206, dx: [-21, -12.5, 12.5, 21] },
  ];
  tiers.forEach((t, i) => {
    const tier = $(`tier-${i + 1}`);
    for (const d of t.dx) {
      el('use', { href: '#sym-sat', x: 800 + d - 5.5, y: t.y + 2 }, tier);
    }
  });
  dr('M784 162 H816 M778 184 H822 M776 206 H824', 'ln-dim', $('tier-shelves'));
}

/* ---------- side-elevation BE-4 bells (4 visible of 7) ---------- */
function buildBe4Row() {
  const g = $('be4-row');
  for (const c of [777.5, 792.5, 807.5, 822.5]) {
    dr(
      `M${c - 5.5} 894 C${c - 6.5} 901 ${c - 7} 905.5 ${c - 7.5} 908.5 ` +
      `Q${c} 912 ${c + 7.5} 908.5 C${c + 7} 905.5 ${c + 6.5} 901 ${c + 5.5} 894 ` +
      `M${c - 5.5} 894 H${c + 5.5}`,
      'ln-mid', g
    );
    el('ellipse', { cx: c, cy: 909.2, rx: 7.5, ry: 2.4, class: 'ln-low dr', pathLength: '1' }, g);
  }
}

/* ---------- DETAIL A: aft view — 7 BE-4 (1 + ring of 6) + 6 legs ---------- */
function buildDetailA() {
  const cx = 1250, cy = 700, R = 38;
  const ge = $('da-engines');
  const pos = [[cx, cy]];
  for (let k = 0; k < 6; k++) {
    const a = (-90 + k * 60) * Math.PI / 180;
    pos.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
  }
  for (const [x, y] of pos) {
    el('circle', { cx: x, cy: y, r: 15, class: 'ln-hi dr', pathLength: '1' }, ge);
    el('circle', { cx: x, cy: y, r: 6.5, class: 'ln-low dr', pathLength: '1' }, ge);
  }
  const gl = $('da-legs');
  for (let k = 0; k < 6; k++) {
    const a = (-60 + k * 60) * Math.PI / 180;
    const pt = (r, da) => {
      const t = a + da * Math.PI / 180;
      return `${(cx + r * Math.cos(t)).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`;
    };
    dr(`M${pt(68, -4.5)} L${pt(84, -2.6)} L${pt(84, 2.6)} L${pt(68, 4.5)} Z`, 'ln-mid', gl);
  }
}

/* ---------- exploded money-shot leader labels ---------- */
function buildXLabels() {
  const root = $('x-labels');
  for (const L of XLABELS) {
    const g = el('g', { id: L.id }, root);
    const col = L.side === 'L' ? 560 : 1040;
    const anchor = L.side === 'L' ? 'end' : 'start';
    const tx = L.side === 'L' ? col - 4 : col + 4;
    el('circle', { cx: L.ax, cy: L.ay, r: 2.6, fill: 'var(--signal)', stroke: 'none' }, g);
    el('path', { d: `M${L.ax} ${L.ay} L${L.ex} ${L.ey} H${col}`, class: 'ln-acc', 'stroke-width': 1.1 }, g);
    txt({ x: tx, y: L.ey - 5, 'font-size': 15, 'text-anchor': anchor, class: 't-hi t-500', 'letter-spacing': '0.14em' }, L.t, g);
    txt({ x: tx, y: L.ey + 11, 'font-size': 9.5, 'text-anchor': anchor, class: 't-low', 'letter-spacing': '0.12em' }, L.s, g);
  }
}

export function buildDrawing() {
  buildZones();
  buildSatellites();
  buildBe4Row();
  buildDetailA();
  buildXLabels();
}
