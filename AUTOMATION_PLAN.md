# YouTube Shorts Pipeline — Full Automation Plan

## The Goal

Run `python daily_run.py --limit 1` automatically every day on a remote machine —
no local machine required, completely free or near-free.

---

## Options Compared

| Option | Cost | RAM / CPU | Storage | Scheduling | Difficulty |
|---|---|---|---|---|---|
| **Oracle Cloud Always Free ARM** | Free forever | 4 OCPUs / 24 GB | 200 GB | cron | Medium |
| GitHub Actions | Free (2,000 min/mo public) | 2 vCPU / 7 GB | Ephemeral | cron syntax | Easy |
| Google Cloud e2-micro | Free forever | 1 shared vCPU / 1 GB | 30 GB | cron | Medium |
| PythonAnywhere Free | Free | 0.5 GB | 500 MB | 1 task/day | Easy |
| Render.com Free | Free | 512 MB | Ephemeral | cron | Easy |
| Railway.app | ~$5 credit/mo | Flexible | Flexible | cron | Easy |

### Why most of the "easy" ones don't work well here

- **PythonAnywhere**: 500 MB disk is too small for video output files and audio assets.
  Also blocks outbound internet on the free tier (needed for YouTube uploads).
- **Render Free**: Ephemeral disk — all rendered videos vanish after the run. Spin-up
  delay means the first cron trigger often times out.
- **Google Cloud e2-micro**: Only 1 GB RAM. `moviepy` rendering can spike to 2–3 GB.
  You'll hit OOM errors on longer videos.
- **GitHub Actions**: Viable but complex — no persistent disk, so token.json must be
  committed back to the repo each run. Only 2,000 min/month free (public repo only),
  which is borderline for 9 pipelines × ~5 min render each = ~45 min/day = ~1,350
  min/month. Covered below as the **Alternative Option**.

---

## Recommendation: Oracle Cloud Always Free ARM

Oracle's Always Free tier includes an **Ampere A1** instance with:
- Up to **4 OCPUs** and **24 GB RAM** across free instances
- **200 GB** block storage
- Free **forever** (not a 12-month trial)
- Full Ubuntu Linux — install anything, run cron jobs, persist files

This is genuinely the best free cloud compute available as of 2025.

> **Credit card required** to create an account (identity verification only).
> Oracle will not charge you as long as you stay on Always Free resources.

---

## Part 1: Oracle Cloud Setup

### Step 1 — Create an Oracle Cloud account

1. Go to [cloud.oracle.com](https://cloud.oracle.com) → **Start for Free**
2. Fill in name, email, password, home region (pick one close to you — **you cannot
   change this later**)
3. Enter credit card details (for identity verification only)
4. Verify email and complete sign-up
5. Sign in to the Oracle Cloud Console

> Note: Oracle sometimes throttles ARM instance creation for new accounts.
> If you can't create an ARM instance immediately, wait 24–48 hours and try again.

---

### Step 2 — Create the VM instance

1. In the Oracle Console sidebar: **Compute → Instances → Create Instance**
2. **Name**: `shorts-pipeline` (or anything)
3. **Image**: Click **Edit** → Choose **Ubuntu 22.04** (Canonical)
4. **Shape**: Click **Change Shape**
   - Select **Ampere** (ARM-based)
   - Choose **VM.Standard.A1.Flex**
   - Set **OCPUs: 2**, **Memory: 12 GB** (generous and still free)
5. **Networking**: Leave default (a new VCN will be created automatically)
6. **SSH Keys**:
   - Select **Generate a key pair for me**
   - **Download the private key** (`ssh-key-XXXX.key`) — save it somewhere safe
7. Click **Create**
8. Wait ~2 minutes for the instance to reach **Running** state
9. Note the **Public IP address** shown on the instance details page

---

### Step 3 — Connect via SSH

On your local machine (Windows, use Git Bash or WSL):

```bash
# Fix key permissions (required)
chmod 400 /path/to/ssh-key-XXXX.key

# Connect
ssh -i /path/to/ssh-key-XXXX.key ubuntu@YOUR_PUBLIC_IP
```

You should see a Ubuntu welcome message. You're in.

---

### Step 4 — Install system dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.12, pip, ffmpeg, git
sudo apt install -y python3.12 python3.12-venv python3-pip ffmpeg git

# Verify
python3.12 --version   # should print 3.12.x
ffmpeg -version        # should print ffmpeg version info
```

---

### Step 5 — Upload your project files

From your **local machine** (new terminal window, not the SSH session):

```bash
# Upload the entire project directory to the server
# Replace YOUR_PUBLIC_IP and key path accordingly
scp -i /path/to/ssh-key-XXXX.key -r \
  "C:/Users/prawn/OneDrive/Documents/djamies1.github.io" \
  ubuntu@YOUR_PUBLIC_IP:~/shorts-pipeline
```

This copies everything including all JSON data files, make_video.py scripts,
daily_run.py, and the `nosleep/` folder with credentials.

> **Important files that MUST be included:**
> - `nosleep/client_secrets.json` — OAuth app credentials
> - `nosleep/token.json` — your current YouTube auth token
> - Any `client_secrets.json` files in other pipeline folders (if they exist)

---

### Step 6 — Install Python packages on the server

Back in your **SSH session**:

```bash
cd ~/shorts-pipeline

# Create a virtual environment
python3.12 -m venv venv
source venv/bin/activate

# Install all required packages
pip install --upgrade pip
pip install \
  moviepy \
  Pillow \
  google-api-python-client \
  google-auth-httplib2 \
  google-auth-oauthlib \
  google-cloud-texttospeech \
  imageio \
  imageio-ffmpeg \
  requests
```

---

### Step 7 — Set up Google Cloud TTS credentials

The pipeline uses `google-cloud-texttospeech`, which requires a service account key.

#### If you already have a service account key (a `.json` file from Google Cloud Console):

```bash
# Upload it to the server from your local machine
scp -i /path/to/ssh-key-XXXX.key \
  "C:/path/to/your-gcp-service-account.json" \
  ubuntu@YOUR_PUBLIC_IP:~/shorts-pipeline/gcp-credentials.json

# On the server, add this to your shell environment permanently
echo 'export GOOGLE_APPLICATION_CREDENTIALS="$HOME/shorts-pipeline/gcp-credentials.json"' \
  >> ~/.bashrc
source ~/.bashrc
```

#### If you don't have a service account key yet:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select your project → **IAM & Admin → Service Accounts**
3. Click your service account (or create one) → **Keys → Add Key → JSON**
4. Download the `.json` file and upload it as above

---

### Step 8 — Test the YouTube auth token

The `nosleep/token.json` file contains your OAuth refresh token. It auto-renews
as long as it's used at least once every 6 months.

Test that it works:

```bash
cd ~/shorts-pipeline
source venv/bin/activate

# Run a dry-run to check everything loads without uploading
python daily_run.py --dry-run
```

If it prints pipeline names without crashing on auth errors, you're good.

If you see an auth error, you need to regenerate the token:
- **On your local machine**, run any pipeline's `daily_upload.py` once normally
  (it will open a browser for OAuth)
- Then re-upload the updated `nosleep/token.json` to the server with `scp`

---

### Step 9 — Set up the cron job

```bash
# Open the crontab editor
crontab -e
# (Choose nano if prompted)
```

Add this line at the bottom:

```cron
0 8 * * * cd /home/ubuntu/shorts-pipeline && /home/ubuntu/shorts-pipeline/venv/bin/python daily_run.py --limit 1 >> /home/ubuntu/shorts-pipeline/cron.log 2>&1
```

**What this does:**
- Runs at **8:00 AM UTC** every day (`0 8 * * *`)
- Activates the venv Python directly (no need to `source` in cron)
- Passes `--limit 1` so each pipeline uploads 1 video
- Appends all output to `cron.log` for debugging

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X` in nano).

**To verify the cron is registered:**
```bash
crontab -l
```

---

### Step 10 — Test a manual run

Before relying on cron, do a full manual test:

```bash
cd ~/shorts-pipeline
source venv/bin/activate
python daily_run.py --limit 1
```

Watch for errors. The first run will take longer as fonts/assets are loaded.
Check YouTube Studio to confirm videos were uploaded.

---

### Step 11 — Monitor the logs

```bash
# Watch live output
tail -f ~/shorts-pipeline/cron.log

# Check last 50 lines
tail -50 ~/shorts-pipeline/cron.log

# Check for errors
grep -i "error\|failed\|traceback" ~/shorts-pipeline/cron.log
```

---

### Step 12 — Keep token.json fresh (6-month maintenance)

The YouTube OAuth refresh token expires if unused for **6 months**. Since the pipeline
runs daily, this won't happen. But if you ever pause the pipeline:

1. SSH into the server
2. Run `python daily_run.py --dry-run` to force a token refresh
3. Or: regenerate locally and `scp` the new `token.json` up

---

## Part 2: Content runway top-ups

When your content runway drops below 30 days (check `uploaded.json` counts),
run the generator scripts locally and then sync the updated JSON files to the server:

```bash
# On your local machine — after running _gen_*.py or _topup_*.py scripts
scp -i /path/to/ssh-key-XXXX.key \
  "C:/Users/prawn/OneDrive/Documents/djamies1.github.io/mathchallenge/problems.json" \
  "C:/Users/prawn/OneDrive/Documents/djamies1.github.io/wouldyourather/questions.json" \
  "C:/Users/prawn/OneDrive/Documents/djamies1.github.io/trickquestions/questions.json" \
  "C:/Users/prawn/OneDrive/Documents/djamies1.github.io/mandelaeffect/questions.json" \
  "C:/Users/prawn/OneDrive/Documents/djamies1.github.io/emojiquiz/questions.json" \
  "C:/Users/prawn/OneDrive/Documents/djamies1.github.io/funfacts/facts.json" \
  "C:/Users/prawn/OneDrive/Documents/djamies1.github.io/trueorfalse/statements.json" \
  ubuntu@YOUR_PUBLIC_IP:~/shorts-pipeline/<pipeline>/
```

Or sync the whole project at once:

```bash
# rsync (faster than scp for large folders — skips unchanged files)
rsync -avz --exclude='venv/' --exclude='*/video_output/' \
  -e "ssh -i /path/to/ssh-key-XXXX.key" \
  "C:/Users/prawn/OneDrive/Documents/djamies1.github.io/" \
  ubuntu@YOUR_PUBLIC_IP:~/shorts-pipeline/
```

---

## Alternative Option: GitHub Actions

**Best if:** you want zero server management and your daily run completes in under
~45 minutes (likely fine with `--limit 1`).

### Setup

1. Create a **private** GitHub repo (token.json must not be public)
   ```bash
   git init
   git remote add origin git@github.com:youruser/shorts-pipeline.git
   ```

2. Add secrets to the repo (**Settings → Secrets → Actions**):
   - `YOUTUBE_TOKEN_JSON` — contents of `nosleep/token.json` (base64 encoded)
   - `GCP_CREDENTIALS_JSON` — contents of your GCP service account key (base64 encoded)

   To encode locally:
   ```bash
   base64 -w 0 nosleep/token.json
   base64 -w 0 your-gcp-key.json
   ```

3. Create `.github/workflows/daily.yml`:

```yaml
name: Daily Shorts Upload

on:
  schedule:
    - cron: '0 8 * * *'   # 8:00 AM UTC daily
  workflow_dispatch:        # Allow manual trigger from GitHub UI

jobs:
  upload:
    runs-on: ubuntu-latest
    timeout-minutes: 90

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install system deps
        run: sudo apt-get install -y ffmpeg

      - name: Install Python deps
        run: |
          pip install moviepy Pillow google-api-python-client \
            google-auth-httplib2 google-auth-oauthlib \
            google-cloud-texttospeech imageio imageio-ffmpeg requests

      - name: Restore YouTube token
        run: |
          echo "${{ secrets.YOUTUBE_TOKEN_JSON }}" | base64 -d > nosleep/token.json

      - name: Restore GCP credentials
        run: |
          echo "${{ secrets.GCP_CREDENTIALS_JSON }}" | base64 -d > gcp-credentials.json
          echo "GOOGLE_APPLICATION_CREDENTIALS=$PWD/gcp-credentials.json" >> $GITHUB_ENV

      - name: Run pipeline
        run: python daily_run.py --limit 1

      - name: Commit updated tracking files
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add */uploaded.json nosleep/token.json
          git diff --staged --quiet || git commit -m "chore: daily upload tracking update"
          git push
```

### GitHub Actions trade-offs

| Pro | Con |
|---|---|
| No server to manage | Private repo = only 500 min/month free |
| Manual trigger button in GitHub UI | Token.json committed to repo (acceptable for private) |
| Logs stored in GitHub UI | pip install runs every day (~3-4 min overhead) |
| Auto-scales | If run exceeds 90 min, job is cancelled |

---

## Quick Reference

### Oracle Cloud SSH
```bash
ssh -i ~/ssh-key-XXXX.key ubuntu@YOUR_PUBLIC_IP
```

### Check today's log
```bash
tail -100 ~/shorts-pipeline/cron.log
```

### Manual run
```bash
cd ~/shorts-pipeline && source venv/bin/activate && python daily_run.py --limit 1
```

### Check content runway
```bash
cd ~/shorts-pipeline && source venv/bin/activate && python -c "
import json
from pathlib import Path
pipes = [
  ('mathchallenge', 'mathchallenge/problems.json'),
  ('wouldyourather', 'wouldyourather/questions.json'),
  ('trickquestions', 'trickquestions/questions.json'),
  ('mandelaeffect',  'mandelaeffect/questions.json'),
  ('emojiquiz',      'emojiquiz/questions.json'),
  ('funfacts',       'funfacts/facts.json'),
  ('trueorfalse',    'trueorfalse/statements.json'),
  ('riddles',        'riddles/riddles.json'),
  ('frogfacts',      'frogfacts/facts.json'),
]
for name, path in pipes:
  try:
    up = json.load(open(path.replace('questions.json','..').replace('problems.json','..').replace('/..','').replace('facts.json','..').replace('statements.json','..').replace('riddles.json','..') + '/uploaded.json'))
    total = len(json.load(open(path)))
    remaining = total - len(up)
    print(f'{name:<20} {remaining:>4} items  ({remaining//3:>3}d)')
  except: print(f'{name:<20} error')
"
```

### Sync content files from local to server
```bash
rsync -avz --exclude='venv/' --exclude='*/video_output/' \
  -e "ssh -i ~/ssh-key-XXXX.key" \
  "C:/Users/prawn/OneDrive/Documents/djamies1.github.io/" \
  ubuntu@YOUR_PUBLIC_IP:~/shorts-pipeline/
```

---

## Decision Summary

| If you want... | Use |
|---|---|
| Best free option, most reliable, no limits | **Oracle Cloud ARM** |
| Zero server management, simpler setup | **GitHub Actions** (private repo, 500 min/mo) |
| Google ecosystem, already using GCP | **Google Cloud e2-micro** (1 GB RAM, may be tight) |

**Recommended: Oracle Cloud ARM.** Set it up once, forget about it.
The ARM instance is powerful enough to render videos quickly and has enough storage
to buffer weeks of output without cleanup.
