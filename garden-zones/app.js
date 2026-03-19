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

// ── Location name helpers ──────────────────────
const US_STATE_ABBR = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
  'Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA',
  'Kansas':'KS','Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD',
  'Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS',
  'Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH',
  'New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC',
  'North Dakota':'ND','Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA',
  'Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD','Tennessee':'TN',
  'Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA','Washington':'WA',
  'West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY','District of Columbia':'DC',
};
const CA_PROV_ABBR = {
  'Alberta':'AB','British Columbia':'BC','Manitoba':'MB','New Brunswick':'NB',
  'Newfoundland and Labrador':'NL','Nova Scotia':'NS','Ontario':'ON',
  'Prince Edward Island':'PE','Quebec':'QC','Saskatchewan':'SK',
  'Northwest Territories':'NT','Nunavut':'NU','Yukon':'YT',
};

function formatLocationName(addr) {
  if (!addr) return null;
  const city = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb;
  if (!city) return null;
  const cc = (addr.country_code || '').toUpperCase();
  const state = addr.state;
  if (cc === 'US' && state) return `${city}, ${US_STATE_ABBR[state] || state}`;
  if (cc === 'CA' && state) return `${city}, ${CA_PROV_ABBR[state] || state}`;
  return state ? `${city}, ${state}` : city;
}

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

// ── International country config ───────────────
const COUNTRY_CONFIG = {
  us: {
    label: 'United States', geojson: './data/zones.geojson',
    planting: './data/planting.json',
    center: [38, -97], zoom: 4, bounds: [[24,-125],[50,-66]],
    zoneSystem: 'usda', geocodeCodes: 'us',
  },
  ca: {
    label: 'Canada', geojson: './data/ca_zones.geojson',
    planting: './data/gardenate_ca.json',
    center: [57, -97], zoom: 4, bounds: [[42,-141],[84,-52]],
    zoneSystem: 'usda', geocodeCodes: 'ca',
  },
  au: {
    label: 'Australia', geojson: './data/au_zones.geojson',
    planting: './data/gardenate_au.json',
    center: [-25, 134], zoom: 4, bounds: [[-44,113],[-10,154]],
    zoneSystem: 'climate', geocodeCodes: 'au',
  },
  gb: {
    label: 'United Kingdom', geojson: './data/uk_zones.geojson',
    planting: './data/gardenate_uk.json',
    center: [54, -2], zoom: 6, bounds: [[49,-11],[61,2]],
    zoneSystem: 'climate', geocodeCodes: 'gb',
  },
  nz: {
    label: 'New Zealand', geojson: './data/nz_zones.geojson',
    planting: './data/gardenate_nz.json',
    center: [-41, 174], zoom: 5, bounds: [[-47,166],[-34,178]],
    zoneSystem: 'climate', geocodeCodes: 'nz',
  },
};

const CLIMATE_ZONE_COLORS = {
  cool: '#7ecef4', temperate: '#7bc67a', warm: '#f0e040',
  subtropical: '#f0b020', tropical: '#e04010', arid: '#cc8800',
};

const CLIMATE_ZONE_LABELS = {
  cool: 'Cool', temperate: 'Temperate', warm: 'Warm',
  subtropical: 'Subtropical', tropical: 'Tropical', arid: 'Arid',
};

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
let selectedCountry = localStorage.getItem('pzf-country') || 'us';
let currentMonth = new Date().getMonth() + 1;

let myGarden = {};
let gardenBeds = {};
let currentPanelTab = 'calendar';
let layoutMode = localStorage.getItem('pzf-layout') || 'map';
let journalEntries = [];
let _photoDB = null;
let selectedLocationName = null;
let savedLocations = [];
let _pendingPhoto = null; // dataURL staged for next journal entry

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
let browseSort = '';
let browseCompanions = false;

// ── Zone display helpers ───────────────────────
function isUSDASys() {
  return (COUNTRY_CONFIG[selectedCountry]?.zoneSystem ?? 'usda') === 'usda';
}
function getZoneColor(zone) {
  if (isUSDASys()) return ZONE_COLORS[parseInt(zone, 10)] || '#888888';
  return CLIMATE_ZONE_COLORS[zone] || '#888888';
}
function getZoneDisplayLabel(zone) {
  if (isUSDASys()) return `Zone ${String(zone).toUpperCase()}`;
  return (CLIMATE_ZONE_LABELS[zone] || zone) + ' Zone';
}
function getZoneFullLabel(zone) {
  if (isUSDASys()) return `Hardiness Zone ${String(zone).toUpperCase()}`;
  return (CLIMATE_ZONE_LABELS[zone] || zone) + ' Climate Zone';
}

// ── Entry point ───────────────────────────────
document.addEventListener('DOMContentLoaded', loadData);

// ── Data loading ──────────────────────────────
async function loadData() {
  setLoadingText('Loading zone data…');
  const cfg = COUNTRY_CONFIG[selectedCountry] || COUNTRY_CONFIG.us;
  try {
    const [zonesRes, plantingRes, cropsRes] = await Promise.all([
      fetch(cfg.geojson),
      fetch(cfg.planting),
      fetch('./data/crops.json')
    ]);
    if (!zonesRes.ok) throw new Error(`zones: ${zonesRes.status}`);
    if (!plantingRes.ok) throw new Error(`planting: ${plantingRes.status}`);

    zonesData    = await zonesRes.json();
    plantingData = await plantingRes.json();
    cropData     = cropsRes.ok ? await cropsRes.json() : {};
    mergeCustomCrops();

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
  const cfg = COUNTRY_CONFIG[selectedCountry] || COUNTRY_CONFIG.us;
  map = L.map(container, { center: cfg.center, zoom: cfg.zoom, minZoom: 3, maxZoom: 12 });
  zonesLayer = L.geoJSON(zonesData, {
    style: styleFeature,
    onEachFeature: attachFeature
  }).addTo(map);
  if (cfg.bounds) map.fitBounds(cfg.bounds);
  document.getElementById('loading-overlay').classList.add('hidden');
}

function styleFeature(feature) {
  const zone = feature.properties.zone || '';
  return {
    fillColor:   getZoneColor(zone),
    fillOpacity: 1.0,
    color:       '#fff',
    weight:      0.3,
    opacity:     0.4
  };
}

function attachFeature(feature, layer) {
  const zone   = feature.properties.zone || '?';
  const trange = feature.properties.trange || '';
  const label  = getZoneDisplayLabel(zone);
  layer.bindTooltip(
    `<strong>${label}</strong>${trange ? '<br>' + trange : ''}`,
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
  localStorage.setItem('pzf-last-zone', selectedZone);
  localStorage.setItem('pzf-last-location', selectedLocationName || '');
  renderPanel();
  showPanel();
  updateURL();
  fetchWeatherAndUpdate();
  // Auto-switch to garden mode on first zone selection
  if (layoutMode === 'map') {
    setTimeout(() => { setLayoutMode('garden'); maybeShowInstallBanner(); }, 450);
  }
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

function renderLocationName() {
  const el = document.getElementById('location-name');
  if (el) {
    if (selectedLocationName) {
      el.textContent = '📍 ' + selectedLocationName;
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  }
  const saveBtn = document.getElementById('save-location-btn');
  if (saveBtn) saveBtn.hidden = !selectedZone;
  // Update print header
  if (selectedZone) {
    const ph = document.getElementById('print-header');
    if (ph) {
      const loc = selectedLocationName ? ` — ${selectedLocationName}` : '';
      ph.textContent = `Plant Zone Finder${loc} — Zone ${getZoneDisplayLabel(selectedZone)} — ${MONTH_NAMES[currentMonth]}`;
    }
  }
}

function renderPanel() {
  if (!selectedZone) return;

  const zone  = selectedZone;
  const month = currentMonth;

  renderLocationName();
  renderSavedLocationsBar();

  // Zone badge
  const color = getZoneColor(zone);
  const badge = document.getElementById('zone-badge');
  badge.textContent       = isUSDASys() ? zone.toUpperCase() : (CLIMATE_ZONE_LABELS[zone] || zone);
  badge.style.background  = color + '33';
  badge.style.borderColor = color;
  badge.style.color       = color;

  document.getElementById('zone-name').textContent = getZoneFullLabel(zone);
  const trange = isUSDASys() ? (selectedFeature?.properties?.trange || '') : '';
  document.getElementById('zone-temp').textContent = trange ? `Avg min: ${trange}` : '';

  // Zone climate card
  const frostEl = document.getElementById('frost-dates');
  const climate = getZoneClimateInfo(zone);
  if (climate) {
    if (climate.frostFree) {
      frostEl.innerHTML = `<div class="zone-climate-card">
        <div class="climate-frosts"><span class="climate-frost-item">🌴 Frost-free zone</span></div>
        <div class="climate-meta"><span class="climate-type-badge">Tropical</span><span class="climate-season-days">Year-round growing</span></div>
      </div>`;
    } else {
      const { frost, lastM, firstM, seasonDays, climateType } = climate;
      const ABBR = ['J','F','M','A','M','J','J','A','S','O','N','D'];
      // Season bar: left = start of growing window, width = length
      let barLeft = 0, barWidth = 100;
      if (lastM && firstM && firstM > lastM) {
        barLeft  = ((lastM - 1) / 12 * 100).toFixed(1);
        barWidth = ((firstM - lastM) / 12 * 100).toFixed(1);
      }
      const monthLabels = ABBR.map((a, i) => {
        const cls = (i + 1) === lastM ? ' has-last' : (i + 1) === firstM ? ' has-first' : '';
        return `<span class="climate-bar-month${cls}">${a}</span>`;
      }).join('');

      frostEl.innerHTML = `<div class="zone-climate-card">
        <div class="climate-frosts">
          ${frost.last  ? `<span class="climate-frost-item">❄️ Last frost <strong>${frost.last}</strong></span>` : ''}
          ${frost.first ? `<span class="climate-frost-item">🍂 First frost <strong>${frost.first}</strong></span>` : ''}
        </div>
        <div class="climate-meta">
          <span class="climate-type-badge">${climateType}</span>
          ${seasonDays ? `<span class="climate-season-days">~<strong>${seasonDays}</strong> day growing season</span>` : ''}
        </div>
        <div class="climate-season-bar-wrap">
          <div class="climate-season-bar-fill" style="left:${barLeft}%;width:${barWidth}%"></div>
        </div>
        <div class="climate-bar-months">${monthLabels}</div>
      </div>`;
    }
    frostEl.hidden = false;
  } else {
    frostEl.hidden = true;
  }

  // Print header handled by renderLocationName() above

  // Harvest banner + Countdown cards + smart digest (use cached weather data)
  renderHarvestReadyBanner();
  renderGardenDashboard();
  renderCountdownCards();
  renderWeatherStrip();
  renderWateringAlert();
  renderThisWeek();
  renderFrostAlertBanner();

  // Month display + context
  document.getElementById('month-display').textContent = MONTH_NAMES[month];
  const ctx   = isUSDASys() ? getMonthContext(zone, month) : '';
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
  if (available.includes(zoneStr)) return zoneStr;
  const n = parseFloat(zoneStr);
  if (isNaN(n)) return available[0]; // climate zone fallback
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
  initBeds();
  initJournal();
  initChecklist();
  initCustomCrops();
  initCountrySelector();
  initShareModal();
  initSavedLocations();
  initNotifBtn();
  checkAndFireNotifications();
  initLayoutToggle();
  initInstallPrompt();
  initOfflineIndicator();
  initQuickSearch();
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
    const qaBtn = e.target.closest('.crop-quick-add');
    if (qaBtn) {
      e.stopPropagation();
      const name = qaBtn.dataset.crop;
      if (name) isInGarden(name) ? gardenRemove(name) : gardenAdd(name);
      return;
    }
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
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        selectedLocationName = null;
        const found = selectZoneByPoint(lat, lng);
        if (!found) showToast('No planting zone found at your location');
        zoomToPoint(lat, lng);
        map.once('moveend', highlightZone);
        btn.classList.remove('locating');
        btn.disabled = false;
        // Reverse geocode async — updates panel once name resolves
        const name = await nominatimReverseGeocode(lat, lng);
        if (name && selectedLat === lat && selectedLng === lng) {
          selectedLocationName = name;
          renderLocationName();
        }
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
    const { lat, lon, locationName } = result;
    selectedLocationName = locationName || null;
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
    new URLSearchParams({ q: address, format: 'json', limit: 1, addressdetails: 1, countrycodes: COUNTRY_CONFIG[selectedCountry]?.geocodeCodes || 'us' });
  const res = await fetch(url, { signal, headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();
  if (!data.length) return null;
  const item = data[0];
  return { lat: parseFloat(item.lat), lon: parseFloat(item.lon), locationName: formatLocationName(item.address) };
}

async function nominatimReverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?` +
      new URLSearchParams({ lat, lon: lng, format: 'json', addressdetails: 1 });
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) return null;
    const data = await res.json();
    return formatLocationName(data.address);
  } catch { return null; }
}

function zoomToPoint(lat, lng) {
  map.flyTo([lat, lng], 9, { duration: 1.5 });
}

// ── Crop card rendering ────────────────────────
function renderCropItem(name) {
  const c = cropData && cropData[name];
  if (!c) return `<li class="crop-plain">${name}</li>`;
  const inG = isInGarden(name);
  return `<li class="crop-card" data-crop="${name}" role="button" tabindex="0" aria-label="${name} — tap for details">
    <div class="crop-card-body">
      <div class="crop-title">${c.emoji || '🌱'} ${name}${inG ? '<span class="crop-garden-star">★</span>' : ''}${c.custom ? '<span class="custom-crop-badge">Custom</span>' : ''}</div>
      <div class="crop-detail">${c.custom ? (c.days ? `🗓 ${c.days} days to harvest` : 'Custom crop') : `${convertMeasurement(c.depth)} deep · ${convertMeasurement(c.spacing)} apart · ${convertMeasurement(c.water)} · ${c.days}`}</div>
      ${c.tip ? `<div class="crop-tip">${c.tip}</div>` : ''}
      ${c.custom && c.description ? `<div class="crop-tip">${c.description}</div>` : ''}
    </div>
    <button class="crop-quick-add${inG ? ' in-garden' : ''}" data-crop="${name}" aria-label="${inG ? 'Remove from' : 'Add to'} My Garden" title="${inG ? 'Remove from My Garden' : 'Add to My Garden'}">${inG ? '★' : '☆'}</button>
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
  document.getElementById('modal-body').innerHTML    = c.custom ? renderCustomCropDetail(c, name) : renderCropDetail(c);
  document.getElementById('modal-body').scrollTop   = 0;
  if (!c.custom) {
    const schedPH = document.getElementById('modal-schedule-placeholder');
    if (schedPH) schedPH.outerHTML = renderPlantingScheduleHTML(name);
  }
  renderModalGardenBar(name);
  renderModalGardenSections(name);
  if (!c.custom) renderRelatedCrops(name);
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

function renderCustomCropDetail(c, name) {
  const deleteBtn = `<button id="modal-delete-custom" style="
    background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);
    border-radius:6px;color:#f87171;cursor:pointer;font-size:12px;font-weight:600;
    margin-top:8px;padding:6px 14px;width:100%;transition:background 0.15s;">
    🗑 Delete this custom crop
  </button>`;
  const html = `
    <div class="modal-section">
      <div class="modal-section-title">Custom Crop <span class="custom-crop-badge">Custom</span></div>
      ${c.category ? `<div class="detail-row"><span class="detail-label">Category</span><span>${c.category}</span></div>` : ''}
      ${c.days     ? `<div class="detail-row"><span class="detail-label">Days to harvest</span><span>${c.days}</span></div>` : ''}
      ${c.description ? `<div class="detail-row"><span class="detail-label">Notes</span><span>${c.description}</span></div>` : ''}
      ${deleteBtn}
    </div>`;
  // Wire delete button after render
  setTimeout(() => {
    document.getElementById('modal-delete-custom')?.addEventListener('click', () => {
      if (!confirm(`Delete "${name}" and remove it from your garden?`)) return;
      deleteCustomCrop(name);
      document.getElementById('crop-modal')?.close();
      renderBrowseGrid();
      showToast(`${name} deleted`, 'success');
    });
  }, 0);
  return html;
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

  selectedLocationName = localStorage.getItem('pzf-last-location') || null;
  const zoneToRestore = z || localStorage.getItem('pzf-last-zone');
  if (zoneToRestore && zonesLayer) {
    let found = false;
    zonesLayer.eachLayer(layer => {
      if (found) return;
      if (layer.feature?.properties?.zone === zoneToRestore.toLowerCase()) {
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

  const climate = getZoneClimateInfo(selectedZone);
  const lastFrostM  = climate?.lastM  || null;
  const firstFrostM = climate?.firstM || null;

  for (let m = 1; m <= 12; m++) {
    const data  = getPlantingData(selectedZone, m);
    const actKeys = ['startIndoors','directSow','transplant','harvest'];
    const present = actKeys.filter(k => data[k]?.length > 0);
    const count = present.length;
    const pct   = (count / 4 * 100).toFixed(0);

    // Dominant bar colour class
    const barClass = present.includes('harvest')    ? 'ycal-bar-harvest'    :
                     present.includes('transplant') ? 'ycal-bar-transplant' :
                     present.includes('directSow')  ? 'ycal-bar-sow'        :
                     present.length > 0             ? 'ycal-bar-start'      : '';

    const isLastFrost  = m === lastFrostM;
    const isFirstFrost = m === firstFrostM;
    const frostMark = isLastFrost  ? '<span class="ycal-frost-mark" title="Last frost">❄</span>'  :
                      isFirstFrost ? '<span class="ycal-frost-mark" title="First frost">🍂</span>' : '';

    const cell = document.createElement('div');
    cell.className = `ycal-cell${barClass ? ' ' + barClass : ''}${m === currentMonth ? ' ycal-active' : ''}`;
    cell.dataset.month = m;
    cell.title = MONTH_NAMES[m];
    cell.setAttribute('role', 'button');
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('aria-label', `${MONTH_NAMES[m]}: ${count} activities`);
    cell.innerHTML = `
      <div class="ycal-bar-wrap"><div class="ycal-bar-fill" style="height:${pct}%"></div></div>
      <span class="ycal-label">${MONTH_NAMES[m][0]}</span>
      ${frostMark}`;
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

  const sortSel = document.getElementById('browse-sort');
  if (sortSel) {
    sortSel.addEventListener('change', () => {
      browseSort = sortSel.value;
      renderBrowseGrid();
    });
  }

  const companions = document.getElementById('browse-companions');
  if (companions) {
    companions.addEventListener('change', () => {
      browseCompanions = companions.checked;
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

  // Companion filter: crops that are companions to anything in my garden
  const gardenCompanionSet = new Set();
  if (browseCompanions || true) { // always build for badge rendering
    for (const gName of Object.keys(myGarden)) {
      (cropData[gName]?.companions || []).forEach(c => gardenCompanionSet.add(c));
    }
  }
  if (browseCompanions) {
    crops = crops.filter(([name]) => gardenCompanionSet.has(name) && !isInGarden(name));
  }

  // Disable in-season / companion checkboxes when no zone / garden
  const cb = document.getElementById('browse-inseason');
  if (cb) cb.disabled = !selectedZone;
  const cbC = document.getElementById('browse-companions');
  if (cbC) cbC.disabled = Object.keys(myGarden).length === 0;

  // Sort
  const DIFF_ORDER = { Easy: 0, Moderate: 1, Hard: 2 };
  if (browseSort === 'az') {
    crops.sort(([a], [b]) => a.localeCompare(b));
  } else if (browseSort === 'za') {
    crops.sort(([a], [b]) => b.localeCompare(a));
  } else if (browseSort === 'fastest') {
    crops.sort(([, a], [, b]) => (parseHarvestDays(a.days) || 999) - (parseHarvestDays(b.days) || 999));
  } else if (browseSort === 'slowest') {
    crops.sort(([, a], [, b]) => (parseHarvestDays(b.days) || 0) - (parseHarvestDays(a.days) || 0));
  } else if (browseSort === 'easy') {
    crops.sort(([, a], [, b]) => (DIFF_ORDER[a.difficulty] ?? 9) - (DIFF_ORDER[b.difficulty] ?? 9));
  } else if (selectedZone && !browseInSeason) {
    // Default: in-season first, then companions, then alphabetical
    crops.sort(([a], [b]) => {
      const aS = activeSet.has(a) ? 0 : 1;
      const bS = activeSet.has(b) ? 0 : 1;
      if (aS !== bS) return aS - bS;
      const aC = gardenCompanionSet.has(a) ? 0 : 1;
      const bC = gardenCompanionSet.has(b) ? 0 : 1;
      return aC !== bC ? aC - bC : a.localeCompare(b);
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
    const cat          = c.custom ? (c.category || '') : (CROP_CATEGORY_MAP[name] || '');
    const isActive     = activeSet.has(name);
    const isCompanion  = gardenCompanionSet.has(name) && !isInGarden(name);
    const diff         = c.difficulty ? c.difficulty.toLowerCase() : '';
    return `<div class="browse-card${isActive ? ' browse-card--active' : ''}" data-crop="${name}" role="button" tabindex="0" style="animation-delay:${i * 0.025}s">
      <div class="browse-card-emoji">${c.emoji || '🌱'}</div>
      <div class="browse-card-name">${name}</div>
      <div class="browse-card-meta">
        ${cat  ? `<span class="browse-card-cat">${cat}</span>` : ''}
        ${diff ? `<span class="diff-dot diff-dot--${diff}" title="${c.difficulty}"></span>` : ''}
      </div>
      ${isActive     ? '<div class="browse-card-season">In season</div>'   : ''}
      ${isCompanion  ? '<div class="browse-card-companion">🤝 Companion</div>' : ''}
      ${isInGarden(name) ? '<div class="browse-card-saved">★ Saved</div>' : ''}
      ${c.custom ? '<div class="browse-card-custom">Custom</div>' : ''}
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
  renderHarvestReadyBanner();
  updateJournalCropSelect();
  checkAchievements();
  if (currentPanelTab === 'garden') { renderGardenTab(); renderGrowNext(); }
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

// ── Phase 7: Growth stage ────────────────────────
function getGrowthStage(daysPlanted, harvestMin) {
  if (!harvestMin || daysPlanted < 0) return null;
  const pct = daysPlanted / harvestMin;
  if (pct >= 1.0) return { stage: 'ready',       icon: '🌾', label: 'Ready to harvest', pct: 1 };
  if (pct >= 0.8) return { stage: 'maturing',    icon: '🌸', label: 'Nearly ready',     pct };
  if (pct >= 0.35) return { stage: 'growing',    icon: '🌿', label: 'Growing',           pct };
  if (pct >= 0.08) return { stage: 'seedling',   icon: '🪴', label: 'Seedling',          pct };
  return                  { stage: 'germinating', icon: '🌱', label: 'Germinating',       pct };
}

function getGardenStatus(name) {
  const entry = myGarden[name];
  if (!entry) return null;
  if (!entry.planted) return { type: 'saved', label: 'Saved — no planting date', stage: null };
  const today = new Date(); today.setHours(0,0,0,0);
  const daysPlanted = Math.round((today - new Date(entry.planted)) / 86400000);
  const harvestMin = parseHarvestDays(cropData[name]?.days);
  const stage = getGrowthStage(daysPlanted, harvestMin);
  if (!harvestMin) return { type: 'growing', label: `Planted ${daysPlanted}d ago`, stage, daysPlanted };
  const remaining = harvestMin - daysPlanted;
  if (remaining <= 0) return { type: 'ready', label: 'Ready to harvest!', stage, daysPlanted };
  return { type: 'growing', label: `~${remaining}d to harvest`, stage, daysPlanted };
}

// ── Phase 7: Today's garden tasks ────────────────
function renderGardenTasks() {
  const el = document.getElementById('garden-tasks');
  if (!el) return;
  const names = Object.keys(myGarden);
  if (!names.length) { el.innerHTML = ''; return; }

  const today = new Date(); today.setHours(0,0,0,0);
  const tasks = [];

  for (const name of names) {
    const entry = myGarden[name];
    const c = cropData[name];
    if (!c) continue;

    // Ready to harvest
    const status = getGardenStatus(name);
    if (status?.type === 'ready') {
      tasks.push({ icon: '🌾', head: `Harvest your ${name}`, sub: status.label, type: 'urgent', crop: name });
      continue;
    }

    if (!entry.planted) {
      // Nudge to log a planting date if already in season
      if (selectedZone) {
        const data = getPlantingData(selectedZone, currentMonth);
        const inSeason = ['startIndoors','directSow','transplant'].some(k => data[k]?.includes(name));
        if (inSeason) tasks.push({ icon: '📅', head: `Log a planting date for ${name}`, sub: 'Track progress and get a harvest countdown', type: 'info', crop: name });
      }
      continue;
    }

    const daysPlanted = status?.daysPlanted ?? 0;
    const harvestMin  = parseHarvestDays(c.days);
    const stage       = status?.stage;

    // Frost risk for frost-sensitive crops
    if (FROST_SENSITIVE.has(name) && weatherData?.daily?.temperature_2m_min) {
      const idx = weatherData.daily.temperature_2m_min.slice(0, 3).findIndex(t => t < 35);
      if (idx >= 0) {
        const when = ['tonight', 'tomorrow', 'in 2 days'][idx];
        tasks.push({ icon: '❄️', head: `Cover ${name} — frost ${when}`, sub: 'Frost-sensitive crop at risk', type: 'urgent', crop: name });
      }
    }

    // Germination: keep moist
    if (stage?.stage === 'germinating') {
      tasks.push({ icon: '💧', head: `Keep ${name} moist`, sub: `${daysPlanted}d since sowing — seeds need consistent moisture to germinate`, type: 'action', crop: name });
    }

    // Thinning: ~14 days for direct-sown crops
    if (daysPlanted >= 12 && daysPlanted <= 18 && stage?.stage === 'seedling') {
      if (selectedZone) {
        const data = getPlantingData(selectedZone, currentMonth);
        if (data.directSow?.includes(name))
          tasks.push({ icon: '✂️', head: `Thin your ${name}`, sub: `${daysPlanted}d old — thin to proper spacing for best yields`, type: 'action', crop: name });
      }
    }

    // Harden off: 2 weeks before last frost, if started indoors
    if (selectedZone && stage?.stage === 'seedling') {
      const frost = FROST_DATES[selectedZone.toLowerCase()];
      if (frost?.last) {
        const lastFrost = parseFrostDate(frost.last);
        if (lastFrost) {
          const daysToFrost = Math.round((lastFrost - today) / 86400000);
          if (daysToFrost > 0 && daysToFrost <= 14) {
            const data = getPlantingData(selectedZone, currentMonth);
            if (data.startIndoors?.includes(name) || data.transplant?.includes(name))
              tasks.push({ icon: '🌤', head: `Harden off ${name}`, sub: `Last frost ~${daysToFrost} days away — start bringing outside for a few hours daily`, type: 'soon', crop: name });
          }
        }
      }
    }

    // Nearly ready — prepare for harvest
    if (stage?.stage === 'maturing' && harvestMin) {
      const remaining = harvestMin - daysPlanted;
      tasks.push({ icon: '👀', head: `Watch ${name} closely`, sub: `~${remaining} days to harvest — check daily for ripeness`, type: 'soon', crop: name });
    }
  }

  // Nudge to add crops if garden has nothing planted
  if (!tasks.length && names.length) {
    tasks.push({ icon: '📅', head: 'Log planting dates', sub: 'Add dates to your crops to unlock harvest countdowns and personalised tasks', type: 'info', crop: null });
  }

  if (!tasks.length) { el.innerHTML = ''; return; }

  el.innerHTML = `<div class="garden-tasks-header">📋 Today's Tasks</div>` +
    tasks.slice(0, 5).map(t => `
      <div class="garden-task garden-task--${t.type}"${t.crop ? ` data-crop="${t.crop}"` : ''} style="cursor:${t.crop ? 'pointer' : 'default'}">
        <span class="garden-task-icon">${t.icon}</span>
        <div class="garden-task-body"><strong>${t.head}</strong><span>${t.sub}</span></div>
      </div>`).join('');

  // Click task to open crop modal
  el.addEventListener('click', e => {
    const task = e.target.closest('.garden-task[data-crop]');
    if (task?.dataset.crop) openCropDetail(task.dataset.crop);
  }, { once: true });
}

// ── Phase 8: Grow this next ───────────────────────
function buildGrowNextRecommendations() {
  if (!cropData || !selectedZone) return [];

  const inGarden = new Set(Object.keys(myGarden));
  const data = getPlantingData(selectedZone, currentMonth);
  const inSeasonSet = new Set([
    ...(data.startIndoors || []),
    ...(data.directSow   || []),
    ...(data.transplant  || []),
  ]);

  // Build companion set from garden crops (and which garden crop recommended them)
  const companionScore = {};  // name -> { score, fromCrops }
  for (const gName of inGarden) {
    (cropData[gName]?.companions || []).forEach(c => {
      if (!inGarden.has(c) && cropData[c]) {
        if (!companionScore[c]) companionScore[c] = { score: 0, from: [] };
        companionScore[c].score++;
        companionScore[c].from.push(gName);
      }
    });
  }

  // Score every non-garden crop
  const scored = Object.keys(cropData)
    .filter(name => !inGarden.has(name) && !cropData[name].custom)
    .map(name => {
      const companion = companionScore[name] || null;
      const season    = inSeasonSet.has(name);
      const score     = (companion ? companion.score * 3 : 0) + (season ? 2 : 0);
      return { name, score, companion, season };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 6);
}

function renderGrowNext() {
  const el = document.getElementById('grow-next');
  if (!el) return;
  const recs = buildGrowNextRecommendations();
  if (!recs.length) { el.innerHTML = ''; return; }

  el.innerHTML = `<div class="grow-next-header">💡 Grow this next</div>
    <div class="grow-next-grid">
      ${recs.map(r => {
        const c = cropData[r.name];
        const why = r.companion
          ? `Companion to your ${r.companion.from.slice(0,2).join(' & ')}`
          : 'In season now';
        const tags = [
          r.companion ? `<span class="grow-next-tag grow-next-tag--companion">🤝 Companion</span>` : '',
          r.season    ? `<span class="grow-next-tag grow-next-tag--season">In season</span>`    : '',
        ].join('');
        return `<div class="grow-next-card" data-crop="${r.name}">
          <div class="grow-next-emoji">${c.emoji || '🌱'}</div>
          <div class="grow-next-name">${r.name}</div>
          <div class="grow-next-why">${why}</div>
          <div class="grow-next-tags">${tags}</div>
          <button class="grow-next-add-btn" data-crop="${r.name}">+ Add</button>
        </div>`;
      }).join('')}
    </div>`;

  el.addEventListener('click', e => {
    const addBtn = e.target.closest('.grow-next-add-btn');
    if (addBtn) { e.stopPropagation(); gardenAdd(addBtn.dataset.crop); renderGrowNext(); return; }
    const card = e.target.closest('.grow-next-card');
    if (card?.dataset.crop) openCropDetail(card.dataset.crop);
  }, { once: true });
}

function renderGardenTab() {
  const list = document.getElementById('garden-list');
  const emptyMsg = document.getElementById('garden-empty-msg');
  if (!list) return;
  const names = Object.keys(myGarden);
  if (!names.length) { list.innerHTML = ''; if (emptyMsg) emptyMsg.hidden = false; renderGardenBeds(); renderCompanionMatrix(); return; }
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
        entry.rating ? renderStars(entry.rating, name, true) : '',
      ].join('');
      html += `<div class="garden-item garden-item--${type}" data-crop="${name}">
        <div class="garden-item-main">
          <span class="garden-item-emoji">${c?.emoji || '🌱'}</span>
          <div class="garden-item-info">
            <span class="garden-item-name">${name}${badges}</span>
            <span class="garden-item-status">${status?.label || ''}</span>
            ${entry.bedId && gardenBeds[entry.bedId] ? `<span class="garden-item-bed-tag">${gardenBeds[entry.bedId].emoji} ${gardenBeds[entry.bedId].name}</span>` : ''}
            ${entry.harvestLog?.length ? `<span class="garden-last-harvest">🌾 Last harvest: ${entry.harvestLog[0].date}</span>` : ''}
            ${status?.stage ? `
            <div class="growth-bar-wrap" title="${status.stage.label}">
              <div class="growth-bar-fill growth-bar--${status.stage.stage}" style="width:${Math.min(100,Math.round(status.stage.pct*100))}%"></div>
            </div>
            <div class="growth-stage-row"><span class="growth-stage-icon">${status.stage.icon}</span>${status.stage.label}</div>` : ''}
          </div>
        </div>
        <div class="garden-item-actions">
          ${(type === 'ready' || type === 'growing') && plantedVal ? `<button class="garden-harvest-btn" data-crop="${name}" title="Log a harvest">🌾</button>` : ''}
          ${!plantedVal ? `<button class="garden-log-btn" data-crop="${name}">Log date</button>` : ''}
          <input type="date" class="garden-date-input" data-crop="${name}" value="${plantedVal}" max="${today}" aria-label="Planting date for ${name}"${!plantedVal ? ' style="display:none"' : ''}>
          <button class="garden-remove-btn" data-crop="${name}" aria-label="Remove ${name}">×</button>
        </div>
      </div>`;
    }
  }
  list.innerHTML = html;
  renderGardenDashboard();
  renderGardenTasks();
  renderGardenChecklist();
  renderGardenBeds();
  renderCompanionMatrix();
  renderGardenStats();
  renderGardenGantt();
  renderGardenFooter();
  renderGrowNext();
  checkAchievements();
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
        ${Object.keys(gardenBeds).length ? `<select class="modal-bed-select" id="modal-bed-select" aria-label="Assign to bed">
          <option value="">📍 No bed</option>
          ${Object.entries(gardenBeds).map(([id, b]) =>
            `<option value="${id}"${myGarden[name]?.bedId === id ? ' selected' : ''}>${b.emoji} ${b.name}</option>`
          ).join('')}
        </select>` : ''}
      </div>`;
    bar.querySelector('#modal-planted-input').addEventListener('change', e => gardenSetPlanted(name, e.target.value));
    bar.querySelector('#modal-garden-remove').addEventListener('click', () => gardenRemove(name));
    bar.querySelector('#modal-seeds-check').addEventListener('change', e => {
      if (myGarden[name]) { myGarden[name].hasSeeds = e.target.checked; saveGarden(); if (currentPanelTab === 'garden') renderGardenTab(); }
    });
    bar.querySelector('#modal-reminder-input').addEventListener('change', e => gardenSetReminder(name, e.target.value));
    bar.querySelector('#modal-bed-select')?.addEventListener('change', e => assignCropToBed(name, e.target.value));

    // Inline star rating row
    const ratingDiv = document.createElement('div');
    ratingDiv.className = 'modal-garden-rating-row';
    ratingDiv.innerHTML = `<span>Season rating:</span>${renderStars(myGarden[name]?.rating || 0, name, false)}`;
    bar.appendChild(ratingDiv);
    ratingDiv.querySelectorAll('.star-btn').forEach(btn => {
      btn.addEventListener('click', () => gardenSetRating(name, parseInt(btn.dataset.star, 10)));
    });
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
    document.getElementById('tab-journal').hidden  = (currentPanelTab !== 'journal');
    if (currentPanelTab === 'garden') renderGardenTab();
    if (currentPanelTab === 'journal') renderJournalTab();
  });

  // Garden tab delegated events
  const gardenTab = document.getElementById('tab-garden');
  gardenTab?.addEventListener('click', e => {
    if (e.target.closest('.garden-harvest-btn')) {
      const name = e.target.closest('.garden-harvest-btn').dataset.crop;
      const today = new Date().toISOString().slice(0, 10);
      gardenLogHarvest(name, today, '');
      showToast(`🌾 Harvest logged for ${name}!`, 'success');
      return;
    }
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
      `&forecast_days=7&past_days=5&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=auto`;
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
  renderWateringAlert();
  renderThisWeek();
  checkFrostNotification();
}

function renderWeatherStrip() {
  const el = document.getElementById('weather-strip');
  if (!el) return;
  if (!weatherData?.current || !selectedZone) { el.hidden = true; return; }
  const c = weatherData.current;
  const d = weatherData.daily;
  const toC = f => Math.round((f - 32) * 5 / 9);
  const toMM = inches => (inches * 25.4).toFixed(1);
  const fmt = f => useMetric ? `${toC(f)}°C` : `${Math.round(f)}°F`;
  const icon = getWmoIcon(c.weather_code);
  const curTemp = fmt(c.temperature_2m);

  // Find today's index (daily array starts at past_days ago)
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayIdx = Math.max(0, d.time.findIndex(t => t === todayStr));

  // Soil temp estimate at ~4" depth ≈ 0.85 × mean air temp
  const meanAirToday = (d.temperature_2m_max[todayIdx] + d.temperature_2m_min[todayIdx]) / 2;
  const soilF = Math.round(0.85 * meanAirToday);
  const soilTemp = fmt(soilF);
  const soilClass = soilF < 45 ? 'wx-soil--cold' : soilF >= 60 ? 'wx-soil--warm' : '';

  const hasFrost = d.temperature_2m_min.slice(todayIdx, todayIdx + 7).some(t => t < 35);
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // 7-day forecast starting from today
  const forecastDays = d.time.slice(todayIdx, todayIdx + 7);
  const forecast = forecastDays.map((date, i) => {
    const idx = todayIdx + i;
    const hi = fmt(d.temperature_2m_max[idx]);
    const lo = fmt(d.temperature_2m_min[idx]);
    const prec = d.precipitation_sum[idx] || 0;
    const lbl = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : DAYS[new Date(date + 'T12:00:00').getDay()];
    const precLabel = prec > 0.05 ? (useMetric ? `${toMM(prec)}mm` : `${prec.toFixed(2)}"`) : '';
    const precDot = prec > 0.05 ? `<span class="wx-prec-dot" title="${precLabel} precip">${prec > 0.3 ? '🌧' : '🌦'}</span>` : '';
    return `<div class="wx-day">
      <span class="wx-day-name">${lbl}</span>
      <span class="wx-day-icon">${getWmoIcon(d.weather_code[idx])}</span>
      <span class="wx-day-temp">${hi}/${lo}</span>
      ${precDot}
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="wx-current">
      <span class="wx-icon">${icon}</span>
      <span class="wx-temp">${curTemp}</span>
      <span class="wx-soil ${soilClass}" title="Estimated soil temperature at ~4-inch depth">🌱 ${soilTemp}</span>
      ${hasFrost ? '<span class="wx-frost-tag">❄️ Frost risk</span>' : ''}
    </div>
    <div class="wx-forecast">${forecast}</div>
    <div class="wx-attribution">${selectedLocationName ? `📍 ${selectedLocationName} · ` : ''}Weather: Open-Meteo.com</div>`;
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

function gardenLogHarvest(name, date, notes, qty, unit) {
  if (!myGarden[name]) return;
  if (!myGarden[name].harvestLog) myGarden[name].harvestLog = [];
  myGarden[name].harvestLog.unshift({
    date,
    notes: (notes || '').trim(),
    qty: qty || null,
    unit: unit || null,
  });
  saveGarden();
  refreshGardenUI(name);
}

function renderModalGardenSections(name) {
  const body = document.getElementById('modal-body');
  if (!body) return;
  body.querySelector('.modal-garden-section')?.remove();
  body.querySelector('.modal-succession-section')?.remove();
  if (!isInGarden(name)) { renderSuccessionSection(name); return; }
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
    ${log.length ? `<div class="harvest-log-list">${log.map(h => {
      const qtyStr = h.qty ? ` <span class="hl-qty">${h.qty}${h.unit ? '\u202f' + h.unit : ''}</span>` : '';
      return `<div class="harvest-log-item"><span class="hl-date">${h.date}</span><span class="hl-notes">${h.notes || '—'}</span>${qtyStr}</div>`;
    }).join('')}</div>` : ''}
    <div class="harvest-log-entry">
      <input type="date" id="harvest-date-in" value="${today}" max="${today}" aria-label="Harvest date">
      <input type="text" id="harvest-notes-in" placeholder="Notes (optional)">
      <div class="harvest-qty-wrap">
        <input type="number" id="harvest-qty-in" placeholder="Qty" min="0" step="any" aria-label="Quantity harvested">
        <select id="harvest-unit-in" aria-label="Unit">
          <option value="">unit</option>
          <option value="kg">kg</option>
          <option value="lbs">lbs</option>
          <option value="g">g</option>
          <option value="oz">oz</option>
          <option value="count">count</option>
          <option value="bunch">bunch</option>
        </select>
      </div>
      <button class="harvest-log-add-btn" id="harvest-log-btn">Log</button>
    </div>`;
  body.appendChild(sec);
  let noteTimer;
  sec.querySelector('#modal-notes-ta').addEventListener('input', e => {
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => gardenSetNotes(name, e.target.value), 400);
  });
  sec.querySelector('#harvest-log-btn').addEventListener('click', e => {
    const date  = sec.querySelector('#harvest-date-in').value;
    const nt    = sec.querySelector('#harvest-notes-in').value;
    const qty   = parseFloat(sec.querySelector('#harvest-qty-in').value) || null;
    const unit  = sec.querySelector('#harvest-unit-in').value || null;
    if (!date) return;
    showHarvestConfetti(e.target);
    gardenLogHarvest(name, date, nt, qty, unit);
    sec.querySelector('#harvest-notes-in').value = '';
    sec.querySelector('#harvest-qty-in').value   = '';
  });

  // Succession section
  renderSuccessionSection(name);
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
      case 'm': case 'M':
        setLayoutMode(layoutMode === 'garden' ? 'map' : 'garden');
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

// ── Phase 5: Helper — frost date to month number ─
const MONTH_NAME_TO_NUM = {
  january:1,february:2,march:3,april:4,may:5,june:6,
  july:7,august:8,september:9,october:10,november:11,december:12,
  jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
};
function frostDateToMonth(str) {
  if (!str) return null;
  const m = str.match(/^([A-Za-z]+)/);
  return m ? (MONTH_NAME_TO_NUM[m[1].toLowerCase()] || null) : null;
}

// ── Phase 5: Zone climate info ───────────────────
function getZoneClimateInfo(zone) {
  const frost = FROST_DATES[zone?.toLowerCase()];
  if (!frost) return null;
  const lastM  = frostDateToMonth(frost.last);
  const firstM = frostDateToMonth(frost.first);

  // Estimate growing season days from date strings
  let seasonDays = null;
  if (frost.last && frost.first) {
    const yr = new Date().getFullYear();
    const lastD  = new Date(`${frost.last} ${yr}`);
    const firstD = new Date(`${frost.first} ${yr}`);
    if (!isNaN(lastD) && !isNaN(firstD) && firstD > lastD) {
      seasonDays = Math.round((firstD - lastD) / 86400000);
    }
  }

  const zoneNum = parseFloat(zone);
  const climateType =
    zoneNum <= 4  ? 'Cold'          :
    zoneNum <= 7  ? 'Temperate'     :
    zoneNum <= 10 ? 'Warm'          : 'Subtropical';

  const frostFree = !frost.last && !frost.first;
  return { lastM, firstM, seasonDays, climateType, frostFree, frost };
}

// ── Phase 5: Related crops ───────────────────────
function getRelatedCrops(name, limit = 5) {
  if (!cropData) return [];
  const c = cropData[name];
  const cat = CROP_CATEGORY_MAP[name];
  const related = new Set();
  // Companions first (most relevant)
  (c?.companions || []).forEach(r => { if (cropData[r] && r !== name) related.add(r); });
  // Same category
  if (cat) (CROP_CATEGORIES[cat] || []).forEach(r => { if (r !== name) related.add(r); });
  return [...related].slice(0, limit);
}

function renderRelatedCrops(name) {
  const body = document.getElementById('modal-body');
  if (!body) return;
  body.querySelector('.modal-related-section')?.remove();

  const related = getRelatedCrops(name);
  if (!related.length) return;

  // Build active set for in-season highlighting
  const activeSet = new Set();
  if (selectedZone) {
    const d = getPlantingData(selectedZone, currentMonth);
    ['startIndoors','directSow','transplant','harvest'].forEach(k => (d[k]||[]).forEach(c => activeSet.add(c)));
  }

  const sec = document.createElement('div');
  sec.className = 'modal-related-section';
  sec.innerHTML = `<h4>You might also like</h4>
    <div class="related-chips">
      ${related.map(r => {
        const rc = cropData[r];
        const inSeason = activeSet.has(r);
        return `<button class="related-chip${inSeason ? ' in-season' : ''}" data-crop="${r}">${rc?.emoji || '🌱'} ${r}${inSeason ? ' ✦' : ''}</button>`;
      }).join('')}
    </div>`;
  sec.querySelectorAll('.related-chip').forEach(btn => {
    btn.addEventListener('click', () => openCropDetail(btn.dataset.crop));
  });
  body.appendChild(sec);
}

// ── Phase 4: Watering alert ─────────────────────
function renderWateringAlert() {
  const el = document.getElementById('watering-alert');
  if (!el) return;
  if (!weatherData?.daily || !selectedZone) { el.hidden = true; return; }
  const d = weatherData.daily;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayIdx = d.time.findIndex(t => t === todayStr);
  if (todayIdx < 2) { el.hidden = true; return; } // Need at least 2 past days

  const pastPrec = d.precipitation_sum.slice(0, todayIdx).reduce((a, b) => a + (b || 0), 0);
  const dayCount = todayIdx;

  if (pastPrec >= 0.4) { el.hidden = true; return; }

  const growing = Object.keys(myGarden).filter(n => myGarden[n]?.planted);
  if (!growing.length) { el.hidden = true; return; }

  const precStr = useMetric
    ? `${(pastPrec * 25.4).toFixed(1)} mm`
    : `${pastPrec.toFixed(2)}"`;
  const names = growing.slice(0, 3).join(', ') + (growing.length > 3 ? ` +${growing.length - 3} more` : '');
  el.innerHTML = `
    <span class="wa-icon">💧</span>
    <div class="wa-body">
      <strong>Dry spell — only ${precStr} rain in ${dayCount} days</strong>
      <span>${names} may need watering</span>
    </div>`;
  el.hidden = false;
}

// ── Phase 4: Succession planting ────────────────
function computeSuccessionDates(name) {
  const c = cropData?.[name];
  if (!c) return null;
  const harvestDays = parseHarvestDays(c.days);
  if (!harvestDays) return null;

  // Interval ≈ harvest time / 3, clamped to 10–28 days
  const intervalDays = Math.min(28, Math.max(10, Math.round(harvestDays / 3)));

  const today = new Date(); today.setHours(0,0,0,0);
  // First sow date: planted date (if set) or today
  let d = myGarden[name]?.planted
    ? new Date(myGarden[name].planted + 'T00:00:00')
    : new Date(today);

  // Advance to the first FUTURE interval
  while (d <= today) d = new Date(d.getTime() + intervalDays * 86400000);

  const dates = [];
  for (let i = 0; i < 4; i++) {
    dates.push(d.toISOString().slice(0, 10));
    d = new Date(d.getTime() + intervalDays * 86400000);
  }
  return { intervalDays, dates };
}

function renderSuccessionSection(name) {
  const body = document.getElementById('modal-body');
  if (!body) return;
  body.querySelector('.modal-succession-section')?.remove();
  if (!isInGarden(name)) return;

  const result = computeSuccessionDates(name);
  if (!result) return;

  const { intervalDays, dates } = result;
  const ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmtDate = iso => {
    const d2 = new Date(iso + 'T00:00:00');
    return `${ABBR[d2.getMonth()]} ${d2.getDate()}`;
  };

  const sec = document.createElement('div');
  sec.className = 'modal-section modal-succession-section';
  sec.innerHTML = `
    <div class="modal-section-title">🔄 Succession Planting</div>
    <p class="succession-tip">Sow every ~${intervalDays} days for continuous harvest.</p>
    <div class="succession-dates">
      ${dates.map(iso => `<span class="succession-chip">${fmtDate(iso)}</span>`).join('')}
    </div>`;
  body.appendChild(sec);
}

// ── Phase 4: Crop rating ─────────────────────────
function gardenSetRating(name, stars) {
  if (!myGarden[name]) return;
  myGarden[name].rating = stars === myGarden[name].rating ? 0 : stars; // Toggle off same star
  saveGarden();
  refreshGardenUI(name);
}

function renderStars(rating, name, compact) {
  if (compact) {
    if (!rating) return '';
    return `<span class="gi-badge gi-badge--rating">${'★'.repeat(rating)}</span>`;
  }
  return `<div class="crop-rating">
    ${[1,2,3].map(s => `<button class="star-btn${rating >= s ? ' active' : ''}" data-star="${s}" data-crop="${name}" aria-label="${s} star">★</button>`).join('')}
    <span class="crop-rating-label">${rating ? ['','Good','Great','Excellent'][rating] : 'Rate it'}</span>
  </div>`;
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

  // Total yield — only sum same unit if consistent; otherwise show count of qty-logged harvests
  const qtyByUnit = {};
  for (const n of names) {
    for (const h of (myGarden[n]?.harvestLog || [])) {
      if (h.qty) {
        const u = h.unit || 'unit';
        qtyByUnit[u] = (qtyByUnit[u] || 0) + h.qty;
      }
    }
  }
  const yieldParts = Object.entries(qtyByUnit).map(([u, q]) => `${parseFloat(q.toFixed(2))} ${u}`);
  const yieldStr = yieldParts.join(' · ');

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

  const earned = getEarned();
  el.innerHTML = `
    <div class="garden-stats-row">
      <span class="garden-stat-item"><span class="garden-stat-value">${names.length}</span> saved</span>
      <span class="garden-stat-item"><span class="garden-stat-value">${growing.length}</span> growing</span>
      <span class="garden-stat-item"><span class="garden-stat-value">${totalHarvests}</span> harvests</span>
    </div>
    ${nextHarvest ? `<div class="garden-stats-next">
      Next harvest: <strong>${cropData?.[nextHarvest]?.emoji || '🌱'} ${nextHarvest}</strong> in ~${nextDays} day${nextDays===1?'':'s'}
    </div>` : ''}
    ${yieldStr ? `<div class="garden-stats-yield">🌾 Total yield: <strong>${yieldStr}</strong></div>` : ''}
    ${earned.size ? `<div class="achievement-shelf" id="achievement-shelf">
      ${ACHIEVEMENTS.map(a => `<div class="ach-chip${earned.has(a.id) ? ' unlocked' : ''}" title="${a.desc}">${a.icon} ${a.name}</div>`).join('')}
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
      return `<div class="gantt-cell gantt-cell--${type}${isCur ? ' gantt-cell--cur' : ''}" data-month="${mi + 1}" title="${name}: ${tip || '—'} — click to jump to month" role="button"></div>`;
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
      <div class="gantt-grid" id="gantt-grid-inner">${headerRow}${dataRows}</div>
    </div>`;

  // Click-to-jump: clicking a gantt cell switches to calendar tab at that month
  el.querySelector('#gantt-grid-inner')?.addEventListener('click', e => {
    const cell = e.target.closest('.gantt-cell[data-month]');
    if (!cell) return;
    const m = parseInt(cell.dataset.month, 10);
    if (!m) return;
    currentMonth = m;
    const slider = document.getElementById('month-slider');
    if (slider) slider.value = m;
    updateMonthLabels();
    updateSeasonBg();
    // Switch to calendar tab
    currentPanelTab = 'calendar';
    document.querySelectorAll('.ptab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'calendar'));
    document.getElementById('tab-calendar').hidden = false;
    document.getElementById('tab-garden').hidden   = true;
    document.getElementById('tab-journal').hidden  = true;
    renderPanel();
    updateURL();
  });
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

// ── Phase 3 / 14: Share zone ─────────────────────
function shareZone() {
  document.getElementById('share-modal')?.showModal();
}

// ── Phase 14: Share & Print ──────────────────────
function copyZoneURL() {
  const url = window.location.href;
  if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
    navigator.share({ title: 'Plant Zone Finder', url }).catch(() => {});
    document.getElementById('share-modal')?.close();
    return;
  }
  navigator.clipboard?.writeText(url).then(() => {
    showToast('Zone URL copied ✓', 'success');
    document.getElementById('share-modal')?.close();
  }).catch(() => showToast('Copy not supported — copy from address bar', 'info'));
}

function copyScheduleText() {
  if (!selectedZone) { showToast('Select a zone first', 'info'); return; }
  const data = getPlantingData(selectedZone, currentMonth);
  const countryLabel = COUNTRY_CONFIG[selectedCountry]?.label || '';
  const lines = [
    `🌱 Plant Zone Finder — Zone ${getZoneDisplayLabel(selectedZone)}, ${countryLabel}`,
    `📅 ${MONTH_NAMES[currentMonth]}`, ''
  ];
  const sections = {
    startIndoors: 'Start Indoors',
    directSow:    'Direct Sow',
    transplant:   'Transplant Out',
    harvest:      'Harvest'
  };
  let hasData = false;
  for (const [key, label] of Object.entries(sections)) {
    if (data[key]?.length) {
      hasData = true;
      lines.push(`${label}:`);
      data[key].forEach(name => lines.push(`  • ${name}`));
      lines.push('');
    }
  }
  if (!hasData) lines.push('Nothing to plant this month.\n');
  lines.push('djamies1.github.io/garden-zones/');
  navigator.clipboard?.writeText(lines.join('\n')).then(() => {
    showToast('Schedule copied ✓', 'success');
    document.getElementById('share-modal')?.close();
  }).catch(() => showToast('Copy not supported', 'info'));
}

function copyGardenText() {
  const names = Object.keys(myGarden);
  if (!names.length) { showToast('Your garden is empty', 'info'); return; }
  const today = new Date().toISOString().slice(0, 10);
  const lines = [`🌿 My Garden — ${today}`, ''];
  const groups = { ready: [], growing: [], saved: [] };
  for (const name of names) {
    const s = getGardenStatus(name);
    groups[s?.type || 'saved'].push({ name, status: s });
  }
  const GROUP_LABELS = { ready: 'Ready to harvest', growing: 'Growing', saved: 'Saved' };
  for (const [type, items] of Object.entries(groups)) {
    if (!items.length) continue;
    lines.push(`── ${GROUP_LABELS[type]} ──`);
    for (const { name, status } of items) {
      lines.push(`${cropData[name]?.emoji || '🌱'} ${name}: ${status?.label || ''}`);
    }
    lines.push('');
  }
  lines.push('djamies1.github.io/garden-zones/');
  navigator.clipboard?.writeText(lines.join('\n')).then(() => {
    showToast('Garden list copied ✓', 'success');
    document.getElementById('share-modal')?.close();
  }).catch(() => showToast('Copy not supported', 'info'));
}

function printZone() {
  document.getElementById('share-modal')?.close();
  const inGardenTab = currentPanelTab === 'garden';
  document.body.classList.toggle('print-garden', inGardenTab);
  setTimeout(() => {
    window.print();
    document.body.classList.remove('print-garden');
  }, 120);
}

function initShareModal() {
  const modal = document.getElementById('share-modal');
  if (!modal) return;
  modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
  document.getElementById('share-modal-close')?.addEventListener('click', () => modal.close());
  document.getElementById('sopt-url')?.addEventListener('click', copyZoneURL);
  document.getElementById('sopt-schedule')?.addEventListener('click', copyScheduleText);
  document.getElementById('sopt-garden')?.addEventListener('click', copyGardenText);
  document.getElementById('sopt-print')?.addEventListener('click', printZone);
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
  const raw = { startIndoors: [], directSow: [], transplant: [], harvest: [] };

  for (let m = 1; m <= 12; m++) {
    const d = getPlantingData(zone, m);
    if (d.startIndoors?.includes(name)) raw.startIndoors.push(m);
    if (d.directSow?.includes(name))    raw.directSow.push(m);
    if (d.transplant?.includes(name))   raw.transplant.push(m);
    if (d.harvest?.includes(name))      raw.harvest.push(m);
  }

  function formatMonths(arr) {
    if (!arr.length) return null;
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
    startIndoors: formatMonths(raw.startIndoors),
    directSow:    formatMonths(raw.directSow),
    transplant:   formatMonths(raw.transplant),
    harvest:      formatMonths(raw.harvest),
    raw,
  };
}

function renderPlantingScheduleHTML(name) {
  const zone = selectedZone;
  if (!zone || !plantingData) return '';
  const sched = computePlantingSchedule(name, zone);
  if (!sched) return '';

  const curMonth = new Date().getMonth() + 1;
  const today    = new Date(); today.setHours(0, 0, 0, 0);

  const ACTS = [
    { key: 'startIndoors', cls: 'start',      icon: '🪴', label: 'Start Indoors' },
    { key: 'directSow',    cls: 'sow',        icon: '🌱', label: 'Direct Sow'    },
    { key: 'transplant',   cls: 'transplant', icon: '🌿', label: 'Transplant'    },
    { key: 'harvest',      cls: 'harvest',    icon: '🌾', label: 'Harvest'       },
  ];

  // Find the next current or upcoming activity
  let nextUp = null;
  for (const act of ACTS) {
    const months = sched.raw[act.key];
    if (!months.length) continue;
    if (months.includes(curMonth)) { nextUp = { ...act, status: 'now' }; break; }
    const upcoming = months.filter(m => m > curMonth);
    if (upcoming.length) {
      const nextMonth = upcoming[0];
      const daysUntil = Math.round((new Date(today.getFullYear(), nextMonth - 1, 1) - today) / 86400000);
      nextUp = { ...act, status: 'upcoming', daysUntil, nextMonth }; break;
    }
  }
  if (!nextUp) {
    for (const act of ACTS) {
      if (sched.raw[act.key].length) { nextUp = { ...act, status: 'next-year' }; break; }
    }
  }

  const MO3 = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let nextUpHtml = '';
  if (nextUp) {
    if (nextUp.status === 'now')
      nextUpHtml = `<div class="sched-next sched-next--now">${nextUp.icon} <strong>${nextUp.label} now</strong> — right time for your zone</div>`;
    else if (nextUp.status === 'upcoming')
      nextUpHtml = `<div class="sched-next sched-next--soon">${nextUp.icon} <strong>${nextUp.label}</strong> opens in ~${nextUp.daysUntil} days (${MO3[nextUp.nextMonth]})</div>`;
    else
      nextUpHtml = `<div class="sched-next">${nextUp.icon} Next season: <strong>${nextUp.label}</strong></div>`;
  }

  const item = act => {
    const isNow = sched.raw[act.key].includes(curMonth);
    const label = sched[act.key];
    return `<div class="schedule-item schedule-item--${act.cls}${!label ? ' schedule-item--none' : ''}${isNow ? ' schedule-item--now' : ''}">
      <span class="schedule-item-label">${act.label}</span>
      <span class="schedule-item-months">${label || 'n/a for this zone'}</span>
      ${isNow ? '<span class="schedule-item-now-dot" title="Active this month">●</span>' : ''}
    </div>`;
  };

  // Soil temp vs germination check (requires live weather data)
  let soilHtml = '';
  const c = cropData[name];
  if (c?.germ_temp && weatherData?.daily) {
    const germMatch = c.germ_temp.match(/(\d+)/);
    if (germMatch) {
      const minGerm = parseInt(germMatch[1], 10);
      const d = weatherData.daily;
      const todayStr = today.toISOString().slice(0, 10);
      const todayIdx = Math.max(0, d.time.findIndex(t => t === todayStr));
      const meanAir  = (d.temperature_2m_max[todayIdx] + d.temperature_2m_min[todayIdx]) / 2;
      const soilF    = Math.round(0.85 * meanAir);
      const soilC    = Math.round((soilF - 32) * 5 / 9);
      const minGermC = Math.round((minGerm - 32) * 5 / 9);
      const soilStr  = useMetric ? `${soilC}°C` : `${soilF}°F`;
      const minStr   = useMetric ? `${minGermC}°C` : `${minGerm}°F`;
      const ok       = soilF >= minGerm;
      soilHtml = `<div class="sched-soil sched-soil--${ok ? 'ok' : 'cold'}">
        🌡 Soil ~<strong>${soilStr}</strong> · Germ. min: ${minStr} · ${ok ? '✅ Good to sow outdoors' : '⚠️ Too cold to direct sow yet'}
      </div>`;
    }
  }

  return `
    <div class="modal-schedule-section">
      <h4>Your Schedule <span class="sched-zone-badge">Zone ${getZoneDisplayLabel(zone)}</span></h4>
      ${nextUpHtml}
      <div class="schedule-grid">${ACTS.map(item).join('')}</div>
      ${soilHtml}
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

// ── Phase 6: Layout mode ──────────────────────────
function setLayoutMode(mode) {
  layoutMode = mode;
  document.body.classList.toggle('garden-mode', mode === 'garden');
  localStorage.setItem('pzf-layout', mode);
  const btn = document.getElementById('layout-toggle');
  if (btn) {
    btn.textContent = mode === 'garden' ? '🗺 Map' : '🌱 Garden';
    btn.title = mode === 'garden' ? 'Switch to map view' : 'Switch to garden view';
    btn.classList.toggle('garden-active', mode === 'garden');
  }
  // Show resize handle only in garden mode (desktop)
  const handle = document.getElementById('map-resize-handle');
  if (handle) handle.hidden = (mode !== 'garden');
  // Leaflet needs to recalculate after container resize
  setTimeout(() => {
    if (typeof map !== 'undefined' && map) map.invalidateSize();
  }, 420);
  // In garden mode, ensure panel is visible
  if (mode === 'garden' && selectedZone) showPanel();
}

function initLayoutToggle() {
  // Apply persisted mode
  if (layoutMode === 'garden') setLayoutMode('garden');
  else setLayoutMode('map');

  document.getElementById('layout-toggle')?.addEventListener('click', () => {
    setLayoutMode(layoutMode === 'garden' ? 'map' : 'garden');
  });

  initResizeHandle();
}

// ── Custom crops ──────────────────────────────────
function loadCustomCrops() {
  try { return JSON.parse(localStorage.getItem('pzf-custom-crops') || '{}'); }
  catch { return {}; }
}
function saveCustomCrops(obj) { localStorage.setItem('pzf-custom-crops', JSON.stringify(obj)); }

function mergeCustomCrops() {
  const custom = loadCustomCrops();
  for (const [name, data] of Object.entries(custom)) {
    if (!cropData[name]) cropData[name] = { ...data, custom: true };
  }
}

function addCustomCrop({ name, emoji, category, days, notes }) {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const entry = {
    emoji: emoji?.trim() || '🌱',
    category: category || 'Vegetables',
    days: days ? String(days) : '',
    description: notes?.trim() || '',
    custom: true,
  };
  const custom = loadCustomCrops();
  custom[trimmed] = entry;
  saveCustomCrops(custom);
  cropData[trimmed] = { ...entry };
  // Auto-add to garden
  gardenAdd(trimmed);
  return true;
}

function deleteCustomCrop(name) {
  const custom = loadCustomCrops();
  delete custom[name];
  saveCustomCrops(custom);
  delete cropData[name];
  gardenRemove(name);
}

function openCustomCropModal() {
  const modal = document.getElementById('custom-crop-modal');
  if (!modal) return;
  // Reset form
  document.getElementById('cc-name').value  = '';
  document.getElementById('cc-emoji').value = '';
  document.getElementById('cc-days').value  = '';
  document.getElementById('cc-notes').value = '';
  document.getElementById('cc-category').value = 'Vegetables';
  document.getElementById('cc-error').style.display = 'none';
  modal.showModal();
  document.getElementById('cc-name').focus();
}

function initCustomCrops() {
  const modal    = document.getElementById('custom-crop-modal');
  const closeBtn = document.getElementById('custom-crop-close');
  const saveBtn  = document.getElementById('cc-save-btn');
  const errEl    = document.getElementById('cc-error');

  closeBtn?.addEventListener('click', () => modal.close());
  modal?.addEventListener('click', e => { if (e.target === modal) modal.close(); });

  saveBtn?.addEventListener('click', () => {
    const name = document.getElementById('cc-name').value.trim();
    if (!name) { errEl.style.display = 'block'; return; }
    errEl.style.display = 'none';
    const ok = addCustomCrop({
      name,
      emoji:    document.getElementById('cc-emoji').value,
      category: document.getElementById('cc-category').value,
      days:     document.getElementById('cc-days').value,
      notes:    document.getElementById('cc-notes').value,
    });
    if (ok) {
      modal.close();
      showToast(`${name} added to My Garden ✓`, 'success');
      renderBrowseGrid();
      updateJournalCropSelect();
    }
  });

  document.getElementById('add-custom-crop-btn')?.addEventListener('click', openCustomCropModal);
}

// ── Phase 7: Drag-to-resize map/panel split ───────
function initResizeHandle() {
  const handle = document.getElementById('map-resize-handle');
  if (!handle) return;

  let dragging = false;
  const MIN_W = 160, MAX_W = 520;

  function setMapWidth(px) {
    const clamped = Math.max(MIN_W, Math.min(MAX_W, px));
    document.documentElement.style.setProperty('--map-mini-width', clamped + 'px');
    handle.style.left = clamped + 'px';
    localStorage.setItem('pzf-map-width', clamped);
  }

  // Restore persisted width
  const saved = parseInt(localStorage.getItem('pzf-map-width'), 10);
  if (saved && saved >= MIN_W && saved <= MAX_W) setMapWidth(saved);

  handle.addEventListener('mousedown', e => {
    dragging = true;
    handle.classList.add('dragging');
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    setMapWidth(e.clientX);
    if (typeof map !== 'undefined' && map) map.invalidateSize();
  });
  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
  });

  // Touch support
  handle.addEventListener('touchstart', e => {
    dragging = true;
    handle.classList.add('dragging');
  }, { passive: true });
  window.addEventListener('touchmove', e => {
    if (!dragging) return;
    setMapWidth(e.touches[0].clientX);
    if (typeof map !== 'undefined' && map) map.invalidateSize();
  }, { passive: true });
  window.addEventListener('touchend', () => {
    dragging = false;
    handle.classList.remove('dragging');
  });
}

// ── Phase 6: Harvest-ready banner ────────────────
function renderHarvestReadyBanner() {
  const el = document.getElementById('harvest-ready-banner');
  if (!el) return;
  const ready = Object.keys(myGarden).filter(n => getGardenStatus(n)?.type === 'ready');
  if (!ready.length) { el.hidden = true; return; }
  const names = ready.slice(0, 3).map(n => `${cropData[n]?.emoji || '🌱'} ${n}`).join(', ');
  const more  = ready.length > 3 ? ` +${ready.length - 3} more` : '';
  el.hidden = false;
  el.innerHTML = `
    <span class="hrb-icon">🌾</span>
    <div class="hrb-text">
      <div>${names}${more}</div>
      <div class="hrb-sub">Ready to harvest — tap to view your garden</div>
    </div>`;
  el.onclick = () => {
    currentPanelTab = 'garden';
    document.querySelectorAll('.ptab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'garden'));
    document.getElementById('tab-calendar').hidden = true;
    document.getElementById('tab-garden').hidden   = false;
    document.getElementById('tab-journal').hidden  = true;
    renderGardenTab();
  };
}

// ── Phase 6 + 7: Journal ─────────────────────────
let journalFilterCrop = '';  // '' = all

function loadJournal() {
  try { journalEntries = JSON.parse(localStorage.getItem('pzf-journal') || '[]'); }
  catch { journalEntries = []; }
}
function saveJournal() { localStorage.setItem('pzf-journal', JSON.stringify(journalEntries)); }

async function addJournalEntry(text, cropTag) {
  const trimmed = text.trim();
  if (!trimmed && !_pendingPhoto) return;
  let photoId = null;
  if (_pendingPhoto) {
    try { photoId = await savePhoto(_pendingPhoto); } catch(e) { console.warn('Photo save failed', e); }
    _pendingPhoto = null;
    const wrap = document.getElementById('journal-photo-preview-wrap');
    if (wrap) wrap.hidden = true;
  }
  journalEntries.unshift({
    id: Date.now(),
    date: new Date().toISOString(),
    text: trimmed,
    crop: cropTag || null,
    ...(photoId != null && { photoId }),
  });
  saveJournal();
  checkAchievements();
  renderJournalTab();
}

function deleteJournalEntry(id) {
  const entry = journalEntries.find(e => e.id === id);
  if (entry?.photoId != null) deletePhoto(entry.photoId).catch(() => {});
  journalEntries = journalEntries.filter(e => e.id !== id);
  saveJournal();
  renderJournalTab();
}

function updateJournalCropSelect() {
  const sel = document.getElementById('journal-crop-tag');
  if (!sel) return;
  const crops = Object.keys(myGarden).sort();
  sel.innerHTML = `<option value="">🌱 No crop tag</option>` +
    crops.map(n => `<option value="${n}">${cropData[n]?.emoji || '🌱'} ${n}</option>`).join('');
}

function renderJournalFilterBar() {
  const bar = document.getElementById('journal-filter-bar');
  if (!bar) return;
  // Collect unique crop tags in entries
  const tags = [...new Set(journalEntries.filter(e => e.crop).map(e => e.crop))].sort();
  if (!tags.length) { bar.innerHTML = ''; return; }
  bar.innerHTML = `<button class="journal-filter-chip${journalFilterCrop === '' ? ' active' : ''}" data-crop="">All</button>` +
    tags.map(t => `<button class="journal-filter-chip${journalFilterCrop === t ? ' active' : ''}" data-crop="${t}">${cropData[t]?.emoji || '🌱'} ${t}</button>`).join('');
}

function renderJournalTab() {
  const list  = document.getElementById('journal-list');
  const empty = document.getElementById('journal-empty-msg');
  if (!list) return;

  updateJournalCropSelect();
  renderJournalFilterBar();

  const entries = journalFilterCrop
    ? journalEntries.filter(e => e.crop === journalFilterCrop)
    : journalEntries;

  if (!entries.length) {
    list.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  list.innerHTML = entries.map(e => {
    const d = new Date(e.date);
    const dateStr = d.toLocaleDateString(undefined, { weekday:'short', year:'numeric', month:'short', day:'numeric' })
                  + ' · ' + d.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });
    const tagHtml = e.crop ? `<span class="journal-entry-crop-tag">${cropData[e.crop]?.emoji || '🌱'} ${e.crop}</span>` : '';
    const photoHtml = e.photoId != null
      ? `<img class="journal-entry-photo" data-photo-id="${e.photoId}" alt="Garden photo" loading="lazy">`
      : '';
    const textHtml = e.text
      ? `<div class="journal-entry-text">${e.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`
      : '';
    return `<div class="journal-entry" data-id="${e.id}">
      ${tagHtml}
      <div class="journal-entry-date">${dateStr}</div>
      ${textHtml}
      ${photoHtml}
      <button class="journal-entry-delete" data-id="${e.id}" aria-label="Delete entry">&times;</button>
    </div>`;
  }).join('');

  // Load photos from IndexedDB asynchronously
  list.querySelectorAll('img[data-photo-id]').forEach(async img => {
    const pid = parseInt(img.dataset.photoId, 10);
    const dataURL = await loadPhoto(pid).catch(() => null);
    if (dataURL) img.src = dataURL; else img.remove();
  });
}

function initJournal() {
  loadJournal();

  const addBtn = document.getElementById('journal-add-btn');
  const input  = document.getElementById('journal-input');
  if (addBtn && input) {
    const doAdd = async () => {
      const tag = document.getElementById('journal-crop-tag')?.value || '';
      await addJournalEntry(input.value, tag);
      input.value = '';
    };
    addBtn.addEventListener('click', doAdd);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) doAdd();
    });
  }

  // Photo capture
  const photoBtn   = document.getElementById('journal-photo-btn');
  const fileInput  = document.getElementById('journal-photo-input');
  const previewWrap = document.getElementById('journal-photo-preview-wrap');
  const preview    = document.getElementById('journal-photo-preview');
  const clearBtn   = document.getElementById('journal-photo-clear');

  photoBtn?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    _pendingPhoto = await resizeImage(file);
    if (preview) { preview.src = _pendingPhoto; }
    if (previewWrap) previewWrap.hidden = false;
    fileInput.value = '';
  });

  clearBtn?.addEventListener('click', () => {
    _pendingPhoto = null;
    if (preview) preview.src = '';
    if (previewWrap) previewWrap.hidden = true;
  });

  // Journal list events — delete + photo lightbox
  document.getElementById('journal-list')?.addEventListener('click', e => {
    const btn = e.target.closest('.journal-entry-delete');
    if (btn) { deleteJournalEntry(parseInt(btn.dataset.id, 10)); return; }
    const photo = e.target.closest('.journal-entry-photo');
    if (photo?.src) {
      const lb = document.getElementById('photo-lightbox');
      const lbImg = document.getElementById('photo-lightbox-img');
      if (lb && lbImg) { lbImg.src = photo.src; lb.hidden = false; }
    }
  });

  // Lightbox close
  document.getElementById('photo-lightbox')?.addEventListener('click', () => {
    const lb = document.getElementById('photo-lightbox');
    if (lb) lb.hidden = true;
  });

  document.getElementById('journal-filter-bar')?.addEventListener('click', e => {
    const chip = e.target.closest('.journal-filter-chip');
    if (!chip) return;
    journalFilterCrop = chip.dataset.crop;
    renderJournalTab();
  });
}

// ── Phase 9: Achievements ─────────────────────────
const ACHIEVEMENTS = [
  { id: 'first-seed',    icon: '🌱', name: 'First Seed',      desc: 'Add your first crop to My Garden' },
  { id: 'planner',       icon: '📅', name: 'Planner',         desc: 'Log a planting date for a crop' },
  { id: 'first-harvest', icon: '🌾', name: 'First Harvest',   desc: 'Log your first harvest' },
  { id: 'growing-5',     icon: '🌿', name: 'Growing Strong',  desc: 'Grow 5 or more crops at once' },
  { id: 'growing-10',    icon: '🌻', name: 'Green Thumb',     desc: 'Grow 10 or more crops at once' },
  { id: 'journaler',     icon: '✍️', name: 'Journaler',       desc: 'Write your first garden journal entry' },
  { id: 'critic',        icon: '⭐', name: 'Critic',          desc: 'Rate a crop after growing it' },
  { id: 'companion',     icon: '🤝', name: 'Good Neighbours', desc: 'Add a companion crop recommendation' },
  { id: 'custom-crop',   icon: '🔬', name: 'Experimenter',    desc: 'Add a custom crop of your own' },
];

function loadAchievements() {
  try { return new Set(JSON.parse(localStorage.getItem('pzf-achievements') || '[]')); }
  catch { return new Set(); }
}
function saveAchievements(set) { localStorage.setItem('pzf-achievements', JSON.stringify([...set])); }

let _earnedAchievements = null;
function getEarned() {
  if (!_earnedAchievements) _earnedAchievements = loadAchievements();
  return _earnedAchievements;
}

function unlockAchievement(id) {
  const earned = getEarned();
  if (earned.has(id)) return;
  earned.add(id);
  saveAchievements(earned);
  const def = ACHIEVEMENTS.find(a => a.id === id);
  if (!def) return;
  // Show pop-up banner in garden tab if visible, otherwise toast
  if (currentPanelTab === 'garden') {
    const banner = document.getElementById('achievement-banner');
    if (banner) {
      const div = document.createElement('div');
      div.className = 'achievement-pop';
      div.innerHTML = `
        <span class="achievement-pop-icon">${def.icon}</span>
        <div class="achievement-pop-body">
          <strong>Achievement unlocked: ${def.name}</strong>
          <span>${def.desc}</span>
        </div>
        <button class="achievement-pop-dismiss" aria-label="Dismiss">✕</button>`;
      div.querySelector('.achievement-pop-dismiss').addEventListener('click', () => div.remove());
      banner.prepend(div);
      setTimeout(() => div.remove(), 7000);
    }
  } else {
    showToast(`🏆 Achievement: ${def.name}`, 'success');
  }
  // Update shelf if visible
  renderAchievementShelf();
}

function checkAchievements() {
  const names  = Object.keys(myGarden);
  const count  = names.length;
  const planted = names.filter(n => myGarden[n]?.planted).length;
  const harvests = names.reduce((s, n) => s + (myGarden[n]?.harvestLog?.length || 0), 0);
  const rated   = names.some(n => myGarden[n]?.rating);
  const hasCustom = names.some(n => cropData[n]?.custom);

  if (count >= 1)  unlockAchievement('first-seed');
  if (planted >= 1) unlockAchievement('planner');
  if (harvests >= 1) unlockAchievement('first-harvest');
  if (count >= 5)  unlockAchievement('growing-5');
  if (count >= 10) unlockAchievement('growing-10');
  if (journalEntries.length >= 1) unlockAchievement('journaler');
  if (rated) unlockAchievement('critic');
  if (hasCustom) unlockAchievement('custom-crop');

  // Companion: check if any garden crop was added via "Grow this next" companion suggestion
  // Proxy: any garden crop that is in another garden crop's companion list
  for (const name of names) {
    const others = names.filter(n => n !== name);
    if (others.some(n => cropData[n]?.companions?.includes(name))) {
      unlockAchievement('companion'); break;
    }
  }
}

function renderAchievementShelf() {
  // Render inside garden-stats section
  const existing = document.getElementById('achievement-shelf');
  if (!existing) return;
  const earned = getEarned();
  existing.innerHTML = ACHIEVEMENTS.map(a =>
    `<div class="ach-chip${earned.has(a.id) ? ' unlocked' : ''}" title="${a.desc}">
      ${a.icon} ${a.name}
    </div>`
  ).join('');
}

// ── Phase 9: Garden dashboard strip ──────────────
function renderGardenDashboard() {
  const el = document.getElementById('garden-dashboard');
  if (!el || !selectedZone) { if (el) el.innerHTML = ''; return; }

  const names   = Object.keys(myGarden);
  const growing = names.filter(n => myGarden[n]?.planted && getGardenStatus(n)?.type !== 'ready').length;
  const ready   = names.filter(n => getGardenStatus(n)?.type === 'ready').length;
  const season  = getSeasonForMonth(currentMonth);
  const seasonLabel = { spring:'🌸 Spring', summer:'☀️ Summer', autumn:'🍂 Autumn', winter:'❄️ Winter' }[season];

  // Compact weather
  let weatherHtml = '';
  if (weatherData?.current) {
    const t = useMetric ? Math.round(weatherData.current.temperature_2m) + '°C'
                        : Math.round(weatherData.current.temperature_2m * 9/5 + 32) + '°F';
    weatherHtml = `<span class="gd-sep">·</span>
      <span class="gd-weather">${getWmoIcon(weatherData.current.weathercode)} ${t}</span>`;
  }

  el.innerHTML = `
    <span class="gd-zone">${getZoneDisplayLabel(selectedZone)}</span>
    <span class="gd-sep">·</span>
    <span class="gd-season">${seasonLabel}</span>
    ${weatherHtml}
    ${names.length ? `<span class="gd-sep">·</span>
      <span class="gd-stat"><strong>${growing}</strong> growing${ready ? `, <strong>${ready}</strong> ready` : ''}</span>` : ''}
    <button class="gd-map-btn" id="gd-map-btn">🗺 Change zone</button>`;

  document.getElementById('gd-map-btn')?.addEventListener('click', () => setLayoutMode('map'));
}

// ── Phase 9: PWA install prompt ───────────────────
let _installPromptEvent = null;

function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _installPromptEvent = e;
    // Show banner after first zone selection (not immediately)
  });

  const acceptBtn  = document.getElementById('install-accept-btn');
  const dismissBtn = document.getElementById('install-dismiss-btn');
  const banner     = document.getElementById('install-banner');

  acceptBtn?.addEventListener('click', async () => {
    if (!_installPromptEvent) return;
    _installPromptEvent.prompt();
    const { outcome } = await _installPromptEvent.userChoice;
    _installPromptEvent = null;
    banner.hidden = true;
    if (outcome === 'accepted') showToast('App installed! 🎉', 'success');
  });

  dismissBtn?.addEventListener('click', () => {
    banner.hidden = true;
    localStorage.setItem('pzf-install-dismissed', '1');
  });
}

function maybeShowInstallBanner() {
  if (!_installPromptEvent) return;
  if (localStorage.getItem('pzf-install-dismissed')) return;
  const banner = document.getElementById('install-banner');
  if (banner) banner.hidden = false;
}

// ── Phase 9: Offline indicator ────────────────────
function initOfflineIndicator() {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;
  const update = () => { banner.hidden = navigator.onLine; };
  update();
  window.addEventListener('online',  update);
  window.addEventListener('offline', update);
}

// ── Phase 10: Quick Search (⌘K / Ctrl+K) ─────────
let _qsSelectedIdx = -1;
let _qsResults = [];

function openQuickSearch() {
  const overlay = document.getElementById('quick-search-overlay');
  if (!overlay) return;
  overlay.hidden = false;
  const input = document.getElementById('quick-search-input');
  if (!input) return;
  input.value = '';
  _qsSelectedIdx = -1;
  _qsResults = [];
  document.getElementById('quick-search-results').innerHTML = '';
  requestAnimationFrame(() => input.focus());
}

function closeQuickSearch() {
  const overlay = document.getElementById('quick-search-overlay');
  if (overlay) overlay.hidden = true;
}

function renderQSResults(query) {
  const el = document.getElementById('quick-search-results');
  if (!el) return;
  const q = query.trim().toLowerCase();
  if (!q) { el.innerHTML = ''; _qsResults = []; _qsSelectedIdx = -1; return; }
  const allNames = Object.keys(cropData).sort();
  _qsResults = allNames.filter(n => n.toLowerCase().includes(q)).slice(0, 8);
  _qsSelectedIdx = _qsResults.length ? 0 : -1;
  if (!_qsResults.length) {
    el.innerHTML = `<div class="qs-empty">No crops found for "${query.replace(/&/g,'&amp;').replace(/</g,'&lt;')}"</div>`;
    return;
  }
  el.innerHTML = _qsResults.map((name, i) => {
    const c = cropData[name];
    const inG = isInGarden(name);
    return `<div class="qs-result${i === 0 ? ' qs-selected' : ''}" data-idx="${i}" data-name="${name}">
      <span class="qs-emoji">${c?.emoji || '🌱'}</span>
      <span class="qs-name">${name}</span>
      ${inG ? '<span class="qs-in-garden">★ Saved</span>' : ''}
      ${c?.days ? `<span class="qs-days">${c.days}</span>` : ''}
    </div>`;
  }).join('');
}

function qsSetSelection(idx) {
  _qsSelectedIdx = idx;
  document.querySelectorAll('.qs-result').forEach((el, i) => {
    el.classList.toggle('qs-selected', i === idx);
    if (i === idx) el.scrollIntoView({ block: 'nearest' });
  });
}

function initQuickSearch() {
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openQuickSearch();
    }
  });

  const overlay = document.getElementById('quick-search-overlay');
  const input   = document.getElementById('quick-search-input');
  const results = document.getElementById('quick-search-results');
  if (!overlay || !input || !results) return;

  input.addEventListener('input', () => renderQSResults(input.value));

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeQuickSearch(); return; }
    if (e.key === 'Enter') {
      const name = _qsResults[_qsSelectedIdx];
      if (name) { closeQuickSearch(); openCropDetail(name); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      qsSetSelection(Math.min(_qsResults.length - 1, _qsSelectedIdx + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      qsSetSelection(Math.max(0, _qsSelectedIdx - 1));
      return;
    }
  });

  results.addEventListener('click', e => {
    const item = e.target.closest('.qs-result');
    if (item) { closeQuickSearch(); openCropDetail(item.dataset.name); }
  });

  results.addEventListener('mouseover', e => {
    const item = e.target.closest('.qs-result');
    if (item) qsSetSelection(parseInt(item.dataset.idx, 10));
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeQuickSearch();
  });
}

// ── Phase 10: Garden Checklist ────────────────────
let gardenChecklist = [];

function loadChecklist() {
  try { gardenChecklist = JSON.parse(localStorage.getItem('pzf-checklist') || '[]'); }
  catch { gardenChecklist = []; }
}

function saveChecklist() { localStorage.setItem('pzf-checklist', JSON.stringify(gardenChecklist)); }

function addChecklistItem(text, dueDate) {
  const trimmed = text.trim();
  if (!trimmed) return;
  gardenChecklist.push({ id: Date.now(), text: trimmed, due: dueDate || null, done: false });
  saveChecklist();
  renderGardenChecklist();
}

function toggleChecklistItem(id) {
  const item = gardenChecklist.find(i => i.id === id);
  if (item) { item.done = !item.done; saveChecklist(); renderGardenChecklist(); }
}

function deleteChecklistItem(id) {
  gardenChecklist = gardenChecklist.filter(i => i.id !== id);
  saveChecklist();
  renderGardenChecklist();
}

function renderGardenChecklist() {
  const el = document.getElementById('garden-checklist');
  if (!el) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const pending = gardenChecklist.filter(i => !i.done);
  const done    = gardenChecklist.filter(i =>  i.done);

  const renderItem = item => {
    let dueHtml = '';
    if (item.due) {
      const d = new Date(item.due + 'T00:00:00');
      const diff = Math.round((d - today) / 86400000);
      const label = diff < 0 ? `${-diff}d overdue` : diff === 0 ? 'Today' : `in ${diff}d`;
      const cls   = diff < 0 ? 'cl-due-overdue' : diff <= 2 ? 'cl-due-soon' : 'cl-due';
      dueHtml = `<span class="${cls}">${label}</span>`;
    }
    return `<div class="checklist-item${item.done ? ' checklist-done' : ''}" data-id="${item.id}">
      <label class="checklist-check">
        <input type="checkbox" class="cl-checkbox" data-id="${item.id}"${item.done ? ' checked' : ''}>
        <span class="checklist-text">${item.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>
      </label>
      ${dueHtml}
      <button class="checklist-delete" data-id="${item.id}" aria-label="Delete task">×</button>
    </div>`;
  };

  let html = `<div class="checklist-header">
    <span class="checklist-title">📋 My Checklist</span>
    <span class="checklist-count">${pending.length} pending</span>
  </div>
  <div class="checklist-add">
    <input type="text" id="cl-add-input" placeholder="Add a task…" autocomplete="off">
    <input type="date" id="cl-add-due" title="Optional due date" aria-label="Due date">
    <button id="cl-add-btn">Add</button>
  </div>`;

  if (pending.length) html += pending.map(renderItem).join('');
  if (done.length) html += `<div class="checklist-done-label">Completed</div>` + done.map(renderItem).join('');
  if (!pending.length && !done.length) html += `<p class="checklist-empty">No tasks yet — add a to-do above.</p>`;

  el.innerHTML = html;

  document.getElementById('cl-add-btn')?.addEventListener('click', () => {
    const input = document.getElementById('cl-add-input');
    const due   = document.getElementById('cl-add-due')?.value || '';
    if (input?.value.trim()) {
      addChecklistItem(input.value, due);
      input.value = '';
      if (document.getElementById('cl-add-due')) document.getElementById('cl-add-due').value = '';
    }
  });
  document.getElementById('cl-add-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const due = document.getElementById('cl-add-due')?.value || '';
      if (e.target.value.trim()) {
        addChecklistItem(e.target.value, due);
        e.target.value = '';
        if (document.getElementById('cl-add-due')) document.getElementById('cl-add-due').value = '';
      }
    }
  });
  el.querySelectorAll('.cl-checkbox').forEach(cb => {
    cb.addEventListener('change', () => toggleChecklistItem(parseInt(cb.dataset.id, 10)));
  });
  el.querySelectorAll('.checklist-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteChecklistItem(parseInt(btn.dataset.id, 10)));
  });
}

function initChecklist() {
  loadChecklist();
}

// ── Phase 13: Companion Planting Matrix ──────────
function renderCompanionMatrix() {
  const el = document.getElementById('garden-companion-matrix');
  if (!el) return;

  const names = Object.keys(myGarden);
  if (names.length < 2) { el.innerHTML = ''; return; }

  // Relationship between two crops
  function getRelType(a, b) {
    if (a === b) return 'self';
    const aData = cropData[a];
    const bData = cropData[b];
    if (aData?.avoid?.includes(b) || bData?.avoid?.includes(a)) return 'bad';
    if (aData?.companions?.includes(b) || bData?.companions?.includes(a)) return 'good';
    return 'neutral';
  }

  // Summarise conflicts and good pairs
  const conflicts = [], goodPairs = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const rel = getRelType(names[i], names[j]);
      if (rel === 'bad')  conflicts.push([names[i], names[j]]);
      if (rel === 'good') goodPairs.push([names[i], names[j]]);
    }
  }

  let summaryHtml = '';
  if (conflicts.length) {
    summaryHtml = `<div class="matrix-alert matrix-alert--bad">
      ⚠️ Keep apart: ${conflicts.map(([a, b]) =>
        `<strong>${cropData[a]?.emoji || ''}${a}</strong> + <strong>${cropData[b]?.emoji || ''}${b}</strong>`
      ).join(' · ')}
    </div>`;
  } else if (goodPairs.length) {
    summaryHtml = `<div class="matrix-alert matrix-alert--good">
      🤝 ${goodPairs.length} good companion pair${goodPairs.length !== 1 ? 's' : ''} in your garden
    </div>`;
  }

  const ICONS  = { self: '', good: '✅', bad: '❌', neutral: '·' };
  const TITLES = { good: 'Good companions', bad: 'Keep apart — may harm each other', neutral: 'No known relationship' };

  const colHeaders = names.map(n =>
    `<th class="mx-col-hdr" title="${n}">${cropData[n]?.emoji || '🌱'}</th>`
  ).join('');

  const rows = names.map(a => {
    const cells = names.map(b => {
      const rel = getRelType(a, b);
      return `<td class="mx-cell mx-cell--${rel}" title="${rel !== 'self' ? TITLES[rel] : ''}">${ICONS[rel]}</td>`;
    }).join('');
    const shortName = a.length > 14 ? a.slice(0, 13) + '…' : a;
    return `<tr>
      <th class="mx-row-hdr" title="${a}">${cropData[a]?.emoji || '🌱'} <span>${shortName}</span></th>
      ${cells}
    </tr>`;
  }).join('');

  el.innerHTML = `
    <div class="matrix-header">
      <span class="matrix-title">🤝 Companion Planting</span>
    </div>
    ${summaryHtml}
    <div class="matrix-scroll">
      <table class="companion-matrix">
        <thead><tr><th></th>${colHeaders}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="matrix-legend">
      <span>✅ Good companion</span>
      <span>❌ Keep apart</span>
      <span>· No data</span>
    </div>`;
}

// ── Phase 12: Garden Beds ─────────────────────────
function loadBeds() {
  try { gardenBeds = JSON.parse(localStorage.getItem('pzf-beds') || '{}'); }
  catch { gardenBeds = {}; }
}
function saveBeds() { localStorage.setItem('pzf-beds', JSON.stringify(gardenBeds)); }

function addBed(name, emoji) {
  const id = String(Date.now());
  gardenBeds[id] = { name: name.trim(), emoji: emoji || '🌱' };
  saveBeds();
  renderGardenBeds();
}

function removeBed(id) {
  for (const name of Object.keys(myGarden)) {
    if (myGarden[name].bedId === id) { myGarden[name].bedId = null; }
  }
  saveGarden();
  delete gardenBeds[id];
  saveBeds();
  renderGardenBeds();
  if (currentPanelTab === 'garden') renderGardenTab();
}

function assignCropToBed(cropName, bedId) {
  if (!myGarden[cropName]) return;
  myGarden[cropName].bedId = bedId || null;
  saveGarden();
  renderGardenBeds();
  if (currentPanelTab === 'garden') renderGardenTab();
}

function renderGardenBeds() {
  const el = document.getElementById('garden-beds');
  if (!el) return;

  const bedIds = Object.keys(gardenBeds);
  const gardenNames = Object.keys(myGarden);

  // Map each bed → crops assigned to it
  const bedCrops = {};
  for (const id of bedIds) bedCrops[id] = [];
  const unassigned = [];
  for (const name of gardenNames) {
    const bid = myGarden[name]?.bedId;
    if (bid && gardenBeds[bid]) bedCrops[bid].push(name);
    else unassigned.push(name);
  }

  let html = `<div class="beds-header">
    <span class="beds-title">🛏 My Beds</span>
    <button class="beds-add-btn" id="beds-add-btn">+ New bed</button>
  </div>
  <div class="beds-new-form" id="beds-new-form" hidden>
    <input type="text" id="bed-name-input" placeholder="Bed name…" maxlength="30" autocomplete="off">
    <input type="text" id="bed-emoji-input" placeholder="🪴" maxlength="4">
    <button id="bed-save-btn">Add</button>
    <button id="bed-cancel-btn" class="bed-cancel">✕</button>
  </div>`;

  if (!bedIds.length) {
    html += `<p class="beds-empty">No beds yet — add one to organise crops by location.</p>`;
  } else {
    html += `<div class="beds-grid">`;
    for (const id of bedIds) {
      const bed = gardenBeds[id];
      const crops = bedCrops[id];
      const availableToAssign = gardenNames.filter(n => !myGarden[n]?.bedId || myGarden[n]?.bedId === id);

      const cropPills = crops.map(name => {
        const s = getGardenStatus(name);
        const cls = s?.type === 'ready' ? 'bed-pill--ready' : s?.type === 'growing' ? 'bed-pill--growing' : '';
        return `<span class="bed-crop-pill ${cls}" data-crop="${name}" title="Click to view">
          ${cropData[name]?.emoji || '🌱'} ${name}
          <button class="bed-pill-remove" data-crop="${name}" data-bed="${id}" aria-label="Remove from bed">×</button>
        </span>`;
      }).join('');

      const assignOpts = availableToAssign
        .filter(n => !crops.includes(n))
        .map(n => `<option value="${n}">${cropData[n]?.emoji || '🌱'} ${n}</option>`)
        .join('');

      html += `<div class="bed-card">
        <div class="bed-card-header">
          <span class="bed-card-emoji">${bed.emoji}</span>
          <span class="bed-card-name">${bed.name.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</span>
          <span class="bed-card-count">${crops.length} crop${crops.length !== 1 ? 's' : ''}</span>
          <button class="bed-remove-btn" data-bed="${id}" aria-label="Delete bed">×</button>
        </div>
        <div class="bed-card-crops">${cropPills || '<span class="bed-no-crops">No crops assigned</span>'}</div>
        ${assignOpts ? `<select class="bed-assign-select" data-bed="${id}" aria-label="Assign crop to bed">
          <option value="">+ Assign crop…</option>
          ${assignOpts}
        </select>` : ''}
      </div>`;
    }
    html += `</div>`;
  }

  el.innerHTML = html;

  // New bed form
  document.getElementById('beds-add-btn')?.addEventListener('click', () => {
    const form = document.getElementById('beds-new-form');
    if (form) { form.hidden = false; document.getElementById('bed-name-input')?.focus(); }
  });
  document.getElementById('bed-cancel-btn')?.addEventListener('click', () => {
    const form = document.getElementById('beds-new-form');
    if (form) form.hidden = true;
  });
  const doAddBed = () => {
    const name  = document.getElementById('bed-name-input')?.value || '';
    const emoji = document.getElementById('bed-emoji-input')?.value.trim() || '🪴';
    if (name.trim()) {
      addBed(name, emoji);
      const form = document.getElementById('beds-new-form');
      if (form) { form.hidden = true; document.getElementById('bed-name-input').value = ''; document.getElementById('bed-emoji-input').value = ''; }
    }
  };
  document.getElementById('bed-save-btn')?.addEventListener('click', doAddBed);
  document.getElementById('bed-name-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doAddBed();
    if (e.key === 'Escape') document.getElementById('bed-cancel-btn')?.click();
  });

  // Remove bed
  el.querySelectorAll('.bed-remove-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); removeBed(btn.dataset.bed); });
  });

  // Remove crop from bed
  el.querySelectorAll('.bed-pill-remove').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); assignCropToBed(btn.dataset.crop, null); });
  });

  // Click pill to open crop detail
  el.querySelectorAll('.bed-crop-pill').forEach(pill => {
    pill.addEventListener('click', e => {
      if (e.target.closest('.bed-pill-remove')) return;
      openCropDetail(pill.dataset.crop);
    });
  });

  // Assign crop dropdown
  el.querySelectorAll('.bed-assign-select').forEach(sel => {
    sel.addEventListener('change', e => {
      if (e.target.value) { assignCropToBed(e.target.value, e.target.dataset.bed); e.target.value = ''; }
    });
  });
}

function initBeds() {
  loadBeds();
}

// ── Phase 11: Country selector ────────────────────
async function reloadCountry(country) {
  if (country === selectedCountry) return;
  selectedCountry = country;
  localStorage.setItem('pzf-country', country);

  // Reset selection and go back to map view
  selectedZone = null;
  selectedFeature = null;
  selectedLayer = null;
  setLayoutMode('map');
  hidePanel();

  document.getElementById('loading-overlay').classList.remove('hidden');
  setLoadingText('Loading zone data…');

  try {
    const cfg = COUNTRY_CONFIG[country];
    const [zonesRes, plantingRes] = await Promise.all([
      fetch(cfg.geojson),
      fetch(cfg.planting),
    ]);
    if (!zonesRes.ok || !plantingRes.ok) throw new Error('Failed to load country data');
    zonesData    = await zonesRes.json();
    plantingData = await plantingRes.json();
    normalizeZoneProperties();

    // Swap map layers
    map.removeLayer(zonesLayer);
    zonesLayer = L.geoJSON(zonesData, {
      style: styleFeature,
      onEachFeature: attachFeature,
    }).addTo(map);
    if (cfg.bounds) map.fitBounds(cfg.bounds);
    else map.setView(cfg.center, cfg.zoom);

    document.getElementById('loading-overlay').classList.add('hidden');
    updateCountrySelectorUI();
    showToast(`Switched to ${cfg.label}`, 'success');
  } catch (err) {
    setLoadingText('Failed to load: ' + err.message);
    console.error(err);
  }
}

function updateCountrySelectorUI() {
  document.querySelectorAll('.country-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.country === selectedCountry);
  });
}

function initCountrySelector() {
  updateCountrySelectorUI();
  document.getElementById('country-selector')?.addEventListener('click', e => {
    const btn = e.target.closest('.country-btn');
    if (btn?.dataset.country) reloadCountry(btn.dataset.country);
  });
}

// ── Phase 15: Photo Diary (IndexedDB) ────────────
function openPhotoDB() {
  if (_photoDB) return Promise.resolve(_photoDB);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('pzf-photos', 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore('photos', { autoIncrement: true });
    };
    req.onsuccess = e => { _photoDB = e.target.result; resolve(_photoDB); };
    req.onerror   = e => reject(e.target.error);
  });
}

function savePhoto(dataURL) {
  return openPhotoDB().then(db => new Promise((resolve, reject) => {
    const tx  = db.transaction('photos', 'readwrite');
    const req = tx.objectStore('photos').add({ data: dataURL, ts: Date.now() });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = e => reject(e.target.error);
  }));
}

function loadPhoto(photoId) {
  return openPhotoDB().then(db => new Promise((resolve, reject) => {
    const tx  = db.transaction('photos', 'readonly');
    const req = tx.objectStore('photos').get(photoId);
    req.onsuccess = () => resolve(req.result?.data || null);
    req.onerror   = e => reject(e.target.error);
  }));
}

function deletePhoto(photoId) {
  return openPhotoDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    tx.objectStore('photos').delete(photoId);
    tx.oncomplete = resolve;
    tx.onerror    = e => reject(e.target.error);
  }));
}

function resizeImage(file) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1200;
      let w = img.width, h = img.height;
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
      if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = url;
  });
}

// ── Phase 16: Native Notifications ───────────────
function notifGranted()   { return 'Notification' in window && Notification.permission === 'granted'; }
function notifAvailable() { return 'Notification' in window && Notification.permission !== 'denied'; }

function updateNotifBtn() {
  const btn = document.getElementById('notif-btn');
  if (!btn) return;
  if (!('Notification' in window) || Notification.permission === 'denied') { btn.hidden = true; return; }
  btn.hidden = false;
  const on = notifGranted();
  btn.textContent = on ? '🔔' : '🔕';
  btn.title = on ? 'Notifications on' : 'Enable garden notifications';
  btn.classList.toggle('notif-on', on);
}

async function requestNotifPermission() {
  if (!('Notification' in window)) { showToast('Notifications not supported in this browser', 'info'); return; }
  if (Notification.permission === 'denied') { showToast('Notifications blocked — check browser Site settings', 'info'); return; }
  const result = await Notification.requestPermission();
  updateNotifBtn();
  if (result === 'granted') {
    showToast('Garden notifications enabled ✓', 'success');
    checkAndFireNotifications();
  }
}

function fireNotif(title, body, tag) {
  if (!notifGranted()) return;
  const n = new Notification(title, {
    body,
    icon: '/garden-zones/icons/icon.svg',
    badge: '/garden-zones/icons/icon.svg',
    tag,
  });
  n.onclick = () => { window.focus(); n.close(); };
}

function checkAndFireNotifications() {
  if (!notifGranted()) return;
  const today = new Date().toISOString().slice(0, 10);

  // Due reminders (once per day)
  if (localStorage.getItem('pzf-notif-reminder') !== today) {
    let fired = false;
    for (const [name, entry] of Object.entries(myGarden)) {
      if (!entry.reminder || entry.reminder > today) continue;
      fireNotif(`🔔 ${name} reminder`, `Your garden reminder for ${name} is due`, `reminder-${name}`);
      fired = true;
    }
    if (fired) localStorage.setItem('pzf-notif-reminder', today);
  }

  // Harvest ready (once per day)
  if (localStorage.getItem('pzf-notif-harvest') !== today) {
    const ready = Object.keys(myGarden).filter(n => getGardenStatus(n)?.type === 'ready');
    if (ready.length === 1) {
      fireNotif(`🌾 ${ready[0]} ready to harvest!`, 'Harvest countdown complete — time to pick!', 'harvest-ready');
      localStorage.setItem('pzf-notif-harvest', today);
    } else if (ready.length > 1) {
      fireNotif(`🌾 ${ready.length} crops ready to harvest`, ready.slice(0, 3).join(', '), 'harvest-ready');
      localStorage.setItem('pzf-notif-harvest', today);
    }
  }
}

function checkFrostNotification() {
  if (!notifGranted()) return;
  if (!weatherData?.daily?.temperature_2m_min) return;
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem('pzf-notif-frost') === today) return;
  const frostIdx = weatherData.daily.temperature_2m_min.slice(0, 2).findIndex(t => t < 35);
  if (frostIdx === -1) return;
  const atrisk = Object.keys(myGarden).filter(n => FROST_SENSITIVE.has(n) && myGarden[n]?.planted);
  if (!atrisk.length) return;
  const lbl = frostIdx === 0 ? 'tonight' : 'tomorrow';
  const ns  = atrisk.slice(0, 3).join(', ') + (atrisk.length > 3 ? ` +${atrisk.length - 3} more` : '');
  fireNotif(`❄️ Frost ${lbl} — act now`, `Cover or bring in: ${ns}`, 'frost-risk');
  localStorage.setItem('pzf-notif-frost', today);
}

function initNotifBtn() {
  updateNotifBtn();
  document.getElementById('notif-btn')?.addEventListener('click', async () => {
    if (notifGranted()) {
      showToast('To disable, go to browser Settings → Site permissions', 'info');
      return;
    }
    await requestNotifPermission();
  });
}

// ── Phase 17: Saved Locations ────────────────────
function loadSavedLocations() {
  try { savedLocations = JSON.parse(localStorage.getItem('pzf-saved-locs') || '[]'); }
  catch { savedLocations = []; }
}
function saveSavedLocationsStore() { localStorage.setItem('pzf-saved-locs', JSON.stringify(savedLocations)); }

function saveCurrentLocation() {
  if (!selectedZone) return;
  const name = selectedLocationName || `Zone ${getZoneDisplayLabel(selectedZone)}`;
  if (savedLocations.some(l => l.zone === selectedZone && Math.abs(l.lat - selectedLat) < 0.05 && Math.abs(l.lng - selectedLng) < 0.05)) {
    showToast('Location already saved', 'info'); return;
  }
  if (savedLocations.length >= 6) { showToast('Max 6 saved locations — remove one first', 'info'); return; }
  savedLocations.push({ id: Date.now(), name, lat: selectedLat, lng: selectedLng, zone: selectedZone, country: selectedCountry });
  saveSavedLocationsStore();
  renderSavedLocationsBar();
  showToast('Location saved 📌', 'success');
}

function removeSavedLocation(id) {
  savedLocations = savedLocations.filter(l => l.id !== id);
  saveSavedLocationsStore();
  renderSavedLocationsBar();
}

function restoreLocation(loc) {
  const doRestore = () => {
    selectedLocationName = loc.name;
    selectZoneByPoint(loc.lat, loc.lng);
    zoomToPoint(loc.lat, loc.lng);
    map.once('moveend', highlightZone);
  };
  if (loc.country && loc.country !== selectedCountry) {
    reloadCountry(loc.country).then(doRestore);
  } else {
    doRestore();
  }
}

function renderSavedLocationsBar() {
  const el = document.getElementById('saved-locations-bar');
  if (!el) return;
  if (!savedLocations.length) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = savedLocations.map(loc => `
    <div class="saved-loc-chip${loc.zone === selectedZone && Math.abs(loc.lat - selectedLat) < 0.05 ? ' active' : ''}" data-id="${loc.id}" role="button" tabindex="0" title="${loc.name}">
      <span class="saved-loc-name">${loc.name}</span>
      <button class="saved-loc-remove" data-id="${loc.id}" aria-label="Remove ${loc.name}">×</button>
    </div>`).join('');
}

function initSavedLocations() {
  loadSavedLocations();
  renderSavedLocationsBar();

  document.getElementById('save-location-btn')?.addEventListener('click', saveCurrentLocation);

  document.getElementById('saved-locations-bar')?.addEventListener('click', e => {
    const removeBtn = e.target.closest('.saved-loc-remove');
    if (removeBtn) { removeSavedLocation(parseInt(removeBtn.dataset.id, 10)); return; }
    const chip = e.target.closest('.saved-loc-chip');
    if (chip) {
      const loc = savedLocations.find(l => l.id === parseInt(chip.dataset.id, 10));
      if (loc) restoreLocation(loc);
    }
  });
}

