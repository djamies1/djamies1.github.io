"""
r/nosleep story scraper
Fetches top stories and saves them as JSON for video production use.

Usage:
    python scrape_nosleep.py
    python scrape_nosleep.py --sort top --time week --limit 10
    python scrape_nosleep.py --sort hot --limit 5 --out stories.json
"""

import argparse
import json
import sys
import time
import urllib.request
import urllib.error


REDDIT_API = "https://www.reddit.com/r/nosleep/{sort}.json?t={time}&limit={limit}"
HEADERS = {"User-Agent": "nosleep-scraper/1.0 (video production script)"}


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())


def fetch_story_body(permalink: str) -> str:
    """Fetch the full selftext for a single post."""
    url = f"https://www.reddit.com{permalink}.json?limit=1"
    try:
        data = fetch_json(url)
        selftext = data[0]["data"]["children"][0]["data"].get("selftext", "")
        # "[removed]" or "[deleted]" means content is gone
        if selftext in ("[removed]", "[deleted]", ""):
            return ""
        return selftext
    except Exception as exc:
        print(f"  Warning: could not fetch body ({exc})", file=sys.stderr)
        return ""


def scrape(sort: str = "top", time_filter: str = "month", limit: int = 10) -> list[dict]:
    url = REDDIT_API.format(sort=sort, time=time_filter, limit=limit)
    print(f"Fetching listing: {url}", file=sys.stderr)

    data = fetch_json(url)
    posts = data["data"]["children"]

    stories = []
    for i, post in enumerate(posts, 1):
        d = post["data"]

        # Skip non-text posts
        if not d.get("is_self", False):
            continue

        title = d["title"]
        print(f"[{i}/{len(posts)}] {title[:60]}...", file=sys.stderr)

        body = fetch_story_body(d["permalink"])

        stories.append({
            "id": d["id"],
            "title": title,
            "author": d["author"],
            "score": d["score"],
            "url": f"https://www.reddit.com{d['permalink']}",
            "created_utc": d["created_utc"],
            "num_comments": d["num_comments"],
            "word_count": len(body.split()),
            "body": body,
        })

        # Be polite — stay well within Reddit's rate limit
        if i < len(posts):
            time.sleep(1)

    return stories


def main():
    parser = argparse.ArgumentParser(description="Scrape top r/nosleep stories")
    parser.add_argument("--sort", choices=["top", "hot", "new", "rising"], default="top")
    parser.add_argument(
        "--time",
        choices=["hour", "day", "week", "month", "year", "all"],
        default="month",
        dest="time_filter",
        help="Time window (only applies to --sort top)",
    )
    parser.add_argument("--limit", type=int, default=10, help="Max stories to fetch (max 100)")
    parser.add_argument("--out", default="nosleep_stories.json", help="Output JSON file")
    args = parser.parse_args()

    stories = scrape(sort=args.sort, time_filter=args.time_filter, limit=args.limit)

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(stories, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(stories)} stories to {args.out}", file=sys.stderr)

    # Print a quick summary table to stdout
    print(f"\n{'#':<4} {'Score':<7} {'Words':<7} Title")
    print("-" * 70)
    for i, s in enumerate(stories, 1):
        print(f"{i:<4} {s['score']:<7} {s['word_count']:<7} {s['title'][:50]}")


if __name__ == "__main__":
    main()
