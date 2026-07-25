/* ============================================================
   drawing.js — boot-time generated orbit geometry.
   The fixed scaffolding (Earth disk, scene headers, shell table,
   spec/ground notes, stamp) is hand-authored in index.html;
   everything patterned or positional lives here: the graticule,
   the three shell circles, the woven plane cage, the satellite
   beads, the far GEO ring, and the hero cluster (satellites +
   coverage cone + the amber OISL mesh).

   Geometry uses <circle>/<ellipse> and quadratic Béziers only —
   no SVG elliptical-arc commands — so there is no sweep-flag to
   get wrong (a known family gotcha).
   ============================================================ */

import { GEOM, CLUSTER } from './data.js';

const NS = 'http://www.w3.org/2000/svg';
const $ = (id) => document.getElementById(id);
const { cx, cy, R, shells, planes, geoR } = GEOM;

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
/* drawable path/shape: participates in the scene-0 dash draw-on */
const drAttrs = (extra) => ({ pathLength: '1', ...extra });

/* a satellite glyph: a small filled diamond (body) + two panel ticks */
function sat(x, y, s, cls, parent, panels = true) {
  const g = el('g', { class: 'satglyph' }, parent);
  el('path', { d: `M${x} ${y - s} L${x + s} ${y} L${x} ${y + s} L${x - s} ${y} Z`, class: cls, 'stroke-width': 0.5 }, g);
  if (panels) el('path', { d: `M${x - s - 3.4} ${y} H${x - s} M${x + s} ${y} H${x + s + 3.4}`, class: 'ln-low' }, g);
  return g;
}

/* point on an ellipse (rx,ry) centred at (cx,cy), rotated by θ (deg), at param φ (deg) */
function onEllipse(rx, ry, theta, phi) {
  const t = (theta * Math.PI) / 180, p = (phi * Math.PI) / 180;
  const lx = rx * Math.cos(p), ly = ry * Math.sin(p);
  return {
    x: cx + lx * Math.cos(t) - ly * Math.sin(t),
    y: cy + lx * Math.sin(t) + ly * Math.cos(t),
  };
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

/* ---------- Earth graticule (a few latitude/longitude hints) ---------- */
function buildGraticule() {
  const g = $('graticule');
  /* three faint latitude ellipses (flattened) + a central meridian */
  for (const k of [-0.55, 0, 0.55]) {
    el('ellipse', { cx, cy: cy + k * R * 0.86, rx: R * Math.cos(Math.asin(Math.abs(k) * 0.86)), ry: 12, class: 'ln-dim dash-ext' }, g);
  }
  el('ellipse', { cx, cy, rx: R * 0.34, ry: R, class: 'ln-dim dash-ext' }, g);
  el('ellipse', { cx, cy, rx: R * 0.72, ry: R, class: 'ln-dim dash-ext' }, g);
}

/* ---------- three concentric shell circles (draw-on) ---------- */
function buildShells() {
  const g = $('shells');
  shells.forEach((s, i) => {
    const cls = i === 2 ? 'ln-acc dr' : 'ln-mid dr';   // outer shell = cyan hero
    el('circle', { id: `shell-${s.id}`, cx, cy, r: s.r, class: cls, 'stroke-width': i === 2 ? 1.0 : 0.8, ...drAttrs() }, g);
  });
}

/* ---------- the woven plane cage: rotated ellipses (fade in) ---------- */
function buildPlanes() {
  const g = $('planes');
  const { count, rx, ry } = planes;
  for (let k = 0; k < count; k++) {
    const theta = (k * 180) / count;   // 0..180
    el('ellipse', { cx, cy, rx, ry, transform: `rotate(${theta.toFixed(2)} ${cx} ${cy})`, class: 'ln-dim', 'stroke-width': 0.6 }, g);
  }
}

/* ---------- satellite beads riding the three shells ---------- */
function buildSats() {
  const g = $('sats');
  const perShell = [9, 12, 7];        // more on the busy middle shell (schematic)
  const GOLD = 137.508;
  shells.forEach((s, si) => {
    const n = perShell[si];
    for (let j = 0; j < n; j++) {
      const phi = (j * GOLD + si * 40) % 360;
      const p = onEllipse(s.r, s.r, 0, phi);   // circle → ellipse rx=ry
      sat(p.x, p.y, 2.6, 'ln-acc', g, false);
    }
  });
}

/* ---------- far GEO reference ring (quadratic arc over the top) ---------- */
function buildGeoRing() {
  const g = $('geo-ring');
  const dx = geoR * Math.cos((38 * Math.PI) / 180), dy = geoR * Math.sin((38 * Math.PI) / 180);
  const Lx = cx - dx, Rx = cx + dx, Y = cy - dy;             // arc endpoints on the ring
  const apexY = cy - geoR;                                   // top of the ring
  el('path', { d: `M${Lx.toFixed(0)} ${Y.toFixed(0)} Q${cx} ${(2 * apexY - Y).toFixed(0)} ${Rx.toFixed(0)} ${Y.toFixed(0)}`, class: 'ln-dim dash-ext', 'stroke-width': 0.7 }, g);
  el('path', { d: `M${cx} ${cy} V${(apexY + 10).toFixed(0)}`, class: 'ln-dim dash-ext', 'stroke-width': 0.5 }, g);
  txt({ x: cx, y: apexY + 4, 'text-anchor': 'middle', 'font-size': 6.6, class: 't-low t-500', 'letter-spacing': '0.14em' }, 'GEO ORBIT · 35,786 km', g);
  txt({ x: cx, y: apexY + 14, 'text-anchor': 'middle', 'font-size': 4.6, class: 't-low' }, 'where old satellites sit — 60× higher, ~10× the latency', g);
}

/* ---------- hero cluster: six satellites (fade in) ---------- */
function buildCluster() {
  const g = $('cluster');
  CLUSTER.sats.forEach((s, i) => sat(s.x, s.y, i === 0 ? 4.2 : 3.4, i === 0 ? 'ln-hi' : 'ln-acc', g));
}

/* ---------- the OISL mesh: amber laser links (revealed scene 5) ---------- */
function buildMesh() {
  const g = $('mesh');
  const S = CLUSTER.sats;
  CLUSTER.links.forEach(([a, b], i) => {
    el('path', { id: `mesh-${i}`, d: `M${S[a].x} ${S[a].y} L${S[b].x} ${S[b].y}`, class: 'ln-laser dr', 'stroke-width': 1.0, ...drAttrs() }, g);
  });
}

/* ---------- coverage cone + overlapping footprints + hand-off (scene 4) ---------- */
function buildCoverage() {
  const g = $('coverage');
  const S0 = CLUSTER.sats[0], S1 = CLUSTER.sats[1], sub = CLUSTER.sub, nxt = CLUSTER.next;
  /* unit radial from Earth centre to the sub-satellite point → tangent on the disk */
  const rad = Math.atan2(sub.y - cy, sub.x - cx);
  const tang = rad + Math.PI / 2, HW = 74;
  const ax = sub.x + HW * Math.cos(tang), ay = sub.y + HW * Math.sin(tang);
  const bx = sub.x - HW * Math.cos(tang), by = sub.y - HW * Math.sin(tang);
  const degT = (tang * 180) / Math.PI;
  /* cone lines from the hero satellite to the footprint edges */
  el('path', { d: `M${S0.x} ${S0.y} L${ax.toFixed(0)} ${ay.toFixed(0)}`, class: 'ln-acc', 'stroke-width': 0.7 }, g);
  el('path', { d: `M${S0.x} ${S0.y} L${bx.toFixed(0)} ${by.toFixed(0)}`, class: 'ln-acc', 'stroke-width': 0.7 }, g);
  el('ellipse', { cx: sub.x, cy: sub.y, rx: HW, ry: 15, transform: `rotate(${degT.toFixed(1)} ${sub.x} ${sub.y})`, class: 'ln-acc', 'stroke-width': 0.9 }, g);
  /* the next (overlapping) footprint + a faint feeder from the trailing satellite */
  const rad2 = Math.atan2(nxt.y - cy, nxt.x - cx), degT2 = ((rad2 + Math.PI / 2) * 180) / Math.PI;
  el('ellipse', { cx: nxt.x, cy: nxt.y, rx: 66, ry: 13, transform: `rotate(${degT2.toFixed(1)} ${nxt.x} ${nxt.y})`, class: 'ln-low', 'stroke-width': 0.7 }, g);
  el('path', { d: `M${S1.x} ${S1.y} L${nxt.x} ${nxt.y}`, class: 'ln-dim dash-ext', 'stroke-width': 0.6 }, g);
  /* hand-off arrow between the two footprints */
  el('path', { d: `M${ax.toFixed(0)} ${ay.toFixed(0)} Q${((ax + nxt.x) / 2).toFixed(0)} ${((ay + nxt.y) / 2 + 30).toFixed(0)} ${nxt.x} ${nxt.y}`, class: 'ln-acc dash-ext', 'stroke-width': 0.7, 'marker-end': 'url(#arr-acc)' }, g);
  txt({ x: (ax + nxt.x) / 2 - 2, y: (ay + nxt.y) / 2 + 44, 'text-anchor': 'middle', 'font-size': 5, class: 't-acc t-500' }, 'HAND-OFF', g);
}

/* ---------- sparse ground gateways on the lower disk (scene 6) ---------- */
function buildGateways() {
  const g = $('gateways');
  const S = CLUSTER.sats;
  [112, 68].forEach((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const gx = cx + R * Math.cos(a), gy = cy + R * Math.sin(a);
    /* a small ground dish triangle sitting on the surface */
    el('path', { d: `M${(gx - 7).toFixed(0)} ${(gy + 8).toFixed(0)} L${gx.toFixed(0)} ${(gy - 6).toFixed(0)} L${(gx + 7).toFixed(0)} ${(gy + 8).toFixed(0)} Z`, class: 'ln-hi', 'stroke-width': 0.9 }, g);
    /* a downlink from a nearby satellite */
    const src = i === 0 ? S[1] : S[4];
    el('path', { d: `M${src.x} ${src.y} L${gx.toFixed(0)} ${(gy - 6).toFixed(0)}`, class: 'ln-acc dash-ext', 'stroke-width': 0.7 }, g);
    txt({ x: gx, y: gy + 20, 'text-anchor': 'middle', 'font-size': 4.6, class: 't-low', 'letter-spacing': '0.1em' }, 'GATEWAY', g);
  });
}

export function buildDrawing() {
  buildZones();
  buildGraticule();
  buildShells();
  buildPlanes();
  buildSats();
  buildGeoRing();
  buildCoverage();
  buildCluster();
  buildMesh();
  buildGateways();
}
