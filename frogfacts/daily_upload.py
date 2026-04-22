#!/usr/bin/env python3
"""daily_upload.py — Pick frog facts, render videos, upload to YouTube."""

import argparse, json, re, sys, time
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "nosleep"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from upload_youtube import get_authenticated_service, DEFAULT_DELAY, DEFAULT_PRIVACY
from make_video import create_video, VIDEO_OUTPUT_FOLDER, MUSIC_FOLDER, MUSIC_VOLUME

_DIR          = Path(__file__).resolve().parent
FACTS_FILE    = str(_DIR / "facts.json")
UPLOADED_FILE = str(_DIR / "uploaded.json")

DEFAULT_LIMIT = 3
YT_SUFFIX     = " | Frog Facts"
YT_TAGS       = [
    "frog facts", "frog", "frogs", "amphibians", "animal facts",
    "did you know", "fun facts", "shorts", "nature", "wildlife",
    "science facts", "amazing facts",
]


def load_facts():
    p = Path(FACTS_FILE)
    return json.load(open(p, encoding="utf-8")) if p.exists() else []


def load_uploaded():
    p = Path(UPLOADED_FILE)
    return json.load(open(p, encoding="utf-8")) if p.exists() else {}


def save_uploaded(u):
    json.dump(u, open(UPLOADED_FILE, "w", encoding="utf-8"), indent=2, ensure_ascii=False)


def find_video(fid: str):
    for p in Path(VIDEO_OUTPUT_FOLDER).glob(f"frog_*_{fid}_*.mp4"):
        return p
    return None


def make_path(fact: dict, all_facts: list) -> Path:
    out = Path(VIDEO_OUTPUT_FOLDER)
    out.mkdir(parents=True, exist_ok=True)
    try:
        idx = next(i for i, f in enumerate(all_facts) if f["id"] == fact["id"])
    except StopIteration:
        idx = 0
    safe = re.sub(r"[^a-zA-Z0-9 _-]", "", fact["fact"]).strip().replace(" ", "_")[:35]
    return out / f"frog_{idx:04d}_{fact.get('id', 'x')}_{safe}.mp4"


def build_title(fact: dict) -> str:
    # Use first ~8 words of the fact as the title snippet
    words   = fact["fact"].split()
    snippet = " ".join(words[:8])
    if len(words) > 8:
        snippet += "..."
    suf = YT_SUFFIX
    return (snippet[: 100 - len(suf)] + suf)[:100]


def build_desc(fact: dict) -> str:
    return (
        f"🐸 {fact['fact']}\n\n"
        f"─────────────────────────────\n"
        f"Subscribe for more FROG FACTS! 🐸\n\n"
        f"🎵 Music by @eddie.ewi\n"
        f"https://linktr.ee/eddie.ewi\n\n"
        f"#frogfacts #frogs #amphibians #shorts #funfacts #wildlife #nature #animals"
    )


def upload(yt, path: str, fact: dict, privacy: str, publish_at=None):
    from googleapiclient.http import MediaFileUpload
    sb = {
        "selfDeclaredMadeForKids": False,
        "privacyStatus": "private" if publish_at else privacy,
    }
    if publish_at:
        sb["publishAt"] = publish_at
    body = {
        "snippet": {
            "title":       build_title(fact),
            "description": build_desc(fact),
            "tags":        YT_TAGS,
            "categoryId":  "15",   # Pets & Animals
        },
        "status": sb,
    }
    media = MediaFileUpload(path, mimetype="video/mp4", resumable=True, chunksize=256 * 1024)
    req   = yt.videos().insert(part="snippet,status", body=body, media_body=media)
    print(f"  Uploading  : {Path(path).name}")
    resp = None
    while resp is None:
        st, resp = req.next_chunk()
        if st:
            print(f"    {int(st.progress() * 100)}% ...", end="\r")
    print("    Upload complete.          ")
    return resp["id"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit",         type=int,   default=DEFAULT_LIMIT)
    ap.add_argument("--privacy",       choices=["private", "unlisted", "public"],
                                       default=DEFAULT_PRIVACY)
    ap.add_argument("--delay",         type=int,   default=DEFAULT_DELAY)
    ap.add_argument("--stagger-hours", type=float, default=4)
    ap.add_argument("--no-stagger",    action="store_true")
    ap.add_argument("--dry-run",       action="store_true")
    args = ap.parse_args()

    facts    = load_facts()
    uploaded = load_uploaded()

    if not facts:
        sys.exit("No facts found — run scrape_facts.py first.")

    candidates = [f for f in facts if f.get("id") not in uploaded]
    if not candidates:
        print("Nothing to upload — all facts already uploaded.")
        return

    to_do = candidates[: args.limit]
    print(f"{len(candidates)} unuploaded facts. Processing {len(to_do)}:\n")
    for i, f in enumerate(to_do, 1):
        print(f"  {i}. {f['fact'][:75]}")
    print()

    if args.dry_run:
        for f in to_do:
            print(f"\nTitle : {build_title(f)}")
            print(f"Fact  : {f['fact']}")
        print("\nDRY RUN — nothing uploaded.")
        return

    yt = get_authenticated_service()
    t0 = datetime.now(timezone.utc)

    for i, fact in enumerate(to_do):
        print(f"\n{'=' * 55}")
        print(f"[{i + 1}/{len(to_do)}] {fact['fact'][:55]}")
        print("=" * 55)

        vp = find_video(fact.get("id", ""))
        if vp:
            print(f"  Skipping render — {vp.name}")
        else:
            vp = make_path(fact, facts)
            create_video(fact, str(vp), MUSIC_FOLDER, MUSIC_VOLUME)

        pub = (
            None
            if (args.no_stagger or i == 0)
            else (t0 + timedelta(hours=args.stagger_hours * i)).strftime(
                "%Y-%m-%dT%H:%M:%S.000Z"
            )
        )

        try:
            vid = upload(yt, str(vp), fact, args.privacy, pub)
        except Exception as e:
            print(f"  ERROR: {e}")
            if getattr(e, "status_code", None) == 403:
                print("  Quota exceeded — stopping.")
                break
            raise

        uploaded[fact["id"]] = {
            "youtube_id":  vid,
            "youtube_url": f"https://www.youtube.com/watch?v={vid}",
            "fact":        fact["fact"],
            "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            **({"publish_at": pub} if pub else {}),
        }
        save_uploaded(uploaded)

        status = "Scheduled" if pub else "Live"
        print(f"  {status}: https://www.youtube.com/watch?v={vid}")

        if i < len(to_do) - 1:
            print(f"  Waiting {args.delay}s...")
            time.sleep(args.delay)

    print(f"\nDone. {len(uploaded)} frog fact video(s) total.")


if __name__ == "__main__":
    main()
