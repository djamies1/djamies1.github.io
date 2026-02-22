"""
nosleep scrolling video generator
Reads nosleep_stories.json and renders a short-form (9:16) scrolling text MP4
with TTS narration and optional background music.

Requirements:
    pip install moviepy Pillow edge-tts numpy

Usage:
    python make_video.py --index 0
    python make_video.py --index 0 --music spooky.mp3
    python make_video.py --index 0 --voice en-US-JennyNeural
    python make_video.py --index 0 --max-words 400
    python make_video.py --list
    python make_video.py --list-voices
"""

import argparse
import asyncio
import json
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
PADDING_X = 80                   # left/right margin in pixels
TITLE_FONT_SIZE = 72
BODY_FONT_SIZE = 46
LINE_SPACING = 1.5               # multiplier on font size

# ── Scroll ────────────────────────────────────────────────────────────────────
DEFAULT_SCROLL_SPEED = 50        # pixels per second

# ── Audio ─────────────────────────────────────────────────────────────────────
DEFAULT_VOICE = "en-US-ChristopherNeural"   # deep male, works well for horror
MUSIC_VOLUME = 0.12                          # background music level (0.0–1.0)

# A few good voices to try:
#   en-US-ChristopherNeural  — deep, calm male (default)
#   en-US-GuyNeural          — neutral male
#   en-US-JennyNeural        — clear female
#   en-GB-RyanNeural         — British male
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
]
WINDOWS_FONTS_BOLD = [
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/calibrib.ttf",
    "C:/Windows/Fonts/segoeuib.ttf",
]

# Display font used for title and end card — creepy style
DISPLAY_FONTS = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/Creepster-Regular.ttf",  # per-user install
    "C:/Windows/Fonts/Creepster-Regular.ttf",  # system-wide install
    "C:/Windows/Fonts/Creepster.ttf",
    "Creepster-Regular.ttf",                    # fallback: same folder as script
    "Creepster.ttf",
]

def _load_font(size: int, bold: bool = False, display: bool = False, body: bool = False) -> ImageFont.FreeTypeFont:
    if display:
        for path in DISPLAY_FONTS:
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                pass
        print("  Warning: Creepster font not found, falling back to bold Arial.")
    if body:
        for path in BODY_FONTS:
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                pass
        print("  Warning: Roboto font not found, falling back to Arial.")
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


# ── Core rendering ────────────────────────────────────────────────────────────

SUBSCRIBE_TEXT = "Subscribe for more bedtime stories..."

def render_story_image(title: str, body: str) -> Image.Image:
    title_font = _load_font(TITLE_FONT_SIZE, bold=True, display=True)
    body_font = _load_font(BODY_FONT_SIZE, body=True)
    draw_width = WIDTH - PADDING_X * 2

    title_lines = _wrap(title, title_font, draw_width)
    body_lines = _wrap(body, body_font, draw_width)
    subscribe_lines = _wrap(SUBSCRIBE_TEXT, title_font, draw_width)

    lh_title = int(TITLE_FONT_SIZE * LINE_SPACING)
    lh_body = int(BODY_FONT_SIZE * LINE_SPACING)

    title_block_h = len(title_lines) * lh_title
    subscribe_block_h = len(subscribe_lines) * lh_title

    # Place the title centered vertically on the very first frame
    title_y = HEIGHT // 2 - title_block_h // 2

    content_height = (
        title_block_h + 120          # title + gap
        + len(body_lines) * lh_body  # body
        + 120                         # gap before subscribe
        + subscribe_block_h           # subscribe text
    )

    # Total image: title_y offset + content + one trailing blank screen
    total_height = title_y + content_height + HEIGHT

    img = Image.new("RGB", (WIDTH, total_height), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Title — centered horizontally
    y = title_y
    for line in title_lines:
        w = draw.textlength(line, font=title_font)
        x = (WIDTH - w) // 2
        draw.text((x, y), line, font=title_font, fill=TITLE_COLOR)
        y += lh_title
    y += 120

    # Body
    for line in body_lines:
        draw.text((PADDING_X, y), line, font=body_font, fill=TEXT_COLOR)
        y += lh_body
    y += 120

    # Subscribe text — centered, same style as title
    for line in subscribe_lines:
        w = draw.textlength(line, font=title_font)
        x = (WIDTH - w) // 2
        draw.text((x, y), line, font=title_font, fill=TITLE_COLOR)
        y += lh_title

    return img


# ── TTS narration ─────────────────────────────────────────────────────────────

async def _tts(text: str, voice: str, path: str) -> None:
    import edge_tts
    await edge_tts.Communicate(text, voice).save(path)


def generate_narration(text: str, voice: str, path: str) -> None:
    asyncio.run(_tts(text, voice, path))


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


# ── Main video builder ────────────────────────────────────────────────────────

def create_video(
    story: dict,
    output_path: str,
    voice: str,
    music_path: str | None,
    music_volume: float,
    max_words: int | None,
    narration: bool = True,
    scroll_speed: int | None = None,
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

    audio = None

    if narration:
        print(f"  Voice  : {voice}")
        # Generate TTS to a temp file
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
            tts_path = tmp.name

        print("  Generating narration... (this may take a moment)")
        generate_narration(f"{title}. {body}", voice, tts_path)

        narration_clip = AudioFileClip(tts_path)
        duration = narration_clip.duration
        print(f"  Duration : {duration:.1f}s  ({duration/60:.1f} min)")

        if music_path:
            print(f"  Music  : {music_path}")
            bg = AudioFileClip(music_path)
            bg = _loop_audio(bg, duration).with_volume_scaled(music_volume)
            audio = CompositeAudioClip([narration_clip, bg])
        else:
            audio = narration_clip
    else:
        print("  Narration : off")
        # Duration driven by scroll speed — calculate after image is rendered
        duration = None  # set below once we know image height

        if music_path:
            print(f"  Music  : {music_path}")

    # 3. Render scrolling video
    img = render_story_image(title, body)
    arr = np.array(img)
    max_scroll = img.height - HEIGHT

    if narration:
        # Scroll speed auto-fitted to narration length
        scroll_speed = max_scroll / duration
        print(f"  Scroll speed : {scroll_speed:.1f} px/s (auto)")
    else:
        # Duration driven by fixed scroll speed
        duration = max_scroll / scroll_speed
        print(f"  Scroll speed : {scroll_speed} px/s")
        print(f"  Duration : {duration:.1f}s  ({duration/60:.1f} min)")
        if music_path:
            bg = AudioFileClip(music_path)
            bg = _loop_audio(bg, duration).with_volume_scaled(music_volume)
            audio = bg

    print(f"  Output : {output_path}\n")

    def make_frame(t: float):
        y = min(int(t * scroll_speed), max_scroll)
        return arr[y : y + HEIGHT]

    clip = VideoClip(make_frame, duration=duration)
    if audio is not None:
        clip = clip.with_audio(audio)

    clip.write_videofile(
        output_path,
        fps=FPS,
        codec="libx264",
        audio_codec="aac",
        logger="bar",
    )

    if narration:
        Path(tts_path).unlink(missing_ok=True)
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
    parser.add_argument("--voice", default=DEFAULT_VOICE, help="edge-tts voice name")
    parser.add_argument("--music", default=None, help="Path to background music file (mp3/wav)")
    parser.add_argument(
        "--music-volume", type=float, default=MUSIC_VOLUME,
        help=f"Background music volume 0.0–1.0 (default: {MUSIC_VOLUME})"
    )
    parser.add_argument(
        "--max-words", type=int, default=None,
        help="Trim story body to this many words (useful for short-form clips)"
    )
    parser.add_argument(
        "--no-narration", action="store_true",
        help="Skip TTS narration (music only, or silent)"
    )
    parser.add_argument(
        "--speed", type=int, default=DEFAULT_SCROLL_SPEED,
        help=f"Scroll speed in px/s when --no-narration is used (default: {DEFAULT_SCROLL_SPEED})"
    )
    parser.add_argument("--out", default=None, help="Output .mp4 filename")
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

    if args.index >= len(stories):
        sys.exit(f"Error: index {args.index} out of range ({len(stories)} stories available).")

    story = stories[args.index]

    if args.out:
        output = args.out
    else:
        safe = "".join(c if c.isalnum() or c in " _-" else "" for c in story["title"])
        safe = safe.strip().replace(" ", "_")[:40]
        output = f"nosleep_{args.index:02d}_{safe}.mp4"

    create_video(
        story=story,
        output_path=output,
        voice=args.voice,
        music_path=args.music,
        music_volume=args.music_volume,
        max_words=args.max_words,
        narration=not args.no_narration,
        scroll_speed=args.speed,
    )


if __name__ == "__main__":
    main()
