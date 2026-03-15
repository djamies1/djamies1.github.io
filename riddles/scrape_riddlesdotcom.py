#!/usr/bin/env python3
"""
scrape_riddlesdotcom.py — Bulk import riddles from riddles.com into riddles.json.

Scans https://www.riddles.com/{id} for IDs 1 through MAX_ID, extracts the
question and answer, filters out visual/image riddles, and merges results
into riddles.json using the same deduplication logic as scrape_riddles.py.

Run this once to bulk-populate the bank. Re-run occasionally to pick up new riddles.

Usage:
    python scrape_riddlesdotcom.py               # scan all IDs
    python scrape_riddlesdotcom.py --max 1000    # scan IDs 1-1000 (test)
    python scrape_riddlesdotcom.py --workers 10  # use 10 concurrent workers
    python scrape_riddlesdotcom.py --resume      # skip IDs already in progress file
"""

import argparse
import html as _html
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

_DIR         = Path(__file__).resolve().parent
RIDDLES_FILE = str(_DIR / "riddles.json")
PROGRESS_FILE = str(_DIR / ".riddlesdotcom_progress.json")  # tracks fetched IDs

BASE_URL    = "https://www.riddles.com/{}"
USER_AGENT  = "Mozilla/5.0 (riddle-video-pipeline)"
MAX_ID      = 11600   # upper bound found by testing
WORKERS     = 8       # concurrent HTTP workers
SAVE_EVERY  = 200     # save riddles.json every N successful riddles

# Riddles longer than this are too verbose for a 20-second short
MAX_QUESTION_LEN = 400


# ── HTML parsing ──────────────────────────────────────────────────────────────

def _strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    text = _html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def parse_riddle_page(page_html: str) -> dict | None:
    """Return {question, answer} or None if the page isn't a usable text riddle."""
    # Question: content after "Riddle:" label, before the answer collapse div
    q_m = re.search(
        r'orange_dk[^>]*>Riddle:</strong>([\s\S]*?)<div[^>]*class="[^"]*collapse',
        page_html,
    )
    if not q_m:
        return None
    q_raw = q_m.group(1)
    if "<img" in q_raw:
        return None  # requires a visual to understand

    # Answer: content after "Answer:" label, before the print-only span
    a_m = re.search(
        r'dark_purple">Answer</strong>:\s*([\s\S]*?)<span\s+class="visible-print',
        page_html,
    )
    if not a_m:
        return None
    a_raw = a_m.group(1)
    if "<img" in a_raw:
        return None  # answer is a diagram/image

    question = _strip_html(q_raw)
    answer   = _strip_html(a_raw)

    if len(question) < 15 or len(question) > MAX_QUESTION_LEN:
        return None
    if len(answer) < 2:
        return None

    # Drop entries where the answer text leaked into the question
    # (happens when site embeds "Answer: X" directly in the question field)
    if answer.lower()[:20] in question.lower():
        return None

    return {"question": question, "answer": answer}


# ── Fetching ──────────────────────────────────────────────────────────────────

import urllib.request
import urllib.error

def fetch_riddle(rid: int) -> dict | None:
    """Fetch and parse a single riddle. Returns dict or None."""
    url = BASE_URL.format(rid)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=15) as resp:
            page_html = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise
    except Exception:
        return None

    result = parse_riddle_page(page_html)
    if result:
        result["source"] = f"riddles.com/{rid}"
        result["category"] = "classic"
        result["difficulty"] = None
    return result


# ── Merge with existing bank ──────────────────────────────────────────────────

def _normalise(q: str) -> str:
    return re.sub(r"\s+", " ", q.strip().lower())


def load_bank() -> list[dict]:
    p = Path(RIDDLES_FILE)
    if not p.exists():
        return []
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def save_bank(riddles: list[dict]) -> None:
    with open(RIDDLES_FILE, "w", encoding="utf-8") as f:
        json.dump(riddles, f, indent=2, ensure_ascii=False)


def assign_ids(riddles: list[dict]) -> list[dict]:
    used = set()
    for r in riddles:
        m = re.match(r"rdl_(\d+)$", r.get("id", ""))
        if m:
            used.add(int(m.group(1)))
    counter = 1
    for r in riddles:
        if not r.get("id") or not re.match(r"rdl_\d+$", r.get("id", "")):
            while counter in used:
                counter += 1
            r["id"] = f"rdl_{counter:04d}"
            used.add(counter)
            counter += 1
    return riddles


# ── Progress tracking ─────────────────────────────────────────────────────────

def load_progress() -> set[int]:
    p = Path(PROGRESS_FILE)
    if not p.exists():
        return set()
    with open(p, encoding="utf-8") as f:
        return set(json.load(f))


def save_progress(done: set[int]) -> None:
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(sorted(done), f)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Bulk import riddles from riddles.com into riddles.json."
    )
    parser.add_argument("--max",     type=int, default=MAX_ID,
                        help=f"Max riddle ID to scan (default: {MAX_ID})")
    parser.add_argument("--workers", type=int, default=WORKERS,
                        help=f"Concurrent HTTP workers (default: {WORKERS})")
    parser.add_argument("--resume",  action="store_true",
                        help="Skip IDs already recorded in progress file")
    args = parser.parse_args()

    # Load existing bank
    bank     = load_bank()
    seen_qs  = {_normalise(r["question"]) for r in bank}
    new_riddles: list[dict] = []

    # Determine which IDs to scan
    done_ids = load_progress() if args.resume else set()
    to_scan  = [i for i in range(1, args.max + 1) if i not in done_ids]

    print(f"riddles.com scraper — scanning IDs 1-{args.max}  ({len(to_scan)} to fetch)")
    print(f"Workers: {args.workers}  |  Existing bank: {len(bank)} riddles\n")

    fetched = 0
    added   = 0
    start   = time.time()

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(fetch_riddle, rid): rid for rid in to_scan}
        for future in as_completed(futures):
            rid    = futures[future]
            result = future.result()
            fetched += 1
            done_ids.add(rid)

            if result:
                nq = _normalise(result["question"])
                if nq not in seen_qs:
                    seen_qs.add(nq)
                    new_riddles.append(result)
                    added += 1

            # Progress report every 100 fetches
            if fetched % 100 == 0:
                elapsed = time.time() - start
                rate    = fetched / elapsed
                remain  = (len(to_scan) - fetched) / rate if rate else 0
                print(
                    f"  {fetched}/{len(to_scan)} fetched  |  "
                    f"+{added} new riddles  |  "
                    f"{rate:.1f} req/s  |  "
                    f"~{remain/60:.0f}m remaining"
                )

            # Periodically save to avoid losing work
            if added > 0 and added % SAVE_EVERY == 0:
                combined = assign_ids(bank + new_riddles)
                save_bank(combined)
                save_progress(done_ids)
                print(f"  -- checkpoint: {len(combined)} riddles saved --")

    # Final save
    combined = assign_ids(bank + new_riddles)
    save_bank(combined)
    save_progress(done_ids)

    elapsed = time.time() - start
    print(f"\nDone in {elapsed/60:.1f}m — added {added} new riddles, {len(combined)} total.")


if __name__ == "__main__":
    main()
