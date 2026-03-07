#!/usr/bin/env python3
"""
upload_instagram.py — Upload rendered nosleep videos to Instagram Reels automatically.

Prerequisites:
  See SOCIAL_MEDIA_SETUP.md for full step-by-step instructions.

  Short version:
  1. Create a Meta Developer app with Instagram content publishing permissions.
  2. Connect a Business/Creator Instagram account to a Facebook Page.
  3. Create instagram_creds.json: {"app_id": "...", "app_secret": "..."}
  4. Run once to authenticate — browser will open for Facebook Login.

Usage:
    python upload_instagram.py           # upload 1 pending video
    python upload_instagram.py --dry-run # preview without uploading
"""

import argparse
import http.server
import json
import re
import subprocess
import sys
import tempfile
import time
import webbrowser
from pathlib import Path
from urllib.parse import urlencode, parse_qs, urlparse

import imageio_ffmpeg
import requests

# ── Constants ─────────────────────────────────────────────────────────────────

STORIES_FILE     = "nosleep_stories.json"
VIDEO_OUTPUT_DIR = "video_output"
UPLOADED_FILE    = "uploaded_instagram.json"
CREDS_FILE       = "instagram_creds.json"
TOKEN_FILE       = "instagram_token.json"

GRAPH_BASE   = "https://graph.facebook.com/v21.0"
AUTH_URL     = "https://www.facebook.com/v21.0/dialog/oauth"
TOKEN_URL    = f"{GRAPH_BASE}/oauth/access_token"
REDIRECT_URI = "http://localhost:8080/callback"

# Permissions needed for content publishing
SCOPES = "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement"

MAX_REEL_DURATION  = 60   # empirical safe limit for Reels via the Content Publishing API
MAX_REEL_SIZE_MB   = 7.5  # empirical safe file size limit (dev mode appears to cap at ~8 MB)

CHUNK_SIZE = 5 * 1024 * 1024  # 5 MB per chunk

# ── Credentials ───────────────────────────────────────────────────────────────

def load_creds() -> dict:
    if not Path(CREDS_FILE).exists():
        sys.exit(
            f"ERROR: '{CREDS_FILE}' not found.\n"
            "Create it with your Meta app credentials:\n"
            '  {"app_id": "YOUR_APP_ID", "app_secret": "YOUR_APP_SECRET"}\n'
            "See SOCIAL_MEDIA_SETUP.md for instructions."
        )
    with open(CREDS_FILE, encoding="utf-8") as fh:
        return json.load(fh)

# ── OAuth ─────────────────────────────────────────────────────────────────────

def _capture_callback() -> str:
    """Start a one-shot local HTTP server and return the OAuth callback path."""
    result = {}

    class _Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            result["path"] = self.path
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Authorised! You can close this tab.")

        def log_message(self, *args):
            pass

    server = http.server.HTTPServer(("localhost", 8080), _Handler)
    server.handle_request()
    return result["path"]


def load_token() -> dict | None:
    if Path(TOKEN_FILE).exists():
        with open(TOKEN_FILE, encoding="utf-8") as fh:
            return json.load(fh)
    return None


def save_token(token: dict) -> None:
    with open(TOKEN_FILE, "w", encoding="utf-8") as fh:
        json.dump(token, fh, indent=2)


def _exchange_for_long_lived(creds: dict, short_token: str) -> dict:
    """Exchange a short-lived token for a long-lived one (valid ~60 days)."""
    resp = requests.get(TOKEN_URL, params={
        "grant_type":        "fb_exchange_token",
        "client_id":         creds["app_id"],
        "client_secret":     creds["app_secret"],
        "fb_exchange_token": short_token,
    })
    resp.raise_for_status()
    data = resp.json()
    data["_fetched_at"] = time.time()
    return data


def _refresh_token(creds: dict, token: dict) -> dict:
    """Refresh a long-lived token before it expires."""
    return _exchange_for_long_lived(creds, token["access_token"])


def _find_ig_user_id(access_token: str, creds: dict) -> str:
    """Get the Instagram Business Account ID, using ig_user_id from creds if set."""
    if creds.get("ig_user_id"):
        print(f"  Using Instagram User ID from credentials: {creds['ig_user_id']}")
        return creds["ig_user_id"]

    pages_resp = requests.get(f"{GRAPH_BASE}/me/accounts", params={
        "access_token": access_token,
        "fields":       "id,name",
    })
    pages_resp.raise_for_status()
    pages = pages_resp.json().get("data", [])

    for page in pages:
        ig_resp = requests.get(f"{GRAPH_BASE}/{page['id']}", params={
            "fields":       "instagram_business_account",
            "access_token": access_token,
        })
        ig_resp.raise_for_status()
        ig_data = ig_resp.json().get("instagram_business_account")
        if ig_data:
            print(f"  Found Instagram account (ID: {ig_data['id']}) via Page: {page['name']}")
            return ig_data["id"]

    raise RuntimeError(
        "Could not auto-detect Instagram User ID.\n"
        "Add your Instagram Business Account ID to instagram_creds.json:\n"
        '  {"app_id": "...", "app_secret": "...", "ig_user_id": "YOUR_ID"}'
    )


def get_access_token() -> tuple[str, str]:
    """
    Return a valid (access_token, ig_user_id) pair.
    Refreshes the token automatically if it's close to expiring.
    Opens a browser for the full OAuth flow if no token exists.
    """
    creds = load_creds()
    token = load_token()

    if token:
        # Long-lived tokens last 60 days. Refresh if fewer than 7 days remain.
        expires_at = token.get("_fetched_at", 0) + token.get("expires_in", 0)
        if expires_at - time.time() < 7 * 24 * 3600:
            print("Refreshing Instagram access token...")
            token = _refresh_token(creds, token)
            save_token(token)
        return token["access_token"], token["ig_user_id"]

    # Full OAuth flow
    params = {
        "client_id":     creds["app_id"],
        "redirect_uri":  REDIRECT_URI,
        "scope":         SCOPES,
        "response_type": "code",
    }
    print("Opening Facebook Login in your browser...")
    webbrowser.open(AUTH_URL + "?" + urlencode(params))

    callback_path = _capture_callback()
    qs   = parse_qs(urlparse(callback_path).query)
    code = qs["code"][0]

    # Exchange code for short-lived token
    short_resp = requests.get(TOKEN_URL, params={
        "client_id":     creds["app_id"],
        "client_secret": creds["app_secret"],
        "redirect_uri":  REDIRECT_URI,
        "code":          code,
    })
    short_resp.raise_for_status()
    short_token = short_resp.json()["access_token"]

    # Exchange for long-lived token
    token = _exchange_for_long_lived(creds, short_token)

    # Auto-detect Instagram User ID and store it with the token
    print("Detecting your Instagram User ID...")
    token["ig_user_id"] = _find_ig_user_id(token["access_token"], creds)
    save_token(token)

    return token["access_token"], token["ig_user_id"]

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

def build_caption(story: dict) -> str:
    """Instagram caption (max 2,200 chars)."""
    return (
        f'"{story["title"]}" by u/{story["author"]}\n'
        f"Source: https://redd.it/{story['id']}\n\n"
        f"#nosleep #horror #scarystories #reddit #creepy #horrorstories #reels #instagramhorror"
    )

# ── Upload ─────────────────────────────────────────────────────────────────────

def remux_faststart(video_path: str) -> str:
    """Remux an MP4 to move the moov atom to the start (required by Instagram).
    Returns the path to a temporary faststart file."""
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
    tmp.close()
    subprocess.run(
        [ffmpeg, "-y", "-i", video_path, "-c", "copy", "-movflags", "+faststart", tmp.name],
        check=True, capture_output=True,
    )
    return tmp.name


def upload_video(access_token: str, ig_user_id: str, video_path: str, story: dict) -> str:
    """
    Upload a video as an Instagram Reel using the resumable upload protocol.
    Returns the published media ID.
    """
    print("  Remuxing for faststart...")
    faststart_path = remux_faststart(video_path)
    try:
        return _upload_video_inner(access_token, ig_user_id, faststart_path, story)
    finally:
        Path(faststart_path).unlink(missing_ok=True)


def _upload_video_inner(access_token: str, ig_user_id: str, video_path: str, story: dict) -> str:
    size = Path(video_path).stat().st_size

    # Step 1: Create a media container
    container_resp = requests.post(
        f"{GRAPH_BASE}/{ig_user_id}/media",
        data={
            "media_type":   "REELS",
            "upload_type":  "resumable",
            "caption":      build_caption(story),
            "access_token": access_token,
        },
    )
    if not container_resp.ok:
        sys.exit(f"ERROR {container_resp.status_code}: {container_resp.text}")
    container_data = container_resp.json()
    container_id   = container_data["id"]
    upload_uri     = container_data["uri"]

    # Step 2: Upload the video file in chunks
    print(f"  Uploading: {Path(video_path).name}")
    chunk_count = (size + CHUNK_SIZE - 1) // CHUNK_SIZE
    with open(video_path, "rb") as fh:
        for i in range(chunk_count):
            chunk  = fh.read(CHUNK_SIZE)
            offset = i * CHUNK_SIZE
            resp   = requests.post(
                upload_uri,
                data=chunk,
                params={"access_token": access_token},
                headers={
                    "Content-Type":   "video/mp4",
                    "Content-Length": str(len(chunk)),
                    "file_size":      str(size),
                    "offset":         str(offset),
                },
            )
            if not resp.ok:
                sys.exit(f"ERROR {resp.status_code} on chunk {i}: {resp.text}")
            pct = int((i + 1) / chunk_count * 100)
            print(f"    {pct}% ...", end="\r")
    print("    Upload complete.          ")

    # Step 3: Poll until Instagram finishes processing the video
    print("  Processing...", end="\r")
    status_code = "IN_PROGRESS"
    for _ in range(30):
        time.sleep(5)
        status_resp = requests.get(
            f"{GRAPH_BASE}/{container_id}",
            params={"fields": "status_code", "access_token": access_token},
        )
        status_resp.raise_for_status()
        status_code = status_resp.json().get("status_code", "IN_PROGRESS")
        if status_code in ("FINISHED", "ERROR", "EXPIRED"):
            break
    print(f"  Status: {status_code}          ")

    if status_code != "FINISHED":
        raise RuntimeError(f"Instagram video processing failed: {status_code}")

    # Step 4: Publish the container as a Reel
    publish_resp = requests.post(
        f"{GRAPH_BASE}/{ig_user_id}/media_publish",
        data={
            "creation_id":  container_id,
            "access_token": access_token,
        },
    )
    publish_resp.raise_for_status()
    return publish_resp.json()["id"]

# ── Helpers ────────────────────────────────────────────────────────────────────

def get_video_duration(video_path: str) -> float:
    """Return video duration in seconds by parsing ffmpeg output."""
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    result = subprocess.run([ffmpeg, "-i", video_path], capture_output=True, text=True)
    match = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", result.stderr)
    if match:
        h, m, s = int(match.group(1)), int(match.group(2)), float(match.group(3))
        return h * 3600 + m * 60 + s
    return 0.0


def find_video_for_story(story_id: str, video_dir: Path) -> Path | None:
    for path in video_dir.glob(f"nosleep_*_{story_id}_*.mp4"):
        return path
    return None

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Upload one rendered nosleep video to Instagram Reels.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview what would be uploaded without actually uploading.")
    args = parser.parse_args()

    if not Path(STORIES_FILE).exists():
        sys.exit(f"ERROR: '{STORIES_FILE}' not found.  Run scrape_nosleep.py first.")
    with open(STORIES_FILE, encoding="utf-8") as fh:
        stories = json.load(fh)

    video_dir = Path(VIDEO_OUTPUT_DIR)
    uploaded  = load_uploaded()

    pending = []
    skipped_long = 0
    for story in stories:
        sid = story["id"]
        if sid in uploaded:
            continue
        video_path = find_video_for_story(sid, video_dir)
        if video_path is None:
            continue
        duration = get_video_duration(str(video_path))
        size_mb  = video_path.stat().st_size / (1024 * 1024)
        if duration > MAX_REEL_DURATION or size_mb > MAX_REEL_SIZE_MB:
            skipped_long += 1
            continue
        pending.append((story, video_path))

    if skipped_long:
        print(f"Skipped {skipped_long} video(s) exceeding {MAX_REEL_DURATION}s or {MAX_REEL_SIZE_MB}MB (not eligible for Reels via API).\n")

    if not pending:
        print("Nothing to upload — all rendered videos have already been uploaded to Instagram.")
        return

    story, video_path = pending[0]
    print(f"Found {len(pending)} pending video(s).  Uploading next: {story['title']}\n")

    if args.dry_run:
        print("DRY RUN — no upload will be made.")
        print(f"  [{story['id']}] {story['title']}")
        print(f"  File: {video_path.name}")
        return

    access_token, ig_user_id = get_access_token()

    try:
        media_id = upload_video(access_token, ig_user_id, str(video_path), story)
    except (requests.HTTPError, RuntimeError) as exc:
        sys.exit(f"  ERROR: {exc}")

    uploaded[story["id"]] = {
        "instagram_media_id": media_id,
        "title":              story["title"],
        "author":             story["author"],
        "uploaded_at":        time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    save_uploaded(uploaded)
    print(f"  Done (media_id: {media_id})")
    print(f"\nDone.  {len(uploaded)} total video(s) uploaded to Instagram.")


if __name__ == "__main__":
    main()
