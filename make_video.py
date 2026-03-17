"""
nosleep scrolling video generator
Reads nosleep_stories.json and renders a short-form (9:16) scrolling text MP4
with TTS narration and optional background music.

Requirements:
    pip install moviepy Pillow edge-tts numpy pedalboard

Usage:
    python make_video.py --index 0                       # single story with narration (default)
    python make_video.py --all                           # render every story with narration
    python make_video.py --index 0 --no-narration        # scroll only, no audio
    python make_video.py --index 0 --music spooky.mp3
    python make_video.py --index 0 --voice en-US-JennyNeural
    python make_video.py --index 0 --no-reverb
    python make_video.py --index 0 --max-words 400
    python make_video.py --list
    python make_video.py --list-voices

Narration is ON by default. Scroll speed is automatically matched to narration
duration so the text and audio finish at the same time (capped at 3 minutes).
Pass --no-narration for a silent scroll-only video.
"""

import argparse
import asyncio
import json
import math
import random
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy import AudioFileClip, CompositeAudioClip, VideoClip, concatenate_audioclips

# ── Video dimensions (portrait 9:16 for Shorts / Reels / TikTok) ────────────
WIDTH = 1080
HEIGHT = 1920
FPS = 30

# ── Appearance ───────────────────────────────────────────────────────────────
BG_COLOR = (10, 10, 10)          # near-black background
TITLE_COLOR = (210, 50, 50)      # red title
TEXT_COLOR = (220, 220, 220)     # light grey body text
PADDING_X_LEFT  = 80             # left margin in pixels
PADDING_X_RIGHT = 180            # right margin — extra space for YouTube Shorts UI buttons
TITLE_FONT_SIZE = 72
BODY_FONT_SIZE = 46
LINE_SPACING = 1.5               # multiplier on font size
PARAGRAPH_GAP = 70               # extra pixels of space between paragraphs

# ── Scroll ────────────────────────────────────────────────────────────────────
DEFAULT_SCROLL_SPEED = 50        # pixels per second
MAX_VIDEO_DURATION   = 180       # seconds — YouTube Shorts limit (3 minutes)

# ── Audio ─────────────────────────────────────────────────────────────────────
DEFAULT_VOICE        = "en-GB-RyanNeural"   # British male — dramatic, works well for horror
DEFAULT_FEMALE_VOICE = "en-GB-SoniaNeural"  # British female — matches Ryan's accent
DEFAULT_TTS_RATE  = "-25%"              # speaking speed relative to normal (-25% = slower)
DEFAULT_TTS_PITCH = "-10Hz"            # voice pitch adjustment (-10Hz = noticeably lower)
DEFAULT_REVERB    = True                # apply subtle reverb to narration by default
MUSIC_FOLDER      = "horror_music"      # folder of music tracks to pick from randomly
MUSIC_VOLUME      = 0.15               # background music level (0.0–1.0)

# A few good voices to try:
#   en-GB-RyanNeural         — British male, dramatic (default male)
#   en-GB-SoniaNeural        — British female (default female)
#   en-US-ChristopherNeural  — deep, calm male
#   en-US-GuyNeural          — neutral male
#   en-US-JennyNeural        — clear female
#   en-GB-SoniaNeural        — British female


# ── Font loading ─────────────────────────────────────────────────────────────

WINDOWS_FONTS = [
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/calibri.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
]

# Body font — Roboto Regular
BODY_FONTS = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/Roboto-Regular.ttf",  # per-user install (static)
    "C:/Windows/Fonts/Roboto-Regular.ttf",   # system-wide install
    "C:/Users/prawn/Downloads/Creepster,Roboto/Roboto/static/Roboto-Regular.ttf",
]
BODY_FONTS_ITALIC = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/Roboto-Italic.ttf",
    "C:/Windows/Fonts/Roboto-Italic.ttf",
    "C:/Users/prawn/Downloads/Creepster,Roboto/Roboto/static/Roboto-Italic.ttf",
    "C:/Windows/Fonts/ariali.ttf",
]
BODY_FONTS_BOLD = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/Roboto-Bold.ttf",
    "C:/Windows/Fonts/Roboto-Bold.ttf",
    "C:/Users/prawn/Downloads/Creepster,Roboto/Roboto/static/Roboto-Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]
BODY_FONTS_BOLD_ITALIC = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/Roboto-BoldItalic.ttf",
    "C:/Windows/Fonts/Roboto-BoldItalic.ttf",
    "C:/Users/prawn/Downloads/Creepster,Roboto/Roboto/static/Roboto-BoldItalic.ttf",
    "C:/Windows/Fonts/arialbi.ttf",
]
WINDOWS_FONTS_BOLD = [
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/calibrib.ttf",
    "C:/Windows/Fonts/segoeuib.ttf",
]

# Display font used for title and end card — creepy style
DISPLAY_FONTS = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/October Crow.ttf",  # per-user install
    "C:/Windows/Fonts/October Crow.ttf",                                       # system-wide install
    "October Crow.ttf",                                                         # fallback: same folder as script
]

def _load_font(size: int, bold: bool = False, display: bool = False,
               body: bool = False, italic: bool = False, bold_italic: bool = False) -> ImageFont.FreeTypeFont:
    if display:
        for path in DISPLAY_FONTS:
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                pass
        print("  Warning: October Crow font not found, falling back to bold Arial.")
    if body:
        if bold_italic:
            paths = BODY_FONTS_BOLD_ITALIC
        elif italic:
            paths = BODY_FONTS_ITALIC
        elif bold:
            paths = BODY_FONTS_BOLD
        else:
            paths = BODY_FONTS
        for path in paths:
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                pass
        print(f"  Warning: Roboto variant not found, falling back to system font.")
    paths = WINDOWS_FONTS_BOLD if bold else WINDOWS_FONTS
    for path in paths:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()


# ── Text helpers ─────────────────────────────────────────────────────────────

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


# ── Inline markdown helpers ───────────────────────────────────────────────────
# Each word is tagged as (text, bold, italic, strikethrough)
Word = tuple[str, bool, bool, bool]

def _parse_inline(text: str) -> list[Word]:
    """
    Parse inline markdown into (word, bold, italic, strikethrough) tuples.
    Supports: ***bold italic***, **bold**, *italic*, _italic_, ~~strikethrough~~.
    Strips: ^superscript, `code` markers.
    """
    import re
    text = re.sub(r'\^(\S+)', '', text)       # remove superscript
    text = re.sub(r'`(.*?)`', r'\1', text)    # strip code backticks

    # Split on markdown spans, longest match first
    pattern = r'(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|~~~.*?~~~|~~.*?~~|_.*?_)'
    segments = re.split(pattern, text, flags=re.DOTALL)

    result: list[Word] = []
    for seg in segments:
        if seg.startswith('***') and seg.endswith('***'):
            bold, italic, strike = True, True, False
            inner = seg[3:-3]
        elif seg.startswith('**') and seg.endswith('**'):
            bold, italic, strike = True, False, False
            inner = seg[2:-2]
        elif seg.startswith('*') and seg.endswith('*'):
            bold, italic, strike = False, True, False
            inner = seg[1:-1]
        elif seg.startswith('~~') and seg.endswith('~~'):
            bold, italic, strike = False, False, True
            inner = seg[2:-2]
        elif seg.startswith('_') and seg.endswith('_'):
            bold, italic, strike = False, True, False
            inner = seg[1:-1]
        else:
            bold, italic, strike = False, False, False
            inner = seg

        for word in inner.split():
            result.append((word, bold, italic, strike))

    return result


def _strip_markdown(text: str) -> str:
    """Strip markdown formatting symbols for clean TTS — keeps the words, drops the syntax."""
    import re
    text = re.sub(r'\^(\S+)', '', text)                                  # ^superscript
    text = re.sub(r'`(.*?)`', r'\1', text)                              # `code`
    text = re.sub(r'\*\*\*(.*?)\*\*\*', r'\1', text, flags=re.DOTALL)  # ***bold italic***
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text, flags=re.DOTALL)      # **bold**
    text = re.sub(r'\*(.*?)\*', r'\1', text, flags=re.DOTALL)          # *italic*
    text = re.sub(r'~~(.*?)~~', r'\1', text, flags=re.DOTALL)          # ~~strikethrough~~
    text = re.sub(r'_(.*?)_', r'\1', text, flags=re.DOTALL)            # _italic_
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)              # [link](url)
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)         # # headings
    text = re.sub(r'^[-*]{3,}$', '', text, flags=re.MULTILINE)         # --- rules
    return text


def _pick_font(fonts: dict, bold: bool, italic: bool):
    if bold and italic:
        return fonts['bold_italic']
    if bold:
        return fonts['bold']
    if italic:
        return fonts['italic']
    return fonts['regular']


def _wrap_markup(text: str, fonts: dict, max_width: int):
    """
    Word-wrap markdown text respecting all inline formatting.
    Returns list of lines, each a list of Word tuples.
    """
    tagged_words = _parse_inline(text)
    if not tagged_words:
        return []

    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    space_w = dummy.textlength(' ', font=fonts['regular'])
    lines, current_line, current_w = [], [], 0.0

    for word in tagged_words:
        text_str, bold, italic, strike = word
        font = _pick_font(fonts, bold, italic)
        word_w = dummy.textlength(text_str, font=font)
        gap = space_w if current_line else 0
        if current_w + gap + word_w <= max_width:
            current_line.append(word)
            current_w += gap + word_w
        else:
            if current_line:
                lines.append(current_line)
            current_line = [word]
            current_w = word_w

    if current_line:
        lines.append(current_line)
    return lines


def _line_pixel_width(line: list[Word], fonts: dict) -> float:
    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    space_w = dummy.textlength(' ', font=fonts['regular'])
    total = sum(dummy.textlength(w, font=_pick_font(fonts, b, i)) for w, b, i, _ in line)
    return total + space_w * (len(line) - 1)


def _draw_markup_line(draw, line: list[Word], cx, y, fonts: dict, color, font_size: int):
    """Draw a markup line centered on cx, rendering bold/italic/strikethrough."""
    space_w = draw.textlength(' ', font=fonts['regular'])
    total_w = _line_pixel_width(line, fonts)
    x = cx - total_w / 2

    for j, (word, bold, italic, strike) in enumerate(line):
        font = _pick_font(fonts, bold, italic)
        draw.text((x, y), word, font=font, fill=color)
        word_w = draw.textlength(word, font=font)
        if strike:
            mid_y = y + font_size // 2
            draw.line([(x, mid_y), (x + word_w, mid_y)], fill=color, width=2)
        x += word_w
        if j < len(line) - 1:
            x += space_w


# ── Core rendering ────────────────────────────────────────────────────────────

SUBSCRIBE_TEXT = "Subscribe for more bedtime stories..."


BACKGROUND_FOLDER  = "background_images"  # folder of images to pick from randomly
DEFAULT_BACKGROUND = BACKGROUND_FOLDER    # can also be a single image file path
VIDEO_OUTPUT_FOLDER = "video_output"      # folder where rendered .mp4 files are saved
LOGO_CROP_BOTTOM = 70    # pixels to crop from bottom to remove watermark
OVERLAY_OPACITY = 140    # 0–255: how dark the overlay is (140 ≈ 55% black)


def _resolve_background(path: str) -> str:
    """
    If `path` is a directory, pick a random image from it and return its path.
    If `path` is a single file, return it as-is.
    Supported extensions: .jpg, .jpeg, .png, .webp, .bmp
    """
    p = Path(path)
    if p.is_dir():
        exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
        images = [f for f in p.iterdir() if f.suffix.lower() in exts]
        if not images:
            sys.exit(f"Error: no image files found in '{path}'.")
        chosen = random.choice(images)
        print(f"  Background : {chosen.name}  (randomly chosen from {len(images)} images in '{path}')")
        return str(chosen)
    return path


def _resolve_music(path: str) -> str | None:
    """
    If `path` is a directory, pick a random audio file from it and return its path.
    If `path` is a file, return it as-is.
    Returns None if the folder exists but is empty (so video still renders silently).
    Supported extensions: .mp3, .wav, .ogg, .flac, .m4a
    """
    p = Path(path)
    if p.is_dir():
        exts = {".mp3", ".wav", ".ogg", ".flac", ".m4a"}
        tracks = [f for f in p.iterdir() if f.suffix.lower() in exts]
        if not tracks:
            print(f"  Warning: no audio files found in '{path}' — skipping music")
            return None
        chosen = random.choice(tracks)
        print(f"  Music      : {chosen.name}  (randomly chosen from {len(tracks)} tracks in '{path}')")
        return str(chosen)
    return path


def load_background_image(path: str) -> np.ndarray:
    """
    Load and prepare a static background frame (WIDTH x HEIGHT).
    Crops the bottom watermark, resizes to fill the frame, then applies a dark overlay.
    Returns a (HEIGHT, WIDTH, 3) uint8 numpy array.
    """
    img = Image.open(path).convert("RGB")

    # Crop bottom to remove logo
    w, h = img.size
    img = img.crop((0, 0, w, h - LOGO_CROP_BOTTOM))

    # Scale to fill WIDTH x HEIGHT (cover), then center-crop
    scale = max(WIDTH / img.width, HEIGHT / img.height)
    new_w = int(img.width * scale)
    new_h = int(img.height * scale)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - WIDTH) // 2
    top = (new_h - HEIGHT) // 2
    img = img.crop((left, top, left + WIDTH, top + HEIGHT))

    # Dark overlay for text readability
    overlay = Image.new("RGBA", img.size, (0, 0, 0, OVERLAY_OPACITY))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    return np.array(img)


AUTHOR_FONT_SIZE = BODY_FONT_SIZE - 6   # slightly smaller than body
AUTHOR_COLOR     = (160, 160, 160)       # muted grey — understated credit


def render_story_image(title: str, author: str, body: str) -> tuple[Image.Image, int]:
    title_font  = _load_font(TITLE_FONT_SIZE, bold=True, display=True)
    author_font = _load_font(AUTHOR_FONT_SIZE, body=True, italic=True)
    body_fonts = {
        'regular':    _load_font(BODY_FONT_SIZE, body=True),
        'italic':     _load_font(BODY_FONT_SIZE, body=True, italic=True),
        'bold':       _load_font(BODY_FONT_SIZE, body=True, bold=True),
        'bold_italic':_load_font(BODY_FONT_SIZE, body=True, bold_italic=True),
    }
    draw_width = WIDTH - PADDING_X_LEFT - PADDING_X_RIGHT
    center_x = PADDING_X_LEFT + draw_width // 2

    title_lines     = _wrap(title, title_font, draw_width)
    subscribe_lines = _wrap(SUBSCRIBE_TEXT, title_font, draw_width)
    author_text     = f"by u/{author}"

    # Split body on paragraph breaks, wrap each paragraph with markup awareness
    raw_paragraphs = [p.strip() for p in body.split('\n\n') if p.strip()]
    if not raw_paragraphs:
        raw_paragraphs = [body]
    para_lines_list = [_wrap_markup(p, body_fonts, draw_width) for p in raw_paragraphs]

    lh_title  = int(TITLE_FONT_SIZE  * LINE_SPACING)
    lh_author = int(AUTHOR_FONT_SIZE * LINE_SPACING)
    lh_body   = int(BODY_FONT_SIZE   * LINE_SPACING)

    title_block_h     = len(title_lines) * lh_title
    author_block_h    = lh_author                     # single line
    subscribe_block_h = len(subscribe_lines) * lh_title

    body_height = (
        sum(len(lines) * lh_body for lines in para_lines_list)
        + PARAGRAPH_GAP * (len(para_lines_list) - 1)
    )

    # Center title + author credit together in the first visible frame
    header_block_h = title_block_h + 16 + author_block_h
    title_y  = HEIGHT // 2 - header_block_h // 2
    author_y = title_y + title_block_h + 16

    # Body starts just below the bottom edge of the first frame
    body_start_y = HEIGHT + 20

    # Total canvas: body start + body + gap + subscribe + trailing blank screen
    total_height = body_start_y + body_height + 120 + subscribe_block_h + HEIGHT

    img  = Image.new("RGBA", (WIDTH, total_height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Title — centered within safe area
    y = title_y
    for line in title_lines:
        w = draw.textlength(line, font=title_font)
        x = center_x - w // 2
        draw.text((x, y), line, font=title_font, fill=TITLE_COLOR)
        y += lh_title

    # Author credit — italic, centered, just below title
    aw = draw.textlength(author_text, font=author_font)
    draw.text((center_x - aw // 2, author_y), author_text, font=author_font, fill=AUTHOR_COLOR)

    # Body — starts just below the first visible frame, scrolls up into view
    y = body_start_y
    for i, para_lines in enumerate(para_lines_list):
        for line in para_lines:
            _draw_markup_line(draw, line, center_x, y, body_fonts, TEXT_COLOR, BODY_FONT_SIZE)
            y += lh_body
        if i < len(para_lines_list) - 1:
            y += PARAGRAPH_GAP
    y += 120

    # Subscribe text — centered within safe area
    subscribe_start_y = y
    for line in subscribe_lines:
        w = draw.textlength(line, font=title_font)
        x = center_x - w // 2
        draw.text((x, y), line, font=title_font, fill=TITLE_COLOR)
        y += lh_title

    subscribe_center_y = subscribe_start_y + subscribe_block_h // 2

    return img, subscribe_center_y


# ── TTS narration ─────────────────────────────────────────────────────────────

async def _tts(text: str, voice: str, path: str, rate: str, pitch: str) -> None:
    import edge_tts
    await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(path)


def generate_narration(text: str, voice: str, path: str,
                       rate: str = DEFAULT_TTS_RATE,
                       pitch: str = DEFAULT_TTS_PITCH) -> None:
    asyncio.run(_tts(text, voice, path, rate, pitch))


async def _list_voices() -> None:
    import edge_tts
    voices = await edge_tts.list_voices()
    en_voices = [v for v in voices if v["Locale"].startswith("en-")]
    print(f"\n{'Name':<35} {'Gender':<8} Locale")
    print("-" * 60)
    for v in sorted(en_voices, key=lambda x: x["ShortName"]):
        print(f"{v['ShortName']:<35} {v['Gender']:<8} {v['Locale']}")


# ── Audio helpers ─────────────────────────────────────────────────────────────

def _loop_audio(clip: AudioFileClip, duration: float) -> AudioFileClip:
    """Repeat `clip` until it covers `duration` seconds, then trim."""
    if clip.duration >= duration:
        return clip.subclipped(0, duration)
    repeats = int(duration / clip.duration) + 1
    return concatenate_audioclips([clip] * repeats).subclipped(0, duration)


def apply_audio_effects(input_path: str, output_path: str) -> None:
    """
    Apply subtle reverb to an audio file using pedalboard.
    Reads `input_path`, writes processed audio to `output_path` (WAV).
    Settings are tuned for a creepy, slightly cavernous narration sound.
    """
    from pedalboard import Pedalboard, Reverb, LowpassFilter  # type: ignore
    from pedalboard.io import AudioFile        # type: ignore

    with AudioFile(input_path) as f:
        audio = f.read(f.frames)
        sample_rate = f.samplerate

    board = Pedalboard([
        LowpassFilter(cutoff_frequency_hz=4000),  # muffle highs — distant/underground feel
        Reverb(
            room_size=0.65,    # large cavernous space
            damping=0.45,      # less damping — longer, brighter tail
            wet_level=0.28,    # more reverb in the mix
            dry_level=0.72,    # less dry signal
            freeze_mode=0.0,
        ),
    ])
    processed = board(audio, sample_rate)

    with AudioFile(output_path, "w", sample_rate, processed.shape[0]) as f:
        f.write(processed)


# ── Narrator gender detection ─────────────────────────────────────────────────

def _detect_narrator_gender(title: str, body: str) -> str:
    """
    Heuristically detect narrator gender from story text.
    Returns 'female', 'male', or 'neutral' (neutral defaults to male voice).

    Scoring approach — higher score wins:
      +2 per match  : strong relational indicators (my husband / my wife)
      +1 per match  : weaker relational indicators (my boyfriend / my girlfriend)
      +3 per match  : explicit self-identification ("I'm a woman", "as a man", etc.)
    """
    import re
    text = (title + " " + body).lower()

    female_score = 0
    male_score   = 0

    # Strong relational indicators
    female_score += len(re.findall(r'\bmy husband\b', text)) * 2
    male_score   += len(re.findall(r'\bmy wife\b', text)) * 2

    # Weaker relational indicators
    female_score += len(re.findall(r'\bmy boyfriend\b', text))
    male_score   += len(re.findall(r'\bmy girlfriend\b', text))

    # Explicit self-identification
    female_patterns = [
        r"\bi'?m a (woman|girl|lady|female|mother|mom)\b",
        r"\bi am a (woman|girl|lady|female|mother|mom)\b",
        r"\bas a (woman|girl|lady|female|mother|mom)\b",
        r"\bi'?m (pregnant|nursing)\b",
    ]
    male_patterns = [
        r"\bi'?m a (man|guy|boy|male|father|dad|dude|bloke)\b",
        r"\bi am a (man|guy|boy|male|father|dad)\b",
        r"\bas a (man|guy|boy|male|father|dad)\b",
    ]
    for p in female_patterns:
        female_score += len(re.findall(p, text)) * 3
    for p in male_patterns:
        male_score += len(re.findall(p, text)) * 3

    if female_score > male_score:
        return 'female'
    if male_score > female_score:
        return 'male'
    return 'neutral'


# ── TTS rate helpers ──────────────────────────────────────────────────────────

def _rate_to_multiplier(rate_str: str) -> float:
    """Convert edge-tts rate string to a speed multiplier.  '-15%' → 0.85, '+10%' → 1.10"""
    pct = float(rate_str.strip().lstrip('+').rstrip('%'))
    return 1.0 + pct / 100.0


def _multiplier_to_rate(mult: float) -> str:
    """Convert a speed multiplier back to an edge-tts rate string.  1.10 → '+10%', 0.85 → '-15%'"""
    pct = (mult - 1.0) * 100.0
    return f"{'+' if pct >= 0 else ''}{pct:.0f}%"


# ── Main video builder ────────────────────────────────────────────────────────

def create_video(
    story: dict,
    output_path: str,
    voice: str | None,
    music_path: str | None,
    music_volume: float,
    max_words: int | None,
    narration: bool = True,
    scroll_speed: int | None = None,
    background_path: str = DEFAULT_BACKGROUND,
    max_duration: float = MAX_VIDEO_DURATION,
    tts_rate: str = DEFAULT_TTS_RATE,
    tts_pitch: str = DEFAULT_TTS_PITCH,
    reverb: bool = DEFAULT_REVERB,
) -> None:
    if scroll_speed is None:
        scroll_speed = DEFAULT_SCROLL_SPEED
    title = story["title"]
    body = story["body"]

    if max_words:
        words = body.split()
        if len(words) > max_words:
            body = " ".join(words[:max_words]) + "..."
            print(f"  Trimmed body to {max_words} words")

    print(f'\nRendering: "{title}"')
    print(f"  Words  : {len(body.split())}")

    # Resolve music path (may be a folder — pick randomly)
    if music_path:
        music_path = _resolve_music(music_path)

    audio = None

    # ── Render image first so max_scroll is known before TTS ─────────────────
    background_path = _resolve_background(background_path)
    bg_arr = load_background_image(background_path)
    bg_float = bg_arr.astype(np.float32)

    author = story.get("author", "unknown")
    img, subscribe_center_y = render_story_image(title, author, body)
    text_arr = np.array(img)
    # Stop scrolling when the subscribe text is centred on screen
    max_scroll = max(0, subscribe_center_y - HEIGHT // 2)

    # Pre-convert entire text layer to float32 once — avoids per-frame conversions
    text_rgb_float = text_arr[:, :, :3].astype(np.float32)
    text_alpha     = text_arr[:, :, 3:4].astype(np.float32) / 255.0
    text_inv_alpha = 1.0 - text_alpha

    # Auto-select voice based on narrator gender unless overridden via --voice
    if voice is None:
        gender = _detect_narrator_gender(title, body)
        if gender == 'female':
            voice = DEFAULT_FEMALE_VOICE
            print(f"  Gender : female detected → {voice}")
        else:
            voice = DEFAULT_VOICE
            print(f"  Gender : {'neutral' if gender == 'neutral' else 'male'} detected → {voice}")
    else:
        print(f"  Voice  : {voice} (manual override)")

    reverb_path = None  # track extra temp file for cleanup
    if narration:
        effective_rate = tts_rate
        print(f"  Voice  : {voice}  (rate={effective_rate}, pitch={tts_pitch})")

        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
            tts_path = tmp.name

        print("  Generating narration... (this may take a moment)")
        generate_narration(f"{title}. {_strip_markdown(body)}", voice, tts_path,
                           rate=effective_rate, pitch=tts_pitch)

        _raw_clip = AudioFileClip(tts_path)
        raw_duration = _raw_clip.duration
        _raw_clip.close()

        # If narration is too long, speed up the voice to fit.
        # We target 6s under max_duration to leave headroom for reverb tail and
        # rate-string rounding — guaranteeing no speech content is ever clipped.
        tts_target = max_duration - 6
        if raw_duration > tts_target:
            speedup = raw_duration / tts_target
            new_mult = _rate_to_multiplier(effective_rate) * speedup
            effective_rate = _multiplier_to_rate(new_mult)
            print(f"  Narration too long ({raw_duration:.1f}s) — "
                  f"re-generating at {effective_rate} to fit under {max_duration:.0f}s")
            Path(tts_path).unlink(missing_ok=True)
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
                tts_path = tmp.name
            generate_narration(f"{title}. {_strip_markdown(body)}", voice, tts_path,
                               rate=effective_rate, pitch=tts_pitch)

            # Re-verify: rate-string rounding can still cause a small overrun.
            # If so, do one corrective pass targeting a harder floor.
            _verify = AudioFileClip(tts_path)
            regen_duration = _verify.duration
            _verify.close()
            if regen_duration > tts_target:
                speedup2 = regen_duration / (tts_target - 3)
                new_mult2 = _rate_to_multiplier(effective_rate) * speedup2
                effective_rate = _multiplier_to_rate(new_mult2)
                Path(tts_path).unlink(missing_ok=True)
                with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
                    tts_path = tmp.name
                print(f"  Correcting rate rounding — re-generating at {effective_rate}")
                generate_narration(f"{title}. {_strip_markdown(body)}", voice, tts_path,
                                   rate=effective_rate, pitch=tts_pitch)

        # Optionally apply reverb post-processing
        if reverb:
            print("  Applying reverb...")
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp2:
                reverb_path = tmp2.name
            apply_audio_effects(tts_path, reverb_path)
            narration_clip = AudioFileClip(reverb_path)
        else:
            narration_clip = AudioFileClip(tts_path)

        duration = narration_clip.duration
        # Hard-clamp to max_duration: rate-string rounding and reverb tail can both
        # push the final clip slightly over the limit even after the speedup pass.
        if duration > max_duration:
            duration = max_duration
            narration_clip = narration_clip.subclipped(0, duration)
        print(f"  Duration : {duration:.1f}s  ({duration/60:.1f} min)")

        # Scroll speed exactly matches narration — text and audio finish together
        scroll_speed = max_scroll / duration
        print(f"  Scroll speed : {scroll_speed:.1f} px/s (auto)")

        if music_path:
            bg = AudioFileClip(music_path)
            bg = _loop_audio(bg, duration).with_volume_scaled(music_volume)
            audio = CompositeAudioClip([narration_clip, bg])
        else:
            audio = narration_clip
    else:
        print("  Narration : off")
        # Auto-increase speed if needed to stay within max_duration
        min_speed = max_scroll / max_duration
        if scroll_speed < min_speed:
            scroll_speed = math.ceil(min_speed)
            print(f"  Speed adjusted to {scroll_speed} px/s to fit within {max_duration:.0f}s")
        duration = min(max_scroll / scroll_speed, max_duration)
        print(f"  Scroll speed : {scroll_speed} px/s")
        print(f"  Duration : {duration:.1f}s  ({duration/60:.1f} min)")
        if music_path:
            bg = AudioFileClip(music_path)
            bg = _loop_audio(bg, duration).with_volume_scaled(music_volume)
            audio = bg

    print(f"  Output : {output_path}\n")

    total_frames = int(duration * FPS)
    _rendered = [0]

    def make_frame(t: float):
        y = min(int(t * scroll_speed), max_scroll)
        _rendered[0] += 1
        if _rendered[0] % 30 == 0 or _rendered[0] == total_frames:
            pct = _rendered[0] / total_frames * 100
            print(f"\r  Rendering : {pct:.0f}%  ({_rendered[0]}/{total_frames} frames)", end="", flush=True)
        return (bg_float * text_inv_alpha[y:y+HEIGHT] + text_rgb_float[y:y+HEIGHT] * text_alpha[y:y+HEIGHT]).astype(np.uint8)

    clip = VideoClip(make_frame, duration=duration)
    if audio is not None:
        clip = clip.with_audio(audio)

    clip.write_videofile(
        output_path,
        fps=FPS,
        codec="libx264",
        audio_codec="aac",
        logger=None,
    )
    print()  # end the progress line

    if narration:
        Path(tts_path).unlink(missing_ok=True)
        if reverb_path:
            Path(reverb_path).unlink(missing_ok=True)
    print(f"\nDone! Saved to: {output_path}")


# ── CLI ───────────────────────────────────────────────────────────────────────

def load_stories(json_path: str) -> list[dict]:
    path = Path(json_path)
    if not path.exists():
        sys.exit(f"Error: '{json_path}' not found. Run scrape_nosleep.py first.")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if not data:
        sys.exit("Error: JSON file contains no stories.")
    return data


def main():
    parser = argparse.ArgumentParser(
        description="Generate a scrolling nosleep video with narration and music."
    )
    parser.add_argument("--json", default="nosleep_stories.json")
    parser.add_argument("--index", type=int, default=0, help="Story index (default: 0)")
    parser.add_argument("--voice", default=None, help="edge-tts voice name (default: auto-detected from narrator gender)")
    parser.add_argument("--music", default=MUSIC_FOLDER, help="Path to a music file or folder to pick from randomly (default: '%(default)s')")
    parser.add_argument(
        "--music-volume", type=float, default=MUSIC_VOLUME,
        help=f"Background music volume 0.0–1.0 (default: {MUSIC_VOLUME})"
    )
    parser.add_argument(
        "--max-words", type=int, default=None,
        help="Trim story body to this many words (useful for short-form clips)"
    )
    parser.add_argument(
        "--tts-rate", default=DEFAULT_TTS_RATE,
        help="TTS speaking rate, e.g. -20%% for slower, +10%% for faster (default: %(default)s)"
    )
    parser.add_argument(
        "--tts-pitch", default=DEFAULT_TTS_PITCH,
        help="TTS pitch offset, e.g. -10Hz for lower, +5Hz for higher (default: %(default)s)"
    )
    parser.add_argument(
        "--no-reverb", action="store_true",
        help="Disable reverb post-processing on narration (reverb is on by default)"
    )
    parser.add_argument(
        "--no-narration", action="store_true", dest="no_narration",
        help="Disable TTS narration (narration is on by default)"
    )
    parser.add_argument(
        "--speed", type=int, default=DEFAULT_SCROLL_SPEED,
        help=f"Scroll speed in px/s when --no-narration is used (default: {DEFAULT_SCROLL_SPEED})"
    )
    parser.add_argument(
        "--max-duration", type=float, default=MAX_VIDEO_DURATION,
        help=f"Maximum video length in seconds (default: {MAX_VIDEO_DURATION}). Speed is auto-increased to fit."
    )
    parser.add_argument(
        "--background", default=DEFAULT_BACKGROUND,
        help=f"Path to a background image file, or a folder to pick from randomly (default: '{DEFAULT_BACKGROUND}')"
    )
    parser.add_argument("--out", default=None, help="Output .mp4 filename (single story only, ignored with --all)")
    parser.add_argument("--all", action="store_true", help="Generate videos for every story in the JSON file")
    parser.add_argument("--list", action="store_true", help="List stories and exit")
    parser.add_argument("--list-voices", action="store_true", help="List available English TTS voices")
    args = parser.parse_args()

    if args.list_voices:
        asyncio.run(_list_voices())
        return

    stories = load_stories(args.json)

    if args.list:
        print(f"{'#':<4} {'Score':<7} {'Words':<7} Title")
        print("-" * 72)
        for i, s in enumerate(stories):
            print(f"{i:<4} {s['score']:<7} {s['word_count']:<7} {s['title'][:55]}")
        return

    out_dir = Path(VIDEO_OUTPUT_FOLDER)
    out_dir.mkdir(parents=True, exist_ok=True)

    def _make_output(index: int, story: dict) -> str:
        post_id = story.get("id", "unknown")
        safe = "".join(c if c.isalnum() or c in " _-" else "" for c in story["title"])
        safe = safe.strip().replace(" ", "_")[:30]
        return str(out_dir / f"nosleep_{index:02d}_{post_id}_{safe}.mp4")

    def _run(index: int, story: dict, output: str) -> None:
        create_video(
            story=story,
            output_path=output,
            voice=args.voice,
            music_path=args.music,
            music_volume=args.music_volume,
            max_words=args.max_words,
            narration=not args.no_narration,
            scroll_speed=args.speed,
            background_path=args.background,
            max_duration=args.max_duration,
            tts_rate=args.tts_rate,
            tts_pitch=args.tts_pitch,
            reverb=not args.no_reverb,
        )

    if args.all:
        print(f"Batch mode: generating {len(stories)} videos...\n")
        for i, story in enumerate(stories):
            # Match by post ID so re-sorting after a re-scrape doesn't re-render existing videos
            existing = list(out_dir.glob(f"nosleep_*_{story['id']}_*.mp4"))
            if existing:
                print(f"  [{i+1}/{len(stories)}] Skipping (already exists): {existing[0].name}")
                continue
            output = _make_output(i, story)
            print(f"  [{i+1}/{len(stories)}] Starting: {output}")
            _run(i, story, output)
        print(f"\nAll done! {len(stories)} videos processed.")
    else:
        if args.index >= len(stories):
            sys.exit(f"Error: index {args.index} out of range ({len(stories)} stories available).")
        story = stories[args.index]
        output = args.out if args.out else _make_output(args.index, story)
        if Path(output).exists():
            print(f"Skipping (already exists): {output}")
            return
        _run(args.index, story, output)


if __name__ == "__main__":
    main()
