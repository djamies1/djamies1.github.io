# Garden Zones PWA — Code Reference Guide

**Project**: Comprehensive garden planting calendar and tracker PWA
**Stack**: Vanilla JS (12,191 lines), CSS Grid/Flexbox (6,291 lines), HTML5 (909 lines)
**Data**: JSON-based crops, planting schedules, international zone mappings
**Target**: Desktop + Mobile responsive, offline-capable, no framework dependencies

---

## File Structure & Purposes

### Core Application
| File | Lines | Purpose |
|------|-------|---------|
| `app.js` | 12,191 | Main app logic: state, UI, events, all features (see sections A-M below) |
| `index.html` | 909 | HTML shell: modals, panels, overlays, WAI-ARIA landmarks |
| `styles.css` | 6,291 | Design system: theme variables, components, responsive grid |
| `sw.js` | 101 | Service worker: cache management, offline fallback, API persistence |
| `manifest.json` | 57 | PWA manifest: app metadata, icons, display modes |

### Data & Configuration
| File | Size | Purpose |
|------|------|---------|
| `data/constants.js` | 44K | COMPANION_REASONS, AVOID_REASONS, CROP_VALUES, ACHIEVEMENTS, GARDENATE_NAME_MAP |
| `data/config.js` | 5.6K | ZONE_COLORS, FROST_DATES, COUNTRY_CONFIG, BED_TYPES, ZOOM_STEPS |
| `data/content.js` | 31K | CROP_CATEGORIES, RECIPES, PEST_GUIDE, FERTILIZER_SCHEDULES, FERT_SUGGESTIONS |
| `data/crops.json` | 243K | Full crop database: ~200 crops with emoji, family, timing, companions, tips |
| `data/planting.json` | 330K | Sow/transplant/harvest date ranges per USDA zone & month |
| `data/gardenate_*.json` | ~435K | AU/CA/NZ/UK crop calendars (singular names, requires normalization) |
| `utils/index.js` | 8K | Helper functions: date parsing, formatting, debounce, throttle |
| `utils/storage.js` | 2K | localStorage wrapper: KEYS constants, loadJSON, saveJSON |
| `features/recipes.js` | 2K | Recipe integration: harvest-to-recipe lookup |
| `features/weather.js` | 4K | Open-Meteo API: 7-day forecast, soil temp calculation, day scoring |

### Build & Meta
- `lib/` — Leaflet.js (maps), Turf.js (geo), Bootstrap icons
- `icons/` — App icons (192px, 512px, maskable variants)
- `data/zones.geojson`, `au_zones.geojson`, etc. — Zone boundary polygons

---

## Architecture Overview

### State Management (Global Variables)
```
User preferences: selectedCountry, selectedZone, selectedLat/Lng, currentMonth, useMetric, useImperial
UI state: currentPanelTab, browseListView, compareMode, browseCategory, browseSearch, browseSort
Garden data: myGarden, mySeeds, gardenBeds, journalEntries, harvestLog, myVarieties
Gamification: gardenXP, gardenStreak, _earnedAchievements
Cache: cropData, weatherData, weatherCache, map, zoneGeoJSON
Feature flags: features (object with boolean toggles for major features)
```

### Data Load Order
1. **Initialization** (`initUI()` ~ line 962)
   - Load preferences & features from localStorage
   - Initialize theme, bottom nav, month slider

2. **Async Data Load** (parallel)
   - Crop data: `loadJSON(KEYS.CROPS)` → `cropData` object
   - Garden state: `loadGarden()`, `loadJournal()`, `loadSeeds()`
   - Zone data: Leaflet GeoJSON layers

3. **User Action** (zone selection)
   - Fetch weather for coordinates
   - Calculate planting data for zone+month
   - Render panel with calendar

### Key Patterns

#### Element Toggling
```js
// Toggle visibility while showing/hiding with transitions
el.hidden = true;  // Direct hidden attribute (respects display:none in CSS)
el.classList.add('hidden');  // For CSS-driven animations
```

#### Event Delegation
```js
// Browse grid card clicks are delegated to parent
#browse-grid.addEventListener('click', e => {
  const card = e.target.closest('[data-crop]');
  if (card) openCropDetail(card.dataset.crop);
});
```

#### Debounced Input
```js
// Search/filter inputs use debounce(fn, 250ms) to avoid rapid re-renders
search.addEventListener('input', debounce(() => {
  browseSearch = search.value.toLowerCase();
  renderBrowseGrid();  // Called once after typing stops
}, 250));
```

#### Modal Focus Trap
```js
// All modals call trapFocus() to lock keyboard nav & return focus on close
trapFocus(modal);  // Cycles Tab through focusable elements, restores focus on dismiss
```

#### Skeleton Loaders
```js
// Before expensive renders, show skeleton; remove after complete
showBrowseSkeleton();  // Shows animated placeholder grid
renderBrowseGrid();    // Actual render
hideBrowseSkeleton();  // Remove placeholder
```

---

## Code Sections (A-M) with Key Functions

### SECTION A: Utilities & Initialization (Lines 53-480)
**Purpose**: Accessibility helpers, visual rating functions, skeleton loaders, theme setup

| Function | Line | What it does |
|----------|------|-------------|
| `addButtonKeydown(el, handler)` | 57 | Trigger handler on Enter/Space for button accessibility |
| `trapFocus(modal)` | 63 | Lock Tab key within modal, restore focus on close |
| `announce(msg)` | 78 | Push message to screen reader announcer element |
| `normalizeCropName(name)` | 86 | Map gardenate singular names → crops.json plural (e.g., Carrot → Carrots) |
| `renderWaterDots(waterStr)` | 92 | Convert "Low"/"Moist"/"High" → 1-5 dot visual |
| `renderSunDots(sunStr)` | 104 | Convert sun description → 1-3 sun icon visual |
| `renderDifficultyStars(difficulty)` | 114 | Convert Easy/Moderate/Hard → star rating HTML |
| `updateSeasonParticles()` | 131 | Inject seasonal snowflakes/petals/leaves into map (Phase 139) |
| `updateSeasonBg()` | 180 | Swap background image (winter/spring/summer/autumn) |
| `initTheme()` | 933 | Load dark/light preference, apply to document |
| `toggleTheme()` | 880 | Switch theme, save preference, update button |
| `initUI()` | 962 | Master init: features, theme, bottom nav, month slider, listeners |
| `initMonthSlider()` | 1020 | Month input range: snap to integer, update labels |

**State variables to know**:
- `features = { seeds: true, beds: true, ... }` — Feature flags loaded from localStorage
- `useMetric`, `useImperial` — Units toggle
- `selectedCountry` — 'us', 'au', 'ca', 'uk', 'nz'

### SECTION B: Map, Zones & Location (Lines 485-575)
**Purpose**: Leaflet map initialization, zone selection, highlighting, location display

| Function | Line | What it does |
|----------|------|-------------|
| `initMap()` | 481 | Create Leaflet map, add zone GeoJSON layers, attach click handler |
| `styleFeature(feature)` | 434 | Color zone polygons by zone number, add hover effects |
| `attachFeature(feature, layer)` | 445 | Add click listener to zone polygon |
| `onZoneClick(feature, layer, lat, lng)` | 457 | User clicks zone: select it, fetch weather, show panel, render calendar |
| `highlightZone()` | 485 | Visual highlight the selected zone polygon |
| `selectZoneByPoint(lat, lng)` | 492 | Find zone polygon containing (lat, lng), select it |
| `showPanel()` | 575 | Display info-panel, remove hidden class |
| `hidePanel()` | 581 | Hide info-panel |
| `renderLocationName()` | 520 | Display user's selected location name (e.g., "New York, US") |
| `getZoneColor(zone)` | 331 | Lookup hex color for USDA zone (e.g., #ff9999 for 5a) |
| `getZoneDisplayLabel(zone)` | 335 | Format zone for display (e.g., "5a" or "AU 8") |

**Key variables**:
- `map` — Leaflet L.map instance
- `selectedZone` — Current zone string (e.g., "5a", "AU8")
- `selectedLat, selectedLng` — Coordinates for weather fetch
- `zoneGeoJSON` — Cached GeoJSON layers object

### SECTION C: Calendar & Planting Data (Lines 191-465)
**Purpose**: Month selection, season tracking, planting data lookup, frost dates

| Function | Line | What it does |
|----------|------|-------------|
| `updateSeasonParticles()` | 191 | Add/remove seasonal particle animations based on month |
| `updateSeasonBg()` | 180 | Change background image to match season |
| `getMonthContext(zoneStr, month)` | 267 | Lookup frost dates, harvest window, season name for zone+month |
| `getPlantingData(zoneStr, month)` | 697 | Return {startIndoors, directSow, transplant, harvest} crop arrays for zone+month |
| `findNearestZone(zoneStr)` | 705 | Find nearest zone in planting.json if exact match missing |
| `initMonthSlider()` | 1020 | Setup month input range [0-11], snap to integer, update labels |
| `updateMonthLabels()` | 999 | Update slider label position to show current month name |

**Key data sources**:
- `FROST_DATES` (config.js) — Frost date lookup by USDA zone
- `planting.json` — Master crop calendar per USDA zone & month
- `gardenate_au.json`, etc. — Regional calendars (require GARDENATE_NAME_MAP normalization)

### SECTION D: Panel Layout & Rendering (Lines 575-1019)
**Purpose**: Info panel display, location name, main crop calendar view

| Function | Line | What it does |
|----------|------|-------------|
| `renderPanel()` | 608 | Master render: location, tabs (calendar/garden/harvest), seasonal sections |
| `showPanel()` / `hidePanel()` | 575-581 | Toggle panel visibility |
| `renderLocationName()` | 520 | Display selected location + zone label |
| `renderSeasonWrapUp()` | Inline in renderPanel | Seasonal summary card with stats |
| `renderMonthSlider()` | Inline in renderPanel | Month selection input range |

**Render flow**:
1. User clicks zone → `onZoneClick()` calls `showPanel()`
2. `renderPanel()` builds HTML: location name + month slider + tabs
3. Tab content calls: `renderCalendarTab()`, `renderGardenTab()`, `renderHarvestTab()`
4. Calendar shows which crops are in season (sow, grow, harvest phases)

### SECTION E: Browse & Discovery (Lines 1795-2300)
**Purpose**: Crop browsing grid, filtering, searching, compare mode, companion matrix, recent crops

| Function | Line | What it does |
|----------|------|-------------|
| `initBrowse()` | 1793 | Setup event listeners for search, filters, category chips, compare, companion matrix |
| `toggleBrowse(show)` | 1919 | Show/hide browse panel |
| `renderBrowseGrid()` | 2055 | Build filtered/sorted crop grid, render cards, apply animations |
| `cropMatchesQuery(name, q)` | 2299 | Fuzzy search: name, aliases, emoji match |
| `toggleCompareMode()` | 10742 | Toggle compare mode UI, clear selection |
| `addToCompare(name)` | 10754 | Add/remove crop from compare set (max 2) |
| `renderCompareDrawer()` | 10769 | Show compare panel: side-by-side crop attributes |
| `openCompanionMatrix()` | 10844 | Open companion matrix overlay |
| `renderCompanionMatrix()` | 10866 | Build NxN grid of crop relationships (color-coded) |
| `renderBrowseRecentRow()` | Inline | Show recently viewed crops (Phase 139) |
| `trackRecentlyCropViewed(name)` | 1349 | Add crop to recent list (sessionStorage) |

**Filter state variables**:
- `browseCategory` — Selected category (e.g., "Vegetables", "Herbs")
- `browseSearch` — Search query string
- `browseDifficulty` — Difficulty filter (Easy/Moderate/Hard)
- `browseSun`, `browseFamily`, `browseFrostHardy`, etc. — Advanced filters
- `browseSort` — Sort key (az, fastest, coldsoil, value, sqft)
- `browseListView` — Boolean: grid vs. list view
- `compareMode` — Boolean: comparison mode active
- `compareSet` — Array of 0-2 crop names being compared

**Browse card highlights**:
- `.browse-card--active` — In season for current zone+month
- `.browse-card--season` — Green "In season" badge
- `.browse-card--selected` — Selected for compare
- `.browse-card-sownow` — Orange "Sow now" badge
- `.browse-card-saved` — ★ if in garden

### SECTION F: Crop Detail Modal (Lines 1358-1710)
**Purpose**: Full crop details, planting strip, companions, add to garden, sharing

| Function | Line | What it does |
|----------|------|-------------|
| `openCropDetail(name)` | 1358 | Open modal, populate emoji/name/difficulty, call renderCropDetail |
| `closeCropModal()` | 1675 | Close modal, restore previous focus |
| `renderCropDetail(name)` | 1680 | Build modal body: basics, companions, tips, varieties, photos |
| `renderCropPlantingStrip()` | Inline | Show zone-specific sow/transplant/harvest dates (color blocks) |
| `gardenAdd(name)` | 2327 | Add crop to myGarden, mark as planted, show toast |
| `gardenRemove(name)` | 2350 | Remove from myGarden, show undo toast (Phase 139) |
| `renderCropCompanions()` | Inline | Show companion/avoid lists with reasons |
| `shareCrop(name)` | 1707 | Generate text card + screenshot for sharing |

**Modal structure** (index.html):
```html
<div id="crop-modal">
  <div id="modal-header">
    <span id="modal-emoji"></span>
    <h2 id="modal-crop-name"></h2>
    <span id="modal-difficulty"></span>
  </div>
  <div id="modal-garden-bar"></div>  <!-- Add/remove button -->
  <div id="modal-body"></div>         <!-- Tabs: basics/companions/photos/varieties/tips -->
</div>
```

### SECTION G: Garden Tracker (Lines 2289-5520)
**Purpose**: My garden list, planting/harvesting logs, beds, seeds, yield, diversity, rotations

| Function | Line | What it does |
|----------|------|-------------|
| `loadGarden()` | 2290 | Load myGarden object from localStorage |
| `saveGarden()` | 2297 | Save myGarden to localStorage |
| `isInGarden(name)` | 2298 | Check if crop is planted |
| `gardenAdd(name)` | 2327 | Add crop to myGarden: planted=true, plantedDate=today |
| `gardenRemove(name)` | 2350 | Remove from myGarden, show undo toast |
| `renderGardenTab()` | 2916 | Master garden render: crops list, beds map, dashboard cards |
| `renderGardenDashboard()` | 4130 | Top cards: total harvest, diversity, rotation, streaks, level |
| `renderTodayDashboard()` | 11397 | Watering schedule, tasks, quick actions |
| `renderGardenGallery()` | 11842 | Photo grid of garden moments |
| `renderSeedInventory()` | 8133 | Seed tracking with germination %, storage location, cost (Phase 140) |
| `renderGardenBeds()` | Inline | Bed visualization: grid or map |
| `addCropToBed(cropName, bedId)` | 2303 | Assign crop to garden bed |
| `gardenAddLog(name, type, date, notes)` | 2400 | Log action: planted, transplanted, harvested, watered, etc. |

**Garden data schema** (myGarden object):
```js
{
  "Tomatoes": {
    planted: true,
    plantedDate: "2026-04-01",
    bedIds: ["bed1", "bed2"],  // Phase 139: multiple beds
    rating: 4,
    harvestLog: [
      { date: "2026-06-15", amount: 2.5, unit: "kg" }
    ],
    waterLog: [{ date: "2026-04-07" }],
    careLog: [
      { date: "2026-04-05", type: "pruned", notes: "removed suckers" }
    ],
    photos: ["photo-id-1", "photo-id-2"]
  }
}
```

### SECTION H: Harvest & Journal (Lines 4590-5810)
**Purpose**: Harvest logging, recipe integration, food output tracking, journal memories

| Function | Line | What it does |
|----------|------|-------------|
| `renderHarvestChart()` | 4587 | SVG cumulative harvest by month (Phase 139) |
| `renderHarvestReadyBanner()` | 5517 | Alert when crops are ready to harvest |
| `renderHarvestAnalytics()` | 9120 | Stats: total weight, varieties grown, yield trends |
| `renderHarvestValue()` | 9205 | Estimated food cost value of harvests |
| `renderHarvestToTable()` | 9477 | Suggest recipes for just-harvested crops |
| `loadJournal()` | 5544 | Load journalEntries from localStorage |
| `addJournalEntry(text, cropTag)` | 5549 | Add memory with optional photo + timestamp |
| `renderJournalTab()` | 5604 | Journal list with search, crop filter, date range |

**Journal entry schema**:
```js
{
  id: "entry-1234",
  date: "2026-04-07",
  text: "First tomatoes ripening!",
  crop: "Tomatoes",  // optional tag
  photoId: "photo-id-1",  // optional
  milestone: false,  // true = auto-generated (harvest/planted)
  timestamp: 1712505600000
}
```

### SECTION I: Weather & Forecast (Lines 3481-3830)
**Purpose**: 7-day forecast, soil temperature, planting day scoring, watering schedule

| Function | Line | What it does |
|----------|------|-------------|
| `fetchWeather(lat, lng)` | 3482 | Call Open-Meteo API, cache for 24h, return WMO codes |
| `scorePlantingDay(cropName, weatherData)` | features/weather.js | Calculate safety score for sowing based on soil temp |
| `render7DayForecast()` | features/weather.js | Show forecast in panel with daily emoji, high/low, precipitation |
| `calculateSoilTemp(airTempF)` | app.js | Convert air temp to soil temp (F→C, ×0.85, back to F) (Phase 139) |
| `fetchWeatherAndUpdate()` | 3410 | Async fetch + render on connection restored |
| `renderWeatherStrip()` | 3529 | Top of panel: current conditions + 7-day icons |
| `renderWateringSchedule()` | Inline | Crops due for watering soon |

**Weather data structure**:
```js
{
  current: { tempF, humidityPercent, wmoCode },
  daily: {
    date: ["2026-04-07", ...],
    temperatureMax: [20, ...],
    temperatureMin: [15, ...],
    precipitation_sum: [0, ...],
    wmoCode: [2, ...]
  }
}
```

**Key constants** (WMO codes):
- `0` = ☀️ Clear
- `2` = ⛅ Partly cloudy
- `3` = ☁️ Overcast
- `45`, `48` = 🌫️ Foggy
- `51-82` = 🌧️ Various rain/sleet
- `95-99` = ⛈️ Thunderstorm

### SECTION J: Achievements & Gamification (Lines 5790-6087)
**Purpose**: Unlock tracking, XP system, level progression, streak counting, monthly reports

| Function | Line | What it does |
|----------|------|-------------|
| `checkAchievements()` | 5834 | Check all unlock conditions, call unlockAchievement for newly earned |
| `unlockAchievement(id)` | 5802 | Mark achievement earned, show pop-up, earn XP |
| `earnXP(amount, reason)` | 11662 | Add XP, check level up, award streak bonus |
| `getGardenLevel(xp)` | 11443 | Calculate level from cumulative XP (e.g., 100 XP = level 2) |
| `updateStreak()` | 11482 | Increment daily streak if action taken today |
| `renderAchievementShelf()` | Inline | Show earned achievements grid in garden tab |
| `openMonthlyReport()` | Inline | Full-screen overlay: harvest stats, growth progress, suggestions |
| `renderSeasonSummaryPrompt()` | 11697 | Card: "End of season? Click to summarize" |
| `openSeasonWrapUp()` | Inline | Large modal: seasonal stats, tips for next season |

**Achievement unlock conditions** (from ACHIEVEMENTS in constants.js):
- `first_crop` — Plant first crop
- `harvest_3` — Log 3 harvests
- `big_harvest` — Single harvest > 1kg
- `year_round` — Have crops in all 4 seasons
- ... 15+ more (see Phase 6a in plan)

**Gamification flow**:
1. User action → trigger event (plant, harvest, journal, etc.)
2. `checkAchievements()` evaluates conditions
3. If new unlock → `unlockAchievement()` → pop-up + XP bonus
4. Streak counter increments daily if any garden action
5. XP accumulates → level up every ~100 XP

### SECTION K: Care & Problem Solving (Lines 11724-11968)
**Purpose**: Pest/disease diagnosis, care action logging, plant health tracking

| Function | Line | What it does |
|----------|------|-------------|
| `openProblemSolver(cropName)` | 11816 | Open problem solver overlay for crop |
| `closeProblemSolver()` | 11824 | Close overlay, restore focus |
| `renderPsResults()` | 11831 | Show filtered symptoms, causes, fixes based on selection |
| `gardenLogCare(name, type)` | 11905 | Log care action: pruned, fertilized, watered, staked, etc. |
| `renderCareSection(name)` | 11919 | Display care history + quick action buttons |

**Problem database** (PROBLEM_DATABASE variable):
```js
[
  {
    id: "yellow_leaves",
    label: "Yellow / Pale Leaves",
    emoji: "💛",
    causes: [
      { name: "Nitrogen deficiency", prob: "Likely", fix: "Apply balanced fertiliser..." }
    ]
  },
  // ... 8+ more conditions
]
```

### SECTION L: Settings & Preferences (Lines 8413-9477)
**Purpose**: User preferences, theme, units, feature toggles, data export/import

| Function | Line | What it does |
|----------|------|-------------|
| `openSettings()` | 8416 | Open settings sheet overlay |
| `renderSettingsSheet()` | 8427 | Build settings UI: theme, units, features, export/import, help |
| `initTheme()` | 933 | Load theme preference, apply CSS var overrides |
| `toggleTheme()` | 880 | Switch dark/light, save to localStorage |
| `exportGardenData()` | 8550 | Download myGarden as JSON file |
| `importGardenData()` | 8570 | File input, validate schema, merge or replace |
| `toggleFeature(featureName)` | 8475 | Enable/disable feature (seeds, beds, etc.) |
| `showLongPressSheet(topic)` | 8600 | Onboarding tooltips: tap & hold for help |

**Settings state**:
- `useMetric` — kg/m² vs lbs/sqft
- `useImperial` — °C vs °F
- `darkMode` — true/false (CSS custom property override)
- `features` — Object with booleans for major features

### SECTION M: Service Worker & Offline (Lines 6088-6180)
**Purpose**: PWA installation, offline fallback, cache management, update notifications

| Function | Line | What it does |
|----------|------|-------------|
| `initInstallPrompt()` | 6091 | Listen for beforeinstallprompt, show install banner |
| `initOfflineIndicator()` | 6136 | Listen for online/offline events, update UI, refetch on restore |
| `maybeShowInstallBanner()` | 6117 | Show install banner if app not installed and not dismissed |
| `showUpdateBar()` | 6162 | Show "Update available" banner when SW detects new cache |

**Service worker flow** (sw.js):
1. On install: precache CORE assets (app shell, data files)
2. On fetch:
   - API hosts (api.open-meteo.com, nominatim.openstreetmap.org) → network-first, API_CACHE
   - Same-origin assets → cache-first, fallback to network
   - Navigation → serve cached index.html if offline
3. On activate: clean old caches, send SW_UPDATED message to clients

**Cache strategy**:
- `plant-zone-v134` (CACHE) — App code, updated on version bump
- `pzf-api-v1` (API_CACHE) — Weather/location responses, survives app updates

---

## Important Constants & Their Locations

### In `data/constants.js` (44K)
| Constant | Type | Usage |
|----------|------|-------|
| `COMPANION_REASONS` | Object | Key format: "Crop1\|Crop2" → reason text (used in modal & companion matrix) |
| `AVOID_REASONS` | Object | Same format, negative relationships |
| `CROP_VALUES` | Object | Crop name → $/kg economic value (used for value sort & GYO cards) |
| `ACHIEVEMENTS` | Array | {id, icon, name, desc, ... } (15+ achievements) |
| `CROP_FAMILIES` | Object | Crop name → family (Solanaceae, Brassicaceae, etc.) for rotation |
| `GARDENATE_NAME_MAP` | Object | Gardenate singular names → crops.json plural (Phase 139) |
| `FROST_SENSITIVE` | Array | Crops killed by frost (tomatoes, peppers, etc.) |
| `CROP_CATEGORIES` | Object | Category name → array of crop names (Vegetables, Herbs, etc.) |
| `PEST_ALIASES` | Object | Pest name variations → canonical names |
| `FERTILIZER_SCHEDULES` | Object | Crop → fertilizer timing (N weeks from planting) |

### In `data/config.js` (5.6K)
| Constant | Type | Usage |
|----------|------|-------|
| `ZONE_COLORS` | Object | Zone → hex color (#ff9999, #ffcc99, etc.) |
| `FROST_DATES` | Object | USDA Zone → { spring: doy, fall: doy } |
| `COUNTRY_CONFIG` | Object | Country → {center: [lat,lng], zoom, zones:[], zoneMapUrl} |
| `MONTH_NAMES` | Array | 0-11 → month name (Jan, Feb, ...) |
| `SEASON_GRADIENTS` | Array | Season → color array for calendar rendering |
| `BED_TYPES` | Array | Bed shape/size options (4x8ft, circular, etc.) |
| `ZOOM_STEPS` | Array | Map zoom levels for responsiveness |

### In `data/content.js` (31K)
| Constant | Type | Usage |
|----------|------|-------|
| `CROP_CATEGORIES` | Object | Category → crop array |
| `CROP_CATEGORY_MAP` | Object | Crop → category lookup |
| `HARVEST_TO_TABLE` | Object | Harvest instruction text per crop |
| `NAMED_PEST_GUIDE` | Object | Pest name → symptoms, lifecycle, fixes |
| `FERT_SUGGESTIONS` | Object | Crop → fertilizer recommendation text |

### In `app.js` Global Scope
| Variable | Type | Scope | Lifecycle |
|----------|------|-------|-----------|
| `selectedZone` | String | Global | User-selected (e.g., "5a", "AU8") |
| `selectedCountry` | String | Global | User preference (us/au/ca/uk/nz) |
| `currentMonth` | Number | Global | 0-11, updated by month slider |
| `myGarden` | Object | Global | Crops planted, logs, photos (localStorage → myGarden) |
| `mySeeds` | Object | Global | Seed packets with germination %, storage, cost (Phase 140) |
| `journalEntries` | Array | Global | Garden memories (localStorage → pzf-journal) |
| `gardenXP` | Number | Global | Cumulative XP (localStorage → pzf-xp) |
| `cropData` | Object | Global | Loaded from data/crops.json on init |
| `weatherData` | Object | Global | Cached weather response (refetch if >24h old) |
| `map` | L.Map | Global | Leaflet map instance |
| `features` | Object | Global | Feature flags (seeds, beds, etc.) |

---

## Common Tasks & How to Find Them

### "I want to add a new feature toggle"
1. Add to KEYS in `utils/storage.js` (if persisting)
2. Add to `features` object initialization in `initUI()` (line 962)
3. Add checkbox in `renderSettingsSheet()` (line 8427)
4. Use `features.myFeature` in conditional code

### "I want to add a new achievement"
1. Add entry to `ACHIEVEMENTS` array in `data/constants.js`
2. Add unlock condition check in `checkAchievements()` (line 5834)
3. Call `unlockAchievement(id)` when condition met

### "I want to add a new crop"
1. Add entry to `data/crops.json` with full schema (see existing crops for template)
2. Add price to `CROP_VALUES` in `data/constants.js`
3. Add to `CROP_FAMILIES` if new family
4. Add companions/avoids to `COMPANION_REASONS` / `AVOID_REASONS` if applicable

### "I want to add a new crop filter"
1. Add state variable (e.g., `browsePotassiumRich = false`) in global scope
2. Add checkbox in `renderSettingsSheet()` or advanced filters
3. Add event listener in `initBrowse()` (line 1793)
4. Add filter condition in `renderBrowseGrid()` (line 2055) where crops are filtered

### "I want to change how the calendar displays crops"
1. Modify `renderPanel()` calendar tab (line 608)
2. Or `renderCropPlantingStrip()` (modal, line 1680)
3. Uses `getPlantingData(zone, month)` (line 697) to lookup sow/transplant/harvest dates

### "I want to modify the offline behavior"
1. See `sw.js` (line 101) for cache strategies
2. Edit `fetch` event handler: lines 64-99 define network vs. cache-first logic
3. API hosts: line 43 — add new domains for network-first caching
4. Precache list: lines 5-40 — add new assets to CORE array

### "I want to add a new API integration"
1. Add domain to `API_HOSTS` in `sw.js` (line 43)
2. Create fetch function similar to `fetchWeather()` (line 3482)
3. Implement offline fallback (cached response or null)
4. Call from appropriate event handler (e.g., on zone selection)

---

## Performance Tips & Gotchas

### Expensive Operations
⚠️ **Avoid in loops**:
- `openCropDetail()` — Constructs full modal HTML (complex)
- `renderBrowseGrid()` — Can filter/sort 200+ crops (use debounce on search)
- `checkAchievements()` — Evaluates all unlock conditions (call once per action)

✅ **Use debounce/throttle**:
- Search input (250ms debounce, line 1754)
- Window resize for responsive checks
- Scroll events for lazy load (if implemented)

### Memory Leaks
- **Always remove event listeners** if elements are destroyed
- **Modal focus trap**: Captured in closure, auto-removed on modal close
- **Event delegation preferred** over individual listeners on many elements

### Cache Invalidation
- **Service Worker**: Bump `CACHE` version in sw.js (line 2) to force refresh
- **Crop data**: Reload requires manual cache clear or new cache key
- **Weather**: 24-hour TTL cached (line 3502), check `weatherCacheTime`

### Slow Devices / Mobile
- **Skeleton loaders**: Show before expensive renders (phase 139)
- **Lazy loading**: Consider for large crop lists (not currently implemented)
- **Debouncing**: Critical for search/filter inputs
- **CSS animations**: Use `will-change` and GPU acceleration sparingly

---

## Development Workflow

### Adding a New UI Component
1. **HTML**: Add to `index.html` (or template string in `app.js`)
2. **CSS**: Add to `styles.css` (follow design system: use CSS vars, support dark mode)
3. **JS**: Create `render*()` function, wire up events in appropriate `init*()` function
4. **A11y**: Add ARIA labels, ensure keyboard nav works, test with screen reader

### Debugging
- **localStorage**: `Object.keys(localStorage)` to see all keys
- **Garden state**: Open console, type `myGarden` to inspect
- **Weather data**: Check `weatherCache` object or network tab
- **CSS**: All colors use CSS vars (`--bg`, `--text`, `--accent`, etc.) — easy dark mode testing

### Testing Offline
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Reload page — should serve cached index.html + assets
4. Weather requests will fail gracefully (cached response or null)

---

## Key Architectural Decisions

1. **No framework** — Vanilla JS for lightweight PWA (~12KB gzipped app.js)
2. **Single HTML page** — Modals/panels show/hide, not SPA routing
3. **localStorage for persistence** — Simple, no DB overhead
4. **Leaflet for maps** — Lightweight, GeoJSON-first, no heavy raster tiles
5. **Service Worker** — Cache-first for assets, network-first for APIs
6. **CSS Grid/Flexbox** — Responsive, no Bootstrap, design system via CSS vars
7. **Debounced state updates** — Search/filter don't re-render on every keystroke
8. **Normalization step** — gardenate singular names mapped to canonical plurals (GARDENATE_NAME_MAP)

---

## Critical Files by Role

**If you're fixing a bug in...**
- Crop not appearing → Check GARDENATE_NAME_MAP (line 86, app.js)
- Weather not showing → Check Open-Meteo API call (line 3482)
- Zone colors wrong → ZONE_COLORS in config.js
- Achievement not unlocking → Check unlock condition in checkAchievements() (line 5834)
- Companion pair not showing → Check COMPANION_REASONS / AVOID_REASONS keys format
- Soil temp wrong → Line ~3074, formula is (F→C, ×0.85, C→F)

**If you're adding a feature...**
- New crop attribute → Add to crops.json schema + renderCropDetail modal
- New sort/filter → Add state var + renderBrowseGrid filter condition
- New chart/stat → Create render* function, call from appropriate tab
- New API → Add to API_HOSTS in sw.js + fetchData function

---

**Last updated**: Phase 141 + Phase 7a (Companion Matrix + App reorganization) — 2026-04-07
**Total LOC**: 12,191 (app.js) + 6,291 (styles.css) + 909 (HTML) = 19,391 core
