# Plant Zone Finder

Interactive 3D globe for finding your USDA plant hardiness zone and what to grow each month.

## Getting the real zone data

The included `data/zones.geojson` is a placeholder with ~8 sample polygons. To get the full US coverage:

### Option A — Community GeoJSON (easiest)
Search GitHub for `"USDA plant hardiness zone GeoJSON"` — several repos host pre-converted versions. Download and replace `data/zones.geojson`. Inspect property names with a tool like [geojson.io](https://geojson.io) to confirm each feature has a `zone` property (e.g. `"7b"`) and `trange`. The app normalizes these common variations automatically:
- `zone`, `Zone`, `ZONE` → `zone`
- `gridcode` (1-26 integer) → converted to zone string

### Option B — Official USDA source + mapshaper
1. Download the shapefile from https://planthardiness.ars.usda.gov/pages/downloads
2. Go to https://mapshaper.org → Import → drag shapefile → Export as GeoJSON
3. Before exporting, use the **Simplify** tool (set to ~20-25%) to reduce file size from ~15MB to ~2-4MB
4. Replace `data/zones.geojson`

## Running locally

```bash
cd garden-zones
python -m http.server 8080
# open http://localhost:8080
```

> Must serve via HTTP — `fetch()` does not work from `file://` URLs.

## Deploying to GitHub Pages

```bash
git init
git add .
git commit -m "Initial deploy: Plant Zone Globe"
git remote add origin https://github.com/djamies1/garden-zones.git
git push -u origin main
```

Then in repo Settings → Pages → Source: `main` branch, `/ (root)`.

App will be live at: `https://djamies1.github.io/garden-zones/`

## File structure

```
garden-zones/
├── index.html          # Shell: CDN imports, DOM layout
├── styles.css          # Dark theme, panel animation, responsive
├── app.js              # All application logic
└── data/
    ├── zones.geojson   # USDA zone polygons (replace with real data)
    └── planting.json   # Zone × month planting calendar
```

## Features
- 3D interactive globe with colored zone polygons
- Click a zone → info panel with planting calendar
- Month slider to browse throughout the year
- Address/city search → geocodes + zooms to location + selects zone
- Responsive: panel slides from right on desktop, bottom on mobile
