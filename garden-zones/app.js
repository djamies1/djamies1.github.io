/* ──────────────────────────────────────────────
   Plant Zone Finder — app.js
────────────────────────────────────────────── */

// ── ES module imports ──────────────────────────
import {
  WMO_ICONS, CROP_FAMILIES, CROP_VALUES,
  FROST_SENSITIVE, HEAT_SENSITIVE,
  COMPANION_REASONS, AVOID_REASONS,
  PROBLEM_SYMPTOMS, PROBLEM_LOCATIONS, PROBLEM_DIAGNOSES,
  DEFAULT_FEATURES,
  TIPS, ACHIEVEMENTS, LEVEL_TITLES, MILESTONE_ICONS,
  HARDENING_STEPS, NUDGE_TRIGGERS,
  ROTATION_RULES, ROTATION_SAFE, FAMILY_EMOJI,
  CARE_TYPES,
} from './data/constants.js';
import {
  ZONE_COLORS, CLIMATE_ZONE_COLORS, CLIMATE_ZONE_LABELS,
  SEASON_GRADIENTS, MONTH_NAMES,
  FROST_DATES, COUNTRY_CONFIG,
  BED_TYPES, STRUCTURE_TYPES,
  BED_COLORS, ZOOM_STEPS,
} from './data/config.js';
import {
  CROP_CATEGORIES, CROP_CATEGORY_MAP,
  HARVEST_TO_TABLE, SUPPLY_SUGGESTIONS, FERT_SUGGESTIONS,
  SEED_START_WEEKS, FERTILIZER_SCHEDULES, CROP_FERT_CATEGORY, FERT_DAY_OFFSETS,
  GROW_BY_RECIPE, NAMED_PEST_GUIDE, PEST_ALIASES,
} from './data/content.js';
import {
  getSeasonForMonth, frostDateToMonth,
  gridcodeToZone, getZoneCentroid,
  formatLocationName, parseHarvestDays, getWmoIcon,
  debounce, throttle,
} from './utils/index.js';
import { getRecipesForCrop, showHarvestRecipes } from './features/recipes.js';
import { scorePlantingDay, render7DayForecast } from './features/weather.js';
import { KEYS, loadJSON, saveJSON, loadBool, loadString } from './utils/storage.js';

// ── A11y helpers ───────────────────────────────
function addButtonKeydown(el, handler) {
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(e); }
  });
}

function trapFocus(modal) {
  const focusable = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0], last = focusable[focusable.length - 1];
  modal.addEventListener('keydown', function trap(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    }
  });
  first?.focus();
}

function announce(msg) {
  const el = document.getElementById('sr-announcer');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = msg; });
}




// ── Season helpers ─────────────────────────────
let _lastSeasonBg = null;


function updateSeasonBg() {
  const season = getSeasonForMonth(currentMonth);
  if (season === _lastSeasonBg) return;
  _lastSeasonBg = season;
  const el = document.getElementById('season-bg');
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.style.backgroundImage = SEASON_GRADIENTS[season];
    return;
  }
  el.style.transition = 'opacity 0.4s ease';
  el.style.opacity = '0';
  setTimeout(() => {
    el.style.backgroundImage = SEASON_GRADIENTS[season];
    el.style.opacity = '1';
  }, 400);
}





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

let currentTip = '';


// ── State ─────────────────────────────────────
let map, zonesLayer, selectedLayer;
let zonesData = null;
let plantingData = null;
let cropData = null;

let selectedFeature = null;
let selectedZone = null;
let selectedCountry = loadString(KEYS.COUNTRY, 'us');
let currentMonth = new Date().getMonth() + 1;

let myGarden = {};
let gardenBeds = {};
let activeBedId = null;
// Phase 87: Garden Map
const TILE_SIZE = 44;
let gardenCanvas = { cols: 20, rows: 15 };
let _mapSelectedBed = null;
let _mapPendingBed  = null;   // bed to auto-assign when crop is added via the modal
let _mapZoom       = 1;
let _mapSeasonMode = false;
let _undoStack     = [];
let _redoStack     = [];
let _drag = null;
let gardenStructures   = {};
let _structureDrag     = null;
let _mapSelectedStruct = null;
let _resizeDrag        = null;
let _cropDrag          = null;
let _drawMode          = false;
let _drawDrag          = null;
let _pendingDrawPos    = null;
let gardenViewMode     = loadString(KEYS.GARDEN_VIEW, 'crop');
let currentPanelTab = 'calendar';
let mySeeds = {};
let cropRotation = [];
let myPlan = {};
let myVarieties = {};
let journalSearchQuery = '';
let calPersonal = loadBool(KEYS.CAL_PERSONAL);
let layoutMode = loadString(KEYS.LAYOUT, 'map');
let journalEntries = [];
let _photoDB = null;
let selectedLocationName = null;
let savedLocations = [];
let _pendingPhoto = null; // dataURL staged for next journal entry
let gardenXP     = 0;
let gardenStreak = { count: 0, lastDate: null };

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
let browseSun = '';
let browseShortSeason = false;
let browseInGarden = false;
let browseFamily = '';
let compareMode = false;
let compareSet  = []; // max 2 crop names
let yearViewMode = 'garden'; // 'garden' | 'zone'

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
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const [zonesRes, plantingRes, cropsRes] = await Promise.all([
      fetch(cfg.geojson,          { signal: ctrl.signal }),
      fetch(cfg.planting,         { signal: ctrl.signal }),
      fetch('./data/crops.json',  { signal: ctrl.signal })
    ]);
    clearTimeout(timer);
    if (!zonesRes.ok) throw new Error(`zones: ${zonesRes.status}`);
    if (!plantingRes.ok) throw new Error(`planting: ${plantingRes.status}`);

    zonesData    = await zonesRes.json();
    plantingData = await plantingRes.json();
    cropData     = cropsRes.ok ? await cropsRes.json() : {};
    mergeCustomCrops();
    normalizeZoneProperties();

    // Let the browser repaint "Rendering map…" before the synchronous map build
    setLoadingText('Rendering map…');
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    initMap();
    initUI();
  } catch (err) {
    clearTimeout(timer);
    const msg = err.name === 'AbortError'
      ? 'Load timed out — check your connection and tap Retry'
      : err.message;
    setLoadingText('Failed to load: ' + msg);
    const retryBtn = document.getElementById('loading-retry');
    if (retryBtn) retryBtn.hidden = false;
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


// ── Map initialization ─────────────────────────
function initMap() {
  const container = document.getElementById('globe-container');
  const cfg = COUNTRY_CONFIG[selectedCountry] || COUNTRY_CONFIG.us;
  map = L.map(container, { center: cfg.center, zoom: cfg.zoom, minZoom: 3, maxZoom: 12, renderer: L.canvas() });
  zonesLayer = L.geoJSON(zonesData, {
    style: styleFeature,
    onEachFeature: attachFeature
  }).addTo(map);
  if (cfg.bounds) map.fitBounds(cfg.bounds);
  document.getElementById('loading-overlay').classList.add('hidden');
  announce('Zone data loaded');
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
  localStorage.setItem('pzf-last-lat', selectedLat != null ? String(selectedLat) : '');
  localStorage.setItem('pzf-last-lng', selectedLng != null ? String(selectedLng) : '');
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
  if (!selectedZone) showPanelSkeleton();
  syncBottomNavToPanel();
}

function hidePanel() {
  document.getElementById('info-panel').classList.add('panel-hidden');
  setBottomNavActive('map');
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
  hidePanelSkeleton();
  if (!selectedZone) return;

  const zone  = selectedZone;
  const month = currentMonth;

  renderLocationName();
  renderSavedLocationsBar();
  renderDailyBrief();
  // Phase 47: check seasonal nudges once per zone load
  requestIdleCallback ? requestIdleCallback(checkSeasonalNudges) : setTimeout(checkSeasonalNudges, 500);

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
  renderPlantingForecast();
  renderWateringAlert();
  renderThisWeek();
  renderFrostAlertBanner();

  // Month display + context
  const mEl = document.getElementById('month-display');
  if (mEl) {
    const s = getSeasonForMonth(month);  // already exists at line 260
    const SEASON_EMOJI = { spring:'🌸', summer:'☀️', autumn:'🍂', winter:'❄️' };
    mEl.className = `month-display-band month-display-band--${s}`;
    mEl.innerHTML = `<span class="mdb-emoji">${SEASON_EMOJI[s]}</span>
    <span class="mdb-label">${MONTH_NAMES[month]}</span>`;
  }
  const ctx   = isUSDASys() ? getMonthContext(zone, month) : '';
  const ctxEl = document.getElementById('month-context');
  ctxEl.textContent = ctx;
  ctxEl.hidden = !ctx;
  renderFrostCountdown();
  renderSeasonProgress();

  // Plant sections
  const data     = getPlantingData(zone, month);
  const sections = ['startIndoors', 'directSow', 'transplant', 'harvest'];
  let hasAny     = false;

  // Phase 136: build personal crop set for "Mine" filter
  renderCalViewToggle();
  const myPersonalSet = calPersonal ? buildPersonalCropSet() : null;

  for (const key of sections) {
    let items = data[key] || [];
    if (myPersonalSet) items = items.filter(n => myPersonalSet.has(n));
    const section = document.getElementById(`section-${key}`);
    const list    = document.getElementById(`list-${key}`);
    if (items.length > 0) {
      hasAny         = true;
      list.innerHTML = items.map(name => renderCropItem(name, key)).join('');
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
    const countEl = document.getElementById(`count-${key}`);
    if (countEl) countEl.textContent = items.length || '';
  }

  const sumEl = document.getElementById('cal-summary');
  if (sumEl) {
    const CHIP_META = {
      startIndoors: { icon: '🏠', label: 'to start',      cls: 'indoors'    },
      directSow:    { icon: '🌱', label: 'to sow',        cls: 'sow'        },
      transplant:   { icon: '🪴', label: 'to transplant', cls: 'transplant' },
      harvest:      { icon: '🌾', label: 'to harvest',    cls: 'harvest'    },
    };
    const chips = sections
      .filter(k => (data[k]||[]).length)
      .map(k => {
        const m = CHIP_META[k];
        return `<span class="csum-chip csum-chip--${m.cls}">${m.icon} <strong>${data[k].length}</strong> ${m.label}</span>`;
      }).join('');
    sumEl.innerHTML = chips ? `<div class="cal-summary">${chips}</div>` : '';
  }

  document.getElementById('no-tasks').style.display = hasAny ? 'none' : 'block';

  // Show crop search and reset it
  const csWrap = document.getElementById('calendar-search-wrap');
  if (csWrap) { csWrap.classList.remove('hidden'); }
  const csInput = document.getElementById('calendar-search');
  if (csInput && csInput.value) { csInput.value = ''; filterCalendarSearch(''); }

  // Tip
  document.getElementById('garden-tip').innerHTML =
    `<span class="tip-label">💡 Did you know?</span>${currentTip}`;

  renderYearView();
  renderSuccessionStrip(month);
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

// ── Phase 26 / 28: Haptics ──────────────────────
function haptic(pattern) {
  // Use Capacitor Haptics when running natively (iOS / Android)
  if (window.Capacitor?.isNativePlatform?.()) {
    try {
      const Haptics = window.Capacitor.Plugins.Haptics;
      if (Haptics) {
        // Double-tap array pattern → Medium impact, single ms → Light
        Haptics.impact({ style: Array.isArray(pattern) ? 'MEDIUM' : 'LIGHT' });
        return;
      }
    } catch {}
  }
  // Browser fallback
  if (navigator.vibrate) navigator.vibrate(pattern || 5);
}

// ── Phase 28: Capacitor native init ─────────────
async function initCapacitor() {
  if (!window.Capacitor?.isNativePlatform?.()) return;
  const plugins = window.Capacitor.Plugins;

  // Status bar colour matches current app theme
  try {
    if (plugins.StatusBar) {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light'
        || (!document.documentElement.getAttribute('data-theme')
            && window.matchMedia('(prefers-color-scheme: light)').matches);
      await plugins.StatusBar.setStyle({ style: isLight ? 'LIGHT' : 'DARK' });
      await plugins.StatusBar.setBackgroundColor({ color: isLight ? '#ffffff' : '#111827' });
    }
  } catch {}

  // Dismiss splash screen after UI has painted
  try {
    if (plugins.SplashScreen) await plugins.SplashScreen.hide({ fadeOutDuration: 300 });
  } catch {}

  // Local notifications permission check
  initLocalNotifications();

  // Hardware back button — close dialogs → browse → panel → exit
  try {
    if (plugins.App) {
      plugins.App.addListener('backButton', () => {
        // 1. Close any open <dialog>
        const openDialog = document.querySelector('dialog[open]');
        if (openDialog) { openDialog.close(); return; }
        // 2. Close browse view
        const browseView = document.getElementById('browse-view');
        if (browseView && !browseView.classList.contains('browse-hidden')) {
          toggleBrowse(); return;
        }
        // 3. Collapse panel
        const panel = document.getElementById('panel');
        if (panel && !panel.classList.contains('panel-hidden')) {
          hidePanel(); return;
        }
        // 4. Nothing left to close — exit
        plugins.App.exitApp();
      });
    }
  } catch {}
}

// ── Phase 26: Panel skeleton ────────────────────
function showPanelSkeleton() {
  document.getElementById('panel-skeleton')?.removeAttribute('hidden');
}
function hidePanelSkeleton() {
  document.getElementById('panel-skeleton')?.setAttribute('hidden', '');
}

// ── Phase 26: Bottom nav ────────────────────────
function initBottomNav() {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;
  updateBnavGardenBadge();
  nav.addEventListener('click', e => {
    const btn = e.target.closest('.bnav-btn');
    if (!btn) return;
    haptic(4);
    setBottomNavActive(btn.dataset.bnav);
    const tab = btn.dataset.bnav;
    if (tab === 'map') {
      hidePanel();
    } else if (tab === 'planner') {
      if (!selectedZone) { showPanel(); showPanelSkeleton(); return; }
      showPanel();
      // Switch to calendar tab
      currentPanelTab = 'calendar';
      document.querySelectorAll('.ptab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'calendar'));
      document.getElementById('tab-calendar').hidden = false;
      document.getElementById('tab-garden').hidden   = true;
      const jEl = document.getElementById('tab-journal');
      if (jEl) jEl.hidden = true;
    } else if (tab === 'garden') {
      if (!selectedZone) { showPanel(); showPanelSkeleton(); return; }
      showPanel();
      currentPanelTab = 'garden';
      document.querySelectorAll('.ptab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'garden'));
      document.getElementById('tab-calendar').hidden = true;
      document.getElementById('tab-garden').hidden   = false;
      const jEl = document.getElementById('tab-journal');
      if (jEl) jEl.hidden = true;
      renderGardenTab();
    } else if (tab === 'browse') {
      toggleBrowse(true);
    }
  });
}

function setBottomNavActive(tab) {
  document.querySelectorAll('.bnav-btn').forEach(b =>
    b.classList.toggle('bnav-active', b.dataset.bnav === tab));
}

function syncBottomNavToPanel() {
  const panel = document.getElementById('info-panel');
  if (!panel || panel.classList.contains('panel-hidden')) {
    setBottomNavActive('map');
  } else {
    setBottomNavActive(currentPanelTab === 'garden' ? 'garden' : 'planner');
  }
}

function updateBnavGardenBadge() {
  const badge = document.getElementById('bnav-garden-badge');
  if (!badge) return;
  const count = Object.keys(myGarden || {}).length;
  badge.textContent = count > 0 ? count : '';
  badge.hidden = count === 0;
}

// ── Theme ───────────────────────────────────────
function initTheme() {
  const saved = loadString(KEYS.THEME);
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn();
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
}

function toggleTheme() {
  const el = document.documentElement;
  const current = el.getAttribute('data-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = current === 'dark' || (current !== 'light' && prefersDark) || (current !== 'light' && !window.matchMedia('(prefers-color-scheme: light)').matches);
  const next = isDark ? 'light' : 'dark';
  el.setAttribute('data-theme', next);
  localStorage.setItem('pzf-theme', next);
  updateThemeBtn();
  initCapacitor(); // re-sync native status bar colour
}

function updateThemeBtn() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const theme = document.documentElement.getAttribute('data-theme');
  const isLight = theme === 'light' || (!theme && window.matchMedia('(prefers-color-scheme: light)').matches);
  btn.textContent = isLight ? '🌙' : '☀️';
  btn.title = isLight ? 'Switch to dark mode' : 'Switch to light mode';
}

// ── UI initialization ──────────────────────────
function initUI() {
  initTheme();
  initBottomNav();
  initCapacitor();
  loadPersistedWeather();
  // Load persisted preferences
  useMetric = loadBool(KEYS.METRIC);
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
  initLongPress();
  loadRecentlyViewed();
  initSettings();
  // Inline onclick replacements (a11y: no global handlers)
  document.getElementById('loading-retry')?.addEventListener('click', () => location.reload());
  document.querySelector('.gallery-close-btn')?.addEventListener('click', closeGardenGallery);
  document.querySelector('.ps-close-btn')?.addEventListener('click', closeProblemSolver);
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
  // Phase 49: keep slider accessible
  const slider = document.getElementById('month-slider');
  if (slider) slider.setAttribute('aria-valuetext', MONTH_NAMES[currentMonth]);
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
// section: 'startIndoors' | 'directSow' | 'transplant' | 'harvest' | null (generic)
function renderCropItem(name, section = null) {
  const c = cropData && cropData[name];
  if (!c) return `<li class="crop-plain">${name}</li>`;
  const inG = isInGarden(name);

  let detail = '';
  let tipHtml = c.tip ? `<div class="crop-tip">${c.tip}</div>` : '';

  if (c.custom) {
    detail  = c.days ? `🗓 ${c.days} days to harvest` : 'Custom crop';
    tipHtml = c.description ? `<div class="crop-tip">${c.description}</div>` : '';

  } else if (section === 'startIndoors') {
    // Germination temp + exact start-by date
    let timingStr = '';
    const weeks = c.transplant_weeks;
    if (weeks && selectedZone) {
      const frost = FROST_DATES[selectedZone.toLowerCase()];
      if (frost?.last) {
        const lastFrost = parseFrostDate(frost.last);
        if (lastFrost) {
          const startBy  = new Date(lastFrost.getTime() - weeks * 7 * 86400000);
          const today    = new Date(); today.setHours(0,0,0,0);
          const daysLeft = Math.round((startBy - today) / 86400000);
          const MON      = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const dateStr  = `${MON[startBy.getMonth()]} ${startBy.getDate()}`;
          timingStr = daysLeft > 0
            ? `📅 Start by ${dateStr} (${daysLeft}d)`
            : daysLeft >= -14
              ? `📅 Start now — ${-daysLeft}d overdue`
              : `📅 ${weeks} wks before last frost`;
        }
      }
    } else if (weeks) {
      timingStr = `📅 ${weeks} wks before last frost`;
    }
    detail = [c.germ_temp ? `🌡 ${c.germ_temp}` : '', timingStr].filter(Boolean).join(' · ');

  } else if (section === 'directSow') {
    detail = [
      c.depth   ? `${convertMeasurement(c.depth)} deep`  : '',
      c.spacing ? `${convertMeasurement(c.spacing)} apart` : '',
      c.germ_temp ? `🌡 ${c.germ_temp}` : '',
    ].filter(Boolean).join(' · ');

  } else if (section === 'transplant') {
    detail = [
      c.spacing ? `${convertMeasurement(c.spacing)} apart` : '',
      c.water   ? convertMeasurement(c.water) : '',
      c.days    || '',
    ].filter(Boolean).join(' · ');

  } else if (section === 'harvest') {
    detail  = c.harvest_cues || c.days || '';
    tipHtml = c.storage
      ? `<div class="crop-tip crop-tip--storage">📦 ${c.storage}</div>`
      : (c.tip ? `<div class="crop-tip">${c.tip}</div>` : '');

  } else {
    // Generic (browse, search, etc.)
    detail = `${convertMeasurement(c.depth)} deep · ${convertMeasurement(c.spacing)} apart · ${convertMeasurement(c.water)} · ${c.days}`;
  }

  // Phase 136: personal badges
  const seedEntry   = mySeeds?.[name];
  const grewBefore  = gardenHistory?.some(h => h.name === name);
  const personalBadges = [
    seedEntry  ? `<span class="crop-badge crop-badge--seeds" title="In your seed stash">🌰${seedEntry.qty ? ' ' + seedEntry.qty : ''}</span>` : '',
    grewBefore && !inG ? `<span class="crop-badge crop-badge--history" title="You grew this before">✓ grew</span>` : '',
  ].join('');

  return `<li class="crop-card" data-crop="${name}" role="button" tabindex="0" aria-label="${name} — tap for details">
    <div class="crop-card-body">
      <div class="crop-title">${c.emoji || '🌱'} ${name}${inG ? '<span class="crop-garden-star">★</span>' : ''}${c.custom ? '<span class="custom-crop-badge">Custom</span>' : ''}${personalBadges}</div>
      ${detail ? `<div class="crop-detail">${detail}</div>` : ''}
      ${tipHtml}
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
  const _prev = document.activeElement;
  document.getElementById('modal-emoji').textContent       = c.emoji || '🌱';
  document.getElementById('modal-crop-name').textContent   = name;
  const badge = document.getElementById('modal-difficulty');
  badge.textContent = c.difficulty || '';
  badge.className   = 'difficulty-badge' + (c.difficulty ? ' difficulty-' + c.difficulty.toLowerCase() : '');
  c._name = name; // allow renderCropDetail to access the name for companion lookups
  document.getElementById('modal-body').innerHTML    = c.custom ? renderCustomCropDetail(c, name) : renderCropDetail(c);
  document.getElementById('modal-body').scrollTop   = 0;
  // Phase 67: wire companion/avoid tag clicks
  document.getElementById('modal-body').querySelectorAll('[data-open-crop]').forEach(el => {
    el.addEventListener('click', () => openCropDetail(el.dataset.openCrop));
  });
  if (!c.custom) {
    const schedPH = document.getElementById('modal-schedule-placeholder');
    if (schedPH) schedPH.outerHTML = renderPlantingScheduleHTML(name);
  }
  renderModalGardenBar(name);
  renderSafeToSowBadge(name);
  renderModalGardenSections(name);
  if (!c.custom) renderRelatedCrops(name);
  if (!c.custom) renderVarietyHistory(name);
  if (!c.custom) renderSeedStartSection(name);
  if (!c.custom) renderFertilizerSection(name);
  if (!c.custom) renderSeasonSuitabilityBar(name);
  if (!c.custom) renderCropPestGuide(name);
  if (!c.custom) renderSpacingCalculator(name);
  // Phase 85: share button in modal header
  const shareBtn = document.getElementById('modal-share-crop-btn');
  if (shareBtn) { shareBtn.onclick = () => shareCropCard(name); }
  trackRecentlyViewed(name);
  if (!modal.open) {
    modal.showModal();
    trapFocus(modal);
    modal.addEventListener('close', () => _prev?.focus(), { once: true });
  }
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

  const quickFacts = [
    c.days_min ? `<span class="cd-fact">⏱ ${c.days_min}–${c.days_max || c.days_min}d</span>` : '',
    (features.startIndoors && c.transplant_weeks) ? `<span class="cd-fact">🪴 Start ${c.transplant_weeks}w indoors</span>` : '',
    c.succession_weeks ? `<span class="cd-fact">🔄 Sow every ${c.succession_weeks}w</span>` : '',
    c.seed_life_years ? `<span class="cd-fact">🌰 Seeds viable ${c.seed_life_years}yr</span>` : '',
    c.container_ok ? `<span class="cd-fact cd-fact--ok">🪣 Container OK</span>` : '',
  ].filter(Boolean).join('');

  return `
    ${quickFacts ? `<div class="cd-facts-row">${quickFacts}</div>` : ''}
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
    ${features.companionPlanting ? `<div class="modal-section">
      <div class="modal-section-title">Companions &amp; Enemies</div>
      <div class="companion-guide">
        ${(c.companions||[]).length ? `<div class="cg-group">
          <div class="cg-group-label cg-group-label--with">✅ Plant with</div>
          ${(c.companions||[]).map(t => {
            const reason = COMPANION_REASONS[`${c._name}|${t}`] || '';
            const inG = isInGarden(t);
            const em = cropData[t]?.emoji || '🌱';
            return `<div class="cg-item${inG ? ' cg-item--in-garden' : ''}" data-open-crop="${t}">
              <span class="detail-tag detail-tag--companions cg-tag">${em} ${t}${inG ? '<span class="cg-in-garden">★</span>' : ''}</span>
              ${reason ? `<span class="cg-reason">${reason}</span>` : ''}
            </div>`;
          }).join('')}
        </div>` : ''}
        ${(c.avoid||[]).length ? `<div class="cg-group">
          <div class="cg-group-label cg-group-label--avoid">⚠️ Avoid near</div>
          ${(c.avoid||[]).map(t => {
            const reason = AVOID_REASONS[`${c._name}|${t}`] || '';
            const em = cropData[t]?.emoji || '🌱';
            return `<div class="cg-item" data-open-crop="${t}">
              <span class="detail-tag detail-tag--avoid cg-tag">${em} ${t}</span>
              ${reason ? `<span class="cg-reason cg-reason--avoid">${reason}</span>` : ''}
            </div>`;
          }).join('')}
        </div>` : ''}
        ${(() => {
          const reverse = cropData ? Object.keys(cropData)
            .filter(n => n !== c._name && cropData[n].companions?.includes(c._name))
            .slice(0, 8) : [];
          return reverse.length ? `<div class="cg-group cg-group--reverse">
            <div class="cg-group-label cg-group-label--reverse">↩ Also pairs well with</div>
            <div class="cg-reverse-chips">
              ${reverse.map(n => `<span class="cg-reverse-chip${isInGarden(n) ? ' cg-reverse-chip--in-garden' : ''}" data-open-crop="${n}">${cropData[n]?.emoji || '🌱'} ${n}</span>`).join('')}
            </div>
          </div>` : '';
        })()}
        ${!(c.companions||[]).length && !(c.avoid||[]).length ? '<span class="detail-empty">None listed</span>' : ''}
      </div>
    </div>` : ''}
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
  if (!el) return;
  el.textContent = msg;
  // Use assertive role for errors so screen readers announce immediately
  const isError = msg.toLowerCase().startsWith('failed') || msg.toLowerCase().startsWith('error');
  el.setAttribute('role', isError ? 'alert' : 'status');
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

  // Handle manifest shortcuts (?tab=garden, ?browse=1)
  const tabParam = params.get('tab');
  if (tabParam === 'garden') {
    currentPanelTab = 'garden';
    document.querySelectorAll('.ptab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'garden'));
    document.getElementById('tab-calendar').hidden = true;
    document.getElementById('tab-garden').hidden   = false;
    document.getElementById('tab-journal').hidden  = true;
  }
  if (params.get('browse') === '1') {
    requestAnimationFrame(() => document.getElementById('browse-btn')?.click());
  }

  selectedLocationName = localStorage.getItem('pzf-last-location') || null;
  const zoneToRestore = z || localStorage.getItem('pzf-last-zone');
  const lastLat = parseFloat(localStorage.getItem('pzf-last-lat'));
  const lastLng = parseFloat(localStorage.getItem('pzf-last-lng'));
  if (!isNaN(lastLat) && !isNaN(lastLng) && zonesLayer) {
    // Restore with actual coordinates — correct zone sub-type + correct weather location
    selectZoneByPoint(lastLat, lastLng);
  } else if (zoneToRestore && zonesLayer) {
    // Legacy fallback for sessions before this fix: match zone by name (uses centroid)
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

// ── Browse view ────────────────────────────────
function initBrowse() {
  // Update crop count in search placeholder dynamically
  const searchEl = document.getElementById('browse-search');
  if (searchEl && cropData) searchEl.placeholder = `Search ${Object.keys(cropData).length} crops…`;

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
    search.addEventListener('input', debounce(() => {
      browseSearch = search.value.toLowerCase().trim();
      renderBrowseGrid();
    }, 250));
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

  const familySel = document.getElementById('browse-family');
  if (familySel) {
    familySel.addEventListener('change', () => {
      browseFamily = familySel.value;
      renderBrowseGrid();
    });
  }

  // Phase 65: advanced filter chips
  document.getElementById('browse-extra')?.addEventListener('click', e => {
    const chip = e.target.closest('.browse-adv-chip');
    if (!chip) return;
    const filter = chip.dataset.filter;
    const val = chip.dataset.val;
    if (filter === 'sun') {
      browseSun = browseSun === val ? '' : val;
      document.querySelectorAll('.browse-adv-chip[data-filter="sun"]').forEach(c => c.classList.toggle('active', c.dataset.val === browseSun));
    } else if (filter === 'short') {
      browseShortSeason = !browseShortSeason;
      chip.classList.toggle('active', browseShortSeason);
    } else if (filter === 'ingarden') {
      browseInGarden = !browseInGarden;
      chip.classList.toggle('active', browseInGarden);
    }
    renderBrowseGrid();
  });

  const grid = document.getElementById('browse-grid');
  if (grid) {
    grid.addEventListener('click', e => {
      const card = e.target.closest('.browse-card');
      if (!card?.dataset.crop) return;
      if (compareMode) { addToCompare(card.dataset.crop); } else { openCropDetail(card.dataset.crop); }
    });
    grid.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.browse-card');
        if (!card?.dataset.crop) return;
        e.preventDefault();
        if (compareMode) { addToCompare(card.dataset.crop); } else { openCropDetail(card.dataset.crop); }
      }
    });
  }

  document.getElementById('browse-compare-btn')?.addEventListener('click', toggleCompareMode);
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
    setBottomNavActive('browse');
  } else {
    // Reset compare state on close
    if (compareMode) {
      compareMode = false;
      compareSet  = [];
      document.getElementById('browse-compare-btn')?.classList.remove('browse-cmp-btn--active');
      document.getElementById('browse-view')?.classList.remove('browse-compare-mode');
      const dr = document.getElementById('compare-drawer');
      if (dr) dr.hidden = true;
    }
    syncBottomNavToPanel();
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
    crops = crops.filter(([name]) => cropMatchesQuery(name, browseSearch));
  }

  if (browseDifficulty) {
    crops = crops.filter(([, c]) => c.difficulty === browseDifficulty);
  }

  if (browseInSeason && selectedZone) {
    crops = crops.filter(([name]) => activeSet.has(name));
  }

  // Phase 65: advanced filters
  if (browseSun) {
    crops = crops.filter(([, c]) => c.sun?.toLowerCase().includes(browseSun.toLowerCase()));
  }
  if (browseShortSeason) {
    crops = crops.filter(([, c]) => { const d = parseHarvestDays(c.days); return d && d < 60; });
  }
  if (browseInGarden) {
    crops = crops.filter(([name]) => isInGarden(name));
  }
  if (browseFamily) {
    crops = crops.filter(([name, c]) => (c.family || CROP_FAMILIES[name]) === browseFamily);
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
    const isSelected   = compareMode && compareSet.includes(name);
    return `<div class="browse-card${isActive ? ' browse-card--active' : ''}${isSelected ? ' browse-card--selected' : ''}" data-crop="${name}" role="button" tabindex="0" style="animation-delay:${i * 0.025}s">
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
  // Migrate legacy single bedId → bedIds array
  for (const entry of Object.values(myGarden)) {
    if (!entry.bedIds) entry.bedIds = entry.bedId ? [entry.bedId] : [];
  }
}
function saveGarden() { localStorage.setItem('pzf-garden', JSON.stringify(myGarden)); }
function isInGarden(name) { return !!myGarden[name]; }

function getCropsInBed(bedId) {
  return Object.keys(myGarden).filter(n => myGarden[n]?.bedIds?.includes(bedId));
}
function addCropToBed(cropName, bedId) {
  if (!myGarden[cropName]) return;
  const ids = myGarden[cropName].bedIds || [];
  if (ids.includes(bedId)) return;
  ids.push(bedId);
  myGarden[cropName].bedIds = ids;
  const bed = gardenBeds[bedId];
  if (bed) {
    if (!bed.cropOrder) bed.cropOrder = [];
    if (!bed.cropOrder.includes(cropName)) bed.cropOrder.push(cropName);
    saveBeds();
  }
  saveGarden(); renderGardenBeds();
  if (currentPanelTab === 'garden') renderGardenTab();
}
function removeCropFromBed(cropName, bedId) {
  if (!myGarden[cropName]) return;
  myGarden[cropName].bedIds = (myGarden[cropName].bedIds || []).filter(id => id !== bedId);
  const bed = gardenBeds[bedId];
  if (bed?.cropOrder) { bed.cropOrder = bed.cropOrder.filter(n => n !== cropName); saveBeds(); }
  saveGarden(); renderGardenBeds();
  if (currentPanelTab === 'garden') renderGardenTab();
}

function gardenAdd(name) {
  if (myGarden[name]) return;
  myGarden[name] = { added: new Date().toISOString().slice(0,10), planted: null };
  saveGarden(); refreshGardenUI(name);
  checkCompanionConflicts(name);
  announce(`${name} added to your garden`);
  haptic([10, 40, 5]);
  maybeRequestReview();
  earnXP(20, `Added ${name} to garden`);
}
function gardenRemove(name) {
  const hadPlanted = !!myGarden[name]?.planted;
  if (hadPlanted) autoMilestone(`Removed ${name} from the garden.`, name, 'removed');
  archiveGardenEntry(name); delete myGarden[name]; saveGarden(); refreshGardenUI(name); haptic(5);
  if (hadPlanted) promptVarietyLog(name);
}

// ── Phase 22: Pest & Problem log ─────────────────
function gardenLogProblem(name, type, notes) {
  if (!myGarden[name]) return;
  if (!myGarden[name].problems) myGarden[name].problems = [];
  myGarden[name].problems.unshift({
    id: Date.now(),
    date: new Date().toISOString().slice(0, 10),
    type: type.trim(),
    notes: (notes || '').trim(),
    resolved: false,
  });
  saveGarden(); refreshGardenUI(name);
  const noteStr = notes ? `: ${notes.trim().split(/[.!?]/)[0]}` : '';
  autoMilestone(`Problem logged for ${name} — ${type}${noteStr}.`, name, 'problem');
}
function gardenResolveProblem(name, id) {
  const p = myGarden[name]?.problems?.find(p => p.id === id);
  if (p) { p.resolved = true; p.resolvedDate = new Date().toISOString().slice(0, 10); }
  saveGarden(); refreshGardenUI(name);
  earnXP(10, `Resolved problem on ${name}`);
}
function gardenDeleteProblem(name, id) {
  if (!myGarden[name]?.problems) return;
  myGarden[name].problems = myGarden[name].problems.filter(p => p.id !== id);
  saveGarden(); refreshGardenUI(name);
}

function renderModalProblems(name) {
  const body = document.getElementById('modal-body');
  if (!body || !isInGarden(name)) return;
  body.querySelector('.modal-problems-section')?.remove();

  const problems  = myGarden[name]?.problems || [];
  const open      = problems.filter(p => !p.resolved);
  const resolved  = problems.filter(p => p.resolved).slice(0, 3);
  const TYPES     = ['\uD83D\uDC1B Aphids', '\uD83D\uDC0C Slugs', '\uD83C\uDF44 Fungal', '\uD83D\uDE35 Wilting', '\u2753 Other'];

  const openRows = open.map(p => `
    <div class="prob-item" data-id="${p.id}">
      <span class="prob-date">${p.date}</span>
      <span class="prob-type">${p.type}</span>
      ${p.notes ? `<span class="prob-notes">${p.notes.replace(/</g,'&lt;')}</span>` : ''}
      <button class="prob-resolve-btn" data-id="${p.id}" title="Mark resolved">\u2713</button>
      <button class="prob-delete-btn" data-id="${p.id}" title="Delete">\u00d7</button>
    </div>`).join('');

  const resolvedRows = resolved.map(p => `
    <div class="prob-item prob-item--resolved">
      <span class="prob-date">${p.date}</span>
      <span class="prob-type">${p.type}</span>
      <span class="prob-resolved-tag">resolved</span>
    </div>`).join('');

  const sec = document.createElement('div');
  sec.className = 'modal-section modal-problems-section';
  sec.innerHTML = `
    <div class="modal-section-title">\uD83D\uDC1B Problems ${open.length ? `<span class="prob-open-count">${open.length} open</span>` : ''}</div>
    ${openRows || '<p class="prob-none">No active problems logged.</p>'}
    ${resolvedRows ? `<div class="prob-resolved-group">${resolvedRows}</div>` : ''}
    <div class="prob-add-form">
      <button class="prob-diagnose-btn" data-crop="${name}">🔍 Not sure? Diagnose the problem</button>
      <div class="prob-type-chips">${TYPES.map(t => `<button class="prob-chip" data-type="${t}">${t}</button>`).join('')}</div>
      <div class="prob-add-row">
        <input type="text" class="prob-notes-input" id="prob-notes-in" placeholder="Notes (optional)">
        <button class="prob-add-btn" id="prob-add-btn">Log</button>
      </div>
    </div>`;
  body.appendChild(sec);

  sec.querySelector('.prob-diagnose-btn').addEventListener('click', e => {
    openProblemSolver(e.currentTarget.dataset.crop);
  });

  let selectedType = null;
  sec.querySelectorAll('.prob-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      selectedType = chip.dataset.type;
      sec.querySelectorAll('.prob-chip').forEach(c => c.classList.toggle('prob-chip--active', c === chip));
    });
  });
  sec.querySelector('#prob-add-btn').addEventListener('click', () => {
    if (!selectedType) { showToast('Select a problem type first', 'info'); return; }
    gardenLogProblem(name, selectedType, sec.querySelector('#prob-notes-in').value);
    sec.querySelector('#prob-notes-in').value = '';
    selectedType = null;
  });
  sec.querySelectorAll('.prob-resolve-btn').forEach(btn =>
    btn.addEventListener('click', () => gardenResolveProblem(name, parseInt(btn.dataset.id)))
  );
  sec.querySelectorAll('.prob-delete-btn').forEach(btn =>
    btn.addEventListener('click', () => gardenDeleteProblem(name, parseInt(btn.dataset.id)))
  );
}
function gardenSetPlanted(name, dateStr) {
  if (myGarden[name]) {
    myGarden[name].planted = dateStr || null;
    saveGarden();
    refreshGardenUI(name);
    if (dateStr) {
      autoMilestone(`Planted ${name} on ${dateStr}.`, name, 'planted');
      earnXP(15, `Planted ${name}`);
    }
  }
}

function refreshGardenUI(name) {
  // Phase 125: detect stage transitions and fire milestone
  if (name && myGarden[name]?.planted) {
    const status = getGardenStatus(name);
    const newStage = status?.stage?.stage;
    if (newStage) {
      const prevStage = myGarden[name]._lastStage;
      if (prevStage && prevStage !== newStage) {
        const STAGE_LABELS = { germinating:'germinating', seedling:'seedling stage', growing:'growing', maturing:'maturing', ready:'harvest-ready' };
        autoMilestone(`${name} reached ${STAGE_LABELS[newStage] || newStage}.`, name, 'stage');
      }
      myGarden[name]._lastStage = newStage;
    }
  }
  updateGardenBadge();
  updateBnavGardenBadge();
  checkReminders();
  renderHarvestReadyBanner();
  updateJournalCropSelect();
  checkAchievements();
  if (currentPanelTab === 'garden') { renderGardenTab(); renderGrowNext(); }
  renderFrostAlertBanner();
  renderThisWeek();
  renderTodayDashboard();
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
  // Re-apply calendar search filter after list re-render (so hidden items stay hidden)
  const csInput = document.getElementById('calendar-search');
  if (csInput?.value) filterCalendarSearch(csInput.value);
  // Re-render browse grid if open
  const browseView = document.getElementById('browse-view');
  if (browseView && !browseView.classList.contains('browse-hidden')) renderBrowseGrid();
}

function updateGardenBadge() {
  const count = Object.keys(myGarden).length;
  const badge = document.getElementById('garden-count-badge');
  if (badge) badge.textContent = count > 0 ? count : '';
}

// ── Phase 23: Garden Archive / History ───────────
let gardenHistory = [];

function loadHistory() {
  try { gardenHistory = JSON.parse(localStorage.getItem('pzf-history') || '[]'); }
  catch { gardenHistory = []; }
}
function saveHistory() { localStorage.setItem('pzf-history', JSON.stringify(gardenHistory)); }

function archiveGardenEntry(name) {
  const entry = myGarden[name];
  // Only archive entries with meaningful data
  if (!entry?.planted && !entry?.harvestLog?.length) return;
  loadHistory();
  gardenHistory.unshift({
    name,
    emoji: cropData?.[name]?.emoji || '\uD83C\uDF31',
    zone: selectedZone || null,
    year: new Date().getFullYear(),
    archivedDate: new Date().toISOString().slice(0, 10),
    planted: entry.planted || null,
    removed: new Date().toISOString().slice(0, 10),
    harvestLog: entry.harvestLog || [],
    notes: entry.notes || '',
    rating: entry.rating || null,
  });
  // Keep last 200 archived entries
  if (gardenHistory.length > 200) gardenHistory.length = 200;
  saveHistory();

  // Phase 54: record bed rotation
  const primaryBedId = entry?.bedIds?.[0];
  if (primaryBedId && gardenBeds[primaryBedId]) {
    loadRotation();
    cropRotation.push({
      name,
      family: CROP_FAMILIES[name] || cropData[name]?.family || null,
      bedId: primaryBedId,
      bedName: gardenBeds[primaryBedId]?.name || '',
      year: new Date().getFullYear(),
      emoji: cropData?.[name]?.emoji || '🌱',
    });
    if (cropRotation.length > 500) cropRotation.length = 500;
    saveRotation();
  }
}

function clearArchivedEntry(idx) {
  loadHistory();
  gardenHistory.splice(idx, 1);
  saveHistory();
  renderGardenHistory();
}

function renderGardenHistory() {
  const el = document.getElementById('garden-history');
  if (!el) return;
  loadHistory();
  if (!gardenHistory.length) { el.innerHTML = ''; return; }

  // Group by year
  const byYear = {};
  for (const entry of gardenHistory) {
    const y = entry.year || new Date(entry.archivedDate).getFullYear();
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(entry);
  }

  const renderStarStr = r => r ? '\u2605'.repeat(r) + '\u2606'.repeat(5 - r) : '';

  let html = '<div class="hist-title">\uD83D\uDCDC Past Seasons</div>';
  for (const [year, entries] of Object.entries(byYear).sort((a, b) => b[0] - a[0])) {
    html += `<div class="hist-year-label">${year}</div>`;
    for (const [i, e] of entries.entries()) {
      const totalIdx = gardenHistory.indexOf(e);
      const harvests = e.harvestLog?.length || 0;
      const daysGrown = (e.planted && e.removed)
        ? Math.round((new Date(e.removed) - new Date(e.planted + 'T00:00:00')) / 86400000)
        : null;
      const starStr = renderStarStr(e.rating);
      html += `
        <div class="hist-item" data-idx="${totalIdx}">
          <span class="hist-emoji">${e.emoji}</span>
          <div class="hist-info">
            <span class="hist-name">${e.name}</span>
            <span class="hist-meta">
              ${e.planted ? `Planted ${e.planted}` : 'No date'}
              ${daysGrown != null ? ` \u00b7 ${daysGrown}d grown` : ''}
              ${harvests ? ` \u00b7 \uD83C\uDF3E\u00d7${harvests}` : ''}
              ${starStr ? ` \u00b7 ${starStr}` : ''}
              ${e.zone ? ` \u00b7 Zone ${e.zone}` : ''}
            </span>
            ${e.notes ? `<span class="hist-notes">${e.notes.replace(/</g,'&lt;').slice(0, 80)}${e.notes.length > 80 ? '\u2026' : ''}</span>` : ''}
          </div>
          <button class="hist-delete-btn" data-idx="${totalIdx}" aria-label="Remove from history">\u00d7</button>
        </div>`;
    }
  }
  el.innerHTML = html;

  el.addEventListener('click', e => {
    const btn = e.target.closest('.hist-delete-btn');
    if (btn) clearArchivedEntry(parseInt(btn.dataset.idx));
  });
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

    // Overdue watering (Phase 50)
    const ws = getWaterStatus(name);
    if (ws?.type === 'dry' && entry.planted) {
      tasks.push({ icon: '💧', head: `Water ${name}`, sub: ws.label, type: 'action', crop: name });
    }

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

function renderGardenByBed() {
  const bedIds = Object.keys(gardenBeds);
  if (!bedIds.length) {
    return `<div class="gvb-empty">No garden beds yet.<br><button class="gvb-open-map-btn" id="gvb-open-map">＋ Map my garden →</button></div>`;
  }
  return bedIds.map(bedId => {
    const bed = gardenBeds[bedId];
    const cols = bed.cols || 4;
    const rows = bed.rows || 2;
    const cap  = cols * rows;
    const cells = bed.cells || {};
    const filledCount = Object.keys(cells).length;
    const t = BED_TYPES[bed.type || 'raised'];

    // Build inline cell grid
    let gridCells = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key  = `${c}-${r}`;
        const name = cells[key];
        if (name) {
          const cd  = cropData[name];
          const st  = getGardenStatus(name)?.type || 'saved';
          const stageIcon = (() => {
            const stage = getGardenStatus(name)?.stage?.stage;
            return { germinating:'🌱', seedling:'🪴', growing:'🌿', maturing:'🌸', ready:'🌾' }[stage] || '';
          })();
          gridCells += `<div class="bgv-cell bgv-cell--filled bgv-cell--${st}"
            data-col="${c}" data-row="${r}" data-bed="${bedId}" title="${name}">
            <span class="bgv-cell-emoji">${cd?.emoji || '🌱'}</span>
            <span class="bgv-cell-label">${name.split(' ')[0]}</span>
            ${stageIcon ? `<span class="bgv-cell-stage">${stageIcon}</span>` : ''}
          </div>`;
        } else {
          gridCells += `<div class="bgv-cell bgv-cell--empty"
            data-col="${c}" data-row="${r}" data-bed="${bedId}" title="Tap to assign crop">
            <span class="bgv-cell-plus">+</span>
          </div>`;
        }
      }
    }

    return `<div class="gvb-card" style="border-color:${bed.color}55">
      <div class="gvb-card-header" style="background:${bed.color}18">
        <span class="gvb-bed-icon">${bed.emoji}</span>
        <div class="gvb-bed-info">
          <span class="gvb-bed-name">${bed.name.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</span>
          <span class="gvb-bed-meta">${t?.label || 'Bed'} · ${filledCount}/${cap} cells filled</span>
        </div>
        <button class="gvb-map-btn" data-bed="${bedId}" title="Open in map">📐</button>
      </div>
      <div class="bgv-grid-wrap">
        <div class="bgv-grid" style="--bgv-cols:${cols}">${gridCells}</div>
      </div>
    </div>`;
  }).join('');
}

function wireGardenViewToggle() {
  document.getElementById('gvt-crop')?.addEventListener('click', () => {
    gardenViewMode = 'crop'; localStorage.setItem('pzf-garden-view', 'crop'); renderGardenTab();
  });
  document.getElementById('gvt-bed')?.addEventListener('click', () => {
    gardenViewMode = 'bed'; localStorage.setItem('pzf-garden-view', 'bed'); renderGardenTab();
  });
  document.getElementById('gvb-open-map')?.addEventListener('click', openGardenMap);
  document.querySelectorAll('.gvb-map-btn[data-bed]').forEach(btn => {
    btn.addEventListener('click', () => { openGardenMap(); setTimeout(() => selectMapBed(btn.dataset.bed), 100); });
  });
  // Phase 132: tap cells to assign crops
  document.querySelectorAll('.bgv-cell[data-bed]').forEach(cell => {
    cell.addEventListener('click', () => {
      const { bed, col, row } = cell.dataset;
      const existing = gardenBeds[bed]?.cells?.[`${col}-${row}`] || null;
      openBedCropPicker(bed, parseInt(col), parseInt(row), existing);
    });
  });
}

function renderGardenTab() {
  const list = document.getElementById('garden-list');
  const emptyMsg = document.getElementById('garden-empty-msg');
  if (!list) return;
  const names = Object.keys(myGarden);

  if (!features.beds && gardenViewMode === 'bed') gardenViewMode = 'crop';

  const toggle = `<div class="garden-view-toggle">
    <button class="gvt-btn${gardenViewMode === 'crop' ? ' gvt-btn--active' : ''}" id="gvt-crop">🌿 By Crop</button>
    ${features.beds ? `<button class="gvt-btn${gardenViewMode === 'bed' ? ' gvt-btn--active' : ''}" id="gvt-bed">🛏 By Bed</button>` : ''}
  </div>`;

  if (gardenViewMode === 'bed') {
    list.innerHTML = toggle + renderGardenByBed();
    if (emptyMsg) emptyMsg.hidden = true;
    const bedsEl = document.getElementById('garden-beds');
    if (bedsEl) bedsEl.hidden = true;
    wireGardenViewToggle();
    renderTodayDashboard(); renderSetupCard(); renderGardenDashboard(); renderActivityHeatmap(); renderGardenDiversity(); renderRotationAdvisor(); renderGardenTasks(); renderGardenChecklist(); renderGardenStats();
    renderCompanionMatrix(); renderGrowingTimeline(); renderGardenGantt(); renderGardenFooter();
    renderSeasonSummaryPrompt(); renderGardenHistory(); renderGrowNext(); renderPlanSection(); renderHarvestAnalytics();
    renderHarvestValue(); renderYieldLogger();
    renderWateringSchedule(); renderWateringIntelligence(); renderHarvestToTable(); renderGardenHealthScore();
    renderSmartShoppingList(); checkAchievements();
    return;
  }

  const bedsEl = document.getElementById('garden-beds');
  if (bedsEl) bedsEl.hidden = false;

  if (!names.length) {
    list.innerHTML = toggle;
    if (emptyMsg) {
      emptyMsg.hidden = false;
      emptyMsg.innerHTML = `<div class="empty-hero">
        <div class="empty-hero-emoji">🌱</div>
        <div class="empty-hero-title">Your garden is empty</div>
        <p class="empty-hero-body">Head to <strong>This Month</strong> to browse crops and add them to your garden.</p>
        <button class="empty-hero-cta" id="empty-goto-calendar">Browse Crops →</button>
      </div>`;
      document.getElementById('empty-goto-calendar')?.addEventListener('click', () =>
        document.querySelector('.ptab[data-tab="calendar"]')?.click()
      );
    }
    wireGardenViewToggle(); renderSetupCard(); renderGardenBeds(); renderCompanionMatrix(); renderGardenHistory(); renderPlanSection(); renderGardenHealthScore(); return;
  }
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
        (features.seeds && entry.hasSeeds) ? '<span class="gi-badge gi-badge--seeds" title="Have seeds">🌰</span>' : '',
        (entry.harvestLog?.length) ? `<span class="gi-badge gi-badge--harvests" title="${entry.harvestLog.length} harvest(s) logged">🌾×${entry.harvestLog.length}</span>` : '',
        entry.notes ? '<span class="gi-badge" title="Has notes">📝</span>' : '',
        entry.reminder ? `<span class="gi-badge gi-badge--reminder" title="Reminder: ${entry.reminder}">${reminderDue ? '🔔' : '⏰'}</span>` : '',
        entry.rating ? renderStars(entry.rating, name, true) : '',
        (entry.problems?.some(p => !p.resolved)) ? '<span class="gi-badge gi-badge--problem" title="Active problem logged">\uD83D\uDC1B</span>' : '',
      ].join('');
      html += `<div class="garden-item garden-item--${type}" data-crop="${name}">
        <div class="garden-item-main">
          <span class="garden-item-emoji">${c?.emoji || '🌱'}</span>
          <div class="garden-item-info">
            <span class="garden-item-name">${name}${badges}</span>
            <span class="garden-item-status">${status?.label || ''}</span>
            ${(entry.bedIds || []).filter(bid => gardenBeds[bid]).map(bid => `<span class="garden-item-bed-tag">${gardenBeds[bid].emoji} ${gardenBeds[bid].name}</span>`).join('')}
            ${entry.harvestLog?.length ? `<span class="garden-last-harvest">🌾 Last harvest: ${entry.harvestLog[0].date}</span>` : ''}
            ${(() => { const ws = getWaterStatus(name); if (!ws || ws.type === 'unknown') return ''; const cls = ws.type === 'dry' ? 'water-badge--dry' : ws.type === 'rain' ? 'water-badge--rain' : ws.type === 'fresh' ? 'water-badge--fresh' : ''; return `<span class="water-badge ${cls}">${ws.label}</span>`; })()}
            ${features.succession ? (() => { const nd = getNextSuccessionDate(name); if (!nd) return ''; const diff = Math.round((nd - new Date().setHours(0,0,0,0) + 0) / 86400000); if (diff > 14) return ''; return diff <= 0 ? '<span class="garden-sow-badge garden-sow-badge--due">🔄 Sow now</span>' : `<span class="garden-sow-badge">🔄 Sow in ${diff}d</span>`; })() : ''}
            ${status?.stage ? `
            <div class="growth-bar-wrap" title="${status.stage.label}">
              <div class="growth-bar-fill growth-bar--${status.stage.stage}" style="width:${Math.min(100,Math.round(status.stage.pct*100))}%"></div>
            </div>
            <div class="growth-stage-row"><span class="growth-stage-icon">${status.stage.icon}</span>${status.stage.label}</div>
            ${(() => { const t = getStageTip(name, status.stage.stage); return t ? `<div class="growth-stage-tip">${t}</div>` : ''; })()}` : ''}
          </div>
        </div>
        <div class="garden-item-actions">
          ${features.harvestTracking && (type === 'ready' || type === 'growing') && plantedVal ? `<button class="garden-harvest-btn" data-crop="${name}" title="Log a harvest">🌾</button>` : ''}
          ${entry.planted ? `<button class="garden-water-btn" data-crop="${name}" title="Log watering">💧</button>` : ''}
          ${!plantedVal ? `<button class="garden-log-btn" data-crop="${name}">Log date</button>` : ''}
          <input type="date" class="garden-date-input" data-crop="${name}" value="${plantedVal}" max="${today}" aria-label="Planting date for ${name}"${!plantedVal ? ' style="display:none"' : ''}>
          <button class="garden-remove-btn" data-crop="${name}" aria-label="Remove ${name}">×</button>
        </div>
      </div>`;
    }
  }
  list.innerHTML = toggle + html;
  wireGardenViewToggle();
  renderSetupCard();
  renderTodayDashboard();
  renderGardenDashboard();
  renderActivityHeatmap();
  renderGardenDiversity();
  renderRotationAdvisor();
  renderGardenTasks();
  renderGardenChecklist();
  renderGardenBeds();
  renderCompanionMatrix();
  renderGardenStats();
  renderGrowingTimeline();
  renderGardenGantt();
  renderGardenFooter();
  renderSeasonSummaryPrompt();
  renderGardenHistory();
  renderGrowNext();
  renderPlanSection();
  renderHarvestAnalytics();
  renderHarvestValue();
  renderYieldLogger();
  renderWateringSchedule();
  renderWateringIntelligence();
  renderHarvestToTable();
  renderGardenHealthScore();
  renderSmartShoppingList();
  checkAchievements();
  // Feature-flag: hide seeds subtab button
  const seedsTabBtn = document.querySelector('[data-subtab="seeds"]');
  if (seedsTabBtn) seedsTabBtn.hidden = !features.seeds;
}

// ── Phase 46: Garden share card ──────────────────
async function generateGardenShareCard() {
  const canvas = document.createElement('canvas');
  canvas.width  = 800;
  canvas.height = 440;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0a0f1a';
  ctx.fillRect(0, 0, 800, 440);
  const glow = ctx.createRadialGradient(160, 440, 0, 160, 440, 520);
  glow.addColorStop(0, 'rgba(34,197,94,0.12)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, 800, 440);

  const font = 'system-ui,-apple-system,sans-serif';

  // Zone badge
  const zoneLabel = selectedZone ? `Zone ${getZoneDisplayLabel(selectedZone)}` : '';
  if (zoneLabel) {
    ctx.fillStyle = 'rgba(120,200,122,0.15)';
    const bw = zoneLabel.length * 9 + 24;
    ctx.beginPath(); ctx.roundRect(40, 30, bw, 30, 15); ctx.fill();
    ctx.fillStyle = '#78c87a'; ctx.font = `bold 14px ${font}`;
    ctx.fillText(zoneLabel, 52, 50);
  }
  if (selectedLocationName) {
    ctx.fillStyle = '#9ca3af'; ctx.font = `14px ${font}`;
    ctx.fillText(selectedLocationName, 40, 88);
  }
  const titleY = selectedLocationName ? 130 : 108;
  ctx.fillStyle = '#f9fafb'; ctx.font = `bold 36px ${font}`;
  ctx.fillText('My Garden', 40, titleY);
  const season = getSeasonForMonth(currentMonth);
  const SLABELS = { spring:'🌸 Spring', summer:'☀️ Summer', autumn:'🍂 Autumn', winter:'❄️ Winter' };
  ctx.fillStyle = '#6b7280'; ctx.font = `14px ${font}`;
  ctx.fillText(`${MONTH_NAMES[currentMonth]} · ${SLABELS[season] || ''}`, 40, titleY + 26);

  // Crop emojis
  const names = Object.keys(myGarden);
  ctx.font = `28px serif`;
  const cols = Math.min(14, names.length);
  for (let i = 0; i < Math.min(names.length, 28); i++) {
    const emoji = cropData?.[names[i]]?.emoji || '🌱';
    ctx.fillText(emoji, 40 + (i % cols) * 50, titleY + 68 + Math.floor(i / cols) * 44);
  }

  // Stats
  const growing = names.filter(n => myGarden[n]?.planted && getGardenStatus(n)?.type !== 'ready').length;
  const ready   = names.filter(n => getGardenStatus(n)?.type === 'ready').length;
  const parts   = [`${names.length} crops`, growing > 0 ? `${growing} growing` : '', ready > 0 ? `${ready} ready` : ''].filter(Boolean).join('  ·  ');
  ctx.fillStyle = '#6b7280'; ctx.font = `13px ${font}`;
  ctx.fillText(parts, 40, 372);

  // Footer rule + branding
  ctx.strokeStyle = 'rgba(55,65,81,0.7)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, 386); ctx.lineTo(760, 386); ctx.stroke();
  ctx.fillStyle = '#78c87a'; ctx.font = `bold 12px ${font}`;
  ctx.fillText('Plant Zone Finder', 40, 412);
  ctx.fillStyle = '#374151'; ctx.font = `12px ${font}`;
  ctx.fillText('djamies1.github.io/garden-zones', 195, 412);

  return canvas;
}

async function shareGardenCard() {
  if (!Object.keys(myGarden).length) { showToast('Add crops to your garden first', 'info'); return; }
  showToast('Generating card…', 'info');
  try {
    const canvas = await generateGardenShareCard();
    canvas.toBlob(async blob => {
      if (!blob) { showToast('Could not generate card', 'error'); return; }
      const file = new File([blob], 'my-garden.png', { type: 'image/png' });
      const canShareFile = navigator.canShare?.({ files: [file] });
      if (navigator.share && (window.Capacitor?.isNativePlatform?.() || canShareFile)) {
        try { await navigator.share({ title: 'My Garden — Plant Zone Finder', files: [file] }); return; }
        catch (e) { if (e.name === 'AbortError') return; }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'my-garden.png'; a.click();
      URL.revokeObjectURL(url);
      showToast('Garden card saved ✓', 'success');
    }, 'image/png');
  } catch { showToast('Could not generate card', 'error'); }
}

function renderGardenFooter() {
  const footer = document.getElementById('garden-footer');
  if (!footer) return;
  const hasCrops = Object.keys(myGarden).length > 0;
  if (!hasCrops) { footer.innerHTML = ''; return; }

  // Shopping list = crops without seeds
  const thisYear = new Date().getFullYear();
  const needSeeds = Object.keys(myGarden).filter(n => !myGarden[n].hasSeeds);
  // Seeds with expiry warnings (have seeds but expired/expiring this year)
  const expiredSeeds = Object.keys(myGarden).filter(n => {
    const yr = myGarden[n]?.seedInfo?.expiryYear;
    return myGarden[n].hasSeeds && yr && yr <= thisYear;
  });
  const shoppingHTML = (needSeeds.length || expiredSeeds.length) ? `
    <div class="shopping-list-section">
      <div class="shopping-list-header">
        🛒 Seeds to buy / check
        <button class="shopping-copy-btn" id="shopping-copy-btn">Copy</button>
      </div>
      <div class="shopping-list-items">
        ${needSeeds.map(n => `<span class="shopping-chip">${cropData[n]?.emoji || '🌱'} ${n}</span>`).join('')}
        ${expiredSeeds.map(n => {
          const yr = myGarden[n].seedInfo.expiryYear;
          const label = yr < thisYear ? `${n} (expired ${yr})` : `${n} (expiring ${yr})`;
          return `<span class="shopping-chip shopping-chip--warn">⚠️ ${label}</span>`;
        }).join('')}
      </div>
    </div>` : '';

  const totalPhotos = Object.values(myGarden).reduce((n, e) => n + (e.photos?.length || 0), 0);
  const photoBtnHtml = totalPhotos > 0
    ? `<button class="garden-action-btn" id="garden-gallery-btn">📸 Photos${totalPhotos > 0 ? ` (${totalPhotos})` : ''}</button>`
    : '';

  footer.innerHTML = `
    <div class="garden-actions-row">
      <button class="garden-action-btn" id="garden-share-card-btn" title="Share a garden summary image">📤 Share</button>
      ${photoBtnHtml}
      <button class="garden-action-btn" id="garden-export-btn">⬇ Backup</button>
      <button class="garden-action-btn" id="garden-import-btn">⬆ Restore</button>
      <input type="file" id="garden-import-input" accept=".json">
    </div>
    ${shoppingHTML}`;

  footer.querySelector('#garden-share-card-btn')?.addEventListener('click', shareGardenCard);
  footer.querySelector('#garden-gallery-btn')?.addEventListener('click', openGardenGallery);
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
    const inPlan = Object.values(myPlan).some(yr => yr[name]);
    bar.className = 'bar-add';
    bar.innerHTML = `<button class="modal-garden-btn" id="modal-garden-add">☆ Add to My Garden</button>
      <button class="modal-plan-btn${inPlan ? ' modal-plan-btn--active' : ''}" id="modal-plan-btn">${inPlan ? '📋 Planned' : '📋 Plan'}</button>`;
    bar.querySelector('#modal-garden-add').addEventListener('click', () => {
      gardenAdd(name);
      if (_mapPendingBed) {
        addCropToBed(name, _mapPendingBed);
        _mapPendingBed = null;
      }
      renderModalGardenBar(name);
    });
    bar.querySelector('#modal-plan-btn').addEventListener('click', () => {
      if (inPlan) { removeFromPlan(name, new Date().getFullYear()+1); renderModalGardenBar(name); }
      else { addToPlan(name, new Date().getFullYear()+1, [], ''); renderModalGardenBar(name); }
    });
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
        ${hasSeeds ? (() => {
          const si = myGarden[name]?.seedInfo || {};
          const thisYear = new Date().getFullYear();
          const expired = si.expiryYear && si.expiryYear < thisYear;
          const expiringSoon = si.expiryYear && si.expiryYear === thisYear;
          return `<div class="modal-seed-details">
            <input type="text" id="modal-seed-variety" class="modal-seed-input" placeholder="Variety" value="${si.variety || ''}" maxlength="40">
            <input type="number" id="modal-seed-qty" class="modal-seed-input modal-seed-qty" placeholder="Pkts" min="0" step="1" value="${si.qty || ''}">
            <input type="number" id="modal-seed-expiry" class="modal-seed-input modal-seed-expiry${expired ? ' seed-expired' : expiringSoon ? ' seed-expiring' : ''}" placeholder="Yr" min="2020" max="2040" value="${si.expiryYear || ''}" title="Sow-by year">
          </div>`;
        })() : ''}
        <label class="modal-garden-reminder-label">🔔
          <input type="date" id="modal-reminder-input" value="${reminderVal}" min="${today}" aria-label="Reminder date">
        </label>
        ${Object.keys(gardenBeds).length ? `<select class="modal-bed-select" id="modal-bed-select" aria-label="Assign to bed">
          <option value="">📍 No bed</option>
          ${Object.entries(gardenBeds).map(([id, b]) =>
            `<option value="${id}"${myGarden[name]?.bedIds?.[0] === id || _mapPendingBed === id ? ' selected' : ''}>${b.emoji} ${b.name}</option>`
          ).join('')}
        </select>` : ''}
      </div>`;
    bar.querySelector('#modal-planted-input').addEventListener('change', e => gardenSetPlanted(name, e.target.value));
    bar.querySelector('#modal-garden-remove').addEventListener('click', () => gardenRemove(name));
    bar.querySelector('#modal-seeds-check').addEventListener('change', e => {
      if (myGarden[name]) {
        myGarden[name].hasSeeds = e.target.checked;
        saveGarden();
        renderModalGardenBar(name); // re-render to show/hide seed detail fields
        if (currentPanelTab === 'garden') renderGardenTab();
      }
    });
    bar.querySelector('#modal-seed-variety')?.addEventListener('change', e => gardenUpdateSeedInfo(name, 'variety', e.target.value.trim()));
    bar.querySelector('#modal-seed-qty')?.addEventListener('change', e => gardenUpdateSeedInfo(name, 'qty', parseInt(e.target.value, 10) || ''));
    bar.querySelector('#modal-seed-expiry')?.addEventListener('change', e => { gardenUpdateSeedInfo(name, 'expiryYear', parseInt(e.target.value, 10) || ''); renderModalGardenBar(name); });
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

  // Phase 71: Compare button (always shown)
  const compareBtn = document.createElement('button');
  compareBtn.className = 'modal-compare-btn' + (_compareA && _compareA !== name ? ' modal-compare-btn--ready' : '');
  compareBtn.textContent = _compareA === name ? '⚖ Clear' : (_compareA ? `⚖ vs ${_compareA}` : '⚖ Compare');
  compareBtn.title = _compareA ? `Compare ${name} with ${_compareA}` : 'Select this crop for side-by-side comparison';
  compareBtn.addEventListener('click', () => { toggleCropCompare(name); renderModalGardenBar(name); });
  bar.appendChild(compareBtn);
}

function initGarden() {
  loadGarden();
  loadHistory();
  loadXP();
  updateGardenBadge();
  checkReminders();

  loadSeeds();
  loadRotation();
  loadPlan();
  loadVarieties();
  loadFeatures();

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
    const fab = document.getElementById('garden-fab');
    if (fab) fab.hidden = (currentPanelTab !== 'garden');
    haptic(3);
    syncBottomNavToPanel();
  });

  // Seeds sub-tab in garden
  document.getElementById('tab-garden')?.addEventListener('click', e => {
    const seedTab = e.target.closest('[data-subtab]');
    if (!seedTab) return;
    const sub = seedTab.dataset.subtab;
    document.querySelectorAll('[data-subtab]').forEach(t => t.classList.toggle('active', t === seedTab));
    document.getElementById('subtab-main').hidden  = (sub !== 'main');
    document.getElementById('subtab-seeds').hidden = (sub !== 'seeds');
    if (sub === 'seeds') renderSeedInventory();
  });

  // FAB button
  document.getElementById('garden-fab')?.addEventListener('click', () => openFAB());
  document.getElementById('fab-sheet-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('fab-sheet-overlay')) closeFAB();
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
    if (e.target.closest('.garden-water-btn')) {
      const name = e.target.closest('.garden-water-btn').dataset.crop;
      logWatering(name);
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
    persistWeatherCache(key);
  } catch {
    // Offline — show toast only if we had no cached data to fall back on
    if (!weatherData && !navigator.onLine) showToast('📡 No weather data — you\'re offline', 'info');
  }
}

// ── Weather persistence (survives page reload) ────
function persistWeatherCache(key) {
  if (!key || !weatherData) return;
  try { localStorage.setItem('pzf-weather', JSON.stringify({ key, data: weatherData, ts: Date.now() })); } catch {}
}

function loadPersistedWeather() {
  try {
    const s = JSON.parse(localStorage.getItem('pzf-weather') || 'null');
    if (s?.key && s?.data && Date.now() - s.ts < 7200000) { // 2h max age
      weatherCache[s.key] = { data: s.data, ts: s.ts };
    }
  } catch {}
}

async function fetchWeatherAndUpdate() {
  if (!selectedLat || !selectedLng) return;
  await fetchWeather(selectedLat, selectedLng);
  renderWeatherStrip();
  renderPlantingForecast();
  renderFrostAlertBanner();
  renderWateringAlert();
  renderThisWeek();
  renderDailyBrief();
  renderWateringSchedule();
  renderWateringIntelligence();
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
    const precPct = Math.min(100, Math.round((prec / 1.2) * 100));
    return `<div class="wx-day">
      <span class="wx-day-name">${lbl}</span>
      <span class="wx-day-icon">${getWmoIcon(d.weather_code[idx])}</span>
      <span class="wx-day-temp">${hi}<span class="wx-day-lo">/${lo}</span></span>
      <div class="wx-prec-bar"><div class="wx-prec-fill" style="width:${precPct}%"></div></div>
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
  const forecastEl = document.getElementById('weather-forecast-7day');
  if (forecastEl && weatherData?.daily) render7DayForecast(weatherData.daily, forecastEl, useMetric);
}

// ── Phase 21: Planting Day Forecast ──────────────
// scorePlantingDay moved to features/weather.js

function renderPlantingForecast() {
  const el = document.getElementById('planting-forecast');
  if (!el) return;
  if (!features.weatherForecast) { el.hidden = true; return; }
  if (!weatherData?.daily?.temperature_2m_max || !selectedZone) { el.hidden = true; return; }

  const d = weatherData.daily;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayIdx = Math.max(0, d.time.findIndex(t => t === todayStr));
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const fmt = f => useMetric ? `${Math.round((f - 32) * 5 / 9)}°` : `${Math.round(f)}°`;

  const days = d.time.slice(todayIdx, todayIdx + 7).map((date, i) => {
    const idx   = todayIdx + i;
    const hi    = d.temperature_2m_max[idx];
    const lo    = d.temperature_2m_min[idx];
    const prec  = d.precipitation_sum[idx] || 0;
    const wmo   = d.weather_code[idx];
    const score = scorePlantingDay(hi, lo, prec, wmo);
    const lbl   = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : DAYS[new Date(date + 'T12:00:00').getDay()];
    return { lbl, hi, lo, wmo, score };
  });

  const bestScore = Math.max(...days.map(d => d.score));
  const bestIdx   = days.findIndex(d => d.score === bestScore);

  const ratingLabel = s => s >= 80 ? 'Great' : s >= 60 ? 'Good' : s >= 40 ? 'Fair' : s >= 20 ? 'Poor' : 'Bad';
  const ratingClass = s => s >= 80 ? 'pf--great' : s >= 60 ? 'pf--good' : s >= 40 ? 'pf--fair' : s >= 20 ? 'pf--poor' : 'pf--bad';

  const cards = days.map((day, i) => `
    <div class="pf-day${i === bestIdx && bestScore >= 40 ? ' pf-day--best' : ''}">
      ${i === bestIdx && bestScore >= 40 ? '<span class="pf-best-tag">\u2605 Best</span>' : ''}
      <span class="pf-day-name">${day.lbl}</span>
      <span class="pf-icon">${getWmoIcon(day.wmo)}</span>
      <span class="pf-temp">${fmt(day.hi)}/${fmt(day.lo)}</span>
      <span class="pf-badge ${ratingClass(day.score)}">${ratingLabel(day.score)}</span>
    </div>`).join('');

  el.innerHTML = `
    <div class="pf-header"><span class="pf-title">\uD83C\uDF31 Best days to plant this week</span></div>
    <div class="pf-strip">${cards}</div>`;
  el.hidden = false;
}

function renderFrostAlertBanner() {
  const el = document.getElementById('frost-alert-banner');
  if (!el) return;
  if (!features.weatherForecast) { el.hidden = true; return; }
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

  // 3. Open pest/problem alerts
  const openProblems = Object.entries(myGarden)
    .filter(([, e]) => e.problems?.some(p => !p.resolved))
    .map(([n]) => n);
  if (openProblems.length) {
    const ns = openProblems.slice(0, 2).join(', ') + (openProblems.length > 2 ? ` +${openProblems.length - 2}` : '');
    items.push({ icon: '\uD83D\uDC1B', text: `Active problem logged on ${ns} — check crop details`, type: 'action' });
  }

  // 4. Watering nudge for seedlings in dry spell
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

  // 5. Planting window from frost calendar
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

  // 5b. Overdue watering (Phase 82 enhancement)
  if (items.length < 4) {
    const WATER_INTERVALS = { Easy: 5, Moderate: 4, Hard: 3 };
    const overdue = Object.keys(myGarden).filter(n => {
      const entry = myGarden[n];
      if (!entry?.planted) return false;
      const lastW = entry.waterLog?.[0]?.date;
      if (!lastW) return false;
      const daysSince = Math.round((today - new Date(lastW + 'T00:00:00')) / 86400000);
      const interval = WATER_INTERVALS[cropData[n]?.difficulty] || 4;
      return daysSince >= interval;
    });
    if (overdue.length) {
      const ns = overdue.slice(0,2).join(' & ') + (overdue.length > 2 ? ` +${overdue.length-2}` : '');
      items.push({ icon: '💧', text: `Watering overdue: ${ns}`, type: 'action' });
    }
  }

  // 6. Prompt to add crops if garden empty
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
  const isFirst = myGarden[name].harvestLog.length === 0;
  myGarden[name].harvestLog.unshift({
    date,
    notes: (notes || '').trim(),
    qty: qty || null,
    unit: unit || null,
  });
  saveGarden();
  refreshGardenUI(name);
  if (isFirst) {
    const qtyStr = qty ? ` (${qty}${unit ? ' ' + unit : ''})` : '';
    autoMilestone(`First harvest of ${name}${qtyStr}!`, name, 'harvest');
    earnXP(50, `First harvest of ${name}`);
  } else {
    earnXP(20, `Harvested ${name}`);
  }
  updateStreak();
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
    maybeRequestReview();
    setTimeout(() => showHarvestRecipes(name), 600);
  });

  // Succession section
  renderSuccessionSection(name);
  // Phase 58: Hardening off
  renderHardeningSection(name);
  // Phase 134: Care actions
  renderCareSection(name);
  // Phase 22: Problems
  renderModalProblems(name);
  // Phase 44: Photos
  renderCropPhotoSection(name);
}

// ── Phase 44: Per-crop photo log ─────────────────

function resizeImageToThumb(file, maxPx = 400) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width  * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function addCropPhoto(name, file) {
  if (!myGarden[name] || !file) return;
  try {
    const thumb = await resizeImageToThumb(file);
    if (!myGarden[name].photos) myGarden[name].photos = [];
    myGarden[name].photos.unshift({
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      thumb,
    });
    // Keep max 12 photos per crop
    myGarden[name].photos = myGarden[name].photos.slice(0, 12);
    saveGarden();
    renderCropPhotoSection(name);
    haptic(5);
    earnXP(8, `Photo of ${name}`);
    updateStreak();
  } catch { showToast('Could not add photo', 'error'); }
}

function deleteCropPhoto(name, id) {
  if (!myGarden[name]?.photos) return;
  myGarden[name].photos = myGarden[name].photos.filter(p => p.id !== id);
  saveGarden();
  renderCropPhotoSection(name);
}

function renderCropPhotoSection(name) {
  const body = document.getElementById('modal-body');
  if (!body || !isInGarden(name)) return;
  body.querySelector('.modal-photo-section')?.remove();

  // Photos sorted oldest → newest for timeline
  const photos = [...(myGarden[name]?.photos || [])].sort((a, b) => a.date.localeCompare(b.date));
  const planted = myGarden[name]?.planted;
  const harvestMin = parseHarvestDays(cropData[name]?.days);

  const getStageAt = dateStr => {
    if (!planted || !harvestMin) return null;
    const days = Math.round((new Date(dateStr + 'T00:00:00') - new Date(planted + 'T00:00:00')) / 86400000);
    return getGrowthStage(days, harvestMin);
  };

  const sec = document.createElement('div');
  sec.className = 'modal-section modal-photo-section';

  const timelineHtml = photos.length ? `
    <div class="cpt-timeline">
      ${photos.map((p, i) => {
        const stage = getStageAt(p.date);
        const isLast = i === photos.length - 1;
        return `<div class="cpt-frame${isLast ? ' cpt-frame--latest' : ''}">
          <div class="cpt-img-wrap" data-thumb="${p.thumb}">
            <img src="${p.thumb}" alt="${p.date}" loading="lazy" class="cpt-img">
            ${stage ? `<span class="cpt-stage-badge">${stage.icon}</span>` : ''}
            ${isLast ? `<span class="cpt-latest-badge">Latest</span>` : ''}
          </div>
          <span class="cpt-date">${p.date}</span>
          <button class="cpt-del" data-id="${p.id}" aria-label="Delete">×</button>
        </div>`;
      }).join('')}
      <div class="cpt-add-frame">
        <label class="cpt-add-label" title="Add photo">
          <span class="cpt-add-icon">+</span>
          <span class="cpt-add-txt">Add</span>
          <input type="file" class="crop-photo-input" accept="image/*" capture="environment" style="display:none">
        </label>
      </div>
    </div>` : `
    <div class="cpt-empty">
      <label class="cpt-empty-label">
        <span>📷 No photos yet — tap to add your first</span>
        <input type="file" class="crop-photo-input" accept="image/*" capture="environment" style="display:none">
      </label>
    </div>`;

  sec.innerHTML = `
    <div class="modal-section-title">
      ${photos.length >= 2 ? `📽 ${cropData[name]?.emoji || '🌱'} Journey (${photos.length} photos)` : '📷 Garden Photos'}
    </div>
    ${timelineHtml}`;

  body.appendChild(sec);

  sec.querySelectorAll('.crop-photo-input').forEach(inp => {
    inp.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (file) { e.target.value = ''; await addCropPhoto(name, file); }
    });
  });
  sec.querySelectorAll('.cpt-del').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); deleteCropPhoto(name, parseInt(btn.dataset.id, 10)); });
  });
  sec.querySelectorAll('.cpt-img').forEach(img => {
    img.addEventListener('click', () => {
      const lb = document.getElementById('photo-lightbox');
      const lbImg = document.getElementById('photo-lightbox-img');
      if (lb && lbImg) { lbImg.src = img.src; lb.hidden = false; }
    });
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


// ── Onboarding ──────────────────────────────────
function initOnboarding() {
  if (localStorage.getItem('pzf-onboarded')) return;
  const overlay = document.getElementById('onboarding');
  if (!overlay) return;
  overlay.hidden = false;
  let step = 0;
  let selectedLevel = '';
  let selectedStarterCrops = new Set();

  function finish() {
    // Add any selected starter crops to garden
    if (selectedStarterCrops.size) {
      selectedStarterCrops.forEach(name => { if (!myGarden[name]) gardenAdd(name); });
      if (currentPanelTab === 'garden') renderGardenTab();
    }
    overlay.hidden = true;
    localStorage.setItem('pzf-onboarded', '1');
    if (selectedStarterCrops.size) {
      showToast(`${selectedStarterCrops.size} crops added to My Garden 🌿`, 'success');
    }
  }

  function goTo(n) {
    const steps = overlay.querySelectorAll('.ob-step');
    if (n >= steps.length) { finish(); return; }
    step = n;
    steps.forEach((s, i) => s.classList.toggle('active', i === n));
    overlay.querySelectorAll('.ob-dot').forEach((d, i) => d.classList.toggle('active', i === n));
    // Populate crop grid when entering step 2
    if (n === 2) populateObCropGrid();
  }

  function populateObCropGrid() {
    const grid = document.getElementById('ob-crop-grid');
    if (!grid || !cropData) return;
    // Pick crops by difficulty level
    const diffMap = { beginner: 'Easy', intermediate: 'Moderate', experienced: null };
    const diff = diffMap[selectedLevel];
    const season = getSeasonForMonth(currentMonth);
    const seasonCrops = { spring: ['Tomatoes','Basil','Lettuce','Radishes','Peas','Kale','Spinach','Carrots','Beans','Cucumbers','Herbs'],
      summer: ['Tomatoes','Cucumbers','Basil','Beans','Zucchini','Peppers','Corn','Squash','Melons'],
      autumn: ['Kale','Broccoli','Cabbage','Lettuce','Carrots','Beets','Garlic','Spinach','Onions'],
      winter: ['Kale','Garlic','Onions','Spinach','Broad Beans','Peas'] }[season] || [];

    const pool = Object.keys(cropData).filter(name => {
      const c = cropData[name];
      if (diff && c.difficulty !== diff) return false;
      return true;
    });
    // Prioritise season-relevant crops, then fill to 12
    const prioritised = [...new Set([...seasonCrops.filter(n => pool.includes(n)), ...pool])].slice(0, 12);

    grid.innerHTML = prioritised.map(name => {
      const c = cropData[name];
      return `<button class="ob-crop-btn" data-name="${name}">
        <span class="ob-crop-emoji">${c.emoji || '🌱'}</span>
        <span class="ob-crop-name">${name}</span>
        ${c.difficulty ? `<span class="ob-crop-diff ob-diff--${(c.difficulty||'').toLowerCase()}">${c.difficulty}</span>` : ''}
      </button>`;
    }).join('');

    grid.querySelectorAll('.ob-crop-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.name;
        if (selectedStarterCrops.has(name)) { selectedStarterCrops.delete(name); btn.classList.remove('selected'); }
        else { selectedStarterCrops.add(name); btn.classList.add('selected'); }
        const count = selectedStarterCrops.size;
        const countEl = document.getElementById('ob-selected-count');
        if (countEl) countEl.textContent = count === 0 ? '0 selected' : `${count} selected`;
      });
    });
  }

  // Level picker
  overlay.querySelectorAll('.ob-level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedLevel = btn.dataset.level;
      overlay.querySelectorAll('.ob-level-btn').forEach(b => b.classList.toggle('active', b === btn));
      const nextBtn = document.getElementById('ob-level-next');
      if (nextBtn) nextBtn.disabled = false;
    });
  });

  overlay.querySelectorAll('.ob-next').forEach(btn => btn.addEventListener('click', () => goTo(step + 1)));
  overlay.querySelectorAll('.ob-dot').forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));
  overlay.querySelectorAll('.ob-skip, .ob-finish').forEach(btn => btn.addEventListener('click', finish));
  overlay.querySelector('.ob-notif-btn')?.addEventListener('click', async () => {
    await requestNotifPermission();
    finish();
  });
}

// ── Keyboard shortcuts ──────────────────────────
let _shortcutsPrev = null;
function openShortcutsModal() {
  _shortcutsPrev = document.activeElement;
  const sm = document.getElementById('shortcuts-modal');
  if (!sm) return;
  sm.showModal();
  trapFocus(sm);
  sm.addEventListener('close', () => { _shortcutsPrev?.focus(); _shortcutsPrev = null; }, { once: true });
}

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
        openShortcutsModal();
        break;
    }
  });
  const sm = document.getElementById('shortcuts-modal');
  if (sm) {
    document.getElementById('shortcuts-close')?.addEventListener('click', () => sm.close());
    sm.addEventListener('click', e => { if (e.target === sm) sm.close(); });
  }
  document.getElementById('help-btn')?.addEventListener('click', openShortcutsModal);
}

const toastQueue = [];
function showToast(msg, type) {
  toastQueue.push({ msg, type });
  _flushToastQueue();
}
function _flushToastQueue() {
  // Remove toasts beyond cap of 3
  const existing = [...document.querySelectorAll('.toast-item')];
  if (existing.length >= 3) return;
  if (!toastQueue.length) return;
  const { msg, type } = toastQueue.shift();
  const toast = document.createElement('div');
  toast.className = 'toast-item show';
  if (type) toast.classList.add(`toast--${type}`);
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');
  toast.textContent = msg;
  // Stack above bottom nav: offset by existing count
  const idx = document.querySelectorAll('.toast-item').length;
  toast.style.bottom = `calc(70px + ${idx} * 56px)`;
  document.body.appendChild(toast);
  announce(msg);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.remove(); _flushToastQueue(); }, 300);
  }, 3500);
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
// ── Phase 48: Succession sowing tracker ──────────
function getSuccessionInterval(name) {
  const c = cropData?.[name];
  if (!c) return null;
  if (c.succession_weeks) return c.succession_weeks * 7;
  const harvestDays = parseHarvestDays(c.days);
  if (!harvestDays) return null;
  return Math.min(28, Math.max(10, Math.round(harvestDays / 3)));
}

function getNextSuccessionDate(name) {
  const intervalDays = getSuccessionInterval(name);
  if (!intervalDays) return null;
  const batches  = myGarden[name]?.sowBatches || [];
  const lastSow  = batches.length ? batches[batches.length - 1] : myGarden[name]?.planted;
  if (!lastSow) return null;
  const d = new Date(lastSow + 'T00:00:00');
  d.setDate(d.getDate() + intervalDays);
  return d;
}

function logSuccessionBatch(name) {
  if (!myGarden[name]) return;
  const today = new Date().toISOString().slice(0, 10);
  if (!myGarden[name].sowBatches) myGarden[name].sowBatches = [];
  myGarden[name].sowBatches.push(today);
  if (!myGarden[name].planted) myGarden[name].planted = today;
  saveGarden();
  refreshGardenUI(name);
  haptic([5, 20, 5]);
  showToast('Sow batch logged ✓', 'success');
}

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
  const intervalDays = getSuccessionInterval(name);
  if (!result || !intervalDays) return;

  const ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmtDate = iso => { const d = new Date(iso + 'T00:00:00'); return `${ABBR[d.getMonth()]} ${d.getDate()}`; };

  // Logged batches
  const batches = myGarden[name]?.sowBatches || [];
  const batchesHTML = batches.length
    ? `<div class="succession-batches">
        ${batches.map((d, i) => `<span class="succession-batch-chip" title="Batch ${i+1}">🌱 Batch ${i+1} — ${fmtDate(d)}</span>`).join('')}
       </div>`
    : '';

  // Next sow countdown
  const nextDate = getNextSuccessionDate(name);
  const today    = new Date(); today.setHours(0,0,0,0);
  let nextLabel  = '';
  if (nextDate) {
    const diff = Math.round((nextDate - today) / 86400000);
    if (diff <= 0) nextLabel = `<div class="succession-next succession-next--due">🔄 Sow next batch now!</div>`;
    else nextLabel = `<div class="succession-next">🔄 Next sow in <strong>${diff} day${diff===1?'':'s'}</strong> (${fmtDate(nextDate.toISOString().slice(0,10))})</div>`;
  }

  const sec = document.createElement('div');
  sec.className = 'modal-section modal-succession-section';
  sec.innerHTML = `
    <div class="modal-section-title">
      🔄 Succession Planting
      <button class="succession-log-btn" id="succession-log-btn">+ Log sow</button>
    </div>
    <p class="succession-tip">Sow every ~${intervalDays} days for continuous harvest.</p>
    ${batchesHTML}
    ${nextLabel}
    <div class="succession-dates">
      ${result.dates.map(iso => `<span class="succession-chip">${fmtDate(iso)}</span>`).join('')}
    </div>`;
  body.appendChild(sec);
  sec.querySelector('#succession-log-btn').addEventListener('click', () => logSuccessionBatch(name));
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

// ── Phase 41: Seed inventory ──────────────────────
function gardenUpdateSeedInfo(name, field, value) {
  if (!myGarden[name]) return;
  if (!myGarden[name].seedInfo) myGarden[name].seedInfo = {};
  if (value === '' || value === null) delete myGarden[name].seedInfo[field];
  else myGarden[name].seedInfo[field] = value;
  saveGarden();
  if (currentPanelTab === 'garden') renderGardenTab();
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
  const chart = renderHarvestChart();
  if (chart) el.insertAdjacentHTML('beforeend', chart);
}

// ── Phase 45: Harvest bar chart ──────────────────
function renderHarvestChart() {
  const names = Object.keys(myGarden);
  const data = [];
  for (const name of names) {
    const log = myGarden[name]?.harvestLog || [];
    if (!log.length) continue;
    let total = 0, unit = null;
    for (const h of log) {
      if (h.qty && (!unit || unit === h.unit)) { total += h.qty; unit = h.unit || null; }
    }
    data.push({ name, count: log.length, total, unit });
  }
  if (!data.length) return '';

  const hasQty = data.some(d => d.total > 0);
  data.sort((a, b) => hasQty ? b.total - a.total : b.count - a.count);
  const top    = data.slice(0, 6);
  const maxVal = hasQty ? Math.max(...top.map(d => d.total)) : Math.max(...top.map(d => d.count));

  const rows = top.map(d => {
    const val   = hasQty && d.total > 0 ? d.total : d.count;
    const pct   = Math.max(4, Math.round((val / maxVal) * 100));
    const label = hasQty && d.total > 0
      ? `${parseFloat(val.toFixed(1))}${d.unit ? '\u202f' + d.unit : ''}`
      : `${val}×`;
    const emoji = cropData?.[d.name]?.emoji || '🌱';
    return `<div class="hc-row">
      <span class="hc-label">${emoji} ${d.name}</span>
      <div class="hc-bar-wrap"><div class="hc-bar" style="width:${pct}%"></div></div>
      <span class="hc-val">${label}</span>
    </div>`;
  }).join('');

  return `<div class="harvest-chart-section">
    <div class="hc-title">${hasQty ? '🌾 Yield by crop' : '🌾 Harvests by crop'}</div>
    ${rows}
  </div>`;
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
  const ganttInner = el.querySelector('#gantt-grid-inner');
  const jumpToGanttMonth = e => {
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
  };
  ganttInner?.addEventListener('click', jumpToGanttMonth);
  ganttInner?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jumpToGanttMonth(e); }
  });
}

// ── Phase 20: Personal Growing Timeline ──────────
function renderGrowingTimeline() {
  const el = document.getElementById('growing-timeline');
  if (!el) return;

  const names = Object.keys(myGarden);
  const planted = names.filter(n => myGarden[n]?.planted);
  if (!planted.length) { el.innerHTML = ''; return; }

  const today = new Date(); today.setHours(0, 0, 0, 0);

  // Determine date range: from earliest sow date to latest projected harvest (or today+45)
  const startDates = planted.map(n => new Date(myGarden[n].planted + 'T00:00:00'));
  const earliest = new Date(Math.min(...startDates));
  const projectedEnds = planted.map(n => {
    const s = new Date(myGarden[n].planted + 'T00:00:00');
    const dh = parseHarvestDays(cropData[n]?.days) || 90;
    return new Date(s.getTime() + dh * 86400000);
  });
  const latest = new Date(Math.max(
    ...projectedEnds.map(d => d.getTime()),
    today.getTime() + 45 * 86400000
  ));

  // Snap to month boundaries
  const rangeStart = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  const rangeEnd   = new Date(latest.getFullYear(), latest.getMonth() + 2, 1);
  const totalDays  = Math.round((rangeEnd - rangeStart) / 86400000);
  const pct = d => ((d - rangeStart) / 86400000 / totalDays * 100).toFixed(3);
  const canvasW = Math.max(420, totalDays * 3);

  // Month tick marks
  const months = [];
  const mc = new Date(rangeStart);
  while (mc < rangeEnd) {
    months.push({
      label: mc.toLocaleDateString(undefined, { month: 'short' }),
      p: pct(mc),
      isCur: mc.getMonth() === today.getMonth() && mc.getFullYear() === today.getFullYear()
    });
    mc.setMonth(mc.getMonth() + 1);
  }
  const todayP = pct(today);

  // Build row data
  const rows = planted.map(name => {
    const entry = myGarden[name];
    const s  = new Date(entry.planted + 'T00:00:00');
    const dh = parseHarvestDays(cropData[name]?.days);
    const end = dh ? new Date(s.getTime() + dh * 86400000) : null;
    const sp = parseFloat(pct(s));
    const ep = end ? parseFloat(pct(end)) : null;
    const w  = ep !== null ? Math.max(ep - sp, 0.5) : null;
    const status = getGardenStatus(name);
    const type = status?.type || 'saved';
    const done = !!(entry.harvestLog?.length);
    return { name, sp, w, type, done, emoji: cropData[name]?.emoji || '🌱', dh };
  });

  const monthTicks = months.map(m =>
    `<div class="tl-tick${m.isCur ? ' tl-tick--cur' : ''}" style="left:${m.p}%"><span>${m.label}</span></div>`
  ).join('');

  const gridLines = months.map(m =>
    `<div class="tl-gl" style="left:${m.p}%"></div>`
  ).join('');

  const labelCells = rows.map(r => {
    const n = r.name.length > 13 ? r.name.slice(0, 12) + '\u2026' : r.name;
    return `<div class="tl-lc">${r.emoji} ${n}</div>`;
  }).join('');

  const barRows = rows.map(r => {
    const cropTitle = `${r.name}${r.dh ? ` \u2014 harvest ~${r.dh}d from sow` : ''}`;
    const bar = r.w !== null
      ? `<div class="tl-bar tl-bar--${r.type}${r.done ? ' tl-bar--done' : ''}"
             style="left:${r.sp}%;width:${r.w}%" data-crop="${r.name}"
             title="${cropTitle}">${r.done ? '<span>\u2713</span>' : ''}</div>`
      : `<div class="tl-bar tl-bar--pin" style="left:${r.sp}%"
             data-crop="${r.name}" title="${r.name} \u2014 no harvest data">${r.emoji}</div>`;
    return `<div class="tl-row">${bar}</div>`;
  }).join('');

  el.innerHTML = `
    <div class="tl-wrap">
      <div class="tl-title">\uD83D\uDCC5 Growing Timeline</div>
      <div class="tl-body">
        <div class="tl-labels">${labelCells}</div>
        <div class="tl-scroll" id="tl-scroll-area">
          <div class="tl-canvas" style="width:${canvasW}px">
            <div class="tl-month-row">${monthTicks}</div>
            <div class="tl-grid-layer">${gridLines}</div>
            <div class="tl-today-line" style="left:${todayP}%">
              <span class="tl-now-tip">now</span>
            </div>
            <div class="tl-bars-layer">${barRows}</div>
          </div>
        </div>
      </div>
    </div>`;

  el.addEventListener('click', e => {
    const b = e.target.closest('[data-crop]');
    if (b) openCropDetail(b.dataset.crop);
  });

  // Scroll so today is ~30% from the left edge
  requestAnimationFrame(() => {
    const scroll = el.querySelector('#tl-scroll-area');
    if (scroll) {
      const todayX = parseFloat(todayP) / 100 * canvasW;
      scroll.scrollLeft = Math.max(0, todayX - scroll.offsetWidth * 0.3);
    }
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
      const name = li.dataset.crop || li.querySelector('[data-crop]')?.dataset.crop || li.textContent.trim();
      const match = !q || cropMatchesQuery(name, q);
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
  // On native (Capacitor), trigger OS share sheet directly
  if (window.Capacitor?.isNativePlatform?.() && navigator.share) {
    const zoneLabel = selectedZone ? `Zone ${getZoneDisplayLabel(selectedZone)}` : '';
    const text = zoneLabel
      ? `I'm growing in ${zoneLabel} — check out Plant Zone Finder for personalised planting guides!`
      : 'Check out Plant Zone Finder — free planting calendar for your growing zone!';
    navigator.share({
      title: 'Plant Zone Finder',
      text,
      url: 'https://djamies1.github.io/garden-zones/'
    }).catch(() => {});
    return;
  }
  const sm = document.getElementById('share-modal');
  if (sm) {
    const _prev = document.activeElement;
    sm.showModal();
    trapFocus(sm);
    sm.addEventListener('close', () => _prev?.focus(), { once: true });
  }
}

// ── Phase 14: Share & Print ──────────────────────
function copyZoneURL() {
  const url = window.location.href;
  if (navigator.share && (window.Capacitor?.isNativePlatform?.() || /mobile|android|iphone|ipad/i.test(navigator.userAgent))) {
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
  document.getElementById('sopt-calendar')?.addEventListener('click', generateICS);
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
    haptic(5);
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

  // Compute start-indoors target date from transplant_weeks + last frost
  let startIndoorsHtml = '';
  if (features.startIndoors && c?.transplant_weeks && sched.raw.startIndoors?.length) {
    const climate = getZoneClimateInfo(zone);
    const frostStr = climate?.frost?.last;
    if (frostStr) {
      const yr = new Date().getFullYear();
      const lastFrost = new Date(`${frostStr} ${yr}`);
      if (!isNaN(lastFrost)) {
        const si = new Date(lastFrost);
        si.setDate(si.getDate() - c.transplant_weeks * 7);
        const todayMs = new Date(); todayMs.setHours(0,0,0,0);
        const daysAway = Math.round((si - todayMs) / 86400000);
        if (daysAway > -28 && daysAway < 120) {
          const dateStr = si.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const cls = daysAway <= 0 ? 'sched-si--now' : daysAway <= 14 ? 'sched-si--soon' : '';
          const when = daysAway <= 0 ? `${Math.abs(daysAway)}d ago` : `in ${daysAway}d`;
          startIndoorsHtml = `<div class="sched-si ${cls}">
            🪴 Start indoors <strong>${dateStr}</strong> (${when}) — ${c.transplant_weeks}w before last frost
          </div>`;
        }
      }
    }
  }

  return `
    <div class="modal-schedule-section">
      <h4>Your Schedule <span class="sched-zone-badge">Zone ${getZoneDisplayLabel(zone)}</span></h4>
      ${startIndoorsHtml}
      ${nextUpHtml}
      <div class="schedule-grid">${ACTS.map(item).join('')}</div>
      ${soilHtml}
    </div>`;
}

// ── Phase 2: Garden export / import ─────────────
// ── Phase 33: Full garden backup export ──────────
const BACKUP_KEYS = ['pzf-garden','pzf-journal','pzf-beds','pzf-custom-crops','pzf-history','pzf-achievements','pzf-seeds','pzf-rotation','pzf-plan','pzf-varieties','pzf-structures'];

async function exportGarden() {
  const backup = {
    app: 'Plant Zone Finder',
    version: '1.0',
    exported: new Date().toISOString(),
    data: {}
  };
  for (const key of BACKUP_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try { backup.data[key] = JSON.parse(raw); } catch { backup.data[key] = raw; }
    }
  }

  const json     = JSON.stringify(backup, null, 2);
  const filename = `plant-zone-backup-${new Date().toISOString().slice(0,10)}.json`;

  // Native: share as a file (works on Android/iOS)
  if (window.Capacitor?.isNativePlatform?.() && navigator.share) {
    try {
      const file = new File([json], filename, { type: 'application/json' });
      await navigator.share({ title: 'Plant Zone Finder Backup', files: [file] });
      return;
    } catch (err) {
      if (err.name !== 'AbortError') showToast('Share failed — trying download', 'info');
    }
  }

  // Web: download file
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Backup exported ✓', 'success');
}

function importGarden(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);

      // Full backup format
      if (parsed?.app === 'Plant Zone Finder' && parsed?.data) {
        const counts = {};
        for (const [key, val] of Object.entries(parsed.data)) {
          if (BACKUP_KEYS.includes(key)) {
            localStorage.setItem(key, JSON.stringify(val));
            counts[key] = Array.isArray(val) ? val.length : Object.keys(val).length;
          }
        }
        // Reload all in-memory state
        loadGarden();
        loadHistory();
        loadCanvas();
        loadBeds();
        journalEntries = JSON.parse(localStorage.getItem('pzf-journal') || '[]');
        refreshGardenUI('');
        const total = Object.values(counts).reduce((s, n) => s + n, 0);
        showToast(`Backup restored — ${total} items ✓`, 'success');
        return;
      }

      // Legacy format: plain garden object
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        myGarden = { ...parsed, ...myGarden };
        saveGarden();
        refreshGardenUI('');
        showToast(`Imported ${Object.keys(parsed).length} crops ✓`, 'success');
        return;
      }

      throw new Error('Unrecognised format');
    } catch {
      showToast('Import failed — invalid file', 'error');
    }
  };
  reader.readAsText(file);
}

// ── Phase 2: Zone pulse ──────────────────────────
function pulseZone() {
  if (!selectedLayer) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let pulseCount = 0;
  const originalStyle = { fillOpacity: 1.0, weight: 3, color: '#fff', opacity: 1 };
  const pulseStyle = { fillOpacity: 0.5, weight: 4, color: '#78c87a', opacity: 1 };
  const interval = setInterval(() => {
    selectedLayer.setStyle(pulseCount % 2 === 0 ? pulseStyle : originalStyle);
    if (++pulseCount >= 4) { clearInterval(interval); selectedLayer.setStyle(originalStyle); }
  }, 180);
}

// ── Phase 2: Harvest confetti ────────────────────
function showHarvestConfetti(el) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const COLORS = ['#78c87a','#fbbf24','#f87171','#60a5fa','#c084fc','#fb923c','#34d399','#f9a8d4'];
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
  // Phase 57: weather snapshot auto-tag
  const weatherSnap = (() => {
    if (!weatherData?.current) return null;
    return { tempF: Math.round(weatherData.current.temperature_2m), emoji: getWmoIcon(weatherData.current.weather_code) };
  })();
  journalEntries.unshift({
    id: Date.now(),
    date: new Date().toISOString(),
    text: trimmed,
    crop: cropTag || null,
    ...(photoId != null && { photoId }),
    ...(weatherSnap && { weather: weatherSnap }),
  });
  saveJournal();
  checkAchievements();
  renderJournalTab();
  if (trimmed && !cropTag) { earnXP(10, 'Journal entry'); updateStreak(); }
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

  // Phase 57: apply search + date filters
  const now = new Date(); now.setHours(23,59,59,999);
  const weekAgo  = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
  const dateFilter = document.getElementById('journal-date-filter')?.value || 'all';

  let entries = journalFilterCrop
    ? journalEntries.filter(e => e.crop === journalFilterCrop)
    : journalEntries;

  if (journalSearchQuery) {
    const q = journalSearchQuery.toLowerCase();
    entries = entries.filter(e => (e.text || '').toLowerCase().includes(q) || (e.crop || '').toLowerCase().includes(q));
  }
  if (dateFilter === 'week')  entries = entries.filter(e => new Date(e.date) >= weekAgo);
  if (dateFilter === 'month') entries = entries.filter(e => new Date(e.date) >= monthAgo);

  const matchCount = document.getElementById('journal-match-count');
  if (matchCount) {
    const filtered = journalSearchQuery || dateFilter !== 'all' || journalFilterCrop;
    matchCount.textContent = filtered ? `${entries.length} result${entries.length !== 1 ? 's' : ''}` : '';
  }

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
    const weatherHtml = e.weather ? `<span class="journal-entry-weather">${e.weather.emoji} ${e.weather.tempF}°F</span>` : '';
    const photoHtml = e.photoId != null
      ? `<img class="journal-entry-photo" data-photo-id="${e.photoId}" alt="Garden photo" loading="lazy">`
      : '';
    const textHtml = e.text
      ? `<div class="journal-entry-text">${e.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`
      : '';
    const milestoneIcon = e.milestone ? (MILESTONE_ICONS[e.milestoneType] || '📌') : null;
    const milestoneBadge = milestoneIcon
      ? `<span class="journal-milestone-badge journal-milestone-badge--${e.milestoneType}">${milestoneIcon}</span>`
      : '';
    const entryClass = e.milestone ? `journal-entry journal-entry--milestone journal-entry--ms-${e.milestoneType}` : 'journal-entry';
    return `<div class="${entryClass}" data-id="${e.id}">
      <div class="journal-entry-meta">${milestoneBadge}${tagHtml}${weatherHtml}</div>
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

  // Phase 72: Gallery open/close
  document.getElementById('gallery-open-btn')?.addEventListener('click', openPhotoGallery);
  document.getElementById('gallery-close-btn')?.addEventListener('click', () => {
    const ov = document.getElementById('photo-gallery-overlay');
    if (ov) ov.hidden = true;
  });
  document.getElementById('photo-gallery-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('photo-gallery-overlay')) e.target.hidden = true;
  });

  // Phase 77-78: overlay close buttons
  document.getElementById('season-wrap-close')?.addEventListener('click', () => {
    document.getElementById('season-wrap-overlay').hidden = true;
  });
  document.getElementById('season-wrap-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('season-wrap-overlay')) e.target.hidden = true;
  });
  document.getElementById('recipe-browse-close')?.addEventListener('click', () => {
    document.getElementById('recipe-browse-overlay').hidden = true;
  });
  document.getElementById('recipe-browse-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('recipe-browse-overlay')) e.target.hidden = true;
  });

  // Phase 79: browse recently viewed
  renderRecentlyViewed();

  document.getElementById('journal-filter-bar')?.addEventListener('click', e => {
    const chip = e.target.closest('.journal-filter-chip');
    if (!chip) return;
    journalFilterCrop = chip.dataset.crop;
    renderJournalTab();
  });

  // Phase 57: search input + date filter
  document.getElementById('journal-search-input')?.addEventListener('input', debounce(e => {
    journalSearchQuery = e.target.value;
    renderJournalTab();
  }, 250));
  document.getElementById('journal-date-filter')?.addEventListener('change', () => renderJournalTab());
}

// ── Phase 9: Achievements ─────────────────────────
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
  earnXP(25, `Achievement: ${id}`);
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
    const t = useMetric ? Math.round((weatherData.current.temperature_2m - 32) * 5/9) + '°C'
                        : Math.round(weatherData.current.temperature_2m) + '°F';
    weatherHtml = `<span class="gd-sep">·</span>
      <span class="gd-weather">${getWmoIcon(weatherData.current.weathercode)} ${t}</span>`;
  }

  const lvl = getGardenLevel(gardenXP);
  const lvlHtml = `<div class="gd-xp-row">
    <span class="gd-level-badge" title="${gardenXP} XP · ${lvl.xpToNext} to next level">Lv.${lvl.level} ${lvl.title}</span>
    <div class="gd-xp-track" title="${gardenXP} XP"><div class="gd-xp-fill" style="width:${lvl.pct}%"></div></div>
    ${gardenStreak.count >= 2 ? `<span class="gd-streak" title="${gardenStreak.count}-day streak">🔥 ${gardenStreak.count}</span>` : ''}
  </div>`;

  el.innerHTML = `
    <span class="gd-zone">${getZoneDisplayLabel(selectedZone)}</span>
    <span class="gd-sep">·</span>
    <span class="gd-season">${seasonLabel}</span>
    ${weatherHtml}
    ${names.length ? `<span class="gd-sep">·</span>
      <span class="gd-stat"><strong>${growing}</strong> growing${ready ? `, <strong>${ready}</strong> ready` : ''}</span>` : ''}
    <button class="gd-map-btn" id="gd-map-btn">🗺 Change zone</button>
    ${lvlHtml}`;

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
function _updateOnlineBar() {
  const bar = document.getElementById('offline-bar');
  if (!bar) return;
  if (!navigator.onLine) {
    bar.hidden = false;
  } else if (!bar.hidden) {
    bar.hidden = true;
    showToast('✅ Back online', 'success');
  }
}

function initOfflineIndicator() {
  const banner = document.getElementById('offline-banner');
  const update = () => { if (banner) banner.hidden = navigator.onLine; };
  update();
  window.addEventListener('online', () => {
    update();
    _updateOnlineBar();
    // Re-fetch fresh weather/data when connection is restored
    if (selectedLat && selectedLng) fetchWeatherAndUpdate();
  });
  window.addEventListener('offline', () => { update(); _updateOnlineBar(); });
  _updateOnlineBar();

  // ── SW update notification ────────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data?.type !== 'SW_UPDATED') return;
      const newCache = e.data.cache || '';
      const prevCache = localStorage.getItem('pzf-sw-cache');
      localStorage.setItem('pzf-sw-cache', newCache);
      // Only show toast when upgrading from a known previous version (not first install)
      if (prevCache && prevCache !== newCache) showUpdateBar();
    });
  }
}

function showUpdateBar() {
  if (document.getElementById('update-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'update-bar';
  bar.setAttribute('role', 'alert');
  bar.setAttribute('aria-live', 'assertive');
  bar.innerHTML = `<span>🆕 New version available</span>
    <button id="update-reload-btn">Reload</button>
    <button id="update-dismiss-btn" aria-label="Dismiss">✕</button>`;
  document.body.appendChild(bar);
  document.getElementById('update-reload-btn')?.addEventListener('click', () => window.location.reload());
  document.getElementById('update-dismiss-btn')?.addEventListener('click', () => bar.remove());
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
  _qsResults = allNames.filter(n => cropMatchesQuery(n, q)).slice(0, 8);
  _qsSelectedIdx = _qsResults.length ? 0 : -1;
  if (!_qsResults.length) {
    el.innerHTML = `<div class="qs-empty">No crops found for "${query.replace(/&/g,'&amp;').replace(/</g,'&lt;')}"</div>`;
    return;
  }
  el.innerHTML = _qsResults.map((name, i) => {
    const c = cropData[name];
    const inG = isInGarden(name);
    const aliasMatch = c?.aliases?.find(a => a.toLowerCase().includes(q));
    return `<div class="qs-result${i === 0 ? ' qs-selected' : ''}" data-idx="${i}" data-name="${name}">
      <span class="qs-emoji">${c?.emoji || '🌱'}</span>
      <div class="qs-name-wrap">
        <span class="qs-name">${name}</span>
        ${aliasMatch ? `<span class="qs-alias">aka ${aliasMatch}</span>` : ''}
      </div>
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

  input.addEventListener('input', debounce(() => renderQSResults(input.value), 200));

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
  if (!features.companionPlanting) { el.innerHTML = ''; return; }

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
  // Phase 86: migrate — ensure every bed has color + cells
  const ids = Object.keys(gardenBeds);
  for (let i = 0; i < ids.length; i++) {
    gardenBeds[ids[i]].color ??= BED_COLORS[i % BED_COLORS.length];
    gardenBeds[ids[i]].cells ??= {};
    gardenBeds[ids[i]].cols ??= 4;
    gardenBeds[ids[i]].rows ??= 2;
    gardenBeds[ids[i]].type ??= 'raised';
    // Phase 87: x/y undefined triggers auto-placement (not 0,0 which would stack)
    if (!Object.prototype.hasOwnProperty.call(gardenBeds[ids[i]], 'x')) gardenBeds[ids[i]].x = undefined;
    if (!Object.prototype.hasOwnProperty.call(gardenBeds[ids[i]], 'y')) gardenBeds[ids[i]].y = undefined;
  }
  autoPlaceBeds();
}
function saveBeds() { localStorage.setItem('pzf-beds', JSON.stringify(gardenBeds)); }
function loadStructures() {
  try { gardenStructures = JSON.parse(localStorage.getItem('pzf-structures') || '{}'); }
  catch { gardenStructures = {}; }
  for (const s of Object.values(gardenStructures)) {
    s.cols  ??= 2;
    s.rows  ??= 2;
    s.color ??= STRUCTURE_TYPES[s.type]?.color || '#5a5a5a';
  }
}
function saveStructures() {
  localStorage.setItem('pzf-structures', JSON.stringify(gardenStructures));
}

function addBed(name, type) {
  const t = BED_TYPES[type] || BED_TYPES['raised'];
  const id = String(Date.now());
  const idx = Object.keys(gardenBeds).length;
  const pos = _pendingDrawPos; _pendingDrawPos = null;
  gardenBeds[id] = {
    name: name.trim() || t.label, emoji: t.emoji, type,
    cols: pos ? Math.max(1, pos.cols) : 4,
    rows: pos ? Math.max(1, pos.rows) : 2,
    color: BED_COLORS[idx % BED_COLORS.length],
    cells: {}, x: pos ? pos.x : undefined, y: pos ? pos.y : undefined
  };
  if (!pos) autoPlaceBeds(); saveBeds(); activeBedId = id;
  closeGardenMapModal();
  if (document.getElementById('garden-map-overlay')?.hidden === false) {
    renderGardenMapCanvas(); selectMapBed(id);
  } else { openGardenMap(); selectMapBed(id); }
}

function addStructure(name, type) {
  const t = STRUCTURE_TYPES[type] || STRUCTURE_TYPES['shed'];
  const id = 's' + String(Date.now());
  gardenStructures[id] = {
    name: name.trim() || t.label, type,
    cols: (type === 'path' || type === 'fence') ? 1 : 3,
    rows: (type === 'path' || type === 'fence') ? 4 : 3,
    color: t.color, x: 0, y: 0
  };
  saveStructures(); closeGardenMapModal();
  renderGardenMapCanvas(); selectMapStruct(id);
}
function removeStructure(id) {
  delete gardenStructures[id]; saveStructures();
  if (_mapSelectedStruct === id) _mapSelectedStruct = null;
  renderGardenMapCanvas();
}
function resizeStructure(id, dcols, drows) {
  const s = gardenStructures[id]; if (!s) return;
  s.cols = Math.max(1, Math.min(20, s.cols + dcols));
  s.rows = Math.max(1, Math.min(20, s.rows + drows));
  s.x = Math.max(0, Math.min(gardenCanvas.cols - s.cols, s.x || 0));
  s.y = Math.max(0, Math.min(gardenCanvas.rows - s.rows, s.y || 0));
  saveStructures(); renderGardenMapCanvas();
}

function removeBed(id) {
  for (const name of Object.keys(myGarden)) {
    if (myGarden[name].bedIds?.includes(id)) {
      myGarden[name].bedIds = myGarden[name].bedIds.filter(bid => bid !== id);
    }
  }
  saveGarden();
  delete gardenBeds[id];
  saveBeds();
  if (activeBedId === id) activeBedId = null;
  renderGardenBeds();
  if (currentPanelTab === 'garden') renderGardenTab();
}

function assignCropToBed(cropName, bedId) {
  if (!myGarden[cropName]) return;
  myGarden[cropName].bedIds = bedId ? [bedId] : [];
  saveGarden();
  // Phase 54: rotation conflict warning
  if (bedId) {
    const conflict = checkRotationConflict(cropName, bedId);
    if (conflict) {
      const ago = conflict.yearsAgo === 0 ? 'this year' : `${conflict.yearsAgo} year${conflict.yearsAgo > 1 ? 's' : ''} ago`;
      showToast(`⚠️ ${conflict.family} family grown here ${ago} (${conflict.cropName}) — consider rotating`, 'info');
    }
  }
  renderGardenBeds();
  if (currentPanelTab === 'garden') renderGardenTab();
}

// ── Phase 88: Beds summary (replaces card overview) ───
function renderGardenBeds() {
  const el = document.getElementById('garden-beds');
  if (!el) return;
  if (!features.beds) { el.hidden = true; return; }
  el.innerHTML = renderBedSummaryHTML();
  document.getElementById('beds-open-map-btn')
    ?.addEventListener('click', openGardenMap);
}

function renderBedSummaryHTML() {
  const ids = Object.keys(gardenBeds);
  if (!ids.length) {
    return `<div class="beds-summary beds-summary--empty">
      <span class="beds-summary-title">🛏 Garden Beds</span>
      <p class="beds-summary-empty-msg">No beds yet — map out your garden to get started.</p>
      <button class="beds-open-map-btn" id="beds-open-map-btn">＋ Map my garden beds</button>
    </div>`;
  }
  const totalCrops = ids.reduce((n, id) => n + getCropsInBed(id).length, 0);
  const tags = ids.map(id => {
    const b = gardenBeds[id];
    const n = getCropsInBed(id).length;
    const cap = (b.cols || 4) * (b.rows || 2);
    const badge = n ? ` <span class="beds-tag-count">${n}/${cap}</span>` : '';
    return `<span class="beds-summary-tag" style="border-color:${b.color}55;background:${b.color}1a">${b.emoji} ${b.name.replace(/&/g,'&amp;').replace(/</g,'&lt;')}${badge}</span>`;
  }).join('');
  return `<div class="beds-summary">
    <div class="beds-summary-header">
      <span class="beds-summary-title">🛏 Garden Beds</span>
      <span class="beds-summary-meta">${ids.length} bed${ids.length !== 1 ? 's' : ''} · ${totalCrops} crop${totalCrops !== 1 ? 's' : ''} planted</span>
    </div>
    <div class="beds-summary-tags">${tags}</div>
    <button class="beds-open-map-btn" id="beds-open-map-btn">📐 Map my garden beds →</button>
  </div>`;
}

// Pending cell assignment state
let _pickerTarget = null; // { bedId, col, row }

function openBedCropPicker(bedId, col, row, existing) {
  _pickerTarget = { bedId, col, row };
  const picker = document.getElementById('bed-crop-picker');
  const search = document.getElementById('bed-crop-search');
  if (!picker || !search) return;

  search.value = '';
  renderCropPickerList('', existing);
  picker.hidden = false;
  search.focus();

  // Wire search
  search.oninput = () => renderCropPickerList(search.value, existing);

  // Close on outside tap
  setTimeout(() => {
    const close = (e) => {
      if (!picker.contains(e.target)) { closeBedCropPicker(); document.removeEventListener('pointerdown', close); }
    };
    document.addEventListener('pointerdown', close);
  }, 0);
}

function renderCropPickerList(query, existing) {
  const list = document.getElementById('bed-crop-list');
  if (!list) return;

  const q = query.toLowerCase();
  const inGarden = Object.keys(myGarden);
  const allCrops = cropData ? Object.keys(cropData) : [];

  // Garden crops first, then rest
  const candidates = [
    ...inGarden,
    ...allCrops.filter(n => !inGarden.includes(n))
  ].filter((n, i, arr) => arr.indexOf(n) === i); // dedupe

  const filtered = q ? candidates.filter(n => n.toLowerCase().includes(q)) : candidates;

  let html = '';
  if (existing) {
    html += `<button class="bed-picker-remove" id="bed-picker-remove-btn">Remove "${existing}"</button>`;
  }
  for (const name of filtered.slice(0, 60)) {
    const em = cropData[name]?.emoji || '🌱';
    const inG = inGarden.includes(name);
    html += `<button class="bed-crop-option${inG ? ' bed-crop-option--in-garden' : ''}" data-crop="${name}">
      <span class="bed-crop-option-emoji">${em}</span>
      <span class="bed-crop-option-name">${name}</span>
    </button>`;
  }
  list.innerHTML = html;

  list.querySelectorAll('.bed-crop-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!_pickerTarget) return;
      setBedCell(_pickerTarget.bedId, _pickerTarget.col, _pickerTarget.row, btn.dataset.crop);
      closeBedCropPicker();
    });
  });

  document.getElementById('bed-picker-remove-btn')?.addEventListener('click', () => {
    if (!_pickerTarget) return;
    setBedCell(_pickerTarget.bedId, _pickerTarget.col, _pickerTarget.row, null);
    closeBedCropPicker();
  });
}

function closeBedCropPicker() {
  const picker = document.getElementById('bed-crop-picker');
  if (picker) picker.hidden = true;
  _pickerTarget = null;
}

function setBedCell(bedId, col, row, cropName) {
  const bed = gardenBeds[bedId];
  if (!bed) return;
  const key = `${col}-${row}`;
  if (cropName) {
    bed.cells[key] = cropName;
    if (myGarden[cropName]) { myGarden[cropName].bedId = bedId; saveGarden(); }
  } else {
    delete bed.cells[key];
  }
  saveBeds();
  if (document.getElementById('garden-map-overlay')?.hidden === false) {
    renderGardenMapCanvas();
  } else if (currentPanelTab === 'garden' && gardenViewMode === 'bed') {
    renderGardenTab();
  } else {
    renderGardenBeds();
  }
}

function resizeBed(bedId, dcols, drows) {
  const bed = gardenBeds[bedId];
  if (!bed) return;
  bed.cols = Math.max(1, Math.min(12, (bed.cols || 4) + dcols));
  bed.rows = Math.max(1, Math.min(12, (bed.rows || 2) + drows));
  // Clamp bed position to stay within canvas
  bed.x = Math.max(0, Math.min(gardenCanvas.cols - bed.cols, bed.x || 0));
  bed.y = Math.max(0, Math.min(gardenCanvas.rows - bed.rows, bed.y || 0));
  // Drop out-of-bounds cells
  for (const key of Object.keys(bed.cells || {})) {
    const [c, r] = key.split('-').map(Number);
    if (c >= bed.cols || r >= bed.rows) delete bed.cells[key];
  }
  saveBeds();
  if (document.getElementById('garden-map-overlay')?.hidden === false) {
    renderGardenMapCanvas();
  } else {
    renderGardenBeds();
  }
}

function initBeds() { loadCanvas(); loadBeds(); loadStructures(); }

// ── Phase 87: Garden Map ───────────────────────────
function loadCanvas() {
  try { gardenCanvas = { cols: 20, rows: 15, ...JSON.parse(localStorage.getItem('pzf-canvas') || '{}') }; }
  catch { gardenCanvas = { cols: 20, rows: 15 }; }
}
function saveCanvas() { localStorage.setItem('pzf-canvas', JSON.stringify(gardenCanvas)); }

function autoPlaceBeds() {
  let cx = 0, cy = 0, rowH = 0;
  for (const id of Object.keys(gardenBeds)) {
    const bed = gardenBeds[id];
    if (bed.x !== undefined && bed.y !== undefined) continue;
    const cols = bed.cols || 4, rows = bed.rows || 2;
    if (cx + cols > gardenCanvas.cols) { cx = 0; cy += rowH + 1; rowH = 0; }
    bed.x = cx; bed.y = cy;
    cx += cols + 1; rowH = Math.max(rowH, rows);
  }
}

let _gardenMapPrev = null;
function openGardenMap() {
  _gardenMapPrev = document.activeElement;
  renderGardenMapCanvas();
  const overlay = document.getElementById('garden-map-overlay');
  overlay.hidden = false;
  trapFocus(overlay);
}

function closeGardenMap() {
  document.getElementById('garden-map-overlay').hidden = true;
  _gardenMapPrev?.focus();
  _gardenMapPrev = null;
  _mapSelectedBed = null; _mapSelectedStruct = null;
  _drag = null; _structureDrag = null; _resizeDrag = null;
  _undoStack = []; _redoStack = [];
  _drawDrag = null; _pendingDrawPos = null; if (_drawMode) _toggleDrawMode(false);
  const _sugg = document.getElementById('gm-crop-suggestions'); if (_sugg) _sugg.hidden = true;
  const _sp = document.getElementById('gm-shortcuts-panel'); if (_sp) _sp.hidden = true;
  document.removeEventListener('pointermove', onBedDragMove);
  document.removeEventListener('pointermove', onStructDragMove);
  document.removeEventListener('pointermove', onResizeDragMove);
}

function pushUndoSnapshot() {
  _undoStack.push({ beds: JSON.parse(JSON.stringify(gardenBeds)), structures: JSON.parse(JSON.stringify(gardenStructures)) });
  if (_undoStack.length > 25) _undoStack.shift();
  _redoStack = [];
  _updateUndoBtns();
}
function _popUndoSnap(isRedo) {
  const src = isRedo ? _redoStack : _undoStack;
  const dst = isRedo ? _undoStack : _redoStack;
  if (!src.length) return;
  dst.push({ beds: JSON.parse(JSON.stringify(gardenBeds)), structures: JSON.parse(JSON.stringify(gardenStructures)) });
  const s = src.pop();
  gardenBeds = s.beds; gardenStructures = s.structures;
  saveBeds(); saveStructures();
  renderGardenMapCanvas();
  _updateUndoBtns();
}
function _updateUndoBtns() {
  const u = document.getElementById('gm-undo-btn'), r = document.getElementById('gm-redo-btn');
  if (u) u.disabled = !_undoStack.length;
  if (r) r.disabled = !_redoStack.length;
}
function _toggleDrawMode(force) {
  _drawMode = force !== undefined ? force : !_drawMode;
  const sc  = document.getElementById('gm-canvas-scroll');
  const btn = document.getElementById('gm-draw-btn');
  if (sc)  sc.classList.toggle('gm-draw-mode', _drawMode);
  if (btn) btn.classList.toggle('gm-tool-btn--active', _drawMode);
  if (!_drawMode) { _drawDrag = null; _removeDrawPreview(); }
}
function _updateDrawPreview() {
  if (!_drawDrag) return;
  const canvas = document.getElementById('gm-canvas'); if (!canvas) return;
  let prev = document.getElementById('gm-draw-preview');
  if (!prev) {
    prev = document.createElement('div');
    prev.id = 'gm-draw-preview'; prev.className = 'gm-draw-preview';
    canvas.appendChild(prev);
  }
  const x = _drawDrag.sx * TILE_SIZE, y = _drawDrag.sy * TILE_SIZE;
  const w = (_drawDrag.ex - _drawDrag.sx + 1) * TILE_SIZE;
  const h = (_drawDrag.ey - _drawDrag.sy + 1) * TILE_SIZE;
  Object.assign(prev.style, { left:x+'px', top:y+'px', width:w+'px', height:h+'px' });
}
function _removeDrawPreview() { document.getElementById('gm-draw-preview')?.remove(); }

function applyMapZoom() {
  const w = document.getElementById('gm-canvas-zoom');
  if (!w) return;
  const pw = gardenCanvas.cols * TILE_SIZE, ph = gardenCanvas.rows * TILE_SIZE;
  w.style.width  = (pw * _mapZoom) + 'px';
  w.style.height = (ph * _mapZoom) + 'px';
  w.style.transform = `scale(${_mapZoom})`;
  w.style.transformOrigin = '0 0';
  const d = document.getElementById('gm-zoom-display');
  if (d) d.textContent = Math.round(_mapZoom * 100) + '%';
  const lbl = document.getElementById('gm-scale-label');
  const line = document.querySelector('.gm-scale-line');
  if (lbl && line) {
    const tiles = 5, metres = tiles * 0.5;
    const px = tiles * TILE_SIZE * _mapZoom;
    line.style.width = px + 'px';
    lbl.textContent = metres >= 1 ? metres + 'm' : (metres * 100) + 'cm';
  }
  const _zc = document.getElementById('gm-canvas');
  if (_zc) {
    _zc.classList.toggle('gm-canvas--zoom-low',  _mapZoom < 0.75);
    _zc.classList.toggle('gm-canvas--zoom-high', _mapZoom >= 1.5);
  }
}

function renderCompanionLines(bedId) {
  const svg = document.getElementById('gm-svg-overlay');
  if (!svg) return;
  svg.innerHTML = '';
  if (!bedId || !gardenBeds[bedId]) return;
  const selCrops = new Set(getCropsInBed(bedId));
  if (!selCrops.size) return;
  const sb = gardenBeds[bedId];
  const sx = ((sb.x||0) + (sb.cols||4)/2) * TILE_SIZE;
  const sy = ((sb.y||0) + (sb.rows||2)/2) * TILE_SIZE;
  for (const [oid, ob] of Object.entries(gardenBeds)) {
    if (oid === bedId) continue;
    const oc = getCropsInBed(oid);
    if (!oc.length) continue;
    let rel = 'neutral';
    loop: for (const a of selCrops) for (const b of oc) {
      const ad = cropData[a], bd = cropData[b];
      if (ad?.avoid?.includes(b) || bd?.avoid?.includes(a)) { rel = 'bad'; break loop; }
      if ((ad?.companions?.includes(b) || bd?.companions?.includes(a)) && rel !== 'bad') rel = 'good';
    }
    if (rel === 'neutral') continue;
    const cx = ((ob.x||0)+(ob.cols||4)/2)*TILE_SIZE, cy = ((ob.y||0)+(ob.rows||2)/2)*TILE_SIZE;
    const el = document.createElementNS('http://www.w3.org/2000/svg','line');
    el.setAttribute('x1',sx); el.setAttribute('y1',sy);
    el.setAttribute('x2',cx); el.setAttribute('y2',cy);
    el.setAttribute('class', rel==='good' ? 'gm-companion-line--good' : 'gm-companion-line--bad');
    svg.appendChild(el);
  }
}

// Returns {left, top, width, height, fontSize} for crop at index idx within a bed
function _cropGridCell(idx, count, bedCols, bedRows) {
  const availW = bedCols * TILE_SIZE;
  const availH = bedRows * TILE_SIZE - 25; // exclude label (22px) + cap bar (3px)
  const gCols  = count === 1 ? 1 : Math.min(bedCols, Math.max(1, Math.round(Math.sqrt(count * availW / Math.max(1, availH)))));
  const gRows  = Math.ceil(count / gCols);
  const c = idx % gCols, r = Math.floor(idx / gCols);
  const cellW = availW / gCols, cellH = availH / gRows;
  return {
    left: c * cellW, top: 22 + r * cellH, width: cellW, height: cellH,
    fontSize: Math.max(11, Math.min(38, Math.min(cellW, cellH) * 0.60))
  };
}

function renderMinimap() {
  const mc = document.getElementById('gm-minimap');
  if (!mc) return;
  const ctx = mc.getContext('2d');
  const W = mc.width, H = mc.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#111a0a'; ctx.fillRect(0,0,W,H);
  const sx = W / (gardenCanvas.cols * TILE_SIZE), sy = H / (gardenCanvas.rows * TILE_SIZE);
  for (const [id, bed] of Object.entries(gardenBeds)) {
    const x=(bed.x||0)*TILE_SIZE*sx, y=(bed.y||0)*TILE_SIZE*sy;
    const w=(bed.cols||4)*TILE_SIZE*sx, h=(bed.rows||2)*TILE_SIZE*sy;
    ctx.fillStyle = (bed.color||'#2d5a27')+'99';
    ctx.strokeStyle = bed.color||'#2d5a27'; ctx.lineWidth = 0.5;
    ctx.fillRect(x,y,w,h); ctx.strokeRect(x,y,w,h);
    if (id === _mapSelectedBed) {
      ctx.strokeStyle='#78c87a'; ctx.lineWidth=1.5;
      ctx.strokeRect(x-1,y-1,w+2,h+2);
    }
  }
  const sc = document.getElementById('gm-canvas-scroll');
  if (sc) {
    ctx.strokeStyle='rgba(255,255,255,0.45)'; ctx.lineWidth=1;
    ctx.strokeRect(
      sc.scrollLeft/_mapZoom*sx, sc.scrollTop/_mapZoom*sy,
      sc.clientWidth/_mapZoom*sx, sc.clientHeight/_mapZoom*sy
    );
  }
}

function renderGardenMapCanvas() {
  const canvas = document.getElementById('gm-canvas'); if (!canvas) return;
  canvas.style.width  = gardenCanvas.cols * TILE_SIZE + 'px';
  canvas.style.height = gardenCanvas.rows * TILE_SIZE + 'px';
  let html = '<div id="gm-boundary" class="gm-boundary"></div>';
  for (const id of Object.keys(gardenStructures)) html += renderMapStructHTML(id);
  for (const id of Object.keys(gardenBeds))       html += renderMapBedHTML(id);
  canvas.innerHTML = html;
  const sizeEl = document.getElementById('gm-canvas-size');
  if (sizeEl) sizeEl.textContent = `${gardenCanvas.cols}×${gardenCanvas.rows}`;
  // Ensure SVG overlay exists in canvas
  if (!document.getElementById('gm-svg-overlay')) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.id = 'gm-svg-overlay'; svg.className = 'gm-svg-overlay';
    canvas.appendChild(svg);
  }
  applyMapZoom();
  renderCompanionLines(_mapSelectedBed);
  renderMinimap();
  _updateUndoBtns();
  if (_mapSeasonMode) canvas.classList.add('gm-season-active');
  // Weather badge (T3) — lives in canvas-scroll, not canvas, so survives innerHTML reset
  const _wbSc = document.getElementById('gm-canvas-scroll');
  let _wb = document.getElementById('gm-weather-badge');
  if (!_wb && _wbSc) { _wb = document.createElement('div'); _wb.id = 'gm-weather-badge'; _wbSc.appendChild(_wb); }
  if (_wb) {
    if (weatherData?.current) {
      const { temperature_2m: _wt, weather_code: _wcode } = weatherData.current;
      const _wtemp = useMetric ? `${Math.round(_wt)}°C` : `${Math.round(_wt * 9/5 + 32)}°F`;
      _wb.innerHTML = `${getWmoIcon(_wcode)} <span class="gm-wx-temp">${_wtemp}</span>`;
      _wb.hidden = false;
    } else { _wb.hidden = true; }
  }
  renderGardenMapDetail();
  wireGardenMap();
}

function renderMapBedHTML(id) {
  const bed = gardenBeds[id];
  if (!bed) return '';
  const cols  = bed.cols  || 4;
  const rows  = bed.rows  || 2;
  const x     = bed.x    || 0;
  const y     = bed.y    || 0;
  const color = bed.color || '#2d5a27';
  const selected = _mapSelectedBed === id;

  const allCrops = getCropsInBed(id);
  // Merge stored order with current crops (handle adds/removes between sessions)
  const stored = (bed.cropOrder || []).filter(n => allCrops.includes(n));
  const extra  = allCrops.filter(n => !stored.includes(n));
  const ordered = [...stored, ...extra];
  const count = ordered.length;

  const cropHtml = ordered.map((name, idx) => {
    const cell = _cropGridCell(idx, count, cols, rows);
    const s    = getGardenStatus(name);
    const cls  = s?.type === 'ready' ? ' gm-cell--ready' : s?.type === 'growing' ? ' gm-cell--growing' : '';
    const em   = cropData[name]?.emoji || '🌱';
    return `<div class="gm-crop-cell${cls}" data-bed="${id}" data-crop="${name}"
      style="left:${cell.left}px;top:${cell.top}px;width:${cell.width}px;height:${cell.height}px;flex-direction:column">
      <span class="gm-crop-name">${name}</span>
      <span class="gm-crop-cell-emoji" style="font-size:${cell.fontSize}px" title="${name}">${em}</span>
    </div>`;
  }).join('');

  const cap    = cols * rows;
  const pct    = count ? Math.min(100, Math.round((count / cap) * 100)) : 0;
  const capBar = count ? `<div class="gm-cap-bar"><div class="gm-cap-bar-fill" style="width:${pct}%"></div></div>` : '';

  return `<div class="gm-bed gm-bed--${bed.type || 'raised'}${selected ? ' gm-bed--selected' : ''}" data-bed="${id}"
    style="left:${x*TILE_SIZE}px;top:${y*TILE_SIZE}px;width:${cols*TILE_SIZE}px;height:${rows*TILE_SIZE}px;--bed-color:${color}">
    <div class="gm-bed-label">${bed.emoji} ${bed.name.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</div>
    ${cropHtml}
    ${capBar}
    <div class="gm-resize-handle" data-bed="${id}"></div>
  </div>`;
}

function renderMapStructHTML(id) {
  const s = gardenStructures[id]; if (!s) return '';
  const t = STRUCTURE_TYPES[s.type] || STRUCTURE_TYPES['shed'];
  const selected = _mapSelectedStruct === id;
  return `<div class="gm-struct ${t.cssClass}${selected ? ' gm-struct--selected' : ''}" data-struct="${id}"
    style="left:${s.x*TILE_SIZE}px;top:${s.y*TILE_SIZE}px;width:${s.cols*TILE_SIZE}px;height:${s.rows*TILE_SIZE}px;border-color:${s.color}">
    <div class="gm-bed-label">${t.emoji} ${s.name.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</div>
    <div class="gm-struct-body-emoji">${t.emoji}</div>
    <div class="gm-resize-handle" data-struct="${id}"></div>
  </div>`;
}

function renderGardenMapDetail() {
  const detail = document.getElementById('gm-bed-detail');
  if (!detail) return;
  if (_mapSelectedStruct) { renderGardenMapStructDetail(); return; }
  if (!_mapSelectedBed || !gardenBeds[_mapSelectedBed]) {
    detail.hidden = true;
    const ph = document.getElementById('gm-panel-placeholder');
    if (ph) ph.hidden = false;
    return;
  }
  const id = _mapSelectedBed;
  const bed = gardenBeds[id];
  const cols = bed.cols || 4;
  const rows = bed.rows || 2;

  function renderBedDetailCrops() {
    const assigned = getCropsInBed(id);
    const el = document.getElementById('gm-crop-chips-list');
    if (!el) return;
    if (!assigned.length) {
      el.innerHTML = '<span class="gm-crops-empty">No crops yet — search below to add one</span>';
      return;
    }
    el.innerHTML = assigned.map(name => {
      const em = cropData[name]?.emoji || '🌱';
      const s = getGardenStatus(name);
      const dotCls = s?.type === 'ready' ? 'gm-chip-dot--ready' : s?.type === 'growing' ? 'gm-chip-dot--growing' : '';
      const statusLabel = s?.type === 'ready' ? 'Ready' : s?.type === 'growing' ? 'Growing' : '';
      const issues = getBedCompatibility(id, name);
      const warn = issues.length ? ` <span class="gm-compat-warn" title="${issues.join('\n')}">⚠️</span>` : '';
      return `<button class="gm-crop-chip-v2" data-crop="${name}">
        <span class="gm-chip-em">${em}</span>
        <span class="gm-chip-body">
          <span class="gm-chip-name">${name.replace(/&/g,'&amp;')}${warn}</span>
          ${statusLabel ? `<span class="gm-chip-status ${dotCls}">${statusLabel}</span>` : ''}
        </span>
        <button class="gm-crop-chip-x" data-crop="${name}" aria-label="Remove">×</button>
      </button>`;
    }).join('');
    el.querySelectorAll('.gm-crop-chip-v2').forEach(chip => {
      chip.addEventListener('click', e => {
        if (e.target.classList.contains('gm-crop-chip-x')) return;
        openCropDetail(chip.dataset.crop);
      });
    });
    el.querySelectorAll('.gm-crop-chip-x').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        removeCropFromBed(btn.dataset.crop, id);
        renderBedDetailCrops();
        renderGardenMapCanvas();
      });
    });
  }

  function renderBedCropSuggestions(query) {
    const inBed = new Set(getCropsInBed(id));
    const q = query.toLowerCase().trim();
    const inGarden = new Set(Object.keys(myGarden));
    const all = Object.keys(cropData || {});
    let candidates = [
      ...Object.keys(myGarden).filter(n => !inBed.has(n)),
      ...all.filter(n => !inGarden.has(n) && !inBed.has(n))
    ].filter((n, i, a) => a.indexOf(n) === i);
    if (q) candidates = candidates.filter(n => n.toLowerCase().includes(q));
    if (bed.type === 'container')
      candidates.sort((a,b) => (cropData[b]?.container_ok?1:0) - (cropData[a]?.container_ok?1:0));
    candidates = candidates.slice(0, 10);
    // Portal to body so overflow-y:auto on the panel can't clip it
    let el = document.getElementById('gm-crop-suggestions');
    if (!el) {
      el = document.createElement('div');
      el.id = 'gm-crop-suggestions'; el.className = 'gm-crop-suggestions';
      el.hidden = true; document.body.appendChild(el);
    }
    const showCreate = q && !cropData[q] && !myGarden[q];
    const items = candidates.map(n => {
      const inG = inGarden.has(n);
      const s = inG ? getGardenStatus(n) : null;
      const tagCls = s?.type === 'ready' ? ' gm-sugg-tag--ready' : s?.type === 'growing' ? ' gm-sugg-tag--growing' : inG ? ' gm-sugg-tag--saved' : ' gm-sugg-tag--new';
      const tagTxt = inG ? (s?.type === 'ready' ? '● Ready' : s?.type === 'growing' ? '● Growing' : 'In garden ★') : '＋ New';
      return `<button class="gm-crop-sugg" data-crop="${n}">
        <span class="gm-sugg-em">${cropData[n]?.emoji || '🌱'}</span>
        <span class="gm-sugg-label">
          <span class="gm-sugg-name">${n}</span>
          <span class="gm-sugg-tag${tagCls}">${tagTxt}</span>
        </span>
      </button>`;
    }).join('');
    el.innerHTML = items + (showCreate ? `<button class="gm-crop-sugg gm-crop-sugg--create" data-crop="${q}">＋ Add "${q}"</button>` : '');
    el.hidden = !(items || showCreate);
    // Position as fixed to escape overflow-y:auto clip on the right panel
    if (!el.hidden) {
      const inp = document.getElementById('gm-crop-search');
      if (inp) {
        const r = inp.getBoundingClientRect();
        Object.assign(el.style, { position:'fixed', top:(r.bottom+4)+'px', left:r.left+'px', right:'auto', width:r.width+'px', zIndex:'9999', maxHeight:'220px' });
      }
    }

    el.querySelectorAll('.gm-crop-sugg').forEach(btn => {
      btn.addEventListener('click', () => {
        const crop = btn.dataset.crop;
        document.getElementById('gm-crop-search').value = '';
        el.hidden = true;
        // Add to garden first if needed, then assign to bed — no modal
        if (!myGarden[crop]) gardenAdd(crop);
        addCropToBed(crop, id);
        renderBedDetailCrops();
        renderGardenMapCanvas();
      });
    });
  }

  detail.hidden = false;
  const _ph = document.getElementById('gm-panel-placeholder');
  if (_ph) _ph.hidden = true;
  const BED_SWATCHES = ['#3d6b35','#5c8a4a','#8b5e3c','#c17f3e','#4a6741','#2d5a6b','#6b4a6b','#5a3a2d','#7a6b3d','#2d6b5a','#6b2d2d','#4a4a6b'];
  const bedColor = bed.color || '#3d6b35';
  const swatchHtml = BED_SWATCHES.map(c =>
    `<button class="gm-color-swatch${c===bedColor?' gm-color-swatch--sel':''}" data-color="${c}" style="--sw:${c}" aria-label="${c}"></button>`
  ).join('');
  detail.innerHTML = `<div class="gm-detail-header">
    <input class="bed-name-input" id="gm-bed-name-edit" type="text" value="${bed.name.replace(/"/g,'&quot;')}" maxlength="30">
    <input type="text" id="gm-bed-emoji-edit" value="${bed.emoji}" maxlength="4" style="background:none;border:none;border-bottom:1px solid var(--border);color:var(--text);font-size:18px;width:32px;padding:2px;outline:none">
    <button class="bed-delete-btn" id="gm-bed-delete-btn" title="Delete bed">🗑</button>
  </div>
  ${bed.type === 'container' ? '<div class="gm-container-hint">🪣 Container-friendly crops sorted first</div>' : ''}
  <div class="gm-crop-add" style="padding:0 14px 6px">
    <input class="gm-crop-search" id="gm-crop-search" type="text" placeholder="＋ Add crop…" autocomplete="off">
  </div>
  <div class="gm-crop-chips" id="gm-crop-chips-list" style="padding:0 14px 6px"></div>
  <details class="gm-bed-settings" open>
    <summary>⚙ Bed settings</summary>
    <div class="gm-bed-settings-body">
      <div class="gm-color-swatches" id="gm-color-swatches">${swatchHtml}</div>
      <div class="bed-resize-group">
        <button class="bed-resize-btn" data-dir="cols" data-delta="-1">−</button>
        <span class="bed-resize-label" id="gm-size-label">${cols}×${rows}</span>
        <button class="bed-resize-btn" data-dir="cols" data-delta="1">＋</button>
        <span class="bed-resize-label">cols</span>
        <button class="bed-resize-btn" data-dir="rows" data-delta="-1">−</button>
        <button class="bed-resize-btn" data-dir="rows" data-delta="1">＋</button>
        <span class="bed-resize-label">rows</span>
      </div>
      <details class="gm-micro" id="gm-micro-details" open>
        <summary class="gm-micro-summary">☀️ Microclimate</summary>
        <div class="gm-micro-body">
          <div class="gm-micro-row">
            <span class="gm-micro-label">Sun</span>
            <input type="range" min="0" max="12" step="0.5" value="${bed.sunHours ?? 6}" id="gm-sun-hrs" class="gm-micro-range">
            <span class="gm-micro-val" id="gm-sun-val">${bed.sunHours ?? 6}h</span>
          </div>
          <div class="gm-micro-row">
            <span class="gm-micro-label">Soil pH</span>
            <input type="number" min="4" max="9" step="0.1" value="${bed.soilPh || ''}" placeholder="6.5" id="gm-soil-ph" class="gm-micro-ph">
          </div>
        </div>
      </details>
    </div>
  </details>`;

  document.getElementById('gm-bed-name-edit')?.addEventListener('blur', e => {
    const v = e.target.value.trim();
    if (v) { bed.name = v; saveBeds(); renderGardenMapCanvas(); }
  });
  document.getElementById('gm-bed-emoji-edit')?.addEventListener('blur', e => {
    const v = e.target.value.trim();
    if (v) { bed.emoji = v; saveBeds(); renderGardenMapCanvas(); }
  });
  detail.querySelectorAll('.gm-color-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = btn.dataset.color;
      bed.color = c; saveBeds();
      document.querySelector(`.gm-bed[data-bed="${id}"]`)?.style.setProperty('--bed-color', c);
      detail.querySelectorAll('.gm-color-swatch').forEach(s =>
        s.classList.toggle('gm-color-swatch--sel', s.dataset.color === c));
    });
  });
  detail.querySelectorAll('.bed-resize-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.dir;
      const delta = Number(btn.dataset.delta);
      resizeBed(id, dir === 'cols' ? delta : 0, dir === 'rows' ? delta : 0);
    });
  });
  document.getElementById('gm-bed-delete-btn')?.addEventListener('click', () => {
    if (confirm(`Delete "${bed.name}"?`)) {
      _mapSelectedBed = null;
      removeBed(id);
      renderGardenMapCanvas();
    }
  });

  renderBedDetailCrops();

  const searchEl = document.getElementById('gm-crop-search');
  searchEl?.addEventListener('input', debounce(e => renderBedCropSuggestions(e.target.value), 200));
  searchEl?.addEventListener('focus', e => renderBedCropSuggestions(e.target.value));
  document.addEventListener('pointerdown', function hideSugg(e) {
    if (!e.target.closest('.gm-crop-add')) {
      const el = document.getElementById('gm-crop-suggestions');
      if (el) el.hidden = true;
      document.removeEventListener('pointerdown', hideSugg);
    }
  });

  const sunEl = document.getElementById('gm-sun-hrs');
  const sunVal = document.getElementById('gm-sun-val');
  sunEl?.addEventListener('input', () => {
    sunVal.textContent = sunEl.value + 'h';
    saveBedNotes(id, 'sunHours', parseFloat(sunEl.value));
    renderBedDetailCrops();
  });
  document.getElementById('gm-soil-ph')?.addEventListener('change', e => {
    saveBedNotes(id, 'soilPh', e.target.value);
    renderBedDetailCrops();
  });
}

function renderGardenMapStructDetail() {
  const detail = document.getElementById('gm-bed-detail');
  if (!detail) return;
  if (!_mapSelectedStruct || !gardenStructures[_mapSelectedStruct]) {
    detail.hidden = true;
    const ph = document.getElementById('gm-panel-placeholder');
    if (ph) ph.hidden = false;
    return;
  }
  const id = _mapSelectedStruct;
  const s = gardenStructures[id];
  const t = STRUCTURE_TYPES[s.type] || STRUCTURE_TYPES['shed'];
  detail.hidden = false;
  const phS = document.getElementById('gm-panel-placeholder');
  if (phS) phS.hidden = true;
  detail.innerHTML = `<div class="gm-detail-header">
    <input class="bed-name-input" id="gm-struct-name-edit" type="text" value="${s.name.replace(/"/g,'&quot;')}" maxlength="30">
    <span class="gm-struct-type-label">${t.emoji} ${t.label}</span>
    <div class="bed-resize-group">
      <button class="bed-resize-btn" data-dir="cols" data-delta="-1">−</button>
      <span class="bed-resize-label" id="gm-struct-size-label">${s.cols}×${s.rows}</span>
      <button class="bed-resize-btn" data-dir="cols" data-delta="1">＋</button>
      <span class="bed-resize-label">cols</span>
      <button class="bed-resize-btn" data-dir="rows" data-delta="-1">−</button>
      <button class="bed-resize-btn" data-dir="rows" data-delta="1">＋</button>
      <span class="bed-resize-label">rows</span>
    </div>
    <button class="bed-delete-btn" id="gm-struct-delete-btn" title="Delete structure">🗑</button>
  </div>`;
  document.getElementById('gm-struct-name-edit')?.addEventListener('blur', e => {
    const v = e.target.value.trim();
    if (v) { s.name = v; saveStructures(); renderGardenMapCanvas(); }
  });
  detail.querySelectorAll('.bed-resize-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.dir;
      const delta = Number(btn.dataset.delta);
      resizeStructure(id, dir === 'cols' ? delta : 0, dir === 'rows' ? delta : 0);
    });
  });
  document.getElementById('gm-struct-delete-btn')?.addEventListener('click', () => {
    if (confirm(`Delete "${s.name}"?`)) removeStructure(id);
  });
}

function closeGardenMapModal() { document.getElementById('gm-modal-overlay')?.remove(); }

function openGardenMapModal(mode) {
  closeGardenMapModal();
  const types = mode === 'bed' ? BED_TYPES : STRUCTURE_TYPES;
  const typeKeys = Object.keys(types);
  let selectedType = typeKeys[0];
  const title = mode === 'bed' ? 'Add Bed' : 'Add Structure';
  const typeBtns = typeKeys.map((k, i) => {
    const t = types[k];
    return `<button class="gm-modal-type-btn${i === 0 ? ' gm-modal-type-btn--active' : ''}" data-type="${k}">
      <span class="gm-modal-type-emoji">${t.emoji}</span>
      <span class="gm-modal-type-label">${t.label}</span>
    </button>`;
  }).join('');
  const overlay = document.createElement('div');
  overlay.id = 'gm-modal-overlay';
  overlay.className = 'gm-modal-overlay';
  overlay.innerHTML = `<div class="gm-modal">
    <div class="gm-modal-header">
      <span class="gm-modal-title">${title}</span>
      <button class="gm-modal-close-btn" id="gm-modal-x">✕</button>
    </div>
    <div class="gm-modal-type-grid">${typeBtns}</div>
    <input class="gm-modal-name-input" id="gm-modal-name" type="text" placeholder="${types[selectedType].label} name (optional)" maxlength="30">
    <div class="gm-modal-footer">
      <button class="gm-modal-cancel-btn" id="gm-modal-cancel">Cancel</button>
      <button class="gm-modal-add-btn" id="gm-modal-add">Add →</button>
    </div>
  </div>`;
  document.getElementById('garden-map-overlay').appendChild(overlay);

  const nameInput = overlay.querySelector('#gm-modal-name');
  overlay.querySelectorAll('.gm-modal-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.gm-modal-type-btn').forEach(b => b.classList.remove('gm-modal-type-btn--active'));
      btn.classList.add('gm-modal-type-btn--active');
      selectedType = btn.dataset.type;
      nameInput.placeholder = types[selectedType].label + ' name (optional)';
    });
  });

  const doAdd = () => {
    const name = nameInput.value.trim();
    if (mode === 'bed') addBed(name, selectedType);
    else addStructure(name, selectedType);
  };
  overlay.querySelector('#gm-modal-add').addEventListener('click', doAdd);
  nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });
  overlay.querySelector('#gm-modal-cancel').addEventListener('click', closeGardenMapModal);
  overlay.querySelector('#gm-modal-x').addEventListener('click', closeGardenMapModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeGardenMapModal(); });
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') { closeGardenMapModal(); document.removeEventListener('keydown', escHandler); }
  });
  nameInput.focus();
}

function _startCropDrag(bedId, cropName, e) {
  e.stopPropagation(); e.preventDefault();
  _cropDrag = { bedId, cropName, startX: e.clientX, startY: e.clientY, moved: false, overCrop: null };
  document.addEventListener('pointermove', _onCropDragMove);
  document.addEventListener('pointerup',   _onCropDragEnd, { once: true });
  document.addEventListener('pointercancel', _onCropDragEnd, { once: true });
}
function _onCropDragMove(e) {
  if (!_cropDrag) return;
  const dx = e.clientX - _cropDrag.startX, dy = e.clientY - _cropDrag.startY;
  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) _cropDrag.moved = true;
  if (!_cropDrag.moved) return;
  const under = document.elementsFromPoint(e.clientX, e.clientY);
  const tgt   = under.find(el => el.classList.contains('gm-crop-cell') && el.dataset.bed === _cropDrag.bedId && el.dataset.crop !== _cropDrag.cropName);
  document.querySelectorAll('.gm-crop-cell--drop-target').forEach(el => el.classList.remove('gm-crop-cell--drop-target'));
  if (tgt) tgt.classList.add('gm-crop-cell--drop-target');
  _cropDrag.overCrop = tgt?.dataset.crop || null;
}
function _onCropDragEnd() {
  document.removeEventListener('pointermove', _onCropDragMove);
  document.querySelectorAll('.gm-crop-cell--drop-target').forEach(el => el.classList.remove('gm-crop-cell--drop-target'));
  if (_cropDrag?.moved && _cropDrag.overCrop) {
    const bed = gardenBeds[_cropDrag.bedId];
    if (bed) {
      if (!bed.cropOrder) bed.cropOrder = getCropsInBed(_cropDrag.bedId);
      const a = _cropDrag.cropName, b = _cropDrag.overCrop;
      const ia = bed.cropOrder.indexOf(a), ib = bed.cropOrder.indexOf(b);
      if (ia >= 0 && ib >= 0) [bed.cropOrder[ia], bed.cropOrder[ib]] = [bed.cropOrder[ib], bed.cropOrder[ia]];
      else if (ia < 0) bed.cropOrder.splice(ib, 0, a);
      saveBeds(); renderGardenMapCanvas();
    }
  }
  _cropDrag = null;
}

function wireGardenMap() {
  document.getElementById('gm-close-btn')?.addEventListener('click', closeGardenMap);

  document.getElementById('gm-add-bed-btn')?.addEventListener('click', () => openGardenMapModal('bed'));
  document.getElementById('gm-add-struct-btn')?.addEventListener('click', () => openGardenMapModal('struct'));

  document.querySelectorAll('.gm-canvas-resize-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dim = btn.dataset.dim;
      const delta = Number(btn.dataset.delta);
      gardenCanvas[dim] = Math.max(5, Math.min(40, gardenCanvas[dim] + delta));
      for (const bed of Object.values(gardenBeds)) {
        bed.x = Math.max(0, Math.min(gardenCanvas.cols - (bed.cols || 4), bed.x || 0));
        bed.y = Math.max(0, Math.min(gardenCanvas.rows - (bed.rows || 2), bed.y || 0));
      }
      for (const s of Object.values(gardenStructures)) {
        s.x = Math.max(0, Math.min(gardenCanvas.cols - (s.cols || 2), s.x || 0));
        s.y = Math.max(0, Math.min(gardenCanvas.rows - (s.rows || 2), s.y || 0));
      }
      saveCanvas(); saveBeds(); saveStructures();
      renderGardenMapCanvas();
    });
  });

  document.querySelectorAll('.gm-resize-handle').forEach(el => {
    el.addEventListener('pointerdown', e => {
      if (el.dataset.bed) startResizeDrag('bed', el.dataset.bed, e);
      else if (el.dataset.struct) startResizeDrag('struct', el.dataset.struct, e);
    });
  });

  document.querySelectorAll('.gm-bed').forEach(el => {
    el.addEventListener('pointerdown', e => {
      if (e.target.classList.contains('gm-resize-handle')) return;
      startBedDrag(el.dataset.bed, e);
    });
  });

  document.querySelectorAll('.gm-struct').forEach(el => {
    el.addEventListener('pointerdown', e => {
      if (e.target.classList.contains('gm-resize-handle')) return;
      startStructDrag(el.dataset.struct, e);
    });
  });

  document.querySelectorAll('.gm-crop-cell').forEach(el => {
    el.addEventListener('pointerdown', e => _startCropDrag(el.dataset.bed, el.dataset.crop, e));
  });

  // Zoom buttons
  document.getElementById('gm-zoom-in')?.addEventListener('click', () => {
    const i = ZOOM_STEPS.findIndex(z => z >= _mapZoom);
    _mapZoom = ZOOM_STEPS[Math.min(ZOOM_STEPS.length-1, i+1)];
    applyMapZoom(); renderMinimap();
  });
  document.getElementById('gm-zoom-out')?.addEventListener('click', () => {
    const i = ZOOM_STEPS.findIndex(z => z >= _mapZoom);
    _mapZoom = ZOOM_STEPS[Math.max(0, i-1)];
    applyMapZoom(); renderMinimap();
  });
  document.getElementById('gm-zoom-fit')?.addEventListener('click', () => {
    const sc = document.getElementById('gm-canvas-scroll');
    if (!sc) return;
    const ideal = Math.min(sc.clientWidth/(gardenCanvas.cols*TILE_SIZE), sc.clientHeight/(gardenCanvas.rows*TILE_SIZE), 2);
    _mapZoom = ZOOM_STEPS.reduce((b,z) => Math.abs(z-ideal)<Math.abs(b-ideal)?z:b);
    applyMapZoom(); renderMinimap();
  });
  // Season toggle
  document.getElementById('gm-season-btn')?.addEventListener('click', () => {
    _mapSeasonMode = !_mapSeasonMode;
    document.getElementById('gm-canvas')?.classList.toggle('gm-season-active', _mapSeasonMode);
    document.getElementById('gm-season-btn')?.classList.toggle('gm-tool-btn--active', _mapSeasonMode);
  });
  // Undo / redo buttons
  document.getElementById('gm-undo-btn')?.addEventListener('click', () => _popUndoSnap(false));
  document.getElementById('gm-redo-btn')?.addEventListener('click', () => _popUndoSnap(true));
  // Keyboard shortcuts — attach once
  const ov = document.getElementById('garden-map-overlay');
  if (!ov._kbAttached) {
    ov._kbAttached = true;
    document.addEventListener('keydown', e => {
      if (ov.hidden) return;
      if ((e.ctrlKey||e.metaKey) && !e.shiftKey && e.key==='z') { e.preventDefault(); _popUndoSnap(false); }
      if ((e.ctrlKey||e.metaKey) && ((e.shiftKey && e.key==='z') || e.key==='y')) { e.preventDefault(); _popUndoSnap(true); }
    });
  }
  // Minimap click-to-scroll
  document.getElementById('gm-minimap')?.addEventListener('click', e => {
    const mc = e.currentTarget, rect = mc.getBoundingClientRect();
    const mx = (e.clientX-rect.left)/mc.width, my = (e.clientY-rect.top)/mc.height;
    const sc = document.getElementById('gm-canvas-scroll');
    if (sc) {
      sc.scrollLeft = mx*gardenCanvas.cols*TILE_SIZE*_mapZoom - sc.clientWidth/2;
      sc.scrollTop  = my*gardenCanvas.rows*TILE_SIZE*_mapZoom - sc.clientHeight/2;
    }
  });
  document.getElementById('gm-canvas-scroll')?.addEventListener('scroll', throttle(renderMinimap, 80), { passive: true });
  // Draw-to-add & print (guarded against re-attachment)
  const _drawBtn = document.getElementById('gm-draw-btn');
  if (_drawBtn && !_drawBtn._attached) { _drawBtn._attached = true; _drawBtn.addEventListener('click', _toggleDrawMode); }
  const _printBtn = document.getElementById('gm-print-btn');
  if (_printBtn && !_printBtn._attached) { _printBtn._attached = true; _printBtn.addEventListener('click', () => window.print()); }
  // Help / shortcuts panel toggle
  const _helpBtn = document.getElementById('gm-help-btn');
  if (_helpBtn && !_helpBtn._attached) {
    _helpBtn._attached = true;
    _helpBtn.addEventListener('click', e => {
      e.stopPropagation();
      const p = document.getElementById('gm-shortcuts-panel');
      if (p) p.hidden = !p.hidden;
    });
  }
  const _ov = document.getElementById('garden-map-overlay');
  if (_ov && !_ov._shortcutsAttached) {
    _ov._shortcutsAttached = true;
    _ov.addEventListener('click', e => {
      if (!e.target.closest('#gm-help-btn,#gm-shortcuts-panel')) {
        const p = document.getElementById('gm-shortcuts-panel');
        if (p) p.hidden = true;
      }
    });
  }

  const _csc = document.getElementById('gm-canvas-scroll');
  if (_csc && !_csc._drawAttached) {
    _csc._drawAttached = true;
    _csc.addEventListener('pointerdown', e => {
      if (!_drawMode) return;
      if (e.target.closest('.gm-bed,.gm-struct,.gm-resize-handle')) return;
      e.preventDefault(); e.stopPropagation();
      const cz = document.getElementById('gm-canvas-zoom'); if (!cz) return;
      const rect = cz.getBoundingClientRect();
      const gx = Math.max(0, Math.floor((e.clientX - rect.left) / (TILE_SIZE * _mapZoom)));
      const gy = Math.max(0, Math.floor((e.clientY - rect.top)  / (TILE_SIZE * _mapZoom)));
      _drawDrag = { sx: gx, sy: gy, ex: gx, ey: gy };
      _updateDrawPreview();
      _csc.setPointerCapture(e.pointerId);
    }, { capture: true });
    _csc.addEventListener('pointermove', e => {
      if (!_drawDrag) return;
      const cz = document.getElementById('gm-canvas-zoom'); if (!cz) return;
      const rect = cz.getBoundingClientRect();
      _drawDrag.ex = Math.max(_drawDrag.sx, Math.floor((e.clientX - rect.left) / (TILE_SIZE * _mapZoom)));
      _drawDrag.ey = Math.max(_drawDrag.sy, Math.floor((e.clientY - rect.top)  / (TILE_SIZE * _mapZoom)));
      _updateDrawPreview();
    });
    _csc.addEventListener('pointerup', e => {
      if (!_drawDrag) return;
      const cols = Math.max(1, _drawDrag.ex - _drawDrag.sx + 1);
      const rows = Math.max(1, _drawDrag.ey - _drawDrag.sy + 1);
      _pendingDrawPos = { x: _drawDrag.sx, y: _drawDrag.sy, cols, rows };
      _drawDrag = null; _removeDrawPreview();
      _toggleDrawMode(false);
      openGardenMapModal('bed');
    });
  }
}

function startBedDrag(bedId, e) {
  e.preventDefault(); e.stopPropagation();
  const bed = gardenBeds[bedId];
  if (!bed) return;
  _drag = {
    bedId,
    startX: e.clientX, startY: e.clientY,
    startBedX: bed.x || 0, startBedY: bed.y || 0,
    moved: false
  };
  document.addEventListener('pointermove', onBedDragMove);
  document.addEventListener('pointerup', onBedDragEnd, { once: true });
  document.addEventListener('pointercancel', onBedDragEnd, { once: true });
}

function onBedDragMove(e) {
  if (!_drag) return;
  const bed = gardenBeds[_drag.bedId];
  if (!bed) return;
  const dx = e.clientX - _drag.startX;
  const dy = e.clientY - _drag.startY;
  if (Math.abs(dx) > 6 || Math.abs(dy) > 6) _drag.moved = true;
  if (!_drag.moved) return;
  bed.x = Math.max(0, Math.min(gardenCanvas.cols - (bed.cols || 4), Math.round(_drag.startBedX + dx / (TILE_SIZE * _mapZoom))));
  bed.y = Math.max(0, Math.min(gardenCanvas.rows - (bed.rows || 2), Math.round(_drag.startBedY + dy / (TILE_SIZE * _mapZoom))));
  const el = document.querySelector(`.gm-bed[data-bed="${_drag.bedId}"]`);
  if (el) { el.style.left = bed.x * TILE_SIZE + 'px'; el.style.top = bed.y * TILE_SIZE + 'px'; }
}

function onBedDragEnd() {
  document.removeEventListener('pointermove', onBedDragMove);
  if (_drag?.moved) { saveBeds(); pushUndoSnapshot(); }
  else if (_drag) selectMapBed(_drag.bedId);
  _drag = null;
}

function startStructDrag(structId, e) {
  e.preventDefault(); e.stopPropagation();
  const s = gardenStructures[structId]; if (!s) return;
  _structureDrag = { structId, startX: e.clientX, startY: e.clientY,
    startSX: s.x || 0, startSY: s.y || 0, moved: false };
  document.addEventListener('pointermove', onStructDragMove);
  document.addEventListener('pointerup', onStructDragEnd, { once: true });
  document.addEventListener('pointercancel', onStructDragEnd, { once: true });
}
function onStructDragMove(e) {
  if (!_structureDrag) return;
  const s = gardenStructures[_structureDrag.structId]; if (!s) return;
  const dx = e.clientX - _structureDrag.startX, dy = e.clientY - _structureDrag.startY;
  if (Math.abs(dx) > 6 || Math.abs(dy) > 6) _structureDrag.moved = true;
  if (!_structureDrag.moved) return;
  s.x = Math.max(0, Math.min(gardenCanvas.cols - s.cols, Math.round(_structureDrag.startSX + dx / (TILE_SIZE * _mapZoom))));
  s.y = Math.max(0, Math.min(gardenCanvas.rows - s.rows, Math.round(_structureDrag.startSY + dy / (TILE_SIZE * _mapZoom))));
  const el = document.querySelector(`.gm-struct[data-struct="${_structureDrag.structId}"]`);
  if (el) { el.style.left = s.x * TILE_SIZE + 'px'; el.style.top = s.y * TILE_SIZE + 'px'; }
}
function onStructDragEnd() {
  document.removeEventListener('pointermove', onStructDragMove);
  if (_structureDrag?.moved) saveStructures();
  else if (_structureDrag) selectMapStruct(_structureDrag.structId);
  _structureDrag = null;
}

function startResizeDrag(entityType, entityId, e) {
  e.preventDefault(); e.stopPropagation();
  const entity = entityType === 'bed' ? gardenBeds[entityId] : gardenStructures[entityId];
  if (!entity) return;
  _resizeDrag = { entityType, entityId,
    startX: e.clientX, startY: e.clientY,
    startCols: entity.cols, startRows: entity.rows };
  document.addEventListener('pointermove', onResizeDragMove);
  document.addEventListener('pointerup', onResizeDragEnd, { once: true });
  document.addEventListener('pointercancel', onResizeDragEnd, { once: true });
}
function onResizeDragMove(e) {
  if (!_resizeDrag) return;
  const { entityType, entityId, startX, startY, startCols, startRows } = _resizeDrag;
  const entity = entityType === 'bed' ? gardenBeds[entityId] : gardenStructures[entityId];
  if (!entity) return;
  const maxDim = entityType === 'bed' ? 12 : 20;
  const newCols = Math.max(1, Math.min(maxDim, startCols + Math.round((e.clientX - startX) / (TILE_SIZE * _mapZoom))));
  const newRows = Math.max(1, Math.min(maxDim, startRows + Math.round((e.clientY - startY) / (TILE_SIZE * _mapZoom))));
  if (newCols === entity.cols && newRows === entity.rows) return;
  entity.cols = newCols; entity.rows = newRows;
  entity.x = Math.max(0, Math.min(gardenCanvas.cols - entity.cols, entity.x || 0));
  entity.y = Math.max(0, Math.min(gardenCanvas.rows - entity.rows, entity.y || 0));
  if (entityType === 'bed') {
    for (const key of Object.keys(entity.cells || {})) {
      const [c, r] = key.split('-').map(Number);
      if (c >= entity.cols || r >= entity.rows) delete entity.cells[key];
    }
  }
  const sel = entityType === 'bed'
    ? `.gm-bed[data-bed="${entityId}"]`
    : `.gm-struct[data-struct="${entityId}"]`;
  const el = document.querySelector(sel);
  if (el) { el.style.width = entity.cols * TILE_SIZE + 'px'; el.style.height = entity.rows * TILE_SIZE + 'px'; }
}
function onResizeDragEnd() {
  document.removeEventListener('pointermove', onResizeDragMove);
  if (_resizeDrag) {
    if (_resizeDrag.entityType === 'bed') { saveBeds(); pushUndoSnapshot(); renderGardenMapCanvas(); }
    else { saveStructures(); pushUndoSnapshot(); renderGardenMapCanvas(); }
  }
  _resizeDrag = null;
}

function selectMapBed(bedId) {
  _mapSelectedStruct = null;
  document.querySelectorAll('.gm-struct').forEach(el => el.classList.remove('gm-struct--selected'));
  _mapSelectedBed = bedId;
  document.querySelectorAll('.gm-bed').forEach(el => {
    el.classList.toggle('gm-bed--selected', el.dataset.bed === bedId);
  });
  renderGardenMapDetail();
  renderCompanionLines(bedId);
  renderMinimap();
}

function selectMapStruct(structId) {
  _mapSelectedBed = null; _mapSelectedStruct = structId;
  document.querySelectorAll('.gm-bed').forEach(el => el.classList.remove('gm-bed--selected'));
  document.querySelectorAll('.gm-struct').forEach(el => {
    el.classList.toggle('gm-struct--selected', el.dataset.struct === structId);
  });
  renderGardenMapStructDetail();
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

// ── Phase 16 / 38: Notifications (web + Capacitor) ──
function _capNotifs() { return window.Capacitor?.isNativePlatform?.() ? window.Capacitor?.Plugins?.LocalNotifications : null; }

function notifGranted() {
  if (_capNotifs()) return _capNotifs()._granted === true;
  return 'Notification' in window && Notification.permission === 'granted';
}
function notifAvailable() {
  if (_capNotifs()) return _capNotifs()._granted !== false;
  return 'Notification' in window && Notification.permission !== 'denied';
}

// Stable numeric ID from a tag string (for Capacitor LocalNotifications)
function _tagToId(tag) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (Math.imul(31, h) + tag.charCodeAt(i)) | 0;
  return (Math.abs(h) % 99000) + 1;
}

function updateNotifBtn() {
  const btn = document.getElementById('notif-btn');
  if (!btn) return;
  if (!_capNotifs() && (!('Notification' in window) || Notification.permission === 'denied')) {
    btn.hidden = true; return;
  }
  btn.hidden = false;
  const on = notifGranted();
  btn.textContent = on ? '🔔' : '🔕';
  btn.title = on ? 'Notifications on' : 'Enable garden notifications';
  btn.classList.toggle('notif-on', on);
}

async function requestNotifPermission() {
  const ln = _capNotifs();
  if (ln) {
    try {
      const result = await ln.requestPermissions();
      ln._granted = result.display === 'granted';
      updateNotifBtn();
      if (ln._granted) { showToast('Garden notifications enabled ✓', 'success'); checkAndFireNotifications(); }
      else showToast('Notifications blocked in device settings', 'info');
    } catch { showToast('Notifications not available', 'info'); }
    return;
  }
  if (!('Notification' in window)) { showToast('Notifications not supported in this browser', 'info'); return; }
  if (Notification.permission === 'denied') { showToast('Notifications blocked — check browser Site settings', 'info'); return; }
  const result = await Notification.requestPermission();
  updateNotifBtn();
  if (result === 'granted') { showToast('Garden notifications enabled ✓', 'success'); checkAndFireNotifications(); }
}

async function fireNotif(title, body, tag) {
  if (!notifGranted()) return;
  announce(`${title}: ${body}`);
  const ln = _capNotifs();
  if (ln) {
    try {
      await ln.schedule({ notifications: [{
        id: _tagToId(tag), title, body,
        schedule: { at: new Date(Date.now() + 500) },
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#78c87a',
        extra: { tag },
      }]});
    } catch {}
    return;
  }
  const n = new Notification(title, {
    body, icon: '/garden-zones/icons/icon.svg',
    badge: '/garden-zones/icons/icon.svg', tag,
  });
  n.onclick = () => { window.focus(); n.close(); };
}

// Schedule a future notification (native only — no-op on web)
async function scheduleNotif(title, body, tag, atDate) {
  const ln = _capNotifs();
  if (!ln || !notifGranted()) return;
  try {
    await ln.cancel({ notifications: [{ id: _tagToId(tag) }] }).catch(() => {});
    await ln.schedule({ notifications: [{
      id: _tagToId(tag), title, body,
      schedule: { at: atDate },
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#78c87a',
      extra: { tag },
    }]});
  } catch {}
}

// ── Phase 37: In-app review prompt ───────────────
async function maybeRequestReview() {
  if (!window.Capacitor?.isNativePlatform?.()) return;
  if (localStorage.getItem('pzf-review-requested')) return;
  const count    = Object.keys(myGarden).length;
  const harvests = Object.values(myGarden).some(e => e.harvestLog?.length > 0);
  const journal5 = journalEntries.length >= 5;
  if (count < 3 && !harvests && !journal5) return;
  try {
    const InAppReview = window.Capacitor?.Plugins?.InAppReview;
    if (InAppReview) {
      await InAppReview.requestReview();
      localStorage.setItem('pzf-review-requested', '1');
    }
  } catch {}
}

// Phase 38: init LocalNotifications on native — check existing permission
async function initLocalNotifications() {
  const ln = _capNotifs();
  if (!ln) return;
  try {
    const status = await ln.checkPermissions();
    ln._granted = status.display === 'granted';
    updateNotifBtn();
    if (ln._granted) checkAndFireNotifications();
  } catch {}
  // Tap handler — bring app to focus
  try {
    ln.addListener('localNotificationActionPerformed', () => { window.focus(); });
  } catch {}
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
  if (frostIdx === 0) {
    // Tonight — fire immediately
    fireNotif(`❄️ Frost tonight — act now`, `Cover or bring in: ${ns}`, 'frost-risk');
  } else {
    // Tomorrow — schedule for 7am tomorrow (gives time to act in the morning)
    const tomorrow7am = new Date();
    tomorrow7am.setDate(tomorrow7am.getDate() + 1);
    tomorrow7am.setHours(7, 0, 0, 0);
    scheduleNotif(`❄️ Frost tomorrow — protect your plants`, `Cover or bring in: ${ns}`, 'frost-risk-tomorrow', tomorrow7am);
    // Also fire immediately as a heads-up
    fireNotif(`❄️ Frost tomorrow`, `Reminder set for 7am. Cover or bring in: ${ns}`, 'frost-risk');
  }
  localStorage.setItem('pzf-notif-frost', today);
}

function initNotifBtn() {
  updateNotifBtn();
  document.getElementById('notif-btn')?.addEventListener('click', async () => {
    if (notifGranted()) {
      showToast(_capNotifs()
        ? 'To disable, go to device Settings → Apps → Plant Zone Finder → Notifications'
        : 'To disable, go to browser Settings → Site permissions', 'info');
      return;
    }
    await requestNotifPermission();
  });
}

// ── Phase 47: Seasonal planting nudges ───────────
function checkSeasonalNudges() {
  if (!notifGranted() || !selectedZone) return;
  const frost = FROST_DATES[selectedZone.toLowerCase()];
  if (!frost) return;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const year  = today.getFullYear();
  for (const t of NUDGE_TRIGGERS) {
    const key = `pzf-nudge-${t.key}-${year}`;
    if (localStorage.getItem(key)) continue;
    const frostStr = t.frost === 'last' ? frost.last : frost.first;
    if (!frostStr) { localStorage.setItem(key, 'no-date'); continue; }
    const frostDate = parseFrostDate(frostStr);
    if (!frostDate) { localStorage.setItem(key, 'invalid'); continue; }
    const nudgeDate = new Date(frostDate);
    if (t.daysBefore) nudgeDate.setDate(nudgeDate.getDate() - t.daysBefore);
    else if (t.daysAfter) nudgeDate.setDate(nudgeDate.getDate() + t.daysAfter);
    nudgeDate.setHours(8, 0, 0, 0);
    const daysUntil = Math.round((nudgeDate - today) / 86400000);
    if (daysUntil < -7) {
      localStorage.setItem(key, 'past');
    } else if (daysUntil <= 0) {
      fireNotif(t.title, t.body, t.key);
      localStorage.setItem(key, 'fired');
    } else {
      scheduleNotif(t.title, t.body, t.key, nudgeDate);
      localStorage.setItem(key, 'scheduled');
    }
  }
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

  const bar = document.getElementById('saved-locations-bar');
  const activateSavedChip = e => {
    const removeBtn = e.target.closest('.saved-loc-remove');
    if (removeBtn) { removeSavedLocation(parseInt(removeBtn.dataset.id, 10)); return; }
    const chip = e.target.closest('.saved-loc-chip');
    if (chip) {
      const loc = savedLocations.find(l => l.id === parseInt(chip.dataset.id, 10));
      if (loc) restoreLocation(loc);
    }
  };
  bar?.addEventListener('click', activateSavedChip);
  bar?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateSavedChip(e); }
  });
}


// ── Phase 19: Calendar Export (.ics) ─────────────
function buildICS(events, calName) {
  const pad2 = n => String(n).padStart(2, '0');
  const icsDate = d => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
  const icsNow  = () => { const n = new Date(); return `${n.getFullYear()}${pad2(n.getMonth()+1)}${pad2(n.getDate())}T${pad2(n.getHours())}${pad2(n.getMinutes())}${pad2(n.getSeconds())}Z`; };
  const uid     = () => `${Date.now()}-${Math.random().toString(36).slice(2)}@plantzonefinder`;
  const esc     = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  // Fold long lines per RFC 5545 (max 75 octets)
  const fold    = s => s.match(/.{1,75}/g)?.join('\r\n ') || s;

  const vevents = events.map(e => [
    'BEGIN:VEVENT',
    `UID:${uid()}`,
    `DTSTAMP:${icsNow()}`,
    `DTSTART;VALUE=DATE:${icsDate(e.date)}`,
    `DTEND;VALUE=DATE:${icsDate(new Date(e.date.getTime() + 86400000))}`,
    fold(`SUMMARY:${esc(e.summary)}`),
    e.description ? fold(`DESCRIPTION:${esc(e.description)}`) : null,
    'END:VEVENT',
  ].filter(Boolean).join('\r\n'));

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Plant Zone Finder//Garden Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(calName || 'Garden Planting Calendar')}`,
    'X-WR-CALDESC:Your personalised garden planting schedule from Plant Zone Finder',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n');
}

function downloadAsFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateICS() {
  if (!selectedZone && !Object.keys(myGarden).length) {
    showToast('Select a zone or add crops to your garden first', 'info'); return;
  }

  const year   = new Date().getFullYear();
  const events = [];
  const zoneLbl = selectedZone ? getZoneDisplayLabel(selectedZone) : null;

  // ── 1. Frost date events ──────────────────────
  if (selectedZone) {
    const frost = FROST_DATES[selectedZone.toLowerCase()];
    if (frost?.last) {
      const d = parseFrostDate(frost.last);
      if (d) events.push({ summary: `❄️ Last frost — Zone ${zoneLbl}`, date: d,
        description: `Last average frost date for Zone ${zoneLbl}. Safe to transplant warm-season crops after this date.` });
    }
    if (frost?.first) {
      const d = parseFrostDate(frost.first);
      if (d) events.push({ summary: `🍂 First frost — Zone ${zoneLbl}`, date: d,
        description: `First expected frost for Zone ${zoneLbl}. Harvest frost-sensitive crops before this date.` });
    }
  }

  // ── 2. Garden crop events ─────────────────────
  for (const [name, entry] of Object.entries(myGarden)) {
    // User-set reminder
    if (entry.reminder) {
      const d = new Date(entry.reminder + 'T00:00:00');
      if (!isNaN(d)) events.push({ summary: `🔔 ${name} — reminder`, date: d,
        description: `Garden reminder you set for ${name} in Plant Zone Finder` });
    }

    // Planted date + expected harvest
    if (entry.planted) {
      const planted = new Date(entry.planted + 'T00:00:00');
      if (!isNaN(planted)) {
        events.push({ summary: `🌱 Planted: ${name}`, date: planted,
          description: `You planted ${name} in your garden` });
        const days = parseHarvestDays(cropData[name]?.days);
        if (days) {
          const harvestDate = new Date(planted.getTime() + days * 86400000);
          events.push({ summary: `🌾 Harvest ready: ${name}`, date: harvestDate,
            description: `${name} sown on ${entry.planted}. Days to maturity: ~${days}. Check daily for ripeness signs.` });
        }
      }
    }
  }

  // ── 3. Zone-based sowing windows (unplanted crops) ──
  if (selectedZone) {
    const upcoming3 = [1, 2, 3].map(offset => ((new Date().getMonth() + offset) % 12) + 1);
    for (const [name, entry] of Object.entries(myGarden)) {
      if (entry.planted) continue;
      // Find first upcoming activity month
      for (let m = 1; m <= 12; m++) {
        const d = getPlantingData(selectedZone, m);
        const isUpcoming = upcoming3.includes(m) || m > new Date().getMonth() + 1;
        if (!isUpcoming) continue;
        if (d.startIndoors?.includes(name)) {
          events.push({ summary: `🪴 Start ${name} indoors`, date: new Date(year, m - 1, 1),
            description: `Zone ${zoneLbl} planting schedule — start ${name} indoors this month for best results` }); break;
        }
        if (d.directSow?.includes(name)) {
          events.push({ summary: `🌱 Sow ${name} outdoors`, date: new Date(year, m - 1, 1),
            description: `Zone ${zoneLbl} planting schedule — direct sow ${name} outdoors this month` }); break;
        }
      }
    }
  }

  if (!events.length) { showToast('No events to export — try adding crops or planting dates first', 'info'); return; }

  const locPrefix  = selectedLocationName ? `${selectedLocationName} ` : '';
  const calName    = `${locPrefix}${zoneLbl ? `Zone ${zoneLbl} ` : ''}Planting Calendar`;
  const ics        = buildICS(events, calName);
  downloadAsFile(`garden-calendar-${year}.ics`, ics, 'text/calendar;charset=utf-8');
  document.getElementById('share-modal')?.close();
  showToast(`${events.length} events exported ✓ — open the .ics file to import`, 'success');
}

// ════════════════════════════════════════════════
// Phase 50 — Watering & Care Log
// ════════════════════════════════════════════════
function logWatering(name, notes) {
  if (!myGarden[name]) return;
  if (!myGarden[name].waterLog) myGarden[name].waterLog = [];
  myGarden[name].waterLog.unshift({ date: new Date().toISOString().slice(0,10), notes: notes || '' });
  if (myGarden[name].waterLog.length > 30) myGarden[name].waterLog.length = 30;
  saveGarden();
  refreshGardenUI(name);
  haptic(5);
  showToast(`💧 Watering logged for ${name}`, 'success');
  earnXP(5, `Watered ${name}`);
  updateStreak();
}

function getWaterStatus(name) {
  const entry = myGarden[name];
  if (!entry) return null;
  const today = new Date(); today.setHours(0,0,0,0);

  // Recent rain counts as watering (≥5mm in last 48h)
  if (weatherData?.daily?.precipitation_sum) {
    const recentRain = (weatherData.daily.precipitation_sum[0] || 0) + (weatherData.daily.precipitation_sum[1] || 0);
    if (recentRain >= 5) return { type: 'rain', label: '🌧️ Rained recently', days: 0 };
  }

  const lastWater = entry.waterLog?.[0]?.date;
  if (!lastWater) return { type: 'unknown', label: '💧 Not logged', days: null };

  const days = Math.round((today - new Date(lastWater)) / 86400000);
  if (days === 0) return { type: 'fresh', label: '💧 Watered today', days };
  if (days === 1) return { type: 'fresh', label: '💧 Watered yesterday', days };
  if (days <= 4)  return { type: 'ok',    label: `💧 ${days}d since watering`, days };
  return { type: 'dry', label: `🏜️ ${days}d since watering`, days };
}

// ════════════════════════════════════════════════
// Phase 51 — Seed Inventory
// ════════════════════════════════════════════════
function loadSeeds() {
  try { mySeeds = JSON.parse(localStorage.getItem('pzf-seeds') || '{}'); }
  catch { mySeeds = {}; }
}
function saveSeeds() { localStorage.setItem('pzf-seeds', JSON.stringify(mySeeds)); }

function renderSeedInventory() {
  const el = document.getElementById('subtab-seeds');
  if (!features.seeds) { if (el) el.innerHTML = ''; return; }
  if (!el || el.hidden) return;

  const names = Object.keys(mySeeds);
  const thisYear = new Date().getFullYear();

  const inSeason = [];
  if (selectedZone) {
    const data = getPlantingData(selectedZone, currentMonth);
    inSeason.push(...(data.startIndoors||[]), ...(data.directSow||[]));
  }

  const needToBuy = inSeason.filter(n => !mySeeds[n]);

  let html = `<div class="seeds-header">
    <span class="seeds-title">🌰 Seed Inventory</span>
    <button class="seeds-add-open-btn" id="seeds-add-open-btn">+ Add seeds</button>
  </div>
  <div class="seeds-add-form" id="seeds-add-form" hidden>
    <div class="seeds-form-row">
      <input type="text" id="seeds-crop-input" placeholder="Crop name…" autocomplete="off" list="seeds-crop-list">
      <datalist id="seeds-crop-list">${Object.keys(cropData||{}).map(n=>`<option value="${n}">`).join('')}</datalist>
      <input type="text" id="seeds-variety-input" placeholder="Variety (optional)">
    </div>
    <div class="seeds-form-row">
      <input type="number" id="seeds-qty-input" placeholder="Qty" min="0" max="9999">
      <input type="number" id="seeds-expiry-input" placeholder="Expiry year" min="2020" max="2040">
      <button id="seeds-save-btn">Add</button>
      <button id="seeds-cancel-btn" class="seeds-cancel-btn">✕</button>
    </div>
  </div>`;

  if (!names.length && !needToBuy.length) {
    html += `<p class="seeds-empty">No seeds logged yet. Track packets you have on hand to see what to buy each month.</p>`;
  } else {
    const groups = { expired: [], warn: [], fresh: [] };
    for (const name of names) {
      const yr = mySeeds[name].expiryYear;
      if (yr && yr < thisYear) groups.expired.push(name);
      else if (yr && yr <= thisYear + 1) groups.warn.push(name);
      else groups.fresh.push(name);
    }
    const GROUP_LABELS = { expired: '⚠️ Expired — use up or replace', warn: '🟡 Use soon', fresh: '✅ In stock' };

    const renderSeedCard = name => {
      const s = mySeeds[name];
      const c = cropData[name];
      const isSow = inSeason.includes(name);
      const isExp = s.expiryYear && s.expiryYear < thisYear;
      const isWarn = s.expiryYear && s.expiryYear <= thisYear + 1 && !isExp;
      return `<div class="seed-card${isSow ? ' seed-card--season' : ''}${isExp ? ' seed-card--expired' : ''}">
        <span class="seed-card-emoji">${c?.emoji || '🌱'}</span>
        <div class="seed-card-info">
          <span class="seed-card-name">${name}${isSow ? ' <span class="seed-sow-now">Sow now</span>' : ''}</span>
          <span class="seed-card-meta">${[
            s.variety,
            s.qty ? `${s.qty} seeds` : '',
            s.expiryYear ? `${isExp ? '⚠️ expired' : isWarn ? '⚠️ expiring' : 'exp.'} ${s.expiryYear}` : ''
          ].filter(Boolean).join(' · ')}</span>
        </div>
        <button class="seed-remove-btn" data-seed="${name}" aria-label="Remove ${name}">×</button>
      </div>`;
    };

    for (const [type, items] of Object.entries(groups)) {
      if (!items.length) continue;
      html += `<div class="seeds-group-label">${GROUP_LABELS[type]}</div>${items.map(renderSeedCard).join('')}`;
    }
  }

  if (needToBuy.length) {
    html += `<div class="seeds-shop-section">
      <div class="seeds-shop-title">🛒 Buy for this month</div>
      <div class="seeds-shop-list">${needToBuy.map(n => `<span class="seeds-shop-chip">${cropData[n]?.emoji||'🌱'} ${n}</span>`).join('')}</div>
    </div>`;
  }

  el.innerHTML = html;

  el.querySelector('#seeds-add-open-btn')?.addEventListener('click', () => {
    const form = el.querySelector('#seeds-add-form');
    if (form) { form.hidden = false; el.querySelector('#seeds-crop-input')?.focus(); }
  });
  el.querySelector('#seeds-cancel-btn')?.addEventListener('click', () => {
    const form = el.querySelector('#seeds-add-form');
    if (form) form.hidden = true;
  });
  el.querySelector('#seeds-crop-input')?.addEventListener('input', e => {
    const nm = e.target.value.trim();
    const lifeYrs = cropData[nm]?.seed_life_years;
    const expiryEl = el.querySelector('#seeds-expiry-input');
    if (expiryEl && !expiryEl.value && lifeYrs) {
      expiryEl.placeholder = `~${new Date().getFullYear() + lifeYrs} (auto)`;
    } else if (expiryEl && !lifeYrs) {
      expiryEl.placeholder = 'Expiry year';
    }
  });
  el.querySelector('#seeds-save-btn')?.addEventListener('click', () => {
    const name = el.querySelector('#seeds-crop-input')?.value.trim();
    if (!name) { showToast('Enter a crop name', 'error'); return; }
    const expiryRaw = parseInt(el.querySelector('#seeds-expiry-input')?.value) || null;
    const autoExpiry = cropData[name]?.seed_life_years
      ? new Date().getFullYear() + cropData[name].seed_life_years : null;
    mySeeds[name] = {
      variety: el.querySelector('#seeds-variety-input')?.value.trim() || '',
      qty: parseInt(el.querySelector('#seeds-qty-input')?.value) || 0,
      expiryYear: expiryRaw || autoExpiry,
      added: new Date().toISOString().slice(0,10),
    };
    saveSeeds();
    renderSeedInventory();
    showToast(`🌰 ${name} seeds added`, 'success');
  });
  el.querySelectorAll('.seed-remove-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); delete mySeeds[btn.dataset.seed]; saveSeeds(); renderSeedInventory(); });
  });
}

// ════════════════════════════════════════════════
// Phase 52 — Visual Bed Grid
// ════════════════════════════════════════════════
function renderBedGrid(bedId, crops) {
  const bed = gardenBeds[bedId];
  if (!bed) return '';
  const cols = bed.cols || 4;
  const rows = bed.rows || 2;
  const total = cols * rows;
  let cells = '';
  for (let i = 0; i < total; i++) {
    const name = crops[i];
    if (name) {
      const cd = cropData[name];
      const s = getGardenStatus(name);
      const cls = s?.type === 'ready' ? 'bed-cell--ready' : s?.type === 'growing' ? 'bed-cell--growing' : 'bed-cell--saved';
      cells += `<div class="bed-cell ${cls}" data-crop="${name}" title="${name}">${cd?.emoji || '🌱'}</div>`;
    } else {
      cells += `<div class="bed-cell bed-cell--empty"></div>`;
    }
  }
  return `<div class="bed-grid-visual" style="--bed-cols:${cols}">${cells}
    <button class="bed-grid-size-btn" data-bed="${bedId}" title="Resize grid">↔</button>
  </div>`;
}

// ════════════════════════════════════════════════
// Phase 93 — Feature Flags
// ════════════════════════════════════════════════
let features = { ...DEFAULT_FEATURES };

function loadFeatures() {
  try { features = { ...DEFAULT_FEATURES, ...JSON.parse(localStorage.getItem('pzf-features') || '{}') }; }
  catch { features = { ...DEFAULT_FEATURES }; }
}
function saveFeatures() { localStorage.setItem('pzf-features', JSON.stringify(features)); }

// ════════════════════════════════════════════════
// Phase 53 — Settings Panel
// ════════════════════════════════════════════════
let _settingsPrev = null;
function openSettings() {
  _settingsPrev = document.activeElement;
  renderSettingsSheet();
  const sheet = document.getElementById('settings-overlay');
  if (sheet) {
    sheet.hidden = false;
    requestAnimationFrame(() => {
      sheet.classList.add('open');
      trapFocus(sheet);
    });
  }
  haptic(5);
}
function closeSettings() {
  const sheet = document.getElementById('settings-overlay');
  if (sheet) {
    sheet.classList.remove('open');
    setTimeout(() => { sheet.hidden = true; }, 280);
  }
  _settingsPrev?.focus();
  _settingsPrev = null;
}
function renderSettingsSheet() {
  const body = document.getElementById('settings-body');
  if (!body) return;

  const isMetric   = !!useMetric;
  const isDark     = document.documentElement.getAttribute('data-theme') !== 'light';
  const notifsOn   = localStorage.getItem('pzf-notif-enabled') === '1';
  const autoArchive = localStorage.getItem('pzf-auto-archive') !== '0';

  body.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">Appearance</div>
      <div class="settings-row">
        <span>Theme</span>
        <div class="settings-toggle-group">
          <button class="stoggle${!isDark ? ' stoggle--active' : ''}" id="s-theme-light">☀️ Light</button>
          <button class="stoggle${isDark  ? ' stoggle--active' : ''}" id="s-theme-dark">🌙 Dark</button>
        </div>
      </div>
      <div class="settings-row">
        <span>Units</span>
        <div class="settings-toggle-group">
          <button class="stoggle${!isMetric ? ' stoggle--active' : ''}" id="s-unit-imperial">°F / in</button>
          <button class="stoggle${isMetric  ? ' stoggle--active' : ''}" id="s-unit-metric">°C / cm</button>
        </div>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">Notifications</div>
      <div class="settings-row">
        <span>Garden alerts</span>
        <label class="settings-switch">
          <input type="checkbox" id="s-notif-toggle"${notifsOn ? ' checked' : ''}>
          <span class="settings-switch-track"></span>
        </label>
      </div>
      <p class="settings-hint">Frost warnings, harvest reminders, and seasonal sowing nudges.</p>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">Garden</div>
      <div class="settings-row">
        <span>Auto-archive on remove</span>
        <label class="settings-switch">
          <input type="checkbox" id="s-autoarchive"${autoArchive ? ' checked' : ''}>
          <span class="settings-switch-track"></span>
        </label>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">Features</div>
      ${[
        { key: 'seeds',            label: 'Seed tracking',       desc: 'Seeds sub-tab, "Have seeds" checkbox, expiry badges' },
        { key: 'startIndoors',     label: 'Start-indoors hints', desc: 'Start-indoors schedule rows and transplant banners' },
        { key: 'beds',             label: 'Garden beds & map',   desc: 'Bed summary, map button, "By Bed" view toggle' },
        { key: 'succession',       label: 'Succession sowing',   desc: 'Sow-now / sow-in-Xd reminders in garden list' },
        { key: 'companionPlanting',label: 'Companion planting',  desc: 'Companion matrix and companions/avoid in crop detail' },
        { key: 'harvestTracking',  label: 'Harvest tracking',    desc: 'Harvest log buttons, harvest analytics, harvest-to-table' },
        { key: 'weatherForecast',  label: 'Weather features',    desc: 'Planting forecast strip, frost alert, watering intelligence' },
      ].map(f => `
      <div class="settings-row">
        <div class="settings-feature-text">
          <span>${f.label}</span>
          <span class="settings-feature-desc">${f.desc}</span>
        </div>
        <label class="settings-switch">
          <input type="checkbox" class="s-feature-toggle" data-feature="${f.key}"${features[f.key] ? ' checked' : ''}>
          <span class="settings-switch-track"></span>
        </label>
      </div>`).join('')}
    </div>
    <div class="settings-section">
      <div class="settings-section-title">Data</div>
      <div class="settings-data-row">
        <button class="settings-data-btn" id="s-export-btn">⬇ Backup data</button>
        <button class="settings-data-btn" id="s-import-btn">⬆ Restore data</button>
        <input type="file" id="s-import-input" accept=".json" style="display:none">
        <button class="settings-data-btn settings-data-btn--danger" id="s-clear-btn">🗑 Clear all data</button>
      </div>
    </div>
    <div class="settings-version">Plant Zone Finder · v2.0</div>`;

  body.querySelector('#s-theme-light')?.addEventListener('click', () => {
    document.documentElement.setAttribute('data-theme','light');
    localStorage.setItem('pzf-theme','light');
    updateThemeBtn(); renderSettingsSheet();
  });
  body.querySelector('#s-theme-dark')?.addEventListener('click', () => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('pzf-theme','dark');
    updateThemeBtn(); renderSettingsSheet();
  });
  body.querySelector('#s-unit-imperial')?.addEventListener('click', () => {
    useMetric = false; localStorage.setItem('pzf-metric','0');
    const btn = document.getElementById('metric-toggle');
    if (btn) { btn.textContent = '°F'; btn.classList.remove('active'); }
    renderSettingsSheet();
  });
  body.querySelector('#s-unit-metric')?.addEventListener('click', () => {
    useMetric = true; localStorage.setItem('pzf-metric','1');
    const btn = document.getElementById('metric-toggle');
    if (btn) { btn.textContent = '°C'; btn.classList.add('active'); }
    renderSettingsSheet();
  });
  body.querySelector('#s-notif-toggle')?.addEventListener('change', e => {
    if (e.target.checked) requestNotifPermission();
    else localStorage.removeItem('pzf-notif-enabled');
  });
  body.querySelector('#s-autoarchive')?.addEventListener('change', e => {
    localStorage.setItem('pzf-auto-archive', e.target.checked ? '1' : '0');
  });
  body.querySelectorAll('.s-feature-toggle').forEach(cb => {
    cb.addEventListener('change', e => {
      features[e.target.dataset.feature] = e.target.checked;
      saveFeatures();
      renderGardenTab();
      renderPlantingForecast();
      renderFrostAlertBanner();
      renderWateringIntelligence();
    });
  });
  body.querySelector('#s-export-btn')?.addEventListener('click', exportGarden);
  body.querySelector('#s-import-btn')?.addEventListener('click', () => body.querySelector('#s-import-input')?.click());
  body.querySelector('#s-import-input')?.addEventListener('change', e => { importGarden(e.target.files[0]); e.target.value = ''; });
  body.querySelector('#s-clear-btn')?.addEventListener('click', () => {
    if (!confirm('Delete ALL garden data? This cannot be undone.')) return;
    [...BACKUP_KEYS, 'pzf-rotation'].forEach(k => localStorage.removeItem(k));
    location.reload();
  });
}
function initSettings() {
  document.getElementById('settings-btn')?.addEventListener('click', openSettings);
  document.getElementById('settings-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('settings-overlay')) closeSettings();
  });
  document.getElementById('settings-close-btn')?.addEventListener('click', closeSettings);
}

// ════════════════════════════════════════════════
// Phase 54 — Crop Rotation Planner
// ════════════════════════════════════════════════
function loadRotation() {
  try { cropRotation = JSON.parse(localStorage.getItem('pzf-rotation') || '[]'); }
  catch { cropRotation = []; }
}
function saveRotation() { localStorage.setItem('pzf-rotation', JSON.stringify(cropRotation)); }

function checkRotationConflict(name, bedId) {
  const family = CROP_FAMILIES[name] || cropData[name]?.family;
  if (!bedId || !family) return null;
  const thisYear = new Date().getFullYear();
  loadRotation();
  const conflicts = cropRotation.filter(r =>
    r.bedId === bedId && r.family === family && (thisYear - r.year) < 3
  );
  if (!conflicts.length) return null;
  const recent = conflicts.sort((a,b) => b.year - a.year)[0];
  return { family, year: recent.year, yearsAgo: thisYear - recent.year, cropName: recent.name };
}

function renderRotationHistory(bedId) {
  loadRotation();
  const records = cropRotation.filter(r => r.bedId === bedId);
  if (!records.length) return '';
  const byYear = {};
  for (const r of records) {
    if (!byYear[r.year]) byYear[r.year] = [];
    byYear[r.year].push(r);
  }
  const years = Object.keys(byYear).sort((a,b) => b - a).slice(0, 4);
  return `<div class="rotation-history">
    <div class="rotation-history-title">📅 Rotation history</div>
    ${years.map(yr => `<div class="rotation-year-row">
      <span class="rotation-year">${yr}</span>
      <span class="rotation-crops">${byYear[yr].map(r => `${r.emoji} ${r.name}`).join(', ')}</span>
    </div>`).join('')}
  </div>`;
}

// ════════════════════════════════════════════════
// Phase 55 — Quick-Action FAB
// ════════════════════════════════════════════════
let _fabPrev = null;
function openFAB() {
  _fabPrev = document.activeElement;
  renderFABSheet();
  const overlay = document.getElementById('fab-sheet-overlay');
  if (overlay) {
    overlay.hidden = false;
    requestAnimationFrame(() => {
      overlay.classList.add('open');
      const sheet = overlay.querySelector('.fab-sheet');
      if (sheet) trapFocus(sheet);
    });
  }
  haptic([5, 30, 5]);
}
function closeFAB() {
  const overlay = document.getElementById('fab-sheet-overlay');
  if (overlay) {
    overlay.classList.remove('open');
    setTimeout(() => { overlay.hidden = true; }, 280);
  }
  _fabPrev?.focus();
  _fabPrev = null;
}
function renderFABSheet() {
  const el = document.getElementById('fab-actions');
  if (!el) return;

  const recentCrops = Object.keys(myGarden)
    .filter(n => myGarden[n]?.planted)
    .sort((a,b) => (myGarden[b].planted||'').localeCompare(myGarden[a].planted||''))
    .slice(0, 5);

  const makeCropPicker = (title, onSelect) => {
    const picker = document.getElementById('fab-crop-picker');
    const list   = document.getElementById('fab-crop-list');
    if (!picker || !list) return;
    picker.hidden = false;
    picker.querySelector('.fab-crop-picker-title').textContent = title;
    list.innerHTML = recentCrops.map(n =>
      `<button class="fab-crop-pick-btn" data-crop="${n}">${cropData[n]?.emoji||'🌱'} ${n}</button>`
    ).join('') + `<button class="fab-crop-pick-btn" data-crop="__all__">All crops…</button>`;
    list.querySelectorAll('.fab-crop-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.crop === '__all__') {
          // Show full list inline
          list.innerHTML = Object.keys(myGarden).map(n =>
            `<button class="fab-crop-pick-btn" data-crop="${n}">${cropData[n]?.emoji||'🌱'} ${n}</button>`
          ).join('');
          list.querySelectorAll('.fab-crop-pick-btn').forEach(b => b.addEventListener('click', () => { onSelect(b.dataset.crop); closeFAB(); }));
        } else {
          onSelect(btn.dataset.crop);
          closeFAB();
        }
      });
    });
  };

  el.innerHTML = `
    <button class="fab-action-btn" id="fab-harvest">🌾 Log harvest</button>
    <button class="fab-action-btn" id="fab-water">💧 Log watering</button>
    <button class="fab-action-btn" id="fab-note">📝 Quick note</button>
    <button class="fab-action-btn" id="fab-task">☑️ Add task</button>
    <button class="fab-action-btn" id="fab-diagnose">🔍 Diagnose a problem</button>
    <button class="fab-action-btn" id="fab-season">📋 Season summary</button>
    <button class="fab-action-btn" id="fab-recipe">🍽 Grow what you eat</button>`;

  document.getElementById('fab-harvest')?.addEventListener('click', () => {
    if (!recentCrops.length) { showToast('Add crops with planting dates first', 'info'); closeFAB(); return; }
    el.innerHTML = '';
    makeCropPicker('Log harvest for…', name => {
      gardenLogHarvest(name, new Date().toISOString().slice(0,10), '');
      showToast(`🌾 Harvest logged for ${name}!`, 'success');
    });
  });

  document.getElementById('fab-water')?.addEventListener('click', () => {
    if (!recentCrops.length) { showToast('Add crops with planting dates first', 'info'); closeFAB(); return; }
    // Multi-select watering
    el.innerHTML = `<div class="fab-water-multi">
      <div class="fab-crop-picker-title">Log watering for…</div>
      <div class="fab-water-list">${Object.keys(myGarden).filter(n => myGarden[n]?.planted).map(n =>
        `<label class="fab-water-crop-label">
          <input type="checkbox" class="fab-water-check" value="${n}" checked>
          ${cropData[n]?.emoji||'🌱'} ${n}
        </label>`).join('')}
      </div>
      <button class="fab-water-confirm-btn" id="fab-water-confirm">Log selected</button>
    </div>`;
    document.getElementById('fab-water-confirm')?.addEventListener('click', () => {
      const checked = [...el.querySelectorAll('.fab-water-check:checked')].map(c => c.value);
      checked.forEach(name => logWatering(name));
      if (checked.length) showToast(`💧 Watered ${checked.length} crop${checked.length > 1 ? 's' : ''}`, 'success');
      closeFAB();
    });
  });

  document.getElementById('fab-note')?.addEventListener('click', () => {
    el.innerHTML = `<div class="fab-note-form">
      <textarea id="fab-note-input" placeholder="Log an observation…" rows="3" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;padding:8px;resize:vertical"></textarea>
      <button class="fab-water-confirm-btn" id="fab-note-save" style="margin-top:8px">Add note</button>
    </div>`;
    setTimeout(() => document.getElementById('fab-note-input')?.focus(), 50);
    document.getElementById('fab-note-save')?.addEventListener('click', () => {
      const text = document.getElementById('fab-note-input')?.value.trim();
      if (!text) return;
      addJournalEntry(text, '');
      showToast('📝 Note added to journal', 'success');
      closeFAB();
    });
  });

  document.getElementById('fab-task')?.addEventListener('click', () => {
    el.innerHTML = `<div class="fab-note-form">
      <input id="fab-task-input" type="text" placeholder="Task description…" style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;padding:8px">
      <input id="fab-task-due" type="date" style="width:100%;margin-top:6px;background:var(--surface2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;padding:8px">
      <button class="fab-water-confirm-btn" id="fab-task-save" style="margin-top:8px">Add task</button>
    </div>`;
    setTimeout(() => document.getElementById('fab-task-input')?.focus(), 50);
    document.getElementById('fab-task-save')?.addEventListener('click', () => {
      const text = document.getElementById('fab-task-input')?.value.trim();
      if (!text) return;
      addChecklistItem(text, document.getElementById('fab-task-due')?.value || '');
      showToast('☑️ Task added', 'success');
      closeFAB();
    });
  });

  document.getElementById('fab-diagnose')?.addEventListener('click', () => {
    closeFAB();
    openDiagnosisWizard('');
  });

  document.getElementById('fab-season')?.addEventListener('click', () => {
    closeFAB();
    openSeasonWrapUp();
  });

  document.getElementById('fab-recipe')?.addEventListener('click', () => {
    closeFAB();
    openGrowByRecipe();
  });
}

// ════════════════════════════════════════════════
// Phase 56 — Crop data expansion + alias search
// ════════════════════════════════════════════════
function cropMatchesQuery(name, q) {
  if (!q) return true;
  const lq = q.toLowerCase();
  if (name.toLowerCase().includes(lq)) return true;
  const c = cropData[name];
  if (c?.aliases?.some(a => a.toLowerCase().includes(lq))) return true;
  return false;
}

// ════════════════════════════════════════════════
// Phase 58 — Hardening-off scheduler
// ════════════════════════════════════════════════
function startHardeningSchedule(name) {
  if (!myGarden[name]) return;
  myGarden[name].hardeningLog = {
    started: new Date().toISOString().slice(0, 10),
    steps: HARDENING_STEPS.map(s => ({ ...s, done: false, doneDate: null })),
  };
  saveGarden();
  renderHardeningSection(name);
  showToast('🌿 Hardening schedule started!', 'success');
}

function renderHardeningSection(name) {
  const body = document.getElementById('modal-body');
  if (!body) return;
  body.querySelector('.modal-hardening-section')?.remove();
  if (!isInGarden(name)) return;

  const sec = document.createElement('div');
  sec.className = 'modal-section modal-hardening-section';
  const hardenLog = myGarden[name]?.hardeningLog;

  if (!hardenLog) {
    sec.innerHTML = `<div class="hardening-start">
      <button class="hardening-start-btn" id="hardening-start-btn">🌿 Start hardening-off schedule</button>
      <p class="hardening-hint">14-step guide to gradually acclimatise seedlings to outdoor conditions.</p>
    </div>`;
    body.appendChild(sec);
    sec.querySelector('#hardening-start-btn')?.addEventListener('click', () => startHardeningSchedule(name));
    return;
  }

  const steps = hardenLog.steps;
  const done = steps.filter(s => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  sec.innerHTML = `<div class="modal-section-title">🌿 Hardening off
    <span class="hardening-progress-text">${done}/${steps.length}</span>
  </div>
  <div class="hardening-progress-bar"><div class="hardening-progress-fill" style="width:${pct}%"></div></div>
  <div class="hardening-steps">
    ${steps.map((s, i) => `<label class="hardening-step${s.done ? ' hardening-step--done' : ''}">
      <input type="checkbox" class="hardening-check" data-index="${i}" ${s.done ? 'checked' : ''}>
      <span class="hardening-day">Day ${s.day}</span>
      <span class="hardening-desc">${s.desc}</span>
      ${s.doneDate ? `<span class="hardening-date">${s.doneDate}</span>` : ''}
    </label>`).join('')}
  </div>
  <button class="hardening-reset-btn" id="hardening-reset-btn">Reset schedule</button>`;
  body.appendChild(sec);

  sec.querySelector('#hardening-reset-btn')?.addEventListener('click', () => {
    delete myGarden[name].hardeningLog;
    saveGarden();
    renderHardeningSection(name);
  });
  sec.querySelectorAll('.hardening-check').forEach(chk => {
    chk.addEventListener('change', () => {
      const idx = parseInt(chk.dataset.index);
      myGarden[name].hardeningLog.steps[idx].done = chk.checked;
      myGarden[name].hardeningLog.steps[idx].doneDate = chk.checked ? new Date().toISOString().slice(0, 10) : null;
      saveGarden();
      const fill = sec.querySelector('.hardening-progress-fill');
      const txt  = sec.querySelector('.hardening-progress-text');
      const newDone = myGarden[name].hardeningLog.steps.filter(s => s.done).length;
      if (fill) fill.style.width = Math.round((newDone / steps.length) * 100) + '%';
      if (txt)  txt.textContent = `${newDone}/${steps.length}`;
      chk.closest('.hardening-step')?.classList.toggle('hardening-step--done', chk.checked);
    });
  });
}

// ════════════════════════════════════════════════
// Phase 59 — Year planner
// ════════════════════════════════════════════════
function loadPlan() {
  try { myPlan = JSON.parse(localStorage.getItem('pzf-plan') || '{}'); }
  catch { myPlan = {}; }
}
function savePlan() { localStorage.setItem('pzf-plan', JSON.stringify(myPlan)); }

function addToPlan(name, year, targetMonths, notes) {
  if (!myPlan[year]) myPlan[year] = {};
  myPlan[year][name] = { targetMonths: targetMonths || [], notes: notes || '', added: new Date().toISOString().slice(0, 10) };
  savePlan();
  showToast(`📋 ${name} added to ${year} plan`, 'success');
}

function removeFromPlan(name, year) {
  const y = year || Object.keys(myPlan).find(yr => myPlan[yr][name]);
  if (y && myPlan[y]) {
    delete myPlan[y][name];
    if (!Object.keys(myPlan[y]).length) delete myPlan[y];
    savePlan();
  }
}

function activatePlanCrop(name) {
  gardenAdd(name);
  removeFromPlan(name);
  showToast(`🌱 ${name} moved to active garden!`, 'success');
  renderModalGardenBar(name);
}

function renderPlanSection() {
  const el = document.getElementById('plan-section');
  if (!el) return;
  const years = Object.keys(myPlan).sort();
  if (!years.length) { el.innerHTML = ''; return; }
  let html = `<div class="plan-section-title">📋 Planned Crops</div>`;
  for (const yr of years) {
    const crops = Object.entries(myPlan[yr]);
    if (!crops.length) continue;
    html += `<div class="plan-year-label">${yr}</div><div class="plan-crops-list">`;
    for (const [name, info] of crops) {
      const c = cropData[name];
      html += `<div class="plan-crop-item" data-crop="${name}">
        <span class="plan-crop-emoji">${c?.emoji || '🌱'}</span>
        <span class="plan-crop-name">${name}</span>
        ${info.notes ? `<span class="plan-crop-notes">${info.notes}</span>` : ''}
        <button class="plan-activate-btn" data-crop="${name}" title="Move to active garden">▶ Grow now</button>
        <button class="plan-remove-btn" data-crop="${name}" data-year="${yr}" title="Remove">×</button>
      </div>`;
    }
    html += `</div>`;
  }
  el.innerHTML = html;
  el.querySelectorAll('.plan-activate-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); activatePlanCrop(btn.dataset.crop); renderPlanSection(); });
  });
  el.querySelectorAll('.plan-remove-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); removeFromPlan(btn.dataset.crop, btn.dataset.year); renderPlanSection(); });
  });
  el.querySelectorAll('.plan-crop-item').forEach(item => {
    item.addEventListener('click', () => openCropDetail(item.dataset.crop));
  });
}

// ════════════════════════════════════════════════
// Phase 60 — Bed micro-climate & soil notes
// ════════════════════════════════════════════════
function saveBedNotes(bedId, field, value) {
  if (!gardenBeds[bedId]) return;
  gardenBeds[bedId][field] = value;
  saveBeds();
}

function getBedCompatibility(bedId, name) {
  const bed = gardenBeds[bedId];
  const c = cropData[name];
  if (!bed || !c) return [];
  const issues = [];
  if (bed.sunHours !== undefined && bed.sunHours !== '' && c.sun) {
    const sun = c.sun.toLowerCase();
    const hrs = parseFloat(bed.sunHours);
    if (!isNaN(hrs)) {
      if (sun.includes('full') && !sun.includes('partial') && hrs < 6) issues.push(`⚠️ Needs 6+ hrs sun (bed ~${hrs}h)`);
      if (sun.includes('shade') && hrs > 4) issues.push(`⚠️ Prefers shade (bed ~${hrs}h)`);
    }
  }
  if (bed.soilPh && c.soil_ph) {
    const bedPh = parseFloat(bed.soilPh);
    const phMatch = c.soil_ph.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
    if (!isNaN(bedPh) && phMatch) {
      const lo = parseFloat(phMatch[1]);
      const hi = parseFloat(phMatch[2]);
      if (bedPh < lo - 0.3) issues.push(`⚠️ pH ${bedPh} low (wants ${lo}–${hi})`);
      if (bedPh > hi + 0.3) issues.push(`⚠️ pH ${bedPh} high (wants ${lo}–${hi})`);
    }
  }
  return issues;
}

// ════════════════════════════════════════════════
// Phase 61 — Variety performance tracker
// ════════════════════════════════════════════════
function loadVarieties() {
  try { myVarieties = JSON.parse(localStorage.getItem('pzf-varieties') || '{}'); }
  catch { myVarieties = {}; }
}
function saveVarieties() { localStorage.setItem('pzf-varieties', JSON.stringify(myVarieties)); }

function logVariety(name, variety, rating, notes) {
  if (!myVarieties[name]) myVarieties[name] = [];
  myVarieties[name].unshift({
    variety: variety || 'Unknown variety',
    year: new Date().getFullYear(),
    rating: rating || 0,
    notes: notes || '',
    logged: new Date().toISOString().slice(0, 10),
  });
  saveVarieties();
}

function promptVarietyLog(name) {
  const c = cropData[name];
  const overlay = document.createElement('div');
  overlay.className = 'variety-log-overlay';
  const presets = c?.varieties?.length
    ? c.varieties.map(v => `<button class="variety-preset-btn" data-v="${v}">${v}</button>`).join('')
    : '';
  overlay.innerHTML = `<div class="variety-log-sheet">
    <div class="variety-log-title">📝 How did ${name} grow?</div>
    <p class="variety-log-sub">Log your variety to track performance year-over-year.</p>
    ${presets ? `<div class="variety-presets">${presets}</div>` : ''}
    <input type="text" id="vl-variety" placeholder="Variety name (e.g. Sungold, Brandywine…)" class="variety-log-input">
    <div class="variety-rating" id="vl-rating">
      ${[1,2,3,4,5].map(n => `<button class="variety-star" data-r="${n}">★</button>`).join('')}
    </div>
    <textarea id="vl-notes" placeholder="Notes — yield, issues, would grow again?" rows="2" class="variety-log-textarea"></textarea>
    <div class="variety-log-btns">
      <button class="variety-log-save-btn" id="vl-save">Save</button>
      <button class="variety-log-skip-btn" id="vl-skip">Skip</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);

  let selectedRating = 0;
  overlay.querySelectorAll('.variety-star').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRating = parseInt(btn.dataset.r);
      overlay.querySelectorAll('.variety-star').forEach((b, i) => b.classList.toggle('active', i < selectedRating));
    });
  });
  overlay.querySelectorAll('.variety-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => { document.getElementById('vl-variety').value = btn.dataset.v; });
  });
  overlay.querySelector('#vl-save')?.addEventListener('click', () => {
    const variety = document.getElementById('vl-variety')?.value.trim();
    const notes   = document.getElementById('vl-notes')?.value.trim();
    logVariety(name, variety, selectedRating, notes);
    showToast(`📝 Variety logged for ${name}!`, 'success');
    document.body.removeChild(overlay);
  });
  overlay.querySelector('#vl-skip')?.addEventListener('click', () => document.body.removeChild(overlay));
}

function renderVarietyHistory(name) {
  const body = document.getElementById('modal-body');
  if (!body) return;
  body.querySelector('.modal-variety-section')?.remove();
  const records = myVarieties[name];
  if (!records?.length) return;

  const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
  const sec = document.createElement('div');
  sec.className = 'modal-section modal-variety-section';
  sec.innerHTML = `<div class="modal-section-title">📊 Variety history</div>
    <div class="variety-history-list">
      ${records.map(r => `<div class="variety-record">
        <span class="variety-record-name">${r.variety}</span>
        <span class="variety-record-year">${r.year}</span>
        <span class="variety-record-stars">${stars(r.rating)}</span>
        ${r.notes ? `<span class="variety-record-notes">${r.notes}</span>` : ''}
      </div>`).join('')}
    </div>`;
  body.appendChild(sec);
}

// ════════════════════════════════════════════════
// Phase 62 — Daily Garden Brief
// ════════════════════════════════════════════════
function renderDailyBrief() {
  const el = document.getElementById('daily-brief');
  if (!el || !selectedZone) { if (el) el.innerHTML = ''; return; }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dateStr = today.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  // ── Weather header ──
  let wxHtml = '';
  if (weatherData?.current) {
    const temp = useMetric
      ? Math.round((weatherData.current.temperature_2m - 32) * 5 / 9) + '°C'
      : Math.round(weatherData.current.temperature_2m) + '°F';
    const icon = getWmoIcon(weatherData.current.weather_code);
    const rainSoon = weatherData.daily?.precipitation_sum
      ? (weatherData.daily.precipitation_sum[6] || 0) + (weatherData.daily.precipitation_sum[7] || 0) : 0;
    const rainNote = rainSoon > 0.15 ? '<span class="today-wx-note">🌧 Rain soon</span>' : '';
    wxHtml = `<div class="today-wx"><span class="today-wx-icon">${icon}</span><span class="today-wx-temp">${temp}</span>${rainNote}</div>`;
  }

  // ── Ready to harvest ──
  const gardenNames = Object.keys(myGarden);
  const readyCrops = gardenNames.filter(n => getGardenStatus(n)?.type === 'ready');
  let harvestHtml = '';
  if (readyCrops.length) {
    const chips = readyCrops.slice(0, 4).map(n =>
      `<button class="thc" data-crop="${n}">${cropData[n]?.emoji || '🌱'} ${n} <span class="thc-cta">Log →</span></button>`
    ).join('');
    const more = readyCrops.length > 4 ? `<span class="thc-more">+${readyCrops.length - 4} more</span>` : '';
    harvestHtml = `<div class="today-section">
      <div class="today-section-hd">🌾 Ready to harvest</div>
      <div class="today-harvest-chips">${chips}${more}</div>
    </div>`;
  }

  // ── Frost / watering alerts ──
  let alertsHtml = '';
  const frost = FROST_DATES[selectedZone.toLowerCase()];
  if (frost?.last) {
    const d = parseFrostDate(frost.last);
    if (d) { const diff = Math.round((d - today) / 86400000);
      if (diff > 0 && diff <= 7) alertsHtml += `<div class="today-alert today-alert--frost">❄️ Last frost in ${diff} day${diff===1?'':'s'} — hold off transplanting</div>`; }
  }
  if (frost?.first) {
    const d = parseFrostDate(frost.first);
    if (d) { const diff = Math.round((d - today) / 86400000);
      if (diff > 0 && diff <= 7) alertsHtml += `<div class="today-alert today-alert--frost">🍂 First frost in ${diff} day${diff===1?'':'s'} — harvest tender crops now</div>`; }
  }
  const needWater = gardenNames.filter(n => getWaterStatus(n)?.type === 'dry');
  if (needWater.length)
    alertsHtml += `<div class="today-alert today-alert--water">💧 ${needWater.length} crop${needWater.length > 1 ? 's' : ''} overdue for watering</div>`;

  // ── Up this month (sow / transplant not yet started) ──
  let weekHtml = '';
  if (!readyCrops.length) {
    const pdata = getPlantingData(selectedZone, currentMonth);
    const sowItems = [...(pdata.startIndoors || []).map(n => ({ n, t: 'sow' })),
                     ...(pdata.directSow   || []).map(n => ({ n, t: 'sow' }))];
    const transItems = (pdata.transplant || []).map(n => ({ n, t: 'transplant' }));
    const monthItems = [...sowItems, ...transItems].filter(({ n }) => !myGarden[n]?.planted).slice(0, 6);
    if (monthItems.length) {
      const chips = monthItems.map(({ n, t }) =>
        `<span class="twk-chip twk-chip--${t}">${t === 'sow' ? '🌱' : '🪴'} ${n}</span>`
      ).join('');
      weekHtml = `<div class="today-section">
        <div class="today-section-hd">📅 Up this month</div>
        <div class="today-week-chips">${chips}</div>
      </div>`;
    }
  }

  // ── Tip fallback ──
  let tipHtml = '';
  if (!readyCrops.length && !alertsHtml && !weekHtml) {
    const pdata = getPlantingData(selectedZone, currentMonth);
    const unplanted = [...(pdata.startIndoors || []), ...(pdata.directSow || [])].filter(n => !isInGarden(n));
    if (unplanted.length) {
      const pick = unplanted[Math.floor(Math.random() * Math.min(4, unplanted.length))];
      tipHtml = `<div class="today-tip">💡 Now's a great time to start <strong>${pick}</strong> for your zone</div>`;
    }
  }

  if (!wxHtml && !harvestHtml && !alertsHtml && !weekHtml && !tipHtml) { el.innerHTML = ''; return; }

  el.innerHTML = `<div class="today-hero">
    <div class="today-hero-head">${wxHtml}<span class="today-date">${dateStr}</span></div>
    ${harvestHtml}${alertsHtml}${weekHtml}${tipHtml}
  </div>`;

  el.querySelectorAll('.thc[data-crop]').forEach(btn =>
    btn.addEventListener('click', () => openCropDetail(btn.dataset.crop))
  );
}

// ════════════════════════════════════════════════
// Phase 63 — Harvest Analytics Dashboard
// ════════════════════════════════════════════════
function renderHarvestAnalytics() {
  const el = document.getElementById('harvest-analytics');
  if (!el) return;
  if (!features.harvestTracking) { el.innerHTML = ''; return; }

  const byMonth = Array(12).fill(0);
  const byCrop = {};
  let total = 0;

  for (const [name, entry] of Object.entries(myGarden)) {
    for (const h of (entry.harvestLog || [])) {
      const m = new Date(h.date + 'T00:00:00').getMonth();
      byMonth[m]++;
      byCrop[name] = (byCrop[name] || 0) + 1;
      total++;
    }
  }

  if (!total) { el.innerHTML = ''; return; }

  const sorted = Object.entries(byCrop).sort(([, a], [, b]) => b - a);
  const [topCrop, topCount] = sorted[0];
  const maxBar = Math.max(...byMonth, 1);
  const ABBR = ['J','F','M','A','M','J','J','A','S','O','N','D'];

  el.innerHTML = `<div class="harvest-analytics">
    <div class="ha-title">🌾 Harvest Summary</div>
    <div class="ha-stats">
      <div class="ha-stat">
        <span class="ha-stat-val">${total}</span>
        <span class="ha-stat-label">Total logged</span>
      </div>
      <div class="ha-stat">
        <span class="ha-stat-val">${cropData[topCrop]?.emoji || '🌱'} ${topCrop}</span>
        <span class="ha-stat-label">Top crop (${topCount}×)</span>
      </div>
    </div>
    <div class="ha-bars">
      ${byMonth.map((count, i) => `
        <div class="ha-bar-col">
          <div class="ha-bar-wrap">
            <div class="ha-bar${i === currentMonth - 1 ? ' ha-bar--current' : ''}" style="height:${Math.max(2, Math.round((count / maxBar) * 44))}px"></div>
          </div>
          <span class="ha-bar-label">${ABBR[i]}</span>
        </div>`).join('')}
    </div>
  </div>`;
}

// ════════════════════════════════════════════════
// Phase 101 — Harvest Value Tracker
// ════════════════════════════════════════════════
function getHarvestValueUSD(name, entry) {
  const price = CROP_VALUES[name] || 4.0; // $/kg
  let kg = 0;
  if (entry.qty) {
    const u = (entry.unit || '').toLowerCase();
    if      (u === 'kg')              kg = entry.qty;
    else if (u === 'lbs' || u === 'lb') kg = entry.qty * 0.4536;
    else if (u === 'g')               kg = entry.qty / 1000;
    else if (u === 'oz')              kg = entry.qty * 0.02835;
    else if (u === 'count')           kg = entry.qty * 0.15;  // ~150 g/item
    else if (u === 'bunch')           kg = entry.qty * 0.25;  // ~250 g/bunch
    else                              kg = entry.qty * 0.15;
  } else {
    kg = 0.3; // no qty — assume ~300 g
  }
  return kg * price;
}

function getSeasonHarvestValue() {
  const year = String(new Date().getFullYear());
  let total = 0;
  const byCrop = {};
  for (const [name, entry] of Object.entries(myGarden)) {
    for (const h of (entry.harvestLog || [])) {
      if (!h.date.startsWith(year)) continue;
      const val = getHarvestValueUSD(name, h);
      total += val;
      byCrop[name] = (byCrop[name] || 0) + val;
    }
  }
  return { total, byCrop };
}

function renderHarvestValue() {
  const el = document.getElementById('harvest-value');
  if (!el) return;
  const { total, byCrop } = getSeasonHarvestValue();
  if (total < 0.5) { el.innerHTML = ''; return; }
  const fmt = v => v >= 100 ? Math.round(v) : v.toFixed(1);
  const sorted = Object.entries(byCrop).sort(([,a],[,b]) => b - a).slice(0, 4);
  const cropLines = sorted.map(([name, val]) =>
    `<span class="hv-crop-item">${cropData[name]?.emoji || '🌱'} ${name} <strong>$${fmt(val)}</strong></span>`
  ).join('');
  el.innerHTML = `<div class="hv-card">
    <div class="hv-card-body">
      <div class="hv-label">🌱 Garden value this season</div>
      <div class="hv-amount">$${fmt(total)}<span class="hv-saved"> saved</span></div>
      <div class="hv-sub">vs. organic retail · ${Object.values(myGarden).reduce((s,e) => s + (e.harvestLog?.length||0), 0)} harvests logged</div>
      ${cropLines ? `<div class="hv-crops">${cropLines}</div>` : ''}
    </div>
    <button class="hv-share-btn" id="hv-share-btn">📤 Share</button>
  </div>`;
  document.getElementById('hv-share-btn')?.addEventListener('click', () => {
    const text = `My garden has saved me an estimated $${fmt(total)} this season! 🌱 Organized Abundance`;
    if (navigator.share) { navigator.share({ text, url: location.href }).catch(() => {}); }
    else { navigator.clipboard?.writeText(text).then(() => showToast('Copied to clipboard!')).catch(() => {}); }
  });
}

// ════════════════════════════════════════════════
// Phase 64 — Problem Diagnosis Wizard
// ════════════════════════════════════════════════
function openDiagnosisWizard(cropName) {
  const overlay = document.createElement('div');
  overlay.className = 'diagnosis-overlay';

  let symptom = '';
  let location = '';

  function renderStep1() {
    overlay.innerHTML = `<div class="diagnosis-sheet">
      <div class="diagnosis-handle"></div>
      <div class="diagnosis-title">🔍 Diagnose a Problem</div>
      ${cropName ? `<div class="diagnosis-crop-ctx">Crop: ${cropData[cropName]?.emoji || '🌱'} ${cropName}</div>` : ''}
      <p class="diagnosis-sub">What do you see?</p>
      <div class="diagnosis-symptoms">
        ${PROBLEM_SYMPTOMS.map(s => `
          <button class="diagnosis-symptom-btn" data-id="${s.id}">
            <span class="diag-symptom-emoji">${s.emoji}</span>
            <span>${s.label}</span>
          </button>`).join('')}
      </div>
      <button class="diagnosis-cancel-btn" id="diag-cancel">Cancel</button>
    </div>`;
    overlay.querySelector('#diag-cancel').addEventListener('click', () => document.body.removeChild(overlay));
    overlay.querySelectorAll('.diagnosis-symptom-btn').forEach(btn => {
      btn.addEventListener('click', () => { symptom = btn.dataset.id; renderStep2(); });
    });
  }

  function renderStep2() {
    overlay.innerHTML = `<div class="diagnosis-sheet">
      <div class="diagnosis-handle"></div>
      <div class="diagnosis-title">🔍 Where on the plant?</div>
      <p class="diagnosis-sub">Select the most affected area.</p>
      <div class="diagnosis-locations">
        ${PROBLEM_LOCATIONS.map(l => `
          <button class="diagnosis-loc-btn" data-id="${l.id}">${l.label}</button>`).join('')}
      </div>
      <button class="diagnosis-back-btn" id="diag-back">← Back</button>
    </div>`;
    overlay.querySelector('#diag-back').addEventListener('click', renderStep1);
    overlay.querySelectorAll('.diagnosis-loc-btn').forEach(btn => {
      btn.addEventListener('click', () => { location = btn.dataset.id; renderStep3(); });
    });
  }

  function renderStep3() {
    const key = `${symptom}|${location}`;
    const results = PROBLEM_DIAGNOSES[key] || [];
    overlay.innerHTML = `<div class="diagnosis-sheet diagnosis-sheet--results">
      <div class="diagnosis-handle"></div>
      <div class="diagnosis-title">🔍 Possible Causes</div>
      ${!results.length
        ? `<p class="diagnosis-sub">No specific matches — check our general troubleshooting guide or try a different symptom combination.</p>`
        : results.map(r => `<div class="diagnosis-result">
            <div class="dr-cause">${r.cause}</div>
            <p class="dr-desc">${r.desc}</p>
            <div class="dr-treatments">
              <div class="dr-treatment dr-treatment--organic"><span class="dr-label">🌿 Organic</span>${r.organic}</div>
              <div class="dr-treatment dr-treatment--conventional"><span class="dr-label">🧪 Conventional</span>${r.conventional}</div>
            </div>
          </div>`).join('')}
      <div class="diagnosis-footer-btns">
        <button class="diagnosis-back-btn" id="diag-back2">← Try again</button>
        <button class="diagnosis-cancel-btn" id="diag-done">Done</button>
      </div>
    </div>`;
    overlay.querySelector('#diag-back2').addEventListener('click', renderStep1);
    overlay.querySelector('#diag-done').addEventListener('click', () => document.body.removeChild(overlay));
  }

  document.body.appendChild(overlay);
  renderStep1();
}

// ════════════════════════════════════════════════
// Phase 66 — Watering Intelligence
// ════════════════════════════════════════════════
function getCropWaterInterval(name) {
  const water = (cropData[name]?.water || '').toLowerCase();
  if (water.includes('daily') || water.includes('mist')) return 1;
  if (water.includes('2x') || water.includes('twice')) return 3;
  if (water.includes('2-3') || water.includes('consistently')) return 2;
  if (water.includes('1-2')) return 5;
  return 6;
}

function renderWateringIntelligence() {
  const el = document.getElementById('watering-intelligence');
  if (!el) return;
  if (!features.weatherForecast) { el.innerHTML = ''; return; }

  const names = Object.keys(myGarden).filter(n => myGarden[n]?.planted);
  if (!names.length) { el.innerHTML = ''; return; }

  const today = new Date(); today.setHours(0, 0, 0, 0);

  // Rain in next 2 days (indices 6,7 with past_days=5)
  const rainNext2 = weatherData?.daily?.precipitation_sum
    ? (weatherData.daily.precipitation_sum[6] || 0) + (weatherData.daily.precipitation_sum[7] || 0)
    : 0;
  const rainComing = rainNext2 > 0.15;

  const items = names.map(name => {
    const lastWatered = myGarden[name].waterLog?.[0]?.date;
    const interval = getCropWaterInterval(name);
    const daysSince = lastWatered ? Math.round((today - new Date(lastWatered + 'T00:00:00')) / 86400000) : 99;
    const daysUntilDue = interval - daysSince;
    return { name, daysSince, interval, daysUntilDue, lastWatered };
  }).filter(i => i.daysUntilDue <= 0 + (rainComing ? -1 : 0))
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 5);

  if (!items.length) { el.innerHTML = ''; return; }

  el.innerHTML = `<div class="watering-intelligence">
    <div class="wi-title">💧 Watering Needed
      ${rainComing ? '<span class="wi-rain-badge">🌧 Rain forecast — urgency reduced</span>' : ''}
    </div>
    <div class="wi-list">
      ${items.map(({ name, daysSince, daysUntilDue, lastWatered }) => {
        const overdue = Math.abs(daysUntilDue);
        const cls = daysUntilDue < -3 ? 'wi-item--critical' : daysUntilDue < 0 ? 'wi-item--overdue' : 'wi-item--due';
        const label = !lastWatered ? 'Never watered' : daysUntilDue < 0 ? `${overdue}d overdue` : 'Due now';
        return `<div class="wi-item ${cls}">
          <span class="wi-emoji">${cropData[name]?.emoji || '🌱'}</span>
          <span class="wi-name">${name}</span>
          <span class="wi-status">${label}</span>
          <button class="wi-log-btn" data-crop="${name}">Log 💧</button>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  el.querySelectorAll('.wi-log-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      logWatering(btn.dataset.crop);
      renderWateringIntelligence();
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 68 — Seed Starting Calculator
// ═══════════════════════════════════════════════════════════════════

function renderSeedStartSection(name) {
  const body = document.getElementById('modal-body');
  if (!body) return;
  body.querySelector('.modal-seed-start-section')?.remove();

  const weeksBeforeFrost = SEED_START_WEEKS[name];
  if (!weeksBeforeFrost || !selectedZone) return;
  const frost = FROST_DATES[selectedZone.toLowerCase()];
  if (!frost?.last) return;
  const lastFrostDate = parseFrostDate(frost.last);
  if (!lastFrostDate) return;

  const startDate = new Date(lastFrostDate);
  startDate.setDate(startDate.getDate() - weeksBeforeFrost * 7);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysUntilStart = Math.round((startDate - today) / 86400000);

  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  let statusHtml, statusClass;
  if (daysUntilStart > 21) {
    statusHtml = `Start seeds around <strong>${fmt(startDate)}</strong> — ${daysUntilStart} days away`;
    statusClass = 'ssc--upcoming';
  } else if (daysUntilStart >= -7) {
    statusClass = daysUntilStart >= 0 ? 'ssc--now' : 'ssc--late';
    statusHtml = daysUntilStart >= 0
      ? `⏰ <strong>Start seeds now!</strong> Ideal date: ${fmt(startDate)}`
      : `⚠️ ${Math.abs(daysUntilStart)} days past ideal — still worth starting if transplants are unavailable`;
  } else if (daysUntilStart > -42) {
    statusHtml = `Seedling window has passed this season — transplants may still be at nurseries`;
    statusClass = 'ssc--passed';
  } else {
    return;
  }

  const sec = document.createElement('div');
  sec.className = 'modal-section modal-seed-start-section';
  sec.innerHTML = `
    <div class="modal-section-title">🌱 Seed Starting</div>
    <div class="ssc-card ${statusClass}">
      <div class="ssc-main">${statusHtml}</div>
      <div class="ssc-detail">Zone ${getZoneDisplayLabel(selectedZone)} · Last frost ~${frost.last} · Start ${weeksBeforeFrost} weeks before</div>
    </div>`;
  body.appendChild(sec);
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 69 — Fertilizer Schedule
// ═══════════════════════════════════════════════════════════════════

function renderFertilizerSection(name) {
  const body = document.getElementById('modal-body');
  if (!body) return;
  body.querySelector('.modal-fert-section')?.remove();

  const category = CROP_FERT_CATEGORY[name];
  if (!category) return;
  const stages = FERTILIZER_SCHEDULES[category];

  const sec = document.createElement('div');
  sec.className = 'modal-section modal-fert-section';
  const hasPlantingDate = !!myGarden[name]?.planted;

  sec.innerHTML = `
    <div class="modal-section-title">🧪 Fertilizer Schedule</div>
    <div class="fert-stages">
      ${stages.map((s, i) => `
        <div class="fert-stage">
          <div class="fert-stage-num">${i + 1}</div>
          <div class="fert-stage-icon">${s.icon}</div>
          <div class="fert-stage-body">
            <span class="fert-stage-name">${s.stage}</span>
            <span class="fert-stage-when">${s.when}</span>
            <span class="fert-stage-tip">${s.tip}</span>
          </div>
        </div>`).join('')}
    </div>
    ${hasPlantingDate ? `<button class="fert-add-tasks-btn" data-crop="${name}">+ Add as reminders</button>` : ''}`;

  body.appendChild(sec);

  sec.querySelector('.fert-add-tasks-btn')?.addEventListener('click', () => {
    const planted = new Date(myGarden[name].planted + 'T00:00:00');
    const offsets = FERT_DAY_OFFSETS[category] || stages.map((_, i) => i * 14);
    stages.forEach((s, i) => {
      const due = new Date(planted);
      due.setDate(due.getDate() + (offsets[i] || i * 14));
      addChecklistItem(`🧪 ${name}: ${s.stage} — ${s.tip.split('.')[0]}`, due.toISOString().slice(0, 10));
    });
    showToast(`${stages.length} fertilizer reminders added!`, 'success');
    sec.querySelector('.fert-add-tasks-btn').remove();
  });
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 70 — Harvest-to-Table Ideas
// ═══════════════════════════════════════════════════════════════════

function renderHarvestToTable() {
  const el = document.getElementById('harvest-to-table');
  if (!el) return;
  if (!features.harvestTracking) { el.innerHTML = ''; return; }
  const readyCrops = Object.keys(myGarden).filter(n => getGardenStatus(n)?.type === 'ready');
  if (!readyCrops.length) { el.innerHTML = ''; return; }

  const cards = readyCrops
    .filter(n => HARVEST_TO_TABLE[n]?.length)
    .map(name => {
      const ideas = HARVEST_TO_TABLE[name];
      const c = cropData[name];
      return `<div class="htt-card">
        <div class="htt-card-header">
          <span class="htt-emoji">${c?.emoji || '🌱'}</span>
          <span class="htt-name">${name}</span>
          <span class="htt-ready-badge">Ready!</span>
        </div>
        <ul class="htt-ideas">
          ${ideas.slice(0, 3).map(idea => `<li>${idea}</li>`).join('')}
        </ul>
      </div>`;
    });

  if (!cards.length) { el.innerHTML = ''; return; }

  el.innerHTML = `
    <div class="htt-section">
      <div class="htt-title">🍽 Harvest-to-Table Ideas</div>
      <div class="htt-cards">${cards.join('')}</div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 71 — Crop Comparison
// ═══════════════════════════════════════════════════════════════════

let _compareA = null;

function toggleCropCompare(name) {
  if (!_compareA) {
    _compareA = name;
    showToast(`${cropData[name]?.emoji || ''} ${name} selected — open another crop to compare`, 'info');
    return;
  }
  if (_compareA === name) {
    _compareA = null;
    showToast('Comparison cleared', 'info');
    return;
  }
  openCropComparison(_compareA, name);
  _compareA = null;
}

function openCropComparison(nameA, nameB) {
  const cA = cropData[nameA], cB = cropData[nameB];
  if (!cA || !cB) return;

  const overlay = document.getElementById('crop-compare-overlay');
  if (!overlay) return;

  const FIELDS = [
    { label: 'Days to harvest', key: 'days' },
    { label: 'Sun',             key: 'sun' },
    { label: 'Water',           key: 'water' },
    { label: 'Difficulty',      key: 'difficulty' },
    { label: 'Soil pH',         key: 'soil_ph' },
    { label: 'Spacing',         key: 'spacing' },
    { label: 'Depth',           key: 'depth' },
    { label: 'Germ temp',       key: 'germ_temp' },
  ];

  const compat = (a, b) => {
    const c = cropData[a];
    if (c?.companions?.includes(b)) return '<span class="cc-good">✅ Good companions</span>';
    if (c?.avoid?.includes(b))      return '<span class="cc-bad">⚠️ Avoid together</span>';
    return '—';
  };

  overlay.innerHTML = `
    <div class="compare-inner">
      <button class="compare-close" id="compare-close-btn">&times;</button>
      <h3 class="compare-title">Crop Comparison</h3>
      <div class="compare-heads">
        <div class="compare-head" role="button" data-name="${nameA}">
          <span class="compare-emoji">${cA.emoji || '🌱'}</span>
          <span class="compare-name">${nameA}</span>
        </div>
        <div class="compare-vs">vs</div>
        <div class="compare-head" role="button" data-name="${nameB}">
          <span class="compare-emoji">${cB.emoji || '🌱'}</span>
          <span class="compare-name">${nameB}</span>
        </div>
      </div>
      <div class="compare-grid">
        ${FIELDS.map(f => {
          const vA = cA[f.key] || '—';
          const vB = cB[f.key] || '—';
          return `<div class="compare-row">
            <div class="compare-cell compare-cell--a">${convertMeasurement(vA)}</div>
            <div class="compare-label">${f.label}</div>
            <div class="compare-cell compare-cell--b">${convertMeasurement(vB)}</div>
          </div>`;
        }).join('')}
        <div class="compare-row">
          <div class="compare-cell compare-cell--a">${compat(nameA, nameB)}</div>
          <div class="compare-label">Compatibility</div>
          <div class="compare-cell compare-cell--b">${compat(nameB, nameA)}</div>
        </div>
      </div>
      <div class="compare-actions">
        <button class="compare-open-btn" data-name="${nameA}">${cA.emoji || '🌱'} ${nameA}</button>
        <button class="compare-open-btn" data-name="${nameB}">${cB.emoji || '🌱'} ${nameB}</button>
      </div>
    </div>`;

  overlay.hidden = false;
  overlay.querySelector('#compare-close-btn').addEventListener('click', () => { overlay.hidden = true; });
  overlay.querySelectorAll('.compare-open-btn').forEach(btn => {
    btn.addEventListener('click', () => { overlay.hidden = true; openCropDetail(btn.dataset.name); });
  });
  overlay.querySelectorAll('.compare-head[role="button"]').forEach(head => {
    head.addEventListener('click', () => { overlay.hidden = true; openCropDetail(head.dataset.name); });
    addButtonKeydown(head, () => { overlay.hidden = true; openCropDetail(head.dataset.name); });
  });
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 72 — Photo Gallery
// ═══════════════════════════════════════════════════════════════════

let _galleryFilter = '';

function openPhotoGallery() {
  const overlay = document.getElementById('photo-gallery-overlay');
  if (!overlay) return;
  _galleryFilter = '';
  overlay.hidden = false;
  renderPhotoGallery();
}

function renderPhotoGallery() {
  const overlay = document.getElementById('photo-gallery-overlay');
  if (!overlay || overlay.hidden) return;
  const content = document.getElementById('photo-gallery-content');
  if (!content) return;

  const allPhotos = [];
  for (const [name, entry] of Object.entries(myGarden)) {
    for (const p of (entry.photos || [])) {
      allPhotos.push({ crop: name, ...p });
    }
  }

  if (!allPhotos.length) {
    content.innerHTML = '<p class="gallery-empty">No photos yet. Add photos from individual crop cards in My Garden.</p>';
    return;
  }

  const cropsWithPhotos = [...new Set(allPhotos.map(p => p.crop))];
  const filtered = _galleryFilter ? allPhotos.filter(p => p.crop === _galleryFilter) : allPhotos;

  content.innerHTML = `
    <div class="gallery-filters">
      <button class="gallery-chip${!_galleryFilter ? ' active' : ''}" data-crop="">All (${allPhotos.length})</button>
      ${cropsWithPhotos.map(n => `<button class="gallery-chip${_galleryFilter === n ? ' active' : ''}" data-crop="${n}">${cropData[n]?.emoji || '🌱'} ${n}</button>`).join('')}
    </div>
    <div class="gallery-grid">
      ${filtered.map(p => `
        <div class="gallery-thumb">
          <img src="${p.thumb}" alt="${p.crop} — ${p.date}" loading="lazy">
          <div class="gallery-thumb-meta">
            <span>${cropData[p.crop]?.emoji || '🌱'} ${p.crop}</span>
            <span>${p.date}</span>
          </div>
        </div>`).join('')}
    </div>`;

  content.querySelectorAll('.gallery-chip').forEach(btn => {
    btn.addEventListener('click', () => { _galleryFilter = btn.dataset.crop; renderPhotoGallery(); });
  });
  content.querySelectorAll('.gallery-thumb img').forEach(img => {
    img.addEventListener('click', () => {
      const lb = document.getElementById('photo-lightbox');
      const lbImg = document.getElementById('photo-lightbox-img');
      if (lb && lbImg) { lbImg.src = img.src; lb.hidden = false; }
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 73 — Garden Health Score
// ═══════════════════════════════════════════════════════════════════

function computeGardenHealthScore() {
  const names = Object.keys(myGarden);
  if (!names.length) return null;

  let score = 0;
  const breakdown = [];

  // 1. Watering on schedule (30 pts)
  const plantedNames = names.filter(n => myGarden[n]?.planted);
  if (plantedNames.length) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const onSchedule = plantedNames.filter(n => {
      const interval = getCropWaterInterval(n);
      const lastWatered = myGarden[n].waterLog?.[0]?.date;
      if (!lastWatered) return false;
      const daysSince = Math.round((today - new Date(lastWatered + 'T00:00:00')) / 86400000);
      return daysSince <= interval + 1;
    }).length;
    const pts = Math.round((onSchedule / plantedNames.length) * 30);
    score += pts;
    breakdown.push({ label: 'Watering', pts, max: 30, tip: pts < 15 ? 'Log watering for your planted crops regularly' : null });
  } else {
    breakdown.push({ label: 'Watering', pts: 0, max: 30, tip: 'Set planting dates to unlock watering tracking' });
  }

  // 2. Harvest logging (20 pts)
  const harvestable = names.filter(n => getGardenStatus(n)?.type === 'ready' || myGarden[n]?.harvestLog?.length);
  const withLogs = names.filter(n => myGarden[n]?.harvestLog?.length);
  const hPts = harvestable.length ? Math.min(20, Math.round((withLogs.length / Math.max(harvestable.length, 1)) * 20)) : 10;
  score += hPts;
  breakdown.push({ label: 'Harvest logging', pts: hPts, max: 20, tip: hPts < 10 ? 'Log your harvests to track yields over time' : null });

  // 3. Journal activity (20 pts — 4 per entry in last 30 days, max 20)
  let journal = [];
  try { journal = JSON.parse(localStorage.getItem('pzf-journal') || '[]'); } catch {}
  const since30 = new Date(); since30.setDate(since30.getDate() - 30);
  const recentEntries = journal.filter(e => new Date(e.date) >= since30).length;
  const jPts = Math.min(20, recentEntries * 4);
  score += jPts;
  breakdown.push({ label: 'Journal activity', pts: jPts, max: 20, tip: jPts < 8 ? 'Keep a journal — even brief notes improve outcomes' : null });

  // 4. Companion planting (15 pts)
  const gardenSet = new Set(names);
  const withCompanions = names.filter(n => cropData[n]?.companions?.some(c => gardenSet.has(c))).length;
  const cPts = names.length > 1 ? Math.min(15, Math.round((withCompanions / names.length) * 15)) : 0;
  score += cPts;
  breakdown.push({ label: 'Companion planting', pts: cPts, max: 15, tip: cPts < 8 ? 'Add companion plants to improve your ecosystem' : null });

  // 5. Crop diversity (15 pts — 1 per crop)
  const dPts = Math.min(15, names.length);
  score += dPts;
  breakdown.push({ label: 'Crop diversity', pts: dPts, max: 15, tip: dPts < 8 ? 'Grow more variety for a healthier, resilient garden' : null });

  const worstTip = breakdown.find(b => b.tip)?.tip;
  return { score: Math.min(100, score), breakdown, tip: worstTip };
}

// ════════════════════════════════════════════════
// Phase 102 — Setup Progress Card
// ════════════════════════════════════════════════
function renderSetupCard() {
  const el = document.getElementById('setup-card');
  if (!el) return;
  if (localStorage.getItem('pzf-setup-done')) { el.innerHTML = ''; return; }

  const steps = [
    { label: 'Set your growing zone',  done: !!(selectedZone) },
    { label: 'Save your first crop',   done: Object.keys(myGarden).length > 0 },
    { label: 'Log a planting date',    done: Object.values(myGarden).some(e => e.planted) },
    { label: 'Create a garden bed',    done: Object.keys(gardenBeds).length > 0 },
    { label: 'Log your first harvest', done: Object.values(myGarden).some(e => (e.harvestLog||[]).length > 0) },
  ];
  const done = steps.filter(s => s.done).length;
  const pct  = Math.round(done / steps.length * 100);

  if (done === steps.length) {
    localStorage.setItem('pzf-setup-done', '1');
    el.innerHTML = '<div class="setup-card setup-card--complete">🎉 You\'re all set up — your garden is ready to grow!</div>';
    setTimeout(() => { el.innerHTML = ''; }, 3500);
    return;
  }

  const stepsHtml = steps.map(s =>
    `<div class="sc-step${s.done ? ' sc-step--done' : ''}">
      <span class="sc-check">${s.done ? '✓' : ''}</span>
      <span class="sc-label">${s.label}</span>
    </div>`
  ).join('');

  el.innerHTML = `<div class="setup-card">
    <div class="sc-head">
      <span class="sc-title">🌱 Getting started</span>
      <span class="sc-pct">${done}/${steps.length} complete</span>
      <button class="sc-dismiss" id="sc-dismiss-btn" aria-label="Dismiss">×</button>
    </div>
    <div class="sc-bar-wrap"><div class="sc-bar-fill" style="width:${pct}%"></div></div>
    <div class="sc-steps">${stepsHtml}</div>
  </div>`;

  document.getElementById('sc-dismiss-btn')?.addEventListener('click', () => {
    localStorage.setItem('pzf-setup-done', '1');
    el.innerHTML = '';
  });
}

function renderGardenHealthScore() {
  const el = document.getElementById('garden-health-score');
  if (!el) return;
  const result = computeGardenHealthScore();
  if (!result) { el.innerHTML = ''; return; }

  const { score, breakdown, tip } = result;
  const grade = score >= 80 ? { label: 'Excellent', cls: 'ghs--excellent' }
              : score >= 60 ? { label: 'Good',      cls: 'ghs--good' }
              : score >= 40 ? { label: 'Fair',       cls: 'ghs--fair' }
              :               { label: 'Getting started', cls: 'ghs--poor' };

  el.innerHTML = `
    <div class="ghs-card ${grade.cls}">
      <div class="ghs-score-row">
        <div class="ghs-ring" aria-hidden="true">
          <svg viewBox="0 0 36 36" class="ghs-circle">
            <path class="ghs-track" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke-width="3.5"/>
            <path class="ghs-arc"   stroke-dasharray="${score}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke-width="3.5"/>
          </svg>
          <span class="ghs-score-num">${score}</span>
        </div>
        <div class="ghs-score-info">
          <span class="ghs-grade">${grade.label}</span>
          <span class="ghs-sublabel">Garden Health Score</span>
        </div>
      </div>
      <div class="ghs-bars">
        ${breakdown.map(b => `
          <div class="ghs-bar-row">
            <span class="ghs-bar-label">${b.label}</span>
            <div class="ghs-bar-track"><div class="ghs-bar-fill" style="width:${Math.round(b.pts / b.max * 100)}%"></div></div>
            <span class="ghs-bar-pts">${b.pts}/${b.max}</span>
          </div>`).join('')}
      </div>
      ${tip ? `<div class="ghs-tip">💡 ${tip}</div>` : ''}
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 76 — Smart Shopping List
// ═══════════════════════════════════════════════════════════════════

function renderSmartShoppingList() {
  const el = document.getElementById('smart-shopping');
  if (!el) return;
  const names = Object.keys(myGarden);
  if (!names.length) { el.innerHTML = ''; return; }

  const bought = (() => { try { return new Set(JSON.parse(localStorage.getItem('pzf-shopping-bought') || '[]')); } catch { return new Set(); } })();
  const saveBought = () => localStorage.setItem('pzf-shopping-bought', JSON.stringify([...bought]));
  const thisYear = new Date().getFullYear();

  const needSeeds   = names.filter(n => !myGarden[n].hasSeeds);
  const expiredSeeds = names.filter(n => { const yr = myGarden[n]?.seedInfo?.expiryYear; return myGarden[n].hasSeeds && yr && yr <= thisYear; });
  const supplies = [...new Set(names.flatMap(n => SUPPLY_SUGGESTIONS[n] || []))];
  const ferts = FERT_SUGGESTIONS.filter(f => f.for.some(n => names.includes(n))).map(f => f.name);

  const allItems = [
    ...needSeeds.map(n => ({ id: `seed-${n}`, label: `${cropData[n]?.emoji || '🌱'} ${n} seeds`, type: 'seed' })),
    ...expiredSeeds.map(n => ({ id: `renew-${n}`, label: `⚠️ ${n} seeds (check freshness)`, type: 'renew' })),
    ...supplies.map((s, i) => ({ id: `supply-${i}`, label: `🔧 ${s}`, type: 'supply' })),
    ...ferts.map((f, i) => ({ id: `fert-${i}`, label: `🧪 ${f}`, type: 'fert' })),
  ];

  if (!allItems.length) { el.innerHTML = ''; return; }

  const remaining = allItems.filter(item => !bought.has(item.id));
  const done      = allItems.filter(item =>  bought.has(item.id));
  const typeLabels = { seed: '🌰 Seeds', renew: '⚠️ Refresh', supply: '🔧 Supplies', fert: '🧪 Fertilizers' };
  const grouped = {};
  remaining.forEach(item => { (grouped[item.type] = grouped[item.type] || []).push(item); });

  const renderItems = items => items.map(item => `
    <label class="sl-item${bought.has(item.id) ? ' sl-item--done' : ''}" data-id="${item.id}">
      <input type="checkbox" class="sl-check" data-id="${item.id}"${bought.has(item.id) ? ' checked' : ''}>
      <span class="sl-label">${item.label}</span>
    </label>`).join('');

  el.innerHTML = `
    <div class="sl-header">
      <span class="sl-title">🛒 Shopping List</span>
      <button class="sl-copy-btn" id="sl-copy-btn">Copy</button>
      ${done.length ? `<button class="sl-clear-btn" id="sl-clear-btn">Clear bought</button>` : ''}
    </div>
    <div class="sl-body">
      ${Object.entries(grouped).map(([type, items]) => `
        <div class="sl-group">
          <div class="sl-group-label">${typeLabels[type] || type}</div>
          ${renderItems(items)}
        </div>`).join('')}
      ${done.length ? `<div class="sl-done-section">
        <div class="sl-group-label sl-done-label">✓ Already bought (${done.length})</div>
        ${renderItems(done)}
      </div>` : ''}
    </div>`;

  el.querySelectorAll('.sl-check').forEach(chk => {
    chk.addEventListener('change', () => {
      if (chk.checked) bought.add(chk.dataset.id); else bought.delete(chk.dataset.id);
      saveBought(); renderSmartShoppingList();
    });
  });
  document.getElementById('sl-copy-btn')?.addEventListener('click', () => {
    const lines = remaining.map(i => i.label.replace(/^[^\w⚠️🔧🧪🌱]+/, ''));
    navigator.clipboard?.writeText(lines.join('\n')).then(() => showToast('Shopping list copied ✓', 'success'));
  });
  document.getElementById('sl-clear-btn')?.addEventListener('click', () => {
    done.forEach(i => bought.delete(i.id)); saveBought(); renderSmartShoppingList();
  });
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 77 — Season Wrap-Up
// ═══════════════════════════════════════════════════════════════════

function openSeasonWrapUp() {
  const overlay = document.getElementById('season-wrap-overlay');
  if (!overlay) return;
  renderSeasonWrapUp();
  overlay.hidden = false;
}

function renderSeasonWrapUp() {
  const content = document.getElementById('season-wrap-content');
  if (!content) return;
  const names = Object.keys(myGarden);
  const year  = new Date().getFullYear();

  const totalCrops    = names.length;
  const withDates     = names.filter(n => myGarden[n]?.planted).length;
  const totalHarvests = names.reduce((s, n) => s + (myGarden[n]?.harvestLog?.length || 0), 0);
  const totalPhotos   = names.reduce((s, n) => s + (myGarden[n]?.photos?.length || 0), 0);
  let journal = [];
  try { journal = JSON.parse(localStorage.getItem('pzf-journal') || '[]'); } catch {}

  // Yield & value (Phase 127 helpers)
  const totalKg = names.reduce((s, n) => s + getYieldKg(n), 0);
  const { total: totalValue } = getSeasonHarvestValue();
  const fmtKg   = kg => kg >= 1 ? `${kg.toFixed(1)} kg` : kg > 0 ? `${Math.round(kg * 1000)} g` : null;

  const bestCrop = [...names].sort((a, b) => (myGarden[b]?.harvestLog?.length || 0) - (myGarden[a]?.harvestLog?.length || 0))[0];
  const topRated = names.filter(n => myGarden[n]?.rating).sort((a, b) => (myGarden[b].rating || 0) - (myGarden[a].rating || 0))[0];
  const health   = computeGardenHealthScore();

  // XP + level (Phase 129)
  const lvl = getGardenLevel(gardenXP);

  const lessons = [];
  if (!withDates) lessons.push('Set planting dates to unlock harvest tracking and countdowns.');
  const noWater = names.filter(n => myGarden[n]?.planted && !myGarden[n]?.waterLog?.length);
  if (noWater.length) lessons.push(`Log watering for ${noWater.length} planted crop${noWater.length > 1 ? 's' : ''} to track moisture needs.`);
  if (journal.length < 4) lessons.push('Keep a more regular journal — even one entry per week reveals useful patterns.');
  const gardenSet = new Set(names);
  const noCompanions = names.filter(n => cropData[n]?.companions?.length && !cropData[n].companions.some(c => gardenSet.has(c)));
  if (noCompanions.length) lessons.push(`Add companion plants for ${noCompanions.slice(0, 2).join(' and ')} to naturally deter pests.`);
  if (!lessons.length) lessons.push('Great season! Keep up the consistent planting and logging habits.');

  const snap = { year, totalCrops, withDates, totalHarvests, journalEntries: journal.length, healthScore: health?.score || 0, totalKg, totalValue, xp: gardenXP };
  localStorage.setItem(`pzf-season-${year}`, JSON.stringify(snap));

  let prevSnap = null;
  try { prevSnap = JSON.parse(localStorage.getItem(`pzf-season-${year - 1}`)); } catch {}

  const diff = (curr, prev, fmt) => {
    if (prev == null) return '';
    const d = curr - prev;
    if (Math.abs(d) < 0.1) return '';
    const label = fmt ? fmt(Math.abs(d)) : Math.abs(Math.round(d));
    return d > 0 ? ` <span class="sw-up">↑${label}</span>` : ` <span class="sw-down">↓${label}</span>`;
  };

  const yieldHtml = totalKg > 0 ? `
    <div class="sw-yield-row">
      <span class="sw-yield-kg">🏆 ${fmtKg(totalKg)} harvested</span>
      ${totalValue >= 0.5 ? `<span class="sw-yield-val">≈ $${totalValue >= 100 ? Math.round(totalValue) : totalValue.toFixed(1)} saved</span>` : ''}
    </div>` : '';

  const streakHtml = gardenStreak.count >= 2
    ? `<div class="sw-streak">🔥 ${gardenStreak.count}-day activity streak</div>` : '';

  content.innerHTML = `
    <div class="sw-hero">
      <div class="sw-year-label">${year}</div>
      <div class="sw-title">Your Garden Season</div>
      <div class="sw-level-pill">Lv.${lvl.level} ${lvl.title} · ${gardenXP} XP</div>
    </div>
    ${yieldHtml}
    ${streakHtml}
    <div class="sw-stats">
      <div class="sw-stat"><span class="sw-stat-val">${totalCrops}${diff(totalCrops, prevSnap?.totalCrops)}</span><span class="sw-stat-label">Crops grown</span></div>
      <div class="sw-stat"><span class="sw-stat-val">${totalHarvests}${diff(totalHarvests, prevSnap?.totalHarvests)}</span><span class="sw-stat-label">Harvests</span></div>
      <div class="sw-stat"><span class="sw-stat-val">${journal.filter(e=>!e.milestone).length}${diff(journal.filter(e=>!e.milestone).length, prevSnap?.journalEntries)}</span><span class="sw-stat-label">Journal entries</span></div>
      ${totalPhotos > 0 ? `<div class="sw-stat"><span class="sw-stat-val">${totalPhotos}</span><span class="sw-stat-label">Photos taken</span></div>` : (health ? `<div class="sw-stat"><span class="sw-stat-val">${health.score}${diff(health.score, prevSnap?.healthScore)}</span><span class="sw-stat-label">Health score</span></div>` : '')}
    </div>
    ${bestCrop && (myGarden[bestCrop]?.harvestLog?.length || 0) > 0 ? `
      <div class="sw-highlight"><span class="sw-hl-label">⭐ Star crop</span>
      <span class="sw-hl-value">${cropData[bestCrop]?.emoji || '🌱'} ${bestCrop} — ${myGarden[bestCrop].harvestLog.length} harvest${myGarden[bestCrop].harvestLog.length > 1 ? 's' : ''}</span></div>` : ''}
    ${topRated ? `
      <div class="sw-highlight"><span class="sw-hl-label">🏅 Top rated</span>
      <span class="sw-hl-value">${cropData[topRated]?.emoji || '🌱'} ${topRated} — ${'★'.repeat(myGarden[topRated].rating)}${'☆'.repeat(5 - myGarden[topRated].rating)}</span></div>` : ''}
    ${prevSnap ? `<div class="sw-prev">vs ${year - 1}: ${prevSnap.totalCrops} crops · ${prevSnap.totalHarvests} harvests${prevSnap.totalKg ? ` · ${fmtKg(prevSnap.totalKg)}` : ''}</div>` : ''}
    <div class="sw-lessons">
      <div class="sw-lessons-title">💡 Tips for next season</div>
      ${lessons.map(l => `<div class="sw-lesson">• ${l}</div>`).join('')}
    </div>
    <button class="sw-close-btn" id="sw-close">Done</button>`;

  document.getElementById('sw-close')?.addEventListener('click', () => {
    document.getElementById('season-wrap-overlay').hidden = true;
  });
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 78 — Grow What You Eat (Recipe-to-Garden Discovery)
// ═══════════════════════════════════════════════════════════════════

function openGrowByRecipe() {
  const overlay = document.getElementById('recipe-browse-overlay');
  if (!overlay) return;
  renderGrowByRecipe(null);
  overlay.hidden = false;
}

function renderGrowByRecipe(selectedRecipe) {
  const content = document.getElementById('recipe-browse-content');
  if (!content) return;

  if (!selectedRecipe) {
    content.innerHTML = `
      <p class="rbr-intro">Pick a dish — we'll show you which crops to grow for it.</p>
      <div class="rbr-grid">
        ${GROW_BY_RECIPE.map(r => `
          <button class="rbr-recipe-btn" data-recipe="${r.name}">
            <span class="rbr-icon">${r.icon}</span>
            <span class="rbr-name">${r.name}</span>
            <span class="rbr-count">${r.crops.length} crops</span>
          </button>`).join('')}
      </div>`;
    content.querySelectorAll('.rbr-recipe-btn').forEach(btn =>
      btn.addEventListener('click', () => renderGrowByRecipe(btn.dataset.recipe)));
    return;
  }

  const recipe = GROW_BY_RECIPE.find(r => r.name === selectedRecipe);
  if (!recipe) return;

  const inGardenCount = recipe.crops.filter(n => isInGarden(n)).length;

  const items = recipe.crops.map(name => {
    const c = cropData[name];
    const inG = isInGarden(name);
    const status = getGardenStatus(name);
    let tag = '';
    if (inG && status?.type === 'ready') tag = '<span class="rbr-tag rbr-tag--ready">Ready!</span>';
    else if (inG) tag = '<span class="rbr-tag rbr-tag--growing">In garden</span>';
    return `<div class="rbr-crop-row${inG ? ' rbr-crop-row--ingarden' : ''}" data-name="${name}">
      <span class="rbr-crop-emoji">${c?.emoji || '🌱'}</span>
      <div class="rbr-crop-info">
        <span class="rbr-crop-name">${name}</span>
        ${c?.difficulty ? `<span class="rbr-diff rbr-diff--${(c.difficulty||'').toLowerCase()}">${c.difficulty}</span>` : ''}
      </div>
      ${tag}
      ${!inG ? `<button class="rbr-add-btn" data-name="${name}">+ Add</button>` : ''}
      <button class="rbr-detail-btn" data-name="${name}">↗</button>
    </div>`;
  }).join('');

  const missing = recipe.crops.filter(n => !isInGarden(n));

  content.innerHTML = `
    <button class="rbr-back-btn" id="rbr-back">← All dishes</button>
    <div class="rbr-recipe-header">
      <span class="rbr-icon rbr-icon--lg">${recipe.icon}</span>
      <div>
        <h3 class="rbr-recipe-title">${recipe.name}</h3>
        <span class="rbr-recipe-sub">${inGardenCount}/${recipe.crops.length} crops in your garden</span>
      </div>
    </div>
    <div class="rbr-crop-list">${items}</div>
    ${missing.length ? `<button class="rbr-add-all-btn" id="rbr-add-all">+ Add all ${missing.length} missing crops</button>` : ''}`;

  content.querySelector('#rbr-back')?.addEventListener('click', () => renderGrowByRecipe(null));
  content.querySelectorAll('.rbr-add-btn').forEach(btn =>
    btn.addEventListener('click', e => { e.stopPropagation(); gardenAdd(btn.dataset.name); renderGrowByRecipe(selectedRecipe); }));
  content.querySelectorAll('.rbr-detail-btn').forEach(btn =>
    btn.addEventListener('click', () => { document.getElementById('recipe-browse-overlay').hidden = true; openCropDetail(btn.dataset.name); }));
  content.querySelector('#rbr-add-all')?.addEventListener('click', () => {
    missing.forEach(n => gardenAdd(n));
    showToast(`${missing.length} crops added to My Garden!`, 'success');
    renderGrowByRecipe(selectedRecipe);
  });
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 79 — Long-press Quick Actions + Recently Viewed
// ═══════════════════════════════════════════════════════════════════

let _recentlyViewed = [];

function trackRecentlyViewed(name) {
  _recentlyViewed = [name, ..._recentlyViewed.filter(n => n !== name)].slice(0, 6);
  try { localStorage.setItem('pzf-recently-viewed', JSON.stringify(_recentlyViewed)); } catch {}
  renderRecentlyViewed();
}

function loadRecentlyViewed() {
  try { _recentlyViewed = JSON.parse(localStorage.getItem('pzf-recently-viewed') || '[]'); } catch { _recentlyViewed = []; }
}

function renderRecentlyViewed() {
  const el = document.getElementById('browse-recent');
  if (!el || !_recentlyViewed.length) { if (el) el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `<div class="rv-label">Recently viewed</div>
    <div class="rv-chips">${_recentlyViewed.map(name =>
      `<button class="rv-chip" data-name="${name}">${cropData[name]?.emoji || '🌱'} ${name}</button>`).join('')}
    </div>`;
  el.querySelectorAll('.rv-chip').forEach(btn =>
    btn.addEventListener('click', () => openCropDetail(btn.dataset.name)));
}

function initLongPress() {
  document.getElementById('tab-garden')?.addEventListener('pointerdown', e => {
    const item = e.target.closest('.garden-item[data-crop]');
    if (!item) return;
    const name = item.dataset.crop;
    let timer = setTimeout(() => { haptic(2); showLongPressActions(name); }, 550);
    const cancel = () => clearTimeout(timer);
    item.addEventListener('pointerup', cancel, { once: true });
    item.addEventListener('pointermove', cancel, { once: true });
    item.addEventListener('pointercancel', cancel, { once: true });
  });

  document.getElementById('browse-grid')?.addEventListener('pointerdown', e => {
    const card = e.target.closest('.browse-card[data-name]');
    if (!card) return;
    const name = card.dataset.name;
    let timer = setTimeout(() => {
      haptic(2);
      if (isInGarden(name)) { showToast(`${cropData[name]?.emoji || ''} ${name} is already in your garden`, 'info'); }
      else { gardenAdd(name); showToast(`${cropData[name]?.emoji || '🌱'} ${name} added to My Garden!`, 'success'); }
    }, 600);
    const cancel = () => clearTimeout(timer);
    card.addEventListener('pointerup', cancel, { once: true });
    card.addEventListener('pointermove', cancel, { once: true });
    card.addEventListener('pointercancel', cancel, { once: true });
  });
}

function showLongPressActions(name) {
  const c = cropData[name];
  const overlay = document.getElementById('longpress-overlay');
  if (!overlay) return;
  const inGarden = isInGarden(name);
  const planted  = myGarden[name]?.planted;

  overlay.innerHTML = `
    <div class="lp-sheet">
      <div class="lp-handle"></div>
      <div class="lp-crop-header">
        <span class="lp-emoji">${c?.emoji || '🌱'}</span>
        <span class="lp-name">${name}</span>
      </div>
      <div class="lp-actions">
        <button class="lp-btn" id="lp-open">📋 Open details</button>
        ${planted ? `<button class="lp-btn" id="lp-water">💧 Log watering</button>` : ''}
        ${planted ? `<button class="lp-btn" id="lp-harvest">🌾 Log harvest</button>` : ''}
        ${inGarden
          ? `<button class="lp-btn lp-btn--danger" id="lp-remove">✕ Remove from garden</button>`
          : `<button class="lp-btn lp-btn--add" id="lp-add">☆ Add to My Garden</button>`}
        <button class="lp-btn lp-btn--cancel" id="lp-cancel">Cancel</button>
      </div>
    </div>`;

  overlay.hidden = false;
  overlay.querySelector('#lp-open')?.addEventListener('click', () => { overlay.hidden = true; openCropDetail(name); });
  overlay.querySelector('#lp-water')?.addEventListener('click', () => { overlay.hidden = true; logWatering(name); });
  overlay.querySelector('#lp-harvest')?.addEventListener('click', () => {
    overlay.hidden = true;
    gardenLogHarvest(name, new Date().toISOString().slice(0, 10), '');
    showToast(`🌾 Harvest logged for ${name}!`, 'success');
  });
  overlay.querySelector('#lp-remove')?.addEventListener('click', () => { overlay.hidden = true; gardenRemove(name); });
  overlay.querySelector('#lp-add')?.addEventListener('click', () => { overlay.hidden = true; gardenAdd(name); });
  overlay.querySelector('#lp-cancel')?.addEventListener('click', () => { overlay.hidden = true; });
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.hidden = true; }, { once: true });
}

// ════════════════════════════════════════════════
// Phase 81 — Season Suitability Bar + Pest Guide
// ════════════════════════════════════════════════

// ── Phase 116: Season Suitability Bar + Pest Guide ───
function renderSeasonSuitabilityBar(name) {
  const body = document.getElementById('modal-body');
  if (!body) return;
  body.querySelector('.modal-season-bar')?.remove();

  const MONTH_SHORT = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  const monthTypes = {};
  for (let m = 1; m <= 12; m++) {
    const pd = selectedZone ? getPlantingData(selectedZone, m) : { startIndoors:[], directSow:[], transplant:[], harvest:[] };
    const t = new Set();
    if (pd.startIndoors?.includes(name)) t.add('indoor');
    if (pd.directSow?.includes(name))   t.add('sow');
    if (pd.transplant?.includes(name))  t.add('transplant');
    if (pd.harvest?.includes(name))     t.add('harvest');
    if (t.size) monthTypes[m] = t;
  }

  const cells = MONTH_SHORT.map((lbl, i) => {
    const m = i + 1;
    const t = monthTypes[m];
    const cls = !t ? '' : t.has('harvest') ? 'ssb-harvest' : t.has('transplant') ? 'ssb-transplant' : t.has('sow') ? 'ssb-sow' : 'ssb-indoor';
    const title = t ? [...t].join(', ') : 'Not active';
    return `<div class="ssb-cell ${cls}${m === currentMonth ? ' ssb-cur' : ''}" title="${title}">${lbl}</div>`;
  }).join('');

  const thisMonth = monthTypes[currentMonth];
  const ACTION_LABELS = { indoor:'Start indoors', sow:'Direct sow', transplant:'Transplant out', harvest:'Harvest' };
  const tip = thisMonth ? [...thisMonth].map(a => ACTION_LABELS[a]).join(' · ') : null;

  const sec = document.createElement('div');
  sec.className = 'modal-section modal-season-bar';
  sec.innerHTML = `
    <div class="modal-section-title">Season Overview</div>
    ${!selectedZone
      ? `<p class="ssb-no-zone">Select a zone on the map for personalised timing.</p>`
      : `<div class="ssb-strip">${cells}</div>
         <div class="ssb-legend">
           <span class="ssb-key ssb-indoor"></span>Indoors
           <span class="ssb-key ssb-sow"></span>Direct sow
           <span class="ssb-key ssb-transplant"></span>Transplant
           <span class="ssb-key ssb-harvest"></span>Harvest
         </div>
         ${tip ? `<div class="ssb-tip">📅 <strong>${MONTH_NAMES[currentMonth]}:</strong> ${tip}</div>` : ''}`}`;

  const firstSec = body.querySelector('.modal-section');
  if (firstSec) body.insertBefore(sec, firstSec);
  else body.prepend(sec);
}

// Resolve a pest name from crops.json → NAMED_PEST_GUIDE key, using aliases + case folding
function resolvePestKey(raw) {
  if (NAMED_PEST_GUIDE[raw]) return raw;
  const lower = raw.toLowerCase().trim();
  if (PEST_ALIASES[lower]) return PEST_ALIASES[lower];
  // Fuzzy: try the guide's own keys case-insensitively
  const guideKey = Object.keys(NAMED_PEST_GUIDE).find(k => k.toLowerCase() === lower);
  if (guideKey) return guideKey;
  return null;
}

function renderCropPestGuide(name) {
  const body = document.getElementById('modal-body');
  if (!body) return;
  body.querySelector('.modal-pest-guide')?.remove();

  const c = cropData[name];
  const rawPests = c?.pests || [];

  // Deduplicate resolved keys while preserving display name
  const seen = new Set();
  const resolved = rawPests
    .map(raw => ({ raw, key: resolvePestKey(raw) }))
    .filter(({ key }) => key && !seen.has(key) && seen.add(key));

  if (!resolved.length) return;

  const TYPE_LABEL = { insect: 'Insect', disease: 'Disease', other: 'Other' };
  const TYPE_CLS   = { insect: 'pg-type--insect', disease: 'pg-type--disease', other: 'pg-type--other' };

  const rows = resolved.map(({ raw, key }) => {
    const g = NAMED_PEST_GUIDE[key];
    const typeLbl = TYPE_LABEL[g.type] || g.type;
    const typeCls = TYPE_CLS[g.type]  || '';
    return `<div class="pg-pest">
      <div class="pg-header">
        <span class="pg-emoji">${g.emoji}</span>
        <span class="pg-name">${raw}</span>
        <span class="pg-type ${typeCls}">${typeLbl}</span>
      </div>
      ${g.signs ? `<div class="pg-signs"><span class="pg-label signs">Signs:</span> ${g.signs}</div>` : ''}
      <div class="pg-sol"><span class="pg-label organic">Organic:</span> ${g.organic}</div>
      <div class="pg-sol"><span class="pg-label conv">Chemical:</span> ${g.conventional}</div>
    </div>`;
  }).join('');

  const sec = document.createElement('div');
  sec.className = 'modal-section modal-pest-guide';
  sec.innerHTML = `<div class="modal-section-title">🐛 Pest &amp; Disease Guide</div>${rows}`;

  const pestsSection = [...body.querySelectorAll('.modal-section')].find(s => s.querySelector('.detail-tags--pests'));
  if (pestsSection) pestsSection.insertAdjacentElement('afterend', sec);
  else body.appendChild(sec);
}

// ════════════════════════════════════════════════
// Phase 82 — Spacing Calculator + This Week++
// ════════════════════════════════════════════════

function renderSpacingCalculator(name) {
  const body = document.getElementById('modal-body');
  if (!body) return;
  body.querySelector('.modal-spacing-calc')?.remove();

  const c = cropData[name];
  const m = c?.spacing?.match(/(\d+)/);
  if (!m) return;
  const spaceIn = parseInt(m[1], 10);

  const sec = document.createElement('div');
  sec.className = 'modal-section modal-spacing-calc';
  sec.innerHTML = `
    <div class="modal-section-title">📐 Spacing Calculator</div>
    <p class="sc-hint">Recommended spacing: <strong>${c.spacing}</strong></p>
    <div class="sc-inputs">
      <label class="sc-label">Length <input type="number" class="sc-in" id="sc-len" min="1" max="200" value="4" step="0.5"> ft</label>
      <label class="sc-label">Width <input type="number" class="sc-in" id="sc-wid" min="1" max="200" value="4" step="0.5"> ft</label>
    </div>
    <div class="sc-result" id="sc-result"></div>`;

  body.appendChild(sec);
  const spaceFt = spaceIn / 12;
  const calc = () => {
    const len = parseFloat(sec.querySelector('#sc-len').value) || 4;
    const wid = parseFloat(sec.querySelector('#sc-wid').value) || 4;
    const count = Math.floor((len / spaceFt) * (wid / spaceFt));
    const res = sec.querySelector('#sc-result');
    if (res) res.innerHTML = `<span class="sc-count">${count}</span> plant${count === 1 ? '' : 's'} in a ${len}×${wid} ft bed`;
  };
  sec.querySelectorAll('.sc-in').forEach(inp => inp.addEventListener('input', calc));
  calc();
}

// ════════════════════════════════════════════════
// Phase 83 — Safe-to-Sow Badge + Germ Temp Check
// ════════════════════════════════════════════════

function renderSafeToSowBadge(name) {
  document.querySelector('.modal-safe-sow')?.remove();
  if (!selectedZone) return;

  const c = cropData[name];
  if (!c) return;
  const frost = FROST_DATES[selectedZone.toLowerCase()];
  if (!frost) return;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isSensitive = FROST_SENSITIVE.has(name);
  let status = '', label = '', sub = '';

  if (!frost.last && !frost.first) {
    status = 'safe'; label = '✅ Safe to plant outdoors'; sub = 'Frost-free zone — no cold risk.';
  } else if (isSensitive && frost.last) {
    const lf = parseFrostDate(frost.last);
    if (lf) {
      const n = Math.round((lf - today) / 86400000);
      if      (n > 14) { status = 'wait'; label = `⏳ Wait ${n} more days`; sub = `Last frost ~${frost.last} — ${name} is frost-sensitive.`; }
      else if (n > 0)  { status = 'soon'; label = `🟡 Nearly safe — ${n} day${n===1?'':'s'} to last frost`; sub = 'Harden off seedlings now; no outdoor transplanting yet.'; }
      else             { status = 'safe'; label = '✅ Safe to transplant outdoors'; sub = `Last frost was ${-n} day${-n===1?'':'s'} ago.`; }
    }
  } else if (!isSensitive) {
    if (frost.first) {
      const ff = parseFrostDate(frost.first);
      if (ff) {
        const n = Math.round((ff - today) / 86400000);
        if (n <= 0 && n >= -21) { status = 'late'; label = '⚠️ Getting late in the season'; sub = `First frost was ~${-n} days ago.`; }
        else { status = 'safe'; label = '✅ Good time to plant'; sub = 'Hardy crop — tolerates light frost.'; }
      }
    } else { status = 'safe'; label = '✅ Good time to plant'; sub = 'Hardy crop tolerating cool conditions.'; }
  }

  if (!status) return;
  const el = document.createElement('div');
  el.className = `modal-safe-sow modal-safe-sow--${status}`;
  el.innerHTML = `<span class="safe-sow-label">${label}</span><span class="safe-sow-sub">${sub}</span>`;
  const bar = document.getElementById('modal-garden-bar');
  if (bar) bar.insertAdjacentElement('afterend', el);
}

// ════════════════════════════════════════════════

// ════════════════════════════════════════════════
// Phase 85 — Crop Share Card (Canvas image)
// ════════════════════════════════════════════════

function shareCropCard(name) {
  const c = cropData[name];
  if (!c) return;

  const W = 600, H = 340;
  const canvas = document.createElement('canvas');
  canvas.width = W * 2; canvas.height = H * 2; // retina
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = '#0d1526';
  ctx.fillRect(0, 0, W, H);

  // Accent bar
  ctx.fillStyle = '#78c87a';
  ctx.fillRect(0, 0, 4, H);

  // Emoji
  ctx.font = '52px serif';
  ctx.fillText(c.emoji || '🌱', 22, 62);

  // Name
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillStyle = '#f0fdf4';
  ctx.fillText(name, 90, 50);

  // Difficulty badge
  if (c.difficulty) {
    const diffColors = { Easy: '#78c87a', Moderate: '#fbbf24', Hard: '#f87171' };
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = diffColors[c.difficulty] || '#78c87a';
    ctx.fillText(c.difficulty.toUpperCase(), 91, 72);
  }

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(20, 88); ctx.lineTo(W - 20, 88); ctx.stroke();

  // Key facts grid
  const facts = [
    ['📅', 'Days', c.days], ['☀️', 'Sun', c.sun],
    ['💧', 'Water', c.water], ['📏', 'Spacing', c.spacing],
    ['🌡', 'Germ temp', c.germ_temp], ['🧪', 'Soil pH', c.soil_ph],
  ].filter(f => f[2]);

  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = '#86efac';
  facts.slice(0, 6).forEach(([icon, lbl, val], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 22 + col * 190, y = 112 + row * 44;
    ctx.fillStyle = '#86efac';
    ctx.font = 'bold 10px system-ui';
    ctx.fillText(lbl.toUpperCase(), x, y);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px system-ui';
    ctx.fillText(val.slice(0, 28), x, y + 16);
  });

  // Tip
  if (c.tip) {
    ctx.fillStyle = 'rgba(74,222,128,0.12)';
    ctx.beginPath();
    ctx.roundRect?.(20, 210, W - 40, 72, 8) || ctx.rect(20, 210, W - 40, 72);
    ctx.fill();
    ctx.fillStyle = '#86efac';
    ctx.font = 'bold 10px system-ui';
    ctx.fillText('💡 TIP', 32, 228);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px system-ui';
    const tipWords = c.tip.split(' ');
    let line = '', y2 = 244;
    for (const w of tipWords) {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > W - 80 && line) { ctx.fillText(line.trim(), 32, y2); line = w + ' '; y2 += 16; if (y2 > 275) break; }
      else line = test;
    }
    if (line && y2 <= 275) ctx.fillText(line.trim(), 32, y2);
  }

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '10px system-ui';
  ctx.fillText('Plant Zone Finder · djamies1.github.io/garden-zones', 22, H - 14);

  // Share / download
  canvas.toBlob(blob => {
    if (!blob) return;
    const file = new File([blob], `${name.toLowerCase().replace(/\s+/g,'-')}-crop-card.png`, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], title: `${name} — Growing Guide` }).catch(() => {});
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  }, 'image/png');
}

// ── Phase 115: Year-at-a-Glance Calendar ─────────────────────────────────────
function setYearView(mode) {
  yearViewMode = mode;
  renderYearView();
}

function renderYearView() {
  const el = document.getElementById('year-view');
  if (!el || !selectedZone) return;

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const ABBR   = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  const curM   = currentMonth; // 1-indexed

  const gardenCrops = Object.keys(myGarden || {})
    .filter(n => myGarden[n] && myGarden[n].status !== 'archived');

  const tabsHtml = `
    <div class="yv-tabs">
      <button class="yv-tab${yearViewMode==='garden'?' yv-tab--active':''}" data-yv="garden">My Garden</button>
      <button class="yv-tab${yearViewMode==='zone'?' yv-tab--active':''}" data-yv="zone">All in Zone</button>
    </div>`;

  const headerHtml = `
    <div class="yv-header">
      <span class="yv-title">Year at a Glance</span>
      ${tabsHtml}
    </div>`;

  // ── Month header row ──────────────────────────────
  const thCells = ABBR.map((a, i) =>
    `<th class="yv-mth${i+1===curM?' yv-mth--cur':''}" data-yv-month="${i+1}">${a}</th>`
  ).join('');

  if (yearViewMode === 'garden') {
    // My Garden view — one row per garden crop
    if (!gardenCrops.length) {
      el.innerHTML = `
        <div class="yv-wrap">
          ${headerHtml}
          <p class="yv-empty">Add crops to your garden to see your year at a glance.</p>
        </div>`;
      el.querySelectorAll('.yv-tab').forEach(btn =>
        btn.addEventListener('click', () => setYearView(btn.dataset.yv)));
      return;
    }

    // Build activity data for each garden crop across all 12 months
    const rows = gardenCrops.map(name => {
      const months = ABBR.map((_, i) => {
        const m = i + 1;
        const d = getPlantingData(selectedZone, m);
        const acts = [];
        if ((d.startIndoors || []).includes(name)) acts.push('si');
        if ((d.directSow    || []).includes(name)) acts.push('ds');
        if ((d.transplant   || []).includes(name)) acts.push('tr');
        if ((d.harvest      || []).includes(name)) acts.push('hv');
        return acts;
      });
      const firstActive = months.findIndex(a => a.length > 0);
      return { name, months, firstActive };
    }).sort((a, b) => {
      // Sort by first active month; crops with no data go to bottom
      if (a.firstActive === -1 && b.firstActive === -1) return 0;
      if (a.firstActive === -1) return 1;
      if (b.firstActive === -1) return -1;
      return a.firstActive - b.firstActive;
    });

    const bodyRows = rows.map(({ name, months }) => {
      const em = cropData?.[name]?.emoji || '🌱';
      const cells = months.map((acts, i) => {
        const isCur = i + 1 === curM;
        if (!acts.length) return `<td class="yv-cell${isCur?' yv-cell--cur':''}"></td>`;
        const dots = acts.map(a => `<span class="yv-dot yv-dot--${a}"></span>`).join('');
        return `<td class="yv-cell yv-cell--has${isCur?' yv-cell--cur':''}">${dots}</td>`;
      }).join('');
      return `<tr class="yv-row" data-crop="${name}">
        <td class="yv-name">${em} <span class="yv-crop-label">${name}</span></td>
        ${cells}
      </tr>`;
    }).join('');

    const legendHtml = `
      <div class="yv-legend">
        <span class="yv-legend-item"><span class="yv-dot yv-dot--si"></span>Start Indoors</span>
        <span class="yv-legend-item"><span class="yv-dot yv-dot--ds"></span>Direct Sow</span>
        <span class="yv-legend-item"><span class="yv-dot yv-dot--tr"></span>Transplant</span>
        <span class="yv-legend-item"><span class="yv-dot yv-dot--hv"></span>Harvest</span>
      </div>`;

    el.innerHTML = `
      <div class="yv-wrap">
        ${headerHtml}
        <div class="yv-scroll">
          <table class="yv-table">
            <thead><tr><th class="yv-name-col"></th>${thCells}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>
        ${legendHtml}
      </div>`;

  } else {
    // All in Zone view — 4 activity-type rows, cells show count heat
    const CATS = [
      { key: 'startIndoors', cls: 'si', label: '🏠 Start Indoors' },
      { key: 'directSow',    cls: 'ds', label: '🌱 Direct Sow' },
      { key: 'transplant',   cls: 'tr', label: '🪴 Transplant' },
      { key: 'harvest',      cls: 'hv', label: '🌾 Harvest' },
    ];

    const bodyRows = CATS.map(({ key, cls, label }) => {
      const cells = ABBR.map((_, i) => {
        const m = i + 1;
        const d = getPlantingData(selectedZone, m);
        const count = (d[key] || []).length;
        const isCur = m === curM;
        const intensity = count === 0 ? 0 : count < 5 ? 1 : count < 15 ? 2 : count < 30 ? 3 : 4;
        return `<td class="yv-cell yv-zone-cell${isCur?' yv-cell--cur':''}" data-yv-month="${m}" data-count="${count}">
          ${count ? `<span class="yv-count yv-count--${cls} yv-count--i${intensity}">${count}</span>` : ''}
        </td>`;
      }).join('');
      return `<tr class="yv-row-zone">
        <td class="yv-name yv-name--zone">${label}</td>
        ${cells}
      </tr>`;
    }).join('');

    el.innerHTML = `
      <div class="yv-wrap">
        ${headerHtml}
        <div class="yv-scroll">
          <table class="yv-table">
            <thead><tr><th class="yv-name-col"></th>${thCells}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>
        <p class="yv-zone-note">Numbers show how many crops are active. Tap a month to jump to it.</p>
      </div>`;
  }

  // ── Wire event listeners ──────────────────────────
  // Tab toggle
  el.querySelectorAll('.yv-tab').forEach(btn =>
    btn.addEventListener('click', () => setYearView(btn.dataset.yv)));

  // Month header click → navigate to that month
  el.querySelectorAll('.yv-mth[data-yv-month]').forEach(th => {
    th.addEventListener('click', () => {
      currentMonth = parseInt(th.dataset.yvMonth, 10);
      renderPanel();
    });
  });

  // Zone view cell click → navigate
  el.querySelectorAll('.yv-zone-cell[data-yv-month]').forEach(td => {
    if (parseInt(td.dataset.count, 10) > 0) {
      td.addEventListener('click', () => {
        currentMonth = parseInt(td.dataset.yvMonth, 10);
        renderPanel();
      });
    }
  });

  // Garden view row click → open crop detail
  el.querySelectorAll('.yv-row[data-crop]').forEach(row => {
    row.addEventListener('click', () => openCropDetail(row.dataset.crop));
  });
}

function renderSuccessionStrip(month) {
  const el = document.getElementById('succession-strip');
  if (!el) return;

  const zone     = selectedZone?.toLowerCase();
  const zoneData = zone ? getPlantingData(zone, month) : {};

  // Collect all sowable crops for this month
  const sowable = [...new Set([
    ...(zoneData.directSow    || []),
    ...(zoneData.startIndoors || []),
  ])];

  // Keep only those with succession_weeks
  const succCrops = sowable
    .filter(name => cropData?.[name]?.succession_weeks)
    .map(name => ({
      name,
      weeks: cropData[name].succession_weeks,
      emoji: cropData[name].emoji || '🌱',
    }));

  if (!succCrops.length) { el.innerHTML = ''; return; }

  // Cutoff: first frost date, or 5 months out if unknown
  let cutoff = null;
  if (selectedZone) {
    const frost = FROST_DATES[selectedZone.toLowerCase()];
    if (frost?.first) cutoff = parseFrostDate(frost.first);
  }
  const year    = new Date().getFullYear();
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const maxDate = cutoff || new Date(year, month - 1 + 5, 1);
  const MON     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const rows = succCrops.map(({ name, weeks, emoji }) => {
    const chips = [];
    let d = new Date(year, month - 1, 1);
    while (d <= maxDate && chips.length < 6) {
      const diff = Math.round((d - today) / 86400000);
      const cls  = diff < -1 ? 'suc-chip--past'
                 : diff <= 1 ? 'suc-chip--now'
                 :              '';
      chips.push(`<span class="suc-chip ${cls}">${MON[d.getMonth()]} ${d.getDate()}</span>`);
      d = new Date(d.getTime() + weeks * 7 * 86400000);
    }
    return `<div class="suc-row">
      <span class="suc-crop">${emoji} ${name}<span class="suc-every">↻${weeks}w</span></span>
      <div class="suc-chips">${chips.join('')}</div>
    </div>`;
  }).join('');

  el.innerHTML = `<div class="suc-wrap">
    <div class="suc-hd">Succession Schedule</div>
    ${rows}
  </div>`;
}

function renderFrostCountdown() {
  const el = document.getElementById('frost-countdown');
  if (!el || !selectedZone) { if (el) el.innerHTML = ''; return; }

  const frost = FROST_DATES[selectedZone.toLowerCase()];
  if (!frost?.last && !frost?.first) { el.innerHTML = ''; return; }

  // Parse frost dates for a specific year (no year-advance logic)
  const MON_IDX = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
  const MON_ABR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function parseFrostForYear(str, yr) {
    if (!str) return null;
    const m = str.match(/([a-zA-Z]+)\s+(\d+)/);
    if (!m) return null;
    const mi = MON_IDX[m[1].toLowerCase().slice(0, 3)];
    return (mi !== undefined) ? new Date(yr, mi, parseInt(m[2])) : null;
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yr    = today.getFullYear();

  const lastFrost  = parseFrostForYear(frost.last,  yr);
  const firstFrost = parseFrostForYear(frost.first, yr);

  let icon, label, detail, mod;

  if (lastFrost && today <= lastFrost) {
    // Spring — counting down to last frost
    const days = Math.round((lastFrost - today) / 86400000);
    const ds   = `${MON_ABR[lastFrost.getMonth()]} ${lastFrost.getDate()}`;
    icon   = '❄️';
    label  = days === 0 ? 'Last frost today' : `Last frost in ${days} day${days === 1 ? '' : 's'}`;
    detail = days <= 7  ? `${ds} — hold off on tender transplants`
           : days <= 21 ? `${ds} — start hardening off soon`
           :               `${ds} — good time to start seeds indoors`;
    mod    = days <= 7  ? 'fcd--urgent' : days <= 21 ? 'fcd--warn' : 'fcd--calm';

  } else if (firstFrost && today < firstFrost) {
    // Frost-free window — counting down to first frost
    const days = Math.round((firstFrost - today) / 86400000);
    const ds   = `${MON_ABR[firstFrost.getMonth()]} ${firstFrost.getDate()}`;
    icon   = '🌱';
    label  = `${days} frost-free day${days === 1 ? '' : 's'} left`;
    detail = days <= 14 ? `First frost ${ds} — protect tender crops now`
           : days <= 45 ? `First frost ${ds} — plan your harvest`
           :               `First frost ~${ds}`;
    mod    = days <= 14 ? 'fcd--warn' : 'fcd--safe';

  } else {
    // Winter — show next last frost (next year)
    const nextLast = parseFrostForYear(frost.last, yr + 1);
    if (!nextLast) { el.innerHTML = ''; return; }
    const days = Math.round((nextLast - today) / 86400000);
    const ds   = `${MON_ABR[nextLast.getMonth()]} ${nextLast.getDate()}`;
    icon   = '❄️';
    label  = `Last frost in ${days} days`;
    detail = `${ds} — plan seeds to start indoors`;
    mod    = 'fcd--calm';
  }

  el.innerHTML = `<div class="fcd ${mod}">
    <span class="fcd-icon">${icon}</span>
    <div class="fcd-body">
      <span class="fcd-label">${label}</span>
      <span class="fcd-detail">${detail}</span>
    </div>
  </div>`;
}

function renderSeasonProgress() {
  const el = document.getElementById('season-progress');
  if (!el || !selectedZone) { if (el) el.innerHTML = ''; return; }
  const frost = FROST_DATES[selectedZone.toLowerCase()];
  if (!frost?.last || !frost?.first) { el.innerHTML = ''; return; }

  const MON_IDX = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
  function parseFrost(str, yr) {
    const m = str?.match(/([a-zA-Z]+)\s+(\d+)/);
    if (!m) return null;
    const mi = MON_IDX[m[1].toLowerCase().slice(0,3)];
    return (mi !== undefined) ? new Date(yr, mi, parseInt(m[2])) : null;
  }

  const today = new Date(); today.setHours(0,0,0,0);
  const yr = today.getFullYear();
  const last  = parseFrost(frost.last,  yr);
  const first = parseFrost(frost.first, yr);
  if (!last || !first || first <= last) { el.innerHTML = ''; return; }

  const seasonLen = first - last;
  const elapsed   = Math.max(0, today - last);
  const pct       = Math.min(100, Math.round((elapsed / seasonLen) * 100));
  const weeksIn   = Math.max(0, Math.round(elapsed / 604800000));
  const weeksTotal = Math.round(seasonLen / 604800000);

  const fmt = d => `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getDate()}`;
  const inSeason = today >= last && today < first;

  el.innerHTML = `
    <div class="sp-wrap">
      <div class="sp-labels">
        <span class="sp-date">❄️ ${fmt(last)}</span>
        <span class="sp-week">${inSeason ? `Week ${weeksIn} of ${weeksTotal}` : pct === 0 ? 'Season not started' : 'Season ended'}</span>
        <span class="sp-date">${fmt(first)} ❄️</span>
      </div>
      <div class="sp-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Growing season progress: ${pct}%">
        <div class="sp-fill" style="width:${pct}%"></div>
        <div class="sp-today" style="left:${pct}%" title="Today"></div>
      </div>
    </div>`;
}

function toggleCompareMode() {
  compareMode = !compareMode;
  compareSet  = [];
  const btn  = document.getElementById('browse-compare-btn');
  const view = document.getElementById('browse-view');
  const dr   = document.getElementById('compare-drawer');
  if (btn)  btn.classList.toggle('browse-cmp-btn--active', compareMode);
  if (view) view.classList.toggle('browse-compare-mode', compareMode);
  if (dr)   dr.hidden = true;
  renderBrowseGrid();
}

function addToCompare(name) {
  const idx = compareSet.indexOf(name);
  if (idx !== -1) {
    compareSet.splice(idx, 1); // deselect
  } else if (compareSet.length < 2) {
    compareSet.push(name);
  }
  renderBrowseGrid();
  renderCompareDrawer();
}

function renderCompareDrawer() {
  const el = document.getElementById('compare-drawer');
  if (!el) return;

  if (!compareMode || compareSet.length === 0) { el.hidden = true; return; }

  el.hidden = false;

  if (compareSet.length === 1) {
    const c = cropData[compareSet[0]];
    el.innerHTML = `<div class="cmp-tray">
      <span class="cmp-tray-item">${c?.emoji || '🌱'} ${compareSet[0]}</span>
      <span class="cmp-tray-hint">Select one more crop to compare</span>
      <button class="cmp-clear" onclick="toggleCompareMode()">✕ Clear</button>
    </div>`;
    return;
  }

  const [nameA, nameB] = compareSet;
  const a = cropData[nameA];
  const b = cropData[nameB];
  if (!a || !b) return;

  const DIFF_ICON = { Easy: '🟢', Moderate: '🟡', Hard: '🔴' };

  function cmpRow(lbl, va, vb) {
    const fa = va ? convertMeasurement(String(va)) : '—';
    const fb = vb ? convertMeasurement(String(vb)) : '—';
    const diff = fa !== '—' && fb !== '—' && fa !== fb ? ' cmp-val--diff' : '';
    return `<div class="cmp-row">
      <span class="cmp-lbl">${lbl}</span>
      <span class="cmp-val${diff}">${fa}</span>
      <span class="cmp-val${diff}">${fb}</span>
    </div>`;
  }

  const famA = a.family || CROP_FAMILIES?.[nameA] || '—';
  const famB = b.family || CROP_FAMILIES?.[nameB] || '—';

  const rows = [
    cmpRow('Days', a.days, b.days),
    cmpRow('Difficulty',
      a.difficulty ? `${DIFF_ICON[a.difficulty] || ''} ${a.difficulty}` : null,
      b.difficulty ? `${DIFF_ICON[b.difficulty] || ''} ${b.difficulty}` : null),
    cmpRow('Sun', a.sun, b.sun),
    cmpRow('Water', a.water, b.water),
    cmpRow('Depth', a.depth, b.depth),
    cmpRow('Spacing', a.spacing, b.spacing),
    cmpRow('Family', famA, famB),
    cmpRow('Container', a.container_ok ? '✅ Yes' : '—', b.container_ok ? '✅ Yes' : '—'),
  ].join('');

  const sharedComps = (a.companions || []).filter(c => (b.companions || []).includes(c));
  const sharedHtml  = sharedComps.length
    ? sharedComps.map(c => `<span class="cmp-tag">${cropData[c]?.emoji || '🌱'} ${c}</span>`).join('')
    : '<span class="cmp-none">No shared companions</span>';

  el.innerHTML = `<div class="cmp-drawer-inner">
    <div class="cmp-head-row">
      <span class="cmp-lbl"></span>
      <span class="cmp-head-crop">${a.emoji || '🌱'} ${nameA}</span>
      <span class="cmp-head-crop">${b.emoji || '🌱'} ${nameB}</span>
    </div>
    ${rows}
    <div class="cmp-shared-row">
      <span class="cmp-lbl">🤝 Shared companions</span>
      <div class="cmp-shared-tags">${sharedHtml}</div>
    </div>
    <button class="cmp-clear" onclick="toggleCompareMode()">✕ Done</button>
  </div>`;
}

function renderWateringSchedule() {
  const el = document.getElementById('watering-schedule');
  if (!el) return;

  const planted = Object.keys(myGarden).filter(n => myGarden[n]?.planted);
  if (!planted.length) { el.innerHTML = ''; return; }

  const today = new Date(); today.setHours(0, 0, 0, 0);

  // Recent rain extends the schedule
  const recentRain = weatherData?.daily?.precipitation_sum
    ? (weatherData.daily.precipitation_sum[0] || 0) + (weatherData.daily.precipitation_sum[1] || 0)
    : 0;
  const rainBonus = recentRain >= 5 ? 2 : recentRain >= 2 ? 1 : 0;

  const crops = planted.map(name => {
    const interval  = getCropWaterInterval(name);
    const lastDate  = myGarden[name].waterLog?.[0]?.date;
    const daysSince = lastDate ? Math.round((today - new Date(lastDate + 'T00:00:00')) / 86400000) : null;
    const daysUntil = daysSince !== null ? (interval - daysSince) + rainBonus : null;
    return { name, daysUntil };
  }).filter(c => c.daysUntil === null || c.daysUntil <= 7)
    .sort((a, b) => (a.daysUntil ?? -99) - (b.daysUntil ?? -99));

  if (!crops.length) { el.innerHTML = ''; return; }

  const rainNote = rainBonus > 0
    ? `<div class="ws-rain-note">🌧 ${Math.round(recentRain)}mm recently — schedule extended by ${rainBonus}d</div>`
    : '';

  const rows = crops.map(({ name, daysUntil }) => {
    const emoji = cropData[name]?.emoji || '🌱';
    let status, cls;
    if      (daysUntil === null)  { status = 'Never logged'; cls = 'ws-row--nolog';   }
    else if (daysUntil < 0)       { status = `${Math.abs(daysUntil)}d overdue`;  cls = 'ws-row--overdue'; }
    else if (daysUntil === 0)     { status = 'Due today';    cls = 'ws-row--today';   }
    else if (daysUntil === 1)     { status = 'Due tomorrow'; cls = 'ws-row--soon';    }
    else                          { status = `in ${daysUntil}d`;   cls = 'ws-row--later';   }
    const showBtn = daysUntil === null || daysUntil <= 1;
    return `<div class="ws-row ${cls}">
      <span class="ws-emoji">${emoji}</span>
      <span class="ws-name">${name}</span>
      <span class="ws-status">${status}</span>
      ${showBtn ? `<button class="ws-log-btn" data-crop="${name}">💧</button>` : ''}
    </div>`;
  }).join('');

  el.innerHTML = `<div class="ws-card">
    <div class="ws-hd">💧 Watering Schedule</div>
    ${rainNote}
    <div class="ws-list">${rows}</div>
  </div>`;

  el.querySelectorAll('.ws-log-btn').forEach(btn =>
    btn.addEventListener('click', e => { e.stopPropagation(); logWatering(btn.dataset.crop); })
  );
}

function renderGardenDiversity() {
  const el = document.getElementById('garden-diversity');
  if (!el) return;
  const names = Object.keys(myGarden);
  if (names.length < 2) { el.innerHTML = ''; return; }

  // 1. Family diversity
  const famCount = {};
  names.forEach(n => {
    const f = CROP_FAMILIES[n] || cropData[n]?.family;
    if (f) famCount[f] = (famCount[f] || 0) + 1;
  });
  const uniqueFams = Object.keys(famCount);
  const topFam     = [...uniqueFams].sort((a, b) => famCount[b] - famCount[a])[0];
  const famScore   = Math.min(100, Math.round((uniqueFams.length / 5) * 100));

  // 2. Companion coverage
  const gardenSet = new Set(names);
  const paired    = names.filter(n => cropData[n]?.companions?.some(c => gardenSet.has(c))).length;
  const compPct   = Math.round((paired / names.length) * 100);

  // 3. Succession eligible
  const succCount = names.filter(n => cropData[n]?.succession_weeks).length;
  const succScore = Math.min(100, succCount * 20);

  // Diversity index
  const score     = Math.round(famScore * 0.5 + compPct * 0.3 + succScore * 0.2);
  const grade     = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';
  const gradeDesc = { A:'Diverse & balanced', B:'Good variety', C:'Building balance', D:'Just starting' }[grade];
  const gradeCls  = { A:'gdiv--a', B:'gdiv--b', C:'gdiv--c', D:'gdiv--d' }[grade];

  // Single most-actionable nudge
  const hasLegume = uniqueFams.includes('Legume');
  const hasAllium = uniqueFams.includes('Allium');
  let nudge = '';
  if (!hasLegume && names.length >= 3)
    nudge = 'Add beans or peas — legumes fix nitrogen and support your brassicas';
  else if (!hasAllium && names.length >= 4)
    nudge = 'Add garlic or onions — alliums deter aphids, slugs, and carrot fly';
  else if (topFam && famCount[topFam] >= names.length * 0.6 && names.length >= 4)
    nudge = `${topFam} dominates your garden — diversify for better rotation`;
  else if (compPct < 30 && names.length >= 4)
    nudge = 'Add companion plants — many crops have no pairing partner in your garden';

  function mRow(label, pct, val) {
    return `<div class="gdiv-row">
      <span class="gdiv-lbl">${label}</span>
      <div class="gdiv-bar-track"><div class="gdiv-bar-fill" style="width:${pct}%"></div></div>
      <span class="gdiv-val">${val}</span>
    </div>`;
  }

  el.innerHTML = `<div class="gdiv-card ${gradeCls}">
    <div class="gdiv-header">
      <span class="gdiv-title">🌿 Garden Diversity</span>
      <span class="gdiv-grade">${grade}</span>
    </div>
    <div class="gdiv-desc">${gradeDesc}</div>
    <div class="gdiv-rows">
      ${mRow('Family spread', famScore, `${uniqueFams.length} families`)}
      ${mRow('Companion pairs', compPct, `${compPct}%`)}
      ${mRow('Succession crops', succScore, `${succCount} eligible`)}
    </div>
    ${nudge ? `<div class="gdiv-nudge">💡 ${nudge}</div>` : ''}
  </div>`;
}

function getStageTip(name, stage) {
  if (!stage) return '';
  const c = cropData?.[name];
  if (!c) return '';

  const firstPest  = (c.pests || [])[0];
  const twoPests   = (c.pests || []).slice(0, 2).join(' & ');
  const fertShort  = c.fertilizer ? c.fertilizer.split(/[.;]/)[0].trim() : '';
  const cueShort   = c.harvest_cues ? c.harvest_cues.split(/[.;]/)[0].trim() : '';
  const storShort  = c.storage ? c.storage.split(/[.;]/)[0].trim() : '';

  switch (stage) {
    case 'germinating':
      return c.germ_temp
        ? `Keep soil at ${c.germ_temp} and evenly moist — do not let it dry out.`
        : 'Keep soil consistently warm and moist until sprouts appear.';

    case 'seedling': {
      const thin = c.spacing ? `Thin to ${convertMeasurement(c.spacing)}.` : '';
      const pest = firstPest ? `Watch for ${firstPest}.` : '';
      return [thin, pest].filter(Boolean).join(' ') || 'Water gently; protect from slugs and damping-off.';
    }

    case 'growing': {
      const fert = fertShort ? `${fertShort}.` : '';
      const pest = twoPests  ? `Watch for ${twoPests}.` : '';
      return [fert, pest].filter(Boolean).join(' · ') || `Water ${c.water || 'regularly'} and feed for strong growth.`;
    }

    case 'maturing':
      return cueShort
        ? `Almost there — ${cueShort.charAt(0).toLowerCase() + cueShort.slice(1)}.`
        : 'Monitor daily — the harvest window can be short.';

    case 'ready':
      return storShort
        ? `Harvest soon. ${storShort}.`
        : (cueShort || 'Harvest now before quality peaks and declines.');

    default:
      return '';
  }
}

// ── Phase 125: Journal auto-milestones ───────────────
function autoMilestone(text, cropName, type) {
  const today = new Date().toISOString().slice(0, 10);
  // Same-day dedup: skip if identical type+crop already exists today
  const dup = journalEntries.find(e =>
    e.milestone && e.milestoneType === type && e.crop === cropName &&
    (e.date || '').slice(0, 10) === today
  );
  if (dup) return;
  const entry = {
    id:            Date.now(),
    date:          new Date().toISOString(),
    text:          text,
    crop:          cropName || null,
    weather:       null,
    photoId:       null,
    milestone:     true,
    milestoneType: type,
  };
  journalEntries.unshift(entry);
  saveJournal();
  if (currentPanelTab === 'journal') renderJournalTab();
}

// ── Phase 126: Crop rotation advisor ─────────────────
function renderRotationAdvisor() {
  const el = document.getElementById('rotation-advisor');
  if (!el) return;

  const currentNames = Object.keys(myGarden);
  if (currentNames.length < 2) { el.innerHTML = ''; return; }

  loadHistory();
  const thisYear = new Date().getFullYear();

  // Build family → years grown map from history + current
  const famYears = {}; // family → Set of years
  for (const h of gardenHistory) {
    const fam = CROP_FAMILIES[h.name] || cropData?.[h.name]?.family;
    if (!fam || ROTATION_SAFE.has(fam)) continue;
    if (!famYears[fam]) famYears[fam] = new Set();
    famYears[fam].add(h.year || thisYear);
  }
  // Add current crops as this year
  for (const name of currentNames) {
    const fam = CROP_FAMILIES[name] || cropData?.[name]?.family;
    if (!fam || ROTATION_SAFE.has(fam)) continue;
    if (!famYears[fam]) famYears[fam] = new Set();
    famYears[fam].add(thisYear);
  }

  // Warnings: families grown in 2+ of last 3 years
  const warnings = [];
  for (const [fam, years] of Object.entries(famYears)) {
    const recent = [...years].filter(y => y >= thisYear - 2);
    if (recent.length >= 2) {
      const rule = ROTATION_RULES[fam];
      if (!rule) continue;
      const icon = FAMILY_EMOJI[fam] || '🌿';
      warnings.push({ fam, icon, years: recent.sort(), reason: rule.warn, next: rule.next });
    }
  }

  // Current families → what to plant next season
  const currentFams = [...new Set(
    currentNames.map(n => CROP_FAMILIES[n] || cropData?.[n]?.family).filter(Boolean)
  )];
  const suggestions = [];
  for (const fam of currentFams) {
    const rule = ROTATION_RULES[fam];
    if (!rule) continue;
    // Filter out families already in current garden this season
    const freshNext = rule.next.filter(f => !currentFams.includes(f));
    if (freshNext.length) {
      suggestions.push({ afterFam: fam, afterIcon: FAMILY_EMOJI[fam] || '🌿', next: freshNext });
    }
  }

  if (!warnings.length && !suggestions.length) { el.innerHTML = ''; return; }

  const warnHtml = warnings.map(w => {
    const yrsStr = w.years.join(', ');
    const nextFams = w.next.map(f => `<span class="rota-chip">${FAMILY_EMOJI[f] || ''} ${f}</span>`).join('');
    return `<div class="rota-warn-row">
      <span class="rota-fam-icon">${w.icon}</span>
      <div class="rota-warn-body">
        <span class="rota-fam-name">${w.fam}</span>
        <span class="rota-warn-reason">${w.reason} (${yrsStr})</span>
        <div class="rota-next-row"><span class="rota-next-label">Try next:</span>${nextFams}</div>
      </div>
    </div>`;
  }).join('');

  const sugHtml = suggestions.length ? `
    <div class="rota-sug-section">
      <div class="rota-sug-hd">Next season suggestions</div>
      ${suggestions.map(s => {
        const chips = s.next.map(f => `<span class="rota-chip rota-chip--sug">${FAMILY_EMOJI[f] || ''} ${f}</span>`).join('');
        return `<div class="rota-sug-row">After ${s.afterIcon} ${s.afterFam}: ${chips}</div>`;
      }).join('')}
    </div>` : '';

  el.innerHTML = `<div class="rota-card">
    <div class="rota-header">
      <span class="rota-title">Rotation Advisor</span>
    </div>
    ${warnHtml}
    ${sugHtml}
  </div>`;
}

// ── Phase 127: Yield logger ───────────────────────────
function getYieldKg(name) {
  const year = String(new Date().getFullYear());
  let kg = 0;
  for (const h of (myGarden[name]?.harvestLog || [])) {
    if (!h.date.startsWith(year)) continue;
    if (!h.qty) continue;
    const u = (h.unit || '').toLowerCase();
    if      (u === 'kg')              kg += h.qty;
    else if (u === 'lbs' || u === 'lb') kg += h.qty * 0.4536;
    else if (u === 'g')               kg += h.qty / 1000;
    else if (u === 'oz')              kg += h.qty * 0.02835;
    else if (u === 'count')           kg += h.qty * 0.15;
    else if (u === 'bunch')           kg += h.qty * 0.25;
  }
  return kg;
}

let _ylExpanded = null; // crop name currently showing inline form

function renderYieldLogger() {
  const el = document.getElementById('yield-logger');
  if (!el) return;

  const names = Object.keys(myGarden).filter(n => myGarden[n]?.planted);
  if (!names.length) { el.innerHTML = ''; return; }

  const year = new Date().getFullYear();

  // Crops eligible for quick-log: harvest-ready or already have a harvest entry
  const loggable = names.filter(n => {
    const st = getGardenStatus(n);
    return st?.type === 'ready' || (myGarden[n]?.harvestLog?.length || 0) > 0;
  }).sort((a, b) => {
    // ready crops first, then by name
    const aReady = getGardenStatus(a)?.type === 'ready' ? 0 : 1;
    const bReady = getGardenStatus(b)?.type === 'ready' ? 0 : 1;
    return aReady - bReady || a.localeCompare(b);
  });

  // Weight leaderboard: crops with any qty data this season
  const yieldData = names
    .map(n => ({ name: n, kg: getYieldKg(n), count: (myGarden[n]?.harvestLog || []).filter(h => h.date.startsWith(year)).length }))
    .filter(d => d.kg > 0)
    .sort((a, b) => b.kg - a.kg);

  const totalKg = yieldData.reduce((s, d) => s + d.kg, 0);
  const maxKg   = yieldData[0]?.kg || 1;
  const fmtKg   = kg => kg >= 1 ? `${kg.toFixed(1)} kg` : `${Math.round(kg * 1000)} g`;

  const leaderboardHtml = yieldData.length ? `
    <div class="yl-leaderboard">
      <div class="yl-total">Season total: <strong>${fmtKg(totalKg)}</strong></div>
      ${yieldData.slice(0, 6).map(d => `
        <div class="yl-lb-row">
          <span class="yl-lb-emoji">${cropData[d.name]?.emoji || '🌱'}</span>
          <span class="yl-lb-name">${d.name}</span>
          <div class="yl-lb-bar-track"><div class="yl-lb-bar" style="width:${Math.round((d.kg/maxKg)*100)}%"></div></div>
          <span class="yl-lb-val">${fmtKg(d.kg)}</span>
        </div>`).join('')}
    </div>` : '';

  const quickRows = loggable.slice(0, 8).map(name => {
    const c = cropData[name];
    const isReady = getGardenStatus(name)?.type === 'ready';
    const isExpanded = _ylExpanded === name;
    const inlineForm = isExpanded ? `
      <div class="yl-inline-form" id="yl-form-${name.replace(/\s/g,'-')}">
        <input type="number" class="yl-qty-in" placeholder="Qty" min="0" step="any" aria-label="Quantity">
        <select class="yl-unit-in" aria-label="Unit">
          <option value="kg">kg</option>
          <option value="lbs">lbs</option>
          <option value="g">g</option>
          <option value="oz">oz</option>
          <option value="count" selected>count</option>
          <option value="bunch">bunch</option>
        </select>
        <button class="yl-log-btn" onclick="ylQuickLog('${name.replace(/'/g,"\\'")}')">Log</button>
        <button class="yl-cancel-btn" onclick="ylCancel()">✕</button>
      </div>` : '';
    return `<div class="yl-crop-row${isReady ? ' yl-crop-row--ready' : ''}" id="yl-row-${name.replace(/\s/g,'-')}">
      <span class="yl-crop-emoji">${c?.emoji || '🌱'}</span>
      <span class="yl-crop-name">${name}${isReady ? ' <span class="yl-ready-dot"></span>' : ''}</span>
      <button class="yl-harvest-btn" onclick="ylExpand('${name.replace(/'/g,"\\'")}')">+ Log</button>
      ${inlineForm}
    </div>`;
  }).join('');

  el.innerHTML = `<div class="yl-card">
    <div class="yl-header">
      <span class="yl-title">Yield Logger</span>
      <span class="yl-year">${year}</span>
    </div>
    ${leaderboardHtml}
    ${quickRows ? `<div class="yl-quick-section">
      <div class="yl-quick-hd">Quick log</div>
      ${quickRows}
    </div>` : ''}
  </div>`;
}

function ylExpand(name) {
  _ylExpanded = (_ylExpanded === name) ? null : name;
  renderYieldLogger();
  // Focus qty input
  if (_ylExpanded) {
    const id = `yl-form-${name.replace(/\s/g,'-')}`;
    setTimeout(() => document.getElementById(id)?.querySelector('.yl-qty-in')?.focus(), 50);
  }
}
function ylCancel() { _ylExpanded = null; renderYieldLogger(); }
function ylQuickLog(name) {
  const id = `yl-form-${name.replace(/\s/g,'-')}`;
  const form = document.getElementById(id);
  if (!form) return;
  const qty  = parseFloat(form.querySelector('.yl-qty-in').value) || null;
  const unit = form.querySelector('.yl-unit-in').value || null;
  const today = new Date().toISOString().slice(0, 10);
  gardenLogHarvest(name, today, '', qty, unit);
  _ylExpanded = null;
  showToast(`${cropData[name]?.emoji || '🌾'} ${name} logged!`, 'success');
}

// ── Phase 128: Today in the Garden dashboard ──────────
function renderTodayDashboard() {
  const el = document.getElementById('today-dashboard');
  if (!el) return;

  const planted = Object.keys(myGarden).filter(n => myGarden[n]?.planted);
  if (!planted.length) { el.innerHTML = ''; return; }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  // ── Gather items by urgency ──
  const urgent = [], warn = [], ok = [];

  // 1. Frost risk tonight/tomorrow
  if (weatherData?.daily?.temperature_2m_min) {
    const idx = weatherData.daily.temperature_2m_min.slice(0, 2).findIndex(t => t < 35);
    if (idx >= 0) {
      const atrisk = planted.filter(n => FROST_SENSITIVE.has(n));
      if (atrisk.length) {
        const lbl = idx === 0 ? 'tonight' : 'tomorrow night';
        const ns  = atrisk.slice(0, 2).map(n => cropData[n]?.emoji + ' ' + n).join(', ')
                  + (atrisk.length > 2 ? ` +${atrisk.length - 2}` : '');
        urgent.push({ icon: '❄️', text: `Frost possible ${lbl} — cover ${ns}`, action: null, cls: 'td-item--frost' });
      }
    }
  }

  // 2. Open unresolved problems
  const problems = planted.filter(n => myGarden[n].problems?.some(p => !p.resolved));
  if (problems.length) {
    const ns = problems.slice(0, 2).map(n => cropData[n]?.emoji + ' ' + n).join(', ')
             + (problems.length > 2 ? ` +${problems.length - 2}` : '');
    urgent.push({ icon: '🐛', text: `Active problem on ${ns}`, action: null, cls: 'td-item--problem' });
  }

  // 3. Ready to harvest
  const ready = planted.filter(n => getGardenStatus(n)?.type === 'ready');
  if (ready.length) {
    const ns = ready.slice(0, 3).map(n => `${cropData[n]?.emoji || '🌱'} ${n}`).join(', ')
             + (ready.length > 3 ? ` +${ready.length - 3}` : '');
    urgent.push({ icon: '🌾', text: `${ns} ready to harvest`, action: 'harvest', cls: 'td-item--harvest' });
  }

  // 4. Overdue watering
  const recentRain = weatherData?.daily?.precipitation_sum
    ? (weatherData.daily.precipitation_sum[0] || 0) + (weatherData.daily.precipitation_sum[1] || 0) : 0;
  const rainBonus = recentRain >= 5 ? 2 : recentRain >= 2 ? 1 : 0;

  for (const name of planted) {
    const interval  = getCropWaterInterval(name);
    if (!interval) continue;
    const lastDate  = myGarden[name].waterLog?.[0]?.date;
    if (!lastDate) continue;
    const daysSince = Math.round((today - new Date(lastDate + 'T00:00:00')) / 86400000);
    const daysUntil = (interval - daysSince) + rainBonus;
    if (daysUntil < 0) {
      urgent.push({ icon: '💧', text: `${cropData[name]?.emoji || '🌱'} ${name} overdue for water (${Math.abs(daysUntil)}d)`, action: `water:${name}`, cls: 'td-item--water' });
    } else if (daysUntil === 0) {
      warn.push({ icon: '💧', text: `${cropData[name]?.emoji || '🌱'} ${name} due for water today`, action: `water:${name}`, cls: 'td-item--water' });
    }
  }

  // 5. Crops never watered (just planted seedlings)
  const neverWatered = planted.filter(n => {
    const p = myGarden[n]?.planted;
    if (!p || myGarden[n].waterLog?.length) return false;
    const age = Math.round((today - new Date(p + 'T00:00:00')) / 86400000);
    return age <= 14;
  });
  if (neverWatered.length) {
    const ns = neverWatered.slice(0, 2).map(n => `${cropData[n]?.emoji || '🌱'} ${n}`).join(', ');
    warn.push({ icon: '💧', text: `${ns} newly planted — log first watering`, action: null, cls: 'td-item--water' });
  }

  // 6. Overdue fertilising (>21 days since last or never fertilised + planted ≥21 days)
  const FERT_INTERVAL = 21;
  const fertOverdue = planted.filter(n => {
    if (!myGarden[n]?.planted) return false;
    const daysSincePlant = Math.round((today - new Date(myGarden[n].planted + 'T00:00:00')) / 86400000);
    if (daysSincePlant < FERT_INTERVAL) return false;
    const fertLog = (myGarden[n].careLog || []).filter(e => e.type === 'fertilise');
    if (!fertLog.length) return true; // never fertilised
    const lastFert = new Date(fertLog[fertLog.length - 1].date + 'T00:00:00');
    return Math.round((today - lastFert) / 86400000) >= FERT_INTERVAL;
  });
  if (fertOverdue.length) {
    const ns = fertOverdue.slice(0, 2).map(n => `${cropData[n]?.emoji || '🌱'} ${n}`).join(', ')
             + (fertOverdue.length > 2 ? ` +${fertOverdue.length - 2}` : '');
    warn.push({ icon: '🧪', text: `${ns} due for fertilising`, action: null, cls: 'td-item--fert' });
  }

  // 7. Crops maturing soon (within 4 days)
  const maturingSoon = planted.filter(n => {
    const st = getGardenStatus(n);
    return st?.stage?.stage === 'maturing' && st?.stage?.pct >= 80;
  });
  if (maturingSoon.length) {
    const ns = maturingSoon.slice(0, 2).map(n => `${cropData[n]?.emoji || '🌱'} ${n}`).join(', ')
             + (maturingSoon.length > 2 ? ` +${maturingSoon.length - 2}` : '');
    ok.push({ icon: '📈', text: `${ns} almost harvest-ready`, action: null, cls: 'td-item--stage' });
  }

  // 8. Smart weather-to-garden alerts (Phase 135)
  if (weatherData?.daily) {
    const d = weatherData.daily;
    const todayStr = new Date().toISOString().slice(0, 10);
    const ti = Math.max(0, d.time.findIndex(t => t === todayStr));
    const prec = d.precipitation_sum;
    const tmax = d.temperature_2m_max;

    // Rain tomorrow → skip watering
    if (planted.length && prec?.[ti + 1] >= 0.1) {
      ok.push({ icon: '🌧', text: 'Rain forecast tomorrow — save watering until after', action: null, cls: 'td-item--rain' });
    }

    // Heat wave: max ≥ 93°F on 2+ of next 3 days
    if (tmax) {
      const hotDays = [ti, ti+1, ti+2].filter(i => (tmax[i] ?? 0) >= 93).length;
      if (hotDays >= 2 && planted.length) {
        const heatSensitive = planted.filter(n => HEAT_SENSITIVE.has(n));
        const extra = heatSensitive.length
          ? ` — protect ${heatSensitive.slice(0,2).map(n => cropData[n]?.emoji + ' ' + n).join(', ')}`
          : '';
        warn.push({ icon: '🔥', text: `Heat wave this week — water daily${extra}`, action: null, cls: 'td-item--heat' });
      }
    }

    // Dry spell: no rain past 4 days + next 3 days
    if (prec && planted.length) {
      const pastDry  = [ti-3, ti-2, ti-1, ti  ].every(i => i < 0 || (prec[i] ?? 0) < 0.05);
      const futureDry = [ti+1, ti+2, ti+3].every(i => (prec[i] ?? 0) < 0.05);
      if (pastDry && futureDry) {
        warn.push({ icon: '☀️', text: 'Extended dry spell — check soil moisture daily', action: null, cls: 'td-item--dry' });
      }
    }

    // Good transplant window: next 2–4 days cool (max < 72°F) with some rain
    if (tmax && prec) {
      const windowDays = [ti+1, ti+2, ti+3];
      const coolDays  = windowDays.filter(i => (tmax[i] ?? 99) < 72).length;
      const rainDays  = windowDays.filter(i => (prec[i] ?? 0) >= 0.04).length;
      const unplanted = planted.filter(n => !myGarden[n]?.planted);
      if (coolDays >= 2 && rainDays >= 1 && (unplanted.length || planted.length)) {
        ok.push({ icon: '🌱', text: 'Good transplant conditions coming — cool & cloudy days ahead', action: null, cls: 'td-item--transplant' });
      }
    }
  }

  if (!urgent.length && !warn.length && !ok.length) { el.innerHTML = ''; return; }

  const urgentCount = urgent.length + warn.length;
  const allItems = [...urgent, ...warn, ...ok];

  const renderItem = item => {
    const actionBtn = item.action
      ? item.action === 'harvest'
        ? `<button class="td-action-btn" onclick="switchToGardenTab()">View</button>`
        : item.action.startsWith('water:')
          ? `<button class="td-action-btn" onclick="tdLogWater('${item.action.slice(6).replace(/'/g,"\\'")}')">Log 💧</button>`
          : ''
      : '';
    return `<div class="td-item ${item.cls}">
      <span class="td-item-icon">${item.icon}</span>
      <span class="td-item-text">${item.text}</span>
      ${actionBtn}
    </div>`;
  };

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday:'long', month:'short', day:'numeric' });
  const badge = urgentCount > 0
    ? `<span class="td-badge td-badge--alert">${urgentCount} action${urgentCount !== 1 ? 's' : ''}</span>`
    : `<span class="td-badge td-badge--ok">All good</span>`;

  el.innerHTML = `<div class="td-card">
    <div class="td-header">
      <span class="td-title">Today</span>
      <span class="td-date">${dateLabel}</span>
      ${badge}
    </div>
    <div class="td-items">${allItems.map(renderItem).join('')}</div>
  </div>`;
}

function switchToGardenTab() {
  currentPanelTab = 'garden';
  document.querySelectorAll('.ptab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'garden'));
  document.getElementById('tab-calendar').hidden = true;
  document.getElementById('tab-garden').hidden   = false;
  document.getElementById('tab-journal').hidden  = true;
  renderGardenTab();
}

function tdLogWater(name) {
  logWatering(name);
  renderTodayDashboard();
}

// ── Phase 129: XP + Streaks ───────────────────────────
function getGardenLevel(xp) {
  // Each level costs level*50 XP. Thresholds: 0,50,150,300,500,750,1050,1400,1800…
  let level = 1, threshold = 0;
  while (xp >= threshold + level * 50) {
    threshold += level * 50;
    level++;
    if (level >= LEVEL_TITLES.length) break;
  }
  const xpInLevel  = xp - threshold;
  const xpForLevel = level < LEVEL_TITLES.length ? level * 50 : level * 50;
  return {
    level,
    title:     LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)],
    xpToNext:  xpForLevel - xpInLevel,
    pct:       Math.min(100, Math.round((xpInLevel / xpForLevel) * 100)),
  };
}

function loadXP() {
  try {
    const raw = JSON.parse(localStorage.getItem('pzf-xp') || '{}');
    gardenXP     = raw.xp     || 0;
    gardenStreak = raw.streak || { count: 0, lastDate: null };
  } catch { gardenXP = 0; gardenStreak = { count: 0, lastDate: null }; }
}
function saveXP() {
  localStorage.setItem('pzf-xp', JSON.stringify({ xp: gardenXP, streak: gardenStreak }));
}

function earnXP(amount, reason) {
  const before = getGardenLevel(gardenXP);
  gardenXP += amount;
  saveXP();
  const after = getGardenLevel(gardenXP);
  if (after.level > before.level) {
    showToast(`🎉 Level up! You're now a ${after.title} (Lv.${after.level})`, 'success');
  }
  // Refresh dashboard XP bar if visible
  if (currentPanelTab === 'garden') renderGardenDashboard();
}

function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  if (gardenStreak.lastDate === today) return; // already updated today
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  if (gardenStreak.lastDate === yStr) {
    gardenStreak.count++;
  } else if (gardenStreak.lastDate !== today) {
    gardenStreak.count = 1; // reset streak
  }
  gardenStreak.lastDate = today;
  saveXP();
  if (gardenStreak.count >= 3 && gardenStreak.count % 7 === 0) {
    showToast(`🔥 ${gardenStreak.count}-day streak! Keep it up!`, 'success');
  }
  if (currentPanelTab === 'garden') renderGardenDashboard();
}

// ── Phase 131: Season summary prompt card ────────────
function renderSeasonSummaryPrompt() {
  const el = document.getElementById('season-summary-prompt');
  if (!el) return;
  const names = Object.keys(myGarden);
  const totalHarvests = names.reduce((s, n) => s + (myGarden[n]?.harvestLog?.length || 0), 0);
  const totalKg = names.reduce((s, n) => s + getYieldKg(n), 0);
  // Show when: ≥3 harvests OR ≥5 crops OR ≥5 journal entries (something meaningful to summarise)
  const journalCount = journalEntries.filter(e => !e.milestone).length;
  if (totalHarvests < 3 && names.length < 5 && journalCount < 5) { el.innerHTML = ''; return; }

  const lvl = getGardenLevel(gardenXP);
  const fmtKg = kg => kg >= 1 ? `${kg.toFixed(1)} kg` : `${Math.round(kg * 1000)} g`;
  const month = new Date().getMonth(); // 0-indexed
  const isEndOfSeason = month >= 8; // Sep–Dec: encourage wrap-up

  el.innerHTML = `<div class="sspr-card${isEndOfSeason ? ' sspr-card--season' : ''}">
    <div class="sspr-left">
      <span class="sspr-icon">${isEndOfSeason ? '🍂' : '📊'}</span>
      <div class="sspr-body">
        <span class="sspr-title">${isEndOfSeason ? 'Season winding down' : 'Your garden so far'}</span>
        <span class="sspr-sub">${names.length} crops · ${totalHarvests} harvests${totalKg > 0.1 ? ` · ${fmtKg(totalKg)}` : ''} · Lv.${lvl.level} ${lvl.title}</span>
      </div>
    </div>
    <button class="sspr-btn" onclick="openSeasonWrapUp()">View summary</button>
  </div>`;
}

// ── Phase 133: Plant Problem Solver ─────────────────────────────────────────

const PROBLEM_DATABASE = [
  {
    id: 'yellow_leaves',
    label: 'Yellow / Pale Leaves',
    emoji: '🟡',
    causes: [
      { name: 'Nitrogen Deficiency',     prob: 'Likely',   fix: 'Top-dress with balanced fertiliser, blood meal or well-rotted compost. Feed every 2 weeks through the growing season.' },
      { name: 'Overwatering',            prob: 'Possible', fix: 'Allow the top 2\u20133 cm of soil to dry between waterings. Check drainage \u2014 roots sitting in water rot quickly.' },
      { name: 'Spider Mites',            prob: 'Possible', fix: 'Check undersides of leaves for fine webbing. Spray with neem oil or insecticidal soap; raise humidity to deter them.' },
      { name: 'Natural Leaf Senescence', prob: 'Normal',   fix: 'Lower leaves naturally yellow as the plant matures. Remove and compost if there is no sign of pest or disease.' },
    ]
  },
  {
    id: 'white_powder',
    label: 'White Powder on Leaves',
    emoji: '🌫️',
    causes: [
      { name: 'Powdery Mildew', prob: 'Very Likely', fix: 'Remove badly affected leaves. Spray with 1 tsp baking soda + \u00bd tsp dish soap per litre of water, or neem oil. Improve air circulation and avoid overhead watering.' },
      { name: 'Mealybugs',      prob: 'Possible',   fix: 'White cottony clusters on stems and leaf nodes. Wipe off with rubbing alcohol on a cotton bud; spray with insecticidal soap.' },
    ]
  },
  {
    id: 'holes_in_leaves',
    label: 'Holes in Leaves',
    emoji: '🕳️',
    causes: [
      { name: 'Caterpillars / Cabbage White', prob: 'Likely',   fix: 'Hand-pick caterpillars and eggs from leaf undersides. Use Bacillus thuringiensis (Bt) spray for heavy infestations; net brassicas.' },
      { name: 'Slugs & Snails',              prob: 'Likely',   fix: 'Set beer traps or lay copper tape around pots. Apply iron phosphate pellets. Check under debris and pots at night.' },
      { name: 'Flea Beetles',                prob: 'Possible', fix: 'Tiny round holes in brassicas and aubergines. Use floating row covers; apply diatomaceous earth around the base of plants.' },
    ]
  },
  {
    id: 'wilting',
    label: 'Wilting / Drooping',
    emoji: '😔',
    causes: [
      { name: 'Underwatering',                prob: 'Very Likely', fix: 'Water deeply and thoroughly, then mulch to retain moisture. Check soil 5 cm down \u2014 if dry, water immediately.' },
      { name: 'Root Rot',                     prob: 'Possible',    fix: 'Occurs in waterlogged soil. Inspect roots \u2014 healthy roots are white; rotten roots are brown and mushy. Repot in fresh, well-draining mix.' },
      { name: 'Fusarium / Verticillium Wilt', prob: 'Possible',    fix: 'Fungal wilt causes one-sided yellowing then collapse. No cure \u2014 remove the plant; avoid replanting the same family in that spot for 3+ years.' },
      { name: 'Vine Borers / Root Pests',     prob: 'Possible',    fix: 'Check the base of stems for entry holes or sawdust-like frass. Cut open the stem to remove the larva; wrap stems in foil to deter future egg-laying.' },
    ]
  },
  {
    id: 'black_spots',
    label: 'Black / Brown Spots',
    emoji: '🔵',
    causes: [
      { name: 'Early Blight (Alternaria)',  prob: 'Likely',   fix: 'Dark spots with concentric rings, lower leaves first. Remove affected leaves; spray copper fungicide; avoid overhead watering.' },
      { name: 'Late Blight (Phytophthora)', prob: 'Possible', fix: 'Water-soaked, rapidly spreading dark patches \u2014 spreads in cool humid weather. Remove and bag affected material; apply copper spray immediately.' },
      { name: 'Bacterial Leaf Spot',        prob: 'Possible', fix: 'Angular water-soaked spots that turn brown/black. Avoid wetting foliage; remove affected leaves; copper sprays can limit spread.' },
      { name: 'Frost Damage',              prob: 'Seasonal', fix: 'Black/brown patches after cold nights. Remove damaged tissue; protect remaining plants with horticultural fleece.' },
    ]
  },
  {
    id: 'stunted_growth',
    label: 'Stunted Growth',
    emoji: '🐢',
    causes: [
      { name: 'Nutrient Deficiency',  prob: 'Likely',   fix: 'Apply a balanced slow-release fertiliser. Test soil pH \u2014 most crops prefer 6.0\u20137.0; outside this range, nutrients become locked out.' },
      { name: 'Compacted Soil',       prob: 'Possible', fix: 'Roots cannot penetrate hard soil. Fork over deeply; add compost or horticultural grit to improve structure and drainage.' },
      { name: 'Root-knot Nematodes',  prob: 'Possible', fix: 'Check roots for small galls or knots. Grow marigolds as a companion (they suppress nematodes); rotate crop families each year.' },
      { name: 'Pest Root Damage',     prob: 'Possible', fix: 'Vine weevil grubs or carrot fly larvae eat roots unseen. Inspect soil around the base; apply nematode biological control in spring.' },
    ]
  },
  {
    id: 'sticky_residue',
    label: 'Sticky Residue / Sooty Mould',
    emoji: '🫧',
    causes: [
      { name: 'Aphids',        prob: 'Very Likely', fix: 'Check undersides of young leaves and growing tips for colonies. Blast off with water; encourage ladybirds; spray neem oil or insecticidal soap.' },
      { name: 'Whitefly',      prob: 'Likely',      fix: 'White clouds fly up when the plant is disturbed. Hang yellow sticky traps; spray undersides of leaves with insecticidal soap.' },
      { name: 'Scale Insects', prob: 'Possible',    fix: 'Brown bumps on stems or leaf midribs. Scrape off with a fingernail or soft brush; spray with horticultural oil.' },
    ]
  },
  {
    id: 'rotting_base',
    label: 'Rotting at Base / Stem',
    emoji: '🫠',
    causes: [
      { name: 'Damping Off (seedlings)', prob: 'Very Likely', fix: 'Fungal collapse at soil level in young seedlings. Use sterile seed mix; water from below; improve ventilation; apply a copper-based fungicide drench.' },
      { name: 'Crown / Stem Rot',        prob: 'Likely',      fix: 'Overwatering and poor drainage cause crown rot. Reduce watering; keep mulch away from direct stem contact; dress with grit around the base.' },
      { name: 'Sclerotinia Stem Rot',    prob: 'Possible',    fix: 'White fluffy mould inside the stem. Remove and destroy affected plants; improve airflow; avoid planting susceptible crops in the same spot next year.' },
    ]
  },
];

let _psCropName  = null;
let _psSymptomId = null;

let _problemSolverPrev = null;
function openProblemSolver(cropName) {
  _problemSolverPrev = document.activeElement;
  _psCropName  = cropName || null;
  _psSymptomId = null;
  const overlay = document.getElementById('problem-solver-overlay');
  if (!overlay) return;

  const cropLabel = document.getElementById('ps-crop-label');
  if (cropLabel) {
    cropLabel.innerHTML = (_psCropName && cropData[_psCropName])
      ? `<div class="ps-crop-tag">${cropData[_psCropName].emoji || '\u{1F331}'} Diagnosing: <strong>${_psCropName}</strong></div>`
      : '';
  }

  const grid = document.getElementById('ps-symptom-grid');
  if (grid) {
    grid.innerHTML = PROBLEM_DATABASE.map(s =>
      `<button class="ps-symptom-chip" data-sid="${s.id}">${s.emoji} <span>${s.label}</span></button>`
    ).join('');
    grid.querySelectorAll('.ps-symptom-chip').forEach(chip =>
      chip.addEventListener('click', () => {
        _psSymptomId = chip.dataset.sid;
        grid.querySelectorAll('.ps-symptom-chip').forEach(c =>
          c.classList.toggle('ps-symptom-chip--active', c === chip)
        );
        renderPsResults();
      })
    );
  }

  document.getElementById('ps-results').innerHTML = '';
  const logRow = document.getElementById('ps-log-row');
  if (logRow) logRow.hidden = true;

  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  trapFocus(overlay);
}

function closeProblemSolver() {
  const overlay = document.getElementById('problem-solver-overlay');
  if (overlay) overlay.hidden = true;
  document.body.style.overflow = '';
  _problemSolverPrev?.focus();
  _problemSolverPrev = null;
}

function renderPsResults() {
  const symptom = PROBLEM_DATABASE.find(s => s.id === _psSymptomId);
  const el = document.getElementById('ps-results');
  const logRow = document.getElementById('ps-log-row');
  if (!el || !symptom) return;

  const PROB_CLASS = {
    'Very Likely': 'ps-prob--high',
    'Likely':      'ps-prob--med',
    'Possible':    'ps-prob--low',
    'Normal':      'ps-prob--info',
    'Seasonal':    'ps-prob--info',
  };

  el.innerHTML = symptom.causes.map(c => `
    <div class="ps-cause-card">
      <div class="ps-cause-header">
        <span class="ps-cause-name">${c.name}</span>
        <span class="ps-prob ${PROB_CLASS[c.prob] || ''}">${c.prob}</span>
      </div>
      <p class="ps-cause-fix">${c.fix}</p>
    </div>`).join('');

  if (logRow) {
    logRow.hidden = !_psCropName;
    const btn = document.getElementById('ps-log-btn');
    if (btn && _psCropName) {
      btn.textContent = `Log problem on ${_psCropName}`;
      btn.onclick = () => {
        closeProblemSolver();
        openCropDetail(_psCropName);
        setTimeout(() => {
          document.querySelector('.modal-problems-section')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      };
    }
  }
}

// ── Phase 134: Care Actions Log ───────────────────────────────────────────────

function gardenLogCare(name, type) {
  if (!myGarden[name]) return;
  if (!myGarden[name].careLog) myGarden[name].careLog = [];
  const today = new Date().toISOString().slice(0, 10);
  myGarden[name].careLog.push({ date: today, type });
  saveGarden();
  const label = CARE_TYPES.find(c => c.id === type)?.label || type;
  showToast(`${label} logged for ${name}`, 'success');
  earnXP(8, `Care action: ${label} on ${name}`);
  updateStreak();
  renderCareSection(name);
  renderTodayDashboard();
}

function renderCareSection(name) {
  const body = document.getElementById('modal-body');
  if (!body || !isInGarden(name)) return;
  body.querySelector('.modal-care-section')?.remove();

  const careLog = myGarden[name]?.careLog || [];
  const today = new Date(); today.setHours(0, 0, 0, 0);

  // Last logged per type
  const lastOf = type => {
    const entries = careLog.filter(e => e.type === type).sort((a, b) => b.date.localeCompare(a.date));
    if (!entries.length) return null;
    const days = Math.round((today - new Date(entries[0].date + 'T00:00:00')) / 86400000);
    return days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days}d ago`;
  };

  const statusRows = CARE_TYPES.map(ct => {
    const last = lastOf(ct.id);
    return last ? `<span class="care-last-item">${ct.icon} <strong>${ct.label}</strong>: ${last}</span>` : '';
  }).filter(Boolean).join('');

  // Recent log (last 6 entries, newest first)
  const recent = [...careLog].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const logHtml = recent.map(e => {
    const ct = CARE_TYPES.find(c => c.id === e.type);
    return `<div class="care-log-row"><span class="care-log-icon">${ct?.icon || '\u2699\uFE0F'}</span><span class="care-log-label">${ct?.label || e.type}</span><span class="care-log-date">${e.date}</span></div>`;
  }).join('');

  const sec = document.createElement('div');
  sec.className = 'modal-section modal-care-section';
  sec.innerHTML = `
    <div class="modal-section-title">\u{1F33F} Care</div>
    <div class="care-quick-btns">
      ${CARE_TYPES.map(ct =>
        `<button class="care-btn" data-type="${ct.id}" title="${ct.label}">${ct.icon}<span>${ct.label}</span></button>`
      ).join('')}
    </div>
    ${statusRows ? `<div class="care-last-row">${statusRows}</div>` : ''}
    ${logHtml ? `<div class="care-log-list">${logHtml}</div>` : ''}`;

  body.appendChild(sec);

  sec.querySelectorAll('.care-btn').forEach(btn =>
    btn.addEventListener('click', () => gardenLogCare(name, btn.dataset.type))
  );
}

// ── Phase 136: My Plants Calendar Filter ─────────────────────────────────────

function buildPersonalCropSet() {
  const set = new Set();
  // Currently in garden
  Object.keys(myGarden).forEach(n => set.add(n));
  // In plan (any year)
  Object.values(myPlan || {}).forEach(yr => Object.keys(yr).forEach(n => set.add(n)));
  // In seed stash
  Object.keys(mySeeds || {}).forEach(n => set.add(n));
  // In history (grew before)
  (gardenHistory || []).forEach(h => { if (h.name) set.add(h.name); });
  return set;
}

function renderCalViewToggle() {
  const el = document.getElementById('cal-view-toggle');
  if (!el) return;
  const hasPersonal = buildPersonalCropSet().size > 0;
  if (!hasPersonal) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="cal-toggle">
    <button class="cal-toggle-btn${!calPersonal ? ' cal-toggle-btn--active' : ''}" id="cal-toggle-all">All crops</button>
    <button class="cal-toggle-btn${calPersonal  ? ' cal-toggle-btn--active' : ''}" id="cal-toggle-mine">My plants</button>
  </div>`;
  el.querySelector('#cal-toggle-all').addEventListener('click', () => {
    if (calPersonal) { calPersonal = false; try { localStorage.setItem('pzf-cal-personal','0'); } catch {} renderPanel(); }
  });
  el.querySelector('#cal-toggle-mine').addEventListener('click', () => {
    if (!calPersonal) { calPersonal = true; try { localStorage.setItem('pzf-cal-personal','1'); } catch {} renderPanel(); }
  });
}

// ── Phase 137: Garden Photo Gallery ─────────────────────────────────────────

let _gardenGalleryFilter = null;

function openGardenGallery() {
  _gardenGalleryFilter = null;
  renderGardenGallery();
  document.getElementById('garden-gallery-overlay').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeGardenGallery() {
  document.getElementById('garden-gallery-overlay').hidden = true;
  document.body.style.overflow = '';
}

function renderGardenGallery() {
  // Collect all photos across all crops, newest first
  const allPhotos = [];
  for (const [name, entry] of Object.entries(myGarden)) {
    for (const photo of (entry.photos || [])) {
      allPhotos.push({ ...photo, cropName: name, emoji: cropData[name]?.emoji || '\u{1F331}' });
    }
  }
  allPhotos.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  const countEl = document.getElementById('gallery-count');
  if (countEl) countEl.textContent = `${allPhotos.length} photo${allPhotos.length !== 1 ? 's' : ''}`;

  // Filter bar — only show when multiple crops have photos
  const cropsWithPhotos = [...new Set(allPhotos.map(p => p.cropName))];
  const filterBar = document.getElementById('gallery-filter-bar');
  if (filterBar) {
    if (cropsWithPhotos.length > 1) {
      filterBar.innerHTML = [
        `<button class="gallery-filter-chip${!_gardenGalleryFilter ? ' gallery-filter-chip--active' : ''}" data-crop="">All</button>`,
        ...cropsWithPhotos.map(n =>
          `<button class="gallery-filter-chip${_gardenGalleryFilter === n ? ' gallery-filter-chip--active' : ''}" data-crop="${n}">${cropData[n]?.emoji || '\u{1F331}'} ${n}</button>`
        ),
      ].join('');
      filterBar.querySelectorAll('.gallery-filter-chip').forEach(btn =>
        btn.addEventListener('click', () => {
          _gardenGalleryFilter = btn.dataset.crop || null;
          renderGardenGallery();
        })
      );
    } else {
      filterBar.innerHTML = '';
    }
  }

  const displayed = _gardenGalleryFilter ? allPhotos.filter(p => p.cropName === _gardenGalleryFilter) : allPhotos;

  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  if (!displayed.length) {
    grid.innerHTML = '<p class="gallery-empty">No photos yet. Tap a crop and add photos from its detail page.</p>';
    return;
  }

  grid.innerHTML = displayed.map(p => `
    <div class="gallery-cell" data-crop="${p.cropName}">
      <img class="gallery-img" src="${p.thumb}" alt="${p.cropName}" loading="lazy">
      <div class="gallery-cell-badge">${p.emoji} ${p.cropName.split(' ')[0]}</div>
    </div>`).join('');

  grid.querySelectorAll('.gallery-cell').forEach(cell =>
    cell.addEventListener('click', () => {
      closeGardenGallery();
      openCropDetail(cell.dataset.crop);
    })
  );
}

// ── Phase 138: Garden Activity Heatmap ───────────────────────────────────────

function renderActivityHeatmap() {
  const el = document.getElementById('activity-heatmap');
  if (!el) return;
  if (!Object.keys(myGarden).length) { el.innerHTML = ''; return; }

  const WEEKS = 16;
  const todayMs = new Date(); todayMs.setHours(0,0,0,0);
  const todayStr = todayMs.toISOString().slice(0,10);

  // Monday of current week, then step back (WEEKS-1) more weeks
  const todayDow = (todayMs.getDay() + 6) % 7; // 0=Mon … 6=Sun
  const startMs  = new Date(todayMs);
  startMs.setDate(todayMs.getDate() - todayDow - (WEEKS - 1) * 7);
  const startStr = startMs.toISOString().slice(0,10);

  // Collect activity counts per date (only within window)
  const actMap = {};
  const bump = d => {
    const k = (d || '').slice(0,10);
    if (k >= startStr && k <= todayStr) actMap[k] = (actMap[k] || 0) + 1;
  };

  for (const entry of Object.values(myGarden)) {
    for (const w  of (entry.waterLog   || [])) bump(w.date);
    for (const h  of (entry.harvestLog || [])) bump(h.date);
    for (const p  of (entry.photos     || [])) bump(p.date);
    for (const c  of (entry.careLog    || [])) bump(c.date);
    for (const pr of (entry.problems   || [])) bump(pr.date);
  }
  for (const j of (journalEntries || [])) bump((j.date || '').slice(0,10));

  const activeDays   = Object.keys(actMap).length;
  const totalActions = Object.values(actMap).reduce((s, v) => s + v, 0);

  const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAY_ABBR   = ['M','','W','','F','','S'];

  // Month label row: spacer + 16 labels
  let monthHtml = '<span class="hm-day-lbl"></span>';
  let lastMonth = -1;
  for (let col = 0; col < WEEKS; col++) {
    const d = new Date(startMs); d.setDate(startMs.getDate() + col * 7);
    const m = d.getMonth();
    monthHtml += `<span class="hm-month-lbl">${m !== lastMonth ? MONTH_ABBR[m] : ''}</span>`;
    lastMonth = m;
  }

  // 7 rows × 16 columns of cells
  let gridHtml = '';
  for (let row = 0; row < 7; row++) {
    gridHtml += `<div class="hm-row"><span class="hm-day-lbl">${DAY_ABBR[row]}</span>`;
    for (let col = 0; col < WEEKS; col++) {
      const d = new Date(startMs); d.setDate(startMs.getDate() + col * 7 + row);
      const ds     = d.toISOString().slice(0,10);
      const future = ds > todayStr;
      const count  = actMap[ds] || 0;
      const lvl    = future ? 'hm-future' : count === 0 ? 'hm-0' : count === 1 ? 'hm-1' : count <= 3 ? 'hm-2' : 'hm-3';
      const todayCls = ds === todayStr ? ' hm-today' : '';
      const tip    = !future ? `${ds}: ${count} action${count !== 1 ? 's' : ''}` : '';
      gridHtml += `<span class="hm-cell ${lvl}${todayCls}" title="${tip}"></span>`;
    }
    gridHtml += '</div>';
  }

  el.innerHTML = `<div class="hm-card">
    <div class="hm-header">
      <span class="hm-title">Activity</span>
      <span class="hm-subtitle">${activeDays} active day${activeDays !== 1 ? 's' : ''} \u00b7 ${totalActions} action${totalActions !== 1 ? 's' : ''} in 16 wks</span>
    </div>
    <div class="hm-wrap">
      <div class="hm-months">${monthHtml}</div>
      ${gridHtml}
    </div>
    <div class="hm-legend">
      <span class="hm-legend-lbl">Less</span>
      <span class="hm-cell hm-0"></span><span class="hm-cell hm-1"></span><span class="hm-cell hm-2"></span><span class="hm-cell hm-3"></span>
      <span class="hm-legend-lbl">More</span>
    </div>
  </div>`;
}

