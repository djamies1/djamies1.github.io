/* ============================================================
   main.js — boot.
   Order: generated geometry → UI from data.js → fonts settle →
   timeline + ScrollTrigger. Reduced motion (or missing GSAP)
   falls back to the static drawing (full poster branch in M6).
   ============================================================ */

import { buildDrawing } from './drawing.js';
import { buildUI, announceScene } from './ui.js';
import { initTimeline, scrollToScene } from './timeline.js';

buildDrawing();
buildUI(scrollToScene);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduced && window.gsap && window.ScrollTrigger) {
  document.fonts.ready.then(() => {
    initTimeline({ onProgress: announceScene });
    ScrollTrigger.refresh();
  });
} else {
  document.body.classList.add('is-static');
  /* M6: static exploded poster + panels re-flowed into the document */
}
