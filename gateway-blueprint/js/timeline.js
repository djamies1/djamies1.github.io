/* ============================================================
   timeline.js — one master timeline, one ScrollTrigger.
   Camera = transform of #world (sheet chrome never zooms).
   Timeline duration is 100 units; scene labels sit at the
   fractions defined in data.js SCENES.

   Tracking-scene geometry: the dish (#dish-tilt), the feeder
   beam (#beam) and the satellite carriers (#car-a/#car-b) are
   all leaf groups with static bboxes that rotate about the SAME
   pivot (svgOrigin '800 505' — the elevation trunnion; the pass
   arc is a circle about that pivot). One angle drives them all,
   so dish, beam and satellite stay visually locked.
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

/* the shared elevation-trunnion pivot (dish, beam, sat carriers) */
const PIVOT = '800 505';
const rot = (deg, duration, ease = 'power2.inOut') =>
  ({ rotation: deg, svgOrigin: PIVOT, duration, ease });

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
};

/* ---------- scroll-mode auto-play (tweens the scroll position;
   any real user input hands control back) ---------- */
const AUTOSCROLL_SECS = 104;
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
   annotations, so scenes recenter on the site axis at looser zooms. */
export const MOBILE_MQ = '(max-width: 900px) and (orientation: portrait)';
const CAM_MOBILE = {
  full:     { px: 800, py: 500, z: 1.0 },
  antenna:  { px: 800, py: 470, z: 1.5 },
  tracking: { px: 800, py: 400, z: 1.2 },
  rf:       { px: 800, py: 330, z: 1.5 },
  rfB:      { px: 800, py: 640, z: 1.3 },
  shelter:  { px: 800, py: 745, z: 1.9 },
  backhaul: { px: 790, py: 880, z: 2.0 },
  network:  { px: 800, py: 505, z: 1.0 },
  exploded: { px: 800, py: 540, z: 0.8 },
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
     '#orbit', '#car-a', '#beam', '#site .dash-hid', '#site .dash-ext', '#site text'],
    { autoAlpha: 0 }
  );
  /* dim lines carry arrow markers, which paint even when the stroke is
     dash-hidden — so they hide via opacity as well */
  gsap.set(['#dims text', '#dims .dash-ext', '#dims .dr', '#titleblock text', '#notes text'], { autoAlpha: 0 });
  /* sat B waits low in the west until the tracking scene */
  gsap.set('#car-b', rot(-50, 0));
  gsap.set('#ho-note', { autoAlpha: 0 });
  gsap.set('.panel', { autoAlpha: 0, y: 24 });
  applyCam();

  /* Build the whole timeline PAUSED with no ScrollTrigger. The draw-on intro and
     the pan into the first component live at t < START; seeking past them builds
     the finished, zoomed-in sheet, but neither mode dwells there — both land at
     START and treat [START,end] as the visible run. */
  const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true });
  tlRef = tl;

  sceneDraw(tl);
  sceneAntenna(tl);
  sceneTracking(tl);
  sceneRf(tl);
  sceneShelter(tl);
  sceneBackhaul(tl);
  sceneNetwork(tl);
  sceneExploded(tl);
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
    const cfg = window.GGT_BP_CONFIG || {};
    const head = { t: START };
    const scrub = gsap.to(head, {
      t: tl.duration(), ease: 'none', paused: true,
      onUpdate: () => { tl.time(head.t); onProgress && onProgress(toVisible(head.t)); },
    });
    st = ScrollTrigger.create({
      animation: scrub,
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
    gsap.set('#' + id, { x: v.x, y: v.y, rotation: v.rotation, svgOrigin: '800 486' });
  gsap.set(['#x-labels g', '#sh-cut', '#sh-frame'], { autoAlpha: 1 });
  gsap.set('#clip-sh-r', { attr: { x: 300, width: 900, height: 92 } });
  /* the beam and satellites read wrong once the dish is exploded */
  gsap.set(['#beam', '#car-a', '#car-b', '#orbit'], { autoAlpha: 0 });
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
    /* the site assembles from the ground up (DOM order reversed):
       backhaul strip → shelter → TT&C → grade → pedestal → dish */
    .to('#site .ln-hi.dr',
      { strokeDashoffset: 0, duration: 3.6, stagger: { each: 0.22, from: 'end' } }, 3.4)
    .to('#site .ln-mid.dr, #site .ln-low.dr, #site .ln-dim.dr',
      { strokeDashoffset: 0, duration: 2.6, stagger: 0.04 }, 5.6)
    /* dashed conventions sketch in: radome phantom, hidden racks, riser */
    .to(['#site .dash-ext', '#site .dash-hid'], { autoAlpha: 1, duration: 0.9 }, 8.2)
    /* the sky: pass arc, the satellite overhead, the feeder link */
    .to('#orbit', { autoAlpha: 1, duration: 1.0 }, 9.0)
    .to('#car-a', { autoAlpha: 1, duration: 0.8 }, 9.4)
    .to('#beam', { autoAlpha: 1, duration: 0.9 }, 9.8)
    .to('#site text', { autoAlpha: 1, duration: 0.9, stagger: 0.06 }, 10.0)
    .to('#dims .dash-ext', { autoAlpha: 1, duration: 0.9 }, 9.4)
    .to('#dims .dr', { autoAlpha: 1, duration: 0.2 }, 9.55)
    .to('#dims .dr', { strokeDashoffset: 0, duration: 1.7, stagger: 0.3 }, 9.6)
    .to('#dims text', { autoAlpha: 1, duration: 0.9, stagger: 0.12 }, 10.8);
  /* panel-0 (overview card) intentionally never fades in — the widget lands on
     the first component (scene 1), so the overview intro card is dropped. */
}

/* ---------- scene 1 · 14–26 · the antenna: dish, radome, DETAIL A ---------- */
function sceneAntenna(tl) {
  tl.addLabel('antenna', 14)
    .to('#panel-0', { autoAlpha: 0, y: -18, duration: 0.8 }, 14)
    .to('#dims', { autoAlpha: 0, duration: 1.0 }, 14.2)
    .to(cam, camTo(CAMS.antenna, 3.0), 14.2)
    .to('#dish-tilt .ln-hi', { stroke: '#7ce9ff', duration: 1.2 }, 16.6)
    /* the radome phantom breathes into view */
    .to('#radome path', { stroke: '#7ce9ff', duration: 1.4 }, 17.6)
    .to('#da-mark', { autoAlpha: 1, duration: 0.7 }, 18.2)
    .to('#detail-a', { autoAlpha: 1, duration: 0.9 }, 18.9)
    .to('#lead-antenna', { autoAlpha: 1, duration: 0.5 }, 20.4)
    .fromTo('#lead-antenna path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1, stagger: 0.28 }, 20.5)
    .to('#panel-1', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 19.5)
    .to('#radome path', { stroke: 'rgba(233,242,255,0.30)', duration: 1.0 }, 24.6);
}

/* ---------- scene 2 · 26–38 · tracking hero: follow the pass, hand over ---------- */
function sceneTracking(tl) {
  tl.addLabel('tracking', 26)
    .to('#panel-1', { autoAlpha: 0, y: -18, duration: 0.8 }, 26)
    .to('#lead-antenna', { autoAlpha: 0, duration: 0.5 }, 26)
    /* the detail mark rings the feed, which is about to move — clear it */
    .to(['#da-mark', '#detail-a'], { autoAlpha: 0, duration: 0.7 }, 26)
    .to(cam, camTo(CAMS.tracking, 3.0), 26.2)
    .to('#car-b', { autoAlpha: 0.9, duration: 0.8 }, 28.0)
    .to('#lead-tracking', { autoAlpha: 1, duration: 0.5 }, 30.0)
    .fromTo('#lead-tracking path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1, stagger: 0.3 }, 30.1)
    /* SAT A drifts east; the dish and beam stay locked on it (same pivot) */
    .to('#car-a', { rotation: 34, svgOrigin: PIVOT, duration: 4.8, ease: 'none' }, 28.2)
    .to('#dish-tilt', { rotation: 34, svgOrigin: PIVOT, duration: 4.8, ease: 'none' }, 28.2)
    .to('#beam', { rotation: 34, svgOrigin: PIVOT, duration: 4.8, ease: 'none' }, 28.2)
    /* SAT B rises from the west */
    .to('#car-b', { rotation: -24, svgOrigin: PIVOT, duration: 4.0, ease: 'none' }, 29.0)
    /* HANDOVER: fast slew back to the riser; the beam blinks across */
    .to('#ho-note', { autoAlpha: 1, duration: 0.5 }, 33.2)
    .to('#beam', { autoAlpha: 0.15, duration: 0.25 }, 33.2)
    .to('#dish-tilt', rot(-24, 1.6), 33.3)
    .to('#beam', rot(-24, 1.6), 33.3)
    .to('#beam', { autoAlpha: 1, duration: 0.4 }, 34.7)
    .to('#panel-2', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 30.0)
    /* tracking resumes on the new satellite; the old one sets */
    .to('#car-b', { rotation: -12, svgOrigin: PIVOT, duration: 2.6, ease: 'none' }, 34.9)
    .to('#dish-tilt', { rotation: -12, svgOrigin: PIVOT, duration: 2.6, ease: 'none' }, 34.9)
    .to('#beam', { rotation: -12, svgOrigin: PIVOT, duration: 2.6, ease: 'none' }, 34.9)
    .to('#car-a', { rotation: 44, svgOrigin: PIVOT, duration: 2.6, ease: 'none' }, 34.9)
    .to('#car-a', { autoAlpha: 0.25, duration: 1.2 }, 35.5)
    .to('#ho-note', { autoAlpha: 0, duration: 0.7 }, 36.6);
}

/* ---------- scene 3 · 38–49 · the feeder link: bands, AES, rain ---------- */
function sceneRf(tl) {
  tl.addLabel('rf', 38)
    .to('#panel-2', { autoAlpha: 0, y: -18, duration: 0.8 }, 38)
    .to('#lead-tracking', { autoAlpha: 0, duration: 0.5 }, 38)
    /* the fresh satellite reaches zenith; everything re-verticalizes */
    .to('#car-b', rot(0, 1.8), 38.2)
    .to('#dish-tilt', rot(0, 1.8), 38.2)
    .to('#beam', rot(0, 1.8), 38.2)
    .to('#car-a', { autoAlpha: 0, duration: 0.8 }, 38.2)
    .to('#dish-tilt .ln-hi', { stroke: 'rgba(233,242,255,0.92)', duration: 0.8 }, 38.2)
    .to(cam, camTo(CAMS.rf, 2.6), 38.4)
    .to('#lead-rf', { autoAlpha: 1, duration: 0.5 }, 41.0)
    .fromTo('#lead-rf path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1, stagger: 0.3 }, 41.1)
    /* a rain cell drifts across the beam; the link takes a fade hit */
    .fromTo('#rain', { autoAlpha: 0, y: -14 }, { autoAlpha: 0.85, y: 0, duration: 1.2 }, 42.4)
    .to('#beam', { autoAlpha: 0.35, duration: 0.35 }, 43.6)
    .to('#beam', { autoAlpha: 1, duration: 0.9 }, 44.2)
    /* pan down: the network answers with site diversity */
    .to(cam, camTo(CAMS.rfB, 2.2), 44.6)
    .to('#rain', { autoAlpha: 0, duration: 1.0 }, 46.0)
    .to('#site-b', { autoAlpha: 1, duration: 0.9 }, 45.8)
    .to('#panel-3', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 42.0);
}

/* ---------- scene 4 · 49–60 · the shelter opens: Prometheus ---------- */
function sceneShelter(tl) {
  tl.addLabel('shelter', 49)
    .to('#panel-3', { autoAlpha: 0, y: -18, duration: 0.8 }, 49)
    .to('#lead-rf', { autoAlpha: 0, duration: 0.5 }, 49)
    .to(['#site-b', '#orbit', '#car-a', '#car-b', '#beam'], { autoAlpha: 0, duration: 1.0 }, 49)
    .to(cam, camTo(CAMS.shelter, 3.0), 49.2)
    /* section cutaway: the wall opens via clip rect; ghosts give way to racks */
    .to('#sh-frame', { autoAlpha: 1, duration: 0.6 }, 51.4)
    .to('#sh-cut', { autoAlpha: 1, duration: 0.4 }, 51.7)
    .fromTo('#clip-sh-r', { attr: { height: 0 } }, { attr: { height: 92 }, duration: 2.0 }, 51.8)
    .to('#sh-hid', { autoAlpha: 0, duration: 1.5 }, 51.8)
    .to('#lead-shelter', { autoAlpha: 1, duration: 0.5 }, 54.6)
    .fromTo('#lead-shelter path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1, stagger: 0.3 }, 54.7)
    .to('#panel-4', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 53.5);
}

/* ---------- scene 5 · 60–71 · backhaul: gateway → PoP → fiber → AWS ---------- */
function sceneBackhaul(tl) {
  tl.addLabel('backhaul', 60)
    .to('#panel-4', { autoAlpha: 0, y: -18, duration: 0.8 }, 60)
    .to('#lead-shelter', { autoAlpha: 0, duration: 0.5 }, 60)
    .to(cam, camTo(CAMS.backhaul, 2.8), 60.2)
    .to('#asm-net rect.ln-hi', { stroke: '#7ce9ff', duration: 0.8, stagger: 0.35 }, 62.6)
    /* traffic flows: dash pattern slides along the fiber (dashoffset only) */
    .to('#fiber-flow', { autoAlpha: 0.95, duration: 0.7 }, 63.4)
    .to('#fiber-flow', { strokeDashoffset: -8.6, duration: 6.5 }, 63.4)
    .to('#lead-backhaul', { autoAlpha: 1, duration: 0.5 }, 65.0)
    .fromTo('#lead-backhaul path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1 }, 65.1)
    .to('#panel-5', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 64.5);
}

/* ---------- scene 6 · 71–82 · the fleet: TT&C, 300+ sites, DETAIL B ---------- */
function sceneNetwork(tl) {
  tl.addLabel('network', 71)
    .to('#panel-5', { autoAlpha: 0, y: -18, duration: 0.8 }, 71)
    .to('#lead-backhaul', { autoAlpha: 0, duration: 0.5 }, 71)
    .to('#fiber-flow', { autoAlpha: 0, duration: 0.8 }, 71)
    .to('#asm-net rect.ln-hi', { stroke: 'rgba(233,242,255,0.92)', duration: 0.8 }, 71)
    .to(cam, camTo(CAMS.network, 3.2), 71.2)
    .to('#asm-ttc .ln-hi', { stroke: '#7ce9ff', duration: 1.0 }, 73.6)
    .to('#db-mark', { autoAlpha: 1, duration: 0.7 }, 74.2)
    .to('#detail-b', { autoAlpha: 1, duration: 0.9 }, 74.9)
    .to('#lead-network', { autoAlpha: 1, duration: 0.5 }, 76.2)
    .fromTo('#lead-network path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1 }, 76.3)
    .to('#panel-6', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 75.5);
}

/* ---------- scene 7 · 82–100 · full explode → labels → reassemble → stamp ---------- */
function sceneExploded(tl) {
  const G = EXPLODE.groups;
  const P = EXPLODE.parts;
  const ORIGIN = '800 486';   // radome bbox center — its explode includes a tilt
  tl.addLabel('exploded', 82)
    .to('#panel-6', { autoAlpha: 0, y: -18, duration: 0.8 }, 82)
    .to('#lead-network', { autoAlpha: 0, duration: 0.5 }, 82)
    .to(['#db-mark', '#detail-b'], { autoAlpha: 0, duration: 0.9 }, 82)
    .to('#asm-ttc .ln-hi', { stroke: 'rgba(233,242,255,0.92)', duration: 0.8 }, 82)
    .to('#sh-caption', { autoAlpha: 0, duration: 0.6 }, 82.6)
    /* the racks must be free of the wall clip before they slide out */
    .set('#clip-sh-r', { attr: { x: 300, width: 900 } }, 83.2)
    /* pull back while the site comes apart */
    .to(cam, camTo(CAMS.exploded, 4.2), 83.4)
    .to('#asm-dishmount', { y: G['asm-dishmount'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#radome', { ...P['radome'], svgOrigin: ORIGIN, duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#rack-row', { ...P['rack-row'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#sh-roof', { ...P['sh-roof'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#ttc-dish', { ...P['ttc-dish'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    /* the money shot: eight leader labels sweep in */
    .to('#x-labels g', { autoAlpha: 1, duration: 0.6, stagger: 0.26 }, 87.6)
    .fromTo('#x-labels path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.0, stagger: 0.26 }, 87.7)
    /* reassembly */
    .to('#x-labels g', { autoAlpha: 0, duration: 0.8 }, 92.6)
    .to('#asm-dishmount', { y: 0, duration: 3.2, ease: 'power2.inOut' }, 93.4)
    .to('#radome', { x: 0, y: 0, rotation: 0, svgOrigin: ORIGIN, duration: 3.2, ease: 'power2.inOut' }, 93.4)
    .to(['#rack-row', '#sh-roof', '#ttc-dish'],
      { x: 0, y: 0, rotation: 0, duration: 3.2, ease: 'power2.inOut' }, 93.4)
    .to(['#sh-cut', '#sh-frame', '#sh-clip-w'], { autoAlpha: 0, duration: 1.2 }, 94.2)
    .to(cam, camTo(CAMS.full, 2.6), 95.4)
    .to('#dims', { autoAlpha: 1, duration: 1.2 }, 96.8)
    .to('#sh-caption', { autoAlpha: 1, duration: 1.0 }, 96.8)
    /* the closing beat: the compliance stamp thunks down */
    .fromTo('#stamp',
      { autoAlpha: 0, scale: 1.6, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power3.out' }, 97.9)
    .to('#panel-7', { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power2.out' }, 96.5);
}
