/* ═══════════════════════════════════════════════════════════════════════
   DUMMY DATA — Amazon Leo ground gateway network
   All entries are plausible fiction seeded for the visual shell.
   Swap this module for real GGT data when it lands.
   ═══════════════════════════════════════════════════════════════════════ */

export const REGION_LIST = ['AMERICAS', 'EMEA', 'APAC'];

// Predefined camera framings — art-directed, not computed (EMEA spans
// Tromsø→Cape Town; APAC centroids break across the antimeridian).
export const REGIONS = {
  AMERICAS: { label: 'AMERICAS', pov: { lat: 12, lng: -88, altitude: 2.1 } },
  EMEA:     { label: 'EMEA',     pov: { lat: 22, lng: 18,  altitude: 2.1 } },
  APAC:     { label: 'APAC',     pov: { lat: 2,  lng: 122, altitude: 2.2 } },
};

// Display name → world-atlas 110m `properties.name`, only where they differ.
export const ATLAS_NAME_MAP = {
  'United States': 'United States of America',
};

export const GATEWAYS = [
  // ── AMERICAS (13 · 9 active / 4 planned) ──────────────────────────────
  { id: 'GGT-USW-01', name: 'Umatilla Gateway',   city: 'Umatilla, Oregon',    country: 'United States',  region: 'AMERICAS', lat: 45.918,  lng: -119.289, status: 'ACTIVE',  antennas: 12, capacityGbps: 140, connectedSats: 38, rfsDate: '2025-Q3', notes: 'Primary US-West anchor; dual fiber PoPs to Hillsboro and Boardman.' },
  { id: 'GGT-USW-02', name: 'Goldendale Gateway', city: 'Goldendale, Washington', country: 'United States', region: 'AMERICAS', lat: 45.820, lng: -120.822, status: 'ACTIVE',  antennas: 10, capacityGbps: 125, connectedSats: 33, rfsDate: '2025-Q3', notes: 'Columbia Gorge site; shares the fiber corridor with the Umatilla anchor.' },
  { id: 'GGT-USC-01', name: 'Amarillo Gateway',   city: 'Amarillo, Texas',     country: 'United States',  region: 'AMERICAS', lat: 35.199,  lng: -101.845, status: 'ACTIVE',  antennas: 9,  capacityGbps: 110, connectedSats: 31, rfsDate: '2025-Q4', notes: 'Central CONUS coverage node; co-located weather radome test array.' },
  { id: 'GGT-USE-01', name: 'Woodbine Gateway',   city: 'Woodbine, Georgia',   country: 'United States',  region: 'AMERICAS', lat: 30.965,  lng: -81.725,  status: 'ACTIVE',  antennas: 8,  capacityGbps: 105, connectedSats: 28, rfsDate: '2025-Q4', notes: 'Southeast CONUS node; hurricane-hardened radome design.' },
  { id: 'GGT-USE-02', name: 'Manassas Gateway',   city: 'Manassas, Virginia',  country: 'United States',  region: 'AMERICAS', lat: 38.751,  lng: -77.475,  status: 'ACTIVE',  antennas: 11, capacityGbps: 135, connectedSats: 36, rfsDate: '2025-Q3', notes: 'US-East anchor; direct peering into the Ashburn internet exchanges.' },
  { id: 'GGT-USH-01', name: 'Waimea Gateway',     city: 'Waimea, Hawaii',      country: 'United States',  region: 'AMERICAS', lat: 20.023,  lng: -155.669, status: 'PLANNED', antennas: 5,  capacityGbps: 60,  connectedSats: 0,  rfsDate: '2026-Q4', notes: 'Mid-Pacific infill; land lease negotiation in final stage.' },
  { id: 'GGT-CAN-01', name: 'Kamloops Gateway',   city: 'Kamloops, British Columbia', country: 'Canada',  region: 'AMERICAS', lat: 50.676,  lng: -120.341, status: 'ACTIVE',  antennas: 7,  capacityGbps: 85,  connectedSats: 26, rfsDate: '2026-Q1', notes: 'Western Canada node; dry-belt climate keeps rain fade minimal.' },
  { id: 'GGT-CAN-02', name: 'Winnipeg Gateway',   city: 'Winnipeg, Manitoba',  country: 'Canada',         region: 'AMERICAS', lat: 49.895,  lng: -97.138,  status: 'PLANNED', antennas: 6,  capacityGbps: 70,  connectedSats: 0,  rfsDate: '2027-Q2', notes: 'Prairie corridor infill; site survey complete, civil works pending.' },
  { id: 'GGT-MEX-01', name: 'Querétaro Gateway',  city: 'Querétaro',           country: 'Mexico',         region: 'AMERICAS', lat: 20.588,  lng: -100.390, status: 'ACTIVE',  antennas: 6,  capacityGbps: 80,  connectedSats: 22, rfsDate: '2026-Q2', notes: 'Bajío plateau site co-located with the regional data-center cluster.' },
  { id: 'GGT-BRA-01', name: 'Fortaleza Gateway',  city: 'Fortaleza, Ceará',    country: 'Brazil',         region: 'AMERICAS', lat: -3.732,  lng: -38.527,  status: 'ACTIVE',  antennas: 8,  capacityGbps: 100, connectedSats: 27, rfsDate: '2026-Q1', notes: 'Equatorial Atlantic anchor at a major submarine-cable landing.' },
  { id: 'GGT-BRA-02', name: 'Brasília Gateway',   city: 'Brasília',            country: 'Brazil',         region: 'AMERICAS', lat: -15.794, lng: -47.882,  status: 'PLANNED', antennas: 6,  capacityGbps: 75,  connectedSats: 0,  rfsDate: '2027-Q1', notes: 'Central Brazil coverage; spectrum grant under ANATEL review.' },
  { id: 'GGT-CHL-01', name: 'Colina Gateway',     city: 'Colina, Chile',       country: 'Chile',          region: 'AMERICAS', lat: -33.204, lng: -70.675,  status: 'ACTIVE',  antennas: 7,  capacityGbps: 90,  connectedSats: 24, rfsDate: '2026-Q1', notes: 'Southern-cone anchor; high-elevation site with low rain fade.' },
  { id: 'GGT-ARG-01', name: 'Neuquén Gateway',    city: 'Neuquén',             country: 'Argentina',      region: 'AMERICAS', lat: -38.952, lng: -68.059,  status: 'PLANNED', antennas: 5,  capacityGbps: 65,  connectedSats: 0,  rfsDate: '2027-Q3', notes: 'Patagonia corridor site; access road upgrade scheduled.' },

  // ── EMEA (13 · 8 active / 5 planned) ──────────────────────────────────
  { id: 'GGT-GBR-01', name: 'Goonhilly Gateway',  city: 'Helston, Cornwall',   country: 'United Kingdom', region: 'EMEA',     lat: 50.048,  lng: -5.181,   status: 'ACTIVE',  antennas: 10, capacityGbps: 120, connectedSats: 29, rfsDate: '2025-Q4', notes: 'Co-located at a heritage earth station; North Atlantic crossing anchor.' },
  { id: 'GGT-IRL-01', name: 'Clonee Gateway',     city: 'Clonee, County Meath', country: 'Ireland',       region: 'EMEA',     lat: 53.414,  lng: -6.444,   status: 'ACTIVE',  antennas: 9,  capacityGbps: 115, connectedSats: 30, rfsDate: '2025-Q4', notes: 'Dublin-adjacent site with existing hyperscale campus fiber.' },
  { id: 'GGT-NOR-01', name: 'Tromsø Gateway',     city: 'Tromsø',              country: 'Norway',         region: 'EMEA',     lat: 69.653,  lng: 18.956,   status: 'ACTIVE',  antennas: 8,  capacityGbps: 95,  connectedSats: 41, rfsDate: '2026-Q1', notes: 'High-latitude node; peak pass frequency for polar orbital planes.' },
  { id: 'GGT-SWE-01', name: 'Kiruna Gateway',     city: 'Kiruna',              country: 'Sweden',         region: 'EMEA',     lat: 67.857,  lng: 20.225,   status: 'ACTIVE',  antennas: 9,  capacityGbps: 100, connectedSats: 43, rfsDate: '2026-Q1', notes: 'Arctic site with a dense polar-plane pass schedule; aurora-rated RF chain.' },
  { id: 'GGT-DEU-01', name: 'Frankfurt Gateway',  city: 'Frankfurt am Main',   country: 'Germany',        region: 'EMEA',     lat: 50.110,  lng: 8.682,    status: 'ACTIVE',  antennas: 10, capacityGbps: 130, connectedSats: 32, rfsDate: '2025-Q3', notes: 'Central Europe anchor; minutes from the DE-CIX peering fabric.' },
  { id: 'GGT-ESP-01', name: 'Robledo Gateway',    city: 'Robledo de Chavela',  country: 'Spain',          region: 'EMEA',     lat: 40.499,  lng: -4.239,   status: 'ACTIVE',  antennas: 7,  capacityGbps: 90,  connectedSats: 25, rfsDate: '2026-Q2', notes: 'Iberian site in an established deep-space communications valley.' },
  { id: 'GGT-ITA-01', name: 'Matera Gateway',     city: 'Matera',              country: 'Italy',          region: 'EMEA',     lat: 40.649,  lng: 16.704,   status: 'PLANNED', antennas: 6,  capacityGbps: 70,  connectedSats: 0,  rfsDate: '2026-Q4', notes: 'Co-location study with the national space geodesy centre underway.' },
  { id: 'GGT-POL-01', name: 'Warsaw Gateway',     city: 'Warsaw',              country: 'Poland',         region: 'EMEA',     lat: 52.230,  lng: 21.011,   status: 'PLANNED', antennas: 6,  capacityGbps: 75,  connectedSats: 0,  rfsDate: '2027-Q2', notes: 'Eastern Europe infill; site survey and EMI study complete.' },
  { id: 'GGT-ARE-01', name: 'Abu Dhabi Gateway',  city: 'Abu Dhabi',           country: 'United Arab Emirates', region: 'EMEA', lat: 24.454, lng: 54.377,  status: 'ACTIVE',  antennas: 8,  capacityGbps: 110, connectedSats: 26, rfsDate: '2026-Q1', notes: 'Gulf anchor; sand-filtration intake design validated in summer trials.' },
  { id: 'GGT-SAU-01', name: 'Riyadh Gateway',     city: 'Riyadh',              country: 'Saudi Arabia',   region: 'EMEA',     lat: 24.713,  lng: 46.675,   status: 'PLANNED', antennas: 7,  capacityGbps: 85,  connectedSats: 0,  rfsDate: '2027-Q1', notes: 'Interior plateau site; dedicated power substation build in progress.' },
  { id: 'GGT-KEN-01', name: 'Longonot Gateway',   city: 'Longonot',            country: 'Kenya',          region: 'EMEA',     lat: -0.917,  lng: 36.452,   status: 'PLANNED', antennas: 5,  capacityGbps: 60,  connectedSats: 0,  rfsDate: '2027-Q3', notes: 'East-Africa equatorial site; spectrum coordination in progress.' },
  { id: 'GGT-NGA-01', name: 'Lagos Gateway',      city: 'Lagos',               country: 'Nigeria',        region: 'EMEA',     lat: 6.524,   lng: 3.379,    status: 'PLANNED', antennas: 6,  capacityGbps: 80,  connectedSats: 0,  rfsDate: '2027-Q4', notes: 'West Africa gateway; coastal humidity mitigation under design.' },
  { id: 'GGT-ZAF-01', name: 'Cape Town Gateway',  city: 'Cape Town',           country: 'South Africa',   region: 'EMEA',     lat: -33.925, lng: 18.424,   status: 'ACTIVE',  antennas: 7,  capacityGbps: 95,  connectedSats: 24, rfsDate: '2026-Q2', notes: 'Southern Africa anchor beside a major submarine-cable landing station.' },

  // ── APAC (10 · 5 active / 5 planned) ──────────────────────────────────
  { id: 'GGT-JPN-01', name: 'Hitachiota Gateway', city: 'Hitachiota, Ibaraki', country: 'Japan',          region: 'APAC',     lat: 36.538,  lng: 140.531,  status: 'ACTIVE',  antennas: 9,  capacityGbps: 115, connectedSats: 34, rfsDate: '2025-Q4', notes: 'Kanto-adjacent site inside an established satellite ground precinct.' },
  { id: 'GGT-JPN-02', name: 'Yamaguchi Gateway',  city: 'Yamaguchi',           country: 'Japan',          region: 'APAC',     lat: 34.186,  lng: 131.471,  status: 'PLANNED', antennas: 6,  capacityGbps: 70,  connectedSats: 0,  rfsDate: '2026-Q4', notes: 'Western Japan diversity site; typhoon load modelling underway.' },
  { id: 'GGT-KOR-01', name: 'Yeoju Gateway',      city: 'Yeoju, Gyeonggi',     country: 'South Korea',    region: 'APAC',     lat: 37.298,  lng: 127.637,  status: 'PLANNED', antennas: 7,  capacityGbps: 85,  connectedSats: 0,  rfsDate: '2027-Q1', notes: 'Korean peninsula node; terrain masking study complete.' },
  { id: 'GGT-IND-01', name: 'Ahmedabad Gateway',  city: 'Ahmedabad, Gujarat',  country: 'India',          region: 'APAC',     lat: 23.023,  lng: 72.571,   status: 'ACTIVE',  antennas: 8,  capacityGbps: 105, connectedSats: 29, rfsDate: '2026-Q2', notes: 'South Asia anchor; monsoon-season link budget verified on-air.' },
  { id: 'GGT-IDN-01', name: 'Bekasi Gateway',     city: 'Bekasi, West Java',   country: 'Indonesia',      region: 'APAC',     lat: -6.235,  lng: 106.992,  status: 'PLANNED', antennas: 6,  capacityGbps: 75,  connectedSats: 0,  rfsDate: '2027-Q2', notes: 'Equatorial site east of Jakarta; land grading underway.' },
  { id: 'GGT-PHL-01', name: 'Subic Bay Gateway',  city: 'Subic Bay, Zambales', country: 'Philippines',    region: 'APAC',     lat: 14.794,  lng: 120.271,  status: 'PLANNED', antennas: 5,  capacityGbps: 65,  connectedSats: 0,  rfsDate: '2027-Q4', notes: 'Archipelago coverage node; freeport zone permits filed.' },
  { id: 'GGT-THA-01', name: 'Chonburi Gateway',   city: 'Chonburi',            country: 'Thailand',       region: 'APAC',     lat: 13.361,  lng: 100.985,  status: 'PLANNED', antennas: 6,  capacityGbps: 70,  connectedSats: 0,  rfsDate: '2028-Q1', notes: 'Southeast Asia infill; coastal site pending flood assessment.' },
  { id: 'GGT-AUS-01', name: 'Mingenew Gateway',   city: 'Mingenew, Western Australia', country: 'Australia', region: 'APAC',  lat: -29.191, lng: 115.441,  status: 'ACTIVE',  antennas: 11, capacityGbps: 130, connectedSats: 35, rfsDate: '2025-Q3', notes: 'Indian-Ocean region anchor; RF-quiet zone with an existing space precinct.' },
  { id: 'GGT-AUS-02', name: 'Dubbo Gateway',      city: 'Dubbo, New South Wales', country: 'Australia',   region: 'APAC',     lat: -32.247, lng: 148.601,  status: 'ACTIVE',  antennas: 8,  capacityGbps: 100, connectedSats: 31, rfsDate: '2026-Q1', notes: 'Eastern Australia node on an RF-quiet agricultural plateau.' },
  { id: 'GGT-NZL-01', name: 'Awarua Gateway',     city: 'Awarua, Southland',   country: 'New Zealand',    region: 'APAC',     lat: -46.529, lng: 168.381,  status: 'ACTIVE',  antennas: 6,  capacityGbps: 80,  connectedSats: 39, rfsDate: '2026-Q2', notes: 'Far-south site; high-inclination pass anchor for the Pacific.' },
];

/* ── Derived helpers ─────────────────────────────────────────────────── */

export function gatewaysInScope(region = 'ALL', country = 'ALL') {
  return GATEWAYS.filter(g =>
    (region === 'ALL' || g.region === region) &&
    (country === 'ALL' || g.country === country)
  );
}

export function countriesInRegion(region = 'ALL') {
  const seen = new Set(
    GATEWAYS.filter(g => region === 'ALL' || g.region === region).map(g => g.country)
  );
  return [...seen].sort();
}

export function gatewaysByCountry(country) {
  return GATEWAYS.filter(g => g.country === country);
}

export function counts(list = GATEWAYS) {
  let active = 0, planned = 0;
  for (const g of list) g.status === 'ACTIVE' ? active++ : planned++;
  return { active, planned, total: list.length };
}

export function regionOfCountry(country) {
  const g = GATEWAYS.find(x => x.country === country);
  return g ? g.region : 'ALL';
}

// "45.9180° N\n119.2890° W" — rendered on two lines (dd is white-space:pre-line)
export function formatCoords(lat, lng) {
  const la = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lo = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
  return `${la}\n${lo}`;
}
