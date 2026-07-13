/* ============================================================
   ui.js — DOM built from data.js: callout panels, progress
   rail, outro spec table + prose, aria-live scene announcer.
   ============================================================ */

import { PANELS, SCENES, SPEC_TABLE, COMPONENT_NOTES, PROVENANCE } from './data.js';

const h = (tag, cls, parent, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  parent.appendChild(n);
  return n;
};

function buildPanels() {
  const root = document.querySelector('.panels');
  PANELS.forEach((p, i) => {
    const el = h('section', 'panel', root);
    el.id = `panel-${i}`;
    if (i === PANELS.length - 1) el.classList.add('panel--bl');
    h('p', 'eyebrow', el, p.eyebrow);
    h('h2', null, el, p.title);
    const dl = h('dl', null, el);
    for (const [k, v] of p.rows) {
      h('dt', null, dl, k);
      h('dd', null, dl, v);
    }
    h('p', 'note', el, p.note);
  });
}

let railButtons = [];
function buildRail(scrollToScene) {
  const rail = document.querySelector('.rail');
  railButtons = SCENES.map((s, i) => {
    const b = h('button', null, rail);
    b.type = 'button';
    b.setAttribute('aria-label', `Go to section: ${s.title}`);
    b.addEventListener('click', () => scrollToScene(i));
    return b;
  });
}

function buildOutro() {
  const tblRoot = document.getElementById('spec-table');
  const table = h('table', null, tblRoot);
  h('caption', null, table, SPEC_TABLE.caption);
  const thead = h('thead', null, table);
  const hr = h('tr', null, thead);
  for (const c of SPEC_TABLE.head) h('th', null, hr, c);
  const tbody = h('tbody', null, table);
  for (const row of SPEC_TABLE.rows) {
    const tr = h('tr', null, tbody);
    for (const c of row) h('td', null, tr, c);
  }

  const notes = document.getElementById('component-notes');
  for (const n of COMPONENT_NOTES) {
    const d = h('div', null, notes);
    h('span', 'tag mono', d, n.tag);
    h('h3', null, d, n.title);
    h('p', null, d, n.body);
  }

  document.getElementById('provenance').innerHTML = PROVENANCE;
}

/* scene announcer: rail active state + aria-live (throttled by index change) */
let activeScene = -1;
export function announceScene(progress100) {
  let idx = SCENES.length - 1;
  for (let i = 0; i < SCENES.length; i++) {
    if (progress100 < SCENES[i].t[1]) { idx = i; break; }
  }
  if (idx === activeScene) return;
  activeScene = idx;
  railButtons.forEach((b, i) => {
    b.classList.toggle('is-active', i === idx);
    if (i === idx) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  });
  const live = document.querySelector('.sr-scene');
  if (live) live.textContent = SCENES[idx].title;
}

export function buildUI(scrollToScene) {
  buildPanels();
  buildRail(scrollToScene);
  buildOutro();
}
