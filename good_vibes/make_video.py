"""
Good Vibrations video generator
Reads goodnews_stories.json and renders a 20-second portrait (9:16) MP4
with an AI-generated background image, Ken Burns zoom, headline text overlay,
and upbeat background music.

Requirements:
    pip install moviepy Pillow numpy requests

Usage:
    python make_video.py --index 0       # render single story
    python make_video.py --all           # render all pending stories
    python make_video.py --list          # list all stories
    python make_video.py --dry-run       # preview what would be rendered
"""

import argparse
import io
import json
import math
import random
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy import AudioFileClip, VideoClip, concatenate_audioclips

# ── Video dimensions ──────────────────────────────────────────────────────────
WIDTH    = 1080
HEIGHT   = 1920
FPS      = 30
DURATION = 20   # seconds — short enough to rewatch, long enough to read

# ── Ken Burns ─────────────────────────────────────────────────────────────────
ZOOM_START = 1.0
ZOOM_END   = 1.12   # 12% zoom over the full duration

# ── Appearance ────────────────────────────────────────────────────────────────
BRANDING_TEXT     = "GOOD VIBRATIONS"
BRANDING_COLOR    = (255, 220, 50)     # warm gold
HEADLINE_COLOR    = (255, 255, 255)    # white
SOURCE_COLOR      = (200, 200, 200)    # light grey
SHADOW_COLOR      = (0, 0, 0)

BRANDING_FONT_SIZE = 42
HEADLINE_FONT_SIZE = 72
SOURCE_FONT_SIZE   = 34
LINE_SPACING       = 1.35
PADDING_X          = 80               # horizontal margin each side

GRADIENT_START_Y   = HEIGHT // 2      # dark overlay starts at midpoint
GRADIENT_MAX_ALPHA = 215              # max darkness at very bottom

# ── Paths ─────────────────────────────────────────────────────────────────────
STORIES_FILE       = "goodnews_stories.json"
VIDEO_OUTPUT_DIR   = "video_output"
MUSIC_FOLDER       = "music"

# ── Pollinations.ai ───────────────────────────────────────────────────────────
POLLINATIONS_URL   = "https://image.pollinations.ai/prompt/{prompt}?width=1080&height=1920&nologo=true&seed={seed}"
IMAGE_TIMEOUT      = 90   # seconds — Pollinations can be slow on first request

# ── Font paths (Windows) ──────────────────────────────────────────────────────
_FONTS_BOLD = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/Roboto-Bold.ttf",
    "C:/Windows/Fonts/Roboto-Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/calibrib.ttf",
]
_FONTS_REGULAR = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/Roboto-Regular.ttf",
    "C:/Windows/Fonts/Roboto-Regular.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/calibri.ttf",
]


def _load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    paths = _FONTS_BOLD if bold else _FONTS_REGULAR
    for path in paths:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()


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


# ── Image generation ──────────────────────────────────────────────────────────

def _headline_to_image_prompt(headline: str) -> str:
    return (
        f"{headline}, "
        "uplifting scene, warm golden sunlight, hope and joy, vibrant colours, "
        "photorealistic, cinematic lighting, beautiful, high quality, no text, no words"
    )


def fetch_background_image(headline: str, story_id: str) -> np.ndarray:
    """Download an AI-generated image from Pollinations.ai matching the headline."""
    prompt  = _headline_to_image_prompt(headline)
    encoded = urllib.parse.quote(prompt)
    seed    = abs(hash(story_id)) % 99999
    url     = POLLINATIONS_URL.format(prompt=encoded, seed=seed)

    print(f"  Fetching image from Pollinations.ai (may take up to {IMAGE_TIMEOUT}s)...")
    req = urllib.request.Request(url, headers={"User-Agent": "good-vibes/1.0"})
    with urllib.request.urlopen(req, timeout=IMAGE_TIMEOUT) as resp:
        img_data = resp.read()

    img = Image.open(io.BytesIO(img_data)).convert("RGB")
    # Resize/crop to exactly 1080x1920
    scale  = max(WIDTH / img.width, HEIGHT / img.height)
    new_w  = int(img.width * scale)
    new_h  = int(img.height * scale)
    img    = img.resize((new_w, new_h), Image.LANCZOS)
    left   = (new_w - WIDTH)  // 2
    top    = (new_h - HEIGHT) // 2
    img    = img.crop((left, top, left + WIDTH, top + HEIGHT))
    return np.array(img)


# ── Text overlay ──────────────────────────────────────────────────────────────

def render_text_overlay(headline: str, source: str) -> np.ndarray:
    """
    Pre-render the static text layer as a (HEIGHT, WIDTH, 4) RGBA numpy array.
    Includes: dark bottom gradient, branding, headline, source credit.
    """
    img  = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Dark gradient covering the bottom half of the frame
    for y in range(GRADIENT_START_Y, HEIGHT):
        progress = (y - GRADIENT_START_Y) / (HEIGHT - GRADIENT_START_Y)
        alpha    = int(GRADIENT_MAX_ALPHA * progress)
        draw.line([(0, y), (WIDTH - 1, y)], fill=(0, 0, 0, alpha))

    branding_font = _load_font(BRANDING_FONT_SIZE, bold=True)
    headline_font = _load_font(HEADLINE_FONT_SIZE, bold=True)
    source_font   = _load_font(SOURCE_FONT_SIZE,   bold=False)

    safe_w   = WIDTH - PADDING_X * 2
    center_x = WIDTH // 2

    # ── Branding at top ──────────────────────────────────────────────────────
    bw = draw.textlength(BRANDING_TEXT, font=branding_font)
    draw.text(
        (center_x - bw // 2, 55),
        BRANDING_TEXT,
        font=branding_font,
        fill=(*BRANDING_COLOR, 220),
    )

    # ── Headline — wrapped, large, in the lower 40% of the frame ─────────────
    wrapped = _wrap(headline, headline_font, safe_w)
    lh      = int(HEADLINE_FONT_SIZE * LINE_SPACING)
    block_h = len(wrapped) * lh

    # Centre the block within the bottom zone (60%–92% of height)
    zone_top = int(HEIGHT * 0.58)
    zone_h   = int(HEIGHT * 0.34)
    text_y   = zone_top + max(0, (zone_h - block_h) // 2)

    for line in wrapped:
        lw = draw.textlength(line, font=headline_font)
        x  = center_x - lw // 2
        # Drop shadow
        draw.text((x + 2, text_y + 2), line, font=headline_font, fill=(*SHADOW_COLOR, 180))
        draw.text((x,     text_y),     line, font=headline_font, fill=(*HEADLINE_COLOR, 255))
        text_y += lh

    # ── Source credit at very bottom ─────────────────────────────────────────
    source_text = f"via {source}"
    sw = draw.textlength(source_text, font=source_font)
    draw.text(
        (center_x - sw // 2, HEIGHT - 65),
        source_text,
        font=source_font,
        fill=(*SOURCE_COLOR, 190),
    )

    return np.array(img)


# ── Audio helpers ─────────────────────────────────────────────────────────────

def _resolve_music(folder: str) -> str | None:
    p    = Path(folder)
    exts = {".mp3", ".wav", ".ogg", ".flac", ".m4a"}
    if not p.is_dir():
        return None
    tracks = [f for f in p.iterdir() if f.suffix.lower() in exts]
    if not tracks:
        print(f"  Warning: no audio files found in '{folder}' — video will be silent")
        return None
    chosen = random.choice(tracks)
    print(f"  Music : {chosen.name}  (randomly chosen from {len(tracks)} tracks)")
    return str(chosen)


def _loop_audio(clip: AudioFileClip, duration: float) -> AudioFileClip:
    if clip.duration >= duration:
        return clip.subclipped(0, duration)
    repeats = math.ceil(duration / clip.duration)
    return concatenate_audioclips([clip] * repeats).subclipped(0, duration)


# ── Main video builder ────────────────────────────────────────────────────────

def create_video(story: dict, output_path: str, music_folder: str = MUSIC_FOLDER,
                 music_volume: float = 0.4, duration: float = DURATION) -> None:
    story_id = story["id"]
    headline = story.get("rewritten_headline") or story["original_headline"]
    source   = story["source"]

    print(f'\nRendering: "{headline}"')
    print(f'  Source : {source}')
    print(f'  URL    : {story["url"]}')

    # 1. Background image from Pollinations.ai
    try:
        bg_arr = fetch_background_image(headline, story_id)
    except Exception as e:
        print(f"  Warning: image fetch failed ({e}) — using solid dark background")
        bg_arr = np.full((HEIGHT, WIDTH, 3), (15, 15, 25), dtype=np.uint8)

    bg_img = Image.fromarray(bg_arr)   # kept as PIL for efficient per-frame crop+resize

    # 2. Static text overlay (pre-rendered once)
    print("  Rendering text overlay...")
    text_arr       = render_text_overlay(headline, source)
    text_alpha     = text_arr[:, :, 3:4].astype(np.float32) / 255.0
    text_rgb_float = text_arr[:, :, :3].astype(np.float32)
    text_inv_alpha = 1.0 - text_alpha

    # 3. Music
    audio      = None
    music_path = _resolve_music(music_folder)
    if music_path:
        bg_clip = AudioFileClip(music_path)
        audio   = _loop_audio(bg_clip, duration).with_volume_scaled(music_volume)

    # 4. Frame generator with Ken Burns zoom
    total_frames = int(duration * FPS)
    _rendered    = [0]

    def make_frame(t: float) -> np.ndarray:
        # Ken Burns: gradually zoom in from ZOOM_START to ZOOM_END
        z      = ZOOM_START + (ZOOM_END - ZOOM_START) * (t / duration)
        crop_w = int(WIDTH  / z)
        crop_h = int(HEIGHT / z)
        left   = (WIDTH  - crop_w) // 2
        top    = (HEIGHT - crop_h) // 2

        # Crop the zoomed region from the background, resize to output size
        bg_crop   = bg_img.crop((left, top, left + crop_w, top + crop_h))
        bg_frame  = np.array(bg_crop.resize((WIDTH, HEIGHT), Image.BILINEAR), dtype=np.float32)

        # Composite text layer
        result = bg_frame * text_inv_alpha + text_rgb_float * text_alpha

        _rendered[0] += 1
        if _rendered[0] % 30 == 0 or _rendered[0] == total_frames:
            pct = _rendered[0] / total_frames * 100
            print(f"\r  Rendering : {pct:.0f}%  ({_rendered[0]}/{total_frames} frames)",
                  end="", flush=True)

        return result.astype(np.uint8)

    # 5. Compose and export
    print(f"  Output : {output_path}")
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
    print(f"\nDone! Saved to: {output_path}")


# ── CLI ───────────────────────────────────────────────────────────────────────

def load_stories(json_path: str) -> list[dict]:
    path = Path(json_path)
    if not path.exists():
        sys.exit(f"Error: '{json_path}' not found. Run scrape_goodnews.py first.")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if not data:
        sys.exit("Error: JSON file contains no stories.")
    return data


def main():
    parser = argparse.ArgumentParser(
        description="Render Good Vibrations videos from scraped good news stories."
    )
    parser.add_argument("--json",   default=STORIES_FILE)
    parser.add_argument("--index",  type=int, default=0,
                        help="Story index to render (default: 0)")
    parser.add_argument("--music",  default=MUSIC_FOLDER,
                        help="Folder containing music tracks (default: '%(default)s')")
    parser.add_argument("--music-volume", type=float, default=0.4,
                        help="Music volume 0.0–1.0 (default: 0.4)")
    parser.add_argument("--duration", type=float, default=DURATION,
                        help=f"Video length in seconds (default: {DURATION})")
    parser.add_argument("--out",    default=None,
                        help="Output .mp4 filename (single story only)")
    parser.add_argument("--all",    action="store_true",
                        help="Render every pending story in the JSON file")
    parser.add_argument("--list",   action="store_true",
                        help="List all stories and exit")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would be rendered without doing it")
    args = parser.parse_args()

    stories = load_stories(args.json)

    if args.list:
        print(f"{'#':<4} {'Score':<7} {'Source':<22} Headline")
        print("-" * 85)
        for i, s in enumerate(stories):
            headline = s.get("rewritten_headline") or s["original_headline"]
            print(f"{i:<4} {s['score']:<7} {s['source']:<22} {headline[:45]}")
        return

    out_dir = Path(VIDEO_OUTPUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)

    def _make_output(index: int, story: dict) -> str:
        safe = "".join(c if c.isalnum() or c in " _-" else ""
                       for c in (story.get("rewritten_headline") or story["original_headline"]))
        safe = safe.strip().replace(" ", "_")[:35]
        return str(out_dir / f"goodnews_{index:02d}_{story['id']}_{safe}.mp4")

    def _run(index: int, story: dict, output: str) -> None:
        create_video(
            story=story,
            output_path=output,
            music_folder=args.music,
            music_volume=args.music_volume,
            duration=args.duration,
        )

    if args.all:
        pending_count = 0
        for i, story in enumerate(stories):
            existing = list(out_dir.glob(f"goodnews_*_{story['id']}_*.mp4"))
            if existing:
                print(f"  [{i+1}/{len(stories)}] Skipping (exists): {existing[0].name}")
                continue
            pending_count += 1

        print(f"Batch mode: {pending_count} stories to render.\n")

        for i, story in enumerate(stories):
            existing = list(out_dir.glob(f"goodnews_*_{story['id']}_*.mp4"))
            if existing:
                continue
            output = _make_output(i, story)
            headline = story.get("rewritten_headline") or story["original_headline"]
            if args.dry_run:
                print(f"  [{i+1}/{len(stories)}] Would render: {headline[:60]}")
                print(f"    → {output}")
                continue
            print(f"  [{i+1}/{len(stories)}] Starting: {headline[:60]}")
            _run(i, story, output)

        if not args.dry_run:
            print(f"\nAll done!")
    else:
        if args.index >= len(stories):
            sys.exit(f"Error: index {args.index} out of range ({len(stories)} stories).")
        story  = stories[args.index]
        output = args.out if args.out else _make_output(args.index, story)
        if args.dry_run:
            headline = story.get("rewritten_headline") or story["original_headline"]
            print(f"Would render: {headline}")
            print(f"  → {output}")
            return
        _run(args.index, story, output)


if __name__ == "__main__":
    main()
