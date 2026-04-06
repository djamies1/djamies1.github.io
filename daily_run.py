#!/usr/bin/env python3
"""
daily_run.py — Run all three pipelines in sequence:
    1. riddles/daily_upload.py
    2. twosentencehorror/daily_upload.py
    3. nosleep/daily_upload.py

Any extra arguments are passed through to each script unchanged.

Usage:
    python daily_run.py
    python daily_run.py --dry-run
    python daily_run.py --no-scrape
"""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

PIPELINES = [
    ("Riddles",            ROOT / "riddles"           / "daily_upload.py"),
    ("Two Sentence Horror", ROOT / "twosentencehorror" / "daily_upload.py"),
    ("Nosleep",            ROOT / "nosleep"            / "daily_upload.py"),
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
