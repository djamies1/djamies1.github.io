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
    h('span', 'panel-num', el, String(i).padStart(2, '0'));
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
    b.dataset.title = s.title;
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

/* ---------- transport controls + progress bar ---------- */
const ICONS = {
  play: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.2 1.4 L10.6 6 L2.2 10.6 Z"/></svg>',
  pause: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.4 1.6 h2.6 v8.8 h-2.6 Z M7 1.6 h2.6 v8.8 h-2.6 Z"/></svg>',
  restart: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.6 A4.4 4.4 0 1 0 10.4 6 h-1.5 A2.9 2.9 0 1 1 6 3.1 V5.4 L9.6 2.8 6 0.2 Z"/></svg>',
  prev: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M8.6 1.4 L3 6 L8.6 10.6 V1.4 Z"/></svg>',
  next: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.4 1.4 L9 6 L3.4 10.6 V1.4 Z"/></svg>',
  rew: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M10.5 1.4 L6.5 6 L10.5 10.6 Z M5.5 1.4 L1.5 6 L5.5 10.6 Z"/></svg>',
  ff: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 1.4 L5.5 6 L1.5 10.6 Z M6.5 1.4 L10.5 6 L6.5 10.6 Z"/></svg>',
};

let playBtn = null;
let speedLabel = null;
export function buildControls({ onToggle, onRestart, onPrev, onNext, onRew, onFF, onScrub }) {
  const stage = document.querySelector('.stage');
  const bar = h('div', 'controls', stage);
  const mk = (icon, label, fn, cls) => {
    const b = h('button', cls || null, bar);
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.innerHTML = ICONS[icon];
    b.addEventListener('click', fn);
    return b;
  };
  mk('restart', 'Restart the breakdown', onRestart);
  mk('prev', 'Previous section', onPrev);
  mk('rew', 'Slower', onRew);
  playBtn = mk('play', 'Play the breakdown', onToggle, 'ctl-play');
  playBtn.insertAdjacentHTML('beforeend', '<span class="ctl-label">PLAY</span>');
  mk('ff', 'Faster', onFF);
  mk('next', 'Next section', onNext);
  speedLabel = h('i', 'ctl-speed', bar, '1×');

  const prog = h('div', 'progressbar', stage);
  prog.setAttribute('role', 'slider');
  prog.setAttribute('aria-label', 'Seek the breakdown');
  prog.setAttribute('aria-valuemin', '0');
  prog.setAttribute('aria-valuemax', '100');
  prog.setAttribute('aria-valuenow', '0');
  prog.tabIndex = 0;
  for (const s of SCENES.slice(1)) {
    const tick = h('i', null, prog);
    tick.style.left = s.t[0] + '%';
  }
  h('b', null, prog);

  /* click/drag anywhere on the bar to seek — a YouTube-style scrubber.
     pointer capture keeps the drag tracking even if the cursor leaves the
     (thin) bar element mid-drag. */
  if (onScrub) {
    const seek = (clientX) => {
      const r = prog.getBoundingClientRect();
      onScrub(Math.min(Math.max((clientX - r.left) / r.width, 0), 1) * 100);
    };
    let dragging = false;
    prog.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      dragging = true;
      prog.setPointerCapture(e.pointerId);
      seek(e.clientX);
    });
    prog.addEventListener('pointermove', (e) => { if (dragging) seek(e.clientX); });
    const stopDrag = () => { dragging = false; };
    prog.addEventListener('pointerup', stopDrag);
    prog.addEventListener('pointercancel', stopDrag);
    prog.addEventListener('keydown', (e) => {
      let target = null;
      if (e.key === 'ArrowLeft') target = currentProgress - 2;
      else if (e.key === 'ArrowRight') target = currentProgress + 2;
      else if (e.key === 'Home') target = 0;
      else if (e.key === 'End') target = 100;
      if (target == null) return;
      e.preventDefault();
      onScrub(Math.min(Math.max(target, 0), 100));
    });
  }
}

export function setPlayState(playing) {
  if (!playBtn) return;
  playBtn.querySelector('svg').outerHTML = playing ? ICONS.pause : ICONS.play;
  playBtn.querySelector('.ctl-label').textContent = playing ? 'PAUSE' : 'PLAY';
  playBtn.setAttribute('aria-label', playing ? 'Pause the breakdown' : 'Play the breakdown');
}

let currentProgress = 0;
export function setProgress(progress100) {
  currentProgress = progress100;
  const bar = document.querySelector('.progressbar');
  const fill = bar?.querySelector('b');
  if (fill) fill.style.width = progress100 + '%';
  if (bar) bar.setAttribute('aria-valuenow', String(Math.round(progress100)));
}

export function setSpeedLabel(text) {
  if (speedLabel) speedLabel.textContent = text;
}

/* scene announcer: rail active state + aria-live (throttled by index change) */
let activeScene = -1;
export function getActiveScene() { return Math.max(activeScene, 0); }
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
  const num = document.querySelector('.scene-hud-num');
  const title = document.querySelector('.scene-hud-title');
  if (num && title) {
    num.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(SCENES.length).padStart(2, '0')}`;
    title.textContent = SCENES[idx].title;
    title.animate?.([{ opacity: 0.25 }, { opacity: 1 }], { duration: 380, easing: 'ease-out' });
  }
}

export function buildUI(scrollToScene) {
  buildPanels();
  buildRail(scrollToScene);
}
