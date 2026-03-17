"""
TwoSentenceHorror video generator

Renders a static 9:16 portrait MP4 with:
  - AI-generated background image from Pollinations.ai (themed to the story)
  - Title displayed immediately (no fade)
  - Body text fading in synchronized with TTS narration (slightly slower)
  - TTS narration: title spoken first, then body
  - Optional background music and reverb

Usage:
    python make_video.py --index 0
    python make_video.py --index 0 --no-reverb
    python make_video.py --index 0 --no-narration
    python make_video.py --list
"""

import argparse
import asyncio
import io
import json
import re
import sys
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy import AudioFileClip, CompositeAudioClip, VideoClip, concatenate_audioclips

# ── Video dimensions ──────────────────────────────────────────────────────────
WIDTH  = 1080
HEIGHT = 1920
FPS    = 30

# ── Layout ────────────────────────────────────────────────────────────────────
PADDING_X           = 80
PADDING_X_RIGHT     = 180     # extra right margin for YouTube UI buttons
TITLE_CENTER_Y_FRAC = 0.28   # title block vertically centred at this fraction
BODY_CENTER_Y_FRAC  = 0.64   # body block vertically centred at this fraction

# ── Appearance ────────────────────────────────────────────────────────────────
TITLE_COLOR  = (210, 50, 50)    # red
TEXT_COLOR   = (245, 245, 255)  # cold white
TEXT_ALPHA   = 191              # 75% opacity (0–255)
AUTHOR_COLOR = (160, 160, 160)  # muted grey
SHADOW_COLOR = (0, 0, 0)

TITLE_FONT_SIZE  = 68
BODY_FONT_SIZE   = 50
AUTHOR_FONT_SIZE = 38
LINE_SPACING     = 1.5
PARAGRAPH_GAP    = 40

OVERLAY_OPACITY = 160   # 0–255 darkness of the background overlay

# ── Fade timing ───────────────────────────────────────────────────────────────
FADE_DELAY_FACTOR = 1.2   # body fade completes this × body_tts_dur after narration starts
TRAILING_SILENCE  = 3.0   # seconds of music after text fully faded in
TITLE_FADE_DUR    = 0.5   # seconds for title to fade in at video start

# ── Ken Burns zoom ────────────────────────────────────────────────────────────
ZOOM_AMOUNT = 0.04   # 4% zoom applied gradually over the full video duration

# ── SSML / TTS ────────────────────────────────────────────────────────────────
SSML_SENTENCE_PAUSE = "750ms"   # break inserted between sentences in Google TTS body

# ── Subscribe tag ─────────────────────────────────────────────────────────────
SUBSCRIBE_TEXT      = "Subscribe for your nightly dose of dread."
SUBSCRIBE_FONT_SIZE = 36
SUBSCRIBE_COLOR     = (210, 50, 50)   # red — matches title
SUBSCRIBE_ALPHA     = 220             # slightly transparent
SUBSCRIBE_Y_FRAC    = 0.82            # near the bottom of the frame
SUBSCRIBE_FADE_DUR  = 1.5             # fade in over 1.5 seconds

# ── Audio ─────────────────────────────────────────────────────────────────────
DEFAULT_REVERB  = True
MUSIC_FOLDER    = "horror_music"
MUSIC_VOLUME    = 0.70

# edge-tts voices / settings (fallback)
EDGE_VOICE        = "en-GB-RyanNeural"
EDGE_FEMALE_VOICE = "en-GB-SoniaNeural"
DEFAULT_TTS_RATE  = "-25%"
DEFAULT_TTS_PITCH = "-10Hz"

# Google Cloud TTS voices / settings (default)
GOOGLE_CREDENTIALS_FILE  = "google_credentials.json"
GOOGLE_VOICE_MALE        = "en-GB-Neural2-B"
GOOGLE_VOICE_FEMALE      = "en-GB-Neural2-C"
GOOGLE_SPEAKING_RATE     = 0.75    # 25% slower
GOOGLE_PITCH             = -3.0    # 3 semitones lower
GOOGLE_FREE_TIER_CHARS   = 1_000_000   # Neural2 free tier per month
GOOGLE_WARN_AT           = 0.85        # warn at 85% usage
GOOGLE_TTS_USAGE_FILE    = "tts_usage.json"

DEFAULT_TTS_BACKEND = "google"

# ── Pollinations.ai ───────────────────────────────────────────────────────────
POLLINATIONS_URL = (
    "https://image.pollinations.ai/prompt/{prompt}"
    "?width=1080&height=1920&nologo=true&seed={seed}"
)
IMAGE_TIMEOUT = 90

# ── Files ─────────────────────────────────────────────────────────────────────
STORIES_FILE        = "tsh_stories.json"
VIDEO_OUTPUT_FOLDER = "video_output"
BACKGROUND_FOLDER   = "background_images"

# ── Font paths ────────────────────────────────────────────────────────────────
DISPLAY_FONTS = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/October Crow.ttf",
    "C:/Windows/Fonts/October Crow.ttf",
    "October Crow.ttf",
]
BODY_FONTS = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/PlayfairDisplay-Italic.ttf",
    "C:/Windows/Fonts/PlayfairDisplay-Italic.ttf",
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/Roboto-Italic.ttf",
    "C:/Windows/Fonts/Roboto-Italic.ttf",
    "C:/Windows/Fonts/georgiai.ttf",
]
BODY_FONTS_ITALIC = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/PlayfairDisplay-Italic.ttf",
    "C:/Windows/Fonts/PlayfairDisplay-Italic.ttf",
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/Roboto-Italic.ttf",
    "C:/Windows/Fonts/Roboto-Italic.ttf",
    "C:/Windows/Fonts/georgiai.ttf",
]
BODY_FONTS_BOLD = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/PlayfairDisplay-Bold.ttf",
    "C:/Windows/Fonts/PlayfairDisplay-Bold.ttf",
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/Roboto-Bold.ttf",
    "C:/Windows/Fonts/Roboto-Bold.ttf",
    "C:/Windows/Fonts/georgiab.ttf",
]
BODY_FONTS_BOLD_ITALIC = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/PlayfairDisplay-BoldItalic.ttf",
    "C:/Windows/Fonts/PlayfairDisplay-BoldItalic.ttf",
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/Roboto-BoldItalic.ttf",
    "C:/Windows/Fonts/Roboto-BoldItalic.ttf",
    "C:/Windows/Fonts/georgiaz.ttf",
]
WINDOWS_FONTS = [
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/calibri.ttf",
]
WINDOWS_FONTS_BOLD = [
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/calibrib.ttf",
]


# ── Font loading ──────────────────────────────────────────────────────────────

def _load_font(size: int, bold: bool = False, display: bool = False,
               body: bool = False, italic: bool = False,
               bold_italic: bool = False) -> ImageFont.FreeTypeFont:
    if display:
        for path in DISPLAY_FONTS:
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                pass
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
    paths = WINDOWS_FONTS_BOLD if bold else WINDOWS_FONTS
    for path in paths:
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


Word = tuple[str, bool, bool, bool]


def _parse_inline(text: str) -> list[Word]:
    text = re.sub(r'\^(\S+)', '', text)
    text = re.sub(r'`(.*?)`', r'\1', text)
    pattern = r'(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|~~.*?~~|_.*?_)'
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
    text = re.sub(r'\^(\S+)', '', text)
    text = re.sub(r'`(.*?)`', r'\1', text)
    text = re.sub(r'\*\*\*(.*?)\*\*\*', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'\*(.*?)\*', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'~~(.*?)~~', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'_(.*?)_', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
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
    tagged_words = _parse_inline(text)
    if not tagged_words:
        return []
    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    space_w = dummy.textlength(' ', font=fonts['regular'])
    lines, current_line, current_w = [], [], 0.0
    for word in tagged_words:
        text_str, bold, italic, strike = word
        font   = _pick_font(fonts, bold, italic)
        word_w = dummy.textlength(text_str, font=font)
        gap    = space_w if current_line else 0
        if current_w + gap + word_w <= max_width:
            current_line.append(word)
            current_w += gap + word_w
        else:
            if current_line:
                lines.append(current_line)
            current_line = [word]
            current_w    = word_w
    if current_line:
        lines.append(current_line)
    return lines


def _draw_markup_line(draw, line: list[Word], cx, y, fonts: dict,
                      color, font_size: int, alpha: int = 255):
    dummy   = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    space_w = dummy.textlength(' ', font=fonts['regular'])
    total_w = sum(dummy.textlength(w, font=_pick_font(fonts, b, i))
                  for w, b, i, _ in line)
    total_w += space_w * (len(line) - 1)
    x = cx - total_w / 2
    # Shadow pass (drawn first, behind text)
    shadow_alpha = min(255, int(alpha * 0.85))
    xs = x
    for j, (word, bold, italic, _strike) in enumerate(line):
        font = _pick_font(fonts, bold, italic)
        draw.text((xs + 3, y + 3), word, font=font, fill=(*SHADOW_COLOR, shadow_alpha))
        xs += draw.textlength(word, font=font) + (space_w if j < len(line) - 1 else 0)
    # Text pass
    for j, (word, bold, italic, strike) in enumerate(line):
        font   = _pick_font(fonts, bold, italic)
        draw.text((x, y), word, font=font, fill=(*color, alpha))
        word_w = draw.textlength(word, font=font)
        if strike:
            mid_y = y + font_size // 2
            draw.line([(x, mid_y), (x + word_w, mid_y)], fill=(*color, alpha), width=2)
        x += word_w
        if j < len(line) - 1:
            x += space_w


# ── AI background ─────────────────────────────────────────────────────────────

def _story_to_image_prompt(title: str) -> str:
    # Use only the first 8 words of the title to keep the prompt short and reliable
    keywords = " ".join(title.split()[:8])
    return f"dark creepy horror atmospheric background, {keywords}, cinematic, faded"


def load_local_background() -> np.ndarray:
    """Pick a random image from BACKGROUND_FOLDER, scaled to fill the frame."""
    import random
    folder = Path(BACKGROUND_FOLDER)
    exts   = {".jpg", ".jpeg", ".png", ".webp"}
    images = [f for f in folder.iterdir() if f.suffix.lower() in exts]
    if not images:
        raise FileNotFoundError(f"No images found in '{BACKGROUND_FOLDER}'")
    chosen = random.choice(images)
    img    = Image.open(chosen).convert("RGB")
    scale  = max(WIDTH / img.width, HEIGHT / img.height)
    new_w  = int(img.width * scale)
    new_h  = int(img.height * scale)
    img    = img.resize((new_w, new_h), Image.LANCZOS)
    left   = (new_w - WIDTH) // 2
    top    = (new_h - HEIGHT) // 2
    img    = img.crop((left, top, left + WIDTH, top + HEIGHT))
    overlay = Image.new("RGBA", img.size, (0, 0, 0, OVERLAY_OPACITY))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    return np.array(img)


def fetch_ai_background(title: str, story_id: str) -> np.ndarray:
    """Fetch an AI-generated background from Pollinations.ai."""
    prompt  = _story_to_image_prompt(title)
    encoded = urllib.parse.quote(prompt)
    seed    = abs(hash(story_id)) % 99999
    url     = POLLINATIONS_URL.format(prompt=encoded, seed=seed)
    print(f"  Background : fetching AI image from Pollinations.ai...")
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "tsh-video/1.0"})
            with urllib.request.urlopen(req, timeout=IMAGE_TIMEOUT) as resp:
                img_data = resp.read()
            break
        except Exception as e:
            if attempt < 1:
                print(f"  Background : attempt {attempt + 1} failed ({e}) — retrying...")
                import time
                time.sleep(10)
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
    return np.array(img)


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
            print(f"  Warning: no audio files found in '{path}' — skipping music")
            return None
        chosen = random.choice(tracks)
        print(f"  Music      : {chosen.name}")
        return str(chosen)
    return path


def apply_audio_effects(input_path: str, output_path: str) -> None:
    from pedalboard import Pedalboard, Reverb, LowpassFilter  # type: ignore
    from pedalboard.io import AudioFile                        # type: ignore
    with AudioFile(input_path) as f:
        audio       = f.read(f.frames)
        sample_rate = f.samplerate
    board = Pedalboard([
        LowpassFilter(cutoff_frequency_hz=4000),
        Reverb(room_size=0.65, damping=0.50, wet_level=0.22,
               dry_level=0.78, freeze_mode=0.0),
    ])
    processed = board(audio, sample_rate)
    with AudioFile(output_path, "w", sample_rate, processed.shape[0]) as f:
        f.write(processed)


# ── TTS ───────────────────────────────────────────────────────────────────────

async def _tts(text: str, voice: str, path: str, rate: str, pitch: str) -> None:
    import edge_tts
    await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(path)


def generate_narration(text: str, voice: str, path: str,
                       rate: str = DEFAULT_TTS_RATE,
                       pitch: str = DEFAULT_TTS_PITCH) -> None:
    import time
    for attempt in range(5):
        try:
            asyncio.run(_tts(text, voice, path, rate, pitch))
            return
        except Exception as e:
            if attempt < 4:
                wait = 2 ** attempt
                print(f"  TTS error (attempt {attempt + 1}/5): {e} — retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise


def _load_tts_usage() -> dict:
    if Path(GOOGLE_TTS_USAGE_FILE).exists():
        with open(GOOGLE_TTS_USAGE_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def _save_tts_usage(usage: dict) -> None:
    with open(GOOGLE_TTS_USAGE_FILE, "w", encoding="utf-8") as f:
        json.dump(usage, f, indent=2)


def _check_and_record_usage(text: str) -> bool:
    """
    Check if adding len(text) chars would exceed the free tier.
    Records usage if safe, warns if approaching limit, returns False if over limit.
    """
    import datetime
    month_key = datetime.datetime.now().strftime("%Y-%m")
    usage     = _load_tts_usage()
    used      = usage.get(month_key, 0)
    chars     = len(text)
    projected = used + chars

    if projected > GOOGLE_FREE_TIER_CHARS:
        print(f"  WARNING: Google TTS free tier exceeded for {month_key} "
              f"({used:,} used + {chars:,} new > {GOOGLE_FREE_TIER_CHARS:,} limit). "
              f"Falling back to edge-tts.")
        return False

    if projected >= GOOGLE_FREE_TIER_CHARS * GOOGLE_WARN_AT:
        pct = projected / GOOGLE_FREE_TIER_CHARS * 100
        print(f"  WARNING: Google TTS usage at {pct:.1f}% of free tier "
              f"({projected:,} / {GOOGLE_FREE_TIER_CHARS:,} chars) for {month_key}.")

    usage[month_key] = projected
    _save_tts_usage(usage)
    return True


def _body_to_ssml(text: str) -> str:
    """Wrap body text in SSML, inserting dramatic pauses between sentences."""
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s.strip() for s in sentences if s.strip()]
    pause_tag = f'<break time="{SSML_SENTENCE_PAUSE}"/>'
    inner = pause_tag.join(sentences)
    return f"<speak>{inner}</speak>"


def generate_narration_google(text: str, voice_name: str, path: str,
                              use_ssml: bool = False) -> bool:
    """
    Generate TTS audio using Google Cloud Neural2 voices.
    Returns True on success, False if free tier exceeded (caller should use edge-tts).
    If use_ssml=True, wraps body text in SSML with sentence-break pauses.
    """
    if not _check_and_record_usage(text):
        return False

    from google.auth.transport.requests import Request as GoogleRequest
    from google.cloud import texttospeech
    from google.oauth2 import service_account

    credentials = service_account.Credentials.from_service_account_file(
        str(Path(GOOGLE_CREDENTIALS_FILE).resolve()),
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
    )
    credentials.refresh(GoogleRequest())
    client = texttospeech.TextToSpeechClient(credentials=credentials)

    language_code = "-".join(voice_name.split("-")[:2])   # e.g. "en-GB"

    if use_ssml:
        synthesis_input = texttospeech.SynthesisInput(ssml=_body_to_ssml(text))
    else:
        synthesis_input = texttospeech.SynthesisInput(text=text)

    response = client.synthesize_speech(
        input=synthesis_input,
        voice=texttospeech.VoiceSelectionParams(
            name=voice_name,
            language_code=language_code,
        ),
        audio_config=texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=GOOGLE_SPEAKING_RATE,
            pitch=GOOGLE_PITCH,
        ),
    )
    with open(path, "wb") as f:
        f.write(response.audio_content)
    return True


def _detect_narrator_gender(title: str, body: str) -> str:
    text         = (title + " " + body).lower()
    female_score = 0
    male_score   = 0
    female_score += len(re.findall(r'\bmy husband\b', text)) * 2
    male_score   += len(re.findall(r'\bmy wife\b', text)) * 2
    female_score += len(re.findall(r'\bmy boyfriend\b', text))
    male_score   += len(re.findall(r'\bmy girlfriend\b', text))
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


# ── Text overlays ─────────────────────────────────────────────────────────────

def render_title_overlay(title: str, author: str) -> np.ndarray:
    """Pre-render title + author credit as (HEIGHT, WIDTH, 4) RGBA array."""
    img  = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    title_font  = _load_font(TITLE_FONT_SIZE, bold=True, display=True)
    author_font = _load_font(AUTHOR_FONT_SIZE, body=True, italic=True)

    draw_width = WIDTH - PADDING_X - PADDING_X_RIGHT
    center_x   = PADDING_X + draw_width // 2

    title_lines   = _wrap(title, title_font, draw_width)
    lh_title      = int(TITLE_FONT_SIZE * LINE_SPACING)
    title_block_h = len(title_lines) * lh_title

    y = int(HEIGHT * TITLE_CENTER_Y_FRAC) - title_block_h // 2
    for line in title_lines:
        w = draw.textlength(line, font=title_font)
        draw.text((center_x - w // 2, y), line, font=title_font,
                  fill=(*TITLE_COLOR, 255))
        y += lh_title

    return np.array(img)


def render_body_overlay(body: str) -> np.ndarray:
    """Pre-render body text as (HEIGHT, WIDTH, 4) RGBA array at TEXT_ALPHA opacity."""
    img  = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    body_fonts = {
        'regular':    _load_font(BODY_FONT_SIZE, body=True),
        'italic':     _load_font(BODY_FONT_SIZE, body=True, italic=True),
        'bold':       _load_font(BODY_FONT_SIZE, body=True, bold=True),
        'bold_italic':_load_font(BODY_FONT_SIZE, body=True, bold_italic=True),
    }

    draw_width = WIDTH - PADDING_X - PADDING_X_RIGHT
    center_x   = PADDING_X + draw_width // 2
    lh_body    = int(BODY_FONT_SIZE * LINE_SPACING)

    paragraphs = [p.strip() for p in body.split('\n\n') if p.strip()]
    if not paragraphs:
        paragraphs = [body]

    para_lines_list = [_wrap_markup(p, body_fonts, draw_width) for p in paragraphs]

    body_block_h = (
        sum(len(lines) * lh_body for lines in para_lines_list)
        + PARAGRAPH_GAP * (len(para_lines_list) - 1)
    )

    y = int(HEIGHT * BODY_CENTER_Y_FRAC) - body_block_h // 2
    for i, para_lines in enumerate(para_lines_list):
        for line in para_lines:
            _draw_markup_line(draw, line, center_x, y, body_fonts,
                              TEXT_COLOR, BODY_FONT_SIZE, alpha=TEXT_ALPHA)
            y += lh_body
        if i < len(para_lines_list) - 1:
            y += PARAGRAPH_GAP

    return np.array(img)


def render_subscribe_overlay() -> np.ndarray:
    """Pre-render subscribe CTA as (HEIGHT, WIDTH, 4) RGBA array."""
    img  = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    font       = _load_font(SUBSCRIBE_FONT_SIZE, display=True)
    draw_width = WIDTH - PADDING_X - PADDING_X_RIGHT
    center_x   = PADDING_X + draw_width // 2
    lh         = int(SUBSCRIBE_FONT_SIZE * LINE_SPACING)

    lines = _wrap(SUBSCRIBE_TEXT, font, draw_width)
    block_h = len(lines) * lh
    y = int(HEIGHT * SUBSCRIBE_Y_FRAC) - block_h // 2

    for line in lines:
        w = draw.textlength(line, font=font)
        # Drop shadow
        draw.text((center_x - w // 2 + 2, y + 2), line, font=font,
                  fill=(*SHADOW_COLOR, 160))
        # Text
        draw.text((center_x - w // 2, y), line, font=font,
                  fill=(*SUBSCRIBE_COLOR, SUBSCRIBE_ALPHA))
        y += lh

    return np.array(img)


# ── Main video builder ────────────────────────────────────────────────────────

def create_video(
    story: dict,
    output_path: str,
    voice: str | None = None,
    music_path: str | None = MUSIC_FOLDER,
    music_volume: float = MUSIC_VOLUME,
    narration: bool = True,
    tts_rate: str = DEFAULT_TTS_RATE,
    tts_pitch: str = DEFAULT_TTS_PITCH,
    reverb: bool = DEFAULT_REVERB,
    tts_backend: str = DEFAULT_TTS_BACKEND,
) -> None:
    title  = story["title"]
    body   = story["body"]
    author = story.get("author", "unknown")

    print(f'\nRendering: "{title}"')
    print(f"  Words  : {len(body.split())}")

    # Auto-select voice
    if voice is None:
        gender = _detect_narrator_gender(title, body)
        if tts_backend == "google":
            voice = GOOGLE_VOICE_FEMALE if gender == "female" else GOOGLE_VOICE_MALE
        else:
            voice = EDGE_FEMALE_VOICE if gender == "female" else EDGE_VOICE
        label = "female" if gender == "female" else ("neutral" if gender == "neutral" else "male")
        print(f"  Gender : {label} detected → {voice}")

    # AI background
    try:
        bg_arr = fetch_ai_background(title, story.get("id", "unknown"))
    except Exception as e:
        print(f"  Background : AI fetch failed ({e}) — trying local images...")
        try:
            bg_arr = load_local_background()
            print(f"  Background : using local image")
        except Exception as e2:
            print(f"  Background : local images failed ({e2}) — using solid dark background")
            bg_arr = np.full((HEIGHT, WIDTH, 3), (10, 10, 10), dtype=np.uint8)
    bg_float = bg_arr.astype(np.float32)

    # Pre-compute zoomed background for Ken Burns effect
    _zoom_w = int(WIDTH * (1.0 + ZOOM_AMOUNT))
    _zoom_h = int(HEIGHT * (1.0 + ZOOM_AMOUNT))
    _bg_zoomed_img = Image.fromarray(bg_arr).resize((_zoom_w, _zoom_h), Image.LANCZOS)
    _left = (_zoom_w - WIDTH) // 2
    _top  = (_zoom_h - HEIGHT) // 2
    bg_zoomed_float = np.array(
        _bg_zoomed_img.crop((_left, _top, _left + WIDTH, _top + HEIGHT))
    ).astype(np.float32)

    # Pre-render text overlays
    title_rgba      = render_title_overlay(title, author)
    title_rgb_float = title_rgba[:, :, :3].astype(np.float32)
    title_alpha     = title_rgba[:, :, 3:4].astype(np.float32) / 255.0
    title_inv_alpha = 1.0 - title_alpha

    body_rgba      = render_body_overlay(_strip_markdown(body))
    body_rgb_float = body_rgba[:, :, :3].astype(np.float32)
    body_alpha_arr = body_rgba[:, :, 3:4].astype(np.float32) / 255.0

    sub_rgba      = render_subscribe_overlay()
    sub_rgb_float = sub_rgba[:, :, :3].astype(np.float32)
    sub_alpha_arr = sub_rgba[:, :, 3:4].astype(np.float32) / 255.0

    # TTS narration
    audio         = None
    title_tts_dur = 0.0
    body_tts_dur  = 0.0
    reverb_path   = None
    title_tts_path = body_tts_path = combined_wav_path = None

    if narration:
        print(f"  Voice  : {voice}  (rate={tts_rate}, pitch={tts_pitch})")

        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            title_tts_path = f.name
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            body_tts_path = f.name

        print(f"  Generating narration ({tts_backend})...")
        if tts_backend == "google":
            ok1 = generate_narration_google(f"{title}.", voice, title_tts_path)
            ok2 = generate_narration_google(_strip_markdown(body), voice, body_tts_path,
                                            use_ssml=True)
            if not ok1 or not ok2:
                # Free tier exceeded — fall back to edge-tts
                edge_voice = EDGE_FEMALE_VOICE if _detect_narrator_gender(title, body) == "female" else EDGE_VOICE
                if not ok1:
                    generate_narration(f"{title}.", edge_voice, title_tts_path, tts_rate, tts_pitch)
                if not ok2:
                    generate_narration(_strip_markdown(body), edge_voice, body_tts_path, tts_rate, tts_pitch)
        else:
            generate_narration(f"{title}.", voice, title_tts_path, tts_rate, tts_pitch)
            generate_narration(_strip_markdown(body), voice, body_tts_path, tts_rate, tts_pitch)

        title_clip    = AudioFileClip(title_tts_path)
        body_clip     = AudioFileClip(body_tts_path)
        title_tts_dur = title_clip.duration
        body_tts_dur  = body_clip.duration
        print(f"  Title narration : {title_tts_dur:.1f}s")
        print(f"  Body narration  : {body_tts_dur:.1f}s")

        # Concatenate → write to WAV → apply reverb
        combined = concatenate_audioclips([title_clip, body_clip])

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            combined_wav_path = f.name
        combined.write_audiofile(combined_wav_path, logger=None)
        combined.close()
        title_clip.close()
        body_clip.close()

        if reverb:
            print("  Applying reverb...")
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                reverb_path = f.name
            apply_audio_effects(combined_wav_path, reverb_path)
            narration_clip = AudioFileClip(reverb_path)
        else:
            narration_clip = AudioFileClip(combined_wav_path)

        duration = title_tts_dur + body_tts_dur * FADE_DELAY_FACTOR + TRAILING_SILENCE

        if music_path:
            resolved = _resolve_music(music_path)
            if resolved:
                bg_music = AudioFileClip(resolved)
                bg_music = _loop_audio(bg_music, duration).with_volume_scaled(music_volume)
                audio = CompositeAudioClip([narration_clip, bg_music])
            else:
                audio = narration_clip
        else:
            audio = narration_clip
    else:
        # No narration: fixed timing
        title_tts_dur = 3.0
        body_tts_dur  = 8.0
        duration = title_tts_dur + body_tts_dur * FADE_DELAY_FACTOR + TRAILING_SILENCE
        if music_path:
            resolved = _resolve_music(music_path)
            if resolved:
                bg_music = AudioFileClip(resolved)
                audio = _loop_audio(bg_music, duration).with_volume_scaled(music_volume)

    print(f"  Duration : {duration:.1f}s")
    print(f"  Output   : {output_path}\n")

    total_frames  = int(duration * FPS)
    _rendered     = [0]
    fade_dur      = body_tts_dur * FADE_DELAY_FACTOR
    body_fade_end   = title_tts_dur + fade_dur        # when body is fully visible
    narration_end   = title_tts_dur + body_tts_dur    # when narration finishes

    def make_frame(t: float) -> np.ndarray:
        # Ken Burns: interpolate background from normal → 4% zoomed
        zoom_frac = t / duration
        curr_bg = bg_float * (1.0 - zoom_frac) + bg_zoomed_float * zoom_frac

        # Title fades in over TITLE_FADE_DUR seconds
        title_fade = min(1.0, t / TITLE_FADE_DUR) if TITLE_FADE_DUR > 0 else 1.0
        eff_title_alpha = title_alpha * title_fade
        frame = curr_bg * (1.0 - eff_title_alpha) + title_rgb_float * eff_title_alpha

        # Body fades in starting when title narration ends
        if t < title_tts_dur:
            fade = 0.0
        else:
            fade = min(1.0, (t - title_tts_dur) / fade_dur)

        if fade > 0.0:
            eff_alpha     = body_alpha_arr * fade
            eff_inv_alpha = 1.0 - eff_alpha
            frame = frame * eff_inv_alpha + body_rgb_float * eff_alpha

        # Subscribe tag fades in when narration ends
        sub_fade = min(1.0, max(0.0, (t - narration_end) / SUBSCRIBE_FADE_DUR))
        if sub_fade > 0.0:
            eff_alpha     = sub_alpha_arr * sub_fade
            eff_inv_alpha = 1.0 - eff_alpha
            frame = frame * eff_inv_alpha + sub_rgb_float * eff_alpha

        _rendered[0] += 1
        if _rendered[0] % 30 == 0 or _rendered[0] == total_frames:
            pct = _rendered[0] / total_frames * 100
            print(f"\r  Rendering : {pct:.0f}%  ({_rendered[0]}/{total_frames} frames)",
                  end="", flush=True)

        return frame.astype(np.uint8)

    clip = VideoClip(make_frame, duration=duration)
    if audio is not None:
        clip = clip.with_audio(audio)

    clip.write_videofile(
        output_path, fps=FPS, codec="libx264", audio_codec="aac", logger=None,
    )
    clip.close()
    print()

    # Cleanup
    if narration:
        narration_clip.close()
        for p in [title_tts_path, body_tts_path, combined_wav_path]:
            if p:
                Path(p).unlink(missing_ok=True)
        if reverb_path:
            Path(reverb_path).unlink(missing_ok=True)

    print(f"\nDone! Saved to: {output_path}")


# ── CLI ───────────────────────────────────────────────────────────────────────

def load_stories() -> list[dict]:
    path = Path(STORIES_FILE)
    if not path.exists():
        sys.exit(f"Error: '{STORIES_FILE}' not found.")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _make_output_path(index: int, story: dict) -> str:
    out_dir = Path(VIDEO_OUTPUT_FOLDER)
    out_dir.mkdir(parents=True, exist_ok=True)
    post_id = story.get("id", "unknown")
    safe    = "".join(c if c.isalnum() or c in " _-" else "" for c in story["title"])
    safe    = safe.strip().replace(" ", "_")[:40]
    return str(out_dir / f"tsh_{index:04d}_{post_id}_{safe}.mp4")


def main():
    parser = argparse.ArgumentParser(
        description="Generate a TwoSentenceHorror video."
    )
    parser.add_argument("--json",   default=STORIES_FILE)
    parser.add_argument("--index",  type=int, default=0, help="Story index in JSON")
    parser.add_argument("--voice",  default=None)
    parser.add_argument("--music",  default=MUSIC_FOLDER)
    parser.add_argument("--music-volume", type=float, default=MUSIC_VOLUME)
    parser.add_argument("--tts-rate",  default=DEFAULT_TTS_RATE)
    parser.add_argument("--tts-pitch", default=DEFAULT_TTS_PITCH)
    parser.add_argument("--no-reverb",    action="store_true")
    parser.add_argument("--no-narration", action="store_true")
    parser.add_argument("--tts", choices=["google", "edge"], default=DEFAULT_TTS_BACKEND,
                        help="TTS backend to use (default: google)")
    parser.add_argument("--out", default=None)
    parser.add_argument("--list", action="store_true")
    args = parser.parse_args()

    stories = load_stories()

    if args.list:
        print(f"{'#':<5} {'Score':<7} {'Words':<6} Title")
        print("-" * 72)
        for i, s in enumerate(stories):
            print(f"{i:<5} {s['score']:<7} {s['word_count']:<6} {s['title'][:55]}")
        return

    if args.index >= len(stories):
        sys.exit(f"Error: index {args.index} out of range.")
    story  = stories[args.index]
    output = args.out or _make_output_path(args.index, story)

    create_video(
        story=story,
        output_path=output,
        voice=args.voice,
        music_path=args.music,
        music_volume=args.music_volume,
        narration=not args.no_narration,
        tts_rate=args.tts_rate,
        tts_pitch=args.tts_pitch,
        reverb=not args.no_reverb,
        tts_backend=args.tts,
    )


if __name__ == "__main__":
    main()
