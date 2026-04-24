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

**You do NOT need separate Google accounts for this.** The quota is per-project, not per-account.
A single Google account can own multiple GCP projects, each with its own independent 10,000 unit/day quota.

---

## Pipelines & Accounts

You can manage everything from a **single Google account**:
- Create all GCP projects under that one account
- Create all YouTube channels under that account (YouTube supports multiple channels per account via Brand Accounts)
- Each pipeline just needs its own GCP project and its own `token.json` authorising the correct channel

| Pipeline | GCP project name |
|---|---|
|DONE `mathchallenge` | math-challenge-shorts |
|DONE `wouldyourather` | would-you-rather-shorts |
|DONE  `trickquestions` | trick-questions-shorts |
|DONE `mandelaeffect` | mandela-effect-shorts |
|DONE `emojiquiz` | emoji-quiz-shorts |
|DONE `funfacts` | fun-facts-shorts |
|DONE `trueorfalse` | true-or-false-shorts |
|DONE `riddles` | riddle-me-shorts |
|DONE `frogfacts` | frog-facts-shorts |

---

## Setup Steps — Repeat for Each Pipeline

### Step 1: Create the YouTube Channel

1. Go to [youtube.com](https://youtube.com) → click your avatar → **Create a channel**
2. Set the channel name, description, and branding before uploading anything
3. Note the channel you want this pipeline to upload to — you'll select it during the OAuth step

### Step 2: Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Name it (e.g. `riddle-me-shorts`) → **Create**

### Step 3: Enable the YouTube Data API v3

1. In the left sidebar: **APIs & Services → Library**
2. Search for `YouTube Data API v3`
3. Click it → **Enable**

### Step 4: Configure the OAuth Consent Screen

1. **APIs & Services → OAuth consent screen**
2. Choose **External** → **Create**
3. Fill in:
   - **App name**: anything (e.g. `Riddle Uploader`)
   - **User support email**: your email
   - **Developer contact email**: your email
4. Click **Save and Continue** through the Scopes and Optional Info pages
5. On the **Audience** tab (Google has renamed this — it was previously called "Test users") → scroll down to the **Test users** section → **+ Add Users** → add your Google account email
   - If you're already past the wizard, go back to **OAuth consent screen → Audience tab** directly
6. Click **Save and Continue** → **Back to Dashboard**

### Step 4.5: Publish the App to Production

Do this **before** generating `token.json` so you only need to authenticate once. Tokens for apps in Testing mode expire after 7 days.

1. **APIs & Services → OAuth consent screen → Audience tab**
2. Scroll down to the **Publishing status** section
3. Click **Publish App** → confirm
4. Google will show a warning that the app is unverified — this is expected for personal scripts. When you authenticate in Step 7, click **Advanced → Go to [app name] (unsafe)** to proceed.

### Step 5: Create OAuth 2.0 Credentials

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Application type: **Desktop app**
3. Name: anything (e.g. `uploader-desktop`)
4. Click **Create**
5. On the confirmation popup, click **Download JSON**
6. **Rename the downloaded file to `client_secrets.json`**

### Step 6: Place the File in the Pipeline Directory

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
frogfacts/client_secrets.json
```

### Step 7: Generate the Production Token

Run the uploader once from inside the pipeline directory to trigger the OAuth browser flow:

```bash
cd frogfacts
python daily_upload.py
cd ..
```

- A browser window opens automatically
- Sign in and **select the correct YouTube channel** for this pipeline
- If Google shows an "unverified app" warning, click **Advanced → Go to [app name] (unsafe)**
- Click **Allow** → close the tab

A `token.json` is saved in the pipeline directory. All future runs are fully silent — no browser needed.

### Step 8: Uncomment the Pipeline in daily_run.py

Only add a pipeline to `daily_run.py` **after** its `token.json` has been generated. Open `daily_run.py` and uncomment the relevant line:

```python
# Before (commented out — not yet set up):
# ("Frog Facts", ROOT / "frogfacts" / "daily_upload.py"),

# After (uncomment once token.json exists):
("Frog Facts", ROOT / "frogfacts" / "daily_upload.py"),
```

If a pipeline is uncommented but has no `token.json`, it will fail during the daily run and block the upload timing for subsequent pipelines.

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

Use this for each pipeline:

- [ ] YouTube channel created
- [ ] GCP project created
- [ ] YouTube Data API v3 enabled
- [ ] OAuth consent screen configured (External, your account added as test user, published to Production)
- [ ] OAuth Desktop credentials created
- [ ] `client_secrets.json` placed in pipeline directory
- [ ] `python daily_upload.py` run from pipeline directory to generate `token.json`
- [ ] Test render checked (`python render_test.py --pipelines <name>`)
- [ ] Pipeline uncommented in `daily_run.py`

---

## Troubleshooting

**`client_secrets.json not found`**
The file is missing from the pipeline directory, or you ran `daily_run.py` before placing it.

**`403 Quota exceeded`**
You've hit the 10,000 unit/day limit for that GCP project. Wait until midnight Pacific time for the quota to reset, or reduce `--limit`.

**`Token has been expired or revoked`**
Delete `token.json` from the pipeline directory and re-run to re-authenticate.

**Browser doesn't open during auth**
Copy the URL printed in the terminal and open it manually.

**Uploading to the wrong YouTube channel**
Delete `token.json` and re-authenticate, making sure to select the correct channel during the OAuth flow.

**Scheduled videos not going public**
YouTube requires the channel to be in good standing and older than 24 hours for scheduled publishing to work.
