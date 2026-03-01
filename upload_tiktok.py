#!/usr/bin/env python3
"""
upload_tiktok.py — Upload rendered nosleep videos to TikTok automatically.

Prerequisites:
  1. Create a developer account at https://developers.tiktok.com
  2. Create an app and request access to the "Content Posting API"
  3. Under your app settings, add redirect URI: http://localhost:8080/callback
  4. Note your Client Key and Client Secret
  5. Create tiktok_creds.json in this folder:
       {"client_key": "YOUR_CLIENT_KEY", "client_secret": "YOUR_CLIENT_SECRET"}

Usage:
    python upload_tiktok.py              # upload pending videos (up to --limit)
    python upload_tiktok.py --limit 3    # upload at most 3 videos this run
    python upload_tiktok.py --dry-run    # preview without uploading
    python upload_tiktok.py --privacy PUBLIC_TO_EVERYONE
"""

import argparse
import base64
import hashlib
import http.server
import json
import secrets
import sys
import threading
import time
import webbrowser
from pathlib import Path
from urllib.parse import urlencode, parse_qs, urlparse

import requests

# ── Constants ─────────────────────────────────────────────────────────────────

STORIES_FILE     = "nosleep_stories.json"
VIDEO_OUTPUT_DIR = "video_output"
UPLOADED_FILE    = "uploaded_tiktok.json"
CREDS_FILE       = "tiktok_creds.json"
TOKEN_FILE       = "tiktok_token.json"

AUTH_URL      = "https://www.tiktok.com/v2/auth/authorize/"
TOKEN_URL     = "https://open.tiktokapis.com/v2/oauth/token/"
POST_INIT_URL = "https://open.tiktokapis.com/v2/post/video/init/"
STATUS_URL    = "https://open.tiktokapis.com/v2/post/publish/status/fetch/"

REDIRECT_URI = "http://localhost:8080/callback"
SCOPES       = "video.publish,video.upload"

# "SELF_ONLY" = draft visible only to you — safe default so you can review first
DEFAULT_PRIVACY = "SELF_ONLY"
DEFAULT_LIMIT   = 3
DEFAULT_DELAY   = 10

CHUNK_SIZE = 10 * 1024 * 1024  # 10 MB per chunk

# ── Credentials ───────────────────────────────────────────────────────────────

def load_creds() -> dict:
    if not Path(CREDS_FILE).exists():
        sys.exit(
            f"ERROR: '{CREDS_FILE}' not found.\n"
            "Create it with your TikTok app credentials:\n"
            '  {"client_key": "YOUR_CLIENT_KEY", "client_secret": "YOUR_CLIENT_SECRET"}'
        )
    with open(CREDS_FILE, encoding="utf-8") as fh:
        return json.load(fh)

# ── OAuth (PKCE) ──────────────────────────────────────────────────────────────

def _pkce_pair() -> tuple[str, str]:
    """Generate a PKCE code_verifier and code_challenge."""
    verifier  = secrets.token_urlsafe(64)
    digest    = hashlib.sha256(verifier.encode()).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return verifier, challenge


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
            pass  # suppress server logs

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


def _refresh_token(creds: dict, token: dict) -> dict:
    resp = requests.post(TOKEN_URL, data={
        "client_key":    creds["client_key"],
        "client_secret": creds["client_secret"],
        "grant_type":    "refresh_token",
        "refresh_token": token["refresh_token"],
    })
    resp.raise_for_status()
    new_token = resp.json()["data"]
    new_token["_fetched_at"] = time.time()
    save_token(new_token)
    return new_token


def get_access_token() -> str:
    """Return a valid TikTok access token, refreshing or re-authing as needed."""
    creds = load_creds()
    token = load_token()

    if token:
        expires_at = token.get("_fetched_at", 0) + token.get("expires_in", 0)
        if expires_at - time.time() > 300:  # valid for at least 5 more minutes
            return token["access_token"]
        try:
            return _refresh_token(creds, token)["access_token"]
        except Exception:
            pass  # fall through to full re-auth

    # Full PKCE auth flow
    verifier, challenge = _pkce_pair()
    params = {
        "client_key":            creds["client_key"],
        "response_type":         "code",
        "scope":                 SCOPES,
        "redirect_uri":          REDIRECT_URI,
        "state":                 secrets.token_hex(8),
        "code_challenge":        challenge,
        "code_challenge_method": "S256",
    }
    print("Opening TikTok login in your browser...")
    webbrowser.open(AUTH_URL + "?" + urlencode(params))

    callback_path = _capture_callback()
    qs   = parse_qs(urlparse(callback_path).query)
    code = qs["code"][0]

    resp = requests.post(TOKEN_URL, data={
        "client_key":    creds["client_key"],
        "client_secret": creds["client_secret"],
        "code":          code,
        "grant_type":    "authorization_code",
        "redirect_uri":  REDIRECT_URI,
        "code_verifier": verifier,
    })
    resp.raise_for_status()
    token = resp.json()["data"]
    token["_fetched_at"] = time.time()
    save_token(token)
    return token["access_token"]

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
    """TikTok caption (max 2,200 chars)."""
    return (
        f'"{story["title"]}" by u/{story["author"]}\n'
        f"Source: https://redd.it/{story['id']}\n\n"
        f"#nosleep #horror #scarystories #reddit #creepy #horrortok #horrorstories"
    )

# ── Upload ─────────────────────────────────────────────────────────────────────

def upload_video(access_token: str, video_path: str, story: dict, privacy: str) -> str:
    """Upload a video to TikTok via the Content Posting API. Returns the publish_id."""
    size        = Path(video_path).stat().st_size
    chunk_count = (size + CHUNK_SIZE - 1) // CHUNK_SIZE
    headers     = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type":  "application/json; charset=UTF-8",
    }

    # Step 1: Initialise the post
    init_resp = requests.post(POST_INIT_URL, headers=headers, json={
        "post_info": {
            "title":                    story["title"][:150],
            "privacy_level":            privacy,
            "disable_duet":             False,
            "disable_comment":          False,
            "disable_stitch":           False,
            "video_cover_timestamp_ms": 1000,
        },
        "source_info": {
            "source":            "FILE_UPLOAD",
            "video_size":        size,
            "chunk_size":        CHUNK_SIZE,
            "total_chunk_count": chunk_count,
        },
    })
    init_resp.raise_for_status()
    data       = init_resp.json()["data"]
    publish_id = data["publish_id"]
    upload_url = data["upload_url"]

    # Step 2: Upload in chunks
    print(f"  Uploading: {Path(video_path).name}")
    with open(video_path, "rb") as fh:
        for i in range(chunk_count):
            chunk = fh.read(CHUNK_SIZE)
            start = i * CHUNK_SIZE
            end   = start + len(chunk) - 1
            resp  = requests.put(
                upload_url,
                data=chunk,
                headers={
                    "Content-Type":   "video/mp4",
                    "Content-Range":  f"bytes {start}-{end}/{size}",
                    "Content-Length": str(len(chunk)),
                },
            )
            resp.raise_for_status()
            pct = int((i + 1) / chunk_count * 100)
            print(f"    {pct}% ...", end="\r")
    print("    Upload complete.          ")

    # Step 3: Poll until processing finishes
    print("  Processing...", end="\r")
    for _ in range(30):
        time.sleep(5)
        status_resp = requests.post(
            STATUS_URL,
            headers=headers,
            json={"publish_id": publish_id},
        )
        status = status_resp.json().get("data", {}).get("status", "PROCESSING")
        if status in ("PUBLISH_COMPLETE", "PUBLISH_FAILED"):
            break
    print(f"  Status: {status}          ")

    if status == "PUBLISH_FAILED":
        raise RuntimeError(f"TikTok publish failed for publish_id={publish_id}")

    return publish_id

# ── Helpers ────────────────────────────────────────────────────────────────────

def find_video_for_story(story_id: str, video_dir: Path) -> Path | None:
    for path in video_dir.glob(f"nosleep_*_{story_id}_*.mp4"):
        return path
    return None

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Upload rendered nosleep videos to TikTok.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--limit",   type=int, default=DEFAULT_LIMIT,
                        help="Maximum number of videos to upload per run.")
    parser.add_argument("--delay",   type=int, default=DEFAULT_DELAY,
                        help="Seconds to wait between uploads.")
    parser.add_argument("--privacy", default=DEFAULT_PRIVACY,
                        choices=["SELF_ONLY", "FOLLOWER_OF_CREATOR",
                                 "MUTUAL_FOLLOW_FRIENDS", "PUBLIC_TO_EVERYONE"],
                        help="TikTok visibility setting for uploaded videos.")
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
    for story in stories:
        sid = story["id"]
        if sid in uploaded:
            continue
        video_path = find_video_for_story(sid, video_dir)
        if video_path is None:
            continue
        pending.append((story, video_path))

    if not pending:
        print("Nothing to upload — all rendered videos have already been uploaded to TikTok.")
        return

    to_upload = pending[:args.limit]
    print(f"Found {len(pending)} pending video(s).  Uploading {len(to_upload)} (limit: {args.limit}).\n")

    if args.dry_run:
        print("DRY RUN — no uploads will be made.\n")
        for story, path in to_upload:
            print(f"  [{story['id']}] {story['title']}")
            print(f"         File   : {path.name}")
            print(f"         Privacy: {args.privacy}\n")
        return

    access_token = get_access_token()

    for i, (story, video_path) in enumerate(to_upload):
        print(f"\n[{i + 1}/{len(to_upload)}] {story['title']}")
        try:
            publish_id = upload_video(access_token, str(video_path), story, args.privacy)
        except (requests.HTTPError, RuntimeError) as exc:
            print(f"  ERROR: {exc}")
            break

        uploaded[story["id"]] = {
            "tiktok_publish_id": publish_id,
            "title":             story["title"],
            "author":            story["author"],
            "uploaded_at":       time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        save_uploaded(uploaded)
        print(f"  Done (publish_id: {publish_id})")

        if i < len(to_upload) - 1:
            print(f"  Waiting {args.delay}s before next upload...")
            time.sleep(args.delay)

    print(f"\nDone.  {len(uploaded)} total video(s) uploaded to TikTok.")


if __name__ == "__main__":
    main()
