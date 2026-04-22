# YouTube API Setup — All Pipelines

## Overview

Each pipeline uploads to its own YouTube channel via the YouTube Data API v3.
The code uses **OAuth 2.0** (not an API key). Each pipeline needs two files in its directory:

- `client_secrets.json` — identifies your app to Google (downloaded from Google Cloud Console)
- `token.json` — authorises a specific YouTube channel (auto-generated on first run)

### Quota note — separate GCP projects are required

Uploading 1 video costs **1,600 API units**. The default quota is **10,000 units/day per project**.

| | Calculation |
|---|---|
| Videos per day | 8 pipelines × 3 videos = **24 videos** |
| Units needed | 24 × 1,600 = **38,400 units/day** |
| One project gives you | **10,000 units/day** — exhausted after just 6 uploads |
| 8 projects give you | **80,000 units/day** — comfortably covers everything |

**You must create one GCP project per pipeline.** Sharing a single project across pipelines
will hit the quota limit after the first pipeline finishes and all remaining uploads will fail with a 403 error.

---

## Pipelines & Accounts

| Pipeline | Suggested Google account | GCP project name |
|---|---|---|
| `mathchallenge` | mathYT@gmail.com | math-challenge-shorts |
| `wouldyourather` | wyrYT@gmail.com | would-you-rather-shorts |
| `trickquestions` | trickqYT@gmail.com | trick-questions-shorts |
| `mandelaeffect` | mandelaYT@gmail.com | mandela-effect-shorts |
| `emojiquiz` | emojiquizYT@gmail.com | emoji-quiz-shorts |
| `funfacts` | funfactsYT@gmail.com | fun-facts-shorts |
| `trueorfalse` | tofYT@gmail.com | true-or-false-shorts |
| `riddles` | riddleYT@gmail.com | riddle-me-shorts |

---

## Setup Steps — Repeat for Each Pipeline

### Step 1: Create a Google Account

Create a dedicated Google account for each YouTube channel if you haven't already
(e.g. `riddleYT@gmail.com`).

### Step 2: Create the YouTube Channel

1. Sign into that Google account
2. Go to [youtube.com](https://youtube.com) → click your avatar → **Create a channel**
3. Set the channel name, description, and branding before uploading anything

### Step 3: Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with the **same Google account** as the YouTube channel
3. Click the project dropdown at the top → **New Project**
4. Name it (e.g. `riddle-me-shorts`) → **Create**

### Step 4: Enable the YouTube Data API v3

1. In the left sidebar: **APIs & Services → Library**
2. Search for `YouTube Data API v3`
3. Click it → **Enable**

### Step 5: Configure the OAuth Consent Screen

1. **APIs & Services → OAuth consent screen**
2. Choose **External** → **Create**
3. Fill in:
   - **App name**: anything (e.g. `Riddle Uploader`)
   - **User support email**: your email
   - **Developer contact email**: your email
4. Click **Save and Continue** through the Scopes and Optional Info pages
5. On the **Audience** tab (Google has renamed this — it was previously called "Test users") → scroll down to the **Test users** section → **+ Add Users** → add the Gmail address for this channel's account
   - If you're already past the wizard, go back to **OAuth consent screen → Audience tab** directly
6. Click **Save and Continue** → **Back to Dashboard**

### Step 5.5: Publish the App to Production

Do this **before** generating `token.json` so you only need to authenticate once. Tokens for apps in Testing mode expire after 7 days.

1. **APIs & Services → OAuth consent screen → Audience tab**
2. Scroll down to the **Publishing status** section
3. Click **Publish App** → confirm
4. Google will show a warning that the app is unverified — this is expected for personal scripts. When you authenticate in Step 8, click **Advanced → Go to [app name] (unsafe)** to proceed.

### Step 6: Create OAuth 2.0 Credentials

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Application type: **Desktop app**
3. Name: anything (e.g. `uploader-desktop`)
4. Click **Create**
5. On the confirmation popup, click **Download JSON**
6. **Rename the downloaded file to `client_secrets.json`**

### Step 7: Place the File in the Pipeline Directory

Put `client_secrets.json` inside the pipeline's folder:

```
mathchallenge/client_secrets.json
wouldyourather/client_secrets.json
trickquestions/client_secrets.json
mandelaeffect/client_secrets.json
emojiquiz/client_secrets.json
funfacts/client_secrets.json
trueorfalse/client_secrets.json
riddles/client_secrets.json
```

### Step 8: Authenticate (First Run)

From the **project root**, run a dry-run for that pipeline:

```bash
# Replace "riddles" with whichever pipeline you're setting up
cd riddles && python daily_upload.py --dry-run && cd ..
```

- A browser window opens automatically
- Sign in with **that pipeline's Google account** (e.g. `riddleYT@gmail.com`)
- Click **Allow**
- Close the tab

A `token.json` is saved in the pipeline directory. All future runs are silent — no browser needed.

---

## After Setup — Running Everything

### Render test videos first (no YouTube required)

```bash
python render_test.py
```

This renders one video per pipeline into each `video_output/` folder without touching YouTube.

### Run all pipelines

```bash
python daily_run.py
```

### Useful options

```bash
# Preview what would upload without actually uploading
python daily_run.py --dry-run

# Upload 1 video per pipeline instead of 3
python daily_run.py --limit 1

# Set as private while testing
python daily_run.py --privacy private

# Change the scheduling gap between videos
python daily_run.py --stagger-hours 6
```

---

## Per-Pipeline Checklist

Use this for each of the 8 pipelines:

- [ ] Google account created
- [ ] YouTube channel created on that account
- [ ] GCP project created (signed in as that account)
- [ ] YouTube Data API v3 enabled
- [ ] OAuth consent screen configured (External, test user added, published to Production)
- [ ] OAuth Desktop credentials created
- [ ] `client_secrets.json` placed in pipeline directory
- [ ] `python daily_upload.py --dry-run` run from pipeline directory to generate `token.json`
- [ ] Test render checked (`python render_test.py --pipelines <name>`)

---

## Troubleshooting

**`client_secrets.json not found`**
The file is missing from the pipeline directory, or you ran `daily_run.py` before placing it.

**`403 Quota exceeded`**
You've hit the 10,000 unit/day limit for that GCP project. Wait until midnight Pacific time for the quota to reset, or reduce `--limit`.

**`Token has been expired or revoked`**
Delete `token.json` from the pipeline directory and re-run `--dry-run` to re-authenticate.

**Browser doesn't open during auth**
Copy the URL printed in the terminal and open it manually.

**Scheduled videos not going public**
YouTube requires the channel to be in good standing and older than 24 hours for scheduled publishing to work.
