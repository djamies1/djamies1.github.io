/* ============================================================
   drawing.js — boot-time generated repetitive SVG geometry.
   Unique diagrams (rain-fade plot, Ka detail, duplex, optical,
   licensing arc/timeline) are hand-authored in index.html;
   everything patterned lives here: the log frequency axis,
   the band brackets, the chirping wave motif, the one visible-
   light rainbow, and the licensing-stack boxes.
   ============================================================ */

import { BANDS, LICENSE_STEPS } from './data.js';

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

/* log frequency map, shared with data.js CAM presets (see BANDS):
   x(1 GHz)=170, x(10)=430, x(100)=690, x(1000)=950 — 260 px / decade. */
export const XF = (ghz) => 170 + 260 * Math.log10(ghz);

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

/* ---------- log frequency axis: decade + reference ticks ---------- */
function buildAxisTicks() {
  const g = $('axis-ticks');
  const majors = [1, 10, 100, 1000];
  let major = '';
  for (const f of majors) {
    const x = XF(f);
    major += `M${x} 640 V653 `;
    txt({ x, y: 668, 'text-anchor': 'middle', 'font-size': 6.4, class: 't-hi t-500' }, String(f), g);
  }
  el('path', { d: major.trim(), class: 'ln-mid' }, g);
  /* small reference ticks at the band edges that matter */
  const minors = [2, 3, 5, 12, 18, 30, 40, 75, 300];
  let minor = '';
  for (const f of minors) minor += `M${XF(f)} 640 V648 `;
  el('path', { d: minor.trim(), class: 'ln-dim' }, g);
  for (const f of [12, 18, 30, 40]) {
    txt({ x: XF(f), y: 662, 'text-anchor': 'middle', 'font-size': 4.4, class: 't-low' }, String(f), g);
  }
  /* optical end: one labelled point on the far-side axis */
  el('path', { d: 'M1311 640 V653', class: 'ln-mid' }, g);
  txt({ x: 1311, y: 668, 'text-anchor': 'middle', 'font-size': 6, class: 't-laser t-500' }, '193 THz', g);
  txt({ x: 1311, y: 678, 'text-anchor': 'middle', 'font-size': 4.4, class: 't-low' }, '1550 nm', g);
}

/* ---------- band brackets above the axis (from BANDS) ---------- */
function buildBands() {
  const root = $('bands');
  for (const b of BANDS) {
    const x0 = b.ox0 ?? XF(b.f0);
    const x1 = b.ox1 ?? XF(b.f1);
    const cx = (x0 + x1) / 2;
    const g = el('g', { id: `band-${b.id}` }, root);
    const lineCls = b.hero ? 'ln-hi' : b.laser ? 'ln-laser' : 'ln-mid';
    dr(`M${x0} 640 V612 H${x1} V640`, lineCls, g);
    if (b.laser) el('rect', { x: x0 + 2, y: 616, width: x1 - x0 - 4, height: 22, class: 'ln-laser fill-hatch-b', 'stroke-width': 0.5 }, g);
    const lblCls = b.hero ? 't-acc t-500' : b.laser ? 't-laser t-500' : 't-hi t-500';
    txt({ x: cx, y: 600, 'text-anchor': 'middle', 'font-size': b.hero ? 12 : 8.5, class: lblCls, 'letter-spacing': '0.08em' }, b.label, g);
    txt({ x: cx, y: 609, 'text-anchor': 'middle', 'font-size': 4.6, class: 't-low', 'letter-spacing': '0.08em' }, b.sub, g);
  }
}

/* ---------- top motif: a wave whose wavelength compresses left→right ---------- */
function buildWave() {
  const path = $('wave-rf');
  const x0 = 150, x1 = 950, baseY = 182, amp = 27;
  let theta = 0, d = '';
  for (let x = x0; x <= x1; x += 3) {
    const lambda = 120 - (x - x0) * 0.12;        // 120 px → 24 px across the run
    theta += (2 * Math.PI * 3) / lambda;
    const y = (baseY - amp * Math.sin(theta)).toFixed(1);
    d += (x === x0 ? 'M' : 'L') + x + ' ' + y + ' ';
  }
  path.setAttribute('d', d.trim());
}

/* ---------- the ONE rainbow: only the visible slice of the EM bar ---------- */
function buildRainbow() {
  const g = $('em-strip');
  /* the ln-dim bar spans 234→554 (radio→X-ray); colour ONLY the visible sub-slice */
  const cols = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#22d3ee', '#3b82f6', '#6366f1', '#8b5cf6'];
  const vx0 = 470, w = 6.5;
  cols.forEach((c, i) => {
    el('rect', { x: vx0 + i * w, y: 347, width: w + 0.4, height: 16, fill: c, stroke: 'none', opacity: 0.82 }, g);
  });
  el('rect', { x: vx0, y: 347, width: cols.length * w, height: 16, fill: 'none', stroke: 'var(--ink-hi)', 'stroke-width': 0.5 }, g);
  txt({ x: vx0 + (cols.length * w) / 2, y: 344, 'text-anchor': 'middle', 'font-size': 3.6, class: 't-low' }, '400–700 nm', g);
}

/* ---------- licensing-stack boxes (from LICENSE_STEPS) ---------- */
function buildLicenseBoxes() {
  const g = $('license-boxes');
  const X = 1118, W = 316, H = 64, PITCH = 84, Y0 = 178;
  LICENSE_STEPS.forEach((s, i) => {
    const y = Y0 + i * PITCH;
    const cls = s.accent === 'laser' ? 'ln-laser' : s.accent ? 'ln-acc' : 'ln-mid';
    el('rect', { x: X, y, width: W, height: H, rx: 3, class: cls }, g);
    el('circle', { cx: X + 20, cy: y + 22, r: 10, class: 'ln-acc', 'stroke-width': 0.9 }, g);
    txt({ x: X + 20, y: y + 25, 'text-anchor': 'middle', 'font-size': 8, class: 't-acc t-500' }, s.n, g);
    txt({ x: X + 40, y: y + 20, 'font-size': 7, class: 't-hi t-500', 'letter-spacing': '0.08em' }, s.title, g);
    txt({ x: X + 40, y: y + 32, 'font-size': 4.6, class: 't-low', 'letter-spacing': '0.06em' }, s.sub, g);
    if (s.sub2) txt({ x: X + 40, y: y + 41, 'font-size': 4.6, class: 't-low', 'letter-spacing': '0.06em' }, s.sub2, g);
    if (i < LICENSE_STEPS.length - 1)
      el('path', { d: `M${X + 20} ${y + H} V${y + PITCH}`, class: 'ln-dim', 'marker-end': 'url(#arr)' }, g);
  });
}

export function buildDrawing() {
  buildZones();
  buildAxisTicks();
  buildBands();
  buildWave();
  buildRainbow();
  buildLicenseBoxes();
}
