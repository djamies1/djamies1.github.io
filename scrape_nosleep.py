"""
Horror story scraper — pulls posts from multiple subreddits across sort modes.
Merges results into a JSON file for video production use, never overwriting
stories that have already been rendered or uploaded.

Default subreddits:
    r/nosleep, r/creepystories, r/scarystories, r/writersofhorror

Usage:
    python scrape_nosleep.py --comprehensive      # recommended: all-time + hot + new
    python scrape_nosleep.py                      # top/all-time only (quick refresh)
    python scrape_nosleep.py --sort hot           # hot stories only
    python scrape_nosleep.py --sort new           # newest stories only
    python scrape_nosleep.py --sort top --time week --limit 25
"""

import argparse
import json
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

_last_request_at: float = 0.0   # tracks time of last Reddit request globally


REDDIT_API      = "https://www.reddit.com/r/{subreddit}/{sort}.json?t={time}&limit=100&after={after}"
HEADERS         = {"User-Agent": "horror-scraper/1.0 (video production script)"}
MAX_PAGES       = 10   # safety cap — prevents infinite loops (10 pages × 100 posts = 1000 raw posts max)
MIN_REQUEST_GAP = 6.0  # seconds between any two Reddit requests (~10 req/min unauthenticated limit)

DEFAULT_SUBREDDITS = [
    "nosleep",
    "creepystories",
    "scarystories",
    "writersofhorror",
]

# Passes run in --comprehensive mode. Each is (sort, time_filter).
# hot/new ignore time_filter but we pass "all" as a harmless placeholder.
COMPREHENSIVE_PASSES = [
    ("top", "all"),    # all-time best — highest quality pool
    ("top", "year"),   # this year's best — catches newer classics
    ("top", "month"),  # this month's best — recent quality
    ("hot", "all"),    # currently trending
    ("new", "all"),    # freshest posts
]

MIN_WORDS = 50   # stories shorter than this won't make a meaningful video


def fetch_json(url: str, retries: int = 4) -> dict:
    """
    Fetch a JSON URL with global rate limiting and exponential backoff on 429s.
    Enforces MIN_REQUEST_GAP seconds between every request regardless of caller.
    """
    global _last_request_at

    # Global rate limiter — sleep if we're requesting too soon
    elapsed = time.time() - _last_request_at
    if elapsed < MIN_REQUEST_GAP:
        time.sleep(MIN_REQUEST_GAP - elapsed)

    for attempt in range(1, retries + 1):
        _last_request_at = time.time()
        req = urllib.request.Request(url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 429:
                # Exponential backoff: 60s, 120s, 240s, ...
                # Use Retry-After header if Reddit provides one
                retry_after = e.headers.get("Retry-After")
                wait = int(retry_after) if retry_after else 60 * (2 ** (attempt - 1))
                print(f"  Rate limited (429) — waiting {wait}s before retry "
                      f"(attempt {attempt}/{retries})...", file=sys.stderr)
                time.sleep(wait)
            else:
                raise
    raise RuntimeError(f"Failed after {retries} retries: {url}")


def clean_body(text: str) -> str:
    """Remove URLs and markdown links from story text."""
    # Replace markdown links [text](url) with just the text
    text = re.sub(r'\[([^\]]+)\]\(https?://[^\)]+\)', r'\1', text)
    # Remove bare URLs
    text = re.sub(r'https?://\S+', '', text)
    # Clean up any double spaces or trailing whitespace left behind
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()


def fetch_story_body(permalink: str) -> str:
    """Fetch the full selftext for a single post."""
    url = f"https://www.reddit.com{permalink}.json?limit=1"
    try:
        data = fetch_json(url)
        selftext = data[0]["data"]["children"][0]["data"].get("selftext", "")
        # "[removed]" or "[deleted]" means content is gone
        if selftext in ("[removed]", "[deleted]", ""):
            return ""
        return clean_body(selftext)
    except Exception as exc:
        print(f"  Warning: could not fetch body ({exc})", file=sys.stderr)
        return ""


def scrape_subreddit(subreddit: str, sort: str = "top",
                     time_filter: str = "month", target: int = 100) -> list[dict]:
    """
    Fetch qualifying posts from a single subreddit, paginating until `target`
    qualifying stories are collected or Reddit has no more posts to return.
    A qualifying story is a self-post with a body between MIN_WORDS and 1000 words.
    """
    print(f"\n── r/{subreddit} ──────────────────────────────────────", file=sys.stderr)

    stories: list[dict] = []
    after = ""       # Reddit pagination cursor (empty = first page)
    page  = 0

    while len(stories) < target and page < MAX_PAGES:
        page += 1
        url = REDDIT_API.format(subreddit=subreddit, sort=sort,
                                time=time_filter, after=after)
        print(f"  Page {page} — {len(stories)}/{target} qualifying so far — {url}",
              file=sys.stderr)

        try:
            data = fetch_json(url)
        except Exception as exc:
            print(f"  Error fetching page {page}: {exc}", file=sys.stderr)
            break

        posts = data["data"]["children"]
        after = data["data"].get("after") or ""   # cursor for next page

        if not posts:
            print(f"  No more posts available.", file=sys.stderr)
            break

        for post in posts:
            if len(stories) >= target:
                break

            d = post["data"]

            # Skip non-text posts
            if not d.get("is_self", False):
                continue

            title = d["title"]
            body  = fetch_story_body(d["permalink"])

            if not body:
                print(f"  Skipping '{title[:50]}' (no body)", file=sys.stderr)
                continue

            words = body.split()
            if len(words) < MIN_WORDS:
                print(f"  Skipping '{title[:50]}' (<{MIN_WORDS} words)", file=sys.stderr)
                continue
            if len(words) > 1000:
                print(f"  Skipping '{title[:50]}' (>{1000} words)", file=sys.stderr)
                continue

            print(f"  ✓ [{len(stories)+1}/{target}] {title[:60]}", file=sys.stderr)
            stories.append({
                "id":           d["id"],
                "subreddit":    subreddit,
                "title":        title,
                "author":       d["author"],
                "score":        d["score"],
                "url":          f"https://www.reddit.com{d['permalink']}",
                "created_utc":  d["created_utc"],
                "num_comments": d["num_comments"],
                "word_count":   len(words),
                "body":         body,
            })

        if not after:
            print(f"  Reached end of r/{subreddit}.", file=sys.stderr)
            break

        # rate limiter in fetch_json handles pacing between pages

    print(f"  Collected {len(stories)} qualifying stories from r/{subreddit}",
          file=sys.stderr)
    return stories


def scrape_all(subreddits: list[str], sort: str = "top",
               time_filter: str = "month", target: int = 100) -> list[dict]:
    """
    Scrape multiple subreddits, deduplicate by post ID, and sort by score descending.
    `target` is the number of qualifying stories to collect per subreddit.
    Adds a 2-second pause between subreddits to be polite to Reddit's API.
    """
    seen_ids: set[str] = set()
    all_stories: list[dict] = []

    for i, subreddit in enumerate(subreddits):
        stories = scrape_subreddit(subreddit, sort=sort, time_filter=time_filter, target=target)
        for story in stories:
            if story["id"] not in seen_ids:
                seen_ids.add(story["id"])
                all_stories.append(story)

        # Pause between subreddits (skip after the last one)
        if i < len(subreddits) - 1:
            print(f"\n  Pausing 10s before next subreddit...", file=sys.stderr)
            time.sleep(10)

    # Sort combined results by score, highest first
    all_stories.sort(key=lambda s: s["score"], reverse=True)

    return all_stories


VIDEO_OUTPUT_FOLDER = "video_output"


def _existing_video_ids(video_folder: str) -> set[str]:
    """
    Scan `video_folder` for existing .mp4 files and return the set of
    Reddit post IDs extracted from their names.
    Expected pattern: nosleep_NN_<post_id>_<safe_title>.mp4
    The post_id is the alphanumeric Reddit identifier (e.g. '1qzmmkg').
    """
    folder = Path(video_folder)
    if not folder.is_dir():
        return set()
    # post IDs are lowercase alphanumeric, typically 5-8 chars
    pattern = re.compile(r"^nosleep_\d+_([a-z0-9]+)_.*\.mp4$")
    ids: set[str] = set()
    for f in folder.iterdir():
        m = pattern.match(f.name)
        if m:
            ids.add(m.group(1))
    return ids


def main():
    parser = argparse.ArgumentParser(description="Scrape top horror stories from multiple subreddits")
    parser.add_argument(
        "--subreddits", nargs="+", default=DEFAULT_SUBREDDITS,
        metavar="SUBREDDIT",
        help=f"Subreddits to scrape (default: {' '.join(DEFAULT_SUBREDDITS)})"
    )
    parser.add_argument("--sort", choices=["top", "hot", "new", "rising"], default="top")
    parser.add_argument(
        "--time",
        choices=["hour", "day", "week", "month", "year", "all"],
        default="all",
        dest="time_filter",
        help="Time window (only applies to --sort top, default: all)",
    )
    parser.add_argument("--limit", type=int, default=50,
                        help="Target number of qualifying stories per subreddit per pass (default: 50).")
    parser.add_argument("--out", default="nosleep_stories.json", help="Output JSON file")
    parser.add_argument(
        "--comprehensive", action="store_true",
        help=(
            "Run all sort/time combinations (top/all, top/year, top/month, hot, new) "
            "to build the largest possible story pool. Recommended for first run."
        ),
    )
    args = parser.parse_args()

    # Load existing stories so we never lose metadata for already-rendered/uploaded ones
    existing_stories: list = []
    if Path(args.out).exists():
        with open(args.out, encoding="utf-8") as f:
            existing_stories = json.load(f)
    existing_ids = {s["id"] for s in existing_stories}

    passes = COMPREHENSIVE_PASSES if args.comprehensive else [(args.sort, args.time_filter)]
    total_new = 0

    for sort, time_filter in passes:
        label = f"{sort}/{time_filter}" if sort == "top" else sort
        print(f"\n{'='*60}", file=sys.stderr)
        print(f"Pass: {label} — {len(args.subreddits)} subreddit(s)", file=sys.stderr)
        print(f"{'='*60}", file=sys.stderr)

        fresh = scrape_all(
            subreddits=args.subreddits,
            sort=sort,
            time_filter=time_filter,
            target=args.limit,
        )

        new_stories = [s for s in fresh if s["id"] not in existing_ids]
        for s in new_stories:
            existing_ids.add(s["id"])
            existing_stories.append(s)
        total_new += len(new_stories)
        print(f"\n  {len(new_stories)} new stories from pass [{label}]", file=sys.stderr)

    # Re-sort the full combined list by score
    existing_stories.sort(key=lambda s: s["score"], reverse=True)

    if total_new:
        print(f"\nAdded {total_new} new story/stories to '{args.out}'.", file=sys.stderr)
    else:
        print(f"\nNo new stories found — '{args.out}' is up to date.", file=sys.stderr)

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(existing_stories, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(existing_stories)} stories total to {args.out}", file=sys.stderr)

    # Print a quick summary table to stdout
    print(f"\n{'#':<4} {'Score':<7} {'Words':<7} {'Subreddit':<18} Title")
    print("-" * 85)
    for i, s in enumerate(existing_stories, 1):
        print(f"{i:<4} {s['score']:<7} {s['word_count']:<7} {s['subreddit']:<18} {s['title'][:40]}")


if __name__ == "__main__":
    main()
