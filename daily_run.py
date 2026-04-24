#!/usr/bin/env python3
"""
daily_run.py — Run all pipelines in sequence:
    1. mathchallenge/daily_upload.py
    2. wouldyourather/daily_upload.py
    3. trickquestions/daily_upload.py
    4. mandelaeffect/daily_upload.py
    5. emojiquiz/daily_upload.py
    6. funfacts/daily_upload.py
    7. trueorfalse/daily_upload.py
    8. riddles/daily_upload.py
    9. frogfacts/daily_upload.py

Any extra arguments are passed through to each script unchanged.

NOTE: YouTube default quota is 10,000 units/day; each upload costs ~1,600 units
= max ~6 uploads/day. With 8 pipelines × --limit 1, you use ~12,800 units.
Request a quota increase at Google Cloud Console, or run with --limit 1.

Usage:
    python daily_run.py --limit 1
    python daily_run.py --dry-run
"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

PIPELINES = [
    ("Math Challenge",   ROOT / "mathchallenge"  / "daily_upload.py"),
    ("Would You Rather", ROOT / "wouldyourather" / "daily_upload.py"),
    ("Trick Questions",  ROOT / "trickquestions" / "daily_upload.py"),
    ("Mandela Effect",   ROOT / "mandelaeffect"  / "daily_upload.py"),
    ("Emoji Quiz",       ROOT / "emojiquiz"      / "daily_upload.py"),
    ("Fun Facts",        ROOT / "funfacts"       / "daily_upload.py"),
    ("True or False",    ROOT / "trueorfalse"    / "daily_upload.py"),
    ("Riddles",          ROOT / "riddles"        / "daily_upload.py"),
    ("Frog Facts",       ROOT / "frogfacts"      / "daily_upload.py"),
]

extra_args = sys.argv[1:]

overall_ok = True

for name, script in PIPELINES:
    print(f"\n{'#'*60}")
    print(f"# {name}")
    print(f"{'#'*60}\n")

    result = subprocess.run(
        [sys.executable, str(script)] + extra_args,
        cwd=str(script.parent),
    )

    if result.returncode != 0:
        print(f"\n[WARNING] {name} exited with code {result.returncode} — continuing.\n")
        overall_ok = False

print(f"\n{'='*60}")
print("All pipelines finished." if overall_ok else "Done (one or more pipelines had errors).")
print(f"{'='*60}")

sys.exit(0 if overall_ok else 1)
