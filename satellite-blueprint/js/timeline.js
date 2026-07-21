/* ============================================================
   timeline.js — one master timeline, one ScrollTrigger.
   Camera = transform of #world (sheet chrome never zooms).
   Timeline duration is 100 units; scene labels sit at the
   fractions defined in data.js SCENES.
   ============================================================ */

import { CAM, EXPLODE, SCENES, SCROLL_VH } from './data.js';

/* Camera: tween a plain {px,py,z} object and write the matrix attribute
   directly. GSAP's transform shorthands resolve origins against the
   element's bbox — and #world's bbox mutates as components move, which
   drifts the cached origin. A raw matrix has no origin at all.
   px,py = world point centered on the sheet (800,500); z = zoom. */
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
   finished sheet, but the widget LANDS at START — the start of the first component
   scene, fully drawn — and never dwells on the boring stroke-by-stroke draw. From
   there the first scroll/play pans into the component and its card appears, so
   scrolling produces obvious motion right away. Progress is reported/consumed in the
   VISIBLE range [START,100] → 0–100 %, so the rail/progress bar/transport skip it. */
const START = 14;
const toVisible = (t) => ((t - START) / (tlRef.duration() - START)) * 100;
const fromVisible = (v) => START + (v / 100) * (tlRef.duration() - START);

/* the scrub-wrapper tween (below, in build()) — hoisted to module scope so
   explicit jumps can drive its progress directly, bypassing ScrollTrigger's
   own scrub-smoothing (see jumpToPercent) */
let headTween = null;

/* Explicit navigation (rail dots, prev/next, the progress bar) jumps
   straight to the target — no watching the camera pan through whatever's
   in between. Setting BOTH the scroll position AND the wrapped scrub
   tween's progress in the same call is what makes this instant and
   reliable: ScrollTrigger's `scrub` option smooths how its animation
   chases the RAW scroll-derived progress (tuned for organic wheel
   scrolling), so if we only moved window.scrollY and waited, a rapid
   second click would read a scene index that hadn't caught up yet and
   silently retarget the same scene instead of advancing. Driving
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
  jumpToPercent(Math.min(SCENES[idx].t[0] + 1.2, 99));
}
/* progress-bar click/drag calls this directly with the exact pointer
   position — same instant mechanism, arbitrary percent instead of a
   scene's landing point */
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
    /* behavior:'instant' — the page's scroll-behavior:smooth would turn every
       per-frame scrollTo into its own easing animation and the page never moves */
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
/* remembered for the next startAutoScroll() call, and applied live to one
   already running (FF/REW while scroll-mode autoplay is in progress) */
export function setScrollSpeed(mult) {
  scrollSpeedMult = mult;
  if (scrollTween) scrollTween.timeScale(mult);
}

/* Portrait phones crop the sheet (slice) and can't afford margin
   annotations, so scenes recenter on the craft axis at looser zooms. */
export const MOBILE_MQ = '(max-width: 900px) and (orientation: portrait)';
const CAM_MOBILE = {
  full:     { px: 800, py: 500, z: 1.0 },
  bus:      { px: 800, py: 640, z: 1.6 },
  array:    { px: 800, py: 790, z: 1.9 },
  oisl:     { px: 800, py: 430, z: 1.0 },
  avionics: { px: 776, py: 650, z: 2.0 },
  power:    { px: 760, py: 300, z: 1.4 },
  prop:     { px: 870, py: 590, z: 1.8 },
  exploded: { px: 810, py: 468, z: 0.72 },
};
let CAMS = CAM;

/* ---------- documentary spotlight ----------
   Each component scene dims every non-focus assembly so the camera's subject
   carries the frame. Dims tween stroke-/fill-opacity ATTRIBUTES — never
   opacity/autoAlpha — so they can't fight the reveal choreography, and any
   child's own opacity animation still multiplies through. Desktop only: the
   mobile slice crop reframes scenes and hides the detail insets. */
const DIM = 0.32, SOFT = 0.55;
const SPOT_GROUPS = ['#asm-wing', '#asm-bus', '#asm-oisl', '#asm-prop', '#asm-nadir'];
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

  /* gsap.matchMedia rebuilds the whole timeline (and reverts every set())
     when the breakpoint flips — camera presets swap with it */
  const mm = gsap.matchMedia();
  mm.add(MOBILE_MQ, () => build(true, onProgress));
  mm.add('(min-width: 901px), (orientation: landscape)', () => build(false, onProgress));
}

function build(isMobile, onProgress) {
  CAMS = isMobile ? CAM_MOBILE : CAM;

  /* Initial states are applied here, not in CSS: without JS the page
     remains a finished static drawing. */
  gsap.set('#bp .dr', { strokeDashoffset: 1.02 });
  gsap.set(
    ['#zones', '#titleblock', '#notes', '#grid-1', '#grid-2', '#centerline',
     '#earth', '#craft .dash-hid'],
    { autoAlpha: 0 }
  );
  /* dim lines carry arrow markers, which paint even when the stroke is
     dash-hidden — so they hide via opacity as well */
  gsap.set(['#dims text', '#dims .dash-ext', '#dims .dr', '#titleblock text', '#notes text'], { autoAlpha: 0 });
  gsap.set(['#lasers text', '#lasers circle'], { autoAlpha: 0 });
  gsap.set('.panel', { autoAlpha: 0, y: 24 });
  applyCam();

  /* Build the whole timeline PAUSED with no ScrollTrigger. The draw-on intro and
     the pan into the first component live at t < START; seeking past them builds
     the finished, zoomed-in sheet, but neither mode dwells there — both land at
     START and treat [START,end] as the visible run. */
  const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true });
  tlRef = tl;

  sceneDraw(tl);
  sceneBus(tl);
  sceneArray(tl);
  sceneOisl(tl);
  sceneAvionics(tl);
  scenePower(tl);
  sceneProp(tl);
  sceneExploded(tl);

  if (!isMobile) {
    gsap.set(SPOT_GROUPS, { attr: { 'stroke-opacity': 1, 'fill-opacity': 1 } });
    spot(tl, 14.4, { '#asm-bus': 1 });                              // bus & structure
    spot(tl, 25.4, { '#asm-nadir': 1, '#asm-bus': SOFT });          // the antenna deck + beams
    spot(tl, 38.4, { '#asm-oisl': 1, '#asm-bus': SOFT });           // laser links
    spot(tl, 49.4, { '#asm-bus': 1 });                              // avionics bay opens in the bus
    spot(tl, 59.4, { '#asm-wing': 1, '#asm-bus': SOFT });           // the wing tracks the sun
    spot(tl, 70.4, { '#asm-prop': 1, '#asm-bus': SOFT });           // thruster + DETAIL A
    spot(tl, 82.2, Object.fromEntries(SPOT_GROUPS.map((s) => [s, 1]))); // explode: all lit
  }
  tl.to({}, { duration: 0.5 }, 99.5);   // hard end at 100

  if (MODE === 'player') {
    /* time-driven: the transport owns the playhead; progress reported in visible % */
    tl.repeat(OPTS.loop ? -1 : 0).repeatDelay(3.2).timeScale(OPTS.speed);
    tl.eventCallback('onUpdate', () => onProgress && onProgress(toVisible(tl.time())));
    st = null;
    started = false;
    if (OPTS.autoplay) { started = true; tl.play(START); }
    else tl.time(START).pause();          // poster: landed on the first component
  } else {
    /* scroll: a proxy playhead maps scroll 0→1 onto master t START→end, so the
       pinned scrub starts on the first component and the intro is unreachable */
    const cfg = window.SAT_BP_CONFIG || {};
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
    tl.time(START);                       // first paint lands on the component
  }

  /* matchMedia reverts gsap state, but the camera writes a raw attribute —
     reset it by hand when this context tears down */
  return () => {
    st = null;
    tlRef = null;
    started = false;
    headTween = null;
    Object.assign(cam, { px: 800, py: 500, z: 1 });
    applyCam();
  };
}

/* Reduced motion: no pin, no scrub — render the exploded poster once. */
export function buildStaticPoster() {
  worldEl = document.getElementById('world');
  const P = matchMedia(MOBILE_MQ).matches ? CAM_MOBILE : CAM;
  for (const [id, y] of Object.entries(EXPLODE.groups)) gsap.set('#' + id, { y });
  for (const [id, v] of Object.entries(EXPLODE.parts)) gsap.set('#' + id, v);
  gsap.set(['#x-labels g', '#av-cut', '#av-frame'], { autoAlpha: 1 });
  gsap.set('#clip-av-r', { attr: { x: 300, width: 900, height: 198 } });
  setCam(P.exploded);
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
    .to('#centerline', { autoAlpha: 0.9, duration: 0.7 }, 3.1)
    /* craft silhouette draws nadir-deck-up (DOM order reversed) */
    .to('#craft .ln-hi.dr',
      { strokeDashoffset: 0, duration: 3.6, stagger: { each: 0.22, from: 'end' } }, 3.4)
    .to('#craft .ln-mid.dr, #craft .ln-low.dr, #craft .ln-dim.dr',
      { strokeDashoffset: 0, duration: 2.6, stagger: 0.04 }, 5.6)
    /* hidden-line internals (tank, wheels, battery) sketch in */
    .to('#craft .dash-hid', { autoAlpha: 1, duration: 0.9 }, 8.8)
    .to('#earth', { autoAlpha: 1, duration: 1.0 }, 9.2)
    .to('#dims .dash-ext', { autoAlpha: 1, duration: 0.9 }, 9.4)
    .to('#dims .dr', { autoAlpha: 1, duration: 0.2 }, 9.55)
    .to('#dims .dr', { strokeDashoffset: 0, duration: 1.7, stagger: 0.3 }, 9.6)
    .to('#dims text', { autoAlpha: 1, duration: 0.9, stagger: 0.12 }, 10.8);
  /* panel-0 (overview card) intentionally never fades in — the widget lands on
     the first component (scene 1), so the overview intro card is dropped. */
}

/* ---------- scene 1 · 14–25 · bus & structure ---------- */
function sceneBus(tl) {
  tl.addLabel('bus', 14)
    .to('#panel-0', { autoAlpha: 0, y: -18, duration: 0.8 }, 14)
    .to('#dims', { autoAlpha: 0, duration: 1.0 }, 14.2)
    .to(cam, camTo(CAMS.bus, 3.0), 14.2)
    .to('#bus-outline', { stroke: '#7ce9ff', duration: 1.2 }, 16.6)
    /* the mirror film shimmers */
    .to('#mirror-film', { stroke: '#7ce9ff', autoAlpha: 1, duration: 1.4 }, 17.4)
    .to('#lead-bus', { autoAlpha: 1, duration: 0.5 }, 18.6)
    .fromTo('#lead-bus path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1, stagger: 0.28 }, 18.7)
    .to('#panel-1', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 18.5);
}

/* ---------- scene 2 · 25–38 · phased-array hero: beams steer ---------- */
function sceneArray(tl) {
  tl.addLabel('array', 25)
    .to('#panel-1', { autoAlpha: 0, y: -18, duration: 0.8 }, 25)
    .to('#lead-bus', { autoAlpha: 0, duration: 0.5 }, 25)
    .to('#bus-outline', { stroke: 'rgba(233,242,255,0.92)', duration: 0.8 }, 25)
    .to('#mirror-film', { stroke: 'rgba(233,242,255,0.17)', duration: 0.8 }, 25)
    .to(cam, camTo(CAMS.array, 3.2), 25.2)
    .to('#apertures .ln-hi', { stroke: '#7ce9ff', duration: 1.0 }, 27.4)
    .to('#db-mark', { autoAlpha: 1, duration: 0.7 }, 27.8)
    .to('#detail-b', { autoAlpha: 1, duration: 0.9 }, 28.5)
    /* beams draw on, then electronically re-steer about their apexes */
    .to('#beams', { autoAlpha: 1, duration: 0.3 }, 29.4)
    .to('#beams .dr', { strokeDashoffset: 0, duration: 1.5, stagger: 0.14 }, 29.5)
    .to('#beam-l', { rotation: 9, svgOrigin: '740 803', duration: 1.5, ease: 'power2.inOut' }, 31.6)
    .to('#beam-r', { rotation: -9, svgOrigin: '860 803', duration: 1.5, ease: 'power2.inOut' }, 31.6)
    .to('#beam-l', { rotation: -6, svgOrigin: '740 803', duration: 1.7, ease: 'power2.inOut' }, 33.3)
    .to('#beam-r', { rotation: 7, svgOrigin: '860 803', duration: 1.7, ease: 'power2.inOut' }, 33.3)
    .to('#beam-l', { rotation: 0, svgOrigin: '740 803', duration: 1.3, ease: 'power2.inOut' }, 35.2)
    .to('#beam-r', { rotation: 0, svgOrigin: '860 803', duration: 1.3, ease: 'power2.inOut' }, 35.2)
    .to('#lead-array', { autoAlpha: 1, duration: 0.5 }, 33.0)
    .fromTo('#lead-array path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1, stagger: 0.3 }, 33.1)
    .to('#panel-2', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 30.0);
}

/* ---------- scene 3 · 38–49 · optical mesh: lasers to the neighbors ---------- */
function sceneOisl(tl) {
  tl.addLabel('oisl', 38)
    .to('#panel-2', { autoAlpha: 0, y: -18, duration: 0.8 }, 38)
    .to('#lead-array', { autoAlpha: 0, duration: 0.5 }, 38)
    .to(['#beams', '#db-mark', '#detail-b'], { autoAlpha: 0, duration: 0.9 }, 38)
    .to('#apertures .ln-hi', { stroke: 'rgba(233,242,255,0.92)', duration: 0.8 }, 38)
    .to(cam, camTo(CAMS.oisl, 3.0), 38.2)
    .to('#asm-oisl .ln-hi', { stroke: '#7ce9ff', duration: 1.0 }, 40.2)
    .to('#ghost-sats', { autoAlpha: 0.9, duration: 1.2 }, 40.6)
    .to('#lasers', { autoAlpha: 1, duration: 0.2 }, 41.0)
    .to('#lasers .dr', { strokeDashoffset: 0, duration: 1.6, stagger: 0.4 }, 41.1)
    .to('#lasers circle', { autoAlpha: 1, duration: 0.5, stagger: 0.4 }, 42.3)
    .to('#lasers text', { autoAlpha: 1, duration: 0.8, stagger: 0.2 }, 42.7)
    .to('#lead-oisl', { autoAlpha: 1, duration: 0.5 }, 43.4)
    .fromTo('#lead-oisl path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1 }, 43.5)
    .to('#panel-3', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 42.0);
}

/* ---------- scene 4 · 49–59 · avionics bay opens: Prometheus ---------- */
function sceneAvionics(tl) {
  tl.addLabel('avionics', 49)
    .to('#panel-3', { autoAlpha: 0, y: -18, duration: 0.8 }, 49)
    .to('#lead-oisl', { autoAlpha: 0, duration: 0.5 }, 49)
    .to(['#lasers', '#ghost-sats'], { autoAlpha: 0, duration: 0.9 }, 49)
    .to('#asm-oisl .ln-hi', { stroke: 'rgba(233,242,255,0.92)', duration: 0.8 }, 49)
    .to(cam, camTo(CAMS.avionics, 3.0), 49.2)
    /* section cutaway: bay opens top-down via clip rect */
    .to('#av-frame', { autoAlpha: 1, duration: 0.6 }, 51.2)
    .to('#av-cut', { autoAlpha: 1, duration: 0.4 }, 51.5)
    .fromTo('#clip-av-r', { attr: { height: 0 } }, { attr: { height: 198 }, duration: 2.2 }, 51.6)
    .to('#lead-avionics', { autoAlpha: 1, duration: 0.5 }, 54.2)
    .fromTo('#lead-avionics path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1, stagger: 0.3 }, 54.3)
    .to('#panel-4', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 53.0);
}

/* ---------- scene 5 · 59–70 · power: the wing tracks the sun ---------- */
function scenePower(tl) {
  tl.addLabel('power', 59)
    .to('#panel-4', { autoAlpha: 0, y: -18, duration: 0.8 }, 59)
    .to('#lead-avionics', { autoAlpha: 0, duration: 0.5 }, 59)
    .to(cam, camTo(CAMS.power, 3.0), 59.2)
    .to('#sun', { autoAlpha: 1, duration: 1.0 }, 61.2)
    /* sun-tracking articulation about the boom root (bbox static — safe) */
    .to('#asm-wing', { rotation: 7, svgOrigin: '800 516', duration: 2.2, ease: 'power2.inOut' }, 62.0)
    .to('#asm-wing', { rotation: -5, svgOrigin: '800 516', duration: 2.2, ease: 'power2.inOut' }, 64.4)
    .to('#asm-wing', { rotation: 0, svgOrigin: '800 516', duration: 1.8, ease: 'power2.inOut' }, 66.8)
    .to('#lead-power', { autoAlpha: 1, duration: 0.5 }, 65.2)
    .fromTo('#lead-power path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1, stagger: 0.3 }, 65.3)
    .to('#panel-5', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 62.5);
}

/* ---------- scene 6 · 70–82 · propulsion & ADCS, DETAIL A ---------- */
function sceneProp(tl) {
  tl.addLabel('prop', 70)
    .to('#panel-5', { autoAlpha: 0, y: -18, duration: 0.8 }, 70)
    .to('#lead-power', { autoAlpha: 0, duration: 0.5 }, 70)
    .to('#sun', { autoAlpha: 0, duration: 0.8 }, 70)
    .to(cam, camTo(CAMS.prop, 3.0), 70.2)
    .to(['#prop-mod .ln-hi', '#prop-mod ellipse'], { stroke: '#7ce9ff', duration: 1.0 }, 72.2)
    /* plume flows: dash pattern slides (dashoffset only — cheap) */
    .to('#plume', { autoAlpha: 0.9, duration: 0.8 }, 73.0)
    .to('#plume path', { strokeDashoffset: -8.6, duration: 6.0 }, 73.0)
    .to('#da-mark', { autoAlpha: 1, duration: 0.7 }, 73.6)
    .to('#detail-a', { autoAlpha: 1, duration: 0.9 }, 74.4)
    .to('#lead-prop', { autoAlpha: 1, duration: 0.5 }, 76.4)
    .fromTo('#lead-prop path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.0, stagger: 0.28 }, 76.5)
    .to('#panel-6', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 74.5);
}

/* ---------- scene 7 · 82–100 · full explode → labels → reassemble → stamp ---------- */
function sceneExploded(tl) {
  const G = EXPLODE.groups;
  const P = EXPLODE.parts;
  tl.addLabel('exploded', 82)
    .to('#panel-6', { autoAlpha: 0, y: -18, duration: 0.8 }, 82)
    .to('#lead-prop', { autoAlpha: 0, duration: 0.5 }, 82)
    .to(['#da-mark', '#detail-a', '#plume'], { autoAlpha: 0, duration: 0.9 }, 82)
    .to(['#prop-mod .ln-hi', '#prop-mod ellipse'], { stroke: 'rgba(233,242,255,0.92)', duration: 0.8 }, 82)
    /* the card stack must be free of its bay clip before it slides out */
    .set('#clip-av-r', { attr: { x: 300, width: 900 } }, 83.2)
    /* pull back while every assembly separates */
    .to(cam, camTo(CAMS.exploded, 4.2), 83.4)
    .to('#asm-wing', { y: G['asm-wing'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#asm-nadir', { y: G['asm-nadir'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#av-stack', { ...P['av-stack'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#oisl-l', { ...P['oisl-l'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#oisl-r', { ...P['oisl-r'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#prop-mod', { ...P['prop-mod'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    /* the money shot: seven leader labels sweep in */
    .to('#x-labels g', { autoAlpha: 1, duration: 0.6, stagger: 0.28 }, 87.4)
    .fromTo('#x-labels path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.0, stagger: 0.28 }, 87.5)
    /* reassembly */
    .to('#x-labels g', { autoAlpha: 0, duration: 0.8 }, 92.6)
    .to(['#asm-wing', '#asm-nadir'], { y: 0, duration: 3.2, ease: 'power2.inOut' }, 93.4)
    .to(['#av-stack', '#oisl-l', '#oisl-r', '#prop-mod'],
      { x: 0, y: 0, rotation: 0, duration: 3.2, ease: 'power2.inOut' }, 93.4)
    .to(['#av-cut', '#av-frame', '#av-clip-w'], { autoAlpha: 0, duration: 1.2 }, 94.2)
    .to(cam, camTo(CAMS.full, 2.6), 95.4)
    .to('#dims', { autoAlpha: 1, duration: 1.2 }, 96.8)
    /* the closing beat: the compliance stamp thunks down */
    .fromTo('#stamp',
      { autoAlpha: 0, scale: 1.6, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power3.out' }, 97.9)
    .to('#panel-7', { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power2.out' }, 96.5);
}
