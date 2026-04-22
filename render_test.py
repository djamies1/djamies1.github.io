#!/usr/bin/env python3
"""
render_test.py — Render one test video per pipeline without uploading anything.

Output lands in each pipeline's video_output/ folder.

Usage:
    python render_test.py                  # render index 0 for all pipelines
    python render_test.py --index 2        # use a different item
    python render_test.py --pipelines riddles mathchallenge
    python render_test.py --no-narration   # skip TTS (faster, music only)
"""

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

PIPELINES = [
    ("Math Challenge",   ROOT / "mathchallenge"  / "make_video.py"),
    ("Would You Rather", ROOT / "wouldyourather" / "make_video.py"),
    ("Trick Questions",  ROOT / "trickquestions" / "make_video.py"),
    ("Mandela Effect",   ROOT / "mandelaeffect"  / "make_video.py"),
    ("Emoji Quiz",       ROOT / "emojiquiz"      / "make_video.py"),
    ("Fun Facts",        ROOT / "funfacts"       / "make_video.py"),
    ("True or False",    ROOT / "trueorfalse"    / "make_video.py"),
    ("Riddles",          ROOT / "riddles"        / "make_video.py"),
    ("Frog Facts",       ROOT / "frogfacts"      / "make_video.py"),
]

PIPELINE_NAMES = [p[0].lower().replace(" ", "") for p in PIPELINES]


def main():
    ap = argparse.ArgumentParser(description="Render one test video per pipeline.")
    ap.add_argument("--index",        type=int, default=0,
                    help="Item index to render from each pipeline's data file (default: 0)")
    ap.add_argument("--no-narration", action="store_true",
                    help="Skip TTS narration (faster renders)")
    ap.add_argument("--pipelines",    nargs="+", default=None,
                    metavar="PIPELINE",
                    help="Only render specific pipelines (e.g. riddles mathchallenge)")
    args = ap.parse_args()

    to_run = PIPELINES
    if args.pipelines:
        names_lower = [n.lower() for n in args.pipelines]
        to_run = [(name, script) for name, script in PIPELINES
                  if any(n in name.lower() for n in names_lower)]
        if not to_run:
            sys.exit(f"No matching pipelines found. Choose from: "
                     f"{', '.join(n for n, _ in PIPELINES)}")

    extra = ["--index", str(args.index)]
    if args.no_narration:
        extra.append("--no-narration")

    results = {}
    for name, script in to_run:
        print(f"\n{'#'*60}")
        print(f"# {name}")
        print(f"{'#'*60}\n")

        if not script.exists():
            print(f"  SKIP — {script} not found")
            results[name] = False
            continue

        result = subprocess.run(
            [sys.executable, str(script)] + extra,
            cwd=str(script.parent),
        )
        results[name] = result.returncode == 0
        if result.returncode != 0:
            print(f"\n[WARNING] {name} exited with code {result.returncode} — continuing.\n")

    print(f"\n{'='*60}")
    print("  Results")
    print(f"{'='*60}")
    for name, ok in results.items():
        print(f"  {'OK    ' if ok else 'FAILED'} — {name}")

    if any(not ok for ok in results.values()):
        print("\nCheck errors above. Videos that succeeded are in each pipeline's video_output/ folder.")
        sys.exit(1)
    else:
        print("\nAll test videos rendered. Check each pipeline's video_output/ folder.")


if __name__ == "__main__":
    main()
