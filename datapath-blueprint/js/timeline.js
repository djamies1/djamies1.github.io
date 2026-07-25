/* ============================================================
   timeline.js — one master timeline, one ScrollTrigger.
   Camera = transform of #world (sheet chrome never zooms).
   Timeline duration is 100 units. The signal-flow spine draws
   left→right in the intro (the packet's route building); each
   scene then pans/zooms to a station and reveals its label.
   ============================================================ */

import { CAM, SCENES, SCROLL_VH } from './data.js';

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

export function setCam(preset) {
  worldEl = worldEl || document.getElementById('world');
  Object.assign(cam, preset);
  applyCam();
}

let st = null;
let tlRef = null;
let MODE = 'scroll';
let OPTS = { autoplay: false, loop: false, speed: 1.0 };
let started = false;
const START = 14;
const toVisible = (t) => ((t - START) / (tlRef.duration() - START)) * 100;
const fromVisible = (v) => START + (v / 100) * (tlRef.duration() - START);

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
  const [t0, t1] = SCENES[idx].t;
  jumpToPercent(Math.min((t0 + t1) / 2, 99));
}
export function scrubToPercent(pct) { jumpToPercent(pct); }

/* ---------- player-mode transport ---------- */
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
  restart() { if (!tlRef) return; started = true; tlRef.play(START); },
  goto(i) {
    if (!tlRef) return;
    started = true;
    const [t0, t1] = SCENES[i].t;
    tlRef.seek(fromVisible((t0 + t1) / 2), false);
  },
  step(dir, current) { this.goto(Math.max(0, Math.min(SCENES.length - 1, current + dir))); },
  scrub(percentVisible) {
    if (!tlRef) return;
    started = true;
    tlRef.seek(fromVisible(Math.min(Math.max(percentVisible, 0), 100)), false);
  },
  setSpeed(mult) { OPTS.speed = mult; if (tlRef) tlRef.timeScale(mult); },
};

/* ---------- scroll-mode auto-play ---------- */
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

export const MOBILE_MQ = '(max-width: 900px) and (orientation: portrait)';
const CAM_MOBILE = {
  full: { px: 815, py: 496, z: 0.90 },
  term: { px: 306, py: 596, z: 1.40 },
  up:   { px: 430, py: 452, z: 1.30 },
  mesh: { px: 650, py: 300, z: 1.40 },
  down: { px: 968, py: 470, z: 1.30 },
  aws:  { px: 1332, py: 650, z: 1.30 },
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

/* every world group starts hidden; the intro reveals the skeleton, scenes reveal labels */
const SKELETON = ['#ground', '#term-glyph', '#uplink', '#sats', '#mesh-links', '#downlink', '#gw-glyph', '#fibre', '#aws-glyph'];
const LABELS = ['#term-lbl', '#term-detail', '#up-lbl', '#mesh-lbl', '#down-lbl', '#gw-lbl', '#aws-lbl', '#lat-bar', '#anno > g'];

function build(isMobile, onProgress) {
  CAMS = isMobile ? CAM_MOBILE : CAM;

  gsap.set('#bp .dr', { strokeDashoffset: 1.02 });
  gsap.set(['#zones', '#titleblock', '#notes', '#grid-1', '#grid-2', ...SKELETON, ...LABELS], { autoAlpha: 0 });
  gsap.set(['#titleblock text', '#notes text'], { autoAlpha: 0 });
  gsap.set('.panel', { autoAlpha: 0, y: 24 });
  applyCam();

  const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true });
  tlRef = tl;

  sceneDraw(tl);
  sceneEnds(tl);
  sceneTerm(tl);
  sceneUp(tl);
  sceneMesh(tl);
  sceneDown(tl);
  sceneAws(tl);
  sceneRecap(tl);

  tl.to({}, { duration: 0.5 }, 99.5);

  if (MODE === 'player') {
    tl.repeat(OPTS.loop ? -1 : 0).repeatDelay(3.2).timeScale(OPTS.speed);
    tl.eventCallback('onUpdate', () => onProgress && onProgress(toVisible(tl.time())));
    st = null;
    started = false;
    if (OPTS.autoplay) { started = true; tl.play(START); }
    else tl.time(START).pause();
  } else {
    const cfg = window.PATH_BP_CONFIG || {};
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

export function buildStaticPoster() {
  worldEl = document.getElementById('world');
  gsap.set([...SKELETON, ...LABELS, '#stamp'], { autoAlpha: 1 });
  gsap.set('#bp .dr', { strokeDashoffset: 0 });
  setCam((matchMedia(MOBILE_MQ).matches ? CAM_MOBILE : CAM).full);
}

/* ---------- scene 0 · 0–14 · the sheet + the path draw themselves L→R ---------- */
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
    /* the path builds left→right: ground, terminal, up, sats, mesh, down, gateway, fibre, AWS */
    .to('#ground', { autoAlpha: 1, duration: 0.4 }, 3.0)
    .to('#ground .dr', { strokeDashoffset: 0, duration: 1.6 }, 3.1)
    .to('#term-glyph', { autoAlpha: 1, duration: 0.3 }, 4.0)
    .to('#term-glyph .dr', { strokeDashoffset: 0, duration: 0.9, stagger: 0.1 }, 4.05)
    .to('#uplink', { autoAlpha: 1, duration: 0.3 }, 4.9)
    .to('#uplink .dr', { strokeDashoffset: 0, duration: 1.1 }, 4.95)
    .to('#sats', { autoAlpha: 1, duration: 0.3 }, 5.9)
    .to('#sats .dr', { strokeDashoffset: 0, duration: 1.0, stagger: 0.18 }, 5.95)
    .to('#mesh-links', { autoAlpha: 1, duration: 0.3 }, 6.9)
    .to('#mesh-links .dr', { strokeDashoffset: 0, duration: 1.0, stagger: 0.14 }, 6.95)
    .to('#downlink', { autoAlpha: 1, duration: 0.3 }, 7.8)
    .to('#downlink .dr', { strokeDashoffset: 0, duration: 1.0 }, 7.85)
    .to('#gw-glyph', { autoAlpha: 1, duration: 0.3 }, 8.7)
    .to('#gw-glyph .dr', { strokeDashoffset: 0, duration: 0.9, stagger: 0.1 }, 8.75)
    .to('#fibre', { autoAlpha: 1, duration: 0.3 }, 9.5)
    .to('#fibre .dr', { strokeDashoffset: 0, duration: 0.8, stagger: 0.08 }, 9.55)
    .to('#aws-glyph', { autoAlpha: 1, duration: 0.3 }, 10.2)
    .to('#aws-glyph .dr', { strokeDashoffset: 0, duration: 1.1, stagger: 0.1 }, 10.25);
}

/* ---------- scene 1 · 14 · the whole path ---------- */
function sceneEnds(tl) {
  tl.addLabel('ends', 14)
    .to(cam, camTo(CAMS.full, 2.6), 14.0)
    .to('#panel-1', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 15.4);
}

/* ---------- scene 2 · 26.5 · the terminal ---------- */
function sceneTerm(tl) {
  tl.addLabel('term', 26.5)
    .to('#panel-1', { autoAlpha: 0, y: -18, duration: 0.8 }, 26.5)
    .to(cam, camTo(CAMS.term, 3.0), 26.7)
    .to('#term-lbl', { autoAlpha: 1, duration: 1.0 }, 28.2)
    .to('#term-detail', { autoAlpha: 1, duration: 1.0 }, 28.6)
    .to('#panel-2', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 28.8);
}

/* ---------- scene 3 · 39 · up to the satellite ---------- */
function sceneUp(tl) {
  tl.addLabel('up', 39)
    .to('#panel-2', { autoAlpha: 0, y: -18, duration: 0.8 }, 39)
    .to(cam, camTo(CAMS.up, 3.0), 39.2)
    .to('#up-lbl', { autoAlpha: 1, duration: 1.0 }, 41.0)
    .to('#panel-3', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 41.4);
}

/* ---------- scene 4 · 51.5 · across the laser mesh (amber) ---------- */
function sceneMesh(tl) {
  tl.addLabel('mesh', 51.5)
    .to('#panel-3', { autoAlpha: 0, y: -18, duration: 0.8 }, 51.5)
    .to(cam, camTo(CAMS.mesh, 3.0), 51.7)
    .to('#mesh-lbl', { autoAlpha: 1, duration: 1.0 }, 53.4)
    /* re-draw the mesh links as an accent as we arrive */
    .fromTo('#mesh-links .dr', { strokeDashoffset: 1.02 }, { strokeDashoffset: 0, duration: 1.4, stagger: 0.12 }, 53.0)
    .to('#panel-4', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 53.6);
}

/* ---------- scene 5 · 64 · down to a gateway ---------- */
function sceneDown(tl) {
  tl.addLabel('down', 64)
    .to('#panel-4', { autoAlpha: 0, y: -18, duration: 0.8 }, 64)
    .to(cam, camTo(CAMS.down, 3.0), 64.2)
    .to('#down-lbl', { autoAlpha: 1, duration: 1.0 }, 66.0)
    .to('#gw-lbl', { autoAlpha: 1, duration: 1.0 }, 66.4)
    .to('#panel-5', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 66.2);
}

/* ---------- scene 6 · 77 · into AWS ---------- */
function sceneAws(tl) {
  tl.addLabel('aws', 77)
    .to('#panel-5', { autoAlpha: 0, y: -18, duration: 0.8 }, 77)
    .to(cam, camTo(CAMS.aws, 3.0), 77.2)
    .to('#aws-lbl', { autoAlpha: 1, duration: 1.0 }, 79.0)
    .to('#panel-6', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 79.2);
}

/* ---------- scene 7 · 88.4–100 · the full round trip → money shot → stamp ---------- */
function sceneRecap(tl) {
  tl.addLabel('recap', 88.4)
    .to('#panel-6', { autoAlpha: 0, y: -18, duration: 0.8 }, 88.4)
    .to(cam, camTo(CAMS.full, 3.2), 88.6)
    .to('#lat-bar', { autoAlpha: 1, duration: 1.2 }, 90.0)
    .to('#lead-recap', { autoAlpha: 1, duration: 1.0 }, 90.4)
    .to('#panel-7', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 90.6)
    .to('#panel-7', { autoAlpha: 0, y: -18, duration: 0.8 }, 95.4)
    .fromTo('#stamp',
      { autoAlpha: 0, scale: 1.6, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power3.out' }, 98.0);
}
