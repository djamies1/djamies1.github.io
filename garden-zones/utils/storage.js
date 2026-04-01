// ── utils/storage.js ─────────────────────────────
// Centralised localStorage helpers — all pzf-* keys in one place.

export const KEYS = {
  COUNTRY:          'pzf-country',
  GARDEN:           'pzf-garden',
  JOURNAL:          'pzf-journal',
  CANVAS:           'pzf-canvas',
  BEDS:             'pzf-beds',
  STRUCTURES:       'pzf-structures',
  CUSTOM_CROPS:     'pzf-custom-crops',
  CHECKLIST:        'pzf-checklist',
  ACHIEVEMENTS:     'pzf-achievements',
  ROTATION:         'pzf-rotation',
  PLAN:             'pzf-plan',
  VARIETIES:        'pzf-varieties',
  HISTORY:          'pzf-history',
  SEEDS:            'pzf-seeds',
  SAVED_LOCATIONS:  'pzf-saved-locations',
  WEATHER:          'pzf-weather',
  RECENTLY_VIEWED:  'pzf-recently-viewed',
  SHOPPING_BOUGHT:  'pzf-shopping-bought',
  XP:               'pzf-xp',
  METRIC:           'pzf-metric',
  THEME:            'pzf-theme',
  LAYOUT:           'pzf-layout',
  GARDEN_VIEW:      'pzf-garden-view',
  CAL_PERSONAL:     'pzf-cal-personal',
  LAST_ZONE:        'pzf-last-zone',
  LAST_LOCATION:    'pzf-last-location',
  LAST_LAT:         'pzf-last-lat',
  LAST_LNG:         'pzf-last-lng',
  ONBOARDED:        'pzf-onboarded',
  INSTALL_DISMISSED:'pzf-install-dismissed',
  SW_CACHE:         'pzf-sw-cache',
  MAP_WIDTH:        'pzf-map-width',
  SETUP_DONE:       'pzf-setup-done',
  FEATURES:         'pzf-features',
  NOTIF_ENABLED:    'pzf-notif-enabled',
  AUTO_ARCHIVE:     'pzf-auto-archive',
  REVIEW_REQUESTED: 'pzf-review-requested',
  NOTIF_REMINDER:   'pzf-notif-reminder',
  NOTIF_HARVEST:    'pzf-notif-harvest',
  NOTIF_FROST:      'pzf-notif-frost',
  SAVED_LOCS:       'pzf-saved-locs',
  CAL_COMPACT:      'pzf-cal-compact',
};

/** Read a JSON value; returns fallback if missing or parse error. */
export function loadJSON(key, fallback = null) {
  try { const s = localStorage.getItem(key); return s !== null ? JSON.parse(s) : fallback; }
  catch { return fallback; }
}

/** Write a JSON-serialisable value. Silently ignores QuotaExceededError. */
export function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

/** Read a '1'/'0' boolean flag (absent → false). */
export function loadBool(key) { return localStorage.getItem(key) === '1'; }

/** Write a boolean as '1' or '0'. */
export function saveBool(key, val) { localStorage.setItem(key, val ? '1' : '0'); }

/** Read a plain string with fallback. */
export function loadString(key, fallback = '') { return localStorage.getItem(key) ?? fallback; }
