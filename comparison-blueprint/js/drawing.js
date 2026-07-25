/* ============================================================
   drawing.js — boot-time generated comparison table.
   The sheet chrome + the thesis/recap lines are hand-authored in
   index.html; the repetitive table (edge zones, the centre
   divider, the two column headers, and the five comparison rows)
   is generated here from data.js ROWS.

   AMAZON LEO (left, cyan — the set's hero) vs STARLINK (right,
   plain ink). The OPTICAL MESH row is tinted amber — the one
   dimension where the two converge.
   ============================================================ */

import { GEOM, ROWS } from './data.js';

const NS = 'http://www.w3.org/2000/svg';
const $ = (id) => document.getElementById(id);
const { dividerX, headerY, rowY0, rowGap, leoX, slX } = GEOM;

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

/* ---------- sheet edge coordinate zones (1–8 / A–E) ---------- */
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

/* ---------- the centre divider (draw-on) ---------- */
function buildDivider() {
  const g = $('divider');
  const y1 = headerY + 30, y2 = rowY0 + (ROWS.length - 1) * rowGap + 34;
  el('line', { class: 'ln-mid dr', pathLength: '1', x1: dividerX, y1, x2: dividerX, y2 }, g);
  /* a small node where each row crosses the divider */
  ROWS.forEach((r, i) => {
    const y = rowY0 + i * rowGap;
    el('path', { class: r.mesh ? 'ln-laser' : 'ln-acc', 'stroke-width': 0.8, d: `M${dividerX - 4} ${y - 22} L${dividerX} ${y - 26} L${dividerX + 4} ${y - 22}` }, g);
  });
}

/* ---------- the two column headers ---------- */
function buildHeaders() {
  const g = $('headers');
  txt({ x: leoX, y: headerY, 'text-anchor': 'end', 'font-size': 13, class: 't-acc t-500', 'letter-spacing': '0.06em' }, 'AMAZON LEO', g);
  txt({ x: slX, y: headerY, 'font-size': 13, class: 't-hi t-500', 'letter-spacing': '0.06em' }, 'STARLINK', g);
  txt({ x: dividerX, y: headerY - 2, 'text-anchor': 'middle', 'font-size': 6, class: 't-low', 'letter-spacing': '0.14em' }, 'VS', g);
  /* status line (public, as of Jul 2026) */
  txt({ x: leoX, y: headerY + 16, 'text-anchor': 'end', 'font-size': 5.4, class: 't-low' }, 'deploying · commercial mid-2026', g);
  txt({ x: slX, y: headerY + 16, 'font-size': 5.4, class: 't-low' }, 'operational · ~10M+ subs · ~$11.4B 2025 rev', g);
  txt({ x: dividerX, y: headerY + 40, 'text-anchor': 'middle', 'font-size': 6, class: 't-mid', 'letter-spacing': '0.18em' }, 'TWO ARCHITECTURES · PUBLIC · AS OF JUL 2026', g);
}

/* ---------- the five comparison rows ---------- */
function buildRows() {
  const root = $('rows');
  ROWS.forEach((r, i) => {
    const y = rowY0 + i * rowGap;
    const g = el('g', { id: `row-${r.id}` }, root);
    /* faint separator above the row */
    el('path', { class: 'ln-dim dash-ext', d: `M150 ${y - 44} H1450` }, g);
    /* centre dimension label */
    const dimCls = r.mesh ? 't-laser t-500' : 't-mid t-500';
    txt({ x: dividerX, y: y - 30, 'text-anchor': 'middle', 'font-size': 6.6, class: dimCls, 'letter-spacing': '0.16em' }, r.dim, g);
    /* Leo (left, cyan / amber) — right-aligned toward the divider */
    const leoCls = r.mesh ? 't-laser' : 't-acc';
    txt({ x: leoX, y, 'text-anchor': 'end', 'font-size': 7.4, class: `${leoCls} t-500` }, r.leo[0], g);
    txt({ x: leoX, y: y + 13, 'text-anchor': 'end', 'font-size': 5.4, class: 't-low' }, r.leo[1], g);
    /* Starlink (right, ink / amber) — left-aligned from the divider */
    const slCls = r.mesh ? 't-laser' : 't-hi';
    txt({ x: slX, y, 'font-size': 7.4, class: `${slCls} t-500` }, r.sl[0], g);
    txt({ x: slX, y: y + 13, 'font-size': 5.4, class: 't-low' }, r.sl[1], g);
  });
}

export function buildDrawing() {
  buildZones();
  buildDivider();
  buildHeaders();
  buildRows();
}
