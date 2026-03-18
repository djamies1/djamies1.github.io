/* ──────────────────────────────────────────────
   Plant Zone Finder — app.js
────────────────────────────────────────────── */

// ── Season helpers ─────────────────────────────
let _lastSeasonBg = null;

function getSeasonForMonth(m) {
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

function updateSeasonBg() {
  const season = getSeasonForMonth(currentMonth);
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

// ── Frost dates by zone ────────────────────────
// Approximate average last/first frost dates (null = frost-free)
const FROST_DATES = {
  '1':   { last: 'Jul 15', first: 'Aug 15' },
  '2':   { last: 'Jun 15', first: 'Sep 1'  },
  '3a':  { last: 'Jun 1',  first: 'Sep 10' },
  '3b':  { last: 'May 15', first: 'Sep 20' },
  '4a':  { last: 'May 15', first: 'Sep 25' },
  '4b':  { last: 'May 1',  first: 'Oct 1'  },
  '5a':  { last: 'May 1',  first: 'Oct 7'  },
  '5b':  { last: 'Apr 15', first: 'Oct 15' },
  '6a':  { last: 'Apr 15', first: 'Oct 31' },
  '6b':  { last: 'Apr 1',  first: 'Nov 1'  },
  '7a':  { last: 'Apr 1',  first: 'Nov 15' },
  '7b':  { last: 'Mar 15', first: 'Nov 15' },
  '8a':  { last: 'Mar 1',  first: 'Dec 1'  },
  '8b':  { last: 'Feb 15', first: 'Dec 15' },
  '9a':  { last: 'Feb 1',  first: 'Dec 15' },
  '9b':  { last: 'Jan 15', first: 'Dec 31' },
  '10a': { last: 'Jan 15', first: null      },
  '10b': { last: null,     first: null      },
  '11a': { last: null,     first: null      },
  '11b': { last: null,     first: null      },
  '12a': { last: null,     first: null      },
  '12b': { last: null,     first: null      },
  '13a': { last: null,     first: null      },
};

// ── Monthly context messages ───────────────────
function getMonthContext(zoneStr, month) {
  const zoneNum = parseInt(zoneStr, 10);
  const warm = zoneNum >= 8;

  const msgs = {
    1:  warm
          ? 'Start warm-season seeds indoors — spring comes early here.'
          : 'Deep winter — order seeds and map out your spring beds.',
    2:  warm
          ? 'Transplant cool-season crops outdoors; start peppers and tomatoes inside.'
          : 'Start onions, leeks, and celery indoors. Spring is closer than it feels.',
    3:  warm
          ? 'Spring is in full swing — plant beans, squash, and cucumbers outdoors.'
          : 'Start peppers, tomatoes, and eggplant indoors 6–8 weeks before last frost.',
    4:  'Last frost is approaching — harden off seedlings and prep your beds.',
    5:  'Transplant season is here. Most frost risk is past — get warm-season crops in.',
    6:  'Early summer: sow succession crops every 2 weeks for a continuous harvest.',
    7:  'Peak summer — water deeply, mulch to retain moisture, and watch for pests.',
    8:  'Late summer: start fall brassicas and root veg now for an autumn harvest.',
    9:  'Cool weather returns — brassicas, carrots, and greens thrive right now.',
    10: 'Harvest season. Plant garlic before the ground freezes for next year.',
    11: warm
          ? 'Cool-season crops are in full swing — one of the best growing months here.'
          : 'Season winding down. Protect tender plants and compost spent beds.',
    12: warm
          ? 'Winter garden is active — plant brassicas, greens, and root veg.'
          : 'Garden rests. Clean tools, review notes, and plan next year\'s layout.',
  };

  return msgs[month] || '';
}

// ── Gardening tips ─────────────────────────────
const TIPS = [
  'Plant tomatoes deep — buried stems develop extra roots, producing stronger plants.',
  'Marigolds repel aphids, nematodes, and whiteflies. Scatter them throughout your garden.',
  'Water in the morning so leaves dry before evening, reducing fungal disease risk.',
  'Succession-sow lettuce every 2 weeks for a continuous harvest all season long.',
  'A 2–3 inch layer of mulch suppresses weeds and keeps soil moisture even.',
  'Pinch off the first flowers on peppers to redirect energy into bigger yields later.',
  'Rotate crop families each year to prevent soil-borne disease and pest buildup.',
  'Corn, beans, and squash — the Three Sisters — grow better together than apart.',
  'Never compost diseased plant material. Pathogens can survive and spread next season.',
  'Harvest herbs in the morning after dew dries for the most intense essential oils.',
  'Garlic planted in autumn produces the largest bulbs the following summer.',
  'Water deeply and infrequently. Shallow watering encourages shallow, weak roots.',
  'Baking soda spray (1 tsp per quart of water) prevents powdery mildew on squash.',
  'Radishes sown alongside carrots break up soil and mark slow-germinating rows.',
  'A soil thermometer is more useful than air temperature for deciding when to plant.',
  'Hardening off is essential — move seedlings outside for 1 more hour per day over 7–10 days.',
  'Parsnips get sweeter after the first frost converts their starches to sugar.',
  'Floating row cover keeps most pests out while letting light through — remove during pollination.',
  'Test your soil pH before planting. Most vegetables prefer a range of 6.0–7.0.',
  'Snap peas taste sweetest when picked young, before seeds bulge through the pod.',
  'Cold frames extend your growing season by 4–6 weeks in both spring and autumn.',
  'Kale and Brussels sprouts taste better after a frost — wait for it.',
  'Tomatoes need consistent moisture to prevent blossom end rot. Mulch keeps it even.',
  'Legumes like beans and peas fix nitrogen from the air into your soil for future crops.',
  'Growing vertically on trellises saves space, improves airflow, and simplifies harvesting.',
  'Asparagus is a 20-year crop — prepare its permanent bed deeply and well.',
  'Interplanting fast and slow crops (lettuce under tomatoes) maximises every square foot.',
  'Watering at the base of plants rather than overhead prevents many leaf diseases.',
  'Earthworms are a sign of healthy soil. Their castings are the finest natural fertiliser.',
  'Borage flowers are edible and attract pollinators to your vegetable beds.',
  'Pinching basil flowers as they appear keeps leaves flavorful and prolific.',
  'Neem oil spray is effective against aphids, mites, and whiteflies — apply at dusk.',
  'Hilling potatoes every 2 weeks as they grow dramatically increases your yield.',
  'Save seeds from your best-performing plants each year for locally adapted varieties.',
  'Green tomatoes will ripen off the vine — store stem-side down at room temperature.',
  'Dill attracts beneficial insects that prey on aphids and caterpillars.',
  'Planting onions near carrots helps deter carrot fly.',
  'Fennel is allelopathic — most vegetables grow poorly near it. Grow it in isolation.',
  'Squash vine borer damage can be prevented by wrapping stem bases with foil or fabric.',
  'Cilantro bolts quickly in heat. Use slow-bolt varieties and sow a new batch monthly.',
  'Cold stratification (a week in the fridge) improves germination of many perennial seeds.',
  'Deadheading herbs that flower encourages bushy, productive regrowth.',
  'Coffee grounds improve drainage and add nitrogen — work them into soil in moderation.',
  'Eggshells around seedling bases can deter slugs and add slow-release calcium.',
  'Hand-pick hornworms at dusk with a torch — they glow under UV light.',
  'Planting basil near tomatoes may improve their flavour and deter certain pests.',
  'A thin layer of compost applied each spring feeds soil life and slowly releases nutrients.',
  'Leeks can be blanched by mounding soil around the stems as they grow.',
  'Rhubarb leaves are toxic — harvest stems only, and never eat the leaves.',
  'Soak large seeds like beans and squash overnight before planting for faster germination.',
  'Companion-plant nasturtiums as a trap crop — aphids prefer them over your vegetables.',
  'Over-watering is the most common cause of seedling death — let soil dry slightly between waterings.',
  'Chives repel aphids and Japanese beetles. Their flowers are also edible.',
  'Hardneck garlic produces edible scapes in early summer — harvest them to boost bulb size.',
  'Plant a cover crop of crimson clover or winter rye in empty beds to feed the soil.',
  'Mint spreads aggressively — grow it in a container buried in the bed to contain roots.',
  'Cucumber beetles can be deterred by planting radishes as a companion.',
  'Direct-sow root vegetables like carrots and parsnips — they dislike transplanting.',
  'The best time to plant a tree was 20 years ago. The second best time is now.',
];

let currentTip = '';


// ── State ─────────────────────────────────────
let map, zonesLayer, selectedLayer;
let zonesData = null;
let plantingData = null;
let cropData = null;

let selectedFeature = null;
let selectedZone = null;
let currentMonth = new Date().getMonth() + 1;

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

    zonesData    = await zonesRes.json();
    plantingData = await plantingRes.json();
    cropData     = cropsRes.ok ? await cropsRes.json() : {};

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
    if (!p.zone) {
      if (p.Zone)     p.zone = p.Zone;
      else if (p.ZONE) p.zone = p.ZONE;
      else if (p.gridcode) p.zone = gridcodeToZone(p.gridcode);
    }
    if (p.zone) p.zone = String(p.zone).toLowerCase().trim();
    if (!p.trange) {
      if (p.Trange)    p.trange = p.Trange;
      else if (p.TRANGE)   p.trange = p.TRANGE;
      else if (p.temprange) p.trange = p.temprange;
      else p.trange = '';
    }
  }
}

function gridcodeToZone(code) {
  const n = parseInt(code, 10);
  if (isNaN(n) || n < 1 || n > 28) return String(code);
  const num  = Math.ceil(n / 2);
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
  const num  = parseInt(zone, 10);
  return {
    fillColor:   ZONE_COLORS[num] || '#888888',
    fillOpacity: 1.0,
    color:       '#fff',
    weight:      0.3,
    opacity:     0.4
  };
}

function attachFeature(feature, layer) {
  const zone   = feature.properties.zone || '?';
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
  selectedLayer   = layer;
  selectedZone    = feature.properties.zone || null;
  currentTip      = TIPS[Math.floor(Math.random() * TIPS.length)];
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

  // Zone badge
  const num   = parseInt(zone, 10);
  const color = ZONE_COLORS[num] || '#888888';
  const badge = document.getElementById('zone-badge');
  badge.textContent       = zone.toUpperCase();
  badge.style.background  = color + '33';
  badge.style.borderColor = color;
  badge.style.color       = color;

  document.getElementById('zone-name').textContent = `Hardiness Zone ${zone.toUpperCase()}`;
  const trange = selectedFeature?.properties?.trange || '';
  document.getElementById('zone-temp').textContent = trange ? `Avg min: ${trange}` : '';

  // Frost dates
  const frost    = FROST_DATES[zone.toLowerCase()];
  const frostEl  = document.getElementById('frost-dates');
  if (frost) {
    if (!frost.last && !frost.first) {
      frostEl.innerHTML = '<span class="frost-item">🌴 Frost-free zone</span>';
    } else {
      const parts = [];
      if (frost.last)  parts.push(`<span class="frost-item">❄️ Last frost <strong>${frost.last}</strong></span>`);
      if (frost.first) parts.push(`<span class="frost-item">🍂 First frost <strong>${frost.first}</strong></span>`);
      frostEl.innerHTML = parts.join('');
    }
    frostEl.hidden = false;
  } else {
    frostEl.hidden = true;
  }

  // Month display + context
  document.getElementById('month-display').textContent = MONTH_NAMES[month];
  const ctx   = getMonthContext(zone, month);
  const ctxEl = document.getElementById('month-context');
  ctxEl.textContent = ctx;
  ctxEl.hidden = !ctx;

  // Plant sections
  const data     = getPlantingData(zone, month);
  const sections = ['startIndoors', 'directSow', 'transplant', 'harvest'];
  let hasAny     = false;

  for (const key of sections) {
    const items   = data[key] || [];
    const section = document.getElementById(`section-${key}`);
    const list    = document.getElementById(`list-${key}`);
    if (items.length > 0) {
      hasAny         = true;
      list.innerHTML = items.map(renderCropItem).join('');
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  }

  document.getElementById('no-tasks').style.display = hasAny ? 'none' : 'block';

  // Tip
  document.getElementById('garden-tip').innerHTML =
    `<span class="tip-label">💡 Did you know?</span>${currentTip}`;
}

function getPlantingData(zoneStr, month) {
  const monthKey = String(month);
  if (plantingData[zoneStr]?.[monthKey]) return plantingData[zoneStr][monthKey];
  const nearest = findNearestZone(zoneStr);
  if (nearest && plantingData[nearest]?.[monthKey]) return plantingData[nearest][monthKey];
  return { startIndoors: [], directSow: [], transplant: [], harvest: [] };
}

function findNearestZone(zoneStr) {
  const available = Object.keys(plantingData);
  if (!available.length) return null;
  const n = parseFloat(zoneStr);
  if (isNaN(n)) return available[0];
  let best = null, bestDist = Infinity;
  for (const z of available) {
    const d = Math.abs(parseFloat(z) - n);
    if (d < bestDist) { bestDist = d; best = z; }
  }
  return best;
}

// ── UI initialization ──────────────────────────
function initUI() {
  initMonthSlider();
  initSearch();
  initLocate();
  initPanelListeners();
  initCropModal();
  initZoneLegend();
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

// ── Geolocation ────────────────────────────────
function initLocate() {
  const btn = document.getElementById('locate-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser');
      return;
    }
    btn.classList.add('locating');
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const found = selectZoneByPoint(lat, lng);
        if (!found) showToast('No planting zone found at your location');
        zoomToPoint(lat, lng);
        map.once('moveend', highlightZone);
        btn.classList.remove('locating');
        btn.disabled = false;
      },
      () => {
        showToast('Location access denied — try searching your address instead');
        btn.classList.remove('locating');
        btn.disabled = false;
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  });
}

// ── Zone legend ────────────────────────────────
function initZoneLegend() {
  const container = document.getElementById('legend-swatches');
  if (!container) return;
  for (let z = 1; z <= 13; z++) {
    const s = document.createElement('span');
    s.className    = 'legend-swatch';
    s.style.background = ZONE_COLORS[z];
    s.title        = `Zone ${z}`;
    container.appendChild(s);
  }
}

// ── Search ─────────────────────────────────────
function initSearch() {
  const input = document.getElementById('address-input');
  const btn   = document.getElementById('search-btn');

  btn.addEventListener('click', triggerSearch);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') triggerSearch(); });

  input.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      if (input.value.trim().length > 3) triggerSearch();
    }, 500);
  });
}

function triggerSearch() {
  const val = document.getElementById('address-input').value.trim();
  if (!val) return;
  onAddressSearch(val);
}

async function onAddressSearch(address) {
  const btn = document.getElementById('search-btn');
  btn.textContent = '…';
  btn.disabled    = true;

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
    btn.disabled    = false;
  }
}

async function nominatimGeocode(address, signal) {
  const url = `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({ q: address, format: 'json', limit: 1, countrycodes: 'us' });
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
  document.getElementById('modal-emoji').textContent       = c.emoji || '🌱';
  document.getElementById('modal-crop-name').textContent   = name;
  const badge = document.getElementById('modal-difficulty');
  badge.textContent = c.difficulty || '';
  badge.className   = 'difficulty-badge' + (c.difficulty ? ' difficulty-' + c.difficulty.toLowerCase() : '');
  document.getElementById('modal-body').innerHTML    = renderCropDetail(c);
  document.getElementById('modal-body').scrollTop   = 0;
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
