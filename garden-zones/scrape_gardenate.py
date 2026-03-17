#!/usr/bin/env python3
"""
Gardenate planting calendar scraper.

Usage:
  python scrape_gardenate.py --inspect          # Dump raw HTML of one page to inspect structure
  python scrape_gardenate.py --countries au,uk  # Scrape specific countries
  python scrape_gardenate.py                    # Scrape all countries (au, ca, uk, nz)

Output: data/gardenate_{country}.json
Cache:  gardenate_cache/ (raw HTML, avoids re-fetching on retry)
"""

import sys
import json
import time
import re
import argparse
from pathlib import Path
from urllib.parse import unquote_plus

import requests
from bs4 import BeautifulSoup

# ── Config ─────────────────────────────────────────────────────────────────
BASE_URL    = "https://www.gardenate.com"
CACHE_DIR   = Path("gardenate_cache")
OUT_DIR     = Path("data")
RATE_LIMIT  = 1.2   # seconds between live requests

MONTHS = ["Jan","Feb","Mar","Apr","May","Jun",
          "Jul","Aug","Sep","Oct","Nov","Dec"]

# Gardenate activity code → our schema key
ACTIVITY_MAP = {
    "S": "startIndoors",
    "T": "transplant",
    "P": "directSow",
    "H": "harvest",
}

# Countries and their zones:
# {country_code: {zone_key: (display_name, zone_listing_slug, numeric_id)}}
# Numeric IDs sourced from Gardenate's zone <select> dropdown.
ZONES = {
    "au": {
        "cool":        ("Australia - Cool",         "Australia+-+cool~mountain", 1),
        "temperate":   ("Australia - Temperate",    "Australia+-+temperate",     2),
        "subtropical": ("Australia - Sub-tropical", "Australia+-+sub-tropical",  3),
        "tropical":    ("Australia - Tropical",     "Australia+-+tropical",      4),
        "arid":        ("Australia - Arid",         "Australia+-+arid",          17),
    },
    "ca": {
        "2a": ("Canada - Zone 2a", "Canada+-+Zone+2a+Sub-Arctic",             61),
        "2b": ("Canada - Zone 2b", "Canada+-+Zone+2b+Sub-Arctic",             62),
        "3a": ("Canada - Zone 3a", "Canada+-+Zone+3a+Temperate+Short+Summer", 60),
        "3b": ("Canada - Zone 3b", "Canada+-+Zone+3b+Temperate+Warm+Summer",  59),
        "4a": ("Canada - Zone 4a", "Canada+-+zone+4a+Temperate+Warm+Summer",  58),
        "4b": ("Canada - Zone 4b", "Canada+-+Zone+4b+Temperate+Warm+Summer",  57),
        "5a": ("Canada - Zone 5a", "Canada+-+Zone+5a+Temperate+Warm+Summer",  56),
        "5b": ("Canada - Zone 5b", "Canada+-+Zone+5b+Temperate+Warm+Summer",  55),
        "6a": ("Canada - Zone 6a", "Canada+-+Zone+6a+Temperate+Warm+Summer",  54),
        "6b": ("Canada - Zone 6b", "Canada+-+Zone+6b+Temperate+Warm+Summer",  53),
        "7a": ("Canada - Zone 7a", "Canada+-+Zone+7a+Mild+Temperate",         52),
        "7b": ("Canada - Zone 7b", "Canada+-+Zone+7b+Mild+Temperate",         51),
        "8a": ("Canada - Zone 8a", "Canada+-+Zone+8a+Mild+Temperate",         50),
    },
    "uk": {
        "cool": ("United Kingdom - Cool/Temperate", "United+Kingdom+-+cool~temperate", 8),
        "warm": ("United Kingdom - Warm/Temperate", "United+Kingdom+-+warm~temperate", 9),
    },
    "nz": {
        "cool":        ("New Zealand - Cool/Mountain", "New+Zealand+-+cool~mountain", 6),
        "temperate":   ("New Zealand - Temperate",     "New+Zealand+-+temperate",     5),
        "subtropical": ("New Zealand - Sub-tropical",  "New+Zealand+-+sub-tropical",  7),
    },
    "sa": {
        "dry_subtropical":  ("South Africa - Dry summer sub-tropical", "South+Africa+-+Dry+summer+sub-tropical", 23),
        "humid_subtropical": ("South Africa - Humid sub-tropical",     "South+Africa+-+Humid+sub-tropical",      20),
        "semi_arid":        ("South Africa - Semi-arid",               "South+Africa+-+Semi-arid",               21),
        "summer_rainfall":  ("South Africa - Summer rainfall",         "South+Africa+-+Summer+rainfall",         22),
    },
}

# Gardenate plant name → our crops.json name (where they differ)
PLANT_NAME_MAP = {
    "Tomato":               "Tomatoes",
    "Beetroot":             "Beets",
    "Capsicum":             "Peppers",
    "Coriander":            "Cilantro",
    "Rocket":               "Arugula",
    "Silverbeet":           "Chard",
    "Pak Choy":             "Bok Choy",
    "Spring onions":        "Green Onions",
    "Sweet corn":           "Corn",
    "Broad Beans":          "Fava Beans",
    "Beans - climbing":     "Beans (Pole)",
    "Beans - dwarf":        "Beans (Bush)",
    "Snow Peas":            "Peas",
    "Zucchini":             "Zucchini",
    "Pumpkin":              "Pumpkin",
    "Brussels sprouts":     "Brussels Sprouts",
    "Chinese cabbage":      "Napa Cabbage",
    "Chilli peppers":       "Hot Peppers",
    "Jerusalem Artichokes": "Jerusalem Artichoke",
    "Artichokes (Globe)":   "Globe Artichoke",
    "Strawberries (from seeds)": "Strawberries",
    "Strawberry Plants":    "Strawberries",
    "NZ Spinach":           "Spinach",
    "Florence Fennel":      "Fennel",
    "Savory - summer savory": "Savory",
    "Savory - winter savory": "Savory",
    "Corn Salad":           "Mache",
    "Tomatillo":            "Tomatillos",
    "Cape Gooseberry":      "Ground Cherries",
    "Sweet Potato":         "Sweet Potatoes",
}

# ── HTTP session ────────────────────────────────────────────────────────────
session = requests.Session()
session.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
})

_last_request_time = 0.0

def fetch(url, cache_key=None, force=False):
    """Fetch URL with caching and rate limiting."""
    global _last_request_time
    if cache_key and not force:
        cache_file = CACHE_DIR / f"{cache_key}.html"
        if cache_file.exists():
            return cache_file.read_text(encoding="utf-8")

    elapsed = time.time() - _last_request_time
    if elapsed < RATE_LIMIT:
        time.sleep(RATE_LIMIT - elapsed)

    print(f"  GET {url}")
    resp = session.get(url, timeout=20)
    resp.raise_for_status()
    _last_request_time = time.time()

    if cache_key:
        CACHE_DIR.mkdir(exist_ok=True)
        (CACHE_DIR / f"{cache_key}.html").write_text(resp.text, encoding="utf-8")

    return resp.text


def zone_slug(listing_slug):
    """Return the listing slug as-is (already pre-formatted in ZONES dict)."""
    return listing_slug


def cache_key_for(prefix, s):
    """Safe filesystem name from a string."""
    return re.sub(r"[^a-zA-Z0-9_-]", "_", f"{prefix}_{s}")


# ── Plant list ──────────────────────────────────────────────────────────────
def get_plant_slugs(display_name, listing_slug):
    """Return list of plant URL slugs listed for a given zone."""
    url  = f"{BASE_URL}/zones/{listing_slug}"
    html = fetch(url, cache_key_for("zone", display_name))
    soup = BeautifulSoup(html, "html.parser")

    slugs = []
    seen  = set()
    for a in soup.find_all("a", href=re.compile(r"^/plant/[^/]+$")):
        # exclude comment sub-paths like /plant/Garlic/comment/123
        raw  = a["href"].split("/plant/")[1].split("?")[0]
        if "/" in raw:
            continue
        name = unquote_plus(raw).replace("+", " ")
        if name and name not in seen:
            seen.add(name)
            slugs.append((name, raw))   # (display_name, url_slug)
    return slugs


# ── Calendar parsing ────────────────────────────────────────────────────────
def parse_calendar(html):
    """
    Parse a Gardenate plant page and return:
      { month_1_indexed: {activity_key: True} }
    Returns empty dict if nothing found.
    """
    soup = BeautifulSoup(html, "html.parser")
    calendar = {}

    # --- Strategy 1: look for a <table> whose headers are month names --------
    for table in soup.find_all("table"):
        th_texts = [th.get_text(strip=True) for th in table.find_all("th")]

        # Find which column indices map to which month numbers (1-12)
        col_to_month = {}
        for i, txt in enumerate(th_texts):
            abbr = txt[:3]
            if abbr in MONTHS:
                col_to_month[i] = MONTHS.index(abbr) + 1

        if len(col_to_month) < 6:
            continue   # Not a calendar table

        for tr in table.find_all("tr"):
            cells = tr.find_all(["td", "th"])
            if len(cells) < 6:
                continue

            # Determine activity from row: check first cell, row class, or any cell text
            row_text  = tr.get_text(" ", strip=True)
            row_class = " ".join(tr.get("class", []))
            activity  = None

            for code, key in ACTIVITY_MAP.items():
                if (code in row_class or
                        cells[0].get_text(strip=True) == code or
                        re.search(rf'\b{code}\b', row_text)):
                    activity = key
                    break

            if not activity:
                continue

            for col_i, month_num in col_to_month.items():
                if col_i >= len(cells):
                    continue
                cell_text = cells[col_i].get_text(strip=True)
                if cell_text:
                    calendar.setdefault(month_num, {})[activity] = True

        if calendar:
            return calendar

    # --- Strategy 2: look for divs/spans with month data-attributes ---------
    for el in soup.find_all(attrs={"data-month": True}):
        try:
            month_num = int(el["data-month"])
        except (ValueError, TypeError):
            continue
        text = el.get_text(strip=True)
        for code, key in ACTIVITY_MAP.items():
            if code in text:
                calendar.setdefault(month_num, {})[key] = True

    if calendar:
        return calendar

    # --- Strategy 3: scan all text for month+code patterns ------------------
    # e.g. "Jan: S T" or table-like structure in plain text
    text = soup.get_text(" ")
    for m_i, month in enumerate(MONTHS):
        segment = re.search(rf'{month}[^A-Z]{{0,10}}([STPH]+)', text)
        if segment:
            for code, key in ACTIVITY_MAP.items():
                if code in segment.group(1):
                    calendar.setdefault(m_i + 1, {})[key] = True

    return calendar


def get_plant_calendar(plant_display, plant_url_slug, zone_id, zone_display):
    """Fetch and parse a plant's calendar for a given zone (uses numeric zone ID)."""
    url = f"{BASE_URL}/plant/{plant_url_slug}?zone={zone_id}"
    ck  = cache_key_for(f"plant_{zone_display}", plant_display)
    html = fetch(url, ck)
    return parse_calendar(html)


# ── Main scrape ─────────────────────────────────────────────────────────────
def scrape_country(country_code):
    """Scrape all zones for a country. Returns nested dict."""
    zones = ZONES[country_code]
    result = {}   # zone_key → month_str → {activity: [crop, ...]}

    for zone_key, (zone_display, listing_slug, zone_id) in zones.items():
        print(f"\n[{country_code.upper()}] Zone: {zone_display}  (id={zone_id})")
        plant_slugs = get_plant_slugs(zone_display, listing_slug)
        print(f"  Found {len(plant_slugs)} plants")

        # month → activity → [crop_name, ...]
        months_data = {str(m): {k: [] for k in ACTIVITY_MAP.values()}
                       for m in range(1, 13)}

        for display_name, url_slug in plant_slugs:
            our_name = PLANT_NAME_MAP.get(display_name, display_name)
            cal = get_plant_calendar(display_name, url_slug, zone_id, zone_display)

            for month_num, activities in cal.items():
                m_key = str(month_num)
                for activity_key in activities:
                    if our_name not in months_data[m_key][activity_key]:
                        months_data[m_key][activity_key].append(our_name)

        result[zone_key] = months_data

    return result


# ── Inspect mode ─────────────────────────────────────────────────────────────
def inspect():
    """Fetch one zone page + one plant page, dump HTML for structure analysis."""
    CACHE_DIR.mkdir(exist_ok=True)

    zone_display, listing_slug, zone_id = ZONES["au"]["temperate"]

    # Zone page (uses text slug)
    zone_url  = f"{BASE_URL}/zones/{listing_slug}"
    zone_html = fetch(zone_url, force=True)
    zone_file = CACHE_DIR / "inspect_zone.html"
    zone_file.write_text(zone_html, encoding="utf-8")
    print(f"Zone page saved -> {zone_file}  ({len(zone_html)} bytes)")
    print("First 80 lines:")
    for line in zone_html.splitlines()[:80]:
        print(" ", line)

    # Plant page (uses numeric zone ID)
    plant_url  = f"{BASE_URL}/plant/Tomato?zone={zone_id}"
    plant_html = fetch(plant_url, force=True)
    plant_file = CACHE_DIR / "inspect_plant.html"
    plant_file.write_text(plant_html, encoding="utf-8")
    print(f"\nPlant page saved -> {plant_file}  ({len(plant_html)} bytes)")
    print("First 120 lines:")
    for line in plant_html.splitlines()[:120]:
        print(" ", line)

    # Try parsing the plant calendar
    cal = parse_calendar(plant_html)
    print(f"\nParsed calendar: {cal if cal else '(empty — parser needs adjustment)'}")

    # Show all <table> tags found
    soup   = BeautifulSoup(plant_html, "html.parser")
    tables = soup.find_all("table")
    print(f"\nTables found on plant page: {len(tables)}")
    for i, t in enumerate(tables):
        print(f"  Table {i}: classes={t.get('class')}, "
              f"rows={len(t.find_all('tr'))}, "
              f"th={[th.get_text(strip=True) for th in t.find_all('th')][:15]}")


# ── CLI ───────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--inspect", action="store_true",
                        help="Dump raw HTML of one page and exit")
    parser.add_argument("--countries", default="au,ca,uk,nz",
                        help="Comma-separated country codes (default: au,ca,uk,nz)")
    args = parser.parse_args()

    if args.inspect:
        inspect()
        return

    OUT_DIR.mkdir(exist_ok=True)
    countries = [c.strip() for c in args.countries.split(",")]

    for cc in countries:
        if cc not in ZONES:
            print(f"Unknown country code: {cc} (valid: {', '.join(ZONES)})")
            continue
        print(f"\n{'='*50}\nScraping {cc.upper()}\n{'='*50}")
        data = scrape_country(cc)
        out_file = OUT_DIR / f"gardenate_{cc}.json"
        out_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        print(f"\nSaved {out_file}")


if __name__ == "__main__":
    main()
