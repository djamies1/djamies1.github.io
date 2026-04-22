#!/usr/bin/env python3
"""
daily_upload.py — Pick unuploaded trick questions, render videos, upload to YouTube.

Usage:
    python daily_upload.py                   # render & upload 3 questions
    python daily_upload.py --limit 5
    python daily_upload.py --dry-run
    python daily_upload.py --limit 1 --privacy private
    python daily_upload.py --category mandela_effect
"""

import argparse
import json
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

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

_DIR            = Path(__file__).resolve().parent
QUESTIONS_FILE  = str(_DIR / "questions.json")
UPLOADED_FILE   = str(_DIR / "uploaded.json")
DEFAULT_LIMIT         = 3
DEFAULT_STAGGER_HOURS = 4

YT_TITLE_SUFFIX = " | Trick Questions"
YT_TAGS = [
    "trick question", "did you know", "fun facts", "mind blown", "shorts",
    "common misconceptions", "myth busted", "mandela effect", "trivia",
    "general knowledge", "brain teaser", "facts", "you're wrong",
]


# ── Data helpers ───────────────────────────────────────────────────────────────

def load_questions() -> list[dict]:
    p = Path(QUESTIONS_FILE)
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

def find_existing_video(qid: str) -> Path | None:
    for path in Path(VIDEO_OUTPUT_FOLDER).glob(f"tq_*_{qid}_*.mp4"):
        return path
    return None


def make_output_path(question: dict, all_questions: list[dict]) -> Path:
    out_dir = Path(VIDEO_OUTPUT_FOLDER)
    out_dir.mkdir(parents=True, exist_ok=True)
    try:
        index = next(i for i, q in enumerate(all_questions) if q["id"] == question["id"])
    except StopIteration:
        index = 0
    qid  = question.get("id", "unknown")
    safe = re.sub(r"[^a-zA-Z0-9 _-]", "", question["question"])
    safe = safe.strip().replace(" ", "_")[:40]
    return out_dir / f"tq_{index:04d}_{qid}_{safe}.mp4"


# ── YouTube metadata ───────────────────────────────────────────────────────────

def build_title(question: dict) -> str:
    hook   = question.get("hook", "Most people get this wrong!")
    suffix = YT_TITLE_SUFFIX
    max_q  = 100 - len(suffix)
    if len(hook) > max_q:
        hook = hook[:max_q - 1].rstrip() + "\u2026"
    return hook + suffix


def build_description(question: dict) -> str:
    q    = question["question"]
    ans  = question["answer"]
    note = question.get("answer_note", "")
    cat  = question.get("category", "").replace("_", " ").title()

    desc = (
        f"🤔 {q}\n\n"
        f"──────────────────────────────\n"
        f"✅ ANSWER: {ans}\n"
    )
    if note:
        desc += f"\n💡 {note}\n"
    desc += (
        f"──────────────────────────────\n\n"
        f"Drop a 🤯 in the comments if this surprised you!\n\n"
        f"Subscribe for daily facts that will shock you → Trick Questions\n\n"
        f"#{cat.replace(' ', '')} #trickquestion #didyouknow #mindblown "
        f"#funfacts #shorts #trivia #mythbusted"
    )
    return desc


def upload_video(youtube, video_path: str, question: dict, privacy: str,
                 publish_at: str | None = None) -> str:
    from googleapiclient.http import MediaFileUpload

    status_body: dict = {"selfDeclaredMadeForKids": False}
    if publish_at:
        status_body["privacyStatus"] = "private"
        status_body["publishAt"]     = publish_at
    else:
        status_body["privacyStatus"] = privacy

    body = {
        "snippet": {
            "title":       build_title(question),
            "description": build_description(question),
            "tags":        YT_TAGS,
            "categoryId":  "27",  # Education
        },
        "status": status_body,
    }

    media   = MediaFileUpload(video_path, mimetype="video/mp4",
                              resumable=True, chunksize=256 * 1024)
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

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
        description="Pick trick questions, render, and upload to YouTube.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--limit",         type=int,   default=DEFAULT_LIMIT)
    parser.add_argument("--privacy",       choices=["private", "unlisted", "public"],
                        default=DEFAULT_PRIVACY)
    parser.add_argument("--delay",         type=int,   default=DEFAULT_DELAY)
    parser.add_argument("--stagger-hours", type=float, default=DEFAULT_STAGGER_HOURS)
    parser.add_argument("--no-stagger",    action="store_true")
    parser.add_argument("--category",      default=None)
    parser.add_argument("--dry-run",       action="store_true")
    args = parser.parse_args()

    questions = load_questions()
    uploaded  = load_uploaded()

    if not questions:
        sys.exit("No questions found.")

    if args.category:
        questions = [q for q in questions if q.get("category") == args.category]

    candidates  = [q for q in questions if q.get("id") not in uploaded]
    if not candidates:
        print("Nothing to do — all questions uploaded.")
        return

    to_process = candidates[:args.limit]
    print(f"{len(candidates)} unuploaded questions. Processing top {len(to_process)}:\n")
    for i, q in enumerate(to_process, 1):
        existing = find_existing_video(q.get("id", ""))
        status   = f"ready: {existing.name}" if existing else "needs render"
        print(f"  {i}. [{q.get('id','')}] {q['question'][:60]}  ({status})")
    print()

    if args.dry_run:
        print("-- DRY RUN --------------------------------------------------")
        run_start = datetime.now(timezone.utc)
        for i, q in enumerate(to_process):
            sched = "immediate" if (args.no_stagger or i == 0) else \
                f"scheduled {(run_start + timedelta(hours=args.stagger_hours * i)).strftime('%Y-%m-%d %H:%M UTC')}"
            print(f"\nTitle    : {build_title(q)}")
            print(f"Question : {q['question']}")
            print(f"Answer   : {q['answer']}")
            print(f"Publish  : {sched}")
        print("\nDRY RUN — nothing rendered or uploaded.")
        return

    youtube   = get_authenticated_service()
    run_start = datetime.now(timezone.utc)

    for i, question in enumerate(to_process):
        print(f"\n{'='*60}")
        print(f"[{i+1}/{len(to_process)}] {question['question'][:60]}")
        print(f"{'='*60}")

        video_path = find_existing_video(question.get("id", ""))
        if video_path:
            print(f"  Skipping render — using existing: {video_path.name}")
        else:
            video_path = make_output_path(question, questions)
            create_video(question=question, output_path=str(video_path),
                         music_path=MUSIC_FOLDER, music_volume=MUSIC_VOLUME)

        if args.no_stagger or i == 0:
            publish_at = None
            print(f"  Privacy    : {args.privacy} (immediate)")
        else:
            publish_at = (run_start + timedelta(hours=args.stagger_hours * i)
                          ).strftime("%Y-%m-%dT%H:%M:%S.000Z")
            print(f"  Scheduled  : {publish_at}")

        try:
            video_id = upload_video(youtube, str(video_path), question,
                                    args.privacy, publish_at)
        except Exception as exc:
            print(f"  ERROR: {exc}")
            if hasattr(exc, "status_code") and exc.status_code == 403:
                print("  Quota exceeded. Try again tomorrow.")
                break
            raise

        uploaded[question["id"]] = {
            "youtube_id":  video_id,
            "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
            "question":    question["question"],
            "answer":      question["answer"],
            "category":    question.get("category", ""),
            "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            **({  "publish_at": publish_at} if publish_at else {}),
        }
        save_uploaded(uploaded)
        url = f"https://www.youtube.com/watch?v={video_id}"
        print(f"  {'Uploaded (scheduled)' if publish_at else 'Live at'}: {url}")

        if i < len(to_process) - 1:
            print(f"\n  Waiting {args.delay}s...")
            time.sleep(args.delay)

    print(f"\nDone. {len(uploaded)} trick question video(s) uploaded to date.")


if __name__ == "__main__":
    main()
