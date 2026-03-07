"""
Good news scraper — pulls uplifting stories from Reddit and RSS feeds.
Rewrites headlines with Gemini Flash so we're not copying verbatim.

Sources:
    Reddit: r/UpliftingNews, r/HumansBeingBros, r/MadeMeSmile
    RSS:    Good News Network, Positive News

Setup:
    Create goodnews_creds.json: {"gemini_api_key": "YOUR_KEY"}
    Get a free key at: https://aistudio.google.com/app/apikey

Usage:
    python scrape_goodnews.py              # full scrape (all subreddits, all passes)
    python scrape_goodnews.py --quick      # top/month + RSS only, faster
    python scrape_goodnews.py --limit 25   # fewer stories per pass
"""

import argparse
import hashlib
import json
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

import requests

# ── Constants ─────────────────────────────────────────────────────────────────

STORIES_FILE    = "goodnews_stories.json"
CREDS_FILE      = "goodnews_creds.json"

REDDIT_API      = "https://www.reddit.com/r/{subreddit}/{sort}.json?t={time}&limit=100&after={after}"
REDDIT_HEADERS  = {"User-Agent": "goodnews-scraper/1.0 (video production script)"}
MIN_REQUEST_GAP = 6.0
MAX_PAGES       = 5

REDDIT_SUBREDDITS = [
    "UpliftingNews",
    "HumansBeingBros",
    "MadeMeSmile",
]

RSS_FEEDS = [
    ("Good News Network", "https://www.goodnewsnetwork.org/feed/"),
    ("Positive News",     "https://www.positive.news/feed/"),
]

# Passes run in full mode. hot/new ignore time_filter.
REDDIT_PASSES = [
    ("top", "month"),
    ("top", "year"),
    ("hot", "all"),
]

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta"
    "/models/gemini-1.5-flash:generateContent"
)

_last_request_at: float = 0.0

# ── Credentials ───────────────────────────────────────────────────────────────

def load_creds() -> dict:
    if not Path(CREDS_FILE).exists():
        sys.exit(
            f"ERROR: '{CREDS_FILE}' not found.\n"
            "Create it with your Gemini API key:\n"
            '  {"gemini_api_key": "YOUR_KEY"}\n'
            "Get a free key at: https://aistudio.google.com/app/apikey"
        )
    with open(CREDS_FILE, encoding="utf-8") as f:
        return json.load(f)

# ── Rate-limited Reddit fetch ─────────────────────────────────────────────────

def _fetch_reddit(url: str) -> dict:
    global _last_request_at
    elapsed = time.time() - _last_request_at
    if elapsed < MIN_REQUEST_GAP:
        time.sleep(MIN_REQUEST_GAP - elapsed)
    _last_request_at = time.time()
    req = urllib.request.Request(url, headers=REDDIT_HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())

# ── Gemini headline rewrite ───────────────────────────────────────────────────

def rewrite_headline(headline: str, api_key: str) -> str:
    """Rewrite a news headline in our own words using Gemini Flash."""
    prompt = (
        "Rewrite this news headline in your own words. "
        "Keep the same meaning and uplifting tone. "
        "Maximum 12 words. Return only the rewritten headline, nothing else.\n\n"
        f"Headline: {headline}"
    )
    try:
        resp = requests.post(
            GEMINI_URL,
            params={"key": api_key},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=15,
        )
        resp.raise_for_status()
        text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        return text.strip().strip('"').strip("'")
    except Exception as e:
        print(f"  Warning: Gemini rewrite failed ({e}) — using original", file=sys.stderr)
        return headline

# ── Reddit scraper ────────────────────────────────────────────────────────────

def scrape_reddit(subreddit: str, sort: str = "top",
                  time_filter: str = "month", target: int = 50) -> list[dict]:
    stories = []
    after   = ""
    page    = 0
    print(f"\n── r/{subreddit} ({sort}/{time_filter}) ────────────────────────────", file=sys.stderr)

    while len(stories) < target and page < MAX_PAGES:
        page += 1
        url = REDDIT_API.format(subreddit=subreddit, sort=sort,
                                time=time_filter, after=after)
        try:
            data = _fetch_reddit(url)
        except Exception as e:
            print(f"  Error: {e}", file=sys.stderr)
            break

        posts = data["data"]["children"]
        after = data["data"].get("after") or ""

        for post in posts:
            if len(stories) >= target:
                break
            d = post["data"]

            # Only link posts — we want external article URLs, not self-posts
            if d.get("is_self", True):
                continue

            article_url = d.get("url", "")
            if not article_url or article_url.startswith("https://www.reddit.com"):
                continue

            print(f"  ✓ {d['title'][:70]}", file=sys.stderr)
            stories.append({
                "id":                 f"reddit_{d['id']}",
                "original_headline":  d["title"],
                "rewritten_headline": None,
                "url":                article_url,
                "source":             f"r/{subreddit}",
                "score":              d["score"],
                "scraped_at":         datetime.now(timezone.utc).isoformat(),
            })

        if not after:
            break

    print(f"  Collected {len(stories)} stories", file=sys.stderr)
    return stories

# ── RSS scraper ───────────────────────────────────────────────────────────────

def scrape_rss(name: str, feed_url: str) -> list[dict]:
    import xml.etree.ElementTree as ET
    print(f"\n── {name} (RSS) ────────────────────────────────────────", file=sys.stderr)
    stories = []

    try:
        req = urllib.request.Request(feed_url, headers=REDDIT_HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read()
        root = ET.fromstring(content)
    except Exception as e:
        print(f"  Error fetching RSS: {e}", file=sys.stderr)
        return []

    for item in root.findall(".//item"):
        title = (item.findtext("title") or "").strip()
        link  = (item.findtext("link")  or "").strip()
        if not title or not link:
            continue
        story_id = f"rss_{hashlib.md5(link.encode()).hexdigest()[:10]}"
        print(f"  ✓ {title[:70]}", file=sys.stderr)
        stories.append({
            "id":                 story_id,
            "original_headline":  title,
            "rewritten_headline": None,
            "url":                link,
            "source":             name,
            "score":              0,   # RSS has no score — stays below Reddit stories
            "scraped_at":         datetime.now(timezone.utc).isoformat(),
        })

    print(f"  Collected {len(stories)} stories", file=sys.stderr)
    return stories

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Scrape good news stories for video production")
    parser.add_argument("--quick", action="store_true",
                        help="Single Reddit pass (top/month) + RSS only. Faster.")
    parser.add_argument("--limit", type=int, default=50,
                        help="Target stories per subreddit per pass (default: 50)")
    parser.add_argument("--out", default=STORIES_FILE,
                        help=f"Output JSON file (default: {STORIES_FILE})")
    args = parser.parse_args()

    creds   = load_creds()
    api_key = creds["gemini_api_key"]

    # Load existing stories so we never lose already-processed ones
    existing: list[dict] = []
    if Path(args.out).exists():
        with open(args.out, encoding="utf-8") as f:
            existing = json.load(f)
    existing_ids = {s["id"] for s in existing}

    all_new: list[dict] = []

    # Reddit passes
    reddit_passes = [("top", "month")] if args.quick else REDDIT_PASSES
    for subreddit in REDDIT_SUBREDDITS:
        for sort, time_filter in reddit_passes:
            for story in scrape_reddit(subreddit, sort=sort,
                                       time_filter=time_filter, target=args.limit):
                if story["id"] not in existing_ids:
                    existing_ids.add(story["id"])
                    all_new.append(story)

    # RSS feeds
    for name, feed_url in RSS_FEEDS:
        for story in scrape_rss(name, feed_url):
            if story["id"] not in existing_ids:
                existing_ids.add(story["id"])
                all_new.append(story)

    # Rewrite all new headlines
    print(f"\nRewriting {len(all_new)} new headlines with Gemini Flash...", file=sys.stderr)
    for i, story in enumerate(all_new):
        print(f"  [{i+1}/{len(all_new)}] {story['original_headline'][:65]}", file=sys.stderr)
        story["rewritten_headline"] = rewrite_headline(story["original_headline"], api_key)
        time.sleep(0.3)  # stay well within 1,500 req/day free tier

    # Merge and sort by score (Reddit stories rank above RSS)
    combined = existing + all_new
    combined.sort(key=lambda s: s["score"], reverse=True)

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)

    print(f"\nSaved {len(combined)} stories ({len(all_new)} new) to '{args.out}'", file=sys.stderr)

    # Summary table
    print(f"\n{'#':<4} {'Score':<7} {'Source':<22} Headline")
    print("-" * 85)
    for i, s in enumerate(combined, 1):
        headline = s.get("rewritten_headline") or s["original_headline"]
        print(f"{i:<4} {s['score']:<7} {s['source']:<22} {headline[:45]}")


if __name__ == "__main__":
    main()
