#!/usr/bin/env python3
"""
scrape_riddles.py — Download public riddle datasets and build riddles.json.

Sources:
  1. Static GitHub datasets (run once to seed the bank)
  2. r/riddles on Reddit (top/year, top/month, hot — filters by upvote score)

The Reddit source automatically refreshes the bank with community-validated
riddles each time you run the script.

Usage:
    python scrape_riddles.py              # download all sources and merge
    python scrape_riddles.py --no-reddit  # skip Reddit, use static datasets only
    python scrape_riddles.py --list       # print current bank without fetching
"""

import argparse
import html
import json
import re
import time
import urllib.request
from pathlib import Path

_DIR         = Path(__file__).resolve().parent
RIDDLES_FILE = str(_DIR / "riddles.json")

# Static GitHub dataset URLs — add more here to extend the bank
DATASET_URLS = [
    # ~366 riddles, {riddle, answer} objects
    "https://raw.githubusercontent.com/byronwade/riddles.byronwade.com/main/lib/riddles.json",
    # ~99 riddles, {id, question, answer} objects
    "https://raw.githubusercontent.com/Code-Institute-Submissions/riddle-1/master/riddles.json",
    # ~20 riddles, {"randomRiddles": [{riddle, answer}]}
    "https://raw.githubusercontent.com/inuits/hubot-scripts/master/riddles.json",
]

# ── Reddit config ─────────────────────────────────────────────────────────────

REDDIT_SUBREDDITS       = ["riddles"]
# Each pass is (sort, time_filter). top/year = best of last year, etc.
REDDIT_PASSES           = [("top", "year"), ("top", "month"), ("hot", "all")]
REDDIT_MIN_SCORE        = 50     # skip low-voted posts
REDDIT_MIN_TITLE        = 20     # skip obvious meta titles
REDDIT_REQUEST_GAP      = 6.0    # seconds between requests (Reddit unauthenticated limit)
REDDIT_MAX_COMMENT_REQS = 20     # max comment fetches per listing pass
REDDIT_HEADERS          = {"User-Agent": "riddle-scraper/1.0 (riddle video pipeline)"}

# Post title keywords that indicate a meta/discussion post rather than a riddle
REDDIT_META_KEYWORDS = (
    "weekly", "daily", "monthly", "discussion", "meta",
    "megathread", "what riddle", "oc riddle", "this sub", "looking for",
)

_last_reddit_req: float = 0.0


def _normalise_question(q: str) -> str:
    """Lowercase + strip for deduplication key."""
    return re.sub(r"\s+", " ", q.strip().lower())


def _extract_riddles(data: object, source_url: str) -> list[dict]:
    """
    Accept various dataset shapes and return a flat list of
    {"question": ..., "answer": ..., "source": ..., "category": ...} dicts.
    """
    results = []

    if isinstance(data, list):
        for item in data:
            if not isinstance(item, dict):
                continue
            # Normalise field names
            question = (
                item.get("question")
                or item.get("riddle")
                or item.get("q")
                or item.get("Question")
                or ""
            )
            answer = (
                item.get("answer")
                or item.get("solution")
                or item.get("a")
                or item.get("Answer")
                or ""
            )
            if not question or not answer:
                continue
            results.append({
                "question": question.strip(),
                "answer":   answer.strip(),
                "category": item.get("category", item.get("type", "classic")),
                "source":   source_url,
                "difficulty": item.get("difficulty", None),
            })
    elif isinstance(data, dict):
        # Some datasets use a wrapper key
        for key in ("riddles", "randomRiddles", "data", "items", "questions"):
            if key in data and isinstance(data[key], list):
                return _extract_riddles(data[key], source_url)

    return results


def _reddit_wait() -> None:
    global _last_reddit_req
    gap = REDDIT_REQUEST_GAP - (time.time() - _last_reddit_req)
    if gap > 0:
        time.sleep(gap)
    _last_reddit_req = time.time()


def _parse_answer_text(text: str) -> str:
    """Extract answer from any Reddit text — spoiler tags or 'Answer:' markers.

    Reddit HTML-encodes angle brackets in their JSON API, so >!spoiler!< arrives
    as &gt;!spoiler!&lt; — we unescape before matching.
    """
    text = html.unescape(text)
    # Reddit spoiler format: >!answer!<
    m = re.search(r">!(.+?)!<", text, re.DOTALL)
    if m:
        return m.group(1).strip()
    # Labelled answer: "Answer: X" or "Solution: X"
    m = re.search(r"(?:answer|solution)\s*[:\-]\s*(.+)", text, re.IGNORECASE)
    if m:
        return m.group(1).split("\n")[0].strip()
    return ""


def _fetch_json(url: str) -> dict | None:
    """Fetch a URL with rate limiting and return parsed JSON, or None on error."""
    _reddit_wait()
    try:
        req = urllib.request.Request(url, headers=REDDIT_HEADERS)
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"    WARNING: request failed ({e})")
        return None


def _answer_from_comments(subreddit: str, post_id: str, post_author: str) -> str:
    """Fetch the post's comments and return the first answer found.

    Looks for OP's own comment first (most likely to be the official answer),
    then falls back to the highest-scored comment containing answer text.
    """
    url = (
        f"https://www.reddit.com/r/{subreddit}/comments/{post_id}.json"
        f"?limit=25&sort=top"
    )
    data = _fetch_json(url)
    if not data or not isinstance(data, list) or len(data) < 2:
        return ""

    comments = data[1].get("data", {}).get("children", [])

    best_answer = ""
    best_score  = -1

    for c in comments:
        cd     = c.get("data", {})
        body   = (cd.get("body") or "").strip()
        author = cd.get("author", "")
        score  = cd.get("score", 0)

        if author == "AutoModerator":
            continue
        if body in ("[removed]", "[deleted]", "") or not body:
            continue

        answer = _parse_answer_text(body)
        if not answer:
            continue

        # OP's own answer comment wins outright
        if author == post_author:
            return answer

        if score > best_score:
            best_score  = score
            best_answer = answer

    return best_answer


def fetch_reddit_riddles() -> list[dict]:
    """Fetch upvoted riddles from r/riddles via Reddit's public JSON API.

    Most r/riddles posts are self-posts where the title is the riddle and the
    answer lives in the comments (posted by OP). We fetch comments for the
    top-scoring eligible posts, up to REDDIT_MAX_COMMENT_REQS per listing pass.
    """
    results: list[dict] = []
    seen_titles: set[str] = set()

    for subreddit in REDDIT_SUBREDDITS:
        for sort, time_filter in REDDIT_PASSES:
            listing_url = (
                f"https://www.reddit.com/r/{subreddit}/{sort}.json"
                f"?t={time_filter}&limit=100"
            )
            print(f"  Reddit r/{subreddit} ({sort}/{time_filter}) ...")
            data = _fetch_json(listing_url)
            if not data:
                continue

            posts = data.get("data", {}).get("children", [])

            # Filter to eligible self-posts, sort by score descending
            eligible = []
            for post in posts:
                d     = post.get("data", {})
                score = d.get("score", 0)
                title = (d.get("title") or "").strip()

                if score < REDDIT_MIN_SCORE:
                    continue
                if len(title) < REDDIT_MIN_TITLE:
                    continue
                if not d.get("is_self", False):
                    continue  # image/link posts — no text to extract
                if any(kw in title.lower() for kw in REDDIT_META_KEYWORDS):
                    continue

                norm = _normalise_question(title)
                if norm in seen_titles:
                    continue

                eligible.append(d)

            eligible.sort(key=lambda d: d.get("score", 0), reverse=True)

            found        = 0
            comment_reqs = 0

            for d in eligible:
                title    = d["title"].strip()
                selftext = (d.get("selftext") or "").strip()
                norm     = _normalise_question(title)

                # Try to get answer from selftext first (no extra API call)
                answer = ""
                if selftext and selftext not in ("[removed]", "[deleted]"):
                    answer = _parse_answer_text(selftext)

                # Fall back to comments (rate-limited, capped per pass)
                if not answer and comment_reqs < REDDIT_MAX_COMMENT_REQS:
                    answer = _answer_from_comments(subreddit, d["id"], d.get("author", ""))
                    comment_reqs += 1

                if not answer:
                    continue
                if norm in seen_titles:
                    continue

                seen_titles.add(norm)
                results.append({
                    "question": title,
                    "answer":   answer,
                    "category": "reddit",
                    "source":   f"r/{subreddit}",
                    "difficulty": None,
                })
                found += 1

            print(f"    -> {found} valid riddles ({comment_reqs} comment fetches)")

    return results


def fetch_dataset(url: str) -> list[dict]:
    print(f"  Fetching: {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "riddle-scraper/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read().decode("utf-8")
    data = json.loads(raw)
    riddles = _extract_riddles(data, url)
    print(f"    -> {len(riddles)} riddles found")
    return riddles


def load_existing() -> list[dict]:
    p = Path(RIDDLES_FILE)
    if not p.exists():
        return []
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def save_riddles(riddles: list[dict]) -> None:
    with open(RIDDLES_FILE, "w", encoding="utf-8") as f:
        json.dump(riddles, f, indent=2, ensure_ascii=False)


def assign_ids(riddles: list[dict]) -> list[dict]:
    """Ensure every riddle has a sequential rdl_XXXX id, preserving existing ones."""
    used_nums = set()
    for r in riddles:
        rid = r.get("id", "")
        m = re.match(r"rdl_(\d+)$", rid)
        if m:
            used_nums.add(int(m.group(1)))

    counter = 1
    for r in riddles:
        if not r.get("id") or not re.match(r"rdl_\d+$", r.get("id", "")):
            while counter in used_nums:
                counter += 1
            r["id"] = f"rdl_{counter:04d}"
            used_nums.add(counter)
            counter += 1

    return riddles


def scrape_and_merge(include_reddit: bool = True) -> list[dict]:
    existing = load_existing()
    seen_keys: dict[str, dict] = {
        _normalise_question(r["question"]): r for r in existing
    }
    new_count = 0

    print("Downloading static datasets...")
    for url in DATASET_URLS:
        try:
            riddles = fetch_dataset(url)
        except Exception as e:
            print(f"    WARNING: failed to fetch {url} — {e}")
            continue

        for r in riddles:
            key = _normalise_question(r["question"])
            if key not in seen_keys:
                seen_keys[key] = r
                new_count += 1

    if include_reddit:
        print("\nFetching Reddit riddles (r/riddles, upvote-filtered)...")
        try:
            reddit_riddles = fetch_reddit_riddles()
        except Exception as e:
            print(f"  WARNING: Reddit fetch failed — {e}")
            reddit_riddles = []

        for r in reddit_riddles:
            key = _normalise_question(r["question"])
            if key not in seen_keys:
                seen_keys[key] = r
                new_count += 1

    merged = list(seen_keys.values())
    merged = assign_ids(merged)
    save_riddles(merged)
    print(f"\nMerge complete — {new_count} new riddles added, {len(merged)} total.\n")
    return merged


def print_table(riddles: list[dict]) -> None:
    print(f"\n{'#':<6} {'ID':<10} {'Category':<12} Question")
    print("-" * 80)
    for i, r in enumerate(riddles):
        cat = (r.get("category") or "classic")[:10]
        q   = r["question"][:60]
        print(f"{i:<6} {r.get('id',''):<10} {cat:<12} {q}")
    print(f"\n{len(riddles)} riddles total.")


def print_review(riddles: list[dict]) -> None:
    """Print full Q+A for each riddle — for quality checking."""
    for i, r in enumerate(riddles):
        src = r.get("source", "")
        print(f"\n[{i+1}/{len(riddles)}]  {r.get('id','')}  ({src})")
        print(f"Q: {r['question']}")
        print(f"A: {r['answer']}")
        print("-" * 60)


def main():
    parser = argparse.ArgumentParser(description="Build riddle bank from public datasets.")
    parser.add_argument("--list",      action="store_true", help="Print summary table without fetching")
    parser.add_argument("--review",    metavar="SOURCE",    nargs="?", const="all",
                        help="Print full Q+A for review. Optionally filter by source, "
                             "e.g. --review reddit  or  --review all")
    parser.add_argument("--no-reddit", action="store_true", help="Skip Reddit, use static datasets only")
    args = parser.parse_args()

    if args.list:
        riddles = load_existing()
        if not riddles:
            print("No riddles found — run without --list to download.")
            return
        print_table(riddles)
        return

    if args.review is not None:
        riddles = load_existing()
        if not riddles:
            print("No riddles found — run without --review to download first.")
            return
        if args.review != "all":
            term = args.review.lower()
            riddles = [r for r in riddles if
                       term in (r.get("source") or "").lower() or
                       term in (r.get("category") or "").lower()]
            if not riddles:
                print(f"No riddles found with source matching '{args.review}'.")
                return
        print_review(riddles)
        return

    riddles = scrape_and_merge(include_reddit=not args.no_reddit)
    print_table(riddles)


if __name__ == "__main__":
    main()
