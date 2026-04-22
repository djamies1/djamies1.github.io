#!/usr/bin/env python3
"""
daily_upload.py — Pick Mandela Effect questions, render, upload to YouTube.

Usage:
    python daily_upload.py
    python daily_upload.py --dry-run
    python daily_upload.py --limit 1 --privacy private
"""

import argparse, json, re, sys, time
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "nosleep"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from upload_youtube import get_authenticated_service, DEFAULT_DELAY, DEFAULT_PRIVACY
from make_video import create_video, VIDEO_OUTPUT_FOLDER, MUSIC_FOLDER, MUSIC_VOLUME

_DIR           = Path(__file__).resolve().parent
QUESTIONS_FILE = str(_DIR / "questions.json")
UPLOADED_FILE  = str(_DIR / "uploaded.json")
DEFAULT_LIMIT  = 3
YT_SUFFIX      = " | Mandela Effect"
YT_TAGS        = ["mandela effect","false memory","do you remember","shorts","mind blown",
                   "memory glitch","did you know","myth busted","trivia","you're wrong"]

def load_q(): return json.load(open(QUESTIONS_FILE, encoding="utf-8")) if Path(QUESTIONS_FILE).exists() else []
def load_u(): return json.load(open(UPLOADED_FILE, encoding="utf-8")) if Path(UPLOADED_FILE).exists() else {}
def save_u(u): json.dump(u, open(UPLOADED_FILE,"w",encoding="utf-8"), indent=2, ensure_ascii=False)

def find_video(qid):
    for p in Path(VIDEO_OUTPUT_FOLDER).glob(f"me_*_{qid}_*.mp4"): return p
    return None

def make_path(q, all_q):
    out = Path(VIDEO_OUTPUT_FOLDER); out.mkdir(parents=True, exist_ok=True)
    try: idx = next(i for i,x in enumerate(all_q) if x["id"]==q["id"])
    except StopIteration: idx=0
    safe = re.sub(r"[^a-zA-Z0-9 _-]","",q["question"]).strip().replace(" ","_")[:40]
    return out/f"me_{idx:04d}_{q.get('id','x')}_{safe}.mp4"

def build_title(q):
    hook = q.get("hook","Is your memory playing tricks?")
    suf  = YT_SUFFIX
    return (hook[:100-len(suf)-1]+"…" if len(hook)>100-len(suf) else hook)+suf

def build_desc(q):
    desc = f"🧠 {q['question']}\n\n──────────────────────────────\n✅ REALITY: {q['answer']}\n"
    if q.get("answer_note"): desc += f"\n💡 {q['answer_note']}\n"
    desc += "\n──────────────────────────────\n\nComment if you remember it differently! 👇\n\nSubscribe for daily Mandela Effects → Mandela Effect\n\n#mandelaeffect #falsememory #mindblown #shorts #didyouknow"
    return desc

def upload(yt, path, q, privacy, publish_at=None):
    from googleapiclient.http import MediaFileUpload
    sb = {"selfDeclaredMadeForKids": False, "privacyStatus": "private" if publish_at else privacy}
    if publish_at: sb["publishAt"] = publish_at
    body = {"snippet":{"title":build_title(q),"description":build_desc(q),"tags":YT_TAGS,"categoryId":"27"},"status":sb}
    media = MediaFileUpload(path, mimetype="video/mp4", resumable=True, chunksize=256*1024)
    req = yt.videos().insert(part="snippet,status", body=body, media_body=media)
    print(f"  Uploading  : {Path(path).name}")
    resp = None
    while resp is None:
        st, resp = req.next_chunk()
        if st: print(f"    {int(st.progress()*100)}% ...", end="\r")
    print("    Upload complete.          ")
    return resp["id"]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=DEFAULT_LIMIT)
    ap.add_argument("--privacy", choices=["private","unlisted","public"], default=DEFAULT_PRIVACY)
    ap.add_argument("--delay", type=int, default=DEFAULT_DELAY)
    ap.add_argument("--stagger-hours", type=float, default=4)
    ap.add_argument("--no-stagger", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    qs = load_q(); u = load_u()
    if not qs: sys.exit("No questions found.")
    cands = [q for q in qs if q.get("id") not in u]
    if not cands: print("Nothing to do."); return
    to_do = cands[:args.limit]
    print(f"{len(cands)} unuploaded. Processing {len(to_do)}:\n")
    for i,q in enumerate(to_do,1): print(f"  {i}. {q['question'][:65]}")
    print()

    if args.dry_run:
        for i,q in enumerate(to_do):
            print(f"\nTitle: {build_title(q)}\nQ: {q['question']}\nA: {q['answer']}")
        print("\nDRY RUN — nothing uploaded."); return

    yt = get_authenticated_service(); t0 = datetime.now(timezone.utc)
    for i,q in enumerate(to_do):
        print(f"\n{'='*55}\n[{i+1}/{len(to_do)}] {q['question'][:55]}\n{'='*55}")
        vp = find_video(q.get("id",""))
        if vp: print(f"  Skipping render — using {vp.name}")
        else:
            vp = make_path(q, qs)
            create_video(q, str(vp), MUSIC_FOLDER, MUSIC_VOLUME)
        pub = None if (args.no_stagger or i==0) else (t0+timedelta(hours=args.stagger_hours*i)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
        try: vid = upload(yt, str(vp), q, args.privacy, pub)
        except Exception as e:
            print(f"  ERROR: {e}")
            if getattr(e,"status_code",None)==403: print("  Quota exceeded."); break
            raise
        u[q["id"]] = {"youtube_id":vid,"youtube_url":f"https://www.youtube.com/watch?v={vid}",
                       "question":q["question"],"answer":q["answer"],
                       "uploaded_at":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),
                       **({  "publish_at":pub} if pub else {})}
        save_u(u)
        print(f"  {'Scheduled' if pub else 'Live'}: https://www.youtube.com/watch?v={vid}")
        if i < len(to_do)-1: print(f"  Waiting {args.delay}s..."); time.sleep(args.delay)
    print(f"\nDone. {len(u)} Mandela Effect video(s) total.")

if __name__ == "__main__": main()
