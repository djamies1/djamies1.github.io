"""
Two Sentence Horror scraper — pulls posts from r/TwoSentenceHorror.
Merges results into a JSON file for video production use, never overwriting
stories that have already been rendered or uploaded.

Usage:
    python scrape_tsh.py                      # comprehensive: top/month + hot
    python scrape_tsh.py --quick              # single pass (top/month only)
    python scrape_tsh.py --quick --sort hot   # quick pass, hot stories only
    python scrape_tsh.py --quick --sort new   # quick pass, newest stories only
    python scrape_tsh.py --limit 25
"""

import argparse
import json
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

_last_request_at: float = 0.0


REDDIT_API      = "https://www.reddit.com/r/{subreddit}/{sort}.json?t={time}&limit=100&after={after}"
HEADERS         = {"User-Agent": "tsh-scraper/1.0 (video production script)"}
MAX_PAGES       = 10
MIN_REQUEST_GAP = 6.0

SUBREDDIT = "TwoSentenceHorror"

COMPREHENSIVE_PASSES = [
    ("top", "month"),
    ("hot", "all"),
]

MIN_WORDS = 5
MAX_WORDS = 200

DISCUSSION_FLAIRS = {
    "meta", "discussion", "announcement", "off-topic", "off topic",
    "community", "recommendations", "rec", "resource", "help", "advice",
    "question", "monthly", "weekly", "mod post", "modpost", "contest",
    "submission call", "submissions", "promo", "promotion",
}

DISCUSSION_PATTERNS = [re.compile(p, re.IGNORECASE) for p in [
    r"\bwould anyone\b",
    r"\bdoes anyone\b",
    r"\banyone (else|interested|here)\b",
    r"\bif anyone\b",
    r"\bhow did you\b",
    r"\bwhat do you think\b",
    r"\blooking for\b",
    r"\bwriter[s']* group\b",
    r"\bwriting group\b",
    r"\bdiscord server\b",
    r"\bany feedback\b",
    r"\bseek(ing)? (submissions?|writers?|authors?)\b",
    r"\bsubmissions? (wanted|seeking|open|needed|call)\b",
    r"\bwriters? wanted\b",
    r"\bmy (debut|first) (novel|book|short story collection|story collection)\b",
    r"\bsold my (first )?(story|book|novel)\b",
    r"\bpublished my\b",
    r"\b(released|launched) my (first |debut )?(novel|book|collection)\b",
    r"\bfirst story published\b",
    r"\brelease day\b",
    r"\bmy book\b",
    r"\bbook rec(ommendation)?[s:]?\b",
    r"\bon sale\b",
    r"\bfree (on|with|via)\b",
    r"\bwriter[s']* block\b",
    r"\bself[- ]publish",
    r"\btips (and|for|to)\b",
    r"\b(any )?advice (for|on|about)\b",
    r"\bvoiceover\b",
    r"\bwattpad\b",
    r"\bkindle\b",
    r"\banthology\b",
    r"\bhorror writers?\b",
    r"\bhomies\b",
    r"\bnovella\b",
    r"\bpodcast\b",
    r"\bkickstarter\b",
    r"\bpatreon\b",
    r"\bcreative space[s]?\b",
    r"\bsite launch(ing)?\b",
    r"\bdropped (a|my)\b",
]]


def is_discussion_post(post_data: dict) -> bool:
    flair = (post_data.get("link_flair_text") or "").lower().strip()
    if flair and any(flair == f or flair.startswith(f) for f in DISCUSSION_FLAIRS):
        return True
    title = post_data.get("title", "")
    # Skip titles that are primarily numbers/punctuation (not real stories)
    words = title.split()
    if words and sum(1 for w in words if re.match(r'^[\d,.\-]+$', w)) / len(words) > 0.5:
        return True
    return any(p.search(title) for p in DISCUSSION_PATTERNS)


def fetch_json(url: str, retries: int = 4) -> dict:
    global _last_request_at
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
                retry_after = e.headers.get("Retry-After")
                wait = int(retry_after) if retry_after else 60 * (2 ** (attempt - 1))
                print(f"  Rate limited (429) — waiting {wait}s before retry "
                      f"(attempt {attempt}/{retries})...", file=sys.stderr)
                time.sleep(wait)
            else:
                raise
    raise RuntimeError(f"Failed after {retries} retries: {url}")


def clean_body(text: str) -> str:
    text = re.sub(r'\[([^\]]+)\]\(https?://[^\)]+\)', r'\1', text)
    text = re.sub(r'https?://\S+', '', text)
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()


def fetch_story_body(permalink: str) -> str:
    url = f"https://www.reddit.com{permalink}.json?limit=1"
    try:
        data = fetch_json(url)
        selftext = data[0]["data"]["children"][0]["data"].get("selftext", "")
        if selftext in ("[removed]", "[deleted]", ""):
            return ""
        return clean_body(selftext)
    except Exception as exc:
        print(f"  Warning: could not fetch body ({exc})", file=sys.stderr)
        return ""


def scrape_tsh(sort: str = "top", time_filter: str = "month",
               target: int = 50, exclude_ids: set | None = None) -> list[dict]:
    """
    Fetch qualifying posts from r/TwoSentenceHorror, paginating until `target`
    qualifying stories are collected or Reddit has no more posts.
    Stories whose IDs are in `exclude_ids` are skipped.
    """
    print(f"\n── r/{SUBREDDIT} ──────────────────────────────────────", file=sys.stderr)

    stories: list[dict] = []
    after = ""
    page  = 0

    while len(stories) < target and page < MAX_PAGES:
        page += 1
        url = REDDIT_API.format(subreddit=SUBREDDIT, sort=sort,
                                time=time_filter, after=after)
        print(f"  Page {page} — {len(stories)}/{target} qualifying so far — {url}",
              file=sys.stderr)

        try:
            data = fetch_json(url)
        except Exception as exc:
            print(f"  Error fetching page {page}: {exc}", file=sys.stderr)
            break

        posts = data["data"]["children"]
        after = data["data"].get("after") or ""

        if not posts:
            print(f"  No more posts available.", file=sys.stderr)
            break

        for post in posts:
            if len(stories) >= target:
                break

            d = post["data"]

            if not d.get("is_self", False):
                continue

            if exclude_ids and d["id"] in exclude_ids:
                continue

            title = d["title"]

            if is_discussion_post(d):
                print(f"  Skipping '{title[:60]}' (discussion/meta)", file=sys.stderr)
                continue

            body = fetch_story_body(d["permalink"])

            if not body:
                print(f"  Skipping '{title[:50]}' (no body)", file=sys.stderr)
                continue

            words = body.split()
            if len(words) < MIN_WORDS:
                print(f"  Skipping '{title[:50]}' (<{MIN_WORDS} words)", file=sys.stderr)
                continue
            if len(words) > MAX_WORDS:
                print(f"  Skipping '{title[:50]}' (>{MAX_WORDS} words)", file=sys.stderr)
                continue

            print(f"  ✓ [{len(stories)+1}/{target}] {title[:60]}", file=sys.stderr)
            stories.append({
                "id":           d["id"],
                "subreddit":    SUBREDDIT,
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
            print(f"  Reached end of r/{SUBREDDIT}.", file=sys.stderr)
            break

    print(f"  Collected {len(stories)} qualifying stories from r/{SUBREDDIT}",
          file=sys.stderr)
    return stories


def main():
    parser = argparse.ArgumentParser(
        description="Scrape top stories from r/TwoSentenceHorror"
    )
    parser.add_argument("--sort", choices=["top", "hot", "new", "rising"], default="top")
    parser.add_argument(
        "--time",
        choices=["hour", "day", "week", "month", "year", "all"],
        default="month",
        dest="time_filter",
        help="Time window (only applies to --sort top, default: month)",
    )
    parser.add_argument("--limit", type=int, default=50,
                        help="Target number of qualifying stories per pass (default: 50).")
    parser.add_argument("--out", default="tsh_stories.json", help="Output JSON file")
    parser.add_argument(
        "--quick", action="store_true",
        help="Single pass only (top/month by default). Faster but less thorough.",
    )
    args = parser.parse_args()

    existing_stories: list = []
    if Path(args.out).exists():
        with open(args.out, encoding="utf-8") as f:
            existing_stories = json.load(f)
    existing_ids = {s["id"] for s in existing_stories}

    passes = [(args.sort, args.time_filter)] if args.quick else COMPREHENSIVE_PASSES
    total_new = 0

    for sort, time_filter in passes:
        label = f"{sort}/{time_filter}" if sort == "top" else sort
        print(f"\n{'='*60}", file=sys.stderr)
        print(f"Pass: {label}", file=sys.stderr)
        print(f"{'='*60}", file=sys.stderr)

        fresh = scrape_tsh(sort=sort, time_filter=time_filter, target=args.limit)

        new_stories = [s for s in fresh if s["id"] not in existing_ids]
        for s in new_stories:
            existing_ids.add(s["id"])
            existing_stories.append(s)
        total_new += len(new_stories)
        print(f"\n  {len(new_stories)} new stories from pass [{label}]", file=sys.stderr)

    # Sort by score, boosted by comment-to-upvote ratio (high engagement = priority)
    def _sort_key(s):
        score = s["score"]
        ratio = s.get("num_comments", 0) / max(score, 1)
        boost = 1.0 + min(ratio * 3, 0.5)   # up to +50% for high comment ratio
        return score * boost
    existing_stories.sort(key=_sort_key, reverse=True)

    if total_new:
        print(f"\nAdded {total_new} new story/stories to '{args.out}'.", file=sys.stderr)
    else:
        print(f"\nNo new stories found — '{args.out}' is up to date.", file=sys.stderr)

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(existing_stories, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(existing_stories)} stories total to {args.out}", file=sys.stderr)

    print(f"\n{'#':<4} {'Score':<7} {'Words':<7} Title")
    print("-" * 72)
    for i, s in enumerate(existing_stories, 1):
        print(f"{i:<4} {s['score']:<7} {s['word_count']:<7} {s['title'][:55]}")


if __name__ == "__main__":
    main()
