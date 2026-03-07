#!/usr/bin/env python3
"""
run_daily.py — Good Vibrations daily pipeline.

Scrapes fresh good news stories, renders 3 videos, and schedules them
to YouTube Shorts — all in one command.

Run this once per day (manually or via Task Scheduler / cron):
    python run_daily.py

Options:
    python run_daily.py --count 5       # produce 5 videos instead of 3
    python run_daily.py --stagger 8     # 8-hour gaps between uploads (default: 6)
    python run_daily.py --max-age 7     # only use stories from last 7 days (default: 14)
    python run_daily.py --dry-run       # preview everything without rendering or uploading
"""

import argparse
import json
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ── Sibling module imports ─────────────────────────────────────────────────────
from scrape_goodnews import (
    load_creds, scrape_reddit, scrape_rss,
    rewrite_headline, REDDIT_SUBREDDITS, RSS_FEEDS,
)
from make_video import create_video, VIDEO_OUTPUT_DIR, MUSIC_FOLDER
from upload_youtube import (
    get_authenticated_service, upload_video,
    load_uploaded, save_uploaded,
)
from googleapiclient.errors import HttpError

# ── Config ─────────────────────────────────────────────────────────────────────

STORIES_FILE          = "goodnews_stories.json"
DEFAULT_COUNT         = 3     # videos to produce per run
DEFAULT_STAGGER_HOURS = 6     # hours between each scheduled upload
DEFAULT_MAX_AGE_DAYS  = 14    # skip Reddit posts older than this

# ── Helpers ────────────────────────────────────────────────────────────────────

def _is_fresh(story: dict, max_age_days: int) -> bool:
    """Return True if the story falls within the freshness window.
    RSS stories (no created_utc) are always considered fresh."""
    created_utc = story.get("created_utc")
    if created_utc is None:
        return True
    cutoff     = datetime.now(timezone.utc) - timedelta(days=max_age_days)
    created_dt = datetime.fromtimestamp(created_utc, tz=timezone.utc)
    return created_dt >= cutoff


def _find_existing_video(story_id: str) -> Path | None:
    out_dir = Path(VIDEO_OUTPUT_DIR)
    if not out_dir.exists():
        return None
    for path in out_dir.glob(f"goodnews_*_{story_id}_*.mp4"):
        return path
    return None


def _make_output(story: dict, index: int) -> str:
    out_dir = Path(VIDEO_OUTPUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)
    safe = "".join(
        c if c.isalnum() or c in " _-" else ""
        for c in (story.get("rewritten_headline") or story["original_headline"])
    )
    safe = safe.strip().replace(" ", "_")[:35]
    return str(out_dir / f"goodnews_{index:04d}_{story['id']}_{safe}.mp4")


def _section(title: str) -> None:
    print(f"\n── {title} {'─' * max(0, 60 - len(title))}")

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Daily Good Vibrations pipeline: scrape → render → upload.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--count",    type=int,   default=DEFAULT_COUNT,
                        help="Number of videos to produce per run.")
    parser.add_argument("--stagger",  type=float, default=DEFAULT_STAGGER_HOURS,
                        help="Hours between each scheduled upload after the first.")
    parser.add_argument("--max-age",  type=int,   default=DEFAULT_MAX_AGE_DAYS,
                        dest="max_age",
                        help="Maximum story age in days (Reddit posts only).")
    parser.add_argument("--dry-run",  action="store_true",
                        help="Preview without rendering or uploading.")
    args = parser.parse_args()

    creds   = load_creds()
    api_key = creds["gemini_api_key"]

    # ── Load existing state ────────────────────────────────────────────────────
    uploaded     = load_uploaded()
    uploaded_ids = set(uploaded.keys())

    existing_stories: list[dict] = []
    if Path(STORIES_FILE).exists():
        with open(STORIES_FILE, encoding="utf-8") as f:
            existing_stories = json.load(f)
    existing_ids = {s["id"] for s in existing_stories}

    # IDs we never want to process again
    skip_ids = existing_ids | uploaded_ids

    # ── Step 1: Scrape fresh stories ───────────────────────────────────────────
    _section("Scraping fresh stories")

    fresh: list[dict] = []

    # Reddit — "new" sort gives the most recent posts
    for subreddit in REDDIT_SUBREDDITS:
        stories = scrape_reddit(subreddit, sort="new", time_filter="all", target=30)
        for s in stories:
            if s["id"] in skip_ids:
                continue
            if not _is_fresh(s, args.max_age):
                print(f"  Skipping (too old): {s['original_headline'][:60]}", file=sys.stderr)
                continue
            skip_ids.add(s["id"])
            fresh.append(s)

    # RSS feeds — inherently recent
    for name, feed_url in RSS_FEEDS:
        stories = scrape_rss(name, feed_url)
        for s in stories:
            if s["id"] in skip_ids:
                continue
            skip_ids.add(s["id"])
            fresh.append(s)

    print(f"\nFound {len(fresh)} fresh unseen stories.")

    # If not enough fresh content, top up from unuploaded backlog
    if len(fresh) < args.count:
        print(f"  Only {len(fresh)} fresh — topping up from backlog...")
        for s in existing_stories:
            if s["id"] not in uploaded_ids and s["id"] not in {c["id"] for c in fresh}:
                fresh.append(s)
                if len(fresh) >= args.count:
                    break

    if not fresh:
        print("No stories available today — nothing to post.")
        return

    # Pick today's batch
    picked = fresh[:args.count]
    if len(picked) < args.count:
        print(f"Warning: only {len(picked)} story/stories available (wanted {args.count}).")

    # ── Step 2: Rewrite headlines ──────────────────────────────────────────────
    need_rewrite = [s for s in picked if not s.get("rewritten_headline")]
    if need_rewrite:
        _section(f"Rewriting {len(need_rewrite)} headline(s) with Gemini Flash")
        for s in need_rewrite:
            print(f"  Original : {s['original_headline'][:70]}")
            s["rewritten_headline"] = rewrite_headline(s["original_headline"], api_key)
            print(f"  Rewritten: {s['rewritten_headline']}")
            time.sleep(0.3)

    # Save any newly scraped stories to goodnews_stories.json
    new_entries = [s for s in picked if s["id"] not in existing_ids]
    if new_entries:
        all_stories = existing_stories + new_entries
        all_stories.sort(key=lambda s: s["score"], reverse=True)
        with open(STORIES_FILE, "w", encoding="utf-8") as f:
            json.dump(all_stories, f, indent=2, ensure_ascii=False)
        print(f"\nSaved {len(new_entries)} new story/stories to {STORIES_FILE}.")

    # ── Step 3: Render videos ──────────────────────────────────────────────────
    _section(f"Rendering {len(picked)} video(s)")

    out_dir        = Path(VIDEO_OUTPUT_DIR)
    existing_count = len(list(out_dir.glob("goodnews_*.mp4"))) if out_dir.exists() else 0
    video_paths: list[tuple[dict, Path]] = []

    for i, story in enumerate(picked):
        headline = story.get("rewritten_headline") or story["original_headline"]

        # Re-use an already-rendered video if one exists for this story
        existing_video = _find_existing_video(story["id"])
        if existing_video:
            print(f"\n  [{i+1}/{len(picked)}] Already rendered — {existing_video.name}")
            video_paths.append((story, existing_video))
            continue

        output = _make_output(story, existing_count + i)
        print(f"\n  [{i+1}/{len(picked)}] {headline}")

        if args.dry_run:
            print(f"    → Would render: {output}")
            video_paths.append((story, Path(output)))
            continue

        create_video(story=story, output_path=output)
        video_paths.append((story, Path(output)))

    # ── Step 4: Upload to YouTube ──────────────────────────────────────────────
    _section(f"Uploading {len(video_paths)} video(s) to YouTube")

    run_start = datetime.now(timezone.utc)

    if args.dry_run:
        print()
        for i, (story, path) in enumerate(video_paths):
            headline   = story.get("rewritten_headline") or story["original_headline"]
            publish_at = None if i == 0 else (
                run_start + timedelta(hours=args.stagger * i)
            ).strftime("%Y-%m-%dT%H:%M:%S.000Z")
            timing = f"scheduled for {publish_at} (+{args.stagger * i:.0f}h)" if publish_at else "immediate"
            print(f"  [{i+1}] {headline}")
            print(f"        source  : {story['source']}")
            print(f"        timing  : {timing}")
            print(f"        file    : {path.name}")
        print("\nDRY RUN complete — nothing was rendered or uploaded.")
        return

    youtube = get_authenticated_service()

    for i, (story, video_path) in enumerate(video_paths):
        headline   = story.get("rewritten_headline") or story["original_headline"]
        publish_at = None if i == 0 else (
            run_start + timedelta(hours=args.stagger * i)
        ).strftime("%Y-%m-%dT%H:%M:%S.000Z")

        print(f"\n  [{i+1}/{len(video_paths)}] {headline}")
        if publish_at:
            print(f"  Scheduled: {publish_at}  (+{args.stagger * i:.0f}h)")
        else:
            print(f"  Publishing immediately...")

        try:
            video_id = upload_video(youtube, str(video_path), story, "public", publish_at)
        except HttpError as exc:
            print(f"  ERROR: {exc}")
            if exc.status_code == 403:
                print("  Quota exceeded — try again tomorrow.")
            break

        uploaded[story["id"]] = {
            "youtube_id":  video_id,
            "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
            "title":       headline,
            "source":      story["source"],
            "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            **({"publish_at": publish_at} if publish_at else {}),
        }
        save_uploaded(uploaded)

        url = f"https://www.youtube.com/watch?v={video_id}"
        print(f"  {'Scheduled' if publish_at else 'Live'}: {url}")

        if i < len(video_paths) - 1:
            print("  Waiting 10s before next upload...")
            time.sleep(10)

    print(f"\nDone. {len(uploaded)} total video(s) published to date.")


if __name__ == "__main__":
    main()
