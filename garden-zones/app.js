/* ──────────────────────────────────────────────
   Plant Zone Finder — app.js
────────────────────────────────────────────── */

// ── Season helpers ─────────────────────────────
let _lastSeasonBg = null;

function getSeasonForMonth(m, southern = false) {
  // Flip 6 months for Southern Hemisphere
  if (southern) m = ((m - 1 + 6) % 12) + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

function updateSeasonBg() {
  const config = COUNTRY_CONFIG[currentCountry];
  const season = getSeasonForMonth(currentMonth, config?.southern || false);
  if (season === _lastSeasonBg) return;
  _lastSeasonBg = season;
  const el = document.getElementById('season-bg');
  if (el) el.style.backgroundImage = `url('./data/${season}-bg.svg')`;
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Zone number → hex color  (1=deep blue → 13=deep red)
const ZONE_COLORS = {
  1:  '#7ecef4', 2:  '#5bb8f0', 3:  '#3fa3eb',
  4:  '#7bc67a', 5:  '#5ab35a', 6:  '#39a038',
  7:  '#c8d955', 8:  '#f0e040', 9:  '#f0b020',
  10: '#f07020', 11: '#e04010', 12: '#cc2000', 13: '#aa0000'
};

// Named climate zones (international)
const NAMED_ZONE_COLORS = {
  tropical:    '#e04010',
  subtropical: '#f07020',
  arid:        '#d4a044',
  temperate:   '#5ab35a',
  warm:        '#c8d955',
  cool:        '#5bb8f0',
};

function getZoneColor(zone) {
  const num = parseInt(zone, 10);
  if (!isNaN(num)) return ZONE_COLORS[num] || '#888888';
  return NAMED_ZONE_COLORS[(zone || '').toLowerCase()] || '#888888';
}

// ── Country config ─────────────────────────────
const COUNTRY_CONFIG = {
  us: {
    zonesFile:    './data/zones.geojson',
    plantingFile: './data/planting.json',
    center:       [38, -97],
    bounds:       [[24, -125], [50, -66]],
    southern:     false,
    geocodeCCs:   'us',
    zoneLabel:    z => `Hardiness Zone ${z.toUpperCase()}`,
    flag:         '🇺🇸',
    name:         'United States',
  },
  au: {
    zonesFile:    './data/au_zones.geojson',
    plantingFile: './data/gardenate_au.json',
    center:       [-27, 133],
    bounds:       [[-44, 113], [-10, 154]],
    southern:     true,
    geocodeCCs:   'au',
    zoneLabel:    z => `${z.charAt(0).toUpperCase() + z.slice(1)} Climate Zone`,
    flag:         '🇦🇺',
    name:         'Australia',
  },
  ca: {
    zonesFile:    './data/ca_zones.geojson',
    plantingFile: './data/gardenate_ca.json',
    center:       [56, -96],
    bounds:       [[42, -141], [83, -53]],
    southern:     false,
    geocodeCCs:   'ca',
    zoneLabel:    z => `Plant Hardiness Zone ${z.toUpperCase()}`,
    flag:         '🇨🇦',
    name:         'Canada',
  },
  uk: {
    zonesFile:    './data/uk_zones.geojson',
    plantingFile: './data/gardenate_uk.json',
    center:       [54, -2],
    bounds:       [[49, -11], [61, 3]],
    southern:     false,
    geocodeCCs:   'gb',
    zoneLabel:    z => `${z.charAt(0).toUpperCase() + z.slice(1)}/Temperate Zone`,
    flag:         '🇬🇧',
    name:         'United Kingdom',
  },
  nz: {
    zonesFile:    './data/nz_zones.geojson',
    plantingFile: './data/gardenate_nz.json',
    center:       [-41, 173],
    bounds:       [[-48, 165], [-34, 179]],
    southern:     true,
    geocodeCCs:   'nz',
    zoneLabel:    z => `${z.charAt(0).toUpperCase() + z.slice(1)} Climate Zone`,
    flag:         '🇳🇿',
    name:         'New Zealand',
  },
};


// ── State ─────────────────────────────────────
let map, zonesLayer, selectedLayer;
let zonesData = null;       // GeoJSON FeatureCollection
let plantingData = null;    // planting JSON
let cropData = null;        // crops.json

let selectedFeature = null;
let selectedZone = null;    // e.g. "7b" or "temperate"
let currentMonth = new Date().getMonth() + 1;  // 1-12
let currentCountry = 'us';

let searchDebounceTimer = null;
let geocodeController = null;

// ── Entry point ───────────────────────────────
document.addEventListener('DOMContentLoaded', loadData);

// ── Data loading ──────────────────────────────
async function loadData() {
  const config = COUNTRY_CONFIG[currentCountry];
  setLoadingText('Loading zone data…');
  try {
    const [zonesRes, plantingRes, cropsRes] = await Promise.all([
      fetch(config.zonesFile),
      fetch(config.plantingFile),
      fetch('./data/crops.json')
    ]);
    if (!zonesRes.ok) throw new Error(`zones: ${zonesRes.status}`);
    if (!plantingRes.ok) throw new Error(`planting: ${plantingRes.status}`);

    zonesData = await zonesRes.json();
    plantingData = await plantingRes.json();
    cropData = cropsRes.ok ? await cropsRes.json() : {};

    normalizeZoneProperties();
    initMap();
    initUI();
  } catch (err) {
    setLoadingText('Failed to load data: ' + err.message);
    console.error(err);
  }
}

async function switchCountry(cc) {
  if (cc === currentCountry) return;
  currentCountry = cc;
  const config = COUNTRY_CONFIG[cc];

  // Reset selection
  selectedFeature = null;
  selectedLayer = null;
  selectedZone = null;
  hidePanel();
  _lastSeasonBg = null;

  document.getElementById('loading-overlay').classList.remove('hidden');
  setLoadingText('Loading zone data…');

  try {
    const [zonesRes, plantingRes] = await Promise.all([
      fetch(config.zonesFile),
      fetch(config.plantingFile),
    ]);
    if (!zonesRes.ok) throw new Error(`zones: ${zonesRes.status}`);
    if (!plantingRes.ok) throw new Error(`planting: ${plantingRes.status}`);

    zonesData = await zonesRes.json();
    plantingData = await plantingRes.json();

    normalizeZoneProperties();

    if (zonesLayer) map.removeLayer(zonesLayer);
    zonesLayer = L.geoJSON(zonesData, {
      style: styleFeature,
      onEachFeature: attachFeature,
    }).addTo(map);

    map.fitBounds(config.bounds);
    updateSeasonBg();
    document.getElementById('loading-overlay').classList.add('hidden');
  } catch (err) {
    setLoadingText('Failed: ' + err.message);
    console.error(err);
  }
}

// Normalize inconsistent property names across GeoJSON sources
function normalizeZoneProperties() {
  for (const f of zonesData.features) {
    const p = f.properties;
    if (!p.zone) {
      if (p.Zone) p.zone = p.Zone;
      else if (p.ZONE) p.zone = p.ZONE;
      else if (p.gridcode) p.zone = gridcodeToZone(p.gridcode);
    }
    if (p.zone) p.zone = String(p.zone).toLowerCase().trim();
    if (!p.trange) {
      if (p.Trange) p.trange = p.Trange;
      else if (p.TRANGE) p.trange = p.TRANGE;
      else if (p.temprange) p.trange = p.temprange;
      else p.trange = '';
    }
  }
}

// Convert USDA gridcode (1-26) to zone string ("1a","1b","2a","2b",...)
function gridcodeToZone(code) {
  const n = parseInt(code, 10);
  if (isNaN(n) || n < 1 || n > 28) return String(code);
  const num = Math.ceil(n / 2);
  const half = n % 2 === 1 ? 'a' : 'b';
  return `${num}${half}`;
}

// ── Map initialization ─────────────────────────
function initMap() {
  const config = COUNTRY_CONFIG[currentCountry];
  const container = document.getElementById('globe-container');
  map = L.map(container, { center: config.center, zoom: 4, minZoom: 2, maxZoom: 12 });
  zonesLayer = L.geoJSON(zonesData, {
    style: styleFeature,
    onEachFeature: attachFeature
  }).addTo(map);
  map.fitBounds(config.bounds);
  document.getElementById('loading-overlay').classList.add('hidden');
}

function styleFeature(feature) {
  const zone = feature.properties.zone || '';
  return {
    fillColor: getZoneColor(zone),
    fillOpacity: 1.0,
    color: '#fff',
    weight: 0.3,
    opacity: 0.4
  };
}

function attachFeature(feature, layer) {
  const zone = feature.properties.zone || '?';
  const trange = feature.properties.trange || '';
  const config = COUNTRY_CONFIG[currentCountry];
  const label = config.zoneLabel(zone);
  layer.bindTooltip(
    `<strong>${label}</strong>${trange ? '<br>' + trange : ''}`,
    { sticky: true }
  );
  layer.on('click', () => onZoneClick(feature, layer));
}

// ── Zone interaction ───────────────────────────
function onZoneClick(feature, layer) {
  if (!feature) return;
  selectedFeature = feature;
  selectedLayer = layer;
  selectedZone = feature.properties.zone || null;
  highlightZone();
  renderPanel();
  showPanel();
}

function highlightZone() {
  zonesLayer.resetStyle();
  if (selectedLayer) {
    selectedLayer.setStyle({ fillOpacity: 1.0, weight: 3, color: '#fff', opacity: 1 });
  }
}

function selectZoneByPoint(lat, lng) {
  const pt = turf.point([lng, lat]);
  let found = false;
  zonesLayer.eachLayer(layer => {
    if (found) return;
    try {
      if (layer.feature && turf.booleanPointInPolygon(pt, layer.feature)) {
        found = true;
        onZoneClick(layer.feature, layer);
      }
    } catch (_) {}
  });
  return found;
}

// ── Info panel ─────────────────────────────────
function showPanel() {
  document.getElementById('info-panel').classList.remove('panel-hidden');
}

function hidePanel() {
  document.getElementById('info-panel').classList.add('panel-hidden');
}

function renderPanel() {
  if (!selectedZone) return;

  const zone  = selectedZone;
  const month = currentMonth;
  const config = COUNTRY_CONFIG[currentCountry];

  // Zone badge
  const color = getZoneColor(zone);
  const badge = document.getElementById('zone-badge');
  badge.textContent = zone.toUpperCase();
  badge.style.background = color + '33';
  badge.style.borderColor = color;
  badge.style.color = color;

  document.getElementById('zone-name').textContent = config.zoneLabel(zone);
  const trange = selectedFeature?.properties?.trange || '';
  document.getElementById('zone-temp').textContent = trange ? `Avg min: ${trange}` : '';

  document.getElementById('month-display').textContent = MONTH_NAMES[month];

  const data = getPlantingData(zone, month);
  const sections = ['startIndoors', 'directSow', 'transplant', 'harvest'];
  let hasAny = false;

  for (const key of sections) {
    const items = data[key] || [];
    const section = document.getElementById(`section-${key}`);
    const list = document.getElementById(`list-${key}`);
    if (items.length > 0) {
      hasAny = true;
      list.innerHTML = items.map(renderCropItem).join('');
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  }

  document.getElementById('no-tasks').style.display = hasAny ? 'none' : 'block';
}

function getPlantingData(zoneStr, month) {
  const monthKey = String(month);
  if (plantingData[zoneStr]?.[monthKey]) {
    return plantingData[zoneStr][monthKey];
  }
  const nearest = findNearestZone(zoneStr);
  if (nearest && plantingData[nearest]?.[monthKey]) {
    return plantingData[nearest][monthKey];
  }
  return { startIndoors: [], directSow: [], transplant: [], harvest: [] };
}

function findNearestZone(zoneStr) {
  const availableZones = Object.keys(plantingData);
  if (!availableZones.length) return null;

  const zoneNumber = parseFloat(zoneStr);
  if (isNaN(zoneNumber)) return availableZones[0];

  let best = null, bestDist = Infinity;
  for (const z of availableZones) {
    const dist = Math.abs(parseFloat(z) - zoneNumber);
    if (dist < bestDist) { bestDist = dist; best = z; }
  }
  return best;
}

// ── UI initialization ──────────────────────────
function initUI() {
  initMonthSlider();
  initSearch();
  initPanelListeners();
  initCropModal();
  initCountrySelector();
}

function initMonthSlider() {
  const slider = document.getElementById('month-slider');
  slider.value = currentMonth;
  updateMonthLabels();
  updateSeasonBg();

  slider.addEventListener('input', () => {
    currentMonth = parseInt(slider.value, 10);
    updateMonthLabels();
    updateSeasonBg();
    if (selectedZone) renderPanel();
  });

  document.getElementById('month-labels').addEventListener('click', e => {
    const el = e.target.closest('[data-month]');
    if (!el) return;
    currentMonth = parseInt(el.dataset.month, 10);
    slider.value = currentMonth;
    updateMonthLabels();
    updateSeasonBg();
    if (selectedZone) renderPanel();
  });
}

function updateMonthLabels() {
  document.querySelectorAll('#month-labels span').forEach(span => {
    span.classList.toggle('active', parseInt(span.dataset.month, 10) === currentMonth);
  });
}

function initPanelListeners() {
  document.getElementById('panel-close').addEventListener('click', hidePanel);

  const content = document.getElementById('panel-content');
  content.addEventListener('click', e => {
    const card = e.target.closest('.crop-card');
    if (card?.dataset.crop) openCropDetail(card.dataset.crop);
  });
  content.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.crop-card');
      if (card?.dataset.crop) { e.preventDefault(); openCropDetail(card.dataset.crop); }
    }
  });
}

function initCountrySelector() {
  const sel = document.getElementById('country-select');
  if (!sel) return;
  sel.value = currentCountry;
  sel.addEventListener('change', () => switchCountry(sel.value));
}

function initSearch() {
  const input = document.getElementById('address-input');
  const btn = document.getElementById('search-btn');

  btn.addEventListener('click', triggerSearch);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') triggerSearch();
  });

  input.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      const val = input.value.trim();
      if (val.length > 3) triggerSearch();
    }, 500);
  });
}

function triggerSearch() {
  const val = document.getElementById('address-input').value.trim();
  if (!val) return;
  onAddressSearch(val);
}

// ── Address search ─────────────────────────────
async function onAddressSearch(address) {
  const btn = document.getElementById('search-btn');
  btn.textContent = '…';
  btn.disabled = true;

  if (geocodeController) geocodeController.abort();
  geocodeController = new AbortController();

  try {
    const result = await nominatimGeocode(address, geocodeController.signal);
    if (!result) { showToast('Address not found'); return; }
    const { lat, lon } = result;
    const found = selectZoneByPoint(lat, lon);
    if (!found) showToast('No planting zone found at that location');
    zoomToPoint(lat, lon);
    map.once('moveend', highlightZone);
  } catch (err) {
    if (err.name !== 'AbortError') {
      showToast('Geocoding error: ' + err.message);
      console.error(err);
    }
  } finally {
    btn.textContent = 'Go';
    btn.disabled = false;
  }
}

async function nominatimGeocode(address, signal) {
  const config = COUNTRY_CONFIG[currentCountry];
  const params = { q: address, format: 'json', limit: 1 };
  if (config.geocodeCCs) params.countrycodes = config.geocodeCCs;

  const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams(params);
  const res = await fetch(url, { signal, headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

function zoomToPoint(lat, lng) {
  map.flyTo([lat, lng], 9, { duration: 1.5 });
}

// ── Crop card rendering ────────────────────────
function renderCropItem(name) {
  const c = cropData && cropData[name];
  if (!c) return `<li class="crop-plain">${name}</li>`;
  return `<li class="crop-card" data-crop="${name}" role="button" tabindex="0" aria-label="${name} — tap for details">
    <div class="crop-card-body">
      <div class="crop-title">${c.emoji || '🌱'} ${name}</div>
      <div class="crop-detail">${c.depth} deep · ${c.spacing} apart · ${c.water} · ${c.days}</div>
      ${c.tip ? `<div class="crop-tip">${c.tip}</div>` : ''}
    </div>
    <span class="crop-card-chevron" aria-hidden="true">›</span>
  </li>`;
}

// ── Crop detail modal ──────────────────────────
function initCropModal() {
  const modal = document.getElementById('crop-modal');
  document.getElementById('modal-close').addEventListener('click', () => modal.close());
  modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
}

function openCropDetail(name) {
  const c = cropData && cropData[name];
  if (!c) return;
  const modal = document.getElementById('crop-modal');
  document.getElementById('modal-emoji').textContent = c.emoji || '🌱';
  document.getElementById('modal-crop-name').textContent = name;
  const badge = document.getElementById('modal-difficulty');
  badge.textContent = c.difficulty || '';
  badge.className = 'difficulty-badge' + (c.difficulty ? ' difficulty-' + c.difficulty.toLowerCase() : '');
  document.getElementById('modal-body').innerHTML = renderCropDetail(c);
  document.getElementById('modal-body').scrollTop = 0;
  if (!modal.open) modal.showModal();
}

function renderCropDetail(c) {
  function row(label, value) {
    if (!value) return '';
    return `<div class="detail-row"><span class="detail-label">${label}</span><span>${value}</span></div>`;
  }
  function tagList(arr, extraClass) {
    if (!arr || !arr.length) return '<span class="detail-empty">None listed</span>';
    return arr.map(t => `<span class="detail-tag${extraClass ? ' ' + extraClass : ''}">${t}</span>`).join('');
  }

  return `
    <div class="modal-section">
      <div class="modal-section-title">Growing Basics</div>
      ${row('Depth', c.depth)}
      ${row('Spacing', c.spacing)}
      ${row('Water', c.water)}
      ${row('Sun', c.sun)}
      ${row('Days to harvest', c.days)}
      ${row('Germination temp', c.germ_temp)}
      ${row('Soil pH', c.soil_ph)}
      ${row('Fertilizer', c.fertilizer)}
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Companions &amp; Enemies</div>
      <div class="detail-row"><span class="detail-label">Plant with</span><span class="detail-tags">${tagList(c.companions, 'detail-tag--companions')}</span></div>
      <div class="detail-row"><span class="detail-label">Avoid near</span><span class="detail-tags">${tagList(c.avoid, 'detail-tag--avoid')}</span></div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Pests &amp; Problems</div>
      <div class="detail-tags detail-tags--pests">${tagList(c.pests, 'detail-tag--pests')}</div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Harvest &amp; Storage</div>
      ${row('Harvest cues', c.harvest_cues)}
      ${row('Storage', c.storage)}
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Popular Varieties</div>
      <div class="detail-tags">${tagList(c.varieties)}</div>
    </div>
    ${c.tip ? `<div class="modal-section modal-section--tip"><div class="modal-tip">💡 ${c.tip}</div></div>` : ''}
  `;
}

// ── Helpers ────────────────────────────────────
function setLoadingText(msg) {
  const el = document.getElementById('loading-text');
  if (el) el.textContent = msg;
}

let toastTimer = null;
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}
