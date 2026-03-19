/**
 * Plant Zone Finder — Android / iOS Asset Generator
 * Uses resvg-js (already installed at C:/Users/prawn/icon-gen/node_modules)
 * Run: node gen-assets.js
 * Outputs: mobile/assets/*.png  (committed to git)
 *          mobile/assets/mipmap-[density]/  (Android launcher icons — also committed)
 */

const { Resvg } = require('C:/Users/prawn/icon-gen/node_modules/@resvg/resvg-js');
const fs   = require('fs');
const path = require('path');

const OUT = __dirname;

// ── SVG helpers ─────────────────────────────────────

function plantSVG(size, { maskable = false, transparent = false } = {}) {
  const pad   = maskable ? size * 0.18 : size * 0.10;
  const inner = size - pad * 2;
  const s     = inner / 512;
  const rx    = maskable || transparent ? 0 : Math.round(size * 0.19);
  const bg    = transparent ? 'none' : '#111827';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="${bg}"/>
  <g transform="translate(${pad},${pad}) scale(${s})">
    <line x1="256" y1="430" x2="256" y2="210" stroke="#16a34a" stroke-width="22" stroke-linecap="round"/>
    <ellipse cx="256" cy="430" rx="90" ry="22" fill="#15803d" opacity="0.6"/>
    <path d="M258 210 C265 190 300 150 360 110 C360 110 330 180 280 220 Z" fill="#4ade80"/>
    <path d="M254 270 C247 250 210 210 150 175 C150 175 185 240 240 275 Z" fill="#22c55e"/>
    <path d="M256 175 C256 175 256 130 256 100 C280 115 310 145 295 185 Z" fill="#86efac"/>
  </g>
</svg>`;
}

function featureGraphicSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0f1a"/>
      <stop offset="100%" stop-color="#0d1a0f"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4ade80"/>
      <stop offset="100%" stop-color="#22c55e"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>

  <!-- Decorative circles (right) -->
  <circle cx="760" cy="250" r="220" fill="none" stroke="#4ade80" stroke-width="1" opacity="0.08"/>
  <circle cx="760" cy="250" r="170" fill="none" stroke="#4ade80" stroke-width="1" opacity="0.06"/>
  <circle cx="760" cy="250" r="270" fill="none" stroke="#4ade80" stroke-width="1" opacity="0.04"/>

  <!-- App icon (right side) -->
  <g transform="translate(620,90)">
    <rect width="280" height="280" rx="54" fill="#111827"/>
    <g transform="translate(28,28) scale(0.437)">
      <line x1="256" y1="430" x2="256" y2="210" stroke="#16a34a" stroke-width="22" stroke-linecap="round"/>
      <ellipse cx="256" cy="430" rx="90" ry="22" fill="#15803d" opacity="0.6"/>
      <path d="M258 210 C265 190 300 150 360 110 C360 110 330 180 280 220 Z" fill="#4ade80"/>
      <path d="M254 270 C247 250 210 210 150 175 C150 175 185 240 240 275 Z" fill="#22c55e"/>
      <path d="M256 175 C256 175 256 130 256 100 C280 115 310 145 295 185 Z" fill="#86efac"/>
    </g>
  </g>

  <!-- Text (left) -->
  <text x="68" y="160" font-family="system-ui,-apple-system,sans-serif" font-size="58" font-weight="700" fill="#f9fafb">Plant Zone</text>
  <text x="68" y="228" font-family="system-ui,-apple-system,sans-serif" font-size="58" font-weight="700" fill="url(#accent)">Finder</text>
  <text x="68" y="296" font-family="system-ui,-apple-system,sans-serif" font-size="22" fill="#9ca3af">Know your zone. Grow the right crops.</text>
  <text x="68" y="326" font-family="system-ui,-apple-system,sans-serif" font-size="22" fill="#9ca3af">Monthly planting calendar for 69 crops.</text>

  <!-- Feature pills -->
  <rect x="68" y="370" width="106" height="28" rx="14" fill="rgba(74,222,128,0.12)" stroke="rgba(74,222,128,0.3)" stroke-width="1"/>
  <text x="121" y="389" font-family="system-ui,-apple-system,sans-serif" font-size="14" fill="#4ade80" text-anchor="middle">Free</text>

  <rect x="186" y="370" width="122" height="28" rx="14" fill="rgba(74,222,128,0.12)" stroke="rgba(74,222,128,0.3)" stroke-width="1"/>
  <text x="247" y="389" font-family="system-ui,-apple-system,sans-serif" font-size="14" fill="#4ade80" text-anchor="middle">No account</text>

  <rect x="320" y="370" width="136" height="28" rx="14" fill="rgba(74,222,128,0.12)" stroke="rgba(74,222,128,0.3)" stroke-width="1"/>
  <text x="388" y="389" font-family="system-ui,-apple-system,sans-serif" font-size="14" fill="#4ade80" text-anchor="middle">Works offline</text>
</svg>`;
}

function splashSVG(size = 2732) {
  const iconSize = Math.round(size * 0.25);
  const x = (size - iconSize) / 2;
  const y = (size - iconSize) / 2;
  const s = iconSize / 512;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0a0f1a"/>
  <g transform="translate(${x},${y}) scale(${s})">
    <line x1="256" y1="430" x2="256" y2="210" stroke="#16a34a" stroke-width="22" stroke-linecap="round"/>
    <ellipse cx="256" cy="430" rx="90" ry="22" fill="#15803d" opacity="0.6"/>
    <path d="M258 210 C265 190 300 150 360 110 C360 110 330 180 280 220 Z" fill="#4ade80"/>
    <path d="M254 270 C247 250 210 210 150 175 C150 175 185 240 240 275 Z" fill="#22c55e"/>
    <path d="M256 175 C256 175 256 130 256 100 C280 115 310 145 295 185 Z" fill="#86efac"/>
  </g>
</svg>`;
}

// ── Render helpers ───────────────────────────────────

function render(svgStr, width, height) {
  const r = new Resvg(svgStr, { fitTo: { mode: 'width', value: width } });
  return r.render().asPng();
}

function write(filepath, buf) {
  const dir = path.dirname(filepath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filepath, buf);
  const kb = Math.round(buf.length / 1024);
  console.log(`  ✓ ${path.relative(OUT, filepath)}  (${kb} KB)`);
}

// ── Generate assets ──────────────────────────────────

console.log('\n🌱 Plant Zone Finder — generating mobile assets\n');

// Play Store icon (512×512)
write(path.join(OUT, 'icon-512.png'),
  render(plantSVG(512), 512, 512));

// Play Store feature graphic (1024×500)
write(path.join(OUT, 'feature-graphic.png'),
  render(featureGraphicSVG(), 1024, 500));

// Splash screen / SplashScreen plugin (2732×2732, safe for all densities)
write(path.join(OUT, 'splash.png'),
  render(splashSVG(2732), 2732, 2732));

// Adaptive icon foreground (transparent bg, 1024×1024)
write(path.join(OUT, 'icon-foreground.png'),
  render(plantSVG(1024, { maskable: true, transparent: true }), 1024, 1024));

// Adaptive icon background (solid colour only)
write(path.join(OUT, 'icon-background.png'),
  render(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#111827"/></svg>`, 1024, 1024));

// Android mipmap launcher icons (for manual copy after npx cap add android)
const MIPMAP = [
  { dir: 'mipmap-mdpi',    size: 48  },
  { dir: 'mipmap-hdpi',    size: 72  },
  { dir: 'mipmap-xhdpi',   size: 96  },
  { dir: 'mipmap-xxhdpi',  size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

for (const { dir, size } of MIPMAP) {
  const base = path.join(OUT, dir);
  write(path.join(base, 'ic_launcher.png'),
    render(plantSVG(size), size, size));
  write(path.join(base, 'ic_launcher_round.png'),
    render(plantSVG(size, { maskable: true }), size, size));
  write(path.join(base, 'ic_launcher_foreground.png'),
    render(plantSVG(size, { maskable: true, transparent: true }), size, size));
}

console.log('\n✅ Done! Assets written to mobile/assets/');
console.log('\nNext steps:');
console.log('  1. cd mobile && npx cap add android');
console.log('  2. node assets/copy-icons.js   (copies mipmap-* into android/app/src/main/res/)');
console.log('  3. npx cap sync');
console.log('  4. npx cap open android\n');
