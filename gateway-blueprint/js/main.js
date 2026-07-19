/* ============================================================
   main.js — boot.
   Two run modes:
   · scroll (default) — pinned scrollytelling; the cover button /
     transport play tween the scroll position (any user input
     hands control back)
   · player (?mode=player) — no scroll at all; the timeline is
     time-driven with transport controls. Params: autoplay, loop,
     speed (timeScale, default 1.0 ≈ 100 s run). Built for embedding
     at any size, e.g. a dashboard sidebar iframe.
   Reduced motion (or missing GSAP) renders the static exploded
   poster in either mode.
   ============================================================ */

import { buildDrawing } from './drawing.js';
import { buildUI, buildControls, announceScene, getActiveScene, setPlayState, setProgress } from './ui.js';
import {
  initTimeline, buildStaticPoster, MOBILE_MQ,
  scrollToScene, playerApi, startAutoScroll, stopAutoScroll, isAutoScrolling,
} from './timeline.js';

const q = new URLSearchParams(location.search);
const CFG = window.GGT_BP_CONFIG || {};
const mode = q.get('mode') || CFG.mode || 'scroll';
const opts = {
  autoplay: q.has('autoplay') || !!CFG.autoplay,
  loop: q.has('loop') || !!CFG.loop,
  speed: parseFloat(q.get('speed') || CFG.speed) || 1.0,
};
const isPlayer = mode === 'player';
if (isPlayer) document.body.classList.add('is-player');

buildDrawing();

/* Enlarge the SVG diagram labels for readability. Labels are authored in tiny
   world units (viewBox 1600×1000), so scaling only <text> (not a group) grows
   the type relative to the line work. The title block sits in a fixed drafting
   box, so it grows gently; the finale stamp is already the largest text — leave it. */
const TEXT_SCALE = 1.65, TITLEBLOCK_SCALE = 1.20;
document.querySelectorAll('#bp text').forEach((t) => {
  if (t.closest('#stamp')) return;
  const fs = parseFloat(t.getAttribute('font-size'));
  if (!fs) return;
  const k = t.closest('#titleblock') ? TITLEBLOCK_SCALE : TEXT_SCALE;
  t.setAttribute('font-size', +(fs * k).toFixed(2));
});

buildUI((i) => (isPlayer ? playerApi.goto(i) : scrollToScene(i)));

/* landing / persistent play affordance — defined before the controls so both the
   transport and the on-stage cue drive it. The cue's play button stays available at
   ANY scroll position (it only hides while actually auto-playing), and it plays from
   wherever you've scrolled to. */
const startCue = document.querySelector('.startcue');
const engageCue = () => startCue && startCue.classList.add('is-engaged');
function reflectPlay(playing) {
  setPlayState(playing);
  if (startCue) { startCue.classList.add('is-engaged'); startCue.classList.toggle('is-playing', playing); }
}

/* transport: same UI, mode-specific backend */
buildControls({
  onToggle: () => {
    if (isPlayer) reflectPlay(playerApi.toggle());
    else if (isAutoScrolling()) stopAutoScroll();          // stop → autoStop cb → reflectPlay(false)
    else reflectPlay(startAutoScroll(() => reflectPlay(false)));
  },
  onRestart: () => {
    if (isPlayer) { playerApi.restart(); reflectPlay(true); }
    else { stopAutoScroll(); scrollToScene(0); }
  },
  onPrev: () => {
    if (isPlayer) playerApi.step(-1, getActiveScene());
    else { stopAutoScroll(); scrollToScene(Math.max(0, getActiveScene() - 1)); }
  },
  onNext: () => {
    if (isPlayer) playerApi.step(1, getActiveScene());
    else { stopAutoScroll(); scrollToScene(Math.min(6, getActiveScene() + 1)); }
  },
});

/* portrait-narrow viewports crop the sheet instead of letterboxing it */
const bp = document.getElementById('bp');
const sliceMq = matchMedia(MOBILE_MQ);
const setPAR = () =>
  bp.setAttribute('preserveAspectRatio', sliceMq.matches ? 'xMidYMid slice' : 'xMidYMid meet');
setPAR();
sliceMq.addEventListener('change', () => {
  setPAR();
  if (window.ScrollTrigger) ScrollTrigger.refresh();
});

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduced && window.gsap && (isPlayer || window.ScrollTrigger)) {
  document.fonts.ready.then(() => {
    initTimeline({ onProgress: onProgress, mode, ...opts });
    if (window.ScrollTrigger && !isPlayer) ScrollTrigger.refresh();
    if (isPlayer && opts.autoplay) setPlayState(true);
  });
} else {
  document.body.classList.add('is-static');
  if (window.gsap) buildStaticPoster();
}

function onProgress(p) {
  announceScene(p);
  setProgress(p);
}

/* wire the cue: its play button plays from the CURRENT position and is always
   available (only hidden mid-playback); the "scroll" hint calms down once you
   start scrolling. Player mode has no scroll; autoplay starts already playing. */
if (startCue) {
  const note = startCue.querySelector('.startcue-note');
  if (isPlayer && note) note.textContent = 'Press play';
  if (opts.autoplay) startCue.classList.add('is-engaged', 'is-playing');
  startCue.querySelector('.startcue-play').addEventListener('click', () => {
    if (isPlayer) { playerApi.restart(); reflectPlay(true); }
    else reflectPlay(startAutoScroll(() => reflectPlay(false)));
  });
  ['wheel', 'keydown', 'touchstart', 'scroll'].forEach((ev) =>
    addEventListener(ev, engageCue, { passive: true, once: true }));
}
