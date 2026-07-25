/* ============================================================
   drawing.js — boot-time generated chart furniture.
   The axes, the burn-up curves, the FCC gate lines and the
   deadline verticals are hand-authored in index.html; the
   repetitive bits — sheet zones, axis ticks/labels, and the
   launch-manifest legend — are generated here.
   ============================================================ */

import { CHART, XY, YS, MANIFEST } from './data.js';

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

/* ---------- chart axes: year ticks (x) and satellite ticks (y) ---------- */
function buildAxes() {
  const g = $('axis-ticks');
  let tk = '';
  for (let y = CHART.year0; y <= CHART.year1; y++) {
    const x = XY(y);
    tk += `M${x.toFixed(1)} ${CHART.y0} V${CHART.y0 + 7} `;
    txt({ x, y: CHART.y0 + 20, 'text-anchor': 'middle', 'font-size': 6.4, class: 't-hi t-500' }, String(y), g);
  }
  el('path', { d: tk.trim(), class: 'ln-mid' }, g);
  txt({ x: (CHART.x0 + CHART.x1) / 2, y: CHART.y0 + 34, 'text-anchor': 'middle', 'font-size': 5.6, class: 't-low', 'letter-spacing': '0.2em' }, 'YEAR →', g);

  const sTicks = [1000, 2000, 3000];
  let sk = '';
  for (const s of sTicks) {
    const y = YS(s);
    sk += `M${CHART.x0 - 6} ${y.toFixed(1)} H${CHART.x0} `;
    txt({ x: CHART.x0 - 10, y: y + 2, 'text-anchor': 'end', 'font-size': 5.4, class: 't-low' }, s.toLocaleString(), g);
  }
  el('path', { d: sk.trim(), class: 'ln-dim' }, g);
  txt({ x: CHART.x0 - 30, y: (CHART.y0 + CHART.yTop) / 2, 'text-anchor': 'middle', 'font-size': 5.6, class: 't-low', 'letter-spacing': '0.16em', transform: `rotate(-90 ${CHART.x0 - 30} ${(CHART.y0 + CHART.yTop) / 2})` }, 'SATELLITES IN ORBIT →', g);
}

/* ---------- launch-manifest legend (from MANIFEST) ---------- */
function buildManifest() {
  const g = $('manifest');
  const X = 214, Y = 300, W = 366, ROW = 26;
  el('rect', { class: 'ln-low', x: X, y: Y, width: W, height: 40 + MANIFEST.length * ROW, rx: 3 }, g);
  txt({ x: X + 18, y: Y + 24, 'font-size': 7.4, class: 't-hi t-500', 'letter-spacing': '0.1em' }, 'LAUNCH MANIFEST', g);
  txt({ x: X + W - 18, y: Y + 24, 'text-anchor': 'end', 'font-size': 5, class: 't-low' }, 'PUBLIC · ~83+ LAUNCHES', g);
  el('path', { d: `M${X + 14} ${Y + 34} H${X + W - 14}`, class: 'ln-dim' }, g);
  MANIFEST.forEach((m, i) => {
    const y = Y + 54 + i * ROW;
    txt({ x: X + 18, y, 'font-size': 9, class: 't-acc t-500' }, m.n, g);
    txt({ x: X + 92, y, 'font-size': 7, class: 't-hi t-500' }, m.v, g);
    txt({ x: X + W - 18, y, 'text-anchor': 'end', 'font-size': 5, class: 't-low' }, m.who, g);
  });
}

export function buildDrawing() {
  buildZones();
  buildAxes();
  buildManifest();
}
