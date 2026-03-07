# Social Media Upload Setup Guide

This guide covers the one-time setup required before running `upload_tiktok.py`
and `upload_instagram.py`.

---

## TikTok Setup

### Step 1 — Create a TikTok Developer Account
1. Go to https://developers.tiktok.com and sign in with your TikTok account
2. Click **Manage apps** → **Connect an app**
3. Fill in the app name (e.g. `Nosleep Uploader`) and description
4. Submit for review — select **Content Posting API** as the product you need

> **Note:** TikTok's Content Posting API requires an approval process. This can
> take a few days. You can still configure everything in the meantime.

### Step 2 — Configure the App
1. In your app settings, find **Login & Permissions**
2. Add the following scopes:
   - `video.publish`
   - `video.upload`
3. Under **Redirect URIs**, add: `http://localhost:8080/callback`
4. Save your changes

### Step 3 — Get Your Credentials
1. Go to your app's **Details** page
2. Copy the **Client Key** and **Client Secret**

### Step 4 — Create `tiktok_creds.json`
Create this file in the same folder as `upload_tiktok.py`:
```json
{
  "client_key": "YOUR_CLIENT_KEY",
  "client_secret": "YOUR_CLIENT_SECRET"
}
```

### Step 5 — First Run
```bash
python upload_tiktok.py --dry-run
```
A browser window will open asking you to log in to TikTok and grant permissions.
After authorising, `tiktok_token.json` is saved and all future runs are silent.

### Privacy Levels
| Flag value | Who can see it |
|---|---|
| `SELF_ONLY` | Only you (default — review before publishing) |
| `FOLLOWER_OF_CREATOR` | Your followers |
| `PUBLIC_TO_EVERYONE` | Everyone on TikTok |

```bash
python upload_tiktok.py --privacy PUBLIC_TO_EVERYONE
```

---

## Instagram Setup

Instagram uses the **Meta Graph API**, which requires a Facebook Developer app
and an Instagram account set to **Business** or **Creator** mode.

### Step 1 — Switch Your Instagram Account to Business or Creator
1. Open Instagram → Profile → **Settings → Account type and tools**
2. Tap **Switch to Professional account** → choose Business or Creator
3. Link it to a **Facebook Page** (create one if you don't have one — it can be
   a simple placeholder page, it doesn't need to be active)

### Step 2 — Create a Meta Developer App
1. Go to https://developers.facebook.com and log in with your Facebook account
2. Click **My Apps** → **Create App**
3. Select **Other** as the use case → **Next**
4. Select **Business** as the app type → **Next**
5. Give it a name (e.g. `Nosleep Uploader`) → **Create App**

### Step 3 — Add Instagram to Your App
1. In your app dashboard, click **Add Product**
2. Find **Instagram** and click **Set up**
3. Under **API setup with Instagram Business Login**, click **Create new**
   or use the existing setup path

### Step 4 — Add Permissions
1. Go to **App Review → Permissions and Features**
2. Request the following permissions:
   - `instagram_content_publish`
   - `instagram_basic`
   - `pages_show_list`
   - `pages_read_engagement`
3. While in **Development mode** these work for your own account without
   needing full App Review approval

### Step 5 — Add a Redirect URI
1. Go to **Instagram → Basic Display** (or **Facebook Login → Settings**)
2. Under **Valid OAuth Redirect URIs**, add: `http://localhost:8080/callback`
3. Save changes

### Step 6 — Get Your Credentials
1. Go to **Settings → Basic** in your app dashboard
2. Copy the **App ID** and **App Secret** (click Show to reveal it)

### Step 7 — Create `instagram_creds.json`
Create this file in the same folder as `upload_instagram.py`:
```json
{
  "app_id": "YOUR_APP_ID",
  "app_secret": "YOUR_APP_SECRET"
}
```

### Step 8 — First Run
```bash
python upload_instagram.py --dry-run
```
A browser window will open for Facebook Login. After authorising:
- A long-lived access token is saved to `instagram_token.json` (valid ~60 days)
- Your Instagram User ID is auto-detected and stored
- All future runs are silent until the token needs refreshing (handled automatically)

---

## Files Created (all gitignored)

| File | Purpose |
|---|---|
| `tiktok_creds.json` | Your TikTok Client Key + Secret |
| `tiktok_token.json` | Saved TikTok access/refresh tokens |
| `uploaded_tiktok.json` | Tracks which videos have been posted to TikTok |
| `instagram_creds.json` | Your Meta App ID + Secret |
| `instagram_token.json` | Saved Instagram long-lived access token |
| `uploaded_instagram.json` | Tracks which videos have been posted to Instagram |

---

## Running the Full Pipeline

Once everything is set up, the full pipeline is:

```bash
# 1. Scrape new stories
python scrape_nosleep.py

# 2. Render videos
python make_video.py --all

# 3. Upload to all platforms
python upload_youtube.py
python upload_tiktok.py
python upload_instagram.py
```

Each platform tracks uploads independently, so you can run them in any order
and re-run safely without duplicating posts.
