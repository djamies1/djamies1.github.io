/* ============================================================
   main.js — boot.
   Two run modes:
   · scroll (default) — pinned scrollytelling; the cover button /
     transport play tween the scroll position (any user input
     hands control back)
   · player (?mode=player) — no scroll at all; the timeline is
     time-driven with transport controls. Params: autoplay, loop,
     speed (timeScale, default 2 ≈ 50 s run). Built for embedding
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
const CFG = window.SAT_BP_CONFIG || {};
const mode = q.get('mode') || CFG.mode || 'scroll';
const opts = {
  autoplay: q.has('autoplay') || !!CFG.autoplay,
  loop: q.has('loop') || !!CFG.loop,
  speed: parseFloat(q.get('speed') || CFG.speed) || 2,
};
const isPlayer = mode === 'player';
if (isPlayer) document.body.classList.add('is-player');

buildDrawing();
buildUI((i) => (isPlayer ? playerApi.goto(i) : scrollToScene(i)));

/* transport: same UI, mode-specific backend */
buildControls({
  onToggle: () => {
    if (isPlayer) setPlayState(playerApi.toggle());
    else if (isAutoScrolling()) stopAutoScroll();
    else setPlayState(startAutoScroll(() => setPlayState(false)));
  },
  onRestart: () => {
    if (isPlayer) { playerApi.restart(); setPlayState(true); }
    else { stopAutoScroll(); scrollToScene(0); }
  },
  onPrev: () => {
    if (isPlayer) playerApi.step(-1, getActiveScene());
    else { stopAutoScroll(); scrollToScene(Math.max(0, getActiveScene() - 1)); }
  },
  onNext: () => {
    if (isPlayer) playerApi.step(1, getActiveScene());
    else { stopAutoScroll(); scrollToScene(Math.min(7, getActiveScene() + 1)); }
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

/* scroll mode: the cover's big button plays the piece hands-free */
const coverPlay = document.querySelector('.cover-play');
if (coverPlay) {
  coverPlay.addEventListener('click', () => {
    setPlayState(startAutoScroll(() => setPlayState(false)));
  });
}
