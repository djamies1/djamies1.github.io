/* ──────────────────────────────────────────────
   Plant Zone Finder — app.js
────────────────────────────────────────────── */

// ── WMO weather code → emoji ───────────────────
const WMO_ICONS = {
  0:'☀️', 1:'🌤️', 2:'⛅', 3:'☁️',
  45:'🌫️', 48:'🌫️',
  51:'🌦️', 53:'🌦️', 55:'🌧️',
  61:'🌧️', 63:'🌧️', 65:'🌧️',
  71:'🌨️', 73:'🌨️', 75:'❄️', 77:'❄️',
  80:'🌦️', 81:'🌦️', 82:'🌧️',
  85:'🌨️', 86:'🌨️',
  95:'⛈️', 96:'⛈️', 99:'⛈️',
};
function getWmoIcon(code) { return WMO_ICONS[code] || '🌡️'; }

// ── Frost-sensitive crops ──────────────────────
const FROST_SENSITIVE = new Set([
  'Tomatoes','Peppers','Eggplant','Basil','Cucumbers','Beans','Squash',
  'Corn','Melons','Pumpkins','Tomatillos','Ground Cherries','Edamame',
  'Sweet Potatoes','Ginger','Lemongrass','Okra','Peanuts',
]);

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
  if (!el) return;
  el.style.transition = 'opacity 0.4s ease';
  el.style.opacity = '0';
  setTimeout(() => {
    el.style.backgroundImage = SEASON_GRADIENTS[season];
    el.style.opacity = '1';
  }, 400);
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

// ── Crop categories ────────────────────────────
const CROP_CATEGORIES = {
  'Vegetables':  ['Celery','Corn','Eggplant','Ground Cherries','Okra','Peppers','Tomatillos','Tomatoes'],
  'Brassicas':   ['Bok Choy','Broccoli','Brussels Sprouts','Cabbage','Cauliflower','Collard Greens','Kale','Kohlrabi'],
  'Root Veg':    ['Beets','Carrots','Celeriac','Horseradish','Jerusalem Artichoke','Parsnips','Potatoes','Radishes','Rutabaga','Sweet Potatoes','Turnips'],
  'Greens':      ['Arugula','Chard','Endive','Lettuce','Mâche','Mustard Greens','Spinach','Watercress'],
  'Alliums':     ['Chives','Garlic','Green Onions','Leeks','Onions','Shallots'],
  'Legumes':     ['Beans','Edamame','Fava Beans','Peanuts','Peas'],
  'Cucurbits':   ['Cucumbers','Melons','Pumpkins','Squash'],
  'Herbs':       ['Basil','Cilantro','Dill','Fennel','Mint','Oregano','Parsley','Rosemary','Sage','Thyme'],
  'Perennials':  ['Asparagus','Globe Artichoke','Rhubarb','Strawberries'],
  'Tropical':    ['Avocados','Ginger','Lemongrass','Mangoes','Turmeric'],
};

const CROP_CATEGORY_MAP = {};
for (const [cat, crops] of Object.entries(CROP_CATEGORIES)) {
  for (const crop of crops) CROP_CATEGORY_MAP[crop] = cat;
}

// ── Season gradients ───────────────────────────
const SEASON_GRADIENTS = {
  winter: 'radial-gradient(ellipse 80% 55% at 20% 80%, rgba(59,130,246,0.45) 0%, transparent 65%), radial-gradient(ellipse 60% 40% at 80% 15%, rgba(147,197,253,0.22) 0%, transparent 55%)',
  spring: 'radial-gradient(ellipse 80% 55% at 15% 65%, rgba(34,197,94,0.4) 0%, transparent 65%), radial-gradient(ellipse 60% 40% at 85% 25%, rgba(134,239,172,0.2) 0%, transparent 55%)',
  summer: 'radial-gradient(ellipse 80% 55% at 50% 90%, rgba(234,179,8,0.4) 0%, transparent 65%), radial-gradient(ellipse 60% 40% at 20% 10%, rgba(253,230,138,0.2) 0%, transparent 55%)',
  autumn: 'radial-gradient(ellipse 80% 55% at 70% 80%, rgba(249,115,22,0.4) 0%, transparent 65%), radial-gradient(ellipse 60% 40% at 15% 20%, rgba(253,186,116,0.2) 0%, transparent 55%)',
};

// ── State ─────────────────────────────────────
let map, zonesLayer, selectedLayer;
let zonesData = null;
let plantingData = null;
let cropData = null;

let selectedFeature = null;
let selectedZone = null;
let currentMonth = new Date().getMonth() + 1;

let myGarden = {};
let currentPanelTab = 'calendar';

let selectedLat = null;
let selectedLng = null;
let weatherData = null;
let weatherCache = {};
let useMetric = false;

let searchDebounceTimer = null;
let geocodeController = null;

let browseSearch = '';
let browseCategory = '';
let browseDifficulty = '';
let browseInSeason = false;

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
  layer.on('click', e => onZoneClick(feature, layer, e.latlng?.lat, e.latlng?.lng));
}

// ── Zone interaction ───────────────────────────
function onZoneClick(feature, layer, lat, lng) {
  if (!feature) return;
  selectedFeature = feature;
  selectedLayer   = layer;
  selectedZone    = feature.properties.zone || null;
  currentTip      = TIPS[Math.floor(Math.random() * TIPS.length)];
  if (lat != null && lng != null) {
    selectedLat = lat; selectedLng = lng;
  } else {
    const c = getZoneCentroid(feature);
    if (c) { selectedLat = c.lat; selectedLng = c.lng; }
  }
  highlightZone();
  pulseZone();
  renderPanel();
  showPanel();
  updateURL();
  fetchWeatherAndUpdate();
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
        selectedLat = lat; selectedLng = lng;
        onZoneClick(layer.feature, layer, lat, lng);
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

  // Print header
  const ph = document.getElementById('print-header');
  if (ph) ph.textContent = `Plant Zone Finder — Zone ${zone.toUpperCase()} — ${MONTH_NAMES[month]} planting calendar`;

  // Countdown cards + smart digest (use cached weather data)
  renderCountdownCards();
  renderWeatherStrip();
  renderThisWeek();
  renderFrostAlertBanner();

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

  // Show crop search and reset it
  const csWrap = document.getElementById('calendar-search-wrap');
  if (csWrap) { csWrap.classList.remove('hidden'); }
  const csInput = document.getElementById('calendar-search');
  if (csInput && csInput.value) { csInput.value = ''; filterCalendarSearch(''); }

  // Year calendar
  renderYearCalendar();

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
  // Load persisted preferences
  useMetric = localStorage.getItem('pzf-metric') === '1';
  const mtBtn = document.getElementById('metric-toggle');
  if (mtBtn) { mtBtn.textContent = useMetric ? '°C' : '°F'; mtBtn.classList.toggle('active', useMetric); }
  document.getElementById('metric-toggle')?.addEventListener('click', toggleMetric);

  initMonthSlider();
  initSearch();
  initLocate();
  initPanelListeners();
  initCropModal();
  initZoneLegend();
  initBrowse();
  initYearCalendar();
  initGarden();
  initOnboarding();
  initKeyboardShortcuts();
  initPanelSwipe();
  initSliderSwipe();
  // Share button
  document.getElementById('share-btn')?.addEventListener('click', shareZone);
  // Calendar crop search
  const calSearch = document.getElementById('calendar-search');
  if (calSearch) {
    calSearch.addEventListener('input', e => filterCalendarSearch(e.target.value));
    // Hide search wrap when panel first shown (no zone yet)
    document.getElementById('calendar-search-wrap')?.classList.add('hidden');
  }
  restoreFromURL();
}

function initMonthSlider() {
  const slider = document.getElementById('month-slider');
  slider.value = currentMonth;
  updateMonthLabels();
  _lastSeasonBg = null;
  updateSeasonBg();
  requestAnimationFrame(updateThumbLabel);

  slider.addEventListener('input', () => {
    currentMonth = parseInt(slider.value, 10);
    updateMonthLabels();
    updateSeasonBg();
    if (selectedZone) renderPanel();
    updateURL();
  });

  document.getElementById('month-labels').addEventListener('click', e => {
    const el = e.target.closest('[data-month]');
    if (!el) return;
    currentMonth = parseInt(el.dataset.month, 10);
    slider.value = currentMonth;
    updateMonthLabels();
    updateSeasonBg();
    if (selectedZone) renderPanel();
    updateURL();
  });
}

function updateMonthLabels() {
  document.querySelectorAll('#month-labels span').forEach(span => {
    span.classList.toggle('active', parseInt(span.dataset.month, 10) === currentMonth);
  });
  updateThumbLabel();
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
      <div class="crop-title">${c.emoji || '🌱'} ${name}${isInGarden(name) ? '<span class="crop-garden-star">★</span>' : ''}</div>
      <div class="crop-detail">${convertMeasurement(c.depth)} deep · ${convertMeasurement(c.spacing)} apart · ${convertMeasurement(c.water)} · ${c.days}</div>
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
  const schedPH = document.getElementById('modal-schedule-placeholder');
  if (schedPH) schedPH.outerHTML = renderPlantingScheduleHTML(name);
  renderModalGardenBar(name);
  renderModalGardenSections(name);
  if (!modal.open) modal.showModal();
}

function renderCropDetail(c) {
  function row(label, value) {
    if (!value) return '';
    return `<div class="detail-row"><span class="detail-label">${label}</span><span>${convertMeasurement(value)}</span></div>`;
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
    <div id="modal-schedule-placeholder"></div>
  `;
}

// ── Helpers ────────────────────────────────────
function setLoadingText(msg) {
  const el = document.getElementById('loading-text');
  if (el) el.textContent = msg;
}

// ── URL state ──────────────────────────────────
function updateURL() {
  const params = new URLSearchParams();
  if (selectedZone) params.set('zone', selectedZone);
  params.set('month', String(currentMonth));
  history.replaceState(null, '', '?' + params.toString());
}

function restoreFromURL() {
  const params = new URLSearchParams(location.search);
  const z = params.get('zone');
  const m = parseInt(params.get('month'), 10);

  if (m >= 1 && m <= 12) {
    currentMonth = m;
    const slider = document.getElementById('month-slider');
    if (slider) slider.value = currentMonth;
    updateMonthLabels();
    updateSeasonBg();
  }

  if (z && zonesLayer) {
    let found = false;
    zonesLayer.eachLayer(layer => {
      if (found) return;
      if (layer.feature?.properties?.zone === z.toLowerCase()) {
        found = true;
        const c = getZoneCentroid(layer.feature);
        if (c) { selectedLat = c.lat; selectedLng = c.lng; }
        onZoneClick(layer.feature, layer);
      }
    });
  }
}

// ── Year calendar ──────────────────────────────
function initYearCalendar() {
  const container = document.getElementById('year-cal-cells');
  if (!container) return;

  container.addEventListener('click', e => {
    const cell = e.target.closest('.ycal-cell');
    if (!cell) return;
    const m = parseInt(cell.dataset.month, 10);
    if (!m) return;
    currentMonth = m;
    const slider = document.getElementById('month-slider');
    slider.value = m;
    updateMonthLabels();
    updateSeasonBg();
    renderPanel();
    updateURL();
  });

  container.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const cell = e.target.closest('.ycal-cell');
      if (cell) { e.preventDefault(); cell.click(); }
    }
  });
}

function renderYearCalendar() {
  const wrapper   = document.getElementById('year-calendar');
  const container = document.getElementById('year-cal-cells');
  if (!wrapper || !container) return;
  if (!selectedZone) { wrapper.hidden = true; return; }

  wrapper.hidden = false;
  container.innerHTML = '';

  for (let m = 1; m <= 12; m++) {
    const data  = getPlantingData(selectedZone, m);
    const count = ['startIndoors','directSow','transplant','harvest']
      .filter(k => data[k]?.length > 0).length;
    const pct   = (count / 4 * 100).toFixed(0);

    const cell = document.createElement('div');
    cell.className = 'ycal-cell' + (m === currentMonth ? ' ycal-active' : '');
    cell.dataset.month = m;
    cell.title = MONTH_NAMES[m];
    cell.setAttribute('role', 'button');
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('aria-label', `${MONTH_NAMES[m]}: ${count} activities`);
    cell.innerHTML = `
      <div class="ycal-bar-wrap"><div class="ycal-bar-fill" style="height:${pct}%"></div></div>
      <span class="ycal-label">${MONTH_NAMES[m][0]}</span>`;
    container.appendChild(cell);
  }
}

// ── Browse view ────────────────────────────────
function initBrowse() {
  const btn = document.getElementById('browse-btn');
  if (btn) btn.addEventListener('click', () => toggleBrowse(true));

  const closeBtn = document.getElementById('browse-close');
  if (closeBtn) closeBtn.addEventListener('click', () => toggleBrowse(false));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const view = document.getElementById('browse-view');
      if (view && !view.classList.contains('browse-hidden')) toggleBrowse(false);
    }
  });

  const search = document.getElementById('browse-search');
  if (search) {
    search.addEventListener('input', () => {
      browseSearch = search.value.toLowerCase().trim();
      renderBrowseGrid();
    });
  }

  const cats = document.getElementById('browse-cats');
  if (cats) {
    cats.addEventListener('click', e => {
      const chip = e.target.closest('.cat-chip');
      if (!chip) return;
      browseCategory = chip.dataset.cat || '';
      cats.querySelectorAll('.cat-chip').forEach(c => c.classList.toggle('active', c === chip));
      renderBrowseGrid();
    });
  }

  const diff = document.getElementById('browse-difficulty');
  if (diff) {
    diff.addEventListener('change', () => {
      browseDifficulty = diff.value;
      renderBrowseGrid();
    });
  }

  const inSeason = document.getElementById('browse-inseason');
  if (inSeason) {
    inSeason.addEventListener('change', () => {
      browseInSeason = inSeason.checked;
      renderBrowseGrid();
    });
  }

  const grid = document.getElementById('browse-grid');
  if (grid) {
    grid.addEventListener('click', e => {
      const card = e.target.closest('.browse-card');
      if (card?.dataset.crop) openCropDetail(card.dataset.crop);
    });
    grid.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.browse-card');
        if (card?.dataset.crop) { e.preventDefault(); openCropDetail(card.dataset.crop); }
      }
    });
  }
}

function toggleBrowse(show) {
  const view = document.getElementById('browse-view');
  const btn  = document.getElementById('browse-btn');
  if (!view) return;
  if (show === undefined) show = view.classList.contains('browse-hidden');
  view.classList.toggle('browse-hidden', !show);
  if (btn) btn.classList.toggle('active', show);
  if (show) {
    renderBrowseGrid();
    const search = document.getElementById('browse-search');
    if (search) search.focus();
  }
}

function renderBrowseGrid() {
  const grid = document.getElementById('browse-grid');
  if (!grid || !cropData) return;

  // Build active set for current zone+month
  let activeSet = new Set();
  if (selectedZone) {
    const d = getPlantingData(selectedZone, currentMonth);
    ['startIndoors','directSow','transplant','harvest'].forEach(k => (d[k] || []).forEach(c => activeSet.add(c)));
  }

  // Filter
  let crops = Object.entries(cropData);

  if (browseCategory) {
    const catSet = new Set(CROP_CATEGORIES[browseCategory] || []);
    crops = crops.filter(([name]) => catSet.has(name));
  }

  if (browseSearch) {
    crops = crops.filter(([name]) => name.toLowerCase().includes(browseSearch));
  }

  if (browseDifficulty) {
    crops = crops.filter(([, c]) => c.difficulty === browseDifficulty);
  }

  if (browseInSeason && selectedZone) {
    crops = crops.filter(([name]) => activeSet.has(name));
  }

  // Disable in-season checkbox when no zone selected
  const cb = document.getElementById('browse-inseason');
  if (cb) cb.disabled = !selectedZone;

  // Sort: in-season first (when zone selected), then alphabetical
  if (selectedZone && !browseInSeason) {
    crops.sort(([a], [b]) => {
      const aS = activeSet.has(a) ? 0 : 1;
      const bS = activeSet.has(b) ? 0 : 1;
      return aS !== bS ? aS - bS : a.localeCompare(b);
    });
  } else {
    crops.sort(([a], [b]) => a.localeCompare(b));
  }

  // Update count
  const countEl = document.getElementById('browse-count');
  if (countEl) countEl.textContent = `(${crops.length})`;

  if (!crops.length) {
    grid.innerHTML = '<p class="browse-empty">No crops match your filters.</p>';
    return;
  }

  grid.innerHTML = crops.map(([name, c], i) => {
    const cat      = CROP_CATEGORY_MAP[name] || '';
    const isActive = activeSet.has(name);
    const diff     = c.difficulty ? c.difficulty.toLowerCase() : '';
    return `<div class="browse-card${isActive ? ' browse-card--active' : ''}" data-crop="${name}" role="button" tabindex="0" style="animation-delay:${i * 0.025}s">
      <div class="browse-card-emoji">${c.emoji || '🌱'}</div>
      <div class="browse-card-name">${name}</div>
      <div class="browse-card-meta">
        ${cat  ? `<span class="browse-card-cat">${cat}</span>` : ''}
        ${diff ? `<span class="diff-dot diff-dot--${diff}" title="${c.difficulty}"></span>` : ''}
      </div>
      ${isActive ? '<div class="browse-card-season">In season</div>' : ''}
      ${isInGarden(name) ? '<div class="browse-card-saved">★ Saved</div>' : ''}
    </div>`;
  }).join('');
}

// ── Garden storage helpers ──────────────────────
function loadGarden() {
  try { myGarden = JSON.parse(localStorage.getItem('pzf-garden') || '{}'); }
  catch { myGarden = {}; }
}
function saveGarden() { localStorage.setItem('pzf-garden', JSON.stringify(myGarden)); }
function isInGarden(name) { return !!myGarden[name]; }

function gardenAdd(name) {
  if (myGarden[name]) return;
  myGarden[name] = { added: new Date().toISOString().slice(0,10), planted: null };
  saveGarden(); refreshGardenUI(name);
  checkCompanionConflicts(name);
}
function gardenRemove(name) { delete myGarden[name]; saveGarden(); refreshGardenUI(name); }
function gardenSetPlanted(name, dateStr) {
  if (myGarden[name]) { myGarden[name].planted = dateStr || null; saveGarden(); refreshGardenUI(name); }
}

function refreshGardenUI(name) {
  updateGardenBadge();
  checkReminders();
  if (currentPanelTab === 'garden') renderGardenTab();
  renderFrostAlertBanner();
  renderThisWeek();
  // Re-render open modal bar
  const modal = document.getElementById('crop-modal');
  if (modal?.open && document.getElementById('modal-crop-name')?.textContent === name) {
    renderModalGardenBar(name);
    renderModalGardenSections(name);
  }
  // Re-render panel crop lists to update star badges
  if (selectedZone) {
    const data = getPlantingData(selectedZone, currentMonth);
    for (const key of ['startIndoors','directSow','transplant','harvest']) {
      const sec = document.getElementById(`section-${key}`);
      if (sec && !sec.classList.contains('hidden'))
        document.getElementById(`list-${key}`).innerHTML = (data[key]||[]).map(renderCropItem).join('');
    }
  }
  // Re-render browse grid if open
  const browseView = document.getElementById('browse-view');
  if (browseView && !browseView.classList.contains('browse-hidden')) renderBrowseGrid();
}

function updateGardenBadge() {
  const count = Object.keys(myGarden).length;
  const badge = document.getElementById('garden-count-badge');
  if (badge) badge.textContent = count > 0 ? count : '';
}

function parseHarvestDays(daysStr) {
  if (!daysStr) return null;
  const m = daysStr.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function getGardenStatus(name) {
  const entry = myGarden[name];
  if (!entry) return null;
  if (!entry.planted) return { type: 'saved', label: 'Saved — no planting date' };
  const today = new Date(); today.setHours(0,0,0,0);
  const daysPlanted = Math.round((today - new Date(entry.planted)) / 86400000);
  const harvestMin = parseHarvestDays(cropData[name]?.days);
  if (!harvestMin) return { type: 'growing', label: `Planted ${daysPlanted}d ago` };
  const remaining = harvestMin - daysPlanted;
  if (remaining <= 0) return { type: 'ready', label: 'Ready to harvest!' };
  return { type: 'growing', label: `~${remaining} days to harvest (planted ${daysPlanted}d ago)` };
}

function renderGardenTab() {
  const list = document.getElementById('garden-list');
  const emptyMsg = document.getElementById('garden-empty-msg');
  if (!list) return;
  const names = Object.keys(myGarden);
  if (!names.length) { list.innerHTML = ''; if (emptyMsg) emptyMsg.hidden = false; return; }
  if (emptyMsg) emptyMsg.hidden = true;

  const groups = { ready: [], growing: [], saved: [] };
  for (const name of names) {
    const s = getGardenStatus(name);
    groups[s?.type || 'saved'].push({ name, status: s });
  }
  const GROUP_LABELS = { ready: '🌾 Ready to harvest', growing: '🌿 Growing', saved: '☆ Saved — no date' };
  const today = new Date().toISOString().slice(0,10);
  let html = '';
  for (const [type, items] of Object.entries(groups)) {
    if (!items.length) continue;
    html += `<div class="garden-group-label">${GROUP_LABELS[type]}</div>`;
    for (const { name, status } of items) {
      const c = cropData[name];
      const plantedVal = myGarden[name]?.planted || '';
      const entry = myGarden[name];
      const todayStr = new Date().toISOString().slice(0,10);
      const reminderDue = entry.reminder && entry.reminder <= todayStr;
      const badges = [
        entry.hasSeeds ? '<span class="gi-badge gi-badge--seeds" title="Have seeds">🌰</span>' : '',
        (entry.harvestLog?.length) ? `<span class="gi-badge gi-badge--harvests" title="${entry.harvestLog.length} harvest(s) logged">🌾×${entry.harvestLog.length}</span>` : '',
        entry.notes ? '<span class="gi-badge" title="Has notes">📝</span>' : '',
        entry.reminder ? `<span class="gi-badge gi-badge--reminder" title="Reminder: ${entry.reminder}">${reminderDue ? '🔔' : '⏰'}</span>` : '',
      ].join('');
      html += `<div class="garden-item garden-item--${type}" data-crop="${name}">
        <div class="garden-item-main">
          <span class="garden-item-emoji">${c?.emoji || '🌱'}</span>
          <div class="garden-item-info">
            <span class="garden-item-name">${name}${badges}</span>
            <span class="garden-item-status">${status?.label || ''}</span>
          </div>
        </div>
        <div class="garden-item-actions">
          ${!plantedVal ? `<button class="garden-log-btn" data-crop="${name}">Log date</button>` : ''}
          <input type="date" class="garden-date-input" data-crop="${name}" value="${plantedVal}" max="${today}" aria-label="Planting date for ${name}"${!plantedVal ? ' style="display:none"' : ''}>
          <button class="garden-remove-btn" data-crop="${name}" aria-label="Remove ${name}">×</button>
        </div>
      </div>`;
    }
  }
  list.innerHTML = html;
  renderGardenStats();
  renderGardenGantt();
  renderGardenFooter();
}

function renderGardenFooter() {
  const footer = document.getElementById('garden-footer');
  if (!footer) return;
  const hasCrops = Object.keys(myGarden).length > 0;
  if (!hasCrops) { footer.innerHTML = ''; return; }

  // Shopping list = crops without seeds
  const needSeeds = Object.keys(myGarden).filter(n => !myGarden[n].hasSeeds);
  const shoppingHTML = needSeeds.length ? `
    <div class="shopping-list-section">
      <div class="shopping-list-header">
        🛒 Seeds to buy
        <button class="shopping-copy-btn" id="shopping-copy-btn">Copy</button>
      </div>
      <div class="shopping-list-items">
        ${needSeeds.map(n => `<span class="shopping-chip">${cropData[n]?.emoji || '🌱'} ${n}</span>`).join('')}
      </div>
    </div>` : '';

  footer.innerHTML = `
    <div class="garden-actions-row">
      <button class="garden-action-btn" id="garden-export-btn">⬇ Export</button>
      <button class="garden-action-btn" id="garden-import-btn">⬆ Import</button>
      <input type="file" id="garden-import-input" accept=".json">
    </div>
    ${shoppingHTML}`;

  footer.querySelector('#garden-export-btn')?.addEventListener('click', exportGarden);
  footer.querySelector('#garden-import-btn')?.addEventListener('click', () => {
    footer.querySelector('#garden-import-input')?.click();
  });
  footer.querySelector('#garden-import-input')?.addEventListener('change', e => {
    importGarden(e.target.files[0]);
    e.target.value = '';
  });
  footer.querySelector('#shopping-copy-btn')?.addEventListener('click', () => {
    const text = needSeeds.join(', ');
    navigator.clipboard?.writeText(text).then(() => showToast('Copied to clipboard ✓', 'success'));
  });
}

function renderModalGardenBar(name) {
  const bar = document.getElementById('modal-garden-bar');
  if (!bar) return;
  const inG = isInGarden(name);
  const plantedVal = myGarden[name]?.planted || '';
  const hasSeeds = myGarden[name]?.hasSeeds || false;
  const today = new Date().toISOString().slice(0,10);
  if (!inG) {
    bar.className = 'bar-add';
    bar.innerHTML = `<button class="modal-garden-btn" id="modal-garden-add">☆ Add to My Garden</button>`;
    bar.querySelector('#modal-garden-add').addEventListener('click', () => gardenAdd(name));
  } else {
    const reminderVal = myGarden[name]?.reminder || '';
    bar.className = 'bar-saved';
    bar.innerHTML = `
      <div class="modal-garden-info">
        <span class="modal-garden-saved">★ In My Garden</span>
        <button class="modal-garden-remove-btn" id="modal-garden-remove">Remove</button>
      </div>
      <div class="modal-garden-controls">
        <label class="modal-garden-date-label">Planted:
          <input type="date" id="modal-planted-input" value="${plantedVal}" max="${today}" aria-label="Planting date">
        </label>
        <label class="modal-seeds-label">
          <input type="checkbox" id="modal-seeds-check"${hasSeeds ? ' checked' : ''}> Have seeds
        </label>
        <label class="modal-garden-reminder-label">🔔
          <input type="date" id="modal-reminder-input" value="${reminderVal}" min="${today}" aria-label="Reminder date">
        </label>
      </div>`;
    bar.querySelector('#modal-planted-input').addEventListener('change', e => gardenSetPlanted(name, e.target.value));
    bar.querySelector('#modal-garden-remove').addEventListener('click', () => gardenRemove(name));
    bar.querySelector('#modal-seeds-check').addEventListener('change', e => {
      if (myGarden[name]) { myGarden[name].hasSeeds = e.target.checked; saveGarden(); if (currentPanelTab === 'garden') renderGardenTab(); }
    });
    bar.querySelector('#modal-reminder-input').addEventListener('change', e => gardenSetReminder(name, e.target.value));
  }
}

function initGarden() {
  loadGarden();
  updateGardenBadge();
  checkReminders();

  document.getElementById('panel-tabs')?.addEventListener('click', e => {
    const tab = e.target.closest('.ptab');
    if (!tab) return;
    currentPanelTab = tab.dataset.tab;
    document.querySelectorAll('.ptab').forEach(t => t.classList.toggle('active', t === tab));
    document.getElementById('tab-calendar').hidden = (currentPanelTab !== 'calendar');
    document.getElementById('tab-garden').hidden   = (currentPanelTab !== 'garden');
    if (currentPanelTab === 'garden') renderGardenTab();
  });

  // Garden tab delegated events
  const gardenTab = document.getElementById('tab-garden');
  gardenTab?.addEventListener('click', e => {
    if (e.target.closest('.garden-log-btn')) {
      const name = e.target.closest('.garden-log-btn').dataset.crop;
      const item = e.target.closest('.garden-item');
      item.querySelector('.garden-log-btn').style.display = 'none';
      const inp = item.querySelector('.garden-date-input');
      inp.style.display = ''; inp.focus();
      return;
    }
    if (e.target.closest('.garden-remove-btn')) {
      gardenRemove(e.target.closest('.garden-remove-btn').dataset.crop); return;
    }
    const item = e.target.closest('.garden-item');
    if (item?.dataset.crop) openCropDetail(item.dataset.crop);
  });
  gardenTab?.addEventListener('change', e => {
    const inp = e.target.closest('.garden-date-input');
    if (inp) gardenSetPlanted(inp.dataset.crop, inp.value);
  });
}

// ── Countdown cards ─────────────────────────────
function parseFrostDate(str) {
  if (!str) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  let d = new Date(`${str} ${today.getFullYear()}`);
  if (isNaN(d)) return null;
  if ((today - d) / 86400000 > 150) d.setFullYear(d.getFullYear() + 1);
  return d;
}

function renderCountdownCards() {
  const el = document.getElementById('countdown-cards');
  if (!el) return;
  if (!selectedZone) { el.innerHTML = ''; return; }
  const frost = FROST_DATES[selectedZone.toLowerCase()];
  if (!frost) { el.innerHTML = ''; return; }

  const today = new Date(); today.setHours(0,0,0,0);
  const diff = d => Math.round((d - today) / 86400000);
  const cards = [];

  if (!frost.last && !frost.first) {
    cards.push({ icon:'🌴', text:'Frost-free zone', sub:'Warm-season crops can grow year-round.', type:'neutral' });
  } else {
    if (frost.last) {
      const d = parseFrostDate(frost.last);
      if (d) {
        const n = diff(d);
        if      (n > 42)       cards.push({ icon:'🌱', text:'Start warm-season seeds indoors', sub:`Last frost ~${frost.last} — ${n} days away`, type:'action' });
        else if (n > 14)       cards.push({ icon:'🌿', text:`Transplant window opens in ${n} days`, sub:`Last frost ~${frost.last} — harden off seedlings now`, type:'soon' });
        else if (n > 0)        cards.push({ icon:'⚠️', text:`Last frost in ${n} day${n===1?'':'s'}`, sub:'Hold off on transplanting frost-sensitive crops.', type:'warning' });
        else if (n >= -30)     cards.push({ icon:'✅', text:`Last frost was ${-n} day${-n===1?'':'s'} ago`, sub:'Safe to transplant warm-season crops outdoors.', type:'success' });
      }
    }
    if (frost.first) {
      const d = parseFrostDate(frost.first);
      if (d) {
        const n = diff(d);
        if      (n > 30 && n <= 60) cards.push({ icon:'🍂', text:`First frost in ~${n} days`, sub:'Start fall brassicas and root veg indoors now.', type:'soon' });
        else if (n > 0)             cards.push({ icon:'🍂', text:`First frost in ${n} day${n===1?'':'s'}`, sub:'Harvest frost-sensitive crops soon.', type:'warning' });
        else if (n >= -14)          cards.push({ icon:'❄️', text:`First frost was ${-n} day${-n===1?'':'s'} ago`, sub:'Protect tender crops or bring them indoors.', type:'info' });
      }
    }
  }

  el.innerHTML = cards.map(c => `
    <div class="countdown-card countdown-card--${c.type}">
      <span class="countdown-icon">${c.icon}</span>
      <div class="countdown-body"><strong>${c.text}</strong><span>${c.sub}</span></div>
    </div>`).join('');
}

// ── Slider thumb label ──────────────────────────
function updateThumbLabel() {
  const slider = document.getElementById('month-slider');
  const output = document.getElementById('month-thumb-label');
  if (!slider || !output) return;
  const rect = slider.getBoundingClientRect();
  if (!rect.width) return;
  const pct = (currentMonth - 1) / 11;
  const thumbR = 11;
  const left = rect.left + thumbR + pct * (rect.width - thumbR * 2);
  output.style.left = left + 'px';
  output.style.top = (rect.top - 26) + 'px';
  output.textContent = MONTH_NAMES[currentMonth].slice(0, 3).toUpperCase();
}

// ── Weather ─────────────────────────────────────
async function fetchWeather(lat, lng) {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = weatherCache[key];
  if (cached && Date.now() - cached.ts < 3600000) { weatherData = cached.data; return; }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,weather_code,precipitation` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum` +
      `&forecast_days=7&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return;
    weatherData = await res.json();
    weatherCache[key] = { data: weatherData, ts: Date.now() };
  } catch (e) { weatherData = null; }
}

async function fetchWeatherAndUpdate() {
  if (!selectedLat || !selectedLng) return;
  await fetchWeather(selectedLat, selectedLng);
  renderWeatherStrip();
  renderFrostAlertBanner();
  renderThisWeek();
}

function renderWeatherStrip() {
  const el = document.getElementById('weather-strip');
  if (!el) return;
  if (!weatherData?.current || !selectedZone) { el.hidden = true; return; }
  const c = weatherData.current;
  const d = weatherData.daily;
  const toC = f => Math.round((f - 32) * 5 / 9);
  const fmt = f => useMetric ? `${toC(f)}°C` : `${Math.round(f)}°F`;
  const icon = getWmoIcon(c.weather_code);
  const curTemp = fmt(c.temperature_2m);
  const hasFrost = d.temperature_2m_min.some(t => t < 35);
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const forecast = d.time.slice(0, 4).map((date, i) => {
    const hi = fmt(d.temperature_2m_max[i]);
    const lo = fmt(d.temperature_2m_min[i]);
    const lbl = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : DAYS[new Date(date + 'T12:00:00').getDay()];
    return `<div class="wx-day"><span class="wx-day-name">${lbl}</span><span class="wx-day-icon">${getWmoIcon(d.weather_code[i])}</span><span class="wx-day-temp">${hi}/${lo}</span></div>`;
  }).join('');
  el.innerHTML = `
    <div class="wx-current">
      <span class="wx-icon">${icon}</span>
      <span class="wx-temp">${curTemp}</span>
      ${hasFrost ? '<span class="wx-frost-tag">❄️ Frost risk</span>' : ''}
    </div>
    <div class="wx-forecast">${forecast}</div>
    <div class="wx-attribution">Weather: Open-Meteo.com</div>`;
  el.hidden = false;
}

function renderFrostAlertBanner() {
  const el = document.getElementById('frost-alert-banner');
  if (!el) return;
  if (!weatherData?.daily?.temperature_2m_min || !Object.keys(myGarden).length) { el.hidden = true; return; }
  const frostIdx = weatherData.daily.temperature_2m_min.slice(0, 3).findIndex(t => t < 35);
  if (frostIdx === -1) { el.hidden = true; return; }
  const atrisk = Object.keys(myGarden).filter(n => FROST_SENSITIVE.has(n) && myGarden[n]?.planted);
  if (!atrisk.length) { el.hidden = true; return; }
  const dayLabel = ['tonight', 'tomorrow night', 'in 2 nights'][frostIdx];
  const names = atrisk.slice(0, 3).join(', ') + (atrisk.length > 3 ? ` +${atrisk.length - 3} more` : '');
  el.innerHTML = `<span class="fa-icon">❄️</span><div><strong>Frost possible ${dayLabel}</strong><span>Protect or cover: ${names}</span></div><button class="fa-dismiss" aria-label="Dismiss">×</button>`;
  el.querySelector('.fa-dismiss').addEventListener('click', () => { el.hidden = true; });
  el.hidden = false;
}

// ── This Week digest ────────────────────────────
function buildThisWeekItems() {
  const items = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);

  // 1. Live weather frost risk × garden
  if (weatherData?.daily?.temperature_2m_min) {
    const idx = weatherData.daily.temperature_2m_min.slice(0, 4).findIndex(t => t < 35);
    if (idx >= 0) {
      const atrisk = Object.keys(myGarden).filter(n => FROST_SENSITIVE.has(n) && myGarden[n]?.planted);
      if (atrisk.length) {
        const lbl = ['tonight','tomorrow','in 2 days','in 3 days'][idx];
        const ns = atrisk.slice(0, 2).join(', ') + (atrisk.length > 2 ? ` +${atrisk.length - 2}` : '');
        items.push({ icon: '❄️', text: `Frost possible ${lbl} — protect ${ns}`, type: 'urgent' });
      }
    }
  }

  // 2. Ready to harvest
  const ready = Object.keys(myGarden).filter(n => getGardenStatus(n)?.type === 'ready');
  if (ready.length) {
    const ns = ready.slice(0, 2).join(' & ') + (ready.length > 2 ? ` +${ready.length - 2}` : '');
    items.push({ icon: '🌾', text: `Harvest your ${ns} — ready now!`, type: 'urgent' });
  }

  // 3. Watering nudge for seedlings in dry spell
  const seedlings = Object.keys(myGarden).filter(n => {
    const p = myGarden[n]?.planted;
    return p && (today - new Date(p)) / 86400000 <= 21;
  });
  if (seedlings.length && weatherData?.daily?.precipitation_sum) {
    const rainNext3 = weatherData.daily.precipitation_sum.slice(0, 3).reduce((a, b) => a + b, 0);
    if (rainNext3 < 0.25) {
      const name = seedlings[0];
      const days = Math.round((today - new Date(myGarden[name].planted)) / 86400000);
      items.push({ icon: '💧', text: `Water ${name} — ${days}d seedling, dry forecast`, type: 'action' });
    }
  }

  // 4. Planting window from frost calendar
  if (selectedZone && items.length < 4) {
    const frost = FROST_DATES[selectedZone.toLowerCase()];
    const data = getPlantingData(selectedZone, currentMonth);
    if (frost?.last) {
      const d = parseFrostDate(frost.last);
      if (d) {
        const n = Math.round((d - today) / 86400000);
        if (n > 42 && data.startIndoors?.length)
          items.push({ icon: '🪴', text: `Start ${data.startIndoors[0]} indoors — ${n} days to last frost`, type: 'action' });
        else if (n > 0 && n <= 42 && data.startIndoors?.length)
          items.push({ icon: '🌿', text: `Harden off seedlings — last frost in ${n} days`, type: 'soon' });
        else if (n <= 0 && n >= -30 && data.directSow?.length)
          items.push({ icon: '🌱', text: `Frost season ended — direct sow ${data.directSow[0]} outdoors`, type: 'action' });
      }
    } else if (frost && !frost.last && !frost.first && data.directSow?.length && items.length < 2) {
      items.push({ icon: '🌱', text: `Frost-free zone — good time to sow ${data.directSow[0]}`, type: 'info' });
    }
  }

  // 5. Prompt to add crops if garden empty
  if (!items.length && selectedZone) {
    const data = getPlantingData(selectedZone, currentMonth);
    const total = ['startIndoors','directSow','transplant'].reduce((s, k) => s + (data[k]?.length || 0), 0);
    if (total > 0) items.push({ icon: '☝️', text: 'Add crops to My Garden for personalised weekly tips', type: 'info' });
  }

  return items.slice(0, 4);
}

function renderThisWeek() {
  const el = document.getElementById('this-week');
  if (!el || !selectedZone) { if (el) el.hidden = true; return; }
  const items = buildThisWeekItems();
  if (!items.length) { el.hidden = true; return; }
  el.innerHTML = `<div class="tw-header">📋 This Week</div>` +
    items.map(i => `<div class="tw-item tw-item--${i.type}"><span class="tw-icon">${i.icon}</span><span class="tw-text">${i.text}</span></div>`).join('');
  el.hidden = false;
}

// ── Metric conversion ────────────────────────────
function parseFraction(str) {
  if (!str) return NaN;
  str = String(str).trim();
  if (str.includes('/')) { const [a, b] = str.split('/'); return parseFloat(a) / parseFloat(b); }
  return parseFloat(str);
}

function convertMeasurement(str) {
  if (!str || !useMetric) return str;
  str = String(str);
  // X-Y in ranges
  str = str.replace(/(\d+(?:\/\d+)?)\s*[–-]\s*(\d+(?:\/\d+)?)\s*in\b(?!\/)/gi, (_, a, b) => {
    const av = parseFraction(a) * 2.54, bv = parseFraction(b) * 2.54;
    return av < 1 ? `${Math.round(av*10)}-${Math.round(bv*10)} mm` : `${av.toFixed(0)}-${bv.toFixed(0)} cm`;
  });
  // X in/week
  str = str.replace(/(\d+(?:\/\d+)?)\s*in\/week/gi, (_, a) => `${Math.round(parseFraction(a) * 25.4)} mm/week`);
  // X in single
  str = str.replace(/(\d+(?:\/\d+)?)\s*in\b/gi, (_, a) => {
    const v = parseFraction(a) * 2.54;
    return v < 1 ? `${Math.round(v * 10)} mm` : `${v.toFixed(0)} cm`;
  });
  // °F ranges
  str = str.replace(/(-?\d+)\s*°F\s*(?:to|-)\s*(-?\d+)\s*°F/gi, (_, a, b) =>
    `${Math.round((a-32)*5/9)}–${Math.round((b-32)*5/9)}°C`);
  // Single °F
  str = str.replace(/(-?\d+)\s*°F/gi, (_, f) => `${Math.round((parseFloat(f)-32)*5/9)}°C`);
  return str;
}

function toggleMetric() {
  useMetric = !useMetric;
  localStorage.setItem('pzf-metric', useMetric ? '1' : '0');
  const btn = document.getElementById('metric-toggle');
  if (btn) { btn.textContent = useMetric ? '°C' : '°F'; btn.classList.toggle('active', useMetric); }
  // Re-render open modal
  const modal = document.getElementById('crop-modal');
  if (modal?.open) {
    const name = document.getElementById('modal-crop-name')?.textContent;
    if (name && cropData?.[name]) {
      document.getElementById('modal-body').innerHTML = renderCropDetail(cropData[name]);
      const schedPH = document.getElementById('modal-schedule-placeholder');
      if (schedPH) schedPH.outerHTML = renderPlantingScheduleHTML(name);
      document.getElementById('modal-body').scrollTop = 0;
      renderModalGardenSections(name);
    }
  }
  // Re-render panel crop lists
  if (selectedZone) {
    const data = getPlantingData(selectedZone, currentMonth);
    for (const key of ['startIndoors','directSow','transplant','harvest']) {
      const sec = document.getElementById(`section-${key}`);
      if (sec && !sec.classList.contains('hidden'))
        document.getElementById(`list-${key}`).innerHTML = (data[key]||[]).map(renderCropItem).join('');
    }
  }
  renderWeatherStrip();
}

// ── Garden enhancements ─────────────────────────
function gardenSetNotes(name, notes) {
  if (!myGarden[name]) return;
  myGarden[name].notes = notes;
  saveGarden();
}

function gardenLogHarvest(name, date, notes) {
  if (!myGarden[name]) return;
  if (!myGarden[name].harvestLog) myGarden[name].harvestLog = [];
  myGarden[name].harvestLog.unshift({ date, notes: notes.trim() });
  saveGarden();
  refreshGardenUI(name);
}

function renderModalGardenSections(name) {
  const body = document.getElementById('modal-body');
  if (!body) return;
  body.querySelector('.modal-garden-section')?.remove();
  if (!isInGarden(name)) return;
  const notes = myGarden[name].notes || '';
  const log = myGarden[name].harvestLog || [];
  const today = new Date().toISOString().slice(0, 10);
  const sec = document.createElement('div');
  sec.className = 'modal-section modal-garden-section';
  sec.innerHTML = `
    <div class="modal-section-title">My Notes</div>
    <textarea class="garden-notes-ta" id="modal-notes-ta" placeholder="Observations, problems, reminders…" rows="3">${notes}</textarea>
    <div class="modal-section-title" style="margin-top:14px">
      Harvest Log${log.length ? `<span class="harvest-count">(${log.length})</span>` : ''}
    </div>
    ${log.length ? `<div class="harvest-log-list">${log.map(h =>
      `<div class="harvest-log-item"><span class="hl-date">${h.date}</span><span class="hl-notes">${h.notes || '—'}</span></div>`
    ).join('')}</div>` : ''}
    <div class="harvest-log-entry">
      <input type="date" id="harvest-date-in" value="${today}" max="${today}" aria-label="Harvest date">
      <input type="text" id="harvest-notes-in" placeholder="Yield / notes (optional)">
      <button class="harvest-log-add-btn" id="harvest-log-btn">Log</button>
    </div>`;
  body.appendChild(sec);
  let noteTimer;
  sec.querySelector('#modal-notes-ta').addEventListener('input', e => {
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => gardenSetNotes(name, e.target.value), 400);
  });
  sec.querySelector('#harvest-log-btn').addEventListener('click', e => {
    const date = sec.querySelector('#harvest-date-in').value;
    const nt = sec.querySelector('#harvest-notes-in').value;
    if (!date) return;
    showHarvestConfetti(e.target);
    gardenLogHarvest(name, date, nt);
    sec.querySelector('#harvest-notes-in').value = '';
  });
}

function checkCompanionConflicts(name) {
  if (!cropData) return;
  const newC = cropData[name];
  if (!newC?.avoid?.length) return;
  for (const existing of Object.keys(myGarden)) {
    if (existing === name) continue;
    if (newC.avoid.includes(existing)) {
      showToast(`⚠️ ${name} grows poorly near ${existing}`); return;
    }
    if (cropData[existing]?.avoid?.includes(name)) {
      showToast(`⚠️ ${existing} grows poorly near ${name}`); return;
    }
  }
}

// ── Zone centroid helper ────────────────────────
function getZoneCentroid(feature) {
  try {
    const c = turf.centroid(feature);
    return { lat: c.geometry.coordinates[1], lng: c.geometry.coordinates[0] };
  } catch { return null; }
}

// ── Onboarding ──────────────────────────────────
function initOnboarding() {
  if (localStorage.getItem('pzf-onboarded')) return;
  const overlay = document.getElementById('onboarding');
  if (!overlay) return;
  overlay.hidden = false;
  let step = 0;
  function goTo(n) {
    step = n;
    overlay.querySelectorAll('.ob-step').forEach((s, i) => s.classList.toggle('active', i === n));
    overlay.querySelectorAll('.ob-dot').forEach((d, i) => d.classList.toggle('active', i === n));
  }
  overlay.querySelectorAll('.ob-next').forEach(btn => btn.addEventListener('click', () => goTo(step + 1)));
  overlay.querySelectorAll('.ob-dot').forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));
  overlay.querySelectorAll('.ob-skip, .ob-finish').forEach(btn => btn.addEventListener('click', () => {
    overlay.hidden = true;
    localStorage.setItem('pzf-onboarded', '1');
  }));
}

// ── Keyboard shortcuts ──────────────────────────
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return;
    const modal = document.getElementById('crop-modal');
    if (modal?.open && e.key !== 'Escape') return;
    switch (e.key) {
      case 'ArrowLeft': case 'ArrowRight': {
        const delta = e.key === 'ArrowLeft' ? -1 : 1;
        const nm = Math.min(12, Math.max(1, currentMonth + delta));
        if (nm === currentMonth) break;
        currentMonth = nm;
        const sl = document.getElementById('month-slider');
        if (sl) sl.value = nm;
        updateMonthLabels(); updateSeasonBg();
        if (selectedZone) renderPanel();
        updateURL();
        break;
      }
      case 'g': case 'G':
        if (selectedZone) document.querySelector('.ptab[data-tab="garden"]')?.click();
        break;
      case 'b': case 'B':
        toggleBrowse(true); break;
      case '/':
        e.preventDefault();
        document.getElementById('address-input')?.focus();
        break;
      case '?':
        document.getElementById('shortcuts-modal')?.showModal();
        break;
    }
  });
  const sm = document.getElementById('shortcuts-modal');
  if (sm) {
    document.getElementById('shortcuts-close')?.addEventListener('click', () => sm.close());
    sm.addEventListener('click', e => { if (e.target === sm) sm.close(); });
  }
  document.getElementById('help-btn')?.addEventListener('click', () =>
    document.getElementById('shortcuts-modal')?.showModal());
}

let toastTimer = null;
function showToast(msg, type) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'show';
  if (type) toast.classList.add(`toast--${type}`);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ── Phase 3: Reminders ──────────────────────────
function gardenSetReminder(name, dateStr) {
  if (!myGarden[name]) return;
  myGarden[name].reminder = dateStr || null;
  saveGarden();
  checkReminders();
  refreshGardenUI(name);
}

function checkReminders() {
  const today = new Date(); today.setHours(0,0,0,0);
  const due = [];
  for (const [name, entry] of Object.entries(myGarden)) {
    if (!entry.reminder) continue;
    const rd = new Date(entry.reminder + 'T00:00:00');
    const n = Math.round((rd - today) / 86400000);
    if (n >= -1 && n <= 7) due.push({ name, date: entry.reminder, n });
  }
  renderReminderBanner(due);
}

function renderReminderBanner(due) {
  const el = document.getElementById('reminder-banner');
  if (!el) return;
  if (!due.length) { el.hidden = true; return; }
  const dayLabel = n => {
    if (n < 0)  return `${-n} day${-n===1?'':'s'} ago`;
    if (n === 0) return 'today';
    if (n === 1) return 'tomorrow';
    return `in ${n} days`;
  };
  el.innerHTML = due.map(({ name, date, n }) => {
    const c = cropData?.[name];
    const emoji = c?.emoji || '🌱';
    const urgency = n <= 1 ? '🔔' : '⏰';
    return `<div class="reminder-item">
      <span>${urgency}</span>
      <div class="reminder-item-body">
        <strong>${emoji} ${name}</strong>
        <span>Reminder: ${date} — ${dayLabel(n)}</span>
      </div>
      <button class="reminder-dismiss-btn" data-crop="${name}" aria-label="Dismiss reminder">×</button>
    </div>`;
  }).join('');
  el.hidden = false;
  el.querySelectorAll('.reminder-dismiss-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      gardenSetReminder(btn.dataset.crop, null);
    });
  });
}

// ── Phase 3: Garden stats ────────────────────────
function renderGardenStats() {
  const el = document.getElementById('garden-stats');
  if (!el) return;
  const names = Object.keys(myGarden);
  if (!names.length) { el.innerHTML = ''; return; }

  const today = new Date(); today.setHours(0,0,0,0);
  const growing = names.filter(n => myGarden[n]?.planted);
  const totalHarvests = names.reduce((sum, n) => sum + (myGarden[n]?.harvestLog?.length || 0), 0);

  // Find next upcoming harvest
  let nextHarvest = null, nextDays = Infinity;
  for (const name of growing) {
    const planted = new Date(myGarden[name].planted + 'T00:00:00');
    const daysPlanted = Math.round((today - planted) / 86400000);
    const harvestMin = parseHarvestDays(cropData?.[name]?.days);
    if (harvestMin != null) {
      const remaining = harvestMin - daysPlanted;
      if (remaining > 0 && remaining < nextDays) {
        nextDays = remaining; nextHarvest = name;
      }
    }
  }

  el.innerHTML = `
    <div class="garden-stats-row">
      <span class="garden-stat-item"><span class="garden-stat-value">${names.length}</span> saved</span>
      <span class="garden-stat-item"><span class="garden-stat-value">${growing.length}</span> growing</span>
      <span class="garden-stat-item"><span class="garden-stat-value">${totalHarvests}</span> harvests</span>
    </div>
    ${nextHarvest ? `<div class="garden-stats-next">
      Next harvest: <strong>${cropData?.[nextHarvest]?.emoji || '🌱'} ${nextHarvest}</strong> in ~${nextDays} day${nextDays===1?'':'s'}
    </div>` : ''}`;
}

// ── Phase 3: Garden Gantt ────────────────────────
function renderGardenGantt() {
  const el = document.getElementById('garden-gantt');
  if (!el) return;
  if (!selectedZone || !plantingData) { el.innerHTML = ''; return; }

  const names = Object.keys(myGarden);
  // Only include crops that have at least one activity in this zone
  const MONTH_ABBR = ['J','F','M','A','M','J','J','A','S','O','N','D'];

  const ganttRows = names.map(name => {
    const months = Array.from({length: 12}, (_, mi) => {
      const d = getPlantingData(selectedZone, mi + 1);
      const acts = [];
      if (d.startIndoors?.includes(name)) acts.push('S');
      if (d.directSow?.includes(name)) acts.push('D');
      if (d.transplant?.includes(name)) acts.push('T');
      if (d.harvest?.includes(name)) acts.push('H');
      return acts;
    });
    return { name, months };
  }).filter(r => r.months.some(acts => acts.length > 0));

  if (!ganttRows.length) { el.innerHTML = ''; return; }

  // Dominant activity priority: H > T > D > S
  function dominant(acts) {
    if (acts.includes('H')) return 'harvest';
    if (acts.includes('T')) return 'transplant';
    if (acts.includes('D')) return 'sow';
    if (acts.includes('S')) return 'start';
    return 'none';
  }

  const titleMap = { S: 'Start indoors', D: 'Direct sow', T: 'Transplant', H: 'Harvest' };

  const headerRow = `
    <div class="gantt-label-header"></div>
    ${MONTH_ABBR.map((m, i) => `<div class="gantt-header-cell${(i+1) === currentMonth ? ' gantt-cur-month' : ''}">${m}</div>`).join('')}`;

  const dataRows = ganttRows.map(({ name, months }) => {
    const info = cropData?.[name];
    const label = `<div class="gantt-crop-label" title="${name}">${info?.emoji || '🌱'} ${name}</div>`;
    const cells = months.map((acts, mi) => {
      const type = dominant(acts);
      const isCur = (mi + 1) === currentMonth;
      const tip = acts.length ? acts.map(a => titleMap[a]).join(', ') : '—';
      return `<div class="gantt-cell gantt-cell--${type}${isCur ? ' gantt-cell--cur' : ''}" title="${name}: ${tip}"></div>`;
    }).join('');
    return label + cells;
  }).join('');

  el.innerHTML = `
    <div class="gantt-wrap">
      <div class="gantt-title">🗓 Year Plan — My Garden</div>
      <div class="gantt-legend">
        <span class="gl-item gl-start">Indoors</span>
        <span class="gl-item gl-sow">Direct sow</span>
        <span class="gl-item gl-transplant">Transplant</span>
        <span class="gl-item gl-harvest">Harvest</span>
      </div>
      <div class="gantt-grid">${headerRow}${dataRows}</div>
    </div>`;
}

// ── Phase 3: Calendar crop search ───────────────
function filterCalendarSearch(query) {
  const q = query.trim().toLowerCase();
  const sections = ['startIndoors', 'directSow', 'transplant', 'harvest'];
  let anyVisible = false;
  for (const key of sections) {
    const list = document.getElementById(`list-${key}`);
    const section = document.getElementById(`section-${key}`);
    if (!list || !section) continue;
    if (section.classList.contains('hidden')) continue;
    let sectionVisible = false;
    for (const li of list.querySelectorAll('li')) {
      const name = li.dataset.crop || li.querySelector('[data-crop]')?.dataset.crop || li.textContent;
      const match = !q || name.toLowerCase().includes(q);
      li.hidden = !match;
      if (match) { sectionVisible = true; anyVisible = true; }
    }
    section.style.display = sectionVisible ? '' : 'none';
  }
  const noTasks = document.getElementById('no-tasks');
  if (noTasks) noTasks.style.display = (!anyVisible && q) ? 'block' : '';
}

// ── Phase 3: Share zone ──────────────────────────
function shareZone() {
  const url = window.location.href;
  navigator.clipboard?.writeText(url).then(() => {
    const btn = document.getElementById('share-btn');
    if (btn) { btn.classList.add('shared'); setTimeout(() => btn.classList.remove('shared'), 2000); }
    showToast('Zone URL copied ✓', 'success');
  }).catch(() => {
    showToast('Copy not supported — copy from address bar', 'info');
  });
}

// ── Phase 2: Mobile panel swipe ─────────────────
function initPanelSwipe() {
  const panel = document.getElementById('info-panel');
  const handle = document.getElementById('panel-drag-handle');
  if (!panel || !handle) return;

  let startY = 0, startH = 0, dragging = false;
  const SNAPS = [0.25, 0.50, 0.85]; // fraction of viewport height

  function snapTo(frac) {
    const vh = window.innerHeight;
    panel.style.height = Math.round(frac * vh) + 'px';
  }

  handle.addEventListener('touchstart', e => {
    startY = e.touches[0].clientY;
    startH = panel.offsetHeight;
    dragging = true;
    panel.style.transition = 'none';
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (!dragging) return;
    const dy = startY - e.touches[0].clientY;
    const newH = Math.max(80, Math.min(window.innerHeight * 0.92, startH + dy));
    panel.style.height = newH + 'px';
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    panel.style.transition = '';
    const vh = window.innerHeight;
    const frac = panel.offsetHeight / vh;
    // Find nearest snap
    const nearest = SNAPS.reduce((a, b) => Math.abs(b - frac) < Math.abs(a - frac) ? b : a);
    if (nearest <= 0.15) {
      hidePanel();
      panel.style.height = '';
    } else {
      snapTo(nearest);
    }
  });

  // Mouse support for desktop testing
  handle.addEventListener('mousedown', e => {
    startY = e.clientY;
    startH = panel.offsetHeight;
    dragging = true;
    panel.style.transition = 'none';
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dy = startY - e.clientY;
    const newH = Math.max(80, Math.min(window.innerHeight * 0.92, startH + dy));
    panel.style.height = newH + 'px';
  });
  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    panel.style.transition = '';
    const vh = window.innerHeight;
    const frac = panel.offsetHeight / vh;
    const nearest = SNAPS.reduce((a, b) => Math.abs(b - frac) < Math.abs(a - frac) ? b : a);
    if (nearest <= 0.15) { hidePanel(); panel.style.height = ''; }
    else snapTo(nearest);
  });
}

// ── Phase 2: Slider horizontal swipe ────────────
function initSliderSwipe() {
  const sliderBar = document.getElementById('slider-bar');
  if (!sliderBar) return;
  let startX = 0, startMonth = 1;

  sliderBar.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startMonth = currentMonth;
  }, { passive: true });

  sliderBar.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - startX;
    const delta = Math.round(dx / (sliderBar.offsetWidth / 11));
    const newMonth = Math.max(1, Math.min(12, startMonth - delta));
    if (newMonth !== currentMonth) {
      currentMonth = newMonth;
      const slider = document.getElementById('month-slider');
      if (slider) slider.value = currentMonth;
      updateMonthLabels();
      if (selectedZone) renderPanel();
    }
  }, { passive: true });
}

// ── Phase 2: Planting schedule ───────────────────
function computePlantingSchedule(name, zone) {
  if (!plantingData || !zone) return null;
  const MONTH_ABBR = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const result = { startIndoors: [], directSow: [], transplant: [], harvest: [] };

  for (let m = 1; m <= 12; m++) {
    const d = getPlantingData(zone, m);
    if (d.startIndoors?.includes(name))  result.startIndoors.push(m);
    if (d.directSow?.includes(name))     result.directSow.push(m);
    if (d.transplant?.includes(name))    result.transplant.push(m);
    if (d.harvest?.includes(name))       result.harvest.push(m);
  }

  function formatMonths(arr) {
    if (!arr.length) return null;
    // Compress to ranges
    const ranges = [];
    let start = arr[0], end = arr[0];
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] === end + 1) { end = arr[i]; }
      else { ranges.push(start === end ? MONTH_ABBR[start] : `${MONTH_ABBR[start]}–${MONTH_ABBR[end]}`); start = end = arr[i]; }
    }
    ranges.push(start === end ? MONTH_ABBR[start] : `${MONTH_ABBR[start]}–${MONTH_ABBR[end]}`);
    return ranges.join(', ');
  }

  return {
    startIndoors: formatMonths(result.startIndoors),
    directSow:    formatMonths(result.directSow),
    transplant:   formatMonths(result.transplant),
    harvest:      formatMonths(result.harvest),
  };
}

function renderPlantingScheduleHTML(name) {
  const zone = selectedZone;
  if (!zone || !plantingData) return '';
  const sched = computePlantingSchedule(name, zone);
  if (!sched) return '';

  const item = (cls, label, months) => `
    <div class="schedule-item schedule-item--${cls}${months ? '' : ' schedule-item--none'}">
      <span class="schedule-item-label">${label}</span>
      <span class="schedule-item-months">${months || 'n/a for this zone'}</span>
    </div>`;

  return `
    <div class="modal-schedule-section">
      <h4>Planting Schedule — Zone ${zone}</h4>
      <div class="schedule-grid">
        ${item('start', 'Start Indoors', sched.startIndoors)}
        ${item('sow', 'Direct Sow', sched.directSow)}
        ${item('transplant', 'Transplant', sched.transplant)}
        ${item('harvest', 'Harvest', sched.harvest)}
      </div>
    </div>`;
}

// ── Phase 2: Garden export / import ─────────────
function exportGarden() {
  const data = JSON.stringify(myGarden, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `my-garden-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Garden exported ✓', 'success');
}

function importGarden(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
      // Merge — existing entries win on conflict
      myGarden = { ...parsed, ...myGarden };
      saveGarden();
      refreshGardenUI('');
      showToast(`Imported ${Object.keys(parsed).length} crops ✓`, 'success');
    } catch {
      showToast('Import failed — invalid file', 'error');
    }
  };
  reader.readAsText(file);
}

// ── Phase 2: Zone pulse ──────────────────────────
function pulseZone() {
  if (!selectedLayer) return;
  let pulseCount = 0;
  const originalStyle = { fillOpacity: 1.0, weight: 3, color: '#fff', opacity: 1 };
  const pulseStyle = { fillOpacity: 0.5, weight: 4, color: '#4ade80', opacity: 1 };
  const interval = setInterval(() => {
    selectedLayer.setStyle(pulseCount % 2 === 0 ? pulseStyle : originalStyle);
    if (++pulseCount >= 4) { clearInterval(interval); selectedLayer.setStyle(originalStyle); }
  }, 180);
}

// ── Phase 2: Harvest confetti ────────────────────
function showHarvestConfetti(el) {
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const COLORS = ['#4ade80','#fbbf24','#f87171','#60a5fa','#c084fc','#fb923c','#34d399','#f9a8d4'];
  for (let i = 0; i < 14; i++) {
    const dot = document.createElement('div');
    dot.className = 'confetti-dot';
    const angle = (i / 14) * Math.PI * 2;
    const dist = 40 + Math.random() * 40;
    dot.style.cssText = `
      left:${cx}px; top:${cy}px;
      background:${COLORS[i % COLORS.length]};
      --tx:${Math.cos(angle) * dist}px;
      --ty:${Math.sin(angle) * dist}px;
    `;
    document.body.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove());
  }
}
