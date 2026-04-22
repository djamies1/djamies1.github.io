#!/usr/bin/env python3
"""
make_video.py — Render a 20-second Emoji Quiz Short.

Phase 1 (0–13s): Hook text + giant emoji display centred
Phase 2 (13–20s): Answer fades in below emojis in orange
                  + "Share to test your friends! 👇"

Uses Segoe UI Emoji for colour emoji rendering on Windows.

Usage:
    python make_video.py --index 0
    python make_video.py --list
"""

import argparse, io, json, re, sys
import urllib.parse, urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy import AudioFileClip, VideoClip, concatenate_audioclips

try:
    from pilmoji import Pilmoji
    _HAS_PILMOJI = True
except ImportError:
    _HAS_PILMOJI = False

WIDTH    = 1080
HEIGHT   = 1920
FPS      = 30
DURATION = 20.0
REVEAL_T    = 13.0
ANSWER_FADE = 1.5
HOOK_FADE   = 0.4

PADDING_X       = 60
PADDING_X_RIGHT = 160
DRAW_WIDTH      = WIDTH - PADDING_X - PADDING_X_RIGHT
CENTER_X        = PADDING_X + DRAW_WIDTH // 2

HOOK_Y_FRAC    = 0.12
EMOJI_Y_FRAC   = 0.40
ANSWER_Y_FRAC  = 0.70
PROMPT_Y_FRAC  = 0.88

HOOK_COLOR    = (255, 220, 80)    # warm yellow
ANSWER_COLOR  = (255, 140, 50)    # orange
PROMPT_COLOR  = (255, 255, 255)
SHADOW_COLOR  = (0, 0, 0)

HOOK_FONT_SIZE   = 52
EMOJI_FONT_SIZE  = 160   # large for maximum visual impact
ANSWER_FONT_SIZE = 80
PROMPT_FONT_SIZE = 44
LINE_SPACING     = 1.3
OVERLAY_OPACITY  = 175

POLLINATIONS_URL = (
    "https://image.pollinations.ai/prompt/{prompt}"
    "?width=1080&height=1920&nologo=true&seed={seed}"
)
IMAGE_TIMEOUT = 90

MUSIC_FOLDER = str(Path(__file__).resolve().parent / "eq_music")
MUSIC_VOLUME = 0.45

_DIR                = Path(__file__).resolve().parent
QUESTIONS_FILE      = str(_DIR / "questions.json")
VIDEO_OUTPUT_FOLDER = str(_DIR / "video_output")
BACKGROUND_FOLDER   = str(_DIR / "background_images")

# Emoji font (Windows Segoe UI Emoji supports colour emoji in PIL)
EMOJI_FONTS = [
    "C:/Windows/Fonts/seguiemj.ttf",    # Segoe UI Emoji — Windows 10/11
    "C:/Windows/Fonts/segoeuib.ttf",    # Fallback: Segoe UI Bold (monochrome)
    "C:/Windows/Fonts/arialbd.ttf",
]
DISPLAY_FONTS = [
    "C:/Users/prawn/AppData/Local/Microsoft/Windows/Fonts/FredokaOne-Regular.ttf",
    "C:/Windows/Fonts/FredokaOne-Regular.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/calibrib.ttf",
]
BODY_FONTS = [
    "C:/Windows/Fonts/georgia.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/calibri.ttf",
]


def _load_font(size, display=False, emoji=False):
    paths = EMOJI_FONTS if emoji else (DISPLAY_FONTS if display else BODY_FONTS)
    for path in paths:
        try: return ImageFont.truetype(path, size)
        except OSError: pass
    return ImageFont.load_default()


def _wrap(text, font, max_width):
    dummy = ImageDraw.Draw(Image.new("RGB", (1,1)))
    lines, cur = [], ""
    for word in text.split():
        cand = f"{cur} {word}".strip()
        if dummy.textlength(cand, font=font) <= max_width:
            cur = cand
        else:
            if cur: lines.append(cur)
            cur = word
    if cur: lines.append(cur)
    return lines


def _draw_block(draw, lines, font, cx, cy, lh, color, alpha=255):
    y = cy - len(lines)*lh//2
    for line in lines:
        w = int(draw.textlength(line, font=font))
        x = cx - w//2
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


def load_local_background():
    import random
    folder = Path(BACKGROUND_FOLDER)
    exts = {".jpg",".jpeg",".png",".webp"}
    images = [f for f in folder.iterdir() if f.suffix.lower() in exts]
    if not images:
        return np.full((HEIGHT,WIDTH,3),(15,10,25),dtype=np.uint8)
    chosen = random.choice(images)
    print(f"  Background : {chosen.name}")
    img = Image.open(chosen).convert("RGB")
    scale = max(WIDTH/img.width, HEIGHT/img.height)
    nw,nh = int(img.width*scale), int(img.height*scale)
    img = img.resize((nw,nh),Image.LANCZOS).crop(((nw-WIDTH)//2,(nh-HEIGHT)//2,(nw-WIDTH)//2+WIDTH,(nh-HEIGHT)//2+HEIGHT))
    ov  = Image.new("RGBA", img.size, (0,0,0,OVERLAY_OPACITY))
    img = Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")
    arr = np.array(img, dtype=np.float32)
    Y, X = np.ogrid[:HEIGHT, :WIDTH]
    dist = np.sqrt(((X - WIDTH/2)/(WIDTH*0.6))**2 + ((Y - HEIGHT*0.45)/(HEIGHT*0.55))**2)
    vign = np.clip(1.0 - 0.6*dist**1.5, 0.2, 1.0)[..., np.newaxis]
    return np.clip(arr * vign, 0, 255).astype(np.uint8)


def _content_to_image_prompt(item):
    answer = item.get("answer", "")
    cat = item.get("category", "general")
    return (f"bright vivid colorful playful background, {answer}, {cat}, "
            f"fun emoji themed, vibrant, engaging, digital art")


def fetch_ai_background(item):
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
    img = Image.open(io.BytesIO(img_data)).convert("RGB")
    scale = max(WIDTH/img.width, HEIGHT/img.height)
    nw,nh = int(img.width*scale), int(img.height*scale)
    img = img.resize((nw,nh),Image.LANCZOS).crop(((nw-WIDTH)//2,(nh-HEIGHT)//2,(nw-WIDTH)//2+WIDTH,(nh-HEIGHT)//2+HEIGHT))
    ov  = Image.new("RGBA", img.size, (0,0,0,OVERLAY_OPACITY))
    img = Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")
    arr = np.array(img, dtype=np.float32)
    Y, X = np.ogrid[:HEIGHT, :WIDTH]
    dist = np.sqrt(((X - WIDTH/2)/(WIDTH*0.6))**2 + ((Y - HEIGHT*0.45)/(HEIGHT*0.55))**2)
    vign = np.clip(1.0 - 0.6*dist**1.5, 0.2, 1.0)[..., np.newaxis]
    return np.clip(arr * vign, 0, 255).astype(np.uint8)


def load_background(item):
    try:
        return fetch_ai_background(item)
    except Exception as e:
        print(f"  Background : AI fetch failed ({e}) — using local image")
        return load_local_background()


def _loop_audio(clip, dur):
    if clip.duration >= dur: return clip.subclipped(0, dur)
    return concatenate_audioclips([clip]*(int(dur/clip.duration)+1)).subclipped(0, dur)


def _resolve_music(path):
    import random
    p = Path(path)
    if p.is_dir():
        tracks = [f for f in p.iterdir() if f.suffix.lower() in {".mp3",".wav",".ogg",".flac",".m4a"}]
        if not tracks: return None
        chosen = random.choice(tracks)
        print(f"  Music      : {chosen.name}")
        return str(chosen)
    return path if p.exists() else None


def render_phase1(q):
    """Hook text + big emoji centred."""
    img  = Image.new("RGBA",(WIDTH,HEIGHT),(0,0,0,0))
    draw = ImageDraw.Draw(img)

    # Hook
    hf = _load_font(HOOK_FONT_SIZE, display=True)
    hl = _wrap(q.get("hook","What is this?"), hf, DRAW_WIDTH)
    _draw_block(draw, hl, hf, CENTER_X, int(HEIGHT*HOOK_Y_FRAC),
                int(HOOK_FONT_SIZE*LINE_SPACING), HOOK_COLOR)

    # Emoji — large, centred (use Pilmoji for colour rendering if available)
    ef     = _load_font(EMOJI_FONT_SIZE, emoji=True)
    emojis = q["emojis"]
    ey     = int(HEIGHT*EMOJI_Y_FRAC) - EMOJI_FONT_SIZE//2
    if _HAS_PILMOJI:
        dummy = ImageDraw.Draw(Image.new("RGB", (1, 1)))
        ew = int(dummy.textlength(emojis, font=ef))
        ex = CENTER_X - ew//2
        with Pilmoji(img) as pm:
            pm.text((ex, ey), emojis, font=ef, fill=(255,255,255,255))
    else:
        el = _wrap(emojis, ef, DRAW_WIDTH) if draw.textlength(emojis, font=ef) > DRAW_WIDTH else [emojis]
        _draw_block(draw, el, ef, CENTER_X, int(HEIGHT*EMOJI_Y_FRAC),
                    int(EMOJI_FONT_SIZE*LINE_SPACING), (255,255,255))

    return np.array(img)


def render_answer(q):
    img  = Image.new("RGBA",(WIDTH,HEIGHT),(0,0,0,0))
    draw = ImageDraw.Draw(img)
    af   = _load_font(ANSWER_FONT_SIZE, display=True)
    al   = _wrap(f"✓ {q['answer']}", af, DRAW_WIDTH)
    alh  = int(ANSWER_FONT_SIZE*LINE_SPACING)
    y = int(HEIGHT*ANSWER_Y_FRAC) - len(al)*alh//2
    for line in al:
        w = int(draw.textlength(line, font=af))
        x = CENTER_X - w//2
        draw.text((x+2,y+2), line, font=af, fill=(*SHADOW_COLOR,200))
        draw.text((x,y), line, font=af, fill=(*ANSWER_COLOR,255))
        y += alh
    return np.array(img)


def render_prompt():
    img  = Image.new("RGBA",(WIDTH,HEIGHT),(0,0,0,0))
    draw = ImageDraw.Draw(img)
    f = _load_font(PROMPT_FONT_SIZE)
    l = _wrap("Share to test your friends!", f, DRAW_WIDTH)
    _draw_block(draw, l, f, CENTER_X, int(HEIGHT*PROMPT_Y_FRAC),
                int(PROMPT_FONT_SIZE*LINE_SPACING), PROMPT_COLOR, alpha=215)
    return np.array(img)


def create_video(question, output_path, music_path=MUSIC_FOLDER, music_volume=MUSIC_VOLUME):
    print(f'\nRendering: {question["emojis"]} → {question["answer"]}')
    bg = load_background(question).astype(np.float32)
    p1 = render_phase1(question); p1f,p1a = p1[:,:,:3].astype(np.float32), p1[:,:,3:4].astype(np.float32)/255
    an = render_answer(question);  anf,ana = an[:,:,:3].astype(np.float32), an[:,:,3:4].astype(np.float32)/255
    pr = render_prompt();          prf,pra = pr[:,:,:3].astype(np.float32), pr[:,:,3:4].astype(np.float32)/255
    audio = None
    if music_path:
        r = _resolve_music(music_path)
        if r: audio = _loop_audio(AudioFileClip(r), DURATION).with_volume_scaled(music_volume)
    print(f"  Output     : {output_path}\n")
    total = int(DURATION*FPS); rendered=[0]
    def make_frame(t):
        fade = min(1.0,t/HOOK_FADE)
        eff  = p1a*fade; frame = bg*(1-eff)+p1f*eff
        if t >= REVEAL_T:
            af = min(1.0,(t-REVEAL_T)/ANSWER_FADE)
            ea = ana*af; frame = frame*(1-ea)+anf*ea
            ep = pra*af; frame = frame*(1-ep)+prf*ep
        rendered[0]+=1
        if rendered[0]%30==0 or rendered[0]==total:
            print(f"\r  Rendering  : {rendered[0]/total*100:.0f}%",end="",flush=True)
        return frame.astype(np.uint8)
    clip = VideoClip(make_frame, duration=DURATION)
    if audio: clip = clip.with_audio(audio)
    clip.write_videofile(output_path, fps=FPS, codec="libx264", audio_codec="aac", logger=None)
    clip.close(); print(f"\n\nDone! Saved to: {output_path}")


def load_questions():
    p = Path(QUESTIONS_FILE)
    if not p.exists(): sys.exit("questions.json not found.")
    with open(p, encoding="utf-8") as f: return json.load(f)


def _make_path(index, q):
    out = Path(VIDEO_OUTPUT_FOLDER); out.mkdir(parents=True, exist_ok=True)
    safe = re.sub(r"[^a-zA-Z0-9 _-]","",q["answer"]).strip().replace(" ","_")[:35]
    return str(out/f"eq_{index:04d}_{q.get('id','x')}_{safe}.mp4")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--index", type=int, default=0)
    p.add_argument("--music", default=MUSIC_FOLDER)
    p.add_argument("--music-volume", type=float, default=MUSIC_VOLUME)
    p.add_argument("--out", default=None)
    p.add_argument("--list", action="store_true")
    args = p.parse_args()
    qs = load_questions()
    if args.list:
        for i,q in enumerate(qs):
            print(f"{i:<5} {q['emojis']:<20} → {q['answer']}")
        return
    if args.index >= len(qs): sys.exit("Index out of range.")
    q = qs[args.index]
    create_video(q, args.out or _make_path(args.index, q), args.music, args.music_volume)

if __name__ == "__main__": main()
