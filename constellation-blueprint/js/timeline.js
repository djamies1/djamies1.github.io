/* ============================================================
   timeline.js — one master timeline, one ScrollTrigger.
   Camera = transform of #world (sheet chrome never zooms).
   Timeline duration is 100 units; scene labels sit at the master
   times below. Like the object blueprints, this one ZOOMS in
   place around a fixed Earth-and-orbits diagram (rather than
   panning a wide chart).
   ============================================================ */

import { CAM, SCENES, SCROLL_VH } from './data.js';

/* Camera: tween a plain {px,py,z} object and write the matrix attribute
   directly. px,py = world point centered on the sheet (800,500); z = zoom. */
const cam = { px: 800, py: 500, z: 1 };
let worldEl = null;
function applyCam() {
  worldEl.setAttribute(
    'transform',
    `matrix(${cam.z},0,0,${cam.z},${800 - cam.z * cam.px},${500 - cam.z * cam.py})`
  );
}
const camTo = (preset, duration) =>
  ({ ...preset, duration, ease: 'power2.inOut', onUpdate: applyCam });

/* one-shot camera set for the reduced-motion static poster */
export function setCam(preset) {
  worldEl = worldEl || document.getElementById('world');
  Object.assign(cam, preset);
  applyCam();
}

let st = null;
let tlRef = null;
let MODE = 'scroll';
let OPTS = { autoplay: false, loop: false, speed: 1.0 };
let started = false;           // player: first Play restarts from 0 (poster frame pre-seeks)
/* The draw-on intro (master t 0–START) is pre-rolled: seeking past it builds the
   finished sheet, but the widget LANDS at START — the start of the first scene,
   fully drawn — and never dwells on the boring stroke-by-stroke draw. Progress is
   reported/consumed in the VISIBLE range [START,100] → 0–100 %. */
const START = 14;
const toVisible = (t) => ((t - START) / (tlRef.duration() - START)) * 100;
const fromVisible = (v) => START + (v / 100) * (tlRef.duration() - START);

/* the scrub-wrapper tween (below, in build()) — hoisted to module scope so
   explicit jumps can drive its progress directly, bypassing ScrollTrigger's
   own scrub-smoothing (see jumpToPercent) */
let headTween = null;

function jumpToPercent(targetPct) {
  if (!st || !headTween) return;
  if (isAutoScrolling()) stopAutoScroll();
  const clamped = Math.min(Math.max(targetPct, 0), 99.5);
  window.scrollTo({ top: st.start + (st.end - st.start) * (clamped / 100), behavior: 'instant' });
  headTween.progress(clamped / 100, false);
}
export function scrollToScene(i) {
  const idx = Math.max(0, Math.min(SCENES.length - 1, i));
  /* Land at the scene MIDPOINT so the camera move and the scene's reveals have
     settled, not partway through a long zoom. */
  const [t0, t1] = SCENES[idx].t;
  jumpToPercent(Math.min((t0 + t1) / 2, 99));
}
export function scrubToPercent(pct) {
  jumpToPercent(pct);
}

/* ---------- player-mode transport (drives the timeline with time) ---------- */
export const playerApi = {
  isPlaying: () => !!tlRef && !tlRef.paused(),
  toggle() {
    if (!tlRef) return false;
    if (tlRef.paused()) {
      if (!started) { started = true; tlRef.play(START); }
      else tlRef.play();
      return true;
    }
    tlRef.pause();
    return false;
  },
  restart() {
    if (!tlRef) return;
    started = true;
    tlRef.play(START);
  },
  goto(i) {
    if (!tlRef) return;
    started = true;
    const [t0, t1] = SCENES[i].t;
    tlRef.seek(fromVisible((t0 + t1) / 2), false);
  },
  step(dir, current) {
    this.goto(Math.max(0, Math.min(SCENES.length - 1, current + dir)));
  },
  scrub(percentVisible) {
    if (!tlRef) return;
    started = true;
    tlRef.seek(fromVisible(Math.min(Math.max(percentVisible, 0), 100)), false);
  },
  setSpeed(mult) {
    OPTS.speed = mult;
    if (tlRef) tlRef.timeScale(mult);
  },
};

/* ---------- scroll-mode auto-play (tweens the scroll position;
   any real user input hands control back) ---------- */
const AUTOSCROLL_SECS = 104;
const INPUT_EVENTS = ['wheel', 'touchstart', 'keydown', 'mousedown'];
let scrollTween = null;
let autoStopCb = null;
let scrollSpeedMult = 1;
function cancelOnInput(e) {
  if (e.target && e.target.closest && e.target.closest('.controls, .startcue-play, .rail')) return;
  stopAutoScroll();
}
export const isAutoScrolling = () => !!scrollTween;
export function startAutoScroll(onStop) {
  if (!st || scrollTween) return false;
  const span = st.end - st.start;
  const dur = Math.max(1, (st.end - window.scrollY) / span * AUTOSCROLL_SECS);
  const proxy = { y: window.scrollY };
  autoStopCb = onStop || null;
  scrollTween = gsap.to(proxy, {
    y: st.end, duration: dur, ease: 'none',
    onUpdate: () => window.scrollTo({ top: proxy.y, behavior: 'instant' }),
    onComplete: stopAutoScroll,
  });
  scrollTween.timeScale(scrollSpeedMult);
  INPUT_EVENTS.forEach((ev) => addEventListener(ev, cancelOnInput, { passive: true }));
  return true;
}
export function stopAutoScroll() {
  if (!scrollTween) return;
  scrollTween.kill();
  scrollTween = null;
  INPUT_EVENTS.forEach((ev) => removeEventListener(ev, cancelOnInput));
  if (autoStopCb) autoStopCb();
}
export function setScrollSpeed(mult) {
  scrollSpeedMult = mult;
  if (scrollTween) scrollTween.timeScale(mult);
}

/* Portrait phones crop the sheet (slice) and can't afford the margin diagrams,
   so scenes recenter on Earth at looser zooms. */
export const MOBILE_MQ = '(max-width: 900px) and (orientation: portrait)';
const CAM_MOBILE = {
  full:   { px: 720, py: 524, z: 0.92 },
  leo:    { px: 560, py: 470, z: 1.00 },
  shells: { px: 520, py: 500, z: 1.00 },
  planes: { px: 560, py: 540, z: 1.05 },
  cover:  { px: 726, py: 330, z: 1.60 },
  mesh:   { px: 786, py: 300, z: 1.55 },
  ground: { px: 556, py: 700, z: 1.50 },
};
let CAMS = CAM;

export function initTimeline({ onProgress, mode = 'scroll', autoplay = false, loop = false, speed = 1.0 } = {}) {
  MODE = mode;
  OPTS = { autoplay, loop, speed };
  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }
  worldEl = document.getElementById('world');

  const mm = gsap.matchMedia();
  mm.add(MOBILE_MQ, () => build(true, onProgress));
  mm.add('(min-width: 901px), (orientation: landscape)', () => build(false, onProgress));
}

/* groups that start hidden and are revealed per scene */
const HIDDEN = [
  '#geo-ring', '#lbl-leo', '#shell-tab', '#sats', '#planes', '#lbl-planes',
  '#coverage', '#lbl-cover', '#cluster', '#mesh', '#mesh-note', '#gateways',
  '#ground-note', '#anno > g',
];

function build(isMobile, onProgress) {
  CAMS = isMobile ? CAM_MOBILE : CAM;

  /* Initial states applied here, not in CSS: without JS the page stays a finished
     static drawing. */
  gsap.set('#bp .dr', { strokeDashoffset: 1.02 });
  gsap.set(
    ['#zones', '#titleblock', '#notes', '#grid-1', '#grid-2', '#graticule', ...HIDDEN],
    { autoAlpha: 0 }
  );
  gsap.set(['#titleblock text', '#notes text'], { autoAlpha: 0 });
  gsap.set('.panel', { autoAlpha: 0, y: 24 });
  applyCam();

  const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true });
  tlRef = tl;

  sceneDraw(tl);
  sceneLeo(tl);
  sceneShells(tl);
  scenePlanes(tl);
  sceneCover(tl);
  sceneMesh(tl);
  sceneGround(tl);
  sceneRecap(tl);

  tl.to({}, { duration: 0.5 }, 99.5);     // hard end at 100

  if (MODE === 'player') {
    tl.repeat(OPTS.loop ? -1 : 0).repeatDelay(3.2).timeScale(OPTS.speed);
    tl.eventCallback('onUpdate', () => onProgress && onProgress(toVisible(tl.time())));
    st = null;
    started = false;
    if (OPTS.autoplay) { started = true; tl.play(START); }
    else tl.time(START).pause();
  } else {
    const cfg = window.CON_BP_CONFIG || {};
    const head = { t: START };
    headTween = gsap.to(head, {
      t: tl.duration(), ease: 'none', paused: true,
      onUpdate: () => { tl.time(head.t); onProgress && onProgress(toVisible(head.t)); },
    });
    st = ScrollTrigger.create({
      animation: headTween,
      trigger: '.stage',
      start: 'top top',
      end: () => '+=' + window.innerHeight * SCROLL_VH,
      pin: true,
      anticipatePin: 1,
      scrub: matchMedia('(hover: none)').matches ? 0.5 : 0.75,
      invalidateOnRefresh: true,
      ...cfg,
    });
    tl.time(START);
  }

  return () => {
    st = null;
    tlRef = null;
    started = false;
    headTween = null;
    Object.assign(cam, { px: 800, py: 500, z: 1 });
    applyCam();
  };
}

/* Reduced motion: no pin, no scrub — render the whole annotated system once. */
export function buildStaticPoster() {
  worldEl = document.getElementById('world');
  gsap.set(
    ['#geo-ring', '#lbl-leo', '#shell-tab', '#sats', '#planes', '#lbl-planes',
     '#coverage', '#lbl-cover', '#cluster', '#mesh', '#mesh-note', '#gateways',
     '#ground-note', '#anno > g', '#stamp'],
    { autoAlpha: 1 }
  );
  setCam((matchMedia(MOBILE_MQ).matches ? CAM_MOBILE : CAM).full);
}

/* ---------- scene 0 · 0–14 · the sheet + globe draw themselves ---------- */
function sceneDraw(tl) {
  tl.addLabel('draw', 0)
    .to(['#grid-1', '#grid-2'], { autoAlpha: 1, duration: 1.4 }, 0)
    .to('#frame-outer', { strokeDashoffset: 0, duration: 1.5 }, 0.2)
    .to('#frame-inner', { strokeDashoffset: 0, duration: 1.5 }, 0.5)
    .to('#zones', { autoAlpha: 1, duration: 1.0 }, 1.4)
    .to('#titleblock', { autoAlpha: 1, duration: 0.05 }, 1.6)
    .to('#titleblock .dr', { strokeDashoffset: 0, duration: 1.3, stagger: 0.12 }, 1.65)
    .to('#titleblock text', { autoAlpha: 1, duration: 0.7, stagger: 0.05 }, 2.3)
    .to('#notes', { autoAlpha: 1, duration: 0.05 }, 2.9)
    .to('#notes text', { autoAlpha: 1, duration: 0.6, stagger: 0.12 }, 2.95)
    /* the globe draws, then the three shells sweep on */
    .to('#earth', { strokeDashoffset: 0, duration: 2.2 }, 3.2)
    .to('#graticule', { autoAlpha: 1, duration: 1.2 }, 4.6)
    .to('#shells circle', { strokeDashoffset: 0, duration: 2.0, stagger: 0.45 }, 4.4);
}

/* ---------- scene 1 · 14 · low Earth orbit (LEO vs GEO) ---------- */
function sceneLeo(tl) {
  tl.addLabel('leo', 14)
    .to(cam, camTo(CAMS.leo, 3.0), 14.2)
    .to('#geo-ring', { autoAlpha: 1, duration: 1.3 }, 15.2)
    .to('#lbl-leo', { autoAlpha: 1, duration: 1.0 }, 16.0)
    .to('#panel-1', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 16.2);
}

/* ---------- scene 2 · 26.5 · three shells, 3,236 ---------- */
function sceneShells(tl) {
  tl.addLabel('shells', 26.5)
    .to('#panel-1', { autoAlpha: 0, y: -18, duration: 0.8 }, 26.5)
    .to(['#lbl-leo', '#geo-ring'], { autoAlpha: 0, duration: 0.8 }, 26.5)
    .to(cam, camTo(CAMS.shells, 3.0), 26.7)
    .to('#sats', { autoAlpha: 1, duration: 1.2 }, 28.2)
    .to('#shell-tab', { autoAlpha: 1, duration: 1.0 }, 28.4)
    .to('#panel-2', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 28.8);
}

/* ---------- scene 3 · 39 · 98 orbital planes ---------- */
function scenePlanes(tl) {
  tl.addLabel('planes', 39)
    .to('#panel-2', { autoAlpha: 0, y: -18, duration: 0.8 }, 39)
    .to('#shell-tab', { autoAlpha: 0, duration: 0.8 }, 39)
    .to(cam, camTo(CAMS.planes, 3.0), 39.2)
    .to('#planes', { autoAlpha: 1, duration: 1.6 }, 40.8)
    .to('#lbl-planes', { autoAlpha: 1, duration: 1.0 }, 41.4)
    .to('#panel-3', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 41.6);
}

/* ---------- scene 4 · 51.5 · always one overhead (coverage) ---------- */
function sceneCover(tl) {
  tl.addLabel('cover', 51.5)
    .to('#panel-3', { autoAlpha: 0, y: -18, duration: 0.8 }, 51.5)
    .to('#lbl-planes', { autoAlpha: 0, duration: 0.8 }, 51.5)
    /* dim the lattice so the single satellite + its cell carry the frame */
    .to(['#planes', '#sats'], { autoAlpha: 0.26, duration: 1.0 }, 51.5)
    .to(cam, camTo(CAMS.cover, 3.0), 51.7)
    .to('#cluster', { autoAlpha: 1, duration: 1.0 }, 53.2)
    .to('#coverage', { autoAlpha: 1, duration: 1.0 }, 53.6)
    .to('#lbl-cover', { autoAlpha: 1, duration: 0.8 }, 54.0)
    .to('#panel-4', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 53.8);
}

/* ---------- scene 5 · 64 · a mesh of light (OISL, amber) ---------- */
function sceneMesh(tl) {
  tl.addLabel('mesh', 64)
    .to('#panel-4', { autoAlpha: 0, y: -18, duration: 0.8 }, 64)
    .to(['#coverage', '#lbl-cover'], { autoAlpha: 0, duration: 0.9 }, 64)
    .to(cam, camTo(CAMS.mesh, 3.0), 64.2)
    .to('#mesh', { autoAlpha: 1, duration: 0.4 }, 65.6)
    .to('#mesh .dr', { strokeDashoffset: 0, duration: 1.6, stagger: 0.12 }, 65.7)
    .to('#mesh-note', { autoAlpha: 1, duration: 1.0 }, 66.4)
    .to('#panel-5', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 66.0);
}

/* ---------- scene 6 · 77 · fewer ties to the ground ---------- */
function sceneGround(tl) {
  tl.addLabel('ground', 77)
    .to('#panel-5', { autoAlpha: 0, y: -18, duration: 0.8 }, 77)
    .to('#mesh-note', { autoAlpha: 0, duration: 0.9 }, 77)
    .to('#mesh', { autoAlpha: 0.32, duration: 0.9 }, 77)
    .to(cam, camTo(CAMS.ground, 3.0), 77.2)
    .to('#gateways', { autoAlpha: 1, duration: 1.0 }, 79.0)
    .to('#ground-note', { autoAlpha: 1, duration: 1.0 }, 79.4)
    .to('#panel-6', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 79.2);
}

/* ---------- scene 7 · 88.4–100 · one network → money shot → stamp ---------- */
function sceneRecap(tl) {
  tl.addLabel('recap', 88.4)
    .to('#panel-6', { autoAlpha: 0, y: -18, duration: 0.8 }, 88.4)
    .to('#ground-note', { autoAlpha: 0, duration: 0.8 }, 88.4)
    .to(cam, camTo(CAMS.full, 3.2), 88.6)
    /* pull back and light the whole system up */
    .to(['#planes', '#sats', '#mesh', '#cluster'], { autoAlpha: 1, duration: 1.6 }, 89.4)
    .to('#lead-recap', { autoAlpha: 1, duration: 1.0 }, 90.4)
    .to('#panel-7', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 90.6)
    .to('#panel-7', { autoAlpha: 0, y: -18, duration: 0.8 }, 95.4)
    /* the closing beat: the compliance stamp thunks down */
    .fromTo('#stamp',
      { autoAlpha: 0, scale: 1.6, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power3.out' }, 98.0);
}
