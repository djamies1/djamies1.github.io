#!/usr/bin/env python3
"""
daily_upload.py — Pick unuploaded riddles, render videos, upload to YouTube.

Reuses upload_youtube.py from the nosleep pipeline for OAuth and upload logic.

Usage:
    python daily_upload.py                  # scrape, render & upload 3 riddles
    python daily_upload.py --limit 5        # process 5 riddles
    python daily_upload.py --scrape         # refresh riddle bank before uploading
    python daily_upload.py --dry-run        # preview without rendering/uploading
    python daily_upload.py --limit 1 --privacy private   # test upload
"""

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Import upload_youtube from the nosleep pipeline (reuse OAuth, client_secrets, token)
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "nosleep"))
sys.path.insert(0, str(Path(__file__).resolve().parent))  # local make_video takes priority

from upload_youtube import (
    get_authenticated_service,
    DEFAULT_DELAY,
    DEFAULT_PRIVACY,
)

from make_video import (
    create_video,
    VIDEO_OUTPUT_FOLDER,
    MUSIC_FOLDER,
    MUSIC_VOLUME,
)

# ── Config ────────────────────────────────────────────────────────────────────

_DIR          = Path(__file__).resolve().parent
RIDDLES_FILE  = str(_DIR / "riddles.json")
UPLOADED_FILE = str(_DIR / "uploaded.json")
DEFAULT_LIMIT         = 3
DEFAULT_STAGGER_HOURS = 4

# YouTube channel branding
YT_TITLE_SUFFIX = " | Riddle Me Shorts"
YT_TAGS = [
    "riddle", "brain teaser", "puzzle", "riddle of the day", "shorts",
    "riddle me shorts", "can you solve this", "tricky riddle", "logic puzzle",
]


# ── Data helpers ──────────────────────────────────────────────────────────────

def load_riddles() -> list[dict]:
    p = Path(RIDDLES_FILE)
    if not p.exists():
        return []
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def load_uploaded() -> dict:
    p = Path(UPLOADED_FILE)
    if not p.exists():
        return {}
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def save_uploaded(uploaded: dict) -> None:
    with open(UPLOADED_FILE, "w", encoding="utf-8") as f:
        json.dump(uploaded, f, indent=2, ensure_ascii=False)


# ── Video helpers ─────────────────────────────────────────────────────────────

def find_existing_video(riddle_id: str) -> Path | None:
    out_dir = Path(VIDEO_OUTPUT_FOLDER)
    for path in out_dir.glob(f"riddle_*_{riddle_id}_*.mp4"):
        return path
    return None


def make_output_path(riddle: dict, all_riddles: list[dict]) -> Path:
    out_dir = Path(VIDEO_OUTPUT_FOLDER)
    out_dir.mkdir(parents=True, exist_ok=True)
    try:
        index = next(i for i, r in enumerate(all_riddles) if r["id"] == riddle["id"])
    except StopIteration:
        index = 0
    rid  = riddle.get("id", "unknown")
    import re
    safe = re.sub(r"[^a-zA-Z0-9 _-]", "", riddle["question"])
    safe = safe.strip().replace(" ", "_")[:40]
    return out_dir / f"riddle_{index:04d}_{rid}_{safe}.mp4"


# ── YouTube metadata ──────────────────────────────────────────────────────────

def build_title(riddle: dict) -> str:
    words = riddle["question"].split()[:15]
    short = " ".join(words)
    if len(riddle["question"].split()) > 15:
        short += "..."
    suffix = YT_TITLE_SUFFIX
    max_q  = 100 - len(suffix)
    if len(short) > max_q:
        short = short[:max_q - 1].rstrip() + "\u2026"
    return short + suffix


def build_description(riddle: dict) -> str:
    question = riddle["question"]
    answer   = riddle["answer"]
    return (
        f"🤔 Can you solve this?\n\n"
        f"{question}\n\n"
        f"──────────────────────────────\n"
        f"💡 ANSWER (highlight to reveal):\n"
        f"{answer}\n"
        f"──────────────────────────────\n\n"
        f"Think you got it? Drop your answer in the comments before peeking! 👇\n\n"
        f"Subscribe for a new riddle every day → Riddle Me Shorts\n\n"
        f"#riddle #brainteaser #puzzle #riddleoftheday #shorts #riddlemeshorts"
    )


def upload_video(youtube, video_path: str, riddle: dict, privacy: str,
                 publish_at: str | None = None) -> str:
    """Upload a riddle video to YouTube and return the video ID."""
    from googleapiclient.http import MediaFileUpload

    status_body: dict = {"selfDeclaredMadeForKids": False}
    if publish_at:
        status_body["privacyStatus"] = "private"
        status_body["publishAt"]     = publish_at
    else:
        status_body["privacyStatus"] = privacy

    body = {
        "snippet": {
            "title":       build_title(riddle),
            "description": build_description(riddle),
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

    print(f"  Uploading  : {Path(video_path).name}")
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
        description="Pick riddles, render, and upload to YouTube.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--limit",         type=int,   default=DEFAULT_LIMIT)
    parser.add_argument("--scrape",        action="store_true",
                        help="Re-run scrape_riddles.py before uploading (off by default)")
    parser.add_argument("--privacy",       choices=["private", "unlisted", "public"],
                        default=DEFAULT_PRIVACY)
    parser.add_argument("--delay",         type=int,   default=DEFAULT_DELAY)
    parser.add_argument("--stagger-hours", type=float, default=DEFAULT_STAGGER_HOURS,
                        help="Hours between each scheduled video (default: 1)")
    parser.add_argument("--no-stagger",    action="store_true",
                        help="Upload all videos immediately with no scheduling")
    parser.add_argument("--dry-run",       action="store_true")
    args = parser.parse_args()

    # ── Step 1: Optionally refresh the riddle bank ────────────────────────────
    if args.scrape:
        print("Refreshing riddle bank...")
        result = subprocess.run(
            [sys.executable, "scrape_riddles.py"],
            capture_output=False,
        )
        if result.returncode != 0:
            print("WARNING: scrape_riddles.py failed — using existing bank.\n")
    else:
        print("Using existing riddles.json.\n")

    # ── Step 2: Load bank + upload tracker ───────────────────────────────────
    riddles  = load_riddles()
    uploaded = load_uploaded()

    if not riddles:
        sys.exit("No riddles found. Run scrape_riddles.py first.")

    # ── Step 3: Find unuploaded candidates ───────────────────────────────────
    candidates = [r for r in riddles if r.get("id") not in uploaded]

    if not candidates:
        print("Nothing to do — all riddles have already been uploaded.")
        return

    to_process = candidates[:args.limit]
    print(f"{len(candidates)} unuploaded riddles available. Processing top {len(to_process)}:\n")
    for i, r in enumerate(to_process, 1):
        existing = find_existing_video(r.get("id", ""))
        status   = f"video ready: {existing.name}" if existing else "needs render"
        print(f"  {i}. [{r.get('id','')}] {r['question'][:65]}  ({status})")
    print()

    if args.dry_run:
        print("-- DRY RUN preview --------------------------------------------------")
        run_start = datetime.now(timezone.utc)
        for i, r in enumerate(to_process):
            if args.no_stagger or i == 0:
                sched = "immediate"
            else:
                t = run_start + timedelta(hours=args.stagger_hours * i)
                sched = f"scheduled {t.strftime('%Y-%m-%d %H:%M UTC')} (+{args.stagger_hours * i:.0f}h)"
            print(f"\nTitle      : {build_title(r)}")
            print(f"Question   : {r['question']}")
            print(f"Answer     : {r['answer']}")
            print(f"Publish    : {sched}")
        print("\nDRY RUN - nothing rendered or uploaded.")
        return

    # ── Step 4: Authenticate ─────────────────────────────────────────────────
    youtube   = get_authenticated_service()
    run_start = datetime.now(timezone.utc)

    # ── Step 5: Render + upload ───────────────────────────────────────────────
    for i, riddle in enumerate(to_process):
        print(f"\n{'='*60}")
        print(f"[{i+1}/{len(to_process)}] {riddle['question'][:65]}")
        print(f"{'='*60}")

        video_path = find_existing_video(riddle.get("id", ""))
        if video_path:
            print(f"  Skipping render — using existing: {video_path.name}")
        else:
            video_path = make_output_path(riddle, riddles)
            create_video(
                riddle=riddle,
                output_path=str(video_path),
                music_path=MUSIC_FOLDER,
                music_volume=MUSIC_VOLUME,
            )

        if args.no_stagger or i == 0:
            publish_at = None
            print(f"  Privacy    : {args.privacy} (immediate)")
        else:
            publish_at = (
                run_start + timedelta(hours=args.stagger_hours * i)
            ).strftime("%Y-%m-%dT%H:%M:%S.000Z")
            print(f"  Scheduled  : {publish_at} (+{args.stagger_hours * i:.0f}h)")

        try:
            from googleapiclient.errors import HttpError
            video_id = upload_video(youtube, str(video_path), riddle,
                                    args.privacy, publish_at)
        except Exception as exc:
            print(f"  ERROR: {exc}")
            if hasattr(exc, "status_code") and exc.status_code == 403:
                print("  Quota likely exceeded. Try again tomorrow.")
                break
            raise

        uploaded[riddle["id"]] = {
            "youtube_id":  video_id,
            "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
            "question":    riddle["question"],
            "answer":      riddle["answer"],
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

    total = len(uploaded)
    print(f"\nDone. {total} riddle video(s) uploaded to date.")


if __name__ == "__main__":
    main()
