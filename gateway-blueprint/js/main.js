/* ============================================================
   main.js — M1 boot shim: geometry + UI only.
   The timeline port (M2) replaces this with the full dual-mode
   boot (scroll / player) — see ../satellite-blueprint/js/main.js
   for the shape this will take.
   ============================================================ */

import { buildDrawing } from './drawing.js';
import { buildUI } from './ui.js';

const MOBILE_MQ = '(max-width: 900px) and (orientation: portrait)';

buildDrawing();
buildUI(() => {});

/* portrait-narrow viewports crop the sheet instead of letterboxing it */
const bp = document.getElementById('bp');
const sliceMq = matchMedia(MOBILE_MQ);
const setPAR = () =>
  bp.setAttribute('preserveAspectRatio', sliceMq.matches ? 'xMidYMid slice' : 'xMidYMid meet');
setPAR();
sliceMq.addEventListener('change', setPAR);
