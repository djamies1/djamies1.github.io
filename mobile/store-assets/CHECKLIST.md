# Plant Zone Finder — Play Store Submission Checklist

## Prerequisites

- [ ] Android Studio installed (latest stable)
- [ ] Java 17+ installed (`java -version`)
- [ ] `ANDROID_HOME` environment variable set
- [ ] Google Play Developer account ($25 one-time fee)
- [ ] Signing keystore created (see Step 3 below)

---

## Step 1 — Set up the Capacitor Android project

```bash
cd mobile
npm install
npx cap add android
node assets/copy-icons.js      # copies pre-generated icons into android/
npx cap sync                   # copies web assets into android webview
npx cap open android           # opens Android Studio
```

---

## Step 2 — Configure Android Studio

1. Wait for Gradle sync to finish
2. In `android/app/build.gradle`, confirm:
   ```gradle
   defaultConfig {
       applicationId "io.github.djamies1.plantzonefinder"
       minSdk 26
       targetSdk 34
       versionCode 1
       versionName "1.0"
   }
   ```
3. In `android/variables.gradle`, set your compileSdk (e.g. 34)
4. Run **Build → Make Project** and fix any errors

---

## Step 3 — Create a release keystore (one-time)

```bash
keytool -genkeypair -v \
  -keystore plant-zone-release.jks \
  -alias plant-zone \
  -keyalg RSA -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_STORE_PASS \
  -keypass YOUR_KEY_PASS \
  -dname "CN=Plant Zone Finder, OU=djamies1, O=Plant Zone Finder, L=, S=, C=AU"
```

Store the `.jks` file **outside** the repo (never commit it).

---

## Step 4 — Configure signing in Android Studio

In `android/app/build.gradle`, add inside `android {}`:
```gradle
signingConfigs {
    release {
        storeFile file("../../plant-zone-release.jks")
        storePassword System.getenv("KEYSTORE_PASSWORD") ?: ""
        keyAlias "plant-zone"
        keyPassword System.getenv("KEY_PASSWORD") ?: ""
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
    }
}
```

---

## Step 5 — Build the release AAB

In Android Studio: **Build → Generate Signed Bundle/APK → Android App Bundle → Release**

Or via CLI:
```bash
cd mobile/android
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

---

## Step 6 — Prepare Play Store assets

All files pre-generated in `mobile/assets/`:

| Asset | File | Required size |
|---|---|---|
| App icon | `icon-512.png` | 512×512 PNG |
| Feature graphic | `feature-graphic.png` | 1024×500 PNG |
| Screenshots | _capture from device/emulator_ | min 2, max 8 per type |

**Screenshot sizes needed (Play Store):**
- Phone: min 320px on shortest side, max 3840px longest side
- Tablet 7": optional but recommended
- Capture from: Android Studio emulator → Pixel 7 (1080×2400)

---

## Step 7 — Create the Play Store listing

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create new app → **Free** → **App** → **Android**
3. Fill in details from `mobile/store-assets/listing.md`:
   - App name: **Plant Zone Finder**
   - Short description (80 chars)
   - Full description (4000 chars)
4. Upload: AAB, icon, feature graphic, screenshots
5. Content rating: complete questionnaire → **Everyone**
6. Privacy policy URL: `https://djamies1.github.io/garden-zones/privacy.html`
7. App category: **House & Home > Garden & Outdoors**
8. Free pricing: confirm

---

## Step 8 — Internal testing first

1. Create **Internal Testing** track in Play Console
2. Upload AAB to internal track
3. Add yourself as tester → install from Play Store
4. Test all features:
   - [ ] Zone detection (GPS + map tap)
   - [ ] Planting calendar renders correctly
   - [ ] My Garden — add/remove crop, set planted date
   - [ ] Journal — add note, photo attach
   - [ ] Export backup → share to Files/Drive
   - [ ] Import backup → data restored
   - [ ] Back button: closes dialogs → browse → panel → exits
   - [ ] Weather loads (requires internet first run)
   - [ ] Offline mode (airplane mode after first load)
   - [ ] Dark/light theme toggle
   - [ ] Status bar colour matches theme

---

## Step 9 — Submit for review

1. Promote from Internal Testing → **Production**
2. Submit for review (typically 1-3 days for new apps)
3. Monitor for policy violations or review questions

---

## Updating the app

When making changes:
```bash
# 1. Increment versionCode + versionName in android/app/build.gradle
# 2. Build new AAB
npx cap sync
cd android && ./gradlew bundleRelease
# 3. Upload new AAB to Play Console → Production → New release
```

---

## Useful commands

```bash
# Run on connected Android device (debug)
npx cap run android

# Run on emulator
npx cap run android --target Pixel_7_API_34

# Check what's synced to android/
npx cap sync --deployment

# View Android logs
adb logcat | grep Capacitor
```

---

## Troubleshooting

**Gradle build fails with "SDK not found":**
→ Set `ANDROID_HOME` or add `local.properties` with `sdk.dir=C\:\\Users\\prawn\\AppData\\Local\\Android\\Sdk`

**White screen on launch:**
→ Check `capacitor.config.json` webDir path; run `npx cap sync`

**Icons not updating:**
→ Uninstall from device/emulator, then reinstall

**"App not installed" error:**
→ Version code conflict — increment `versionCode` in build.gradle

---

*Generated for Plant Zone Finder v1.0 — March 2026*
