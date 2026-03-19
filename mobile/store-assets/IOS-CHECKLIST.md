# Plant Zone Finder — App Store (iOS) Submission Checklist

> **Requires:** Mac with Xcode 15+, Apple Developer Program ($99/yr), iOS device or simulator for testing.

---

## Step 1 — Prerequisites

- [ ] Enrolled in [Apple Developer Program](https://developer.apple.com/programs/)
- [ ] Xcode 15+ installed from Mac App Store
- [ ] CocoaPods installed: `sudo gem install cocoapods`
- [ ] Capacitor project already set up (mobile/ directory exists)

---

## Step 2 — Add iOS platform

```bash
cd mobile
npm install
npx cap add ios
npx cap sync
npx cap open ios     # opens Xcode
```

---

## Step 3 — Configure Xcode project

1. Open `mobile/ios/App/App.xcworkspace` in Xcode
2. Select the **App** target → **General** tab:
   - Display Name: `Plant Zone Finder`
   - Bundle Identifier: `io.github.djamies1.plantzonefinder`
   - Version: `1.0`
   - Build: `1`
   - Deployment Target: iOS 14.0+
3. Under **Signing & Capabilities**:
   - Team: select your Apple Developer account
   - Bundle ID must match exactly: `io.github.djamies1.plantzonefinder`

---

## Step 4 — Set permission strings (required by App Store)

Edit `mobile/ios/App/App/Info.plist` and add:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Plant Zone Finder uses your location to identify your growing zone and display local weather forecasts.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Plant Zone Finder can save garden photos to your photo library.</string>

<key>NSCameraUsageDescription</key>
<string>Plant Zone Finder uses the camera to add photos to your garden diary.</string>

<key>NSUserNotificationsUsageDescription</key>
<string>Plant Zone Finder sends reminders when crops are ready to harvest and frost warnings for tender plants.</string>
```

---

## Step 5 — Add app icons

Copy from `mobile/assets/` to Xcode:

1. In Xcode, open `Assets.xcassets` → `AppIcon`
2. Drag icons from `mobile/assets/` into the slots:
   - Or use `@capacitor/assets` to auto-populate: `npx @capacitor/assets generate --ios`
3. Required sizes: 20pt, 29pt, 40pt, 60pt, 76pt, 83.5pt, 1024pt (App Store)

---

## Step 6 — Configure splash screen

Capacitor SplashScreen plugin uses a `LaunchScreen.storyboard`. The default Capacitor one works fine. To customise background colour:

1. Open `mobile/ios/App/App/Base.lproj/LaunchScreen.storyboard`
2. Set background view colour to `#0A0F1A` (matching `capacitor.config.json`)

---

## Step 7 — Build and test

```bash
# Run on simulator
npx cap run ios --target "iPhone 15 Pro"

# Or from Xcode: Product → Run
```

**Test checklist (on device):**
- [ ] Zone detection (GPS prompt appears)
- [ ] Planting calendar renders correctly
- [ ] My Garden — add/remove/planted date
- [ ] Crop photo log — camera permission prompt
- [ ] Notifications — permission prompt, frost/harvest alerts
- [ ] Back swipe gesture (iOS swipe from left edge)
- [ ] Safe area insets (no content hidden behind notch)
- [ ] Dark/light theme
- [ ] Offline mode (airplane mode after first load)
- [ ] Export backup → Files app / share sheet

---

## Step 8 — Archive for App Store

1. In Xcode: **Product → Archive**
2. Wait for build to complete
3. In Organizer: **Distribute App → App Store Connect → Upload**

---

## Step 9 — App Store Connect setup

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **My Apps → New App:**
   - Platform: iOS
   - Name: `Plant Zone Finder`
   - Bundle ID: `io.github.djamies1.plantzonefinder`
   - SKU: `plantzonefinder-ios-001`
3. Fill in listing from `mobile/store-assets/listing.md`
4. Upload screenshots (required sizes):

| Device | Size |
|---|---|
| iPhone 6.9" (required) | 1320×2868 or 1290×2796 |
| iPhone 6.7" (required) | 1242×2688 or 1284×2778 |
| iPad 13" (optional) | 2064×2752 |

5. Upload **App Preview** video (optional but highly recommended, 15-30s)
6. Privacy Policy URL: `https://djamies1.github.io/garden-zones/privacy.html`
7. Category: **Lifestyle** (Primary), **Reference** (Secondary)
8. Age Rating: **4+**
9. Pricing: **Free**

---

## Step 10 — Submit for review

1. Select build from App Store Connect → Add for Review
2. Answer export compliance questions (No encryption beyond HTTPS)
3. Submit → typical review 24-48h for new apps

---

## Updating the app

```bash
# Increment CFBundleVersion + CFBundleShortVersionString in Info.plist
# or in Xcode General tab, then:
npx cap sync
# Archive again in Xcode, upload new build
```

---

## Useful Xcode commands

```bash
# List available simulators
xcrun simctl list devices

# Open specific simulator
open -a Simulator

# Build from CLI
xcodebuild -workspace mobile/ios/App/App.xcworkspace \
  -scheme App \
  -sdk iphoneos \
  -configuration Release \
  archive -archivePath build/App.xcarchive
```

---

## Troubleshooting

**"No provisioning profile" error:**
→ Signing & Capabilities → enable Automatic Signing → select your team

**App crashes on launch:**
→ Check Xcode console for "Unrecognised selector" or bridge errors; run `npx cap sync`

**Icons showing as white:**
→ Ensure icons are opaque PNGs (no transparency) for App Store icon slot

**Safe area issues on iPhone with notch:**
→ `capacitor.config.json` has `contentInset: "automatic"` which handles this

**Location permission denied in simulator:**
→ Simulator → Features → Location → Custom Location (set lat/lng manually)

---

*Generated for Plant Zone Finder v1.0 — March 2026*
