#!/usr/bin/env python3
"""
Build international zone GeoJSON files from climate/plant hardiness data.

Usage:
  python build_intl_zones.py --country au   # Australia (needs zone_sources/abcb_au.zip)
  python build_intl_zones.py --country ca   # Canada (downloads ~53 MB from NRCan)
  python build_intl_zones.py --country uk   # UK (downloads ~80 MB from WorldClim)
  python build_intl_zones.py --all          # Build all three

Output: data/{country}_zones.geojson
Requires: geopandas, rasterio  (pip install geopandas rasterio)
"""

import io
import sys
import zipfile
import tempfile
import argparse
import urllib.request
from pathlib import Path

ZONE_SOURCES = Path("zone_sources")
DATA_DIR     = Path("data")


def download(url, dest, desc=""):
    print(f"Downloading {desc or url}...")
    def hook(blocks, bsize, total):
        mb       = blocks * bsize / 1e6
        total_mb = f"{total/1e6:.1f}" if total > 0 else "?"
        print(f"  {mb:.1f} / {total_mb} MB\r", end="", flush=True)
    urllib.request.urlretrieve(url, dest, reporthook=hook)
    print()


# ── Australia ────────────────────────────────────────────────────────────────
# ABCB NCC climate zones 1-8 -> Gardenate gardening zones
NCC_TO_GARDENATE = {
    1: "tropical",
    2: "subtropical",
    3: "arid",
    4: "arid",
    5: "temperate",
    6: "temperate",
    7: "cool",
    8: "cool",
}


def build_au():
    import geopandas as gpd
    import pandas as pd

    src = ZONE_SOURCES / "abcb_au.zip"
    if not src.exists():
        raise FileNotFoundError(
            f"Missing {src}\n"
            "Download from https://data.gov.au/dataset/ds-dga-beda1b47-2f58-4042-bacd-39c02d44f91e"
        )

    print("Reading ABCB NCC zone shapefiles...")
    gdfs = []

    with zipfile.ZipFile(src) as outer:
        for ncc in range(1, 9):
            inner_key = f"Zone ZIP Files/Zone_{ncc}.zip"
            print(f"  NCC Zone {ncc} -> {NCC_TO_GARDENATE[ncc]}", flush=True)
            inner_bytes = outer.read(inner_key)

            with zipfile.ZipFile(io.BytesIO(inner_bytes)) as inner:
                names = inner.namelist()
                shps  = [n for n in names if n.lower().endswith(".shp")]
                if not shps:
                    print(f"    (no .shp found, skipping)")
                    continue

                with tempfile.TemporaryDirectory() as td:
                    tp = Path(td)
                    for n in names:
                        ext = Path(n).suffix.lower()
                        if ext in (".shp", ".dbf", ".prj", ".shx", ".cpg"):
                            (tp / f"zone{ext}").write_bytes(inner.read(n))
                    gdf = gpd.read_file(tp / "zone.shp")

            gdf["zone"] = NCC_TO_GARDENATE[ncc]
            gdfs.append(gdf[["zone", "geometry"]])
            print(f"    {len(gdf)} features")

    combined = gpd.GeoDataFrame(pd.concat(gdfs, ignore_index=True), crs=gdfs[0].crs)
    if combined.crs.to_epsg() != 4326:
        combined = combined.to_crs(epsg=4326)

    print("Dissolving by zone...")
    dissolved = combined.dissolve(by="zone").reset_index()[["zone", "geometry"]]
    dissolved["geometry"] = dissolved["geometry"].simplify(0.005, preserve_topology=True)

    out = DATA_DIR / "au_zones.geojson"
    dissolved.to_file(out, driver="GeoJSON")
    print(f"Wrote {out}  ({len(dissolved)} zones, {out.stat().st_size/1024:.0f} KB)")


# ── Canada ───────────────────────────────────────────────────────────────────
# NRCan PHZ 1991-2020 raster pixel values 1-18 = USDA zones 0a-8b
NRCAN_TO_ZONE = {
    1: "0a",  2: "0b",
    3: "1a",  4: "1b",
    5: "2a",  6: "2b",
    7: "3a",  8: "3b",
    9: "4a",  10: "4b",
    11: "5a", 12: "5b",
    13: "6a", 14: "6b",
    15: "7a", 16: "7b",
    17: "8a", 18: "8b",
}

def _filter_small_parts(geom, min_area=0.01):
    """Drop polygon parts below min_area (square degrees) to reduce file size."""
    from shapely.geometry import MultiPolygon
    if geom is None:
        return None
    if geom.geom_type == "Polygon":
        return geom if geom.area >= min_area else None
    if geom.geom_type == "MultiPolygon":
        parts = [p for p in geom.geoms if p.area >= min_area]
        if not parts:
            return None
        return MultiPolygon(parts) if len(parts) > 1 else parts[0]
    return geom


CA_URL   = "https://ftp.maps.canada.ca/pub/nrcan_rncan/Climate-archives_Archives-climatologiques/plant_hardiness/phz1991-2020_canada.tif"
CA_CACHE = ZONE_SOURCES / "nrcan_phz1991-2020.tif"


def build_ca():
    import numpy as np
    import rasterio
    from rasterio.features import shapes
    import geopandas as gpd
    import pandas as pd
    from shapely.geometry import shape

    if not CA_CACHE.exists():
        download(CA_URL, CA_CACHE, "NRCan plant hardiness zones 1991-2020 (~53 MB)")

    print("Polygonizing raster...")
    features = []
    with rasterio.open(CA_CACHE) as src:
        data  = src.read(1).astype("int16")
        nd    = int(src.nodata) if src.nodata is not None else -9999
        mask  = (data != nd) & (data > 0)
        xform = src.transform
        crs   = src.crs

        for geom_dict, val in shapes(data, mask=mask, transform=xform):
            zone_str = NRCAN_TO_ZONE.get(int(val))
            if zone_str:
                features.append({"geometry": shape(geom_dict), "zone": zone_str})

    print(f"  {len(features):,} raw polygons — dissolving...")
    gdf = gpd.GeoDataFrame(features, crs=crs)
    if gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)

    dissolved = gdf.dissolve(by="zone").reset_index()[["zone", "geometry"]]
    dissolved["geometry"] = dissolved["geometry"].simplify(0.1, preserve_topology=True)
    dissolved["geometry"] = dissolved["geometry"].apply(
        lambda g: _filter_small_parts(g, min_area=0.01)
    )
    dissolved = dissolved.dropna(subset=["geometry"])

    out = DATA_DIR / "ca_zones.geojson"
    dissolved.to_file(out, driver="GeoJSON")
    print(f"Wrote {out}  ({len(dissolved)} zones, {out.stat().st_size/1024:.0f} KB)")


# ── WorldClim shared helpers ─────────────────────────────────────────────────
# bio6 = min temp of coldest month (°C) — used to classify zones for UK and NZ
WC_URL   = "https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_10m_bio.zip"
WC_CACHE = ZONE_SOURCES / "worldclim_bio.zip"


def _get_bio6_tif_bytes():
    """Download WorldClim bio zip if needed, return raw bytes of bio_6.tif."""
    if not WC_CACHE.exists():
        download(WC_URL, WC_CACHE, "WorldClim bioclimatic data (~80 MB)")
    with zipfile.ZipFile(WC_CACHE) as z:
        bio6s = [n for n in z.namelist() if "bio_6" in n and n.lower().endswith(".tif")]
        if not bio6s:
            all_tifs = [n for n in z.namelist() if n.lower().endswith(".tif")]
            raise RuntimeError(f"bio_6 TIF not found. Available: {all_tifs[:5]}")
        print(f"  Extracting {bio6s[0]}  ({z.getinfo(bio6s[0]).file_size/1e6:.1f} MB)")
        return z.read(bio6s[0])


def _classify_worldclim(bbox, zone_thresholds, label):
    """
    Classify WorldClim bio6 within bbox into zones.
    zone_thresholds: list of (zone_name, min_temp_low, min_temp_high) — open/closed intervals
    Returns list of {geometry, zone} dicts (shapely geometries, EPSG:4326).
    """
    import numpy as np
    import rasterio
    from rasterio.features import shapes
    from rasterio.windows import from_bounds
    from shapely.geometry import shape

    tif_bytes = _get_bio6_tif_bytes()
    with tempfile.NamedTemporaryFile(suffix=".tif", delete=False) as tmp:
        tmp.write(tif_bytes)
        tmp_path = Path(tmp.name)

    print(f"Classifying {label} winter temperatures...")
    try:
        features = []
        with rasterio.open(tmp_path) as src:
            w, s, e, n = bbox
            window = from_bounds(w, s, e, n, src.transform)
            data   = src.read(1, window=window).astype("float32")
            xform  = src.window_transform(window)
            nd     = src.nodata
            valid  = (data != nd) if nd is not None else np.ones(data.shape, dtype=bool)

            for zone_name, lo, hi in zone_thresholds:
                mask = (valid & (data >= lo) & (data < hi)).astype("uint8")
                for geom_dict, val in shapes(mask, mask=mask, transform=xform):
                    features.append({"geometry": shape(geom_dict), "zone": zone_name})
    finally:
        tmp_path.unlink(missing_ok=True)

    return features


# ── United Kingdom ───────────────────────────────────────────────────────────
# cool = inland/upland areas with colder winters (<-3°C)
# warm = milder southern/coastal areas (-3 to +8°C cap excludes open ocean
UK_BBOX        = (-11.0, 49.0, 3.0, 61.0)
UK_THRESHOLDS  = [("cool", -50.0, -3.0), ("warm", -3.0, 8.0)]


def build_uk():
    import geopandas as gpd

    features = _classify_worldclim(UK_BBOX, UK_THRESHOLDS, "UK")
    print(f"  {len(features):,} raw polygons — dissolving...")
    gdf = gpd.GeoDataFrame(features, crs="EPSG:4326")
    dissolved = gdf.dissolve(by="zone").reset_index()[["zone", "geometry"]]
    dissolved["geometry"] = dissolved["geometry"].simplify(0.05, preserve_topology=True)

    out = DATA_DIR / "uk_zones.geojson"
    dissolved.to_file(out, driver="GeoJSON")
    print(f"Wrote {out}  ({len(dissolved)} zones, {out.stat().st_size/1024:.0f} KB)")


# ── New Zealand ──────────────────────────────────────────────────────────────
# NZ spans -48 to -34 lat, 165-179 lon (Southern Hemisphere)
# Gardenate zones: subtropical (>5°C), temperate (0-5°C), cool (<0°C)
NZ_BBOX        = (165.0, -48.0, 179.0, -34.0)
NZ_THRESHOLDS  = [("subtropical", 5.0, 50.0), ("temperate", 0.0, 5.0), ("cool", -50.0, 0.0)]


def build_nz():
    import geopandas as gpd

    features = _classify_worldclim(NZ_BBOX, NZ_THRESHOLDS, "NZ")
    print(f"  {len(features):,} raw polygons — dissolving...")
    gdf = gpd.GeoDataFrame(features, crs="EPSG:4326")
    dissolved = gdf.dissolve(by="zone").reset_index()[["zone", "geometry"]]
    dissolved["geometry"] = dissolved["geometry"].simplify(0.03, preserve_topology=True)

    out = DATA_DIR / "nz_zones.geojson"
    dissolved.to_file(out, driver="GeoJSON")
    print(f"Wrote {out}  ({len(dissolved)} zones, {out.stat().st_size/1024:.0f} KB)")


# ── CLI ───────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--country", choices=["au", "ca", "uk", "nz"])
    parser.add_argument("--all", action="store_true", help="Build all countries")
    args = parser.parse_args()

    countries = ["au", "ca", "uk", "nz"] if args.all else ([args.country] if args.country else [])
    if not countries:
        parser.print_help()
        sys.exit(1)

    DATA_DIR.mkdir(exist_ok=True)
    ZONE_SOURCES.mkdir(exist_ok=True)

    for cc in countries:
        print(f"\n{'='*50}\nBuilding {cc.upper()}\n{'='*50}")
        try:
            {"au": build_au, "ca": build_ca, "uk": build_uk, "nz": build_nz}[cc]()
        except Exception as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
