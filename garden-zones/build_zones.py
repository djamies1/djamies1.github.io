"""
Download all 49 state GeoJSON files from kgjenkins/ophz,
merge, simplify, and write data/zones.geojson.

Techniques to hit ~2-4 MB target:
  - Iterative (non-recursive) RDP simplification
  - epsilon = 0.1 degrees (~11 km)
  - Coordinates rounded to 4 decimal places
  - Skip features whose largest ring has < MIN_RING_PTS points after simplification
"""

import json
import math
import urllib.request
import time

EPSILON       = 0.05    # degrees — ~5 km tolerance
COORD_PLACES  = 4       # decimal places for lon/lat
MIN_RING_PTS  = 4       # drop features where no ring survives simplification
OUTPUT        = './data/zones.geojson'
BASE          = 'https://raw.githubusercontent.com/kgjenkins/ophz/master/geojson/'
API           = 'https://api.github.com/repos/kgjenkins/ophz/contents/geojson'

# ── Iterative Douglas-Peucker ───────────────────────────────────────────────
def _perp_sq(px, py, ax, ay, bx, by):
    """Squared perpendicular distance from (px,py) to segment (ax,ay)-(bx,by)."""
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return (px - ax) ** 2 + (py - ay) ** 2
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    ex, ey = ax + t * dx, ay + t * dy
    return (px - ex) ** 2 + (py - ey) ** 2

def rdp_iterative(coords, epsilon):
    """Iterative RDP — no recursion limit problems."""
    n = len(coords)
    if n < 3:
        return coords

    eps_sq = epsilon * epsilon
    keep = [False] * n
    keep[0] = keep[-1] = True

    # Stack of (start_idx, end_idx) segments to process
    stack = [(0, n - 1)]
    while stack:
        start, end = stack.pop()
        if end - start < 2:
            continue
        max_sq, max_i = 0.0, start
        ax, ay = coords[start][0], coords[start][1]
        bx, by = coords[end][0],   coords[end][1]
        for i in range(start + 1, end):
            sq = _perp_sq(coords[i][0], coords[i][1], ax, ay, bx, by)
            if sq > max_sq:
                max_sq, max_i = sq, i
        if max_sq > eps_sq:
            keep[max_i] = True
            stack.append((start, max_i))
            stack.append((max_i, end))

    return [coords[i] for i in range(n) if keep[i]]

def round_coords(coord):
    return [round(coord[0], COORD_PLACES), round(coord[1], COORD_PLACES)]

def simplify_ring(ring):
    if len(ring) < 4:
        return []
    simplified = rdp_iterative(ring, EPSILON)
    # Re-close if needed
    if simplified and simplified[0] != simplified[-1]:
        simplified.append(simplified[0])
    if len(simplified) < 4:
        return []
    return [round_coords(c) for c in simplified]

def simplify_geom(geom):
    t = geom['type']
    if t == 'Polygon':
        rings = [simplify_ring(r) for r in geom['coordinates']]
        rings = [r for r in rings if r]
        return ({'type': 'Polygon', 'coordinates': rings}, sum(len(r) for r in rings)) if rings else (None, 0)
    elif t == 'MultiPolygon':
        polys = []
        total = 0
        for poly in geom['coordinates']:
            rings = [simplify_ring(r) for r in poly]
            rings = [r for r in rings if r]
            if rings:
                polys.append(rings)
                total += sum(len(r) for r in rings)
        return ({'type': 'MultiPolygon', 'coordinates': polys}, total) if polys else (None, 0)
    return (geom, 0)

# ── Fetch ───────────────────────────────────────────────────────────────────
def fetch_json(url, retries=3):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'zone-builder/1.0'})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode())
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                raise RuntimeError(f'Failed: {url} — {e}')

# ── Main ────────────────────────────────────────────────────────────────────
def main():
    print('Fetching file list...')
    listing = fetch_json(API)
    files = sorted(x['name'] for x in listing if x['name'].endswith('.geojson'))
    print(f'  {len(files)} state files')

    all_features = []
    pts_before = pts_after = 0

    for i, fname in enumerate(files, 1):
        state = fname[5:7]  # ophz_XX.geojson -> XX
        print(f'  [{i:2d}/{len(files)}] {state}', end=' ', flush=True)
        data = fetch_json(BASE + fname)

        kept = 0
        for feat in data['features']:
            p = feat.get('properties', {})
            raw = p.get('ZONE') or p.get('Zone') or p.get('zone') or ''
            zone = str(raw).lower().strip()
            if not zone:
                continue

            geom = feat.get('geometry')
            if not geom:
                continue

            # Count original points
            for ring_set in ([geom['coordinates']] if geom['type']=='Polygon' else geom.get('coordinates',[])):
                for ring in (ring_set if isinstance(ring_set[0], list) and isinstance(ring_set[0][0], list) else [ring_set]):
                    pts_before += len(ring)

            new_geom, npts = simplify_geom(geom)
            if not new_geom or npts < MIN_RING_PTS:
                continue
            pts_after += npts

            temp = p.get('TEMP')
            trange = ''
            if temp is not None:
                try:
                    t = int(temp)
                    trange = f'{t} to {t+5}F'
                except (ValueError, TypeError):
                    pass

            all_features.append({
                'type': 'Feature',
                'properties': {'zone': zone, 'trange': trange, 'state': state},
                'geometry': new_geom
            })
            kept += 1

        print(f'{kept} features')

    reduction = (1 - pts_after / pts_before) * 100 if pts_before else 0
    print(f'\nFeatures: {len(all_features)}')
    print(f'Coords: {pts_before:,} -> {pts_after:,}  ({reduction:.0f}% reduction)')

    out_str = json.dumps({'type': 'FeatureCollection', 'features': all_features},
                         separators=(',', ':'))
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write(out_str)
    size_mb = len(out_str.encode()) / 1024 / 1024
    print(f'Written {OUTPUT}: {size_mb:.2f} MB')
    if size_mb > 5:
        print('Still large — try EPSILON=0.15')

if __name__ == '__main__':
    main()
