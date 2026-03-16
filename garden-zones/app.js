/* ──────────────────────────────────────────────
   Plant Zone Finder — app.js
────────────────────────────────────────────── */

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

const SEASONS = {
  spring: { label: 'Spring', months: [3, 4, 5] },
  summer: { label: 'Summer', months: [6, 7, 8] },
  autumn: { label: 'Autumn', months: [9, 10, 11] },
  winter: { label: 'Winter', months: [12, 1, 2] }
};
const SEASON_ORDER = ['spring', 'summer', 'autumn', 'winter'];

// ── State ─────────────────────────────────────
let map, zonesLayer, selectedLayer;
let zonesData = null;       // GeoJSON FeatureCollection
let plantingData = null;    // planting.json
let cropData = null;        // crops.json

let selectedFeature = null;
let selectedZone = null;    // e.g. "7b"
let currentMonth = new Date().getMonth() + 1;  // 1-12
let currentSeason = null;

let searchDebounceTimer = null;
let geocodeController = null;

// ── Entry point ───────────────────────────────
document.addEventListener('DOMContentLoaded', loadData);

// ── Data loading ──────────────────────────────
async function loadData() {
  setLoadingText('Loading zone data…');
  try {
    const [zonesRes, plantingRes, cropsRes] = await Promise.all([
      fetch('./data/zones.geojson'),
      fetch('./data/planting.json'),
      fetch('./data/crops.json')
    ]);
    if (!zonesRes.ok) throw new Error(`zones.geojson: ${zonesRes.status}`);
    if (!plantingRes.ok) throw new Error(`planting.json: ${plantingRes.status}`);

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

// Normalize inconsistent property names across GeoJSON sources
function normalizeZoneProperties() {
  for (const f of zonesData.features) {
    const p = f.properties;
    // Normalize zone string
    if (!p.zone) {
      if (p.Zone) p.zone = p.Zone;
      else if (p.ZONE) p.zone = p.ZONE;
      else if (p.gridcode) p.zone = gridcodeToZone(p.gridcode);
    }
    // Ensure zone is lowercase string e.g. "7b"
    if (p.zone) p.zone = String(p.zone).toLowerCase().trim();

    // Normalize temperature range
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
  const container = document.getElementById('globe-container');
  map = L.map(container, { center: [38, -97], zoom: 4, minZoom: 3, maxZoom: 12 });
  zonesLayer = L.geoJSON(zonesData, {
    style: styleFeature,
    onEachFeature: attachFeature
  }).addTo(map);
  map.fitBounds([[24, -125], [50, -66]]);
  document.getElementById('loading-overlay').classList.add('hidden');
}

function styleFeature(feature) {
  const zone = feature.properties.zone || '';
  const num = parseInt(zone, 10);
  return {
    fillColor: ZONE_COLORS[num] || '#888888',
    fillOpacity: 0.65,
    color: '#fff',
    weight: 0.3,
    opacity: 0.4
  };
}

function attachFeature(feature, layer) {
  const zone = feature.properties.zone || '?';
  const trange = feature.properties.trange || '';
  layer.bindTooltip(
    `<strong>Zone ${zone}</strong>${trange ? '<br>' + trange : ''}`,
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
    selectedLayer.setStyle({ fillOpacity: 0.9, weight: 2, color: '#fff' });
  }
}

function selectZoneByString(zoneStr) {
  const target = zoneStr.toLowerCase().trim();
  let found = false;
  zonesLayer.eachLayer(layer => {
    if (!found && layer.feature && layer.feature.properties.zone === target) {
      found = true;
      onZoneClick(layer.feature, layer);
    }
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

  const zone = selectedZone;
  const month = currentMonth;

  // Zone badge color
  const num = parseInt(zone, 10);
  const color = ZONE_COLORS[num] || '#888888';
  const badge = document.getElementById('zone-badge');
  badge.textContent = zone.toUpperCase();
  badge.style.background = color + '33';
  badge.style.borderColor = color;
  badge.style.color = color;

  document.getElementById('zone-name').textContent = `Hardiness Zone ${zone.toUpperCase()}`;
  const trange = selectedFeature?.properties?.trange || '';
  document.getElementById('zone-temp').textContent = trange
    ? `Avg min: ${trange}`
    : '';

  document.getElementById('month-display').textContent = MONTH_NAMES[month];

  // Get planting data — fall back to nearest zone if exact key missing
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

  const noTasks = document.getElementById('no-tasks');
  noTasks.style.display = hasAny ? 'none' : 'block';
}

function getPlantingData(zoneStr, month) {
  const monthKey = String(month);
  // Try exact match
  if (plantingData[zoneStr]?.[monthKey]) {
    return plantingData[zoneStr][monthKey];
  }
  // Fall back to nearest available zone
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

  let best = null;
  let bestDist = Infinity;
  for (const z of availableZones) {
    const dist = Math.abs(parseFloat(z) - zoneNumber);
    if (dist < bestDist) {
      bestDist = dist;
      best = z;
    }
  }
  return best;
}

// ── UI initialization ──────────────────────────
function initUI() {
  initSeasonTabs();
  initSearch();
  initPanelListeners();
  initCropModal();
}

function initSeasonTabs() {
  currentSeason = getSeasonForMonth(currentMonth);
  renderSeasonTabs();
  renderMonthTabs();
  document.querySelectorAll('.season-btn').forEach(btn =>
    btn.addEventListener('click', () => onSeasonClick(btn.dataset.season))
  );
}

function onSeasonClick(season) {
  currentSeason = season;
  currentMonth = SEASONS[season].months[0];
  renderSeasonTabs();
  renderMonthTabs();
  if (selectedZone) renderPanel();
}

function getSeasonForMonth(m) {
  for (const [key, s] of Object.entries(SEASONS))
    if (s.months.includes(m)) return key;
  return 'spring';
}

function renderSeasonTabs() {
  document.querySelectorAll('.season-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.season === currentSeason)
  );
}

function renderMonthTabs() {
  const container = document.getElementById('month-tabs');
  container.innerHTML = SEASONS[currentSeason].months
    .map(m => `<button class="month-btn${m === currentMonth ? ' active' : ''}" data-month="${m}">${MONTH_NAMES[m]}</button>`)
    .join('');
  container.querySelectorAll('.month-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      currentMonth = parseInt(btn.dataset.month);
      renderMonthTabs();
      if (selectedZone) renderPanel();
    })
  );
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

function initSearch() {
  const input = document.getElementById('address-input');
  const btn = document.getElementById('search-btn');

  btn.addEventListener('click', triggerSearch);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') triggerSearch();
  });

  // 500ms debounce for auto-search as you type
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

  // Cancel any in-flight geocode
  if (geocodeController) geocodeController.abort();
  geocodeController = new AbortController();

  try {
    const result = await nominatimGeocode(address, geocodeController.signal);
    if (!result) {
      showToast('Address not found');
      return;
    }
    const { lat, lon } = result;
    const zone = pointInPolygon(lat, lon);
    if (!zone) {
      showToast('No planting zone found at that location');
      zoomToPoint(lat, lon);
      return;
    }
    selectZoneByString(zone);
    zoomToPoint(lat, lon);
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
  const url = `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({
      q: address,
      format: 'json',
      limit: 1,
      countrycodes: 'us'
    });

  const res = await fetch(url, {
    signal,
    headers: { 'Accept-Language': 'en' }
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

function pointInPolygon(lat, lng) {
  if (!zonesData) return null;
  const pt = turf.point([lng, lat]);
  for (const feature of zonesData.features) {
    try {
      if (turf.booleanPointInPolygon(pt, feature)) {
        return feature.properties.zone || null;
      }
    } catch (_) {
      // Skip malformed polygons
    }
  }
  return null;
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
  // Escape key is native to <dialog> — no listener needed
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
