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
TITLE_FONT_SIZE = 56
BODY_FONT_SIZE = 46
LINE_SPACING = 1.5               # multiplier on font size

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

def _load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in WINDOWS_FONTS:
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

def render_story_image(title: str, body: str) -> Image.Image:
    title_font = _load_font(TITLE_FONT_SIZE)
    body_font = _load_font(BODY_FONT_SIZE)
    draw_width = WIDTH - PADDING_X * 2

    title_lines = _wrap(title, title_font, draw_width)
    body_lines = _wrap(body, body_font, draw_width)

    lh_title = int(TITLE_FONT_SIZE * LINE_SPACING)
    lh_body = int(BODY_FONT_SIZE * LINE_SPACING)

    content_height = (
        len(title_lines) * lh_title
        + 60
        + len(body_lines) * lh_body
    )
    total_height = HEIGHT + content_height + HEIGHT

    img = Image.new("RGB", (WIDTH, total_height), BG_COLOR)
    draw = ImageDraw.Draw(img)

    y = HEIGHT
    for line in title_lines:
        draw.text((PADDING_X, y), line, font=title_font, fill=TITLE_COLOR)
        y += lh_title
    y += 60
    for line in body_lines:
        draw.text((PADDING_X, y), line, font=body_font, fill=TEXT_COLOR)
        y += lh_body

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
) -> None:
    title = story["title"]
    body = story["body"]

    if max_words:
        words = body.split()
        if len(words) > max_words:
            body = " ".join(words[:max_words]) + "..."
            print(f"  Trimmed body to {max_words} words")

    print(f'\nRendering: "{title}"')
    print(f"  Words  : {len(body.split())}")
    print(f"  Voice  : {voice}")

    # 1. Generate TTS to a temp file
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tts_path = tmp.name

    narration_text = f"{title}. {body}"
    print("  Generating narration... (this may take a moment)")
    generate_narration(narration_text, voice, tts_path)

    narration = AudioFileClip(tts_path)
    duration = narration.duration
    print(f"  Duration : {duration:.1f}s  ({duration/60:.1f} min)")

    # 2. Mix in background music if provided
    if music_path:
        print(f"  Music  : {music_path}")
        bg = AudioFileClip(music_path)
        bg = _loop_audio(bg, duration).with_volume_scaled(music_volume)
        audio = CompositeAudioClip([narration, bg])
    else:
        audio = narration

    # 3. Render scrolling video timed to narration length
    img = render_story_image(title, body)
    arr = np.array(img)
    max_scroll = img.height - HEIGHT
    scroll_speed = max_scroll / duration   # px/s auto-calculated

    print(f"  Scroll speed : {scroll_speed:.1f} px/s (auto)")
    print(f"  Output : {output_path}\n")

    def make_frame(t: float):
        y = min(int(t * scroll_speed), max_scroll)
        return arr[y : y + HEIGHT]

    clip = VideoClip(make_frame, duration=duration).with_audio(audio)
    clip.write_videofile(
        output_path,
        fps=FPS,
        codec="libx264",
        audio_codec="aac",
        logger="bar",
    )

    # Clean up temp TTS file
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
    )


if __name__ == "__main__":
    main()
