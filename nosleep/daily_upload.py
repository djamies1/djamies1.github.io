#!/usr/bin/env python3
"""
daily_upload.py — Pick top unuploaded stories, render videos, and upload to YouTube.

Reads nosleep_stories.json, finds the top stories not yet in uploaded.json,
renders videos for them on the fly, and uploads to YouTube with staggered scheduling.

Usage:
    python daily_upload.py                  # scrape, render & upload 3 stories
    python daily_upload.py --limit 5        # process 5 stories instead
    python daily_upload.py --no-scrape      # skip scraping, use existing story pool as-is
    python daily_upload.py --no-stagger     # upload all immediately
    python daily_upload.py --dry-run        # preview without rendering or uploading
"""

import argparse
import json
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from googleapiclient.errors import HttpError

from scrape_nosleep import scrape_all, DEFAULT_SUBREDDITS
from make_video import (
    create_video,
    VIDEO_OUTPUT_FOLDER,
    MUSIC_FOLDER,
    MUSIC_VOLUME,
    DEFAULT_BACKGROUND,
    MAX_VIDEO_DURATION,
    DEFAULT_TTS_RATE,
    DEFAULT_TTS_PITCH,
    DEFAULT_REVERB,
)
from upload_youtube import (
    get_authenticated_service,
    upload_video,
    load_uploaded,
    save_uploaded,
    DEFAULT_STAGGER_HOURS,
    DEFAULT_DELAY,
    DEFAULT_PRIVACY,
)

# ── Config ────────────────────────────────────────────────────────────────────

STORIES_FILE  = "nosleep_stories.json"
DEFAULT_LIMIT = 3

# Quick scrape passes used when --scrape is passed
DAILY_SCRAPE_PASSES = [
    ("top", "week"),
    ("hot", "all"),
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def load_stories() -> list[dict]:
    if not Path(STORIES_FILE).exists():
        sys.exit(f"ERROR: '{STORIES_FILE}' not found. Run scrape_nosleep.py first, or pass --scrape.")
    with open(STORIES_FILE, encoding="utf-8") as f:
        return json.load(f)


def save_stories(stories: list[dict]) -> None:
    with open(STORIES_FILE, "w", encoding="utf-8") as f:
        json.dump(stories, f, ensure_ascii=False, indent=2)


def find_existing_video(story_id: str) -> Path | None:
    """Return the path of an already-rendered video for this story ID, or None."""
    out_dir = Path(VIDEO_OUTPUT_FOLDER)
    for path in out_dir.glob(f"nosleep_*_{story_id}_*.mp4"):
        return path
    return None


def make_output_path(story: dict, all_stories: list[dict]) -> Path:
    """Build the output .mp4 path, using the story's position in the full list as the index."""
    out_dir = Path(VIDEO_OUTPUT_FOLDER)
    out_dir.mkdir(parents=True, exist_ok=True)
    try:
        index = next(i for i, s in enumerate(all_stories) if s["id"] == story["id"])
    except StopIteration:
        index = 0
    post_id = story.get("id", "unknown")
    safe = "".join(c if c.isalnum() or c in " _-" else "" for c in story["title"])
    safe = safe.strip().replace(" ", "_")[:30]
    return out_dir / f"nosleep_{index:02d}_{post_id}_{safe}.mp4"


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Pick top unuploaded stories, render videos, and upload to YouTube.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--limit", type=int, default=DEFAULT_LIMIT,
        help="Number of stories to process per run.",
    )
    parser.add_argument(
        "--no-scrape", action="store_true",
        help="Skip scraping — use existing nosleep_stories.json as-is.",
    )
    parser.add_argument(
        "--stagger-hours", type=float, default=DEFAULT_STAGGER_HOURS,
        help="Hours between each scheduled upload after the first.",
    )
    parser.add_argument(
        "--no-stagger", action="store_true",
        help="Upload all videos immediately instead of staggering.",
    )
    parser.add_argument(
        "--privacy", choices=["private", "unlisted", "public"], default=DEFAULT_PRIVACY,
        help="YouTube privacy for the first (immediate) video.",
    )
    parser.add_argument(
        "--delay", type=int, default=DEFAULT_DELAY,
        help="Seconds to wait between uploads.",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Preview what would be processed without rendering or uploading.",
    )
    args = parser.parse_args()

    # ── Step 1: Optionally scrape for fresh stories ───────────────────────────
    stories = load_stories()
    existing_ids = {s["id"] for s in stories}
    uploaded = load_uploaded()

    if not args.no_scrape:
        print(f"Scraping for fresh stories (top/week + hot) — stopping at {args.limit} per subreddit...")
        total_new = 0
        exclude = set(uploaded.keys()) | existing_ids
        for sort, time_filter in DAILY_SCRAPE_PASSES:
            fresh = scrape_all(DEFAULT_SUBREDDITS, sort=sort, time_filter=time_filter,
                               target=args.limit, exclude_ids=exclude)
            new = [s for s in fresh if s["id"] not in existing_ids]
            for s in new:
                existing_ids.add(s["id"])
                stories.append(s)
            total_new += len(new)
        stories.sort(key=lambda s: s["score"], reverse=True)
        save_stories(stories)
        print(f"Scrape complete — {total_new} new stories added.\n")
    else:
        print(f"Skipping scrape — using {len(stories)} existing stories.\n")

    # ── Step 2: Find top unuploaded stories ───────────────────────────────────
    candidates = [s for s in stories if s["id"] not in uploaded]

    if not candidates:
        print("Nothing to do — all stories have already been uploaded.")
        return

    to_process = candidates[:args.limit]
    print(f"{len(candidates)} unuploaded stories available. Processing top {len(to_process)}:\n")
    for i, s in enumerate(to_process, 1):
        existing = find_existing_video(s["id"])
        status = f"video ready: {existing.name}" if existing else "needs render"
        print(f"  {i}. [{s['id']}] {s['title'][:65]}  ({status})")
    print()

    if args.dry_run:
        print("DRY RUN — nothing rendered or uploaded.")
        return

    # ── Step 3: Render + upload ───────────────────────────────────────────────
    youtube    = get_authenticated_service()
    run_start  = datetime.now(timezone.utc)

    for i, story in enumerate(to_process):
        print(f"\n{'='*60}")
        print(f"[{i+1}/{len(to_process)}] {story['title']}")
        print(f"{'='*60}")

        # Render if not already on disk
        video_path = find_existing_video(story["id"])
        if video_path:
            print(f"  Skipping render — using existing: {video_path.name}")
        else:
            video_path = make_output_path(story, stories)
            create_video(
                story=story,
                output_path=str(video_path),
                voice=None,
                music_path=MUSIC_FOLDER,
                music_volume=MUSIC_VOLUME,
                max_words=None,
                narration=True,
                background_path=DEFAULT_BACKGROUND,
                max_duration=MAX_VIDEO_DURATION,
                tts_rate=DEFAULT_TTS_RATE,
                tts_pitch=DEFAULT_TTS_PITCH,
                reverb=DEFAULT_REVERB,
            )

        # Compute scheduled publish time
        if args.no_stagger or i == 0:
            publish_at = None
        else:
            publish_at = (
                run_start + timedelta(hours=args.stagger_hours * i)
            ).strftime("%Y-%m-%dT%H:%M:%S.000Z")

        if publish_at:
            print(f"  Scheduled: {publish_at} (+{args.stagger_hours * i:.0f}h)")
        else:
            print(f"  Privacy: {args.privacy} (immediate)")

        try:
            video_id = upload_video(youtube, str(video_path), story, args.privacy, publish_at)
        except HttpError as exc:
            print(f"  ERROR: {exc}")
            if exc.status_code == 403:
                print("  Quota likely exceeded. Try again tomorrow.")
            break

        uploaded[story["id"]] = {
            "youtube_id":  video_id,
            "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
            "title":       story["title"],
            "author":      story.get("author", ""),
            "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            **({"publish_at": publish_at} if publish_at else {}),
        }
        save_uploaded(uploaded)

        if publish_at:
            print(f"  Uploaded (scheduled): https://www.youtube.com/watch?v={video_id}")
        else:
            print(f"  Live at: https://www.youtube.com/watch?v={video_id}")

        if i < len(to_process) - 1:
            print(f"\n  Waiting {args.delay}s before next upload...")
            time.sleep(args.delay)

    total = sum(1 for v in uploaded.values() if "youtube_id" in v)
    print(f"\nDone. {total} video(s) uploaded to date.")


if __name__ == "__main__":
    main()
