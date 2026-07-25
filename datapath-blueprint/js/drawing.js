/* ============================================================
   drawing.js — boot-time generated drafting furniture.
   The signal-flow stations (terminal, satellites, mesh, gateway,
   AWS node, endpoints, latency bar) are unique and hand-authored
   in index.html; only the repetitive sheet-edge zones are
   generated here.
   ============================================================ */

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

export function buildDrawing() {
  buildZones();
}
