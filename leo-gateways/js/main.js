/* ═══════════════════════════════════════════════════════════════════════
   BOOT — texture preload w/ fallback, wiring globe ↔ ui ↔ state,
   veil fade + opening descent, resize, keyboard
   ═══════════════════════════════════════════════════════════════════════ */

import { createGlobe } from './globe.js';
import { initUI } from './ui.js';
import { initState, actions } from './state.js';

const TEX = {
  earth: [
    'https://cdn.jsdelivr.net/npm/three-globe@2.45.2/example/img/earth-dark.jpg',
    'https://unpkg.com/three-globe@2.45.2/example/img/earth-dark.jpg',
  ],
  bump: 'https://cdn.jsdelivr.net/npm/three-globe@2.45.2/example/img/earth-topology.png',
  sky: 'https://cdn.jsdelivr.net/npm/three-globe@2.45.2/example/img/night-sky.png',
};

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function preloadImage(url, timeoutMs = 6000) {
  return new Promise(resolve => {
    const img = new Image();
    const timer = setTimeout(() => resolve(false), timeoutMs);
    img.onload = () => { clearTimeout(timer); resolve(true); };
    img.onerror = () => { clearTimeout(timer); resolve(false); };
    img.src = url;
  });
}

async function resolveEarthTexture() {
  for (const url of TEX.earth) {
    if (await preloadImage(url)) return url;
  }
  console.warn('[texture] earth texture unavailable — falling back to vector globe');
  return null;
}

function showVeilError(msg) {
  const veil = document.getElementById('veil');
  veil.querySelector('.spinner').style.display = 'none';
  veil.querySelector('.veil-text').textContent = msg;
}

async function boot() {
  const bootAt = performance.now();
  const veil = document.getElementById('veil');
  let ui = null;
  let globeApi = null;
  let veilHidden = false;

  function hideVeil() {
    if (veilHidden) return;
    veilHidden = true;
    veil.classList.add('is-hidden');
  }

  function onReady() {
    // Hold the veil for a beat so the reveal never flashes,
    // then descend from the wide opening shot into orbit.
    const wait = Math.max(0, 900 - (performance.now() - bootAt));
    setTimeout(() => {
      hideVeil();
      if (!REDUCED) globeApi.flyTo({ lat: 18, lng: -40, altitude: 2.5 }, 2400);
    }, wait);
  }

  if (typeof window.Globe !== 'function') {
    showVeilError('VISUALIZATION UNAVAILABLE — RENDERER FAILED TO LOAD');
    return;
  }

  const textureUrl = await resolveEarthTexture();

  try {
    globeApi = createGlobe(document.getElementById('globe'), {
      textureUrl,
      bumpUrl: textureUrl ? TEX.bump : null,
      skyUrl: TEX.sky,
      reduced: REDUCED,
      onMarkerHover: (d, e) => ui && ui.showTooltip(d, e),
      onMarkerMove: (d, e) => ui && ui.moveTooltip(e),
      onMarkerLeave: () => ui && ui.hideTooltip(),
      onMarkerClick: d => actions.openGateway(d),
      onBackgroundClick: () => actions.closeGateway(),
      onReady,
    });
  } catch (err) {
    console.error('[globe] init failed', err);
    showVeilError('VISUALIZATION UNAVAILABLE');
    return;
  }

  ui = initUI({
    reduced: REDUCED,
    onRegion: r => actions.setRegion(r),
    onCountry: c => actions.setCountry(c),
    onCloseCard: () => actions.closeGateway(),
  });

  initState(globeApi, ui, { reduced: REDUCED });

  // Country polygons load lazily — filters work without them.
  globeApi.loadPolygons();

  // Safety: never strand the user behind the veil.
  setTimeout(hideVeil, 10000);

  // Resize (debounced)
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => globeApi.resize(), 150);
  });

  // ESC → close card, else clear filters
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') actions.handleEscape();
  });
}

boot();
