#!/usr/bin/env python3
"""
upload_youtube.py — Upload rendered Good Vibrations videos to YouTube.

Prerequisites:
  1. Create a project in Google Cloud Console and enable the YouTube Data API v3.
  2. Create OAuth 2.0 credentials (Desktop app) and save as client_secrets.json
     in this folder (good_vibes/).
  3. pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib

Usage:
    python upload_youtube.py                    # upload 3 videos: first now, then +6h, +12h
    python upload_youtube.py --limit 5          # upload up to 5 this run
    python upload_youtube.py --stagger-hours 8  # 8h gaps instead of 6h
    python upload_youtube.py --no-stagger       # upload all immediately
    python upload_youtube.py --dry-run          # preview without uploading
"""

import argparse
import json
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

# ── Constants ─────────────────────────────────────────────────────────────────

STORIES_FILE     = "goodnews_stories.json"
VIDEO_OUTPUT_DIR = "video_output"
UPLOADED_FILE    = "uploaded.json"
CLIENT_SECRETS   = "client_secrets.json"
TOKEN_FILE       = "token.json"

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
]

DEFAULT_PRIVACY       = "public"
DEFAULT_DELAY         = 10    # seconds between uploads
DEFAULT_LIMIT         = 3     # videos per run
DEFAULT_STAGGER_HOURS = 6     # gaps between scheduled videos

YOUTUBE_CATEGORY_PEOPLE_BLOGS = "22"

TAGS = [
    "good news", "uplifting news", "positive news", "hopescrolling",
    "good vibes", "feel good", "happy news", "inspiring", "uplifting",
    "good news today", "positive stories", "shorts",
]

# ── Authentication ─────────────────────────────────────────────────────────────

def get_authenticated_service():
    creds = None
    if Path(TOKEN_FILE).exists():
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not Path(CLIENT_SECRETS).exists():
                sys.exit(
                    f"ERROR: '{CLIENT_SECRETS}' not found.\n"
                    "Download it from Google Cloud Console → APIs & Services → Credentials\n"
                    "and place it in the good_vibes/ folder."
                )
            flow  = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w", encoding="utf-8") as fh:
            fh.write(creds.to_json())
    return build("youtube", "v3", credentials=creds)

# ── Upload tracking ────────────────────────────────────────────────────────────

def load_uploaded() -> dict:
    if Path(UPLOADED_FILE).exists():
        with open(UPLOADED_FILE, encoding="utf-8") as fh:
            return json.load(fh)
    return {}


def save_uploaded(uploaded: dict) -> None:
    with open(UPLOADED_FILE, "w", encoding="utf-8") as fh:
        json.dump(uploaded, fh, indent=2, ensure_ascii=False)

# ── Metadata ───────────────────────────────────────────────────────────────────

def build_title(story: dict) -> str:
    headline = story.get("rewritten_headline") or story["original_headline"]
    suffix   = " ✨ #GoodNews #Shorts"
    max_body = 100 - len(suffix)
    if len(headline) > max_body:
        headline = headline[:max_body - 1].rstrip() + "\u2026"
    return headline + suffix


def build_description(story: dict) -> str:
    headline = story.get("rewritten_headline") or story["original_headline"]
    original = story["original_headline"]
    url      = story["url"]
    source   = story["source"]

    return (
        f"{headline}\n\n"
        f"Full story: {url}\n"
        f"Source: {source}\n\n"
        f"\u2014\n\n"
        f"Original headline: \u201c{original}\u201d\n\n"
        f"Good Vibrations — your daily dose of hopescrolling.\n"
        f"Subscribe for uplifting news every day.\n\n"
        f"#goodnews #uplifting #positivenews #hopescrolling #goodvibes"
    )

# ── Upload ─────────────────────────────────────────────────────────────────────

def upload_video(youtube, video_path: str, story: dict, privacy: str,
                 publish_at: str | None = None) -> str:
    status_body: dict = {"selfDeclaredMadeForKids": False}
    if publish_at:
        status_body["privacyStatus"] = "private"
        status_body["publishAt"]     = publish_at
    else:
        status_body["privacyStatus"] = privacy

    body = {
        "snippet": {
            "title":       build_title(story),
            "description": build_description(story),
            "tags":        TAGS,
            "categoryId":  YOUTUBE_CATEGORY_PEOPLE_BLOGS,
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
            pct = int(status.progress() * 100)
            print(f"    {pct}% ...", end="\r")
    print("    Upload complete.          ")
    return response["id"]

# ── Helpers ────────────────────────────────────────────────────────────────────

def find_video_for_story(story_id: str, video_dir: Path) -> Path | None:
    for path in video_dir.glob(f"goodnews_*_{story_id}_*.mp4"):
        return path
    return None

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Upload Good Vibrations videos to YouTube.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT,
                        help="Max videos to upload per run.")
    parser.add_argument("--delay", type=int, default=DEFAULT_DELAY,
                        help="Seconds to wait between uploads.")
    parser.add_argument("--privacy", choices=["private", "unlisted", "public"],
                        default=DEFAULT_PRIVACY)
    parser.add_argument("--stagger-hours", type=float, default=DEFAULT_STAGGER_HOURS,
                        help="Hours between each scheduled video after the first.")
    parser.add_argument("--no-stagger", action="store_true",
                        help="Upload all videos immediately.")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview without uploading.")
    args = parser.parse_args()

    if not Path(STORIES_FILE).exists():
        sys.exit(f"ERROR: '{STORIES_FILE}' not found. Run scrape_goodnews.py first.")
    with open(STORIES_FILE, encoding="utf-8") as fh:
        stories = json.load(fh)

    video_dir = Path(VIDEO_OUTPUT_DIR)
    uploaded  = load_uploaded()

    # Collect rendered-but-not-uploaded stories in score order
    pending = []
    for story in stories:
        sid = story["id"]
        if sid in uploaded:
            continue
        video_path = find_video_for_story(sid, video_dir)
        if video_path is None:
            continue
        pending.append((story, video_path))

    if not pending:
        print("Nothing to upload — all rendered videos have already been uploaded.")
        return

    to_upload = pending[:args.limit]
    print(
        f"Found {len(pending)} pending video(s). "
        f"Uploading {len(to_upload)} this run (limit: {args.limit}).\n"
    )

    if args.dry_run:
        print("DRY RUN — no uploads will be made.\n")
        for story, path in to_upload:
            print(f"  [{story['id']}] {build_title(story)}")
            print(f"         File: {path.name}")
        return

    youtube   = get_authenticated_service()
    run_start = datetime.now(timezone.utc)

    for i, (story, video_path) in enumerate(to_upload):
        if args.no_stagger or i == 0:
            publish_at = None
        else:
            publish_at = (
                run_start + timedelta(hours=args.stagger_hours * i)
            ).strftime("%Y-%m-%dT%H:%M:%S.000Z")

        headline = story.get("rewritten_headline") or story["original_headline"]
        print(f"\n[{i+1}/{len(to_upload)}] {headline}")
        if publish_at:
            print(f"  Scheduled: {publish_at} (+{args.stagger_hours * i:.0f}h)")
        else:
            print(f"  Privacy  : {args.privacy} (immediate)")

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
            "title":       headline,
            "source":      story["source"],
            "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            **({"publish_at": publish_at} if publish_at else {}),
        }
        save_uploaded(uploaded)

        if publish_at:
            print(f"  Uploaded (scheduled): https://www.youtube.com/watch?v={video_id}")
        else:
            print(f"  Live at: https://www.youtube.com/watch?v={video_id}")

        if i < len(to_upload) - 1:
            print(f"  Waiting {args.delay}s before next upload...")
            time.sleep(args.delay)

    total = len(uploaded)
    print(f"\nDone. {total} video(s) uploaded to date.")


if __name__ == "__main__":
    main()
