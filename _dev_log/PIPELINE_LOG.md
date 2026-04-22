# YouTube Shorts Pipeline — Dev Log

## Session: 2026-04-17

### Context
Three existing pipelines run via `daily_run.py`:
- **riddles/** — best performer. Question + answer in description. 20s video, static BG + text overlay + music.
- **twosentencehorror/** — removed (passive consumption, low engagement)
- **nosleep/** — removed (passive consumption, low engagement)

### Research Findings
Algorithm signals ranked:
1. Completion rate (primary) — 20s format already wins here
2. Replay rate — puzzle/reveal mechanic forces rewatches
3. Comments — organic answer-posting beats explicit bait

Best new pipeline: **Math Challenges**
- "99% of people fail this" framing triggers ego/identity
- Order-of-operations problems go viral because adults genuinely disagree (PEMDAS debates)
- Text-only, scrapable/generatable, comment section becomes a scoreboard

---

## All Pipeline Build Status — COMPLETE ✅

| # | Pipeline | Folder | Status | Colour Scheme | Notes |
|---|----------|--------|--------|---------------|-------|
| 1 | Math Challenge | `mathchallenge/` | ✅ Built | Green reveal | 60 seed problems, 6 categories |
| 2 | Would You Rather | `wouldyourather/` | ✅ Built | Blue/red pill boxes | 60 seed questions, 9 categories |
| 3 | Trick Questions | `trickquestions/` | ✅ Built | Gold reveal | 60 seed questions, 8 categories |
| 4 | Mandela Effect | `mandelaeffect/` | ✅ Built | Purple/violet reveal | 60 seed questions |
| 5 | Emoji Quiz | `emojiquiz/` | ✅ Built | Orange reveal + 160px emoji | 60 seed questions, 4 categories |
| 6 | Fun Facts | `funfacts/` | ✅ Built | Cyan/teal reveal | 60 seed facts, 7 categories |
| 7 | True or False | `trueorfalse/` | ✅ Built | Green=TRUE / Red=FALSE | 60 seed statements, 8 categories |
| 8 | Riddles | `riddles/` | ✅ Existing | Original | Original pipeline, best performer |

---

## Active daily_run.py order
```
1. mathchallenge    (Green,  Education)
2. wouldyourather   (Blue/Red, Entertainment)
3. trickquestions   (Gold,   Education)
4. mandelaeffect    (Purple, Education)
5. emojiquiz        (Orange, Entertainment)
6. funfacts         (Cyan,   Education)
7. trueorfalse      (Green/Red, Education)
8. riddles          (Original)
```

---

## ⚠️ YouTube Quota Warning
- Default quota: **10,000 units/day**
- Each upload: **~1,600 units**
- Max uploads/day: **~6**
- 8 pipelines × `--limit 1` = 8 uploads = **12,800 units** → exceeds quota

**Solutions:**
1. **Request quota increase** at [Google Cloud Console](https://console.cloud.google.com/) → APIs → YouTube Data API v3 → Quotas
2. Run only select pipelines per day, rotating them
3. Use `--limit 1` and only run 6 pipelines per day

---

## File Structure (each pipeline has same 4-file pattern)
```
<pipeline>/
├── <content>.json          ← seed content bank (60+ items)
├── uploaded.json           ← upload tracker (auto-created)
├── generate_*.py           ← Claude API batch generator
├── make_video.py           ← PIL + MoviePy renderer
├── daily_upload.py         ← orchestrator (pick → render → upload)
├── background_images/      ← drop branded BG images here
├── <name>_music/           ← drop music tracks here
└── video_output/           ← rendered MP4s (auto-created)
```

---

## Next Session Quickstart

### 1. Add assets (required to render)
- Drop background images into each `*/background_images/` folder (any JPG/PNG)
- Drop music tracks into each `*_music/` folder (MP3/WAV/OGG)

### 2. Test a single render
```bash
python mathchallenge/make_video.py --index 0
python trueorfalse/make_video.py --index 0
python emojiquiz/make_video.py --index 0
```

### 3. Dry run all pipelines
```bash
python daily_run.py --dry-run
```

### 4. Generate more content
```bash
python mathchallenge/generate_problems.py --count 20 --category trick_question
python trueorfalse/generate_statements.py --count 20
python emojiquiz/generate_questions.py --count 20 --category movies
python funfacts/generate_facts.py --count 20
```

### 5. Upload (quota-safe: 6 pipelines × limit 1)
```bash
python daily_run.py --limit 1 --privacy private
```

---

## Design Decisions

### Two-Phase Reveal (all except WYR)
- Question visible 0–13s: viewer formulates answer, hooks brain
- Answer fades in at 13s: viewers who answered wrong replay to "understand"
- Both mechanics drive completion rate AND replay rate simultaneously

### No-Reveal for Would You Rather
- Both options visible from frame 1
- Engagement comes from debate in comments (A vs B)
- Still uses full 20s for algorithm completion signal

### Colour Identity System
| Pipeline | Answer Colour | Hex |
|----------|--------------|-----|
| Math | Green | #50DC78 |
| Trick Q | Gold | #FFD700 |
| Mandela | Purple | #BF7FFF |
| Emoji Quiz | Orange | #FF8C32 |
| Fun Facts | Cyan | #32DCC8 |
| True/False | Green (T) / Red (F) | #3CDC64 / #FF5050 |
| WYR | Blue pill / Red pill | — |

### Generator Pattern (all `generate_*.py`)
```python
client = anthropic.Anthropic()
msg = client.messages.create(model="claude-opus-4-6", max_tokens=2048,
    messages=[{"role":"user","content":prompt}])
raw = msg.content[0].text.strip()
if raw.startswith("```"):
    raw = raw.split("\n",1)[1].rsplit("```",1)[0].strip()
items = json.loads(raw)
```
All generators deduplicate against existing content bank before saving.
