// ── utils/index.js ────────────────────────────
// Pure utility functions — no DOM, no app state.

import { WMO_ICONS } from '../data/constants.js';

// ── Season helper ──────────────────────────────
export function getSeasonForMonth(m) {
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

// ── Phase 5: Helper — frost date to month number ─
const MONTH_NAME_TO_NUM = {
  january:1,february:2,march:3,april:4,may:5,june:6,
  july:7,august:8,september:9,october:10,november:11,december:12,
  jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
};
export function frostDateToMonth(str) {
  if (!str) return null;
  const m = str.match(/^([A-Za-z]+)/);
  return m ? (MONTH_NAME_TO_NUM[m[1].toLowerCase()] || null) : null;
}

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

export function formatLocationName(addr) {
  if (!addr) return null;
  const city = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb;
  if (!city) return null;
  const cc = (addr.country_code || '').toUpperCase();
  const state = addr.state;
  if (cc === 'US' && state) return `${city}, ${US_STATE_ABBR[state] || state}`;
  if (cc === 'CA' && state) return `${city}, ${CA_PROV_ABBR[state] || state}`;
  return state ? `${city}, ${state}` : city;
}

// ── Zone helpers ───────────────────────────────
export function gridcodeToZone(code) {
  const n = parseInt(code, 10);
  if (isNaN(n) || n < 1 || n > 28) return String(code);
  const num  = Math.ceil(n / 2);
  const half = n % 2 === 1 ? 'a' : 'b';
  return `${num}${half}`;
}

export function getZoneCentroid(feature) {
  try {
    // turf is loaded as a global script before this module
    const c = turf.centroid(feature);
    return { lat: c.geometry.coordinates[1], lng: c.geometry.coordinates[0] };
  } catch { return null; }
}

// ── Harvest day parsing ────────────────────────
export function parseHarvestDays(daysStr) {
  if (!daysStr) return null;
  const m = daysStr.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

// ── Weather icon ───────────────────────────────
export function getWmoIcon(code) { return WMO_ICONS[code] || '🌡️'; }

// ── Performance helpers ─────────────────────────
export function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
export function throttle(fn, ms) {
  let last = 0;
  return (...args) => { const now = Date.now(); if (now - last >= ms) { last = now; fn(...args); } };
}
