#!/usr/bin/env python3
"""
scrape_facts.py — Scrape frog facts from multiple web sources and save to facts.json.

Usage:
    python scrape_facts.py            # scrape and append new facts
    python scrape_facts.py --show     # print all saved facts
"""

import argparse, json, re, sys, time
from pathlib import Path

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("pip install requests beautifulsoup4")

_DIR       = Path(__file__).resolve().parent
FACTS_FILE = _DIR / "facts.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}

# Each source: url + list of CSS selectors to try (in order)
SOURCES = [
    {
        "url": "https://www.natgeokids.com/uk/discover/animals/reptiles-and-amphibians/frog-facts/",
        "selectors": ["div.entry-content p", "div.entry-content li", "article p"],
    },
    {
        "url": "https://www.thefactsite.com/frog-facts/",
        "selectors": ["div.entry-content li", "div.entry-content p"],
    },
    {
        "url": "https://facts.net/nature/animal-facts/frog-facts/",
        "selectors": ["div.entry-content li", "div.entry-content p", "li", "p"],
    },
    {
        "url": "https://www.softschools.com/facts/animals/frog_facts/",
        "selectors": ["div.content li", "div.content p"],
    },
    {
        "url": "https://www.sciencekids.co.nz/sciencefacts/animals/frog.html",
        "selectors": ["ul li", "div.content li"],
    },
    {
        "url": "https://a-z-animals.com/blog/10-incredible-frog-facts/",
        "selectors": ["div.entry-content p", "article p"],
    },
]

# Phrases that indicate non-fact content to skip
_SKIP_RE = re.compile(
    r"(?i)(cookie|privacy|copyright|subscribe|advertisement|click here|"
    r"read more|follow us|share this|related articles?|comments?|navigation|"
    r"all rights reserved|terms of service|contact us|newsletter|sign up|"
    r"log in|buy now|shop now|affiliate|disclosure|skip to)",
    re.I,
)

# Simple check: must contain at least one verb-like word to look like a real sentence
_VERB_RE = re.compile(
    r"\b(are|is|can|have|has|do|does|live|eat|grow|produce|use|called|"
    r"found|known|make|lay|spend|travel|survive|contain|help|allow|"
    r"able|used|comes|called|named|considered|breathe|absorb|jump|"
    r"hibernate|emerge|tadpole|amphibian|species|genus)\b",
    re.I,
)


def _clean(text: str) -> str:
    text = re.sub(r"\[\d+\]", "", text)          # remove footnote citations [1]
    text = re.sub(r"\s+", " ", text).strip()     # collapse whitespace
    text = re.sub(r"^\d+[\.\)]\s*", "", text)    # strip leading "1. " or "1) "
    return text


def _is_valid(text: str) -> bool:
    if len(text) < 40 or len(text) > 450:
        return False
    if text[-1] not in ".!?":
        return False
    if _SKIP_RE.search(text):
        return False
    if not _VERB_RE.search(text):
        return False
    # Skip all-caps headers
    if sum(1 for c in text if c.isupper()) > len(text) * 0.6:
        return False
    return True


def scrape_source(source: dict) -> list:
    url = source["url"]
    print(f"  Fetching: {url}")
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        print(f"    Error: {e}")
        return []

    soup = BeautifulSoup(resp.content, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    seen, facts = set(), []
    for sel in source["selectors"]:
        for el in soup.select(sel):
            text = _clean(el.get_text(separator=" ", strip=True))
            if text and text not in seen:
                seen.add(text)
                if _is_valid(text):
                    facts.append(text)

    print(f"    Found {len(facts)} candidates")
    return facts


def load_existing() -> list:
    if FACTS_FILE.exists():
        with open(FACTS_FILE, encoding="utf-8") as f:
            return json.load(f)
    return []


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--show", action="store_true", help="Print all saved facts and exit")
    args = ap.parse_args()

    existing = load_existing()

    if args.show:
        print(f"{len(existing)} facts in {FACTS_FILE}:\n")
        for e in existing:
            print(f"  [{e['id']}] {e['fact']}")
        return

    existing_texts = {f["fact"].lower().strip() for f in existing}
    next_id = len(existing) + 1

    all_raw = []
    for source in SOURCES:
        all_raw.extend(scrape_source(source))
        time.sleep(2)

    # Deduplicate
    seen = set(existing_texts)
    new_facts = []
    for fact in all_raw:
        key = fact.lower().strip()
        if key not in seen:
            seen.add(key)
            new_facts.append(fact)

    print(f"\n{len(new_facts)} new unique facts (had {len(existing)} existing)\n")

    new_entries = [{"id": f"frog_{next_id + i:04d}", "fact": fact}
                   for i, fact in enumerate(new_facts)]

    combined = existing + new_entries
    with open(FACTS_FILE, "w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)

    print(f"Saved {len(combined)} total facts to {FACTS_FILE}\n")
    if new_entries:
        print("Sample new facts:")
        for e in new_entries[:5]:
            print(f"  [{e['id']}] {e['fact'][:90]}")


if __name__ == "__main__":
    main()
