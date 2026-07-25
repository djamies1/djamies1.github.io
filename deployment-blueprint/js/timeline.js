/* ============================================================
   timeline.js — one master timeline, one ScrollTrigger.
   Camera = transform of #world (sheet chrome never zooms).
   Timeline duration is 100 units. The intro draws the chart
   skeleton (axes + FCC gates); scenes zoom around it and reveal
   the manifest, the required/actual burn-up curves and the gap.
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
const camTo = (preset, duration) => ({ ...preset, duration, ease: 'power2.inOut', onUpdate: applyCam });

export function setCam(preset) {
  worldEl = worldEl || document.getElementById('world');
  Object.assign(cam, preset);
  applyCam();
}

let st = null, tlRef = null, MODE = 'scroll';
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
    if (tlRef.paused()) { if (!started) { started = true; tlRef.play(START); } else tlRef.play(); return true; }
    tlRef.pause(); return false;
  },
  restart() { if (!tlRef) return; started = true; tlRef.play(START); },
  goto(i) { if (!tlRef) return; started = true; const [t0, t1] = SCENES[i].t; tlRef.seek(fromVisible((t0 + t1) / 2), false); },
  step(dir, current) { this.goto(Math.max(0, Math.min(SCENES.length - 1, current + dir))); },
  scrub(percentVisible) { if (!tlRef) return; started = true; tlRef.seek(fromVisible(Math.min(Math.max(percentVisible, 0), 100)), false); },
  setSpeed(mult) { OPTS.speed = mult; if (tlRef) tlRef.timeScale(mult); },
};

const AUTOSCROLL_SECS = 104;
const INPUT_EVENTS = ['wheel', 'touchstart', 'keydown', 'mousedown'];
let scrollTween = null, autoStopCb = null, scrollSpeedMult = 1;
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
export function setScrollSpeed(mult) { scrollSpeedMult = mult; if (scrollTween) scrollTween.timeScale(mult); }

export const MOBILE_MQ = '(max-width: 900px) and (orientation: portrait)';
const CAM_MOBILE = {
  full:   { px: 810, py: 500, z: 0.86 },
  target: { px: 700, py: 340, z: 1.2 },
  clock:  { px: 820, py: 440, z: 1.15 },
  manif:  { px: 430, py: 430, z: 1.25 },
  ramp:   { px: 560, py: 620, z: 1.3 },
  gap:    { px: 740, py: 590, z: 1.4 },
  feeder: { px: 560, py: 760, z: 1.3 },
};
let CAMS = CAM;

export function initTimeline({ onProgress, mode = 'scroll', autoplay = false, loop = false, speed = 1.0 } = {}) {
  MODE = mode;
  OPTS = { autoplay, loop, speed };
  if (window.ScrollTrigger) { gsap.registerPlugin(ScrollTrigger); ScrollTrigger.config({ ignoreMobileResize: true }); }
  worldEl = document.getElementById('world');
  const mm = gsap.matchMedia();
  mm.add(MOBILE_MQ, () => build(true, onProgress));
  mm.add('(min-width: 901px), (orientation: landscape)', () => build(false, onProgress));
}

const REVEAL = ['#lbl-target', '#lbl-clock', '#manifest', '#curve-req', '#lbl-ramp', '#curve-act', '#gap', '#lbl-feeder', '#anno > g'];

function build(isMobile, onProgress) {
  CAMS = isMobile ? CAM_MOBILE : CAM;
  gsap.set('#bp .dr', { strokeDashoffset: 1.02 });
  gsap.set(['#zones', '#titleblock', '#notes', '#grid-1', '#grid-2', '#chart', '#axis-ticks', ...REVEAL], { autoAlpha: 0 });
  gsap.set(['#titleblock text', '#notes text'], { autoAlpha: 0 });
  gsap.set('.panel', { autoAlpha: 0, y: 24 });
  applyCam();

  const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true });
  tlRef = tl;

  sceneDraw(tl);
  sceneZoom(tl, 'target', 14, CAMS.target, ['#lbl-target'], 1, 14.0);
  sceneZoom(tl, 'clock', 26.5, CAMS.clock, ['#lbl-clock'], 2);
  sceneZoom(tl, 'manif', 39, CAMS.manif, ['#manifest'], 3);
  sceneRamp(tl);
  sceneGap(tl);
  sceneZoom(tl, 'feeder', 77, CAMS.feeder, ['#lbl-feeder'], 6);
  sceneRecap(tl);

  tl.to({}, { duration: 0.5 }, 99.5);

  if (MODE === 'player') {
    tl.repeat(OPTS.loop ? -1 : 0).repeatDelay(3.2).timeScale(OPTS.speed);
    tl.eventCallback('onUpdate', () => onProgress && onProgress(toVisible(tl.time())));
    st = null; started = false;
    if (OPTS.autoplay) { started = true; tl.play(START); } else tl.time(START).pause();
  } else {
    const cfg = window.DEP_BP_CONFIG || {};
    const head = { t: START };
    headTween = gsap.to(head, {
      t: tl.duration(), ease: 'none', paused: true,
      onUpdate: () => { tl.time(head.t); onProgress && onProgress(toVisible(head.t)); },
    });
    st = ScrollTrigger.create({
      animation: headTween, trigger: '.stage', start: 'top top',
      end: () => '+=' + window.innerHeight * SCROLL_VH,
      pin: true, anticipatePin: 1,
      scrub: matchMedia('(hover: none)').matches ? 0.5 : 0.75,
      invalidateOnRefresh: true, ...cfg,
    });
    tl.time(START);
  }

  return () => { st = null; tlRef = null; started = false; headTween = null; Object.assign(cam, { px: 800, py: 500, z: 1 }); applyCam(); };
}

export function buildStaticPoster() {
  worldEl = document.getElementById('world');
  gsap.set(['#chart', '#axis-ticks', ...REVEAL, '#stamp'], { autoAlpha: 1 });
  gsap.set('#bp .dr', { strokeDashoffset: 0 });
  setCam((matchMedia(MOBILE_MQ).matches ? CAM_MOBILE : CAM).full);
}

/* ---------- scene 0 · 0–14 · sheet + chart skeleton ---------- */
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
    .to('#chart', { autoAlpha: 1, duration: 0.4 }, 3.2)
    .to(['#axis-x', '#axis-y'], { strokeDashoffset: 0, duration: 1.8 }, 3.4)
    .to('#axis-ticks', { autoAlpha: 1, duration: 1.0 }, 5.0);
}

/* ---------- generic zoom + reveal ---------- */
function sceneZoom(tl, id, at, camPreset, reveals, panelN, camAt) {
  tl.addLabel(id, at);
  if (panelN > 1) tl.to(`#panel-${panelN - 1}`, { autoAlpha: 0, y: -18, duration: 0.8 }, at);
  tl.to(cam, camTo(camPreset, 3.0), (camAt ?? at) + (panelN > 1 ? 0.2 : 0));
  reveals.forEach((sel, i) => tl.to(sel, { autoAlpha: 1, duration: 1.0 }, at + 1.8 + i * 0.3));
  tl.to(`#panel-${panelN}`, { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, at + 2.0);
}

/* ---------- scene 4 · 43.5 · required curve + ramp ---------- */
function sceneRamp(tl) {
  tl.addLabel('ramp', 43.5)
    .to('#panel-3', { autoAlpha: 0, y: -18, duration: 0.8 }, 43.5)
    .to(cam, camTo(CAMS.ramp, 3.0), 43.7)
    .to('#curve-req', { autoAlpha: 1, duration: 0.3 }, 45.0)
    .to('#curve-req .dr', { strokeDashoffset: 0, duration: 1.8 }, 45.1)
    .to('#lbl-ramp', { autoAlpha: 1, duration: 1.0 }, 45.8)
    .to('#panel-4', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 45.6);
}

/* ---------- scene 5 · 58 · actual curve + the gap ---------- */
function sceneGap(tl) {
  tl.addLabel('gap', 58)
    .to('#panel-4', { autoAlpha: 0, y: -18, duration: 0.8 }, 58)
    .to(cam, camTo(CAMS.gap, 3.0), 58.2)
    .to('#curve-act', { autoAlpha: 1, duration: 0.3 }, 59.6)
    .to('#curve-act .dr', { strokeDashoffset: 0, duration: 1.6 }, 59.7)
    .to('#gap', { autoAlpha: 1, duration: 1.0 }, 60.4)
    .to('#panel-5', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 60.2);
}

/* ---------- scene 7 · 88.4–100 · the build-out → money shot → stamp ---------- */
function sceneRecap(tl) {
  tl.addLabel('recap', 88.4)
    .to('#panel-6', { autoAlpha: 0, y: -18, duration: 0.8 }, 88.4)
    .to(cam, camTo(CAMS.full, 3.2), 88.6)
    .to(['#curve-req', '#curve-act', '#gap', '#manifest', '#lbl-target', '#lbl-clock'], { autoAlpha: 1, duration: 1.2 }, 89.4)
    .to('#lead-recap', { autoAlpha: 1, duration: 1.0 }, 90.4)
    .to('#panel-7', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power2.out' }, 90.6)
    .to('#panel-7', { autoAlpha: 0, y: -18, duration: 0.8 }, 95.4)
    .fromTo('#stamp',
      { autoAlpha: 0, scale: 1.6, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power3.out' }, 98.0);
}
