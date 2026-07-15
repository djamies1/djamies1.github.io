/* ============================================================
   timeline.js — one master timeline, one ScrollTrigger.
   Camera = transform of #world (sheet chrome never zooms).
   Timeline duration is 100 units; scene labels sit at the
   fractions defined in data.js SCENES.

   Beam-steering geometry (the hero): the flat panel NEVER moves.
   The user-link beam (#beam), the emerging wavefront (#wavefront)
   and the satellite carriers (#car-a/#car-b) are leaf groups that
   rotate about the SAME array phase-centre pivot (svgOrigin
   '800 415'; the pass arc is a circle about that pivot), so the
   beam stays pointed at the satellite. The per-element phase strip
   tilts in place about its own centre. One steer drives them all —
   and the handover re-steers electronically, with nothing
   mechanical to slew.
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

/* the shared array phase-centre pivot (beam, wavefront, sat carriers) */
const PIVOT = '800 415';
const rot = (deg, duration, ease = 'power2.inOut') =>
  ({ rotation: deg, svgOrigin: PIVOT, duration, ease });
/* the phase strip tilts in place about its own centre */
const tilt = (deg, duration, ease = 'power2.inOut') =>
  ({ rotation: deg, svgOrigin: '800 466', duration, ease });

let st = null;
let tlRef = null;
let MODE = 'scroll';
let OPTS = { autoplay: false, loop: false, speed: 2 };
let started = false;           // player: first Play restarts from 0 (poster frame pre-seeks)
const POSTER = 0.138;          // fully drawn terminal + overview panel, the paused-widget first frame

export function scrollToScene(i) {
  if (!st) return;
  const t0 = SCENES[i].t[0];
  const y = st.start + (st.end - st.start) * (Math.min(t0 + 1.2, 99) / 100);
  window.scrollTo({ top: y, behavior: 'smooth' });
}

/* ---------- player-mode transport (drives the timeline with time) ---------- */
export const playerApi = {
  isPlaying: () => !!tlRef && !tlRef.paused(),
  toggle() {
    if (!tlRef) return false;
    if (tlRef.paused()) {
      if (!started) { started = true; tlRef.play(0); }
      else tlRef.play();
      return true;
    }
    tlRef.pause();
    return false;
  },
  restart() {
    if (!tlRef) return;
    started = true;
    tlRef.play(0);
  },
  goto(i) {
    if (!tlRef) return;
    started = true;
    const [t0, t1] = SCENES[i].t;
    tlRef.seek((t0 + t1) / 2, false);
  },
  step(dir, current) {
    this.goto(Math.max(0, Math.min(SCENES.length - 1, current + dir)));
  },
};

/* ---------- scroll-mode auto-play (tweens the scroll position;
   any real user input hands control back) ---------- */
const AUTOSCROLL_SECS = 52;
const INPUT_EVENTS = ['wheel', 'touchstart', 'keydown', 'mousedown'];
let scrollTween = null;
let autoStopCb = null;
function cancelOnInput(e) {
  if (e.target && e.target.closest && e.target.closest('.controls, .cover-play, .rail')) return;
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

/* Portrait phones crop the sheet (slice) and can't afford margin
   annotations, so scenes recenter on the terminal axis at looser zooms. */
export const MOBILE_MQ = '(max-width: 900px) and (orientation: portrait)';
const CAM_MOBILE = {
  full:     { px: 800, py: 500, z: 1.0 },
  array:    { px: 800, py: 418, z: 1.5 },
  steer:    { px: 800, py: 332, z: 1.15 },
  link:     { px: 800, py: 300, z: 1.4 },
  indoor:   { px: 800, py: 735, z: 1.85 },
  models:   { px: 800, py: 432, z: 1.4 },   // mobile hides DETAIL B; panel carries the models
  network:  { px: 800, py: 500, z: 1.0 },
  exploded: { px: 800, py: 500, z: 0.82 },
};
let CAMS = CAM;

export function initTimeline({ onProgress, mode = 'scroll', autoplay = false, loop = false, speed = 2 } = {}) {
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
     '#orbit', '#car-a', '#beam', '#terminal .dash-hid', '#terminal .dash-ext', '#terminal text'],
    { autoAlpha: 0 }
  );
  /* dim lines carry arrow markers, which paint even when the stroke is
     dash-hidden — so they hide via opacity as well */
  gsap.set(['#dims text', '#dims .dash-ext', '#dims .dr', '#titleblock text', '#notes text'], { autoAlpha: 0 });
  /* the element markers ride onto the board only when we zoom into it */
  gsap.set('#array-elements', { autoAlpha: 0 });
  /* sat B waits low in the west until the steer scene */
  gsap.set('#car-b', rot(-50, 0));
  gsap.set('#ho-note', { autoAlpha: 0 });
  gsap.set('.panel', { autoAlpha: 0, y: 24 });
  applyCam();

  let tl;
  if (MODE === 'player') {
    /* time-driven: no pin, no scrub — the transport controls own the playhead */
    tl = gsap.timeline({
      defaults: { ease: 'none' },
      paused: true,
      repeat: OPTS.loop ? -1 : 0,
      repeatDelay: 2.6,
      onUpdate: () => onProgress && onProgress(tl.progress() * 100),
    });
    tl.timeScale(OPTS.speed);
    st = null;
  } else {
    const cfg = window.UT_BP_CONFIG || {};
    tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '.stage',
        start: 'top top',
        end: () => '+=' + window.innerHeight * SCROLL_VH,
        pin: true,
        anticipatePin: 1,
        scrub: matchMedia('(hover: none)').matches ? 0.5 : 0.75,
        invalidateOnRefresh: true,
        onUpdate: (self) => onProgress && onProgress(self.progress * 100),
        ...cfg,
      },
    });
    st = tl.scrollTrigger;
  }
  tlRef = tl;

  sceneDraw(tl);
  sceneArray(tl);
  sceneSteer(tl);
  sceneLink(tl);
  sceneIndoor(tl);
  sceneModels(tl);
  sceneNetwork(tl);
  sceneExploded(tl);
  tl.to({}, { duration: 0.5 }, 99.5);   // hard end at 100

  if (MODE === 'player') {
    started = false;
    if (OPTS.autoplay) { started = true; tl.play(0); }
    else tl.progress(POSTER).pause();   // poster frame: drawn terminal + overview panel
  }

  /* matchMedia reverts gsap state, but the camera writes a raw attribute —
     reset it by hand when this context tears down */
  return () => {
    st = null;
    tlRef = null;
    started = false;
    Object.assign(cam, { px: 800, py: 500, z: 1 });
    applyCam();
  };
}

/* Reduced motion: no pin, no scrub — render the exploded poster once. */
export function buildStaticPoster() {
  worldEl = document.getElementById('world');
  const P = matchMedia(MOBILE_MQ).matches ? CAM_MOBILE : CAM;
  for (const [id, y] of Object.entries(EXPLODE.groups)) if (y) gsap.set('#' + id, { y });
  for (const [id, v] of Object.entries(EXPLODE.parts))
    gsap.set('#' + id, { x: v.x, y: v.y, rotation: v.rotation, svgOrigin: '800 428' });
  gsap.set(['#x-labels g', '#in-cut', '#in-frame'], { autoAlpha: 1 });
  gsap.set('#clip-in-r', { attr: { x: 600, width: 900, height: 74 } });
  gsap.set('#in-hid', { autoAlpha: 0 });
  /* the sky and the steer diagrams read wrong once the panel is exploded */
  gsap.set(['#beam', '#car-a', '#car-b', '#orbit', '#wavefront', '#phase-strip', '#array-face'], { autoAlpha: 0 });
  setCam(P.exploded);
}

/* ---------- scene 0 · 0–14 · the sheet draws itself, ground up ---------- */
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
    /* the terminal assembles from the ground up (DOM order reversed):
       network strip → indoor unit → roofline → mount → panel */
    .to('#terminal .ln-hi.dr',
      { strokeDashoffset: 0, duration: 3.6, stagger: { each: 0.2, from: 'end' } }, 3.4)
    .to('#terminal .ln-mid.dr, #terminal .ln-low.dr, #terminal .ln-dim.dr, #terminal .ln-acc.dr',
      { strokeDashoffset: 0, duration: 2.6, stagger: 0.04 }, 5.6)
    /* dashed conventions sketch in: cover phantom, hidden internals, cable */
    .to(['#terminal .dash-ext', '#terminal .dash-hid'], { autoAlpha: 1, duration: 0.9 }, 8.2)
    /* the sky: pass arc, the satellite overhead, the user-link beam */
    .to('#orbit', { autoAlpha: 1, duration: 1.0 }, 9.0)
    .to('#car-a', { autoAlpha: 1, duration: 0.8 }, 9.4)
    .to('#beam', { autoAlpha: 1, duration: 0.9 }, 9.8)
    .to('#terminal text', { autoAlpha: 1, duration: 0.9, stagger: 0.05 }, 10.0)
    .to('#dims .dash-ext', { autoAlpha: 1, duration: 0.9 }, 9.4)
    .to('#dims .dr', { autoAlpha: 1, duration: 0.2 }, 9.55)
    .to('#dims .dr', { strokeDashoffset: 0, duration: 1.7, stagger: 0.3 }, 9.6)
    .to('#dims text', { autoAlpha: 1, duration: 0.9, stagger: 0.12 }, 10.8)
    .to('#panel-0', { autoAlpha: 1, y: 0, duration: 1.4, ease: 'power2.out' }, 12.0);
}

/* ---------- scene 1 · 14–26 · the phased array: elements, one aperture ---------- */
function sceneArray(tl) {
  tl.addLabel('array', 14)
    .to('#panel-0', { autoAlpha: 0, y: -18, duration: 0.8 }, 14)
    .to('#dims', { autoAlpha: 0, duration: 1.0 }, 14.2)
    .to(cam, camTo(CAMS.array, 3.0), 14.2)
    /* the element markers ride onto the board; the board edge lights up */
    .to('#array-elements', { autoAlpha: 1, duration: 1.0 }, 16.4)
    .to('#array-pcb .ln-hi', { stroke: '#7ce9ff', duration: 1.2 }, 16.6)
    /* the plan-view lattice inset breathes in (with its representative caption) */
    .to('#array-face', { autoAlpha: 1, duration: 1.1 }, 17.4)
    .to('#da-mark', { autoAlpha: 1, duration: 0.7 }, 18.2)
    .to('#detail-a', { autoAlpha: 1, duration: 0.9 }, 18.9)
    .to('#lead-array', { autoAlpha: 1, duration: 0.5 }, 20.4)
    .fromTo('#lead-array path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1, stagger: 0.28 }, 20.5)
    .to('#panel-1', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 21.8)
    .to('#array-pcb .ln-hi', { stroke: 'rgba(233,242,255,0.92)', duration: 1.0 }, 24.6);
}

/* ---------- scene 2 · 26–38 · steer the beam, hand over (no moving parts) ---------- */
function sceneSteer(tl) {
  tl.addLabel('steer', 26)
    .to('#panel-1', { autoAlpha: 0, y: -18, duration: 0.8 }, 26)
    .to('#lead-array', { autoAlpha: 0, duration: 0.5 }, 26)
    /* the detail mark rings the aperture, whose beam is about to move — clear it */
    .to(['#da-mark', '#detail-a'], { autoAlpha: 0, duration: 0.7 }, 26)
    .to(cam, camTo(CAMS.steer, 3.0), 26.2)
    /* the wavefront + phase strip appear — the mechanism of the steer */
    .to('#wavefront', { autoAlpha: 1, duration: 0.8 }, 27.4)
    .to('#phase-strip', { autoAlpha: 1, duration: 0.8 }, 27.6)
    .to('#car-b', { autoAlpha: 0.9, duration: 0.8 }, 28.0)
    .to('#lead-steer', { autoAlpha: 1, duration: 0.5 }, 30.0)
    .fromTo('#lead-steer path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1, stagger: 0.3 }, 30.1)
    /* SAT A drifts east; the beam + wavefront steer to stay on it (same pivot),
       and the phase gradient tilts to match — the PANEL never moves */
    .to('#car-a', { rotation: 30, svgOrigin: PIVOT, duration: 4.8, ease: 'none' }, 28.2)
    .to('#beam', { rotation: 30, svgOrigin: PIVOT, duration: 4.8, ease: 'none' }, 28.2)
    .to('#wavefront', { rotation: 30, svgOrigin: PIVOT, duration: 4.8, ease: 'none' }, 28.2)
    .to('#phase-strip', { rotation: 15, svgOrigin: '800 466', duration: 4.8, ease: 'none' }, 28.2)
    /* SAT B rises from the west */
    .to('#car-b', { rotation: -26, svgOrigin: PIVOT, duration: 4.0, ease: 'none' }, 29.0)
    /* HANDOVER: re-steer in a blink — fast, electronic, nothing mechanical to slew */
    .to('#ho-note', { autoAlpha: 1, duration: 0.5 }, 33.2)
    .to('#beam', { autoAlpha: 0.15, duration: 0.2 }, 33.2)
    .to('#beam', rot(-20, 0.6), 33.3)
    .to('#wavefront', rot(-20, 0.6), 33.3)
    .to('#phase-strip', tilt(-10, 0.6), 33.3)
    .to('#beam', { autoAlpha: 1, duration: 0.4 }, 34.0)
    .to('#panel-2', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 34.6)
    /* tracking resumes on the new satellite; the old one sets */
    .to('#car-b', { rotation: -12, svgOrigin: PIVOT, duration: 2.6, ease: 'none' }, 34.9)
    .to('#beam', { rotation: -12, svgOrigin: PIVOT, duration: 2.6, ease: 'none' }, 34.9)
    .to('#wavefront', { rotation: -12, svgOrigin: PIVOT, duration: 2.6, ease: 'none' }, 34.9)
    .to('#phase-strip', { rotation: -6, svgOrigin: '800 466', duration: 2.6, ease: 'none' }, 34.9)
    .to('#car-a', { rotation: 40, svgOrigin: PIVOT, duration: 2.6, ease: 'none' }, 34.9)
    .to('#car-a', { autoAlpha: 0.25, duration: 1.2 }, 35.5)
    .to('#ho-note', { autoAlpha: 0, duration: 0.7 }, 36.6);
}

/* ---------- scene 3 · 38–49 · the user link: bands, AES, weather ---------- */
function sceneLink(tl) {
  tl.addLabel('link', 38)
    .to('#panel-2', { autoAlpha: 0, y: -18, duration: 0.8 }, 38)
    .to('#lead-steer', { autoAlpha: 0, duration: 0.5 }, 38)
    /* the fresh satellite reaches zenith; the beam re-verticalizes */
    .to('#car-b', rot(0, 1.8), 38.2)
    .to('#beam', rot(0, 1.8), 38.2)
    .to('#wavefront', rot(0, 1.8), 38.2)
    .to('#phase-strip', tilt(0, 1.8), 38.2)
    .to('#car-a', { autoAlpha: 0, duration: 0.8 }, 38.2)
    /* the steer diagrams have made their point — retire them for the link close-up */
    .to(['#wavefront', '#phase-strip', '#array-face'], { autoAlpha: 0, duration: 1.0 }, 39.6)
    .to(cam, camTo(CAMS.link, 2.6), 38.6)
    .to('#lead-link', { autoAlpha: 1, duration: 0.5 }, 41.0)
    .fromTo('#lead-link path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1, stagger: 0.3 }, 41.1)
    /* an obstruction cell drifts across the beam; the link fades then adapts */
    .fromTo('#obstruction', { autoAlpha: 0, y: -14 }, { autoAlpha: 0.85, y: 0, duration: 1.2 }, 42.4)
    .to('#beam', { autoAlpha: 0.4, duration: 0.35 }, 43.6)
    .to('#beam', { autoAlpha: 1, duration: 0.9 }, 44.4)
    .to('#obstruction', { autoAlpha: 0, duration: 1.0 }, 46.0)
    .to('#panel-3', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 46.6);
}

/* ---------- scene 4 · 49–60 · into the home: the indoor unit opens ---------- */
function sceneIndoor(tl) {
  tl.addLabel('indoor', 49)
    .to('#panel-3', { autoAlpha: 0, y: -18, duration: 0.8 }, 49)
    .to('#lead-link', { autoAlpha: 0, duration: 0.5 }, 49)
    .to(['#orbit', '#car-a', '#car-b', '#beam'], { autoAlpha: 0, duration: 1.0 }, 49)
    .to(cam, camTo(CAMS.indoor, 3.0), 49.2)
    /* section cutaway: the chassis opens via clip rect; ghosts give way to the board */
    .to('#in-frame', { autoAlpha: 1, duration: 0.6 }, 51.4)
    .to('#in-cut', { autoAlpha: 1, duration: 0.4 }, 51.7)
    .fromTo('#clip-in-r', { attr: { height: 0 } }, { attr: { height: 74 }, duration: 2.0 }, 51.8)
    .to('#in-hid', { autoAlpha: 0, duration: 1.5 }, 51.8)
    .to('#lead-indoor', { autoAlpha: 1, duration: 0.5 }, 54.6)
    .fromTo('#lead-indoor path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1, stagger: 0.3 }, 54.7)
    .to('#panel-4', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 55.8);
}

/* ---------- scene 5 · 60–71 · three terminals: DETAIL B ---------- */
function sceneModels(tl) {
  tl.addLabel('models', 60)
    .to('#panel-4', { autoAlpha: 0, y: -18, duration: 0.8 }, 60)
    .to('#lead-indoor', { autoAlpha: 0, duration: 0.5 }, 60)
    /* the panned camera would throw the indoor caption onto the title block */
    .to('#in-caption', { autoAlpha: 0, duration: 0.6 }, 60)
    .to(cam, camTo(CAMS.models, 3.0), 60.2)
    .to('#db-mark', { autoAlpha: 1, duration: 0.7 }, 62.6)
    .to('#detail-b', { autoAlpha: 1, duration: 0.9 }, 63.3)
    .fromTo('#detail-b rect',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.2, stagger: 0.5 }, 63.6)
    .to('#panel-5', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 66.4);
}

/* ---------- scene 6 · 71–82 · end to end: terminal → sat → gateway → cloud ---------- */
function sceneNetwork(tl) {
  tl.addLabel('network', 71)
    .to('#panel-5', { autoAlpha: 0, y: -18, duration: 0.8 }, 71)
    .to(['#db-mark', '#detail-b'], { autoAlpha: 0, duration: 0.9 }, 71)
    .to(cam, camTo(CAMS.network, 3.2), 71.2)
    .to('#asm-net rect.ln-hi', { stroke: '#7ce9ff', duration: 0.8, stagger: 0.25 }, 73.4)
    /* traffic flows: dash pattern slides along the path (dashoffset only) */
    .to('#fiber-flow', { autoAlpha: 0.95, duration: 0.7 }, 74.0)
    .to('#fiber-flow', { strokeDashoffset: -8.6, duration: 6.5 }, 74.0)
    .to('#lead-network', { autoAlpha: 1, duration: 0.5 }, 75.6)
    .fromTo('#lead-network path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1 }, 75.7)
    .to('#panel-6', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 78.2);
}

/* ---------- scene 7 · 82–100 · full explode → labels → reassemble → stamp ---------- */
function sceneExploded(tl) {
  const G = EXPLODE.groups;
  const P = EXPLODE.parts;
  const ORIGIN = '800 428';   // panel bbox centre
  tl.addLabel('exploded', 82)
    .to('#panel-6', { autoAlpha: 0, y: -18, duration: 0.8 }, 82)
    .to('#lead-network', { autoAlpha: 0, duration: 0.5 }, 82)
    .to('#fiber-flow', { autoAlpha: 0, duration: 0.6 }, 82)
    .to('#asm-net rect.ln-hi', { stroke: 'rgba(233,242,255,0.92)', duration: 0.8 }, 82)
    .to('#in-caption', { autoAlpha: 0, duration: 0.6 }, 82.6)
    /* the indoor board must be free of the wall clip before it slides out */
    .set('#clip-in-r', { attr: { x: 600, width: 900 } }, 83.2)
    /* pull back while the terminal comes apart */
    .to(cam, camTo(CAMS.exploded, 4.2), 83.4)
    .to('#asm-panel', { y: G['asm-panel'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#asm-mount', { y: G['asm-mount'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#cover', { ...P['cover'], svgOrigin: ORIGIN, duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#array-pcb', { ...P['array-pcb'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#prom-board', { ...P['prom-board'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#thermal', { ...P['thermal'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#baseplate', { ...P['baseplate'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#router-row', { ...P['router-row'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    /* the money shot: seven leader labels sweep in */
    .to('#x-labels g', { autoAlpha: 1, duration: 0.6, stagger: 0.26 }, 87.6)
    .fromTo('#x-labels path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.0, stagger: 0.26 }, 87.7)
    /* reassembly */
    .to('#x-labels g', { autoAlpha: 0, duration: 0.8 }, 92.6)
    .to(['#asm-panel', '#asm-mount'], { y: 0, duration: 3.2, ease: 'power2.inOut' }, 93.4)
    .to(['#cover', '#array-pcb', '#prom-board', '#thermal', '#baseplate', '#router-row'],
      { x: 0, y: 0, rotation: 0, duration: 3.2, ease: 'power2.inOut' }, 93.4)
    .to(['#in-cut', '#in-frame', '#in-clip-w'], { autoAlpha: 0, duration: 1.2 }, 94.2)
    .to(cam, camTo(CAMS.full, 2.6), 95.4)
    .to('#dims', { autoAlpha: 1, duration: 1.2 }, 96.8)
    .to('#in-caption', { autoAlpha: 1, duration: 1.0 }, 96.8)
    /* the closing beat: the compliance stamp thunks down */
    .fromTo('#stamp',
      { autoAlpha: 0, scale: 1.6, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power3.out' }, 97.9)
    .to('#panel-7', { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power2.out' }, 97.9);
}
