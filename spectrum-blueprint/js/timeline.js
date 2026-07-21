/* ============================================================
   timeline.js — one master timeline, one ScrollTrigger.
   Camera = transform of #world (sheet chrome never zooms).
   Timeline duration is 100 units; scene labels sit at the
   fractions defined in data.js SCENES. Unlike the object
   blueprints (in-place zooms), this one pans a wide frequency
   chart left→right.
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
   reported/consumed in the VISIBLE range [START,100] → 0–100 %, so the rail /
   progress bar / transport skip it. */
const START = 14;
const toVisible = (t) => ((t - START) / (tlRef.duration() - START)) * 100;
const fromVisible = (v) => START + (v / 100) * (tlRef.duration() - START);

/* the scrub-wrapper tween (below, in build()) — hoisted to module scope so
   explicit jumps can drive its progress directly, bypassing ScrollTrigger's
   own scrub-smoothing (see jumpToPercent) */
let headTween = null;

/* Explicit navigation (rail dots, prev/next, the progress bar) jumps straight to
   the target — no watching the camera pan through whatever's in between. Setting
   BOTH the scroll position AND the wrapped scrub tween's progress in the same call
   is what makes this instant and reliable: ScrollTrigger's `scrub` smooths how its
   animation chases the RAW scroll-derived progress, so if we only moved
   window.scrollY and waited, a rapid second click would read a scene index that
   hadn't caught up yet and silently retarget the same scene. Driving
   headTween.progress() directly skips that lag entirely. */
function jumpToPercent(targetPct) {
  if (!st || !headTween) return;
  if (isAutoScrolling()) stopAutoScroll();
  const clamped = Math.min(Math.max(targetPct, 0), 99.5);
  window.scrollTo({ top: st.start + (st.end - st.start) * (clamped / 100), behavior: 'instant' });
  headTween.progress(clamped / 100, false);
}
export function scrollToScene(i) {
  const idx = Math.max(0, Math.min(SCENES.length - 1, i));
  /* Land at the scene MIDPOINT, not just past its start. This chart pans the
     camera HORIZONTALLY across a wide frequency axis (unlike the object
     blueprints, which zoom in place), so a jump landing early in a scene freezes
     the camera partway through a long pan and frames nothing. The midpoint is
     where the pan and the scene's reveals have settled. */
  const [t0, t1] = SCENES[idx].t;
  jumpToPercent(Math.min((t0 + t1) / 2, 99));
}
/* progress-bar click/drag calls this directly with the exact pointer position */
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
/* remembered for the next startAutoScroll(), and applied live to one already
   running (FF/REW while scroll-mode autoplay is in progress) */
export function setScrollSpeed(mult) {
  scrollSpeedMult = mult;
  if (scrollTween) scrollTween.timeScale(mult);
}

/* Portrait phones crop the sheet (slice) and can't afford the margin diagrams,
   so scenes recenter on the chart at looser zooms. */
export const MOBILE_MQ = '(max-width: 900px) and (orientation: portrait)';
const CAM_MOBILE = {
  full:    { px: 800,  py: 500, z: 0.92 },
  wave:    { px: 384,  py: 356, z: 1.25 },
  bands:   { px: 520,  py: 606, z: 1.05 },
  ka:      { px: 496,  py: 726, z: 1.35 },
  why:     { px: 862,  py: 406, z: 1.4 },
  duplex:  { px: 1002, py: 792, z: 1.32 },
  optical: { px: 1322, py: 744, z: 1.35 },
  license: { px: 1276, py: 382, z: 1.16 },
};
let CAMS = CAM;

/* ---------- documentary spotlight ----------
   Each band scene dims every non-focus band bracket so the camera's subject
   carries the frame. Dims tween stroke-/fill-opacity ATTRIBUTES — never
   opacity/autoAlpha — so they can't fight the reveal choreography. Desktop only. */
const DIM = 0.3, SOFT = 0.55;
const SPOT_GROUPS = ['#band-inc', '#band-ku', '#band-ka', '#band-qv', '#band-opt'];
const ALL_LIT = Object.fromEntries(SPOT_GROUPS.map((s) => [s, 1]));
function spot(tl, at, focus, dur = 1.6) {
  for (const sel of SPOT_GROUPS) {
    const v = focus[sel] ?? DIM;
    tl.to(sel, { attr: { 'stroke-opacity': v, 'fill-opacity': v }, duration: dur, ease: 'power2.inOut' }, at);
  }
}

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

function build(isMobile, onProgress) {
  CAMS = isMobile ? CAM_MOBILE : CAM;

  /* Initial states are applied here, not in CSS: without JS the page remains a
     finished static drawing. */
  gsap.set('#bp .dr', { strokeDashoffset: 1.02 });
  gsap.set(
    ['#zones', '#titleblock', '#notes', '#grid-1', '#grid-2',
     '#axis-ticks', '#axis > text', '#wave text', '#wave .dash-ext'],
    { autoAlpha: 0 }
  );
  gsap.set(['#titleblock text', '#notes text'], { autoAlpha: 0 });
  gsap.set('.panel', { autoAlpha: 0, y: 24 });
  applyCam();

  /* Build the whole timeline PAUSED with no ScrollTrigger. The draw-on intro lives
     at t < START; both modes land at START and treat [START,end] as the run. */
  const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true });
  tlRef = tl;

  sceneDraw(tl);
  sceneWave(tl);
  sceneBands(tl);
  sceneKa(tl);
  sceneWhy(tl);
  sceneDuplex(tl);
  sceneOptical(tl);
  sceneLicense(tl);

  if (!isMobile) {
    gsap.set(SPOT_GROUPS, { attr: { 'stroke-opacity': 1, 'fill-opacity': 1 } });
    spot(tl, 26.4, ALL_LIT);              // all bands lit
    spot(tl, 39.4, { '#band-ka': 1 });    // Ka hero, others dim
    spot(tl, 51.4, {});                   // rain-fade focus: dim the bands
    spot(tl, 63.4, {});                   // duplex focus
    spot(tl, 76.4, { '#band-opt': 1 });   // optical lit
    spot(tl, 95.6, ALL_LIT);              // money shot: everything lit
  }
  tl.to({}, { duration: 0.5 }, 99.5);     // hard end at 100

  if (MODE === 'player') {
    tl.repeat(OPTS.loop ? -1 : 0).repeatDelay(3.2).timeScale(OPTS.speed);
    tl.eventCallback('onUpdate', () => onProgress && onProgress(toVisible(tl.time())));
    st = null;
    started = false;
    if (OPTS.autoplay) { started = true; tl.play(START); }
    else tl.time(START).pause();
  } else {
    const cfg = window.SPEC_BP_CONFIG || {};
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

/* Reduced motion: no pin, no scrub — render the full annotated chart once. */
export function buildStaticPoster() {
  worldEl = document.getElementById('world');
  const P = matchMedia(MOBILE_MQ).matches ? CAM_MOBILE : CAM;
  gsap.set(
    ['#bands', '#ka-detail', '#rainfade', '#duplex', '#optical', '#license',
     '#em-ref', '#anno > g', '#stamp'],
    { autoAlpha: 1 }
  );
  setCam(P.full);
}

/* ---------- scene 0 · 0–14 · the sheet draws itself ---------- */
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
    /* the frequency axis draws left→right, then the wave chirps in above it */
    .to('#axis-rf', { strokeDashoffset: 0, duration: 1.8 }, 3.2)
    .to('#axis-break', { strokeDashoffset: 0, duration: 0.4 }, 4.8)
    .to('#axis-opt', { strokeDashoffset: 0, duration: 1.0 }, 5.0)
    .to('#axis-ticks', { autoAlpha: 1, duration: 1.0 }, 5.2)
    .to('#axis > text', { autoAlpha: 1, duration: 0.8 }, 5.4)
    .to('#wave .dash-ext', { autoAlpha: 1, duration: 0.6 }, 4.0)
    .to('#wave-rf', { strokeDashoffset: 0, duration: 3.0 }, 4.0)
    .to('#wave text', { autoAlpha: 1, duration: 0.9, stagger: 0.1 }, 6.6);
}

/* ---------- scene 1 · 14 · what spectrum is (wave + EM rainbow) ---------- */
function sceneWave(tl) {
  tl.addLabel('wave', 14)
    .to(cam, camTo(CAMS.wave, 3.0), 14.2)
    .to('#em-ref', { autoAlpha: 1, duration: 1.2 }, 15.8)
    .to('#panel-1', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 16.2);
}

/* ---------- scene 2 · 26 · the bands, end to end ---------- */
function sceneBands(tl) {
  tl.addLabel('bands', 26)
    .to('#panel-1', { autoAlpha: 0, y: -18, duration: 0.8 }, 26)
    .to('#em-ref', { autoAlpha: 0, duration: 0.9 }, 26)
    .to(cam, camTo(CAMS.bands, 3.0), 26.2)
    .to('#bands', { autoAlpha: 1, duration: 0.4 }, 28.0)
    .to('#bands .dr', { strokeDashoffset: 0, duration: 1.8, stagger: 0.16 }, 28.1)
    .to('#panel-2', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 28.6);
}

/* ---------- scene 3 · 39 · Amazon Leo runs on Ka (hero) ---------- */
function sceneKa(tl) {
  tl.addLabel('ka', 39)
    .to('#panel-2', { autoAlpha: 0, y: -18, duration: 0.8 }, 39)
    .to(cam, camTo(CAMS.ka, 3.2), 39.2)
    .to('#band-ka .dr', { stroke: '#7ce9ff', duration: 1.0 }, 41.0)
    .to('#ka-detail', { autoAlpha: 1, duration: 1.0 }, 41.4)
    .to('#panel-3', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 41.8);
}

/* ---------- scene 4 · 51 · why Ka, not Ku (rain fade) ---------- */
function sceneWhy(tl) {
  tl.addLabel('why', 51)
    .to('#panel-3', { autoAlpha: 0, y: -18, duration: 0.8 }, 51)
    .to('#ka-detail', { autoAlpha: 0, duration: 0.8 }, 51)
    .to('#band-ka .dr', { stroke: 'rgba(233,242,255,0.92)', duration: 0.8 }, 51)
    .to(cam, camTo(CAMS.why, 3.0), 51.2)
    .to('#rainfade', { autoAlpha: 1, duration: 0.9 }, 53.0)
    .to('#rainfade-curve', { strokeDashoffset: 0, duration: 2.0 }, 53.4)
    .to('#panel-4', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 53.4);
}

/* ---------- scene 5 · 63 · uplink, downlink, reuse ---------- */
function sceneDuplex(tl) {
  tl.addLabel('duplex', 63)
    .to('#panel-4', { autoAlpha: 0, y: -18, duration: 0.8 }, 63)
    .to('#rainfade', { autoAlpha: 0, duration: 0.9 }, 63)
    .to(cam, camTo(CAMS.duplex, 3.0), 63.2)
    .to('#duplex', { autoAlpha: 1, duration: 1.0 }, 65.0)
    .to('#panel-5', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 65.2);
}

/* ---------- scene 6 · 76 · beyond radio: laser crosslinks (amber) ---------- */
function sceneOptical(tl) {
  tl.addLabel('optical', 76)
    .to('#panel-5', { autoAlpha: 0, y: -18, duration: 0.8 }, 76)
    .to('#duplex', { autoAlpha: 0, duration: 0.9 }, 76)
    .to(cam, camTo(CAMS.optical, 3.0), 76.2)
    .to('#optical', { autoAlpha: 1, duration: 1.0 }, 78.0)
    .to('#laser-beam', { strokeDashoffset: 0, duration: 1.2 }, 78.4)
    .to('#lead-opt', { autoAlpha: 1, duration: 0.5 }, 79.0)
    .fromTo('#lead-opt path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.0 }, 79.1)
    .to('#panel-6', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 78.6);
}

/* ---------- scene 7 · 88–100 · licensing → full-chart money shot → stamp ---------- */
function sceneLicense(tl) {
  tl.addLabel('license', 88)
    .to('#panel-6', { autoAlpha: 0, y: -18, duration: 0.8 }, 88)
    .to(['#optical', '#lead-opt'], { autoAlpha: 0, duration: 0.8 }, 88)
    .to(cam, camTo(CAMS.license, 3.2), 88.2)
    .to('#license', { autoAlpha: 1, duration: 1.0 }, 90.4)
    .to('#panel-7', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 90.6)
    /* pull back and light the whole sheet up — the complete annotated chart */
    .to('#panel-7', { autoAlpha: 0, y: -18, duration: 0.8 }, 95.4)
    .to(cam, camTo(CAMS.full, 3.0), 95.6)
    .to(['#bands', '#ka-detail', '#rainfade', '#duplex', '#optical'],
      { autoAlpha: 1, duration: 1.6 }, 96.0)
    .to('#band-ka .dr', { stroke: '#7ce9ff', duration: 1.0 }, 96.0)
    /* the closing beat: the compliance stamp thunks down */
    .fromTo('#stamp',
      { autoAlpha: 0, scale: 1.6, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power3.out' }, 98.0);
}
