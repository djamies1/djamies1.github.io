/* ============================================================
   main.js — boot.
   Order: generated geometry → UI from data.js → fonts settle →
   timeline + ScrollTrigger. Reduced motion (or missing GSAP)
   renders the static exploded poster instead of a scrub timeline.
   ============================================================ */

import { buildDrawing } from './drawing.js';
import { buildUI, announceScene } from './ui.js';
import { initTimeline, scrollToScene, buildStaticPoster, MOBILE_MQ } from './timeline.js';

buildDrawing();
buildUI(scrollToScene);

/* portrait phones crop the sheet instead of letterboxing it */
const bp = document.getElementById('bp');
const sliceMq = matchMedia(MOBILE_MQ);
const setPAR = () =>
  bp.setAttribute('preserveAspectRatio', sliceMq.matches ? 'xMidYMid slice' : 'xMidYMid meet');
setPAR();
sliceMq.addEventListener('change', () => {
  setPAR();
  if (window.ScrollTrigger) ScrollTrigger.refresh();
});

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduced && window.gsap && window.ScrollTrigger) {
  document.fonts.ready.then(() => {
    initTimeline({ onProgress: announceScene });
    ScrollTrigger.refresh();
  });
} else {
  document.body.classList.add('is-static');
  if (window.gsap) buildStaticPoster();
}
