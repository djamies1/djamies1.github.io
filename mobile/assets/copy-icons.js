/**
 * Copy pre-generated mipmap icons into the Android project.
 * Run AFTER: npx cap add android
 * Run FROM:  mobile/ directory  →  node assets/copy-icons.js
 */

const fs   = require('fs');
const path = require('path');

const SRC  = path.join(__dirname);
const DEST = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

if (!fs.existsSync(DEST)) {
  console.error('❌  android/ project not found. Run "npx cap add android" first.');
  process.exit(1);
}

const DIRS = ['mipmap-mdpi','mipmap-hdpi','mipmap-xhdpi','mipmap-xxhdpi','mipmap-xxxhdpi'];
const FILES = ['ic_launcher.png','ic_launcher_round.png','ic_launcher_foreground.png'];

let count = 0;
for (const dir of DIRS) {
  const destDir = path.join(DEST, dir);
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of FILES) {
    const src  = path.join(SRC, dir, file);
    const dest = path.join(destDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  ✓ ${dir}/${file}`);
      count++;
    }
  }
}

// Copy splash (used by Capacitor SplashScreen plugin at mipmap-land/splash.png)
const splashDirs = ['drawable','drawable-land-hdpi','drawable-port-hdpi'];
for (const d of splashDirs) {
  const destDir = path.join(DEST, d);
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(path.join(SRC, 'splash.png'), path.join(destDir, 'splash.png'));
  console.log(`  ✓ ${d}/splash.png`);
}

console.log(`\n✅ Copied ${count} launcher icons + splash screens into android/`);
console.log('   Run "npx cap sync" next, then "npx cap open android".');
