#!/usr/bin/env python3
"""
make_video.py — Render a 15-second Riddle Me Shorts video.

Produces a 1080x1920 portrait MP4 with:
  - Static local background image (channel branding already baked in)
  - Riddle question text centred, fades in at 0.5s
  - Background music (no TTS narration)
  - Ken Burns zoom

Usage:
    python make_video.py --index 0
    python make_video.py --index 3 --out test.mp4
    python make_video.py --list
"""

import argparse
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy import AudioFileClip, VideoClip, concatenate_audioclips

# ── Video dimensions ──────────────────────────────────────────────────────────
WIDTH    = 1080
HEIGHT   = 1920
FPS      = 30
DURATION = 20.0   # fixed 20-second short

# ── Layout ────────────────────────────────────────────────────────────────────
# Safe zone between the baked-in "Riddle Me Shorts" and "Answer in description"
QUESTION_ZONE_TOP_FRAC    = 0.26   # just below "Riddle Me Shorts" title
QUESTION_ZONE_BOTTOM_FRAC = 0.65   # just above "Answer in the description"

PADDING_X       = 80
PADDING_X_RIGHT = 180    # leave room for YouTube UI buttons

# ── Appearance ────────────────────────────────────────────────────────────────
QUESTION_COLOR = (255, 255, 255)   # white — maximum contrast
SHADOW_COLOR   = (0, 0, 0)

QUESTION_FONT_SIZE_MAX = 80    # try from here, shrink until it fits
QUESTION_FONT_SIZE_MIN = 26
LINE_SPACING           = 1.4



# ── Audio ─────────────────────────────────────────────────────────────────────
MUSIC_FOLDER = "riddle_music"
MUSIC_VOLUME = 0.50

# ── Files (all relative to this script's directory) ──────────────────────────
_DIR                = Path(__file__).resolve().parent
RIDDLES_FILE        = str(_DIR / "riddles.json")
VIDEO_OUTPUT_FOLDER = str(_DIR / "video_output")
BACKGROUND_FOLDER   = str(_DIR / "background_images")

# ── Font paths ────────────────────────────────────────────────────────────────
QUESTION_FONTS = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/FredokaOne-Regular.ttf",
    "C:/Windows/Fonts/FredokaOne-Regular.ttf",
    # Fallbacks
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/PlayfairDisplay-Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/calibrib.ttf",
]


# ── Font loading ──────────────────────────────────────────────────────────────

def _load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in QUESTION_FONTS:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()


# ── Text helpers ──────────────────────────────────────────────────────────────

def _wrap(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    lines, current = [], ""
    for word in text.split():
        candidate = f"{current} {word}".strip()
        if dummy.textlength(candidate, font=font) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


# ── Background ────────────────────────────────────────────────────────────────

def load_background() -> np.ndarray:
    """Load the static local background image, scaled to fill the frame."""
    import random
    folder = Path(BACKGROUND_FOLDER)
    exts   = {".jpg", ".jpeg", ".png", ".webp"}
    images = [f for f in folder.iterdir() if f.suffix.lower() in exts]
    if not images:
        raise FileNotFoundError(f"No images found in '{BACKGROUND_FOLDER}'")
    chosen = random.choice(images)
    print(f"  Background : {chosen.name}")
    img    = Image.open(chosen).convert("RGB")
    scale  = max(WIDTH / img.width, HEIGHT / img.height)
    new_w  = int(img.width * scale)
    new_h  = int(img.height * scale)
    img    = img.resize((new_w, new_h), Image.LANCZOS)
    left   = (new_w - WIDTH) // 2
    top    = (new_h - HEIGHT) // 2
    return np.array(img.crop((left, top, left + WIDTH, top + HEIGHT)))


# ── Audio helpers ─────────────────────────────────────────────────────────────

def _loop_audio(clip: AudioFileClip, duration: float) -> AudioFileClip:
    if clip.duration >= duration:
        return clip.subclipped(0, duration)
    repeats = int(duration / clip.duration) + 1
    return concatenate_audioclips([clip] * repeats).subclipped(0, duration)


def _resolve_music(path: str) -> str | None:
    import random
    p = Path(path)
    if p.is_dir():
        exts   = {".mp3", ".wav", ".ogg", ".flac", ".m4a"}
        tracks = [f for f in p.iterdir() if f.suffix.lower() in exts]
        if not tracks:
            print(f"  Warning: no audio files in '{path}' - skipping music")
            return None
        chosen = random.choice(tracks)
        print(f"  Music      : {chosen.name}")
        return str(chosen)
    return path


# ── Question overlay ──────────────────────────────────────────────────────────

def _fit_question(question: str, draw_width: int, max_h: int):
    """Return (font, lines, line_height) at the largest size that fits max_h."""
    for size in range(QUESTION_FONT_SIZE_MAX, QUESTION_FONT_SIZE_MIN - 1, -2):
        font  = _load_font(size)
        lines = _wrap(question, font, draw_width)
        lh    = int(size * LINE_SPACING)
        if len(lines) * lh <= max_h:
            return font, lines, lh
    # Fallback: minimum size regardless of fit
    font  = _load_font(QUESTION_FONT_SIZE_MIN)
    lines = _wrap(question, font, draw_width)
    lh    = int(QUESTION_FONT_SIZE_MIN * LINE_SPACING)
    return font, lines, lh


def render_question_overlay(question: str) -> np.ndarray:
    """Pre-render question text as (HEIGHT, WIDTH, 4) RGBA array.

    Auto-sizes the font to fill the safe zone between the baked-in
    'Riddle Me Shorts' header and 'Answer in the description' footer.
    """
    zone_top    = int(HEIGHT * QUESTION_ZONE_TOP_FRAC)
    zone_bottom = int(HEIGHT * QUESTION_ZONE_BOTTOM_FRAC)
    zone_h      = zone_bottom - zone_top
    zone_mid_y  = (zone_top + zone_bottom) // 2

    draw_width = WIDTH - PADDING_X - PADDING_X_RIGHT
    center_x   = PADDING_X + draw_width // 2

    font, lines, lh = _fit_question(question, draw_width, zone_h)

    img  = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    block_h = len(lines) * lh
    y = zone_mid_y - block_h // 2

    for line in lines:
        w = draw.textlength(line, font=font)
        x = int(center_x - w // 2)
        draw.text((x, y), line, font=font,
                  fill=(*QUESTION_COLOR, 255),
                  stroke_width=3, stroke_fill=(*SHADOW_COLOR, 255))
        y += lh

    return np.array(img)


# ── Main video builder ────────────────────────────────────────────────────────

def create_video(
    riddle: dict,
    output_path: str,
    music_path: str | None = MUSIC_FOLDER,
    music_volume: float = MUSIC_VOLUME,
) -> None:
    question = riddle["question"]

    print(f'\nRendering: "{question[:70]}"')

    # Background (static local image — branding already baked in)
    try:
        bg_arr = load_background()
    except Exception as e:
        print(f"  Background : failed ({e}) - using solid dark background")
        bg_arr = np.full((HEIGHT, WIDTH, 3), (15, 12, 25), dtype=np.uint8)

    bg_float = bg_arr.astype(np.float32)

    # Pre-render question overlay
    q_rgba  = render_question_overlay(question)
    q_float = q_rgba[:, :, :3].astype(np.float32)
    q_alpha = q_rgba[:, :, 3:4].astype(np.float32) / 255.0

    # Audio
    audio = None
    if music_path:
        resolved = _resolve_music(music_path)
        if resolved:
            bg_music = AudioFileClip(resolved)
            audio = _loop_audio(bg_music, DURATION).with_volume_scaled(music_volume)

    print(f"  Duration   : {DURATION:.0f}s")
    print(f"  Output     : {output_path}\n")

    total_frames = int(DURATION * FPS)
    _rendered    = [0]

    def make_frame(t: float) -> np.ndarray:
        # Static background + question overlay
        frame = bg_float * (1.0 - q_alpha) + q_float * q_alpha

        _rendered[0] += 1
        if _rendered[0] % 30 == 0 or _rendered[0] == total_frames:
            pct = _rendered[0] / total_frames * 100
            print(f"\r  Rendering  : {pct:.0f}%  ({_rendered[0]}/{total_frames} frames)",
                  end="", flush=True)

        return frame.astype(np.uint8)

    clip = VideoClip(make_frame, duration=DURATION)
    if audio is not None:
        clip = clip.with_audio(audio)

    clip.write_videofile(
        output_path, fps=FPS, codec="libx264", audio_codec="aac", logger=None,
    )
    clip.close()
    print()
    print(f"\nDone! Saved to: {output_path}")


# ── CLI ───────────────────────────────────────────────────────────────────────

def load_riddles() -> list[dict]:
    p = Path(RIDDLES_FILE)
    if not p.exists():
        sys.exit(f"Error: '{RIDDLES_FILE}' not found. Run scrape_riddles.py first.")
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def _make_output_path(index: int, riddle: dict) -> str:
    out_dir = Path(VIDEO_OUTPUT_FOLDER)
    out_dir.mkdir(parents=True, exist_ok=True)
    rid  = riddle.get("id", "unknown")
    safe = re.sub(r"[^a-zA-Z0-9 _-]", "", riddle["question"])
    safe = safe.strip().replace(" ", "_")[:40]
    return str(out_dir / f"riddle_{index:04d}_{rid}_{safe}.mp4")


def main():
    parser = argparse.ArgumentParser(description="Render a Riddle Me Shorts video.")
    parser.add_argument("--index",        type=int,   default=0,
                        help="Riddle index in bank")
    parser.add_argument("--music",        default=MUSIC_FOLDER)
    parser.add_argument("--music-volume", type=float, default=MUSIC_VOLUME)
    parser.add_argument("--out",          default=None)
    parser.add_argument("--list",         action="store_true")
    args = parser.parse_args()

    riddles = load_riddles()

    if args.list:
        print(f"\n{'#':<6} {'ID':<10} {'Category':<12} Question")
        print("-" * 80)
        for i, r in enumerate(riddles):
            cat = (r.get("category") or "classic")[:10]
            print(f"{i:<6} {r.get('id',''):<10} {cat:<12} {r['question'][:55]}")
        print(f"\n{len(riddles)} riddles total.")
        return

    if args.index >= len(riddles):
        sys.exit(f"Error: index {args.index} out of range (bank has {len(riddles)} riddles).")

    riddle = riddles[args.index]
    output = args.out or _make_output_path(args.index, riddle)

    create_video(
        riddle=riddle,
        output_path=output,
        music_path=args.music,
        music_volume=args.music_volume,
    )


if __name__ == "__main__":
    main()
