#!/usr/bin/env python3
"""
upload_youtube.py — Upload rendered nosleep videos to YouTube automatically.

Prerequisites:
  1. Create a project in Google Cloud Console and enable the YouTube Data API v3.
  2. Create OAuth 2.0 credentials (type: Desktop app) and download client_secrets.json.
  3. pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib

Usage:
    python upload_youtube.py              # upload pending videos (up to --limit)
    python upload_youtube.py --limit 3    # upload at most 3 videos this run
    python upload_youtube.py --dry-run    # preview without uploading
    python upload_youtube.py --privacy public   # upload as public immediately
    python upload_youtube.py --delay 30   # seconds to wait between uploads
"""

import argparse
import json
import sys
import time
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

# ── Constants ─────────────────────────────────────────────────────────────────

STORIES_FILE     = "nosleep_stories.json"
VIDEO_OUTPUT_DIR = "video_output"
UPLOADED_FILE    = "uploaded.json"
CLIENT_SECRETS   = "client_secrets.json"
TOKEN_FILE       = "token.json"

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
]

DEFAULT_PRIVACY = "public"
DEFAULT_DELAY   = 10  # seconds between uploads
DEFAULT_LIMIT   = 3   # max uploads per run

YOUTUBE_CATEGORY_ENTERTAINMENT = "24"

TAGS = [
    "nosleep", "horror", "scary stories", "reddit horror",
    "creepy", "horror story", "short horror", "scary reddit",
    "r/nosleep", "bedtime horror", "horror narration",
]

# ── Authentication ─────────────────────────────────────────────────────────────

def get_authenticated_service():
    """
    Authenticate with the YouTube Data API v3.
    On the first run this opens a browser window to authorise your Google account
    and saves a refresh token to token.json.  Subsequent runs are silent.
    """
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
                    "and place it in this directory."
                )
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_FILE, "w", encoding="utf-8") as fh:
            fh.write(creds.to_json())

    return build("youtube", "v3", credentials=creds)

# ── Upload tracking ────────────────────────────────────────────────────────────

def load_uploaded() -> dict:
    """Return the upload log (keyed by Reddit post ID)."""
    if Path(UPLOADED_FILE).exists():
        with open(UPLOADED_FILE, encoding="utf-8") as fh:
            return json.load(fh)
    return {}


def save_uploaded(uploaded: dict) -> None:
    with open(UPLOADED_FILE, "w", encoding="utf-8") as fh:
        json.dump(uploaded, fh, indent=2, ensure_ascii=False)

# ── Metadata helpers ───────────────────────────────────────────────────────────

def build_title(story: dict) -> str:
    """YouTube video title (max 100 chars)."""
    suffix   = " | r/nosleep Horror Story"
    max_body = 100 - len(suffix)
    title    = story["title"]
    if len(title) > max_body:
        title = title[:max_body - 1].rstrip() + "\u2026"
    return title + suffix


def build_description(story: dict) -> str:
    """
    YouTube description with a story preview, author credit, and a link to
    the original Reddit post.
    """
    author  = story["author"]
    url     = story["url"]
    title   = story["title"]

    # First 200 words as a teaser
    words   = story["body"].split()
    preview = " ".join(words[:200])
    if len(words) > 200:
        preview += "\u2026"

    short_url = f"https://redd.it/{story['id']}"

    return (
        f'Original story: \u201c{title}\u201d by u/{author}\n'
        f"{short_url}\n\n"
        f"\u2014\n\n"
        f"{preview}\n\n"
        f"\u2014\n\n"
        f"All stories are used with appreciation for the original authors. "
        f"If you are the author and would like your story removed, please contact us.\n\n"
        f"Subscribe for more bedtime horror stories.\n"
        f"#nosleep #horror #scarystories"
    )

# ── Upload ─────────────────────────────────────────────────────────────────────

def upload_video(youtube, video_path: str, story: dict, privacy: str) -> str:
    """Upload one video using the resumable protocol.  Returns the YouTube video ID."""
    body = {
        "snippet": {
            "title":       build_title(story),
            "description": build_description(story),
            "tags":        TAGS,
            "categoryId":  YOUTUBE_CATEGORY_ENTERTAINMENT,
        },
        "status": {
            "privacyStatus":           privacy,
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(
        video_path,
        mimetype="video/mp4",
        resumable=True,
        chunksize=256 * 1024,  # 256 KB chunks
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
    """
    Locate the rendered .mp4 for a given Reddit post ID.
    Filename format: nosleep_NN_POSTID_SAFETITLE.mp4
    """
    for path in video_dir.glob(f"nosleep_*_{story_id}_*.mp4"):
        return path
    return None

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Upload rendered nosleep videos to YouTube.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--limit", type=int, default=DEFAULT_LIMIT,
        help="Maximum number of videos to upload per run.",
    )
    parser.add_argument(
        "--delay", type=int, default=DEFAULT_DELAY,
        help="Seconds to wait between uploads.",
    )
    parser.add_argument(
        "--privacy", choices=["private", "unlisted", "public"], default=DEFAULT_PRIVACY,
        help="YouTube privacy setting for uploaded videos.",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Preview what would be uploaded without actually uploading.",
    )
    parser.add_argument(
        "--sync", action="store_true",
        help="Query your YouTube channel and add any already-uploaded videos to uploaded.json before uploading new ones.",
    )
    args = parser.parse_args()

    # Load stories
    if not Path(STORIES_FILE).exists():
        sys.exit(f"ERROR: '{STORIES_FILE}' not found.  Run scrape_nosleep.py first.")
    with open(STORIES_FILE, encoding="utf-8") as fh:
        stories = json.load(fh)

    video_dir = Path(VIDEO_OUTPUT_DIR)
    uploaded  = load_uploaded()

    # --sync: fetch channel videos from YouTube and match to stories
    if args.sync:
        print("Syncing uploaded.json with your YouTube channel...")
        youtube      = get_authenticated_service()
        story_by_title = {s["title"]: s for s in stories}
        next_page    = None
        synced       = 0
        while True:
            kwargs = dict(part="snippet", forMine=True, type="video", maxResults=50)
            if next_page:
                kwargs["pageToken"] = next_page
            resp = youtube.search().list(**kwargs).execute()
            for item in resp.get("items", []):
                vid_id    = item["id"]["videoId"]
                yt_title  = item["snippet"]["title"]
                # Strip the suffix we add so we can match back to the story title
                base_title = yt_title.replace(" | r/nosleep Horror Story", "").strip()
                story      = story_by_title.get(base_title)
                if story and story["id"] not in uploaded:
                    uploaded[story["id"]] = {
                        "youtube_id":  vid_id,
                        "youtube_url": f"https://www.youtube.com/watch?v={vid_id}",
                        "title":       story["title"],
                        "author":      story.get("author", ""),
                        "uploaded_at": item["snippet"]["publishedAt"],
                    }
                    print(f"  Synced: [{story['id']}] {base_title}")
                    synced += 1
            next_page = resp.get("nextPageToken")
            if not next_page:
                break
        save_uploaded(uploaded)
        print(f"Sync complete — {synced} new entries added to uploaded.json.\n")

    # Collect stories that are rendered but not yet uploaded, preserving story order
    pending = []
    for story in stories:
        sid = story["id"]
        if sid in uploaded:
            continue
        video_path = find_video_for_story(sid, video_dir)
        if video_path is None:
            continue  # not rendered yet — skip
        pending.append((story, video_path))

    if not pending:
        print("Nothing to upload — all rendered videos have already been uploaded.")
        return

    to_upload = pending[:args.limit]
    print(
        f"Found {len(pending)} pending video(s).  "
        f"Uploading {len(to_upload)} this run (limit: {args.limit}).\n"
    )

    if args.dry_run:
        print("DRY RUN — no uploads will be made.\n")
        for story, path in to_upload:
            print(f"  [{story['id']}] {build_title(story)}")
            print(f"         File   : {path.name}")
            print(f"         Privacy: {args.privacy}")
            print()
        return

    youtube = get_authenticated_service()

    for i, (story, video_path) in enumerate(to_upload):
        print(f"\n[{i + 1}/{len(to_upload)}] {story['title']}")
        try:
            video_id = upload_video(youtube, str(video_path), story, args.privacy)
        except HttpError as exc:
            print(f"  ERROR: {exc}")
            if exc.status_code == 403:
                print("  Quota likely exceeded.  Try again tomorrow or raise your quota limit.")
            break  # stop the run on API errors

        uploaded[story["id"]] = {
            "youtube_id":  video_id,
            "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
            "title":       story["title"],
            "author":      story["author"],
            "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        save_uploaded(uploaded)
        print(f"  Live at: https://www.youtube.com/watch?v={video_id}")

        if i < len(to_upload) - 1:
            print(f"  Waiting {args.delay}s before next upload...")
            time.sleep(args.delay)

    total = sum(1 for v in uploaded.values() if "youtube_id" in v)
    print(f"\nDone.  {total} video(s) uploaded to date.")


if __name__ == "__main__":
    main()
