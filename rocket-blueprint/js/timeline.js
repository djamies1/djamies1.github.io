/* ============================================================
   timeline.js — one master timeline, one ScrollTrigger.
   Camera = transform of #world (sheet chrome never zooms).
   Timeline duration is 100 units; scene labels sit at the
   fractions defined in data.js SCENES.
   ============================================================ */

import { CAM, EXPLODE, STAGING_LIFT, SCENES, SCROLL_VH } from './data.js';

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
let OPTS = { autoplay: false, loop: false, speed: 1.25 };
let started = false;           // player: first Play restarts from 0 (poster frame pre-seeks)
const POSTER = 0.138;          // fully drawn overview + panel, the paused-widget first frame

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
const AUTOSCROLL_SECS = 80;
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
   annotations, so scenes recenter on the vehicle axis at looser zooms. */
export const MOBILE_MQ = '(max-width: 900px) and (orientation: portrait)';
const CAM_MOBILE = {
  full:       { px: 800, py: 500, z: 1.0 },
  fairing:    { px: 800, py: 185, z: 2.1 },
  payload:    { px: 800, py: 186, z: 2.4 },
  gs2:        { px: 800, py: 285, z: 1.9 },
  interstage: { px: 800, py: 452, z: 2.3 },
  gs1:        { px: 800, py: 655, z: 1.55 },
  engines:    { px: 800, py: 838, z: 1.9 },
  exploded:   { px: 800, py: 454, z: 0.8 },
};
let CAMS = CAM;

export function initTimeline({ onProgress, mode = 'scroll', autoplay = false, loop = false, speed = 1.25 } = {}) {
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
     '#be3u-dash', '#tiers g', '#tier-shelves'],
    { autoAlpha: 0 }
  );
  /* dim lines carry arrow markers, which paint even when the stroke is
     dash-hidden — so they hide via opacity as well */
  gsap.set(['#dims text', '#dims .dash-ext', '#dims .dr', '#titleblock text', '#notes text'], { autoAlpha: 0 });
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
    const cfg = window.ROCKET_BP_CONFIG || {};
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
  sceneFairing(tl);
  scenePayload(tl);
  sceneGs2(tl);
  sceneInterstage(tl);
  sceneGs1(tl);
  sceneEngines(tl);
  sceneExploded(tl);
  tl.to({}, { duration: 0.5 }, 99.5);   // hard end at 100

  if (MODE === 'player') {
    started = false;
    if (OPTS.autoplay) { started = true; tl.play(0); }
    else tl.progress(POSTER).pause();   // poster frame: drawn vehicle + overview panel
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
  for (const [id, y] of Object.entries(EXPLODE.groups)) gsap.set('#' + id, { y });
  gsap.set('#fairing-l', { ...EXPLODE.halves['fairing-l'], autoAlpha: 0.85 });
  gsap.set('#fairing-r', { ...EXPLODE.halves['fairing-r'], autoAlpha: 0.85 });
  gsap.set(['#x-labels g', '#gs2-cut', '#gs1-cut'], { autoAlpha: 1 });
  gsap.set('#be3u-dash', { autoAlpha: 0 });
  gsap.set('#be3u-solid', { autoAlpha: 1 });
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
    .to('#vehicle .ln-hi.dr',
      { strokeDashoffset: 0, duration: 3.6, stagger: { each: 0.18, from: 'end' } }, 3.4)
    .to('#vehicle .ln-mid.dr, #vehicle .ln-low.dr, #vehicle .ln-dim.dr',
      { strokeDashoffset: 0, duration: 2.6, stagger: 0.05 }, 5.6)
    .to('#be3u-dash', { autoAlpha: 1, duration: 0.9 }, 8.8)
    .to(['#tiers g', '#tier-shelves'], { autoAlpha: 0.4, duration: 1.0 }, 9.0)
    .to('#dims .dash-ext', { autoAlpha: 1, duration: 0.9 }, 9.4)
    .to('#dims .dr', { autoAlpha: 1, duration: 0.2 }, 9.55)
    .to('#dims .dr', { strokeDashoffset: 0, duration: 1.7, stagger: 0.3 }, 9.6)
    .to('#dims text', { autoAlpha: 1, duration: 0.9, stagger: 0.12 }, 10.8)
    .to('#panel-0', { autoAlpha: 1, y: 0, duration: 1.4, ease: 'power2.out' }, 10.6);
}

/* ---------- scene 1 · 14–26 · fairing hinges open ---------- */
function sceneFairing(tl) {
  tl.addLabel('fairing', 14)
    .to('#panel-0', { autoAlpha: 0, y: -18, duration: 0.8 }, 14)
    .to('#dims', { autoAlpha: 0, duration: 1.0 }, 14.2)
    .to(cam, camTo(CAMS.fairing, 3.2), 14.2)
    /* halves hinge outward about their base attach points */
    .to('#fairing-l', { rotation: -12, x: -18, y: -6, svgOrigin: '786 245', duration: 2.6, ease: 'power2.inOut' }, 17.0)
    .to('#fairing-r', { rotation: 12, x: 18, y: -6, svgOrigin: '814 245', duration: 2.6, ease: 'power2.inOut' }, 17.0)
    .to('#lead-fairing', { autoAlpha: 1, duration: 0.5 }, 19.4)
    .fromTo('#lead-fairing path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.2 }, 19.5)
    .to('#panel-1', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 18.5);
}

/* ---------- scene 2 · 26–40 · payload hero: the Leo stack lights up ---------- */
function scenePayload(tl) {
  tl.addLabel('payload', 26)
    .to('#panel-1', { autoAlpha: 0, y: -18, duration: 0.8 }, 26)
    .to('#lead-fairing', { autoAlpha: 0, duration: 0.5 }, 26)
    .to(cam, camTo(CAMS.payload, 3.0), 26.2)
    /* halves park wide and dim so the stack owns the frame */
    .to('#fairing-l', { rotation: -20, x: -55, y: -14, svgOrigin: '786 245', duration: 2.8, ease: 'power2.inOut' }, 26.2)
    .to('#fairing-r', { rotation: 20, x: 55, y: -14, svgOrigin: '814 245', duration: 2.8, ease: 'power2.inOut' }, 26.2)
    .to(['#fairing-l', '#fairing-r'], { autoAlpha: 0.3, duration: 2.0 }, 26.6)
    /* dispenser goes signal-cyan, tiers light top-down */
    .to('#asm-payload > path, #asm-payload > line', { stroke: '#7ce9ff', duration: 1.2 }, 28.6)
    .to('#tier-shelves', { autoAlpha: 1, duration: 0.8 }, 28.6)
    .to('#tier-1', { autoAlpha: 1, duration: 1.0 }, 28.8)
    .to('#tier-2', { autoAlpha: 1, duration: 1.0 }, 29.9)
    .to('#tier-3', { autoAlpha: 1, duration: 1.0 }, 31.0)
    .to('#tier-4', { autoAlpha: 1, duration: 1.0 }, 32.1)
    .to('#lead-payload', { autoAlpha: 1, duration: 0.5 }, 31.4)
    .fromTo('#lead-payload path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1 }, 31.5)
    .to('#panel-2', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 30.5);
}

/* ---------- scene 3 · 40–51 · GS2 separates, hydrolox cutaway ---------- */
function sceneGs2(tl) {
  tl.addLabel('gs2', 40)
    .to('#panel-2', { autoAlpha: 0, y: -18, duration: 0.8 }, 40)
    .to('#lead-payload', { autoAlpha: 0, duration: 0.5 }, 40)
    .to(cam, camTo(CAMS.gs2, 3.0), 40.2)
    /* staging gap: everything above the interstage lifts together */
    .to(['#asm-fairing', '#asm-payload', '#asm-gs2'],
      { y: STAGING_LIFT, duration: 2.8, ease: 'power2.inOut' }, 40.4)
    /* hidden-line BE-3U bells become solid now that they're exposed */
    .to('#be3u-dash', { autoAlpha: 0, duration: 0.9 }, 42.6)
    .to('#be3u-solid', { autoAlpha: 1, duration: 0.9 }, 42.7)
    /* section cutaway: hatch reveals top-down via clip rect */
    .to('#gs2-cut', { autoAlpha: 1, duration: 0.4 }, 43.2)
    .fromTo('#clip-gs2-r', { attr: { height: 0 } }, { attr: { height: 172 }, duration: 2.2 }, 43.3)
    .to('#lead-gs2', { autoAlpha: 1, duration: 0.5 }, 44.8)
    .fromTo('#lead-gs2 path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.2, stagger: 0.3 }, 44.9)
    .to('#panel-3', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 44.0);
}

/* ---------- scene 4 · 51–59 · forward module + fins ---------- */
function sceneInterstage(tl) {
  tl.addLabel('interstage', 51)
    .to('#panel-3', { autoAlpha: 0, y: -18, duration: 0.8 }, 51)
    .to('#lead-gs2', { autoAlpha: 0, duration: 0.5 }, 51)
    .to(cam, camTo(CAMS.interstage, 2.8), 51.2)
    .to(['#fin-l', '#fin-r'], { stroke: '#7ce9ff', duration: 1.0 }, 52.6)
    .to('#lead-interstage', { autoAlpha: 1, duration: 0.5 }, 53.2)
    .fromTo('#lead-interstage path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1, stagger: 0.3 }, 53.3)
    .to('#panel-4', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 53.0);
}

/* ---------- scene 5 · 59–71 · GS1 booster, tanks + strakes ---------- */
function sceneGs1(tl) {
  tl.addLabel('gs1', 59)
    .to('#panel-4', { autoAlpha: 0, y: -18, duration: 0.8 }, 59)
    .to('#lead-interstage', { autoAlpha: 0, duration: 0.5 }, 59)
    .to(['#fin-l', '#fin-r'], { stroke: 'rgba(233,242,255,0.92)', duration: 0.8 }, 59)
    .to(cam, camTo(CAMS.gs1, 3.0), 59.2)
    .to('#gs1-cut', { autoAlpha: 1, duration: 0.4 }, 60.6)
    .fromTo('#clip-gs1-r', { attr: { height: 0 } }, { attr: { height: 328 }, duration: 2.6 }, 60.7)
    .to(['#strake-l', '#strake-r'], { stroke: '#7ce9ff', duration: 1.0 }, 62.2)
    .to('#lead-gs1', { autoAlpha: 1, duration: 0.5 }, 62.8)
    .fromTo('#lead-gs1 path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.2, stagger: 0.35 }, 62.9)
    .to('#panel-5', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 62.5);
}

/* ---------- scene 6 · 71–83 · aft module, 7× BE-4, DETAIL A ---------- */
function sceneEngines(tl) {
  tl.addLabel('engines', 71)
    .to('#panel-5', { autoAlpha: 0, y: -18, duration: 0.8 }, 71)
    .to('#lead-gs1', { autoAlpha: 0, duration: 0.5 }, 71)
    .to(['#strake-l', '#strake-r'], { stroke: 'rgba(233,242,255,0.92)', duration: 0.8 }, 71)
    .to(cam, camTo(CAMS.engines, 3.0), 71.2)
    .to('#da-mark', { autoAlpha: 1, duration: 0.8 }, 72.8)
    .to('#detail-a', { autoAlpha: 1, duration: 0.8 }, 73.6)
    .to('#da-engines .dr', { strokeDashoffset: 0, duration: 2.0, stagger: 0.12 }, 74.0)
    .to('#be4-row path, #be4-row ellipse', { stroke: '#7ce9ff', duration: 1.0 }, 74.6)
    .to('#da-legs .dr', { strokeDashoffset: 0, duration: 1.4, stagger: 0.1 }, 76.0)
    .to('#lead-engines', { autoAlpha: 1, duration: 0.5 }, 76.6)
    .fromTo('#lead-engines path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.1, stagger: 0.3 }, 76.7)
    .to('#panel-6', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 75.0);
}

/* ---------- scene 7 · 83–100 · full explode → labels → reassemble → stamp ---------- */
function sceneExploded(tl) {
  const G = EXPLODE.groups;
  const H = EXPLODE.halves;
  tl.addLabel('exploded', 83)
    .to('#panel-6', { autoAlpha: 0, y: -18, duration: 0.8 }, 83)
    .to('#lead-engines', { autoAlpha: 0, duration: 0.5 }, 83)
    .to(['#da-mark', '#detail-a'], { autoAlpha: 0, duration: 1.0 }, 83)
    .to('#be4-row path, #be4-row ellipse', { stroke: 'rgba(233,242,255,0.55)', duration: 0.8 }, 83)
    /* pull back while every assembly separates along the centerline */
    .to(cam, camTo(CAMS.exploded, 4.2), 83.4)
    .to('#asm-fairing', { y: G['asm-fairing'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#asm-payload', { y: G['asm-payload'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#asm-gs2', { y: G['asm-gs2'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#asm-interstage', { y: G['asm-interstage'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#asm-aft', { y: G['asm-aft'], duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#fairing-l', { ...H['fairing-l'], autoAlpha: 0.8, duration: 4.0, ease: 'power2.inOut' }, 83.6)
    .to('#fairing-r', { ...H['fairing-r'], autoAlpha: 0.8, duration: 4.0, ease: 'power2.inOut' }, 83.6)
    /* the money shot: seven leader labels sweep in */
    .to('#x-labels g', { autoAlpha: 1, duration: 0.6, stagger: 0.28 }, 87.4)
    .fromTo('#x-labels path',
      { strokeDasharray: 1.02, strokeDashoffset: 1.02 },
      { strokeDashoffset: 0, duration: 1.0, stagger: 0.28 }, 87.5)
    /* reassembly */
    .to('#x-labels g', { autoAlpha: 0, duration: 0.8 }, 92.6)
    .to(['#asm-fairing', '#asm-payload', '#asm-gs2', '#asm-interstage', '#asm-aft'],
      { y: 0, duration: 3.2, ease: 'power2.inOut' }, 93.4)
    .to(['#fairing-l', '#fairing-r'],
      { x: 0, y: 0, rotation: 0, autoAlpha: 1, duration: 3.2, ease: 'power2.inOut' }, 93.4)
    .to(['#gs2-cut', '#gs1-cut'], { autoAlpha: 0, duration: 1.2 }, 93.6)
    .to(['#tiers g', '#tier-shelves'], { autoAlpha: 0.4, duration: 1.4 }, 94.0)
    .to('#asm-payload > path, #asm-payload > line', { stroke: 'rgba(233,242,255,0.55)', duration: 1.4 }, 94.0)
    .to('#be3u-solid', { autoAlpha: 0, duration: 0.8 }, 95.6)
    .to('#be3u-dash', { autoAlpha: 1, duration: 0.8 }, 95.7)
    .to(cam, camTo(CAMS.full, 2.6), 95.4)
    .to('#dims', { autoAlpha: 1, duration: 1.2 }, 96.8)
    /* released: the rev stamp thunks down, summary card in */
    .fromTo('#stamp',
      { autoAlpha: 0, scale: 1.6, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power3.out' }, 97.9)
    .to('#panel-7', { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power2.out' }, 96.5);
}
