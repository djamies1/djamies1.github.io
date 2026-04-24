#!/usr/bin/env python3
"""
make_video.py — Render an 18-second Frog Facts Short.

Layout (top → bottom):
  - Psychedelic AI-generated frog background (Pollinations)
  - "FROG FACTS" title: large bubbly font, per-letter rainbow cycling
  - Fact text: multi-color vivid lines on dark panel, easy to read
  - Footer: "Follow for daily frog facts"
  - Audio: music from frog_music/ folder (no TTS)

The title rainbow loops perfectly at 18s (integer hue cycles).

Usage:
    python make_video.py --index 0
    python make_video.py --list
    python make_video.py --index 0 --out test.mp4
"""

import argparse, colorsys, io, json, math, re, sys
import urllib.parse, urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from moviepy import AudioFileClip, VideoClip, concatenate_audioclips

# ── Dimensions & timing ──────────────────────────────────────────────────────
WIDTH    = 1080
HEIGHT   = 1920
FPS      = 30
DURATION = 9.984     # fallback — overridden at render time by actual audio length

# ── Layout fractions (centre-y of each element as fraction of HEIGHT) ────────
TITLE_Y_FRAC  = 0.11   # "FROG FACTS"
FACT_Y_FRAC   = 0.50   # fact text block (centred vertically)
FOOTER_Y_FRAC = 0.82   # follow prompt

# ── Font sizes ────────────────────────────────────────────────────────────────
TITLE_FONT_SIZE  = 128
FACT_FONT_SIZE   = 58   # shrunk automatically if fact text is long
FOOTER_FONT_SIZE = 38

LINE_SPACING     = 1.35
PADDING_X        = 70          # horizontal margin for text
DRAW_WIDTH       = WIDTH - PADDING_X * 2
CENTER_X         = WIDTH // 2

# ── Colours ───────────────────────────────────────────────────────────────────
FOOTER_COLOR = (190, 255, 190)   # pale frog-green

# Vivid psychedelic palette — one colour per wrapped line of fact text
PSYCHEDELIC_COLORS = [
    (255, 255, 70),   # electric yellow
    (255, 90, 255),   # hot magenta
    (70, 255, 210),   # mint / cyan
    (255, 160, 45),   # neon orange
    (170, 255, 70),   # lime green
    (255, 70, 175),   # hot pink
    (70, 195, 255),   # sky blue
]

# ── Background / Pollinations ─────────────────────────────────────────────────
OVERLAY_OPACITY  = 155           # 0-255 darkness of overlay on background
IMAGE_TIMEOUT    = 90

POLLINATIONS_URL = (
    "https://image.pollinations.ai/prompt/{prompt}"
    "?width=1080&height=1920&nologo=true&seed={seed}"
)

# ── Audio ─────────────────────────────────────────────────────────────────────
MUSIC_VOLUME = 0.88
MUSIC_FOLDER = str(Path(__file__).resolve().parent / "frog_music")

# ── Paths ─────────────────────────────────────────────────────────────────────
_DIR                = Path(__file__).resolve().parent
FACTS_FILE          = str(_DIR / "facts.json")
VIDEO_OUTPUT_FOLDER = str(_DIR / "video_output")
BACKGROUND_FOLDER   = str(_DIR / "background_images")

# ── Font search paths (Windows) ───────────────────────────────────────────────
DISPLAY_FONTS = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/FredokaOne-Regular.ttf",
    "C:/Windows/Fonts/FredokaOne-Regular.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/calibrib.ttf",
]
BODY_FONTS = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/FredokaOne-Regular.ttf",
    "C:/Windows/Fonts/FredokaOne-Regular.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/calibri.ttf",
]


# ── Font helpers ──────────────────────────────────────────────────────────────

def _load_font(size, display=False):
    for path in (DISPLAY_FONTS if display else BODY_FONTS):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()


def _wrap(text, font, max_width):
    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    lines, cur = [], ""
    for word in text.split():
        cand = f"{cur} {word}".strip()
        if dummy.textlength(cand, font=font) <= max_width:
            cur = cand
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def _block_size(lines, font, lh):
    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    w = max((int(dummy.textlength(l, font=font)) for l in lines), default=0)
    return w, len(lines) * lh


# ── Drawing primitives ────────────────────────────────────────────────────────

def _draw_panel(draw, cx, cy, bw, bh, color=(0, 0, 0), alpha=165, radius=30, px=55, py=32):
    x0 = int(cx - bw // 2 - px)
    y0 = int(cy - bh // 2 - py)
    x1 = int(cx + bw // 2 + px)
    y1 = int(cy + bh // 2 + py)
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=(*color, alpha))


def _draw_block(draw, lines, font, cx, cy, lh, color, alpha=255, stroke=3):
    y = cy - len(lines) * lh // 2
    for line in lines:
        w = int(draw.textlength(line, font=font))
        x = cx - w // 2
        draw.text((x, y), line, font=font, fill=(*color, alpha),
                  stroke_width=stroke, stroke_fill=(0, 0, 0, 255))
        y += lh


def _draw_fact_block(draw, lines, font, cx, cy, lh):
    """Each wrapped line gets its own vivid psychedelic colour."""
    y = cy - len(lines) * lh // 2
    for i, line in enumerate(lines):
        color = PSYCHEDELIC_COLORS[i % len(PSYCHEDELIC_COLORS)]
        w = int(draw.textlength(line, font=font))
        x = cx - w // 2
        draw.text((x, y), line, font=font, fill=(*color, 255),
                  stroke_width=4, stroke_fill=(0, 0, 0, 255))
        y += lh


def _draw_rainbow_title(img, text, font, cx, cy, t, duration):
    """
    Psychedelic animated title:
      - Per-letter rainbow hue (4 full cycles over duration)
      - Per-letter vertical bounce (sine wave, each letter phase-shifted)
      - Neon glow halo (blurred colour layer composited beneath sharp text)
    """
    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))

    # Measure widths; handle space specially
    m_w = int(dummy.textlength("M", font=font))
    sm_w = int(dummy.textlength(" M", font=font))
    space_w = max(sm_w - m_w, m_w // 3)

    char_widths = [
        space_w if ch == " " else int(dummy.textlength(ch, font=font))
        for ch in text
    ]
    total_w = sum(char_widths)

    ascent, descent = font.getmetrics()
    base_y = cy - (ascent + descent) // 2

    non_spaces = [ch for ch in text if ch != " "]
    n = len(non_spaces)

    # Build per-character render info
    chars_info = []
    x = cx - total_w // 2
    ns_idx = 0
    for ch, cw in zip(text, char_widths):
        if ch != " ":
            # 4 hue cycles over duration → vivid fast-shifting rainbow
            hue = (t * 4 / duration + ns_idx / max(n, 1)) % 1.0
            r, g, b = colorsys.hsv_to_rgb(hue, 1.0, 1.0)
            color = (int(r * 255), int(g * 255), int(b * 255))
            # Bounce: each letter has a phase offset so they ripple independently
            bounce = int(math.sin(t * math.pi * 3 + ns_idx * 0.7) * 18)
            chars_info.append((x, base_y + bounce, ch, color))
            ns_idx += 1
        x += cw

    # ── Glow pass: draw wide stroked text, blur it, composite under sharp text ─
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for lx, ly, ch, color in chars_info:
        gd.text((lx, ly), ch, font=font,
                fill=(*color, 180), stroke_width=22, stroke_fill=(*color, 60))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=20))
    img.alpha_composite(glow)

    # ── Sharp text pass on top ─────────────────────────────────────────────────
    sd = ImageDraw.Draw(img)
    for lx, ly, ch, color in chars_info:
        sd.text((lx, ly), ch, font=font,
                fill=(*color, 255), stroke_width=6, stroke_fill=(0, 0, 0, 255))


def _draw_rainbow_footer(img, text, font, cx, cy, t, duration):
    """
    Psychedelic footer: per-character rainbow hue + soft glow. No bounce (stays readable).
    """
    dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    m_w   = int(dummy.textlength("M", font=font))
    sm_w  = int(dummy.textlength(" M", font=font))
    space_w = max(sm_w - m_w, m_w // 3)

    char_widths = [space_w if ch == " " else int(dummy.textlength(ch, font=font)) for ch in text]
    total_w = sum(char_widths)
    ascent, descent = font.getmetrics()
    base_y = cy - (ascent + descent) // 2

    non_spaces = [ch for ch in text if ch != " "]
    n = len(non_spaces)

    chars_info = []
    x = cx - total_w // 2
    ns_idx = 0
    for ch, cw in zip(text, char_widths):
        if ch != " ":
            hue = (t * 2 / duration + ns_idx / max(n, 1)) % 1.0
            r, g, b = colorsys.hsv_to_rgb(hue, 1.0, 1.0)
            chars_info.append((x, base_y, ch, (int(r * 255), int(g * 255), int(b * 255))))
            ns_idx += 1
        x += cw

    # Soft glow pass
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for lx, ly, ch, color in chars_info:
        gd.text((lx, ly), ch, font=font, fill=(*color, 140),
                stroke_width=10, stroke_fill=(*color, 40))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=10))
    img.alpha_composite(glow)

    # Sharp text pass
    sd = ImageDraw.Draw(img)
    for lx, ly, ch, color in chars_info:
        sd.text((lx, ly), ch, font=font, fill=(*color, 230),
                stroke_width=3, stroke_fill=(0, 0, 0, 255))


# ── Background loading ────────────────────────────────────────────────────────

def _apply_overlay_and_vignette(img: Image.Image) -> np.ndarray:
    ov  = Image.new("RGBA", img.size, (0, 0, 0, OVERLAY_OPACITY))
    img = Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")
    arr = np.array(img, dtype=np.float32)
    Y, X = np.ogrid[:HEIGHT, :WIDTH]
    dist = np.sqrt(
        ((X - WIDTH / 2) / (WIDTH * 0.6)) ** 2 +
        ((Y - HEIGHT * 0.45) / (HEIGHT * 0.55)) ** 2
    )
    vign = np.clip(1.0 - 0.6 * dist ** 1.5, 0.2, 1.0)[..., np.newaxis]
    return np.clip(arr * vign, 0, 255).astype(np.uint8)


def _fit_and_crop(img: Image.Image) -> Image.Image:
    scale = max(WIDTH / img.width, HEIGHT / img.height)
    nw, nh = int(img.width * scale), int(img.height * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    x0, y0 = (nw - WIDTH) // 2, (nh - HEIGHT) // 2
    return img.crop((x0, y0, x0 + WIDTH, y0 + HEIGHT))


def _image_prompt(item: dict) -> str:
    keywords = " ".join(str(item.get("fact", "")).split()[:6])
    return (
        f"psychedelic trippy frog illustration, neon colors, vibrant glowing mushrooms, "
        f"rainbow swamp, lotus flowers, surreal dreamlike jungle, {keywords}, "
        f"vivid kaleidoscope patterns, no text, no letters, digital art, 8k"
    )


def fetch_ai_background(item: dict) -> np.ndarray:
    prompt  = _image_prompt(item)
    encoded = urllib.parse.quote(prompt)
    seed    = abs(hash(str(item.get("id", "x")))) % 99999
    url     = POLLINATIONS_URL.format(prompt=encoded, seed=seed)
    print(f"  Background : fetching AI image (seed={seed})...")
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "frogfacts/1.0"})
            with urllib.request.urlopen(req, timeout=IMAGE_TIMEOUT) as resp:
                img_data = resp.read()
            break
        except Exception as e:
            if attempt < 1:
                print(f"  Background : attempt {attempt + 1} failed ({e}) — retrying...")
                import time; time.sleep(10)
            else:
                raise
    img = Image.open(io.BytesIO(img_data)).convert("RGB")
    return _apply_overlay_and_vignette(_fit_and_crop(img))


def load_local_background() -> np.ndarray:
    import random
    folder = Path(BACKGROUND_FOLDER)
    exts   = {".jpg", ".jpeg", ".png", ".webp"}
    images = [f for f in folder.iterdir() if f.suffix.lower() in exts] if folder.exists() else []
    if not images:
        print("  Background : no local images — using solid colour")
        return np.full((HEIGHT, WIDTH, 3), (10, 35, 10), dtype=np.uint8)
    chosen = random.choice(images)
    print(f"  Background : {chosen.name}")
    img = Image.open(chosen).convert("RGB")
    return _apply_overlay_and_vignette(_fit_and_crop(img))


def load_background(item: dict) -> np.ndarray:
    try:
        return fetch_ai_background(item)
    except Exception as e:
        print(f"  Background : AI fetch failed ({e}) — using local fallback")
        return load_local_background()


# ── Audio helpers ─────────────────────────────────────────────────────────────

def _loop_audio(clip, dur):
    if clip.duration >= dur:
        return clip.subclipped(0, dur)
    return concatenate_audioclips([clip] * (int(dur / clip.duration) + 1)).subclipped(0, dur)


def _resolve_music(path):
    import random
    p = Path(path)
    if p.is_dir():
        tracks = [f for f in p.iterdir()
                  if f.suffix.lower() in {".mp3", ".wav", ".ogg", ".flac", ".m4a"}]
        if not tracks:
            return None
        chosen = random.choice(tracks)
        print(f"  Music      : {chosen.name}")
        return str(chosen)
    return str(p) if p.exists() else None


# ── Main render ───────────────────────────────────────────────────────────────

def create_video(fact: dict, output_path: str,
                 music_path: str = MUSIC_FOLDER,
                 music_volume: float = MUSIC_VOLUME):

    print(f'\nRendering : {fact["fact"][:65]}...')

    # ── Pre-compute background (slow, done once) ──────────────────────────────
    bg = load_background(fact)

    # ── Pre-compute text layout (geometry fixed, only colours animate) ────────
    title_font  = _load_font(TITLE_FONT_SIZE,  display=True)
    footer_font = _load_font(FOOTER_FONT_SIZE, display=False)

    # Auto-shrink fact font if the text is very long
    fact_font_size = FACT_FONT_SIZE
    while fact_font_size >= 28:
        fact_font = _load_font(fact_font_size, display=True)
        fact_lh   = int(fact_font_size * LINE_SPACING)
        fact_lines = _wrap(fact["fact"], fact_font, DRAW_WIDTH)
        _, fh = _block_size(fact_lines, fact_font, fact_lh)
        if fh <= int(HEIGHT * 0.42):
            break
        fact_font_size -= 4

    fw, fh = _block_size(fact_lines, fact_font, fact_lh)

    footer_lines = _wrap("Follow for daily frog facts", footer_font, DRAW_WIDTH)
    footer_lh    = int(FOOTER_FONT_SIZE * LINE_SPACING)

    # ── Audio — duration matched to actual track length ───────────────────────
    audio    = None
    duration = DURATION   # fallback if no music
    if music_path:
        track = _resolve_music(music_path)
        if track:
            raw_clip = AudioFileClip(track)
            duration = raw_clip.duration   # video length = audio length
            audio    = _loop_audio(raw_clip, duration).with_volume_scaled(music_volume)

    # ── Frame generator ───────────────────────────────────────────────────────
    total    = int(duration * FPS)
    rendered = [0]

    def make_frame(t):
        # Start from background
        img  = Image.fromarray(bg).convert("RGBA")
        draw = ImageDraw.Draw(img)

        # "FROG FACTS" rainbow title (psychedelic: bounce + glow + fast hue)
        _draw_rainbow_title(img, "FROG FACTS", title_font, CENTER_X,
                            int(HEIGHT * TITLE_Y_FRAC), t, duration)

        # Dark panel behind fact text
        _draw_panel(draw, CENTER_X, int(HEIGHT * FACT_Y_FRAC), fw, fh,
                    color=(0, 0, 0), alpha=170)

        # Fact text (multi-colour lines)
        _draw_fact_block(draw, fact_lines, fact_font, CENTER_X,
                         int(HEIGHT * FACT_Y_FRAC), fact_lh)

        # Psychedelic rainbow footer
        _draw_rainbow_footer(img, "Subscribe for more FROG FACTS", footer_font,
                             CENTER_X, int(HEIGHT * FOOTER_Y_FRAC), t, duration)

        rendered[0] += 1
        if rendered[0] % 30 == 0 or rendered[0] == total:
            print(f"\r  Rendering  : {rendered[0] / total * 100:.0f}%",
                  end="", flush=True)

        return np.array(img.convert("RGB"))

    # ── Encode ────────────────────────────────────────────────────────────────
    print(f"  Output     : {output_path}")
    clip = VideoClip(make_frame, duration=duration)
    if audio:
        clip = clip.with_audio(audio)
    clip.write_videofile(
        output_path, fps=FPS, codec="libx264", audio_codec="aac", logger=None,
        ffmpeg_params=["-pix_fmt", "yuv420p", "-profile:v", "main", "-level", "4.0",
                       "-movflags", "+faststart"],
    )
    clip.close()
    print(f"\n  Done! Saved to: {output_path}")


# ── CLI ───────────────────────────────────────────────────────────────────────

def _load_facts():
    p = Path(FACTS_FILE)
    if not p.exists():
        sys.exit(f"facts.json not found — run scrape_facts.py first.")
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def _make_path(index: int, fact: dict) -> str:
    out  = Path(VIDEO_OUTPUT_FOLDER)
    out.mkdir(parents=True, exist_ok=True)
    safe = re.sub(r"[^a-zA-Z0-9 _-]", "", fact["fact"]).strip().replace(" ", "_")[:35]
    return str(out / f"frog_{index:04d}_{fact.get('id', 'x')}_{safe}.mp4")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--index",        type=int,   default=0)
    ap.add_argument("--out",          default=None)
    ap.add_argument("--music",        default=MUSIC_FOLDER)
    ap.add_argument("--music-volume", type=float, default=MUSIC_VOLUME)
    ap.add_argument("--list",         action="store_true")
    ap.add_argument("--no-narration", action="store_true",  # accepted for render_test.py compat
                    help=argparse.SUPPRESS)
    args = ap.parse_args()

    facts = _load_facts()

    if args.list:
        for i, f in enumerate(facts):
            print(f"{i:<5} [{f.get('id', '?')}] {f['fact'][:70]}")
        return

    if args.index >= len(facts):
        sys.exit("Index out of range.")

    fact = facts[args.index]
    create_video(
        fact,
        args.out or _make_path(args.index, fact),
        args.music,
        args.music_volume,
    )


if __name__ == "__main__":
    main()
