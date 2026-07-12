/* ═══════════════════════════════════════════════════════════════════════
   STATE — interaction state machine + camera choreography

     AMBIENT ──region──► REGION_FOCUS ──country──► COUNTRY_FOCUS
        ▲  ▲                 │  ▲                       │
        │  └───── "ALL" ─────┘  └──── "ALL COUNTRIES" ──┘
        │
        └────────────── GATEWAY_DETAIL (from any state; snapshots return)

   Every camera move bumps `camToken`; delayed callbacks only fire if the
   token is still current, so filter-spam can never strand autoRotate.
   ═══════════════════════════════════════════════════════════════════════ */

import {
  REGIONS, gatewaysInScope, countriesInRegion, counts, regionOfCountry,
} from './data.js';

const MOBILE = window.matchMedia('(max-width: 640px)');

let G = null;          // globe api (globe.js)
let U = null;          // ui api (ui.js)
let REDUCED = false;
let camToken = 0;

const S = {
  mode: 'AMBIENT',     // AMBIENT | REGION_FOCUS | COUNTRY_FOCUS | GATEWAY_DETAIL
  region: 'ALL',
  country: 'ALL',
  gateway: null,
  snap: null,          // {mode, region, country} captured on entering GATEWAY_DETAIL
};

export const actions = { setRegion, setCountry, openGateway, closeGateway, handleEscape };

export function initState(globeApi, uiApi, opts = {}) {
  G = globeApi;
  U = uiApi;
  REDUCED = !!opts.reduced;
  applyScopeVisuals();   // initial rings + HUD counts (SCOPE: GLOBAL)
}

/* ── helpers ─────────────────────────────────────────────────────────── */

const dur = ms => (REDUCED ? 300 : ms);
const bumpToken = () => ++camToken;

const scoped = () => gatewaysInScope(S.region, S.country);

function scopeLabel() {
  if (S.country !== 'ALL') return `SCOPE: ${S.country.toUpperCase()} · ${scoped().length} SITES`;
  if (S.region !== 'ALL') return `SCOPE: ${S.region} · ${scoped().length} SITES`;
  return 'SCOPE: GLOBAL';
}

// Arithmetic centroid is safe here: no country in the dataset spans the
// antimeridian. Revisit if real data adds one (e.g. Fiji, Kiribati).
function centroidPov(list) {
  const lat = list.reduce((s, g) => s + g.lat, 0) / list.length;
  const lng = list.reduce((s, g) => s + g.lng, 0) / list.length;
  return { lat, lng, altitude: list.length === 1 ? 1.0 : 1.35 };
}

function resumeRotateAfter(token, delay) {
  setTimeout(() => {
    if (token === camToken && S.mode === 'AMBIENT' && !REDUCED) G.setAutoRotate(true);
  }, delay);
}

/* Markers dim/highlight + rings + polygons + HUD, from current scope. */
function applyScopeVisuals() {
  const inScope = new Set(scoped().map(g => g.id));
  for (const [id, el] of G.markerEls) {
    el.classList.toggle('is-dimmed', !inScope.has(id));
    if (S.mode !== 'GATEWAY_DETAIL') el.classList.remove('is-backgrounded', 'is-selected');
  }

  G.setRingScope(scoped());

  if (S.country !== 'ALL') G.setPolygonCountries([S.country]);
  else if (S.region !== 'ALL') G.setPolygonCountries(countriesInRegion(S.region));
  else G.setPolygonCountries([]);

  U.setScopeHud(counts(scoped()), scopeLabel());
}

/* ── filter transitions ──────────────────────────────────────────────── */

function setRegion(region) {
  if (S.mode === 'GATEWAY_DETAIL') closeGateway({ toFilter: true });
  S.region = region;
  S.country = 'ALL';
  U.setRegionActive(region);
  U.populateCountries(region, 'ALL');
  region === 'ALL' ? enterAmbient() : focusRegion();
}

function setCountry(country) {
  if (S.mode === 'GATEWAY_DETAIL') closeGateway({ toFilter: true });

  if (country === 'ALL') {
    S.country = 'ALL';
    S.region === 'ALL' ? enterAmbient() : focusRegion();
    return;
  }

  // Country picked while region=ALL → infer and reflect the region too.
  if (S.region === 'ALL') {
    S.region = regionOfCountry(country);
    U.setRegionActive(S.region);
    U.populateCountries(S.region, country);
  }

  S.country = country;
  S.mode = 'COUNTRY_FOCUS';
  bumpToken();
  G.setAutoRotate(false);              // always before pointOfView — no endpoint drift
  applyScopeVisuals();
  G.flyTo(centroidPov(scoped()), dur(1200));
}

function focusRegion() {
  S.mode = 'REGION_FOCUS';
  bumpToken();
  G.setAutoRotate(false);
  applyScopeVisuals();
  G.flyTo(REGIONS[S.region].pov, dur(1400));
}

function enterAmbient() {
  S.mode = 'AMBIENT';
  const token = bumpToken();
  G.setAutoRotate(false);
  applyScopeVisuals();
  const cur = G.getPov();              // pull back on the current heading — no yank
  G.flyTo({ lat: cur.lat, lng: cur.lng, altitude: 2.5 }, dur(1000));
  resumeRotateAfter(token, dur(1000) + 100);
}

/* ── gateway detail showcase ─────────────────────────────────────────── */

function openGateway(g) {
  if (S.mode === 'GATEWAY_DETAIL') {
    if (S.gateway && S.gateway.id === g.id) return;
    U.closeCard();                     // swapping gateways: keep the ORIGINAL snapshot
  } else {
    S.snap = { mode: S.mode, region: S.region, country: S.country };
  }

  S.mode = 'GATEWAY_DETAIL';
  S.gateway = g;
  const token = bumpToken();

  // t=0 — freeze world, spotlight the node, launch the shockwave + camera
  G.setAutoRotate(false);
  G.setControlsEnabled(false);
  U.hideTooltip();

  for (const [id, el] of G.markerEls) {
    el.classList.toggle('is-selected', id === g.id);
    el.classList.toggle('is-backgrounded', id !== g.id);
    el.classList.remove('is-dimmed');
  }

  G.setBoost(g);
  if (!REDUCED) G.burstAt(g);

  // +14° lng puts the node left-of-center, clear of the card;
  // mobile offsets latitude instead so the node clears the bottom sheet.
  const pov = MOBILE.matches
    ? { lat: g.lat - 10, lng: g.lng, altitude: 0.85 }
    : { lat: g.lat, lng: g.lng + 14, altitude: 0.75 };
  G.flyTo(pov, dur(1600));

  // t=650 — card lands as the camera decelerates
  setTimeout(() => { if (token === camToken) U.openCard(g); }, REDUCED ? 80 : 650);
  // t=1600 — camera arrived; the user may nudge the orbit while reading
  setTimeout(() => { if (token === camToken) G.setControlsEnabled(true); }, dur(1600));
}

function closeGateway({ toFilter = false } = {}) {
  if (S.mode !== 'GATEWAY_DETAIL') return;
  const g = S.gateway;
  const snap = S.snap || { mode: 'AMBIENT', region: 'ALL', country: 'ALL' };

  U.closeCard();
  G.setBoost(null);
  G.setControlsEnabled(true);
  S.gateway = null;
  S.snap = null;

  if (toFilter) {
    // A filter change closed the card: the caller owns the next camera
    // move and visuals; just fall out of detail mode.
    S.mode = snap.mode;
    return;
  }

  S.mode = snap.mode;
  S.region = snap.region;
  S.country = snap.country;
  const token = bumpToken();
  applyScopeVisuals();

  let pov;
  if (snap.mode === 'COUNTRY_FOCUS') pov = centroidPov(scoped());
  else if (snap.mode === 'REGION_FOCUS') pov = REGIONS[snap.region].pov;
  else pov = { lat: g.lat, lng: g.lng, altitude: 2.5 };   // pull straight up, no yank

  const fly = dur(1200);
  setTimeout(() => { if (token === camToken) G.flyTo(pov, fly); }, 120);
  if (snap.mode === 'AMBIENT') resumeRotateAfter(token, 120 + fly + 100);
}

function handleEscape() {
  if (S.mode === 'GATEWAY_DETAIL') { closeGateway(); return; }
  if (S.region !== 'ALL' || S.country !== 'ALL') setRegion('ALL');
}
