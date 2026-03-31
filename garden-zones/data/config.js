// ── data/config.js ────────────────────────────
// Zone & app configuration data — no side effects, no DOM, no state.

// Zone number → hex color (1=deep blue → 13=deep red)
export const ZONE_COLORS = {
  1:  '#7ecef4', 2:  '#5bb8f0', 3:  '#3fa3eb',
  4:  '#7bc67a', 5:  '#5ab35a', 6:  '#39a038',
  7:  '#c8d955', 8:  '#f0e040', 9:  '#f0b020',
  10: '#f07020', 11: '#e04010', 12: '#cc2000', 13: '#aa0000'
};

export const CLIMATE_ZONE_COLORS = {
  cool: '#7ecef4', temperate: '#7bc67a', warm: '#f0e040',
  subtropical: '#f0b020', tropical: '#e04010', arid: '#cc8800',
};

export const CLIMATE_ZONE_LABELS = {
  cool: 'Cool', temperate: 'Temperate', warm: 'Warm',
  subtropical: 'Subtropical', tropical: 'Tropical', arid: 'Arid',
};

// ── Season gradients ───────────────────────────
export const SEASON_GRADIENTS = {
  winter: 'radial-gradient(ellipse 80% 55% at 20% 80%, rgba(59,130,246,0.45) 0%, transparent 65%), radial-gradient(ellipse 60% 40% at 80% 15%, rgba(147,197,253,0.22) 0%, transparent 55%)',
  spring: 'radial-gradient(ellipse 80% 55% at 15% 65%, rgba(34,197,94,0.4) 0%, transparent 65%), radial-gradient(ellipse 60% 40% at 85% 25%, rgba(134,239,172,0.2) 0%, transparent 55%)',
  summer: 'radial-gradient(ellipse 80% 55% at 50% 90%, rgba(234,179,8,0.4) 0%, transparent 65%), radial-gradient(ellipse 60% 40% at 20% 10%, rgba(253,230,138,0.2) 0%, transparent 55%)',
  autumn: 'radial-gradient(ellipse 80% 55% at 70% 80%, rgba(249,115,22,0.4) 0%, transparent 65%), radial-gradient(ellipse 60% 40% at 15% 20%, rgba(253,186,116,0.2) 0%, transparent 55%)',
};

// ── Month names ────────────────────────────────
export const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// ── Frost dates by zone ────────────────────────
// Approximate average last/first frost dates (null = frost-free)
export const FROST_DATES = {
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

// ── International country config ───────────────
export const COUNTRY_CONFIG = {
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

// ── Bed & structure types ──────────────────────
export const BED_TYPES = {
  'raised':      { label: 'Raised Bed',  emoji: '🪵' },
  'in-ground':   { label: 'In-Ground',   emoji: '🌱' },
  'container':   { label: 'Container',   emoji: '🪣' },
  'herb-spiral': { label: 'Herb Spiral', emoji: '🌀' },
};
export const STRUCTURE_TYPES = {
  'house': { label: 'House', emoji: '🏠', color: '#5a5a5a', cssClass: 'gm-struct-house' },
  'shed':  { label: 'Shed',  emoji: '🛖', color: '#8b6348', cssClass: 'gm-struct-shed'  },
  'path':  { label: 'Path',  emoji: '🛤️', color: '#a08c64', cssClass: 'gm-struct-path'  },
  'fence': { label: 'Fence', emoji: '🚧', color: '#b0845a', cssClass: 'gm-struct-fence' },
};
