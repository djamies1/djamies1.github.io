#!/usr/bin/env python3
"""
make_video.py — Render a 20-second Math Challenge Short.

Produces a 1080x1920 portrait MP4 with two phases:
  Phase 1 (0 → REVEAL_T):   Hook text at top + problem text centred
  Phase 2 (REVEAL_T → END):  Answer fades in below the problem in accent colour
                              + "Did you get it?" prompt on final frame

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
DURATION = 20.0   # total video length in seconds

# ── Timing ────────────────────────────────────────────────────────────────────
REVEAL_T     = 13.0   # when the answer starts fading in
ANSWER_FADE  = 1.5    # seconds for the answer to fully fade in
HOOK_FADE    = 0.4    # seconds for the hook text to fade in at start

# ── Layout ────────────────────────────────────────────────────────────────────
PADDING_X       = 80
PADDING_X_RIGHT = 180   # leave room for YouTube UI buttons
DRAW_WIDTH      = WIDTH - PADDING_X - PADDING_X_RIGHT
CENTER_X        = PADDING_X + DRAW_WIDTH // 2

HOOK_Y_FRAC         = 0.14   # "99% of adults get this wrong" sits here
QUESTION_CENTER_FRAC = 0.42  # problem text vertically centred here
ANSWER_CENTER_FRAC   = 0.72  # answer block vertically centred here
PROMPT_Y_FRAC        = 0.82  # "Did you get it?" near the bottom

# ── Appearance ────────────────────────────────────────────────────────────────
HOOK_COLOR      = (255, 200, 50)    # amber — eye-catching
QUESTION_COLOR  = (255, 255, 255)   # white
ANSWER_COLOR    = (80, 220, 120)    # green — satisfying reveal
NOTE_COLOR      = (200, 200, 200)   # light grey for the explanation note
PROMPT_COLOR    = (255, 255, 255)   # white
SHADOW_COLOR    = (0, 0, 0)

HOOK_FONT_SIZE      = 52
QUESTION_FONT_MAX   = 90
QUESTION_FONT_MIN   = 28
ANSWER_FONT_SIZE    = 80
NOTE_FONT_SIZE      = 42
PROMPT_FONT_SIZE    = 44
LINE_SPACING        = 1.4

OVERLAY_OPACITY = 175   # how dark to tint the background (0–255)

POLLINATIONS_URL = (
    "https://image.pollinations.ai/prompt/{prompt}"
    "?width=1080&height=1920&nologo=true&seed={seed}"
)
IMAGE_TIMEOUT = 90

# ── Audio ─────────────────────────────────────────────────────────────────────
MUSIC_FOLDER = str(Path(__file__).resolve().parent / "math_music")
MUSIC_VOLUME = 0.45

# ── TTS narration ──────────────────────────────────────────────────────────────
TTS_VOICE        = "en-US-GuyNeural"   # clear male voice
TTS_RATE         = "+0%"
TTS_PITCH        = "+0Hz"
TTS_VOLUME       = 1.0                 # narration at full volume
MUSIC_DUCK_SCALE = 0.10               # music ducked to 10% while narrating

# ── Files ─────────────────────────────────────────────────────────────────────
_DIR                = Path(__file__).resolve().parent
_FONTS_DIR          = _DIR.parent / "fonts"
PROBLEMS_FILE       = str(_DIR / "problems.json")
VIDEO_OUTPUT_FOLDER = str(_DIR / "video_output")
BACKGROUND_FOLDER   = str(_DIR / "background_images")

# ── Font paths ─────────────────────────────────────────────────────────────────
DISPLAY_FONTS = [
    str(_FONTS_DIR / "FredokaOne-Regular.ttf"),
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
    "C:/Windows/Fonts/PlayfairDisplay-Regular.ttf",
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
    """Word-wrap text to fit max_width pixels, respecting explicit newlines."""
    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    result = []
    for paragraph in text.split("\n"):
        lines, current = [], ""
        for word in paragraph.split():
            candidate = f"{current} {word}".strip()
            if dummy.textlength(candidate, font=font) <= max_width:
                current = candidate
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
        result.extend(lines if lines else [""])
    return result


def _draw_text_block(draw: ImageDraw.ImageDraw, lines: list[str],
                     font: ImageFont.FreeTypeFont, center_x: int,
                     center_y: int, line_height: int,
                     color: tuple, alpha: int = 255) -> None:
    """Draw a block of lines vertically centred at center_y with outline stroke."""
    block_h = len(lines) * line_height
    y = center_y - block_h // 2
    for line in lines:
        w = draw.textlength(line, font=font)
        x = int(center_x - w // 2)
        draw.text((x, y), line, font=font, fill=(*color, alpha),
                  stroke_width=3, stroke_fill=(0, 0, 0, 255))
        y += line_height


def _block_size(lines: list[str], font: ImageFont.FreeTypeFont, lh: int) -> tuple[int, int]:
    """Return (max_width, total_height) of a text block."""
    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    w = max((int(dummy.textlength(l, font=font)) for l in lines), default=0)
    return w, len(lines) * lh


def _draw_panel(draw: ImageDraw.ImageDraw, cx: int, cy: int,
                bw: int, bh: int, color: tuple = (0, 0, 0),
                alpha: int = 145, radius: int = 22,
                px: int = 44, py: int = 24) -> None:
    """Draw a frosted semi-transparent rounded panel behind a text block."""
    x0, y0 = int(cx - bw//2 - px), int(cy - bh//2 - py)
    x1, y1 = int(cx + bw//2 + px), int(cy + bh//2 + py)
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=(*color, alpha))


# ── Background ─────────────────────────────────────────────────────────────────

def load_local_background() -> np.ndarray:
    """Pick a random local background image, tinted dark."""
    import random
    folder = Path(BACKGROUND_FOLDER)
    exts   = {".jpg", ".jpeg", ".png", ".webp"}
    images = [f for f in folder.iterdir() if f.suffix.lower() in exts] if folder.is_dir() else []
    if not images:
        print("  Background : no images found — using solid dark background")
        return np.full((HEIGHT, WIDTH, 3), (12, 15, 28), dtype=np.uint8)
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
    cat = item.get("category", "mathematics")
    diff = item.get("difficulty", "")
    return (f"bright vivid colorful mathematical background, {cat}, "
            f"numbers equations geometry, {diff}, vibrant, engaging, digital art")


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
            print(f"  Warning: no audio files in '{path}' — skipping music")
            return None
        chosen = random.choice(tracks)
        print(f"  Music      : {chosen.name}")
        return str(chosen)
    return path if p.exists() else None


# ── TTS narration helpers ──────────────────────────────────────────────────────

def _build_narration_text(problem: dict) -> str:
    hook     = problem.get("hook", "Can you solve this?")
    question = problem["question"]
    return f"{hook}. {question}"


async def _tts_generate(text: str, output_path: str) -> None:
    import edge_tts
    comm = edge_tts.Communicate(text, voice=TTS_VOICE, rate=TTS_RATE, pitch=TTS_PITCH)
    await comm.save(output_path)


def generate_narration(problem: dict, output_path: str) -> bool:
    """Generate TTS for hook + question. Returns True on success."""
    text = _build_narration_text(problem)
    try:
        asyncio.run(_tts_generate(text, output_path))
        return True
    except Exception as e:
        print(f"  Narration  : TTS failed ({e}) — skipping")
        return False


# ── Overlay pre-rendering ──────────────────────────────────────────────────────

def _fit_question(question: str) -> tuple:
    """Find the largest font size where the question fits the question zone."""
    zone_h = int(HEIGHT * (ANSWER_CENTER_FRAC - 0.12) - HEIGHT * (QUESTION_CENTER_FRAC - 0.20))
    for size in range(QUESTION_FONT_MAX, QUESTION_FONT_MIN - 1, -2):
        font  = _load_font(size, display=True)
        lines = _wrap(question, font, DRAW_WIDTH)
        lh    = int(size * LINE_SPACING)
        if len(lines) * lh <= zone_h:
            return font, lines, lh
    font  = _load_font(QUESTION_FONT_MIN, display=True)
    lines = _wrap(question, font, DRAW_WIDTH)
    lh    = int(QUESTION_FONT_MIN * LINE_SPACING)
    return font, lines, lh


def render_phase1_overlay(problem: dict) -> np.ndarray:
    """Pre-render hook text + question as RGBA (HEIGHT, WIDTH, 4) array."""
    img  = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    hook     = problem.get("hook", "Can you solve this?")
    question = problem["question"]

    # Hook text
    hook_font  = _load_font(HOOK_FONT_SIZE, display=True)
    hook_lines = _wrap(hook, hook_font, DRAW_WIDTH)
    hook_lh    = int(HOOK_FONT_SIZE * LINE_SPACING)
    hook_y     = int(HEIGHT * HOOK_Y_FRAC)
    hw, hh = _block_size(hook_lines, hook_font, hook_lh)
    _draw_panel(draw, CENTER_X, hook_y, hw, hh)
    _draw_text_block(draw, hook_lines, hook_font, CENTER_X,
                     hook_y, hook_lh, HOOK_COLOR)

    # Question text (auto-sized)
    q_font, q_lines, q_lh = _fit_question(question)
    q_center_y = int(HEIGHT * QUESTION_CENTER_FRAC)
    qw, qh = _block_size(q_lines, q_font, q_lh)
    _draw_panel(draw, CENTER_X, q_center_y, qw, qh)
    _draw_text_block(draw, q_lines, q_font, CENTER_X,
                     q_center_y, q_lh, QUESTION_COLOR)

    return np.array(img)


def render_answer_overlay(problem: dict) -> np.ndarray:
    """Pre-render answer + note as RGBA (HEIGHT, WIDTH, 4) array."""
    img  = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    answer = f"✓ {problem['answer']}"
    note   = problem.get("answer_note", "")

    # Answer (large, green)
    ans_font  = _load_font(ANSWER_FONT_SIZE, display=True)
    ans_lines = _wrap(answer, ans_font, DRAW_WIDTH)
    ans_lh    = int(ANSWER_FONT_SIZE * LINE_SPACING)

    # Note (smaller, grey)
    note_font  = _load_font(NOTE_FONT_SIZE)
    note_lines = _wrap(note, note_font, DRAW_WIDTH) if note else []
    note_lh    = int(NOTE_FONT_SIZE * LINE_SPACING)

    total_h = len(ans_lines) * ans_lh
    if note_lines:
        total_h += 20 + len(note_lines) * note_lh  # 20px gap

    ans_center_y = int(HEIGHT * ANSWER_CENTER_FRAC)
    panel_cy = ans_center_y - total_h//2 + total_h//2
    _draw_panel(draw, CENTER_X, ans_center_y, max(
        _block_size(ans_lines, ans_font, ans_lh)[0],
        _block_size(note_lines, note_font, note_lh)[0] if note_lines else 0
    ), total_h, py=28)
    y = ans_center_y - total_h // 2

    # Draw answer
    for line in ans_lines:
        w = draw.textlength(line, font=ans_font)
        x = int(CENTER_X - w // 2)
        draw.text((x, y), line, font=ans_font, fill=(*ANSWER_COLOR, 255),
                  stroke_width=3, stroke_fill=(0, 0, 0, 255))
        y += ans_lh

    # Draw note
    if note_lines:
        y += 20
        for line in note_lines:
            w = draw.textlength(line, font=note_font)
            x = int(CENTER_X - w // 2)
            draw.text((x, y), line, font=note_font, fill=(*NOTE_COLOR, 230),
                      stroke_width=2, stroke_fill=(0, 0, 0, 200))
            y += note_lh

    return np.array(img)


def render_prompt_overlay() -> np.ndarray:
    """Pre-render the 'Did you get it? 👇' prompt near the bottom."""
    img  = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    text  = "Did you get it?"
    font  = _load_font(PROMPT_FONT_SIZE)
    lines = _wrap(text, font, DRAW_WIDTH)
    lh    = int(PROMPT_FONT_SIZE * LINE_SPACING)
    _draw_text_block(draw, lines, font, CENTER_X,
                     int(HEIGHT * PROMPT_Y_FRAC), lh, PROMPT_COLOR, alpha=220)
    return np.array(img)


# ── Main video builder ─────────────────────────────────────────────────────────

def create_video(
    problem: dict,
    output_path: str,
    music_path: str | None = MUSIC_FOLDER,
    music_volume: float = MUSIC_VOLUME,
    narration: bool = True,
) -> None:
    print(f'\nRendering: "{problem["question"][:70]}"')

    # Background
    bg_arr   = load_background(problem)
    bg_float = bg_arr.astype(np.float32)

    # Pre-render overlays
    p1_rgba  = render_phase1_overlay(problem)
    p1_float = p1_rgba[:, :, :3].astype(np.float32)
    p1_alpha = p1_rgba[:, :, 3:4].astype(np.float32) / 255.0

    ans_rgba  = render_answer_overlay(problem)
    ans_float = ans_rgba[:, :, :3].astype(np.float32)
    ans_alpha = ans_rgba[:, :, 3:4].astype(np.float32) / 255.0

    prompt_rgba  = render_prompt_overlay()
    prompt_float = prompt_rgba[:, :, :3].astype(np.float32)
    prompt_alpha = prompt_rgba[:, :, 3:4].astype(np.float32) / 255.0

    # Audio — build narration + background music mix
    audio     = None
    _tmp_narr = None
    audio_clips = []

    # Narration (phase 1 only)
    if narration:
        _tmp_narr = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
        _tmp_narr.close()
        print(f"  Narration  : generating TTS...")
        if generate_narration(problem, _tmp_narr.name):
            narr_clip = AudioFileClip(_tmp_narr.name).with_volume_scaled(TTS_VOLUME)
            if narr_clip.duration > REVEAL_T:
                narr_clip = narr_clip.subclipped(0, REVEAL_T)
            audio_clips.append(narr_clip)

    # Background music (ducked while narrating, normal otherwise)
    if music_path:
        resolved = _resolve_music(music_path)
        if resolved:
            vol = MUSIC_DUCK_SCALE if audio_clips else music_volume
            bg_clip = _loop_audio(AudioFileClip(resolved), DURATION).with_volume_scaled(vol)
            audio_clips.append(bg_clip)

    if len(audio_clips) > 1:
        audio = CompositeAudioClip(audio_clips)
    elif audio_clips:
        audio = audio_clips[0]

    print(f"  Duration   : {DURATION:.0f}s  (answer reveals at {REVEAL_T:.0f}s)")
    print(f"  Output     : {output_path}\n")

    total_frames = int(DURATION * FPS)
    _rendered    = [0]

    def make_frame(t: float) -> np.ndarray:
        # Phase 1 overlay: hook + question, fades in at start
        hook_fade = min(1.0, t / HOOK_FADE) if HOOK_FADE > 0 else 1.0
        eff_p1    = p1_alpha * hook_fade
        frame     = bg_float * (1.0 - eff_p1) + p1_float * eff_p1

        # Phase 2 overlay: answer fades in after REVEAL_T
        if t >= REVEAL_T:
            ans_fade = min(1.0, (t - REVEAL_T) / ANSWER_FADE)
            eff_ans  = ans_alpha * ans_fade
            frame    = frame * (1.0 - eff_ans) + ans_float * eff_ans

            # Prompt fades in alongside answer
            eff_pr = prompt_alpha * ans_fade
            frame  = frame * (1.0 - eff_pr) + prompt_float * eff_pr

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

    # Cleanup temp narration file
    if _tmp_narr is not None:
        try:
            os.unlink(_tmp_narr.name)
        except OSError:
            pass

    print()
    print(f"\nDone! Saved to: {output_path}")


# ── CLI ────────────────────────────────────────────────────────────────────────

def load_problems() -> list[dict]:
    p = Path(PROBLEMS_FILE)
    if not p.exists():
        sys.exit(f"Error: '{PROBLEMS_FILE}' not found.")
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def _make_output_path(index: int, problem: dict) -> str:
    out_dir = Path(VIDEO_OUTPUT_FOLDER)
    out_dir.mkdir(parents=True, exist_ok=True)
    pid  = problem.get("id", "unknown")
    safe = re.sub(r"[^a-zA-Z0-9 _-]", "", problem["question"])
    safe = safe.strip().replace(" ", "_")[:40]
    return str(out_dir / f"math_{index:04d}_{pid}_{safe}.mp4")


def main():
    parser = argparse.ArgumentParser(description="Render a Math Challenge Short.")
    parser.add_argument("--index",        type=int,   default=0)
    parser.add_argument("--music",        default=MUSIC_FOLDER)
    parser.add_argument("--music-volume", type=float, default=MUSIC_VOLUME)
    parser.add_argument("--out",          default=None)
    parser.add_argument("--list",         action="store_true")
    parser.add_argument("--no-narration", action="store_true",
                        help="Skip TTS narration, use music only")
    args = parser.parse_args()

    problems = load_problems()

    if args.list:
        print(f"\n{'#':<6} {'ID':<12} {'Category':<22} {'Difficulty':<10} Question")
        print("-" * 90)
        for i, p in enumerate(problems):
            cat  = (p.get("category") or "")[:20]
            diff = (p.get("difficulty") or "")[:8]
            print(f"{i:<6} {p.get('id',''):<12} {cat:<22} {diff:<10} {p['question'][:45]}")
        print(f"\n{len(problems)} problems total.")
        return

    if args.index >= len(problems):
        sys.exit(f"Error: index {args.index} out of range (bank has {len(problems)} problems).")

    problem = problems[args.index]
    output  = args.out or _make_output_path(args.index, problem)

    create_video(
        problem=problem,
        output_path=output,
        music_path=args.music,
        music_volume=args.music_volume,
        narration=not args.no_narration,
    )


if __name__ == "__main__":
    main()
