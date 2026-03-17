#!/usr/bin/env python3
"""
daily_upload.py — Scrape r/TwoSentenceHorror, render videos, and upload to YouTube.

Reads tsh_stories.json, finds the top stories not yet in uploaded.json,
renders videos for them on the fly, and uploads to YouTube with staggered scheduling.

Usage:
    python daily_upload.py                  # scrape, render & upload 3 stories
    python daily_upload.py --limit 5        # process 5 stories instead
    python daily_upload.py --no-scrape      # skip scraping, use existing story pool
    python daily_upload.py --no-stagger     # upload all immediately
    python daily_upload.py --dry-run        # preview without rendering or uploading
"""

import argparse
import json
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "nosleep"))
sys.path.insert(0, str(Path(__file__).resolve().parent))  # local make_video takes priority

from googleapiclient.errors import HttpError

from scrape_tsh import scrape_tsh
from upload_youtube import (
    get_authenticated_service,
    upload_video as _upload_video,
    DEFAULT_DELAY,
    DEFAULT_PRIVACY,
)

DEFAULT_STAGGER_HOURS = 1

from make_video import (
    create_video,
    VIDEO_OUTPUT_FOLDER,
    MUSIC_FOLDER,
    MUSIC_VOLUME,
    DEFAULT_TTS_RATE,
    DEFAULT_TTS_PITCH,
    DEFAULT_REVERB,
)

# ── Config ────────────────────────────────────────────────────────────────────

STORIES_FILE  = "tsh_stories.json"
UPLOADED_FILE = "uploaded.json"
DEFAULT_LIMIT = 3

# Passes run each daily upload
TSH_SCRAPE_PASSES = [
    ("top", "month"),
    ("hot", "all"),
]

# YouTube branding for this channel
YT_TITLE_SUFFIX = " | Two Line Terror"
YT_TAGS = [
    "two line terror", "two sentence horror", "horror", "scary", "creepy",
    "short horror", "reddit horror", "r/TwoSentenceHorror", "horror story", "micro horror",
]


# ── Upload tracking ───────────────────────────────────────────────────────────

def load_uploaded() -> dict:
    if Path(UPLOADED_FILE).exists():
        with open(UPLOADED_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_uploaded(uploaded: dict) -> None:
    with open(UPLOADED_FILE, "w", encoding="utf-8") as f:
        json.dump(uploaded, f, indent=2, ensure_ascii=False)


# ── Story file ────────────────────────────────────────────────────────────────

def load_stories() -> list[dict]:
    if not Path(STORIES_FILE).exists():
        return []
    with open(STORIES_FILE, encoding="utf-8") as f:
        return json.load(f)


def save_stories(stories: list[dict]) -> None:
    with open(STORIES_FILE, "w", encoding="utf-8") as f:
        json.dump(stories, f, ensure_ascii=False, indent=2)


# ── Video helpers ─────────────────────────────────────────────────────────────

def find_existing_video(story_id: str) -> Path | None:
    out_dir = Path(VIDEO_OUTPUT_FOLDER)
    for path in out_dir.glob(f"tsh_*_{story_id}_*.mp4"):
        return path
    return None


def make_output_path(story: dict, all_stories: list[dict]) -> Path:
    out_dir = Path(VIDEO_OUTPUT_FOLDER)
    out_dir.mkdir(parents=True, exist_ok=True)
    try:
        index = next(i for i, s in enumerate(all_stories) if s["id"] == story["id"])
    except StopIteration:
        index = 0
    post_id = story.get("id", "unknown")
    safe = "".join(c if c.isalnum() or c in " _-" else "" for c in story["title"])
    safe = safe.strip().replace(" ", "_")[:40]
    return out_dir / f"tsh_{index:04d}_{post_id}_{safe}.mp4"


# ── YouTube metadata ──────────────────────────────────────────────────────────

def build_title(story: dict) -> str:
    max_body = 100 - len(YT_TITLE_SUFFIX)
    title = story["title"]
    if len(title) > max_body:
        title = title[:max_body - 1].rstrip() + "\u2026"
    return title + YT_TITLE_SUFFIX


def build_description(story: dict) -> str:
    author = story.get("author", "unknown")
    url = story.get("url", f"https://www.reddit.com/r/TwoSentenceHorror/comments/{story['id']}/")
    body = story["body"]
    return (
        f"{story['title']}\n\n"
        f"{body}\n\n"
        f"\u2014\n\n"
        f"Original story by u/{author} on r/TwoSentenceHorror\n"
        f"{url}\n\n"
        f"All stories are shared with appreciation for the original authors. "
        f"If you are the author and would like your story removed, please contact us.\n\n"
        f"Subscribe for your nightly dose of dread.\n\n"
        f"#horror #scary #creepy #spooky #scarystories #horrorstory #storytime #shorts #twosentencehorror #twolineterror"
    )


def upload_video(youtube, video_path: str, story: dict, privacy: str,
                 publish_at: str | None = None) -> str:
    """Wrapper around upload_youtube.upload_video with TSH-specific metadata."""
    from googleapiclient.http import MediaFileUpload

    status_body: dict = {"selfDeclaredMadeForKids": False}
    if publish_at:
        status_body["privacyStatus"] = "private"
        status_body["publishAt"] = publish_at
    else:
        status_body["privacyStatus"] = privacy

    body = {
        "snippet": {
            "title":       build_title(story),
            "description": build_description(story),
            "tags":        YT_TAGS,
            "categoryId":  "24",  # Entertainment
        },
        "status": status_body,
    }

    media = MediaFileUpload(
        video_path,
        mimetype="video/mp4",
        resumable=True,
        chunksize=256 * 1024,
    )

    request = youtube.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media,
    )

    print(f"  Uploading: {Path(video_path).name}")
    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"    {int(status.progress() * 100)}% ...", end="\r")
    print("    Upload complete.          ")

    return response["id"]


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Scrape r/TwoSentenceHorror, render videos, and upload to YouTube.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--limit",          type=int,   default=DEFAULT_LIMIT)
    parser.add_argument("--no-scrape",      action="store_true",
                        help="Skip scraping — use existing tsh_stories.json as-is.")
    parser.add_argument("--stagger-hours",  type=float, default=DEFAULT_STAGGER_HOURS)
    parser.add_argument("--no-stagger",     action="store_true")
    parser.add_argument("--privacy",        choices=["private", "unlisted", "public"],
                        default=DEFAULT_PRIVACY)
    parser.add_argument("--delay",          type=int,   default=DEFAULT_DELAY)
    parser.add_argument("--dry-run",        action="store_true")
    args = parser.parse_args()

    # ── Step 1: Load existing pool + upload tracker ───────────────────────────
    stories     = load_stories()
    existing_ids = {s["id"] for s in stories}
    uploaded    = load_uploaded()

    # ── Step 2: Optionally scrape for fresh stories ───────────────────────────
    if not args.no_scrape:
        print(f"Scraping r/TwoSentenceHorror — stopping at {args.limit} per pass...")
        total_new = 0
        exclude = set(uploaded.keys()) | existing_ids
        for sort, time_filter in TSH_SCRAPE_PASSES:
            label = f"{sort}/{time_filter}" if sort == "top" else sort
            print(f"\nPass: {label}")
            fresh = scrape_tsh(
                sort=sort,
                time_filter=time_filter,
                target=args.limit,
                exclude_ids=exclude,
            )
            new = [s for s in fresh if s["id"] not in existing_ids]
            for s in new:
                existing_ids.add(s["id"])
                stories.append(s)
            total_new += len(new)
        stories.sort(key=lambda s: s["score"], reverse=True)
        save_stories(stories)
        print(f"\nScrape complete — {total_new} new stories added.\n")
    else:
        print(f"Skipping scrape — using {len(stories)} existing stories.\n")

    # ── Step 3: Find top unuploaded stories ───────────────────────────────────
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

    # ── Step 4: Render + upload ───────────────────────────────────────────────
    youtube   = get_authenticated_service()
    run_start = datetime.now(timezone.utc)

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
                narration=True,
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
            **({  "publish_at": publish_at} if publish_at else {}),
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
