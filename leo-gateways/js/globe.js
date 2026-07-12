/* ═══════════════════════════════════════════════════════════════════════
   GLOBE — globe.gl (UMD global `Globe`) configuration + marker factory
   Layers: htmlElements (gateway nodes) · rings (pulses/bursts) ·
           polygons (region/country highlight)
   ═══════════════════════════════════════════════════════════════════════ */

import { GATEWAYS, ATLAS_NAME_MAP } from './data.js';

const ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';

export function createGlobe(container, {
  textureUrl, bumpUrl, skyUrl, reduced,
  onMarkerHover, onMarkerMove, onMarkerLeave, onMarkerClick,
  onBackgroundClick, onReady,
}) {
  const markerEls = new Map();          // gateway id → root element (restyle via classes only)

  // ── ring layer bookkeeping ──
  // Ambient datums are the gateway objects themselves so d3 identity joins
  // keep unchanged emitters in phase across filter changes.
  let ringScope = GATEWAYS.filter(g => g.status === 'ACTIVE');
  let boostDatum = null;                // persistent halo on the selected gateway
  let burstDatum = null;                // one-shot click shockwave
  let burstTimer = 0;

  function makeMarker(d) {
    const root = document.createElement('div');
    root.className = `ggt-marker ggt--${d.status === 'ACTIVE' ? 'active' : 'planned'}`;
    root.dataset.id = d.id;

    const anchor = document.createElement('div');
    anchor.className = 'ggt-anchor';

    const core = document.createElement('span');
    core.className = 'ggt-core';

    const label = document.createElement('span');
    label.className = 'ggt-label';
    label.textContent = d.city.split(',')[0];

    anchor.append(core, label);
    root.append(anchor);

    anchor.addEventListener('mouseenter', e => onMarkerHover(d, e));
    anchor.addEventListener('mousemove', e => onMarkerMove(d, e));
    anchor.addEventListener('mouseleave', () => onMarkerLeave(d));
    anchor.addEventListener('click', e => { e.stopPropagation(); onMarkerClick(d); });

    markerEls.set(d.id, root);
    return root;
  }

  // Suppress the globe background "click" that fires after an orbit drag.
  let downX = 0, downY = 0;
  container.addEventListener('pointerdown', e => { downX = e.clientX; downY = e.clientY; }, true);

  const globe = Globe({ animateIn: false })(container)
    .width(window.innerWidth)
    .height(window.innerHeight)
    .backgroundColor('#030711')
    .showAtmosphere(true)
    .atmosphereColor('#38bdf8')
    .atmosphereAltitude(0.22)

    // ── gateway nodes: DOM markers ──
    .htmlElementsData(GATEWAYS)
    .htmlLat('lat').htmlLng('lng')
    .htmlAltitude(0.012)
    .htmlTransitionDuration(0)
    .htmlElement(makeMarker)
    .htmlElementVisibilityModifier((el, isVisible) => el.classList.toggle('is-behind', !isVisible))

    // ── pulses ──
    .ringsData(reduced ? [] : [...ringScope])
    .ringLat('lat').ringLng('lng')
    .ringAltitude(0.0015)
    .ringColor(d => {
      if (d.__burst) return t => `rgba(34,211,238,${(0.8 * (1 - t)).toFixed(3)})`;
      if (d.__boost) return t => `rgba(103,232,249,${(0.5 * (1 - t)).toFixed(3)})`;
      return t => `rgba(34,211,238,${(0.45 * (1 - t)).toFixed(3)})`;
    })
    .ringMaxRadius(d => d.__burst ? 7 : d.__boost ? 3.4 : 2.8)
    .ringPropagationSpeed(d => d.__burst ? 6 : d.__boost ? 1.6 : 1.1)
    .ringRepeatPeriod(d => d.__burst ? 2000 : d.__boost ? 1400 : 2600)

    // ── region/country highlight (fed on filter) ──
    .polygonsData([])
    .polygonCapColor(() => 'rgba(34,211,238,0.07)')
    .polygonSideColor(() => 'rgba(34,211,238,0.03)')
    .polygonStrokeColor(() => 'rgba(103,232,249,0.5)')
    .polygonAltitude(0.006)
    .polygonsTransitionDuration(400)

    .onGlobeClick((coords, ev) => {
      if (ev && Math.hypot(ev.clientX - downX, ev.clientY - downY) > 8) return; // was a drag
      onBackgroundClick();
    })
    .onGlobeReady(onReady);

  // Textures — applied conditionally so a CDN failure still reads as designed.
  if (textureUrl) {
    globe.globeImageUrl(textureUrl);
    if (bumpUrl) globe.bumpImageUrl(bumpUrl);
  } else {
    globe.globeMaterial().color.set('#0d1b2e');
    globe.showGraticules(true);
  }
  if (skyUrl) globe.backgroundImageUrl(skyUrl);

  // ── camera / controls ──
  const controls = globe.controls();
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.35;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 140;           // globe radius = 100 units
  controls.maxDistance = 520;
  globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  globe.pointOfView({ lat: 18, lng: -40, altitude: reduced ? 2.5 : 4.2 });

  // ── rings ──
  function refreshRings() {
    if (reduced) { globe.ringsData([]); return; }
    const data = [...ringScope];
    if (boostDatum) data.push(boostDatum);
    if (burstDatum) data.push(burstDatum);
    globe.ringsData(data);
  }

  // ── polygons ──
  let featureByName = null;
  async function loadPolygons() {
    try {
      const res = await fetch(ATLAS_URL);
      if (!res.ok) throw new Error(`atlas http ${res.status}`);
      const atlas = await res.json();
      const feats = window.topojson.feature(atlas, atlas.objects.countries).features;
      featureByName = new Map(feats.map(f => [f.properties.name, f]));
    } catch (err) {
      console.warn('[atlas] countries unavailable — region highlight disabled', err);
      featureByName = null;
    }
  }

  function setPolygonCountries(countryNames) {
    if (!featureByName) return;         // atlas failed/not loaded: camera + dimming still work
    const feats = [];
    for (const c of countryNames) {
      const f = featureByName.get(ATLAS_NAME_MAP[c] || c);
      if (f) feats.push(f);
      else console.warn('[atlas] no polygon for', c);
    }
    globe.polygonsData(feats);
  }

  return {
    globe,
    markerEls,
    flyTo: (pov, ms) => globe.pointOfView(pov, ms),
    getPov: () => globe.pointOfView(),
    setAutoRotate(on) { controls.autoRotate = on; },
    setControlsEnabled(on) { controls.enabled = on; },
    setRingScope(list) {
      ringScope = list.filter(g => g.status === 'ACTIVE');
      refreshRings();
    },
    setBoost(g) {
      boostDatum = g ? { lat: g.lat, lng: g.lng, __boost: true } : null;
      refreshRings();
    },
    burstAt(g) {
      clearTimeout(burstTimer);
      burstDatum = { lat: g.lat, lng: g.lng, __burst: true };
      refreshRings();
      burstTimer = setTimeout(() => { burstDatum = null; refreshRings(); }, 1400);
    },
    loadPolygons,
    setPolygonCountries,
    resize() { globe.width(window.innerWidth).height(window.innerHeight); },
  };
}
