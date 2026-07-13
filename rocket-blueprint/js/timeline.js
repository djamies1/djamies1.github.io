/* ============================================================
   timeline.js — one master timeline, one ScrollTrigger.
   Camera = transform of #world (sheet chrome never zooms).
   Timeline duration is 100 units; scene labels sit at the
   fractions defined in data.js SCENES.
   ============================================================ */

import { CAM, EXPLODE, STAGING_LIFT, SCENES, SCROLL_VH } from './data.js';

/* world transform that centers world point (px,py) on the sheet
   center (800,500) at zoom z. svgOrigin (not transformOrigin):
   GSAP treats transformOrigin as bbox-relative for SVG elements. */
const camVars = ({ px, py, z }) => ({
  x: 800 - z * px,
  y: 500 - z * py,
  scale: z,
  svgOrigin: '0 0',
});

let st = null;

export function scrollToScene(i) {
  if (!st) return;
  const t0 = SCENES[i].t[0];
  const y = st.start + (st.end - st.start) * (Math.min(t0 + 1.2, 99) / 100);
  window.scrollTo({ top: y, behavior: 'smooth' });
}

export function initTimeline({ onProgress } = {}) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* Initial states are applied here, not in CSS: without JS the page
     remains a finished static drawing. */
  gsap.set('#bp .dr', { strokeDashoffset: 1.02 });
  gsap.set(
    ['#zones', '#titleblock', '#notes', '#grid-1', '#grid-2', '#centerline',
     '#be3u-dash', '#tiers', '#tier-shelves'],
    { autoAlpha: 0 }
  );
  /* dim lines carry arrow markers, which paint even when the stroke is
     dash-hidden — so they hide via opacity as well */
  gsap.set(['#dims text', '#dims .dash-ext', '#dims .dr', '#titleblock text', '#notes text'], { autoAlpha: 0 });
  gsap.set('.panel', { autoAlpha: 0, y: 24 });
  gsap.set('#world', { svgOrigin: '0 0' });

  const cfg = window.ROCKET_BP_CONFIG || {};
  const tl = gsap.timeline({
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

  sceneDraw(tl);
  sceneFairing(tl);
  scenePayload(tl);
  sceneGs2(tl);
  sceneInterstage(tl);
  sceneGs1(tl);
  sceneEngines(tl);
  sceneExploded(tl);
  tl.to({}, { duration: 0.5 }, 99.5);   // hard end at 100

  return tl;
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
    .to(['#tiers', '#tier-shelves'], { autoAlpha: 0.4, duration: 1.0 }, 9.0)
    .to('#dims .dash-ext', { autoAlpha: 1, duration: 0.9 }, 9.4)
    .to('#dims .dr', { autoAlpha: 1, duration: 0.2 }, 9.55)
    .to('#dims .dr', { strokeDashoffset: 0, duration: 1.7, stagger: 0.3 }, 9.6)
    .to('#dims text', { autoAlpha: 1, duration: 0.9, stagger: 0.12 }, 10.8)
    .to('#panel-0', { autoAlpha: 1, y: 0, duration: 1.4, ease: 'power2.out' }, 12.0);
}

/* ---------- scene 1 · 14–26 · fairing (M3) ---------- */
function sceneFairing(tl) {
  tl.addLabel('fairing', 14)
    .to('#panel-0', { autoAlpha: 0, y: -18, duration: 0.8 }, 14)
    .to('#dims', { autoAlpha: 0, duration: 1.0 }, 14.2)
    .to('#world', { ...camVars(CAM.fairing), duration: 3.2, ease: 'power2.inOut' }, 14.2);
}

/* ---------- scene 2 · 26–40 · payload hero (M3) ---------- */
function scenePayload(tl) {
  tl.addLabel('payload', 26);
}

/* ---------- scene 3 · 40–51 · GS2 (M4) ---------- */
function sceneGs2(tl) {
  tl.addLabel('gs2', 40);
}

/* ---------- scene 4 · 51–59 · interstage (M4) ---------- */
function sceneInterstage(tl) {
  tl.addLabel('interstage', 51);
}

/* ---------- scene 5 · 59–71 · GS1 (M4) ---------- */
function sceneGs1(tl) {
  tl.addLabel('gs1', 59);
}

/* ---------- scene 6 · 71–83 · engines + DETAIL A (M4) ---------- */
function sceneEngines(tl) {
  tl.addLabel('engines', 71);
}

/* ---------- scene 7 · 83–100 · full explode, reassemble, stamp (M5) ---------- */
function sceneExploded(tl) {
  tl.addLabel('exploded', 83);
}
