/* ============================================================
   timeline.js — one master timeline, one ScrollTrigger.
   Camera = transform of #world (sheet chrome never zooms).
   Timeline duration is 100 units. The comparison is a vertical
   two-column table; the intro draws the divider, then each scene
   pans DOWN and reveals the next row.
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
  full:   { px: 800, py: 512, z: 0.80 },
  thesis: { px: 800, py: 250, z: 0.98 },
  con:    { px: 800, py: 322, z: 1.30 },
  spec:   { px: 800, py: 448, z: 1.30 },
  mesh:   { px: 800, py: 574, z: 1.30 },
  ground: { px: 800, py: 700, z: 1.30 },
  launch: { px: 800, py: 820, z: 1.30 },
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

const ROWS_G = ['#row-con', '#row-spec', '#row-mesh', '#row-ground', '#row-launch'];
const HIDDEN = ['#divider', '#headers', ...ROWS_G, '#anno > g'];

function build(isMobile, onProgress) {
  CAMS = isMobile ? CAM_MOBILE : CAM;

  gsap.set('#bp .dr', { strokeDashoffset: 1.02 });
  gsap.set(['#zones', '#titleblock', '#notes', '#grid-1', '#grid-2', ...HIDDEN], { autoAlpha: 0 });
  gsap.set(['#titleblock text', '#notes text'], { autoAlpha: 0 });
  gsap.set('.panel', { autoAlpha: 0, y: 24 });
  applyCam();

  const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true });
  tlRef = tl;

  sceneDraw(tl);
  sceneThesis(tl);
  sceneRow(tl, 'con', 26.5, CAMS.con, '#row-con', 2);
  sceneRow(tl, 'spec', 39, CAMS.spec, '#row-spec', 3);
  sceneRow(tl, 'mesh', 51.5, CAMS.mesh, '#row-mesh', 4);
  sceneRow(tl, 'ground', 64, CAMS.ground, '#row-ground', 5);
  sceneRow(tl, 'launch', 77, CAMS.launch, '#row-launch', 6);
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
    const cfg = window.CMP_BP_CONFIG || {};
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
  gsap.set(['#divider', '#headers', ...ROWS_G, '#anno > g', '#stamp'], { autoAlpha: 1 });
  gsap.set('#bp .dr', { strokeDashoffset: 0 });
  setCam((matchMedia(MOBILE_MQ).matches ? CAM_MOBILE : CAM).full);
}

/* ---------- scene 0 · 0–14 · sheet + centre divider ---------- */
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
    .to('#divider', { autoAlpha: 1, duration: 0.4 }, 3.4)
    .to('#divider .dr', { strokeDashoffset: 0, duration: 2.2 }, 3.5);
}

/* ---------- scene 1 · 14 · the thesis (two column headers) ---------- */
function sceneThesis(tl) {
  tl.addLabel('thesis', 14)
    .to(cam, camTo(CAMS.thesis, 2.6), 14.0)
    .to('#headers', { autoAlpha: 1, duration: 1.2 }, 15.2)
    .to('#panel-1', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 15.6);
}

/* ---------- scenes 2–6 · pan down to each row ---------- */
function sceneRow(tl, id, at, camPreset, rowSel, panelN) {
  tl.addLabel(id, at)
    .to(`#panel-${panelN - 1}`, { autoAlpha: 0, y: -18, duration: 0.8 }, at)
    .to(cam, camTo(camPreset, 3.0), at + 0.2)
    .to(rowSel, { autoAlpha: 1, duration: 1.1 }, at + 1.8)
    .to(`#panel-${panelN}`, { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, at + 2.0);
}

/* ---------- scene 7 · 88.4–100 · the two bets → money shot → stamp ---------- */
function sceneRecap(tl) {
  tl.addLabel('recap', 88.4)
    .to('#panel-6', { autoAlpha: 0, y: -18, duration: 0.8 }, 88.4)
    .to(cam, camTo(CAMS.full, 3.2), 88.6)
    .to(ROWS_G, { autoAlpha: 1, duration: 1.4 }, 89.4)
    .to('#lead-recap', { autoAlpha: 1, duration: 1.0 }, 90.4)
    .to('#panel-7', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 90.6)
    .to('#panel-7', { autoAlpha: 0, y: -18, duration: 0.8 }, 95.4)
    .fromTo('#stamp',
      { autoAlpha: 0, scale: 1.6, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power3.out' }, 98.0);
}
