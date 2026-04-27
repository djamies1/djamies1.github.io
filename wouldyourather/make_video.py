#!/usr/bin/env python3
"""
make_video.py — Render a 20-second Would You Rather Short.

Produces a 1080x1920 portrait MP4 with:
  - "WOULD YOU RATHER..." hook at top (fades in immediately)
  - Option A in upper zone with blue accent colour
  - "— OR —" divider in the middle
  - Option B in lower zone with red/orange accent colour
  - Comment prompt at bottom: "Comment A or B 👇"
  - Background music

No reveal phase — the engagement comes from the debate in comments.

Usage:
    python make_video.py --index 0
    python make_video.py --index 3 --out test.mp4
    python make_video.py --list
"""

import argparse
import asyncio
import io
import json
import os
import re
import sys
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy import AudioFileClip, CompositeAudioClip, VideoClip, concatenate_audioclips

# ── Video dimensions ───────────────────────────────────────────────────────────
WIDTH    = 1080
HEIGHT   = 1920
FPS      = 30
DURATION = 20.0

# ── Timing ────────────────────────────────────────────────────────────────────
CONTENT_FADE = 0.5   # seconds for main content to fade in

# ── Layout ────────────────────────────────────────────────────────────────────
PADDING_X       = 70
PADDING_X_RIGHT = 170
DRAW_WIDTH      = WIDTH - PADDING_X - PADDING_X_RIGHT
CENTER_X        = PADDING_X + DRAW_WIDTH // 2

HEADER_Y_FRAC   = 0.10   # "WOULD YOU RATHER..." top label
OPTION_A_Y_FRAC = 0.34   # centre of option A zone
OR_Y_FRAC       = 0.54   # centre of "— OR —" divider
OPTION_B_Y_FRAC = 0.72   # centre of option B zone
PROMPT_Y_FRAC   = 0.82   # "Comment A or B 👇"

# Coloured pill boxes behind each option
BOX_PADDING_X = 40
BOX_PADDING_Y = 28
BOX_CORNER    = 30
BOX_ALPHA     = 160   # 0-255

# ── Appearance ────────────────────────────────────────────────────────────────
HEADER_COLOR   = (255, 220, 60)    # amber/gold
OPTION_A_COLOR = (100, 180, 255)   # blue
OPTION_B_COLOR = (255, 100, 80)    # coral/red
OR_COLOR       = (200, 200, 200)   # light grey
PROMPT_COLOR   = (255, 255, 255)   # white
SHADOW_COLOR   = (0, 0, 0)

BOX_A_COLOR    = (30, 80, 160)     # dark blue fill
BOX_B_COLOR    = (160, 40, 30)     # dark red fill

HEADER_FONT_SIZE  = 58
OPTION_FONT_MAX   = 72
OPTION_FONT_MIN   = 28
OR_FONT_SIZE      = 56
PROMPT_FONT_SIZE  = 46
LINE_SPACING      = 1.35

OVERLAY_OPACITY = 175

POLLINATIONS_URL = (
    "https://image.pollinations.ai/prompt/{prompt}"
    "?width=1080&height=1920&nologo=true&seed={seed}"
)
IMAGE_TIMEOUT = 90

# ── Audio ─────────────────────────────────────────────────────────────────────
MUSIC_FOLDER = str(Path(__file__).resolve().parent / "wyr_music")
MUSIC_VOLUME = 0.42

TTS_VOICE        = "en-US-GuyNeural"
TTS_RATE         = "+0%"
TTS_PITCH        = "+0Hz"
TTS_VOLUME       = 1.0
MUSIC_DUCK_SCALE = 0.10

# ── Files ─────────────────────────────────────────────────────────────────────
_DIR                = Path(__file__).resolve().parent
QUESTIONS_FILE      = str(_DIR / "questions.json")
VIDEO_OUTPUT_FOLDER = str(_DIR / "video_output")
BACKGROUND_FOLDER   = str(_DIR / "background_images")

# ── Font paths ─────────────────────────────────────────────────────────────────
DISPLAY_FONTS = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/FredokaOne-Regular.ttf",
    "C:/Windows/Fonts/FredokaOne-Regular.ttf",
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/PlayfairDisplay-Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/calibrib.ttf",
    "/home/runner/.local/share/fonts/FredokaOne-Regular.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
]
BODY_FONTS = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/PlayfairDisplay-Regular.ttf",
    "C:/Windows/Fonts/georgia.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/calibri.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSerif.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
]


# ── Font loading ───────────────────────────────────────────────────────────────

def _load_font(size: int, display: bool = False) -> ImageFont.FreeTypeFont:
    paths = DISPLAY_FONTS if display else BODY_FONTS
    for path in paths:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()


# ── Text helpers ───────────────────────────────────────────────────────────────

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


def _measure_block(lines: list[str], font: ImageFont.FreeTypeFont, lh: int) -> tuple[int, int]:
    """Return (max_line_width, total_height) for a block of lines."""
    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    max_w = max((int(dummy.textlength(l, font=font)) for l in lines), default=0)
    total_h = len(lines) * lh
    return max_w, total_h


def _fit_option(text: str) -> tuple:
    """Find largest font size where option text fits in the option zone."""
    zone_h = int(HEIGHT * 0.17)   # ~17% of height per option zone
    for size in range(OPTION_FONT_MAX, OPTION_FONT_MIN - 1, -2):
        font  = _load_font(size, display=True)
        lines = _wrap(text, font, DRAW_WIDTH - BOX_PADDING_X * 2)
        lh    = int(size * LINE_SPACING)
        if len(lines) * lh <= zone_h:
            return font, lines, lh, size
    font  = _load_font(OPTION_FONT_MIN, display=True)
    lines = _wrap(text, font, DRAW_WIDTH - BOX_PADDING_X * 2)
    lh    = int(OPTION_FONT_MIN * LINE_SPACING)
    return font, lines, lh, OPTION_FONT_MIN


def _draw_pill_box(draw: ImageDraw.ImageDraw, cx: int, cy: int,
                   content_w: int, content_h: int, fill_color: tuple) -> None:
    """Draw a rounded-rectangle pill box centred at (cx, cy)."""
    box_w = content_w + BOX_PADDING_X * 2
    box_h = content_h + BOX_PADDING_Y * 2
    x0 = cx - box_w // 2
    y0 = cy - box_h // 2
    x1 = cx + box_w // 2
    y1 = cy + box_h // 2
    draw.rounded_rectangle(
        [x0, y0, x1, y1],
        radius=BOX_CORNER,
        fill=(*fill_color, BOX_ALPHA),
    )


def _draw_text_centred(draw: ImageDraw.ImageDraw, lines: list[str],
                       font: ImageFont.FreeTypeFont, cx: int, cy: int,
                       lh: int, color: tuple, alpha: int = 255) -> None:
    """Draw text block vertically centred at (cx, cy) with outline stroke."""
    total_h = len(lines) * lh
    y = cy - total_h // 2
    for line in lines:
        w = int(draw.textlength(line, font=font))
        x = cx - w // 2
        draw.text((x, y), line, font=font, fill=(*color, alpha),
                  stroke_width=3, stroke_fill=(0, 0, 0, 255))
        y += lh


# ── Background ─────────────────────────────────────────────────────────────────

def load_local_background() -> np.ndarray:
    import random
    folder = Path(BACKGROUND_FOLDER)
    exts   = {".jpg", ".jpeg", ".png", ".webp"}
    images = [f for f in folder.iterdir() if f.suffix.lower() in exts] if folder.is_dir() else []
    if not images:
        print("  Background : no images — using solid dark background")
        return np.full((HEIGHT, WIDTH, 3), (10, 10, 20), dtype=np.uint8)
    chosen = random.choice(images)
    print(f"  Background : {chosen.name}")
    img   = Image.open(chosen).convert("RGB")
    scale = max(WIDTH / img.width, HEIGHT / img.height)
    new_w = int(img.width * scale)
    new_h = int(img.height * scale)
    img   = img.resize((new_w, new_h), Image.LANCZOS)
    left  = (new_w - WIDTH) // 2
    top   = (new_h - HEIGHT) // 2
    img   = img.crop((left, top, left + WIDTH, top + HEIGHT))
    overlay = Image.new("RGBA", img.size, (0, 0, 0, OVERLAY_OPACITY))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    arr = np.array(img, dtype=np.float32)
    Y, X = np.ogrid[:HEIGHT, :WIDTH]
    dist = np.sqrt(((X - WIDTH/2)/(WIDTH*0.6))**2 + ((Y - HEIGHT*0.45)/(HEIGHT*0.55))**2)
    vignette = np.clip(1.0 - 0.6*dist**1.5, 0.2, 1.0)[..., np.newaxis]
    return np.clip(arr * vignette, 0, 255).astype(np.uint8)


def _content_to_image_prompt(item: dict) -> str:
    a = " ".join(item.get("option_a", "").split()[:5])
    b = " ".join(item.get("option_b", "").split()[:5])
    cat = item.get("category", "dilemma")
    return (f"bright vivid colorful split-choice background, {a} versus {b}, "
            f"{cat}, fun engaging, vibrant digital art")


def fetch_ai_background(item: dict) -> np.ndarray:
    prompt  = _content_to_image_prompt(item)
    encoded = urllib.parse.quote(prompt)
    seed    = abs(hash(str(item.get("id", "x")))) % 99999
    url     = POLLINATIONS_URL.format(prompt=encoded, seed=seed)
    print(f"  Background : fetching AI image...")
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "shorts-video/1.0"})
            with urllib.request.urlopen(req, timeout=IMAGE_TIMEOUT) as resp:
                img_data = resp.read()
            break
        except Exception as e:
            if attempt < 1:
                print(f"  Background : attempt {attempt+1} failed ({e}) — retrying...")
                import time; time.sleep(10)
            else:
                raise
    img   = Image.open(io.BytesIO(img_data)).convert("RGB")
    scale = max(WIDTH / img.width, HEIGHT / img.height)
    new_w = int(img.width * scale)
    new_h = int(img.height * scale)
    img   = img.resize((new_w, new_h), Image.LANCZOS)
    left  = (new_w - WIDTH) // 2
    top   = (new_h - HEIGHT) // 2
    img   = img.crop((left, top, left + WIDTH, top + HEIGHT))
    overlay = Image.new("RGBA", img.size, (0, 0, 0, OVERLAY_OPACITY))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    arr  = np.array(img, dtype=np.float32)
    Y, X = np.ogrid[:HEIGHT, :WIDTH]
    dist = np.sqrt(((X - WIDTH/2)/(WIDTH*0.6))**2 + ((Y - HEIGHT*0.45)/(HEIGHT*0.55))**2)
    vign = np.clip(1.0 - 0.6*dist**1.5, 0.2, 1.0)[..., np.newaxis]
    return np.clip(arr * vign, 0, 255).astype(np.uint8)


def load_background(item: dict) -> np.ndarray:
    try:
        return fetch_ai_background(item)
    except Exception as e:
        print(f"  Background : AI fetch failed ({e}) — using local image")
        return load_local_background()


# ── Audio helpers ──────────────────────────────────────────────────────────────

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
            print(f"  Warning: no audio in '{path}' — skipping music")
            return None
        chosen = random.choice(tracks)
        print(f"  Music      : {chosen.name}")
        return str(chosen)
    return path if p.exists() else None


# ── TTS narration helpers ──────────────────────────────────────────────────────

def _build_narration_text(item: dict) -> str:
    return f"Would you rather... {item['option_a']}... or... {item['option_b']}?"


async def _tts_generate(text: str, output_path: str) -> None:
    import edge_tts
    comm = edge_tts.Communicate(text, voice=TTS_VOICE, rate=TTS_RATE, pitch=TTS_PITCH)
    await comm.save(output_path)


def generate_narration(item: dict, output_path: str) -> bool:
    text = _build_narration_text(item)
    try:
        asyncio.run(_tts_generate(text, output_path))
        return True
    except Exception as e:
        print(f"  Narration  : TTS failed ({e}) — skipping")
        return False


# ── Overlay pre-rendering ──────────────────────────────────────────────────────

def render_main_overlay(question: dict) -> np.ndarray:
    """
    Pre-render the full WYR layout as RGBA (HEIGHT, WIDTH, 4).

    Layout (top to bottom):
      HEADER_Y_FRAC    — "WOULD YOU RATHER..."
      OPTION_A_Y_FRAC  — "A" label + option A text in blue pill
      OR_Y_FRAC        — "— OR —"
      OPTION_B_Y_FRAC  — "B" label + option B text in red pill
      PROMPT_Y_FRAC    — "Comment A or B 👇"
    """
    img  = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    option_a = question["option_a"]
    option_b = question["option_b"]

    # ── Header: "WOULD YOU RATHER..." ─────────────────────────────────────────
    h_font  = _load_font(HEADER_FONT_SIZE, display=True)
    h_lines = _wrap("WOULD YOU RATHER...", h_font, DRAW_WIDTH)
    h_lh    = int(HEADER_FONT_SIZE * LINE_SPACING)
    _draw_text_centred(draw, h_lines, h_font, CENTER_X,
                       int(HEIGHT * HEADER_Y_FRAC), h_lh, HEADER_COLOR)

    # ── Option A ──────────────────────────────────────────────────────────────
    a_font, a_lines, a_lh, a_size = _fit_option(option_a)
    a_w, a_h = _measure_block(a_lines, a_font, a_lh)
    a_cy = int(HEIGHT * OPTION_A_Y_FRAC)
    _draw_pill_box(draw, CENTER_X, a_cy, a_w, a_h, BOX_A_COLOR)

    # "A" badge label
    badge_font = _load_font(a_size + 6, display=True)
    badge_x = CENTER_X - a_w // 2 - BOX_PADDING_X + 4
    badge_y = a_cy - a_h // 2 - BOX_PADDING_Y
    draw.text((badge_x, badge_y), "A", font=badge_font,
              fill=(*OPTION_A_COLOR, 255))

    _draw_text_centred(draw, a_lines, a_font, CENTER_X, a_cy, a_lh, OPTION_A_COLOR)

    # ── "— OR —" divider ──────────────────────────────────────────────────────
    or_font  = _load_font(OR_FONT_SIZE, display=True)
    or_lines = ["— OR —"]
    or_lh    = int(OR_FONT_SIZE * LINE_SPACING)
    _draw_text_centred(draw, or_lines, or_font, CENTER_X,
                       int(HEIGHT * OR_Y_FRAC), or_lh, OR_COLOR)

    # ── Option B ──────────────────────────────────────────────────────────────
    b_font, b_lines, b_lh, b_size = _fit_option(option_b)
    b_w, b_h = _measure_block(b_lines, b_font, b_lh)
    b_cy = int(HEIGHT * OPTION_B_Y_FRAC)
    _draw_pill_box(draw, CENTER_X, b_cy, b_w, b_h, BOX_B_COLOR)

    badge_font_b = _load_font(b_size + 6, display=True)
    badge_bx = CENTER_X - b_w // 2 - BOX_PADDING_X + 4
    badge_by = b_cy - b_h // 2 - BOX_PADDING_Y
    draw.text((badge_bx, badge_by), "B", font=badge_font_b,
              fill=(*OPTION_B_COLOR, 255))

    _draw_text_centred(draw, b_lines, b_font, CENTER_X, b_cy, b_lh, OPTION_B_COLOR)

    # ── Prompt ────────────────────────────────────────────────────────────────
    p_font  = _load_font(PROMPT_FONT_SIZE)
    p_lines = _wrap("Comment A or B below!", p_font, DRAW_WIDTH)
    p_lh    = int(PROMPT_FONT_SIZE * LINE_SPACING)
    _draw_text_centred(draw, p_lines, p_font, CENTER_X,
                       int(HEIGHT * PROMPT_Y_FRAC), p_lh, PROMPT_COLOR, alpha=230)

    return np.array(img)


# ── Main video builder ─────────────────────────────────────────────────────────

def create_video(
    question: dict,
    output_path: str,
    music_path: str | None = MUSIC_FOLDER,
    music_volume: float = MUSIC_VOLUME,
    narration: bool = True,
) -> None:
    print(f'\nRendering: A) "{question["option_a"][:50]}" / B) "{question["option_b"][:50]}"')

    bg_arr   = load_background(question)
    bg_float = bg_arr.astype(np.float32)

    overlay_rgba  = render_main_overlay(question)
    overlay_float = overlay_rgba[:, :, :3].astype(np.float32)
    overlay_alpha = overlay_rgba[:, :, 3:4].astype(np.float32) / 255.0

    # Audio — narration + background music mix
    audio       = None
    _tmp_narr   = None
    audio_clips = []

    if narration:
        _tmp_narr = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
        _tmp_narr.close()
        print(f"  Narration  : generating TTS...")
        if generate_narration(question, _tmp_narr.name):
            narr_clip = AudioFileClip(_tmp_narr.name).with_volume_scaled(TTS_VOLUME)
            audio_clips.append(narr_clip)

    if music_path:
        resolved = _resolve_music(music_path)
        if resolved:
            vol = MUSIC_DUCK_SCALE if audio_clips else music_volume
            audio_clips.append(_loop_audio(AudioFileClip(resolved), DURATION).with_volume_scaled(vol))

    if len(audio_clips) > 1:
        audio = CompositeAudioClip(audio_clips)
    elif audio_clips:
        audio = audio_clips[0]

    print(f"  Duration   : {DURATION:.0f}s")
    print(f"  Output     : {output_path}\n")

    total_frames = int(DURATION * FPS)
    _rendered    = [0]

    def make_frame(t: float) -> np.ndarray:
        # Fade in over CONTENT_FADE seconds
        fade  = min(1.0, t / CONTENT_FADE) if CONTENT_FADE > 0 else 1.0
        eff_a = overlay_alpha * fade
        frame = bg_float * (1.0 - eff_a) + overlay_float * eff_a

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
    if _tmp_narr is not None:
        try:
            os.unlink(_tmp_narr.name)
        except OSError:
            pass
    print()
    print(f"\nDone! Saved to: {output_path}")


# ── CLI ────────────────────────────────────────────────────────────────────────

def load_questions() -> list[dict]:
    p = Path(QUESTIONS_FILE)
    if not p.exists():
        sys.exit(f"Error: '{QUESTIONS_FILE}' not found.")
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def _make_output_path(index: int, question: dict) -> str:
    out_dir = Path(VIDEO_OUTPUT_FOLDER)
    out_dir.mkdir(parents=True, exist_ok=True)
    qid  = question.get("id", "unknown")
    safe = re.sub(r"[^a-zA-Z0-9 _-]", "", question["option_a"])
    safe = safe.strip().replace(" ", "_")[:35]
    return str(out_dir / f"wyr_{index:04d}_{qid}_{safe}.mp4")


def main():
    parser = argparse.ArgumentParser(description="Render a Would You Rather Short.")
    parser.add_argument("--index",        type=int,   default=0)
    parser.add_argument("--music",        default=MUSIC_FOLDER)
    parser.add_argument("--music-volume", type=float, default=MUSIC_VOLUME)
    parser.add_argument("--out",          default=None)
    parser.add_argument("--list",         action="store_true")
    parser.add_argument("--no-narration", action="store_true",
                        help="Skip TTS narration, use music only")
    args = parser.parse_args()

    questions = load_questions()

    if args.list:
        print(f"\n{'#':<6} {'ID':<12} {'Category':<18} A  /  B")
        print("-" * 90)
        for i, q in enumerate(questions):
            cat = (q.get("category") or "")[:16]
            print(f"{i:<6} {q.get('id',''):<12} {cat:<18} "
                  f"{q['option_a'][:30]} / {q['option_b'][:30]}")
        print(f"\n{len(questions)} questions total.")
        return

    if args.index >= len(questions):
        sys.exit(f"Error: index {args.index} out of range (bank has {len(questions)} questions).")

    question = questions[args.index]
    output   = args.out or _make_output_path(args.index, question)

    create_video(
        question=question,
        output_path=output,
        music_path=args.music,
        music_volume=args.music_volume,
        narration=not args.no_narration,
    )


if __name__ == "__main__":
    main()
