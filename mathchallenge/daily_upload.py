#!/usr/bin/env python3
"""
daily_upload.py — Pick unseen math problems, render videos, upload to YouTube.

Reuses upload_youtube.py from the nosleep pipeline for OAuth and upload logic.

Usage:
    python daily_upload.py                   # render & upload 3 problems
    python daily_upload.py --limit 5         # process 5 problems
    python daily_upload.py --dry-run         # preview without rendering/uploading
    python daily_upload.py --limit 1 --privacy private   # test upload
"""

import argparse
import json
import re
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Reuse OAuth + upload logic from nosleep pipeline
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "nosleep"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

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

# ── Config ─────────────────────────────────────────────────────────────────────

_DIR           = Path(__file__).resolve().parent
PROBLEMS_FILE  = str(_DIR / "problems.json")
UPLOADED_FILE  = str(_DIR / "uploaded.json")
DEFAULT_LIMIT         = 3
DEFAULT_STAGGER_HOURS = 4

# YouTube channel branding
YT_TITLE_SUFFIX = " | Math Challenge"
YT_TAGS = [
    "math", "brain teaser", "math puzzle", "can you solve this", "shorts",
    "math challenge", "genius test", "99 percent fail", "riddle", "puzzle",
    "order of operations", "math problem", "trick question",
]


# ── Data helpers ───────────────────────────────────────────────────────────────

def load_problems() -> list[dict]:
    p = Path(PROBLEMS_FILE)
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


# ── Video helpers ──────────────────────────────────────────────────────────────

def find_existing_video(problem_id: str) -> Path | None:
    out_dir = Path(VIDEO_OUTPUT_FOLDER)
    for path in out_dir.glob(f"math_*_{problem_id}_*.mp4"):
        return path
    return None


def make_output_path(problem: dict, all_problems: list[dict]) -> Path:
    out_dir = Path(VIDEO_OUTPUT_FOLDER)
    out_dir.mkdir(parents=True, exist_ok=True)
    try:
        index = next(i for i, p in enumerate(all_problems) if p["id"] == problem["id"])
    except StopIteration:
        index = 0
    pid  = problem.get("id", "unknown")
    safe = re.sub(r"[^a-zA-Z0-9 _-]", "", problem["question"])
    safe = safe.strip().replace(" ", "_")[:40]
    return out_dir / f"math_{index:04d}_{pid}_{safe}.mp4"


# ── YouTube metadata ───────────────────────────────────────────────────────────

def build_title(problem: dict) -> str:
    hook   = problem.get("hook", "Can you solve this?")
    suffix = YT_TITLE_SUFFIX
    max_q  = 100 - len(suffix)
    if len(hook) > max_q:
        hook = hook[:max_q - 1].rstrip() + "\u2026"
    return hook + suffix


def build_description(problem: dict) -> str:
    question = problem["question"]
    answer   = problem["answer"]
    note     = problem.get("answer_note", "")
    category = problem.get("category", "").replace("_", " ").title()

    desc = (
        f"🧠 Think you can crack it?\n\n"
        f"{question}\n\n"
        f"──────────────────────────────\n"
        f"✅ ANSWER:\n"
        f"{answer}\n"
    )
    if note:
        desc += f"\n💡 {note}\n"
    desc += (
        f"──────────────────────────────\n\n"
        f"Drop your answer in the comments before watching to the end! 👇\n\n"
        f"Subscribe for a new brain teaser every day → Math Challenge\n\n"
        f"#{category.replace(' ', '')} #mathchallenge #brainteaser #puzzle "
        f"#canYouSolveThis #shorts #mathproblem #geniustest"
    )
    return desc


def upload_video(youtube, video_path: str, problem: dict, privacy: str,
                 publish_at: str | None = None) -> str:
    """Upload a math challenge video and return the YouTube video ID."""
    from googleapiclient.http import MediaFileUpload

    status_body: dict = {"selfDeclaredMadeForKids": False}
    if publish_at:
        status_body["privacyStatus"] = "private"
        status_body["publishAt"]     = publish_at
    else:
        status_body["privacyStatus"] = privacy

    body = {
        "snippet": {
            "title":       build_title(problem),
            "description": build_description(problem),
            "tags":        YT_TAGS,
            "categoryId":  "27",  # Education
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


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Pick math problems, render, and upload to YouTube.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--limit",         type=int,   default=DEFAULT_LIMIT)
    parser.add_argument("--privacy",       choices=["private", "unlisted", "public"],
                        default=DEFAULT_PRIVACY)
    parser.add_argument("--delay",         type=int,   default=DEFAULT_DELAY)
    parser.add_argument("--stagger-hours", type=float, default=DEFAULT_STAGGER_HOURS)
    parser.add_argument("--no-stagger",    action="store_true")
    parser.add_argument("--category",      default=None,
                        help="Only upload problems of this category")
    parser.add_argument("--dry-run",       action="store_true")
    args = parser.parse_args()

    # Load bank + tracker
    problems = load_problems()
    uploaded = load_uploaded()

    if not problems:
        sys.exit("No problems found. Add problems to problems.json first.")

    # Filter by category if requested
    if args.category:
        problems = [p for p in problems if p.get("category") == args.category]
        if not problems:
            sys.exit(f"No problems found for category '{args.category}'.")

    # Find unuploaded candidates
    candidates = [p for p in problems if p.get("id") not in uploaded]

    if not candidates:
        print("Nothing to do — all problems have already been uploaded.")
        return

    to_process = candidates[:args.limit]
    print(f"{len(candidates)} unuploaded problems available. Processing top {len(to_process)}:\n")
    for i, p in enumerate(to_process, 1):
        existing = find_existing_video(p.get("id", ""))
        status   = f"video ready: {existing.name}" if existing else "needs render"
        print(f"  {i}. [{p.get('id','')}] {p['question'][:60]}  ({status})")
    print()

    if args.dry_run:
        print("-- DRY RUN --------------------------------------------------")
        run_start = datetime.now(timezone.utc)
        for i, p in enumerate(to_process):
            if args.no_stagger or i == 0:
                sched = "immediate"
            else:
                t = run_start + timedelta(hours=args.stagger_hours * i)
                sched = f"scheduled {t.strftime('%Y-%m-%d %H:%M UTC')}"
            print(f"\nTitle      : {build_title(p)}")
            print(f"Question   : {p['question']}")
            print(f"Answer     : {p['answer']}")
            print(f"Category   : {p.get('category', '')}")
            print(f"Publish    : {sched}")
        print("\nDRY RUN — nothing rendered or uploaded.")
        return

    # Authenticate
    youtube   = get_authenticated_service()
    run_start = datetime.now(timezone.utc)

    # Render + upload
    for i, problem in enumerate(to_process):
        print(f"\n{'='*60}")
        print(f"[{i+1}/{len(to_process)}] {problem['question'][:60]}")
        print(f"{'='*60}")

        video_path = find_existing_video(problem.get("id", ""))
        if video_path:
            print(f"  Skipping render — using existing: {video_path.name}")
        else:
            video_path = make_output_path(problem, problems)
            create_video(
                problem=problem,
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
            video_id = upload_video(youtube, str(video_path), problem,
                                    args.privacy, publish_at)
        except Exception as exc:
            print(f"  ERROR: {exc}")
            if hasattr(exc, "status_code") and exc.status_code == 403:
                print("  Quota likely exceeded. Try again tomorrow.")
                break
            raise

        uploaded[problem["id"]] = {
            "youtube_id":  video_id,
            "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
            "question":    problem["question"],
            "answer":      problem["answer"],
            "category":    problem.get("category", ""),
            "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            **({  "publish_at": publish_at} if publish_at else {}),
        }
        save_uploaded(uploaded)

        url = f"https://www.youtube.com/watch?v={video_id}"
        if publish_at:
            print(f"  Uploaded (scheduled): {url}")
        else:
            print(f"  Live at: {url}")

        if i < len(to_process) - 1:
            print(f"\n  Waiting {args.delay}s before next upload...")
            time.sleep(args.delay)

    total = len(uploaded)
    print(f"\nDone. {total} math challenge video(s) uploaded to date.")


if __name__ == "__main__":
    main()
