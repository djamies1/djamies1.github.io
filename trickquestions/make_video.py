#!/usr/bin/env python3
"""
make_video.py — Render a 20-second Trick Questions Short.

Produces a 1080x1920 portrait MP4 with two phases:
  Phase 1 (0 → REVEAL_T):   Hook text at top + question centred
  Phase 2 (REVEAL_T → END): Answer fades in below question in gold + explanation note

Same reveal mechanic as math pipeline — different colour palette (gold/amber)
to give the channel its own visual identity.

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
REVEAL_T     = 13.0
ANSWER_FADE  = 1.5
HOOK_FADE    = 0.4

# ── Layout ────────────────────────────────────────────────────────────────────
PADDING_X       = 80
PADDING_X_RIGHT = 180
DRAW_WIDTH      = WIDTH - PADDING_X - PADDING_X_RIGHT
CENTER_X        = PADDING_X + DRAW_WIDTH // 2

HOOK_Y_FRAC          = 0.13
QUESTION_CENTER_FRAC = 0.40
ANSWER_CENTER_FRAC   = 0.71
PROMPT_Y_FRAC        = 0.82

# ── Appearance — gold/amber trivia palette ─────────────────────────────────────
HOOK_COLOR      = (255, 190, 40)    # warm amber
QUESTION_COLOR  = (255, 255, 255)   # white
ANSWER_COLOR    = (255, 215, 0)     # gold — distinct from math's green
NOTE_COLOR      = (210, 210, 210)   # light grey
PROMPT_COLOR    = (255, 255, 255)
SHADOW_COLOR    = (0, 0, 0)

HOOK_FONT_SIZE    = 50
QUESTION_FONT_MAX = 82
QUESTION_FONT_MIN = 26
ANSWER_FONT_SIZE  = 72
NOTE_FONT_SIZE    = 40
PROMPT_FONT_SIZE  = 44
LINE_SPACING      = 1.4

OVERLAY_OPACITY = 175

POLLINATIONS_URL = (
    "https://image.pollinations.ai/prompt/{prompt}"
    "?width=1080&height=1920&nologo=true&seed={seed}"
)
IMAGE_TIMEOUT = 90

# ── Audio ─────────────────────────────────────────────────────────────────────
MUSIC_FOLDER = str(Path(__file__).resolve().parent / "tq_music")
MUSIC_VOLUME = 0.45

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
]
BODY_FONTS = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/PlayfairDisplay-Regular.ttf",
    "C:/Windows/Fonts/georgia.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/calibri.ttf",
]


# ── Font loading ───────────────────────────────────────────────────────────────

def _load_font(size: int, display: bool = False) -> ImageFont.FreeTypeFont:
    for path in (DISPLAY_FONTS if display else BODY_FONTS):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()


# ── Text helpers ───────────────────────────────────────────────────────────────

def _wrap(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
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


def _draw_text_block(draw, lines, font, cx, cy, lh, color, alpha=255):
    y = cy - len(lines)*lh // 2
    for line in lines:
        w = int(draw.textlength(line, font=font))
        x = cx - w // 2
        draw.text((x, y), line, font=font, fill=(*color, alpha),
                  stroke_width=3, stroke_fill=(0, 0, 0, 255))
        y += lh


def _block_size(lines, font, lh):
    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    w = max((int(dummy.textlength(l, font=font)) for l in lines), default=0)
    return w, len(lines) * lh


def _draw_panel(draw, cx, cy, bw, bh, color=(0,0,0), alpha=145, radius=22, px=44, py=24):
    x0, y0 = int(cx - bw//2 - px), int(cy - bh//2 - py)
    x1, y1 = int(cx + bw//2 + px), int(cy + bh//2 + py)
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=(*color, alpha))


# ── Background ─────────────────────────────────────────────────────────────────

def load_local_background() -> np.ndarray:
    import random
    folder = Path(BACKGROUND_FOLDER)
    exts   = {".jpg", ".jpeg", ".png", ".webp"}
    images = [f for f in folder.iterdir() if f.suffix.lower() in exts]
    if not images:
        print("  Background : no images — using solid dark background")
        return np.full((HEIGHT, WIDTH, 3), (14, 12, 20), dtype=np.uint8)
    chosen = random.choice(images)
    print(f"  Background : {chosen.name}")
    img   = Image.open(chosen).convert("RGB")
    scale = max(WIDTH / img.width, HEIGHT / img.height)
    new_w, new_h = int(img.width * scale), int(img.height * scale)
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
    keywords = " ".join(item.get("question", "").split()[:6])
    cat = item.get("category", "brain teaser")
    return (f"bright vivid colorful mind-bending background, brain teaser, "
            f"{cat}, {keywords}, curiosity, vibrant, engaging, digital art")


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

def _loop_audio(clip, duration):
    if clip.duration >= duration:
        return clip.subclipped(0, duration)
    repeats = int(duration / clip.duration) + 1
    return concatenate_audioclips([clip] * repeats).subclipped(0, duration)


def _resolve_music(path):
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
    hook = item.get("hook", "Most people get this wrong!")
    return f"{hook}. {item['question']}"


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

def _fit_question(question: str):
    zone_h = int(HEIGHT * 0.34)
    for size in range(QUESTION_FONT_MAX, QUESTION_FONT_MIN - 1, -2):
        font  = _load_font(size, display=True)
        lines = _wrap(question, font, DRAW_WIDTH)
        lh    = int(size * LINE_SPACING)
        if len(lines) * lh <= zone_h:
            return font, lines, lh
    font  = _load_font(QUESTION_FONT_MIN, display=True)
    lines = _wrap(question, font, DRAW_WIDTH)
    return font, lines, int(QUESTION_FONT_MIN * LINE_SPACING)


def render_phase1_overlay(question: dict) -> np.ndarray:
    img  = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    hook = question.get("hook", "Most people get this wrong!")

    h_font  = _load_font(HOOK_FONT_SIZE, display=True)
    h_lines = _wrap(hook, h_font, DRAW_WIDTH)
    h_lh    = int(HOOK_FONT_SIZE * LINE_SPACING)
    hw, hh = _block_size(h_lines, h_font, h_lh)
    _draw_panel(draw, CENTER_X, int(HEIGHT * HOOK_Y_FRAC), hw, hh)
    _draw_text_block(draw, h_lines, h_font, CENTER_X,
                     int(HEIGHT * HOOK_Y_FRAC), h_lh, HOOK_COLOR)

    q_font, q_lines, q_lh = _fit_question(question["question"])
    qw, qh = _block_size(q_lines, q_font, q_lh)
    _draw_panel(draw, CENTER_X, int(HEIGHT * QUESTION_CENTER_FRAC), qw, qh)
    _draw_text_block(draw, q_lines, q_font, CENTER_X,
                     int(HEIGHT * QUESTION_CENTER_FRAC), q_lh, QUESTION_COLOR)

    return np.array(img)


def render_answer_overlay(question: dict) -> np.ndarray:
    img  = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    answer = f"✓ {question['answer']}"
    note   = question.get("answer_note", "")

    ans_font  = _load_font(ANSWER_FONT_SIZE, display=True)
    ans_lines = _wrap(answer, ans_font, DRAW_WIDTH)
    ans_lh    = int(ANSWER_FONT_SIZE * LINE_SPACING)

    note_font  = _load_font(NOTE_FONT_SIZE)
    note_lines = _wrap(note, note_font, DRAW_WIDTH) if note else []
    note_lh    = int(NOTE_FONT_SIZE * LINE_SPACING)

    total_h = len(ans_lines) * ans_lh
    if note_lines:
        total_h += 20 + len(note_lines) * note_lh

    ans_cy = int(HEIGHT * ANSWER_CENTER_FRAC)
    pw = max(_block_size(ans_lines, ans_font, ans_lh)[0],
             _block_size(note_lines, note_font, note_lh)[0] if note_lines else 0)
    _draw_panel(draw, CENTER_X, ans_cy, pw, total_h, py=28)
    y = ans_cy - total_h // 2

    for line in ans_lines:
        w = int(draw.textlength(line, font=ans_font))
        x = CENTER_X - w // 2
        draw.text((x, y), line, font=ans_font, fill=(*ANSWER_COLOR, 255),
                  stroke_width=3, stroke_fill=(0, 0, 0, 255))
        y += ans_lh

    if note_lines:
        y += 20
        for line in note_lines:
            w = int(draw.textlength(line, font=note_font))
            x = CENTER_X - w // 2
            draw.text((x, y), line, font=note_font, fill=(*NOTE_COLOR, 225),
                      stroke_width=2, stroke_fill=(0, 0, 0, 200))
            y += note_lh

    return np.array(img)


def render_prompt_overlay() -> np.ndarray:
    img  = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    font  = _load_font(PROMPT_FONT_SIZE)
    lines = _wrap("Did you know? Comment below!", font, DRAW_WIDTH)
    lh    = int(PROMPT_FONT_SIZE * LINE_SPACING)
    _draw_text_block(draw, lines, font, CENTER_X,
                     int(HEIGHT * PROMPT_Y_FRAC), lh, PROMPT_COLOR, alpha=215)
    return np.array(img)


# ── Main video builder ─────────────────────────────────────────────────────────

def create_video(
    question: dict,
    output_path: str,
    music_path: str | None = MUSIC_FOLDER,
    music_volume: float = MUSIC_VOLUME,
    narration: bool = True,
) -> None:
    print(f'\nRendering: "{question["question"][:70]}"')

    bg_arr   = load_background(question)
    bg_float = bg_arr.astype(np.float32)

    p1_rgba  = render_phase1_overlay(question)
    p1_float = p1_rgba[:, :, :3].astype(np.float32)
    p1_alpha = p1_rgba[:, :, 3:4].astype(np.float32) / 255.0

    ans_rgba  = render_answer_overlay(question)
    ans_float = ans_rgba[:, :, :3].astype(np.float32)
    ans_alpha = ans_rgba[:, :, 3:4].astype(np.float32) / 255.0

    prompt_rgba  = render_prompt_overlay()
    prompt_float = prompt_rgba[:, :, :3].astype(np.float32)
    prompt_alpha = prompt_rgba[:, :, 3:4].astype(np.float32) / 255.0

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
            if narr_clip.duration > REVEAL_T:
                narr_clip = narr_clip.subclipped(0, REVEAL_T)
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

    print(f"  Duration   : {DURATION:.0f}s  (answer at {REVEAL_T:.0f}s)")
    print(f"  Output     : {output_path}\n")

    total_frames = int(DURATION * FPS)
    _rendered    = [0]

    def make_frame(t: float) -> np.ndarray:
        hook_fade = min(1.0, t / HOOK_FADE) if HOOK_FADE > 0 else 1.0
        eff_p1    = p1_alpha * hook_fade
        frame     = bg_float * (1.0 - eff_p1) + p1_float * eff_p1

        if t >= REVEAL_T:
            ans_fade = min(1.0, (t - REVEAL_T) / ANSWER_FADE)
            eff_ans  = ans_alpha * ans_fade
            frame    = frame * (1.0 - eff_ans) + ans_float * eff_ans
            eff_pr   = prompt_alpha * ans_fade
            frame    = frame * (1.0 - eff_pr) + prompt_float * eff_pr

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
    safe = re.sub(r"[^a-zA-Z0-9 _-]", "", question["question"])
    safe = safe.strip().replace(" ", "_")[:40]
    return str(out_dir / f"tq_{index:04d}_{qid}_{safe}.mp4")


def main():
    parser = argparse.ArgumentParser(description="Render a Trick Questions Short.")
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
        print(f"\n{'#':<6} {'ID':<12} {'Category':<20} {'Diff':<8} Question")
        print("-" * 90)
        for i, q in enumerate(questions):
            cat  = (q.get("category") or "")[:18]
            diff = (q.get("difficulty") or "")[:6]
            print(f"{i:<6} {q.get('id',''):<12} {cat:<20} {diff:<8} {q['question'][:45]}")
        print(f"\n{len(questions)} questions total.")
        return

    if args.index >= len(questions):
        sys.exit(f"Error: index {args.index} out of range.")

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
