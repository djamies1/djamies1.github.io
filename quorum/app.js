// ── A. CONFIG ─────────────────────────────────────────────────
const WORLD_W  = 800;
const WORLD_H  = 472;
const CAMP_X   = 400;
const CAMP_Y   = 230;
const CAMP_R   = 90;   // personas orbit radius
const S        = 3;    // pixel scale (each "game pixel" = 3 canvas pixels)

// Mobile camera: 2× zoom centred on campfire
const MOB_ZOOM = 2;
const MOB_VX   = CAMP_X - WORLD_W / (2 * MOB_ZOOM); // 200 — left edge in world units
const MOB_VY   = CAMP_Y - WORLD_H / (2 * MOB_ZOOM); // 112 — top edge in world units

// Set this to your Cloudflare Worker URL after running `wrangler deploy`.
// When set, visitors need no API key — the proxy holds the key server-side.
// Leave empty to require users to enter their own key in Settings.
const PROXY_URL = 'https://quorum-proxy.djamies1.workers.dev';

// ── B. STATE ──────────────────────────────────────────────────
const GEMINI_MODELS = [
  { value: 'gemini-2.0-flash',      label: 'Gemini 2.0 Flash (free, recommended)' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (free, faster)' },
  { value: 'gemini-1.5-flash',      label: 'Gemini 1.5 Flash (free)' },
  { value: 'gemini-1.5-pro',        label: 'Gemini 1.5 Pro (paid)' },
];
const GROQ_MODELS = [
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (free, best quality)' },
  { value: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B (free, fastest)' },
  { value: 'gemma2-9b-it',            label: 'Gemma 2 9B (free)' },
];

const state = {
  provider:  localStorage.getItem('quorum_provider')  || 'gemini',
  apiKey:    localStorage.getItem('quorum_api_key')   || '',
  groqKey:   localStorage.getItem('quorum_groq_key')  || '',
  model:     localStorage.getItem('quorum_model')     || 'gemini-2.0-flash',
  topic:     '',
  selectedIds: [],
  history:   [],     // { id, name, text, isUser }
  debating:  false
};

// ── C. WORLD DATA ─────────────────────────────────────────────

const TREES = [
  // Edges – left column
  [55, 65], [45, 155], [60, 265], [50, 370], [65, 445],
  // Edges – right column
  [740, 55], [755, 160], [748, 275], [742, 380], [730, 448],
  // Edges – top row
  [130, 35], [220, 28], [330, 32], [480, 30], [590, 40], [680, 52],
  // Edges – bottom row
  [100, 462], [230, 458], [370, 465], [520, 460], [670, 455],
  // Scattered mid-field
  [150, 200], [175, 355], [625, 190], [648, 380]
];

const MUSHROOMS = [
  [190, 280], [240, 170], [560, 320], [610, 270], [330, 390], [470, 160]
];

const STONES = [
  [-18, -8], [-12, -16], [0, -20], [12, -16], [18, -8],
  [14, 6],  [6, 14],   [-6, 14], [-14, 6]
];

// ── D. CHARACTERS ─────────────────────────────────────────────

let chars  = [];   // persona chars + player char
let player = null; // reference to the player entry in chars[]

function initChars(selectedPersonas) {
  chars = [];
  selectedPersonas.forEach((p, i) => {
    const angle = (i / selectedPersonas.length) * Math.PI * 2 - Math.PI / 2;
    const hx = CAMP_X + Math.cos(angle) * CAMP_R;
    const hy = CAMP_Y + Math.sin(angle) * CAMP_R;
    chars.push({
      id: p.id, name: p.name, emoji: p.emoji,
      color: p.color, colorDim: p.colorDim,
      x: hx, y: hy, homeX: hx, homeY: hy,
      phase: i * 1.3,       // wander phase offset
      walkFrame: 0,
      isSpeaking: false, isThinking: false,
      isPlayer: false
    });
  });

  player = {
    id: 'player', name: 'You', emoji: '👤',
    color: '#b8d4f0', colorDim: 'rgba(184,212,240,0.15)',
    x: CAMP_X, y: CAMP_Y + 170,
    homeX: CAMP_X, homeY: CAMP_Y + 170,
    phase: 0, walkFrame: 0,
    isSpeaking: false, isThinking: false,
    isPlayer: true,
    vx: 0, vy: 0
  };
  chars.push(player);
}

// ── E0. PERSONA VOICES (Web Audio gibberish) ──────────────────

// Layered voice specs — each entry is an array of oscillator layers.
// interval: how many chars between blips (1=rapid, 2=default, 3=slow)
// freqEnd: if set, pitch ramps from freq→freqEnd over the note's duration
const PERSONA_VOICE_SPECS = {
  // Two detuned sawtooths (88 + 93 Hz) create a rumbling beat/growl
  'devil': { interval: 2, layers: [
    { freq: 88,  type: 'sawtooth', dur: 0.095, gain: 0.11, jitter: 0.005 },
    { freq: 93,  type: 'sawtooth', dur: 0.095, gain: 0.07, jitter: 0.005 },
  ]},
  // Very short square click — rapid machine-gun mechanical tapping
  'pragmatist': { interval: 1, layers: [
    { freq: 220, type: 'square',   dur: 0.022, gain: 0.18, jitter: 0.01 },
  ]},
  // Two sines a perfect 5th apart — bright, singing, harmonic
  'idealist': { interval: 2, layers: [
    { freq: 523, type: 'sine',     dur: 0.095, gain: 0.07, jitter: 0.05 },
    { freq: 784, type: 'sine',     dur: 0.075, gain: 0.04, jitter: 0.05 },
  ]},
  // Square with huge jitter — dry, sceptical, randomly-pitched beeps
  'skeptic': { interval: 2, layers: [
    { freq: 195, type: 'square',   dur: 0.032, gain: 0.14, jitter: 0.22 },
  ]},
  // Descending frequency sweep (660→440) — electronic "bwip"
  'first-principles': { interval: 2, layers: [
    { freq: 660, type: 'square',   dur: 0.050, gain: 0.09, jitter: 0.01, freqEnd: 440 },
  ]},
  // Two gentle sines a major third apart — warm, harmonic, deliberate
  'ethicist': { interval: 3, layers: [
    { freq: 330, type: 'sine',     dur: 0.120, gain: 0.07, jitter: 0.01 },
    { freq: 415, type: 'sine',     dur: 0.100, gain: 0.04, jitter: 0.01 },
  ]},
  // Sawtooth with wild jitter — chaotic, disagreeable squawking
  'contrarian': { interval: 1, layers: [
    { freq: 400, type: 'sawtooth', dur: 0.036, gain: 0.14, jitter: 0.30 },
  ]},
  // Low stable triangle — flat dry bass thud, barely any variation
  'realist': { interval: 2, layers: [
    { freq: 130, type: 'triangle', dur: 0.062, gain: 0.10, jitter: 0.004 },
  ]},
  // Player: neutral sine
  'player': { interval: 2, layers: [
    { freq: 262, type: 'sine',     dur: 0.050, gain: 0.07, jitter: 0.04 },
  ]},
};

let audioCtx = null;

function playVoiceBlip(charId) {
  const spec = PERSONA_VOICE_SPECS[charId];
  if (!spec) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    for (const L of spec.layers) {
      const osc = audioCtx.createOscillator();
      const gn  = audioCtx.createGain();
      osc.type = L.type;
      const f = L.freq * (1 + (Math.random() - 0.5) * L.jitter * 2);
      osc.frequency.setValueAtTime(f, now);
      if (L.freqEnd !== undefined) {
        osc.frequency.linearRampToValueAtTime(L.freqEnd, now + L.dur);
      }
      gn.gain.setValueAtTime(L.gain, now);
      gn.gain.exponentialRampToValueAtTime(0.0001, now + L.dur);
      osc.connect(gn);
      gn.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + L.dur);
    }
  } catch (_) {}
}

// ── E. BUBBLES ────────────────────────────────────────────────

let activeBubble = null;
// { charId, displayText, fullText, typing, typeIdx, holdFrames, color, resolve }

function showBubble(charId, fullText, color) {
  return new Promise(resolve => {
    const char = chars.find(c => c.id === charId);
    if (char) { char.isSpeaking = true; char.isThinking = false; }

    activeBubble = {
      charId, fullText, displayText: '', color,
      typing: true, typeIdx: 0,
      holdFrames: 0,
      resolve
    };
  });
}

function clearBubble() {
  if (!activeBubble) return;
  const char = chars.find(c => c.id === activeBubble.charId);
  if (char) char.isSpeaking = false;
  const res = activeBubble.resolve;
  activeBubble = null;
  if (res) res();
}

// Player's own interject bubble (separate, shorter-lived)
let playerBubble = null;
// { displayText, alpha, holdFrames }

// ── F. INPUT ──────────────────────────────────────────────────

const keys = {};
// Store timestamp of last keydown instead of boolean so keys auto-expire if
// keyup is missed (focus lost to a dialog, system UI, button click, etc.)
const KEY_EXPIRY_MS = 600; // covers the typical OS key-repeat initial delay (~500ms)
window.addEventListener('keydown', e => { keys[e.key] = performance.now(); });
window.addEventListener('keyup',   e => { delete keys[e.key]; });
window.addEventListener('blur',    () => { for (const k in keys) delete keys[k]; });
document.addEventListener('visibilitychange', () => { if (document.hidden) for (const k in keys) delete keys[k]; });

function isKey(k) {
  const t = keys[k];
  if (t === undefined) return false;
  if (performance.now() - t > KEY_EXPIRY_MS) { delete keys[k]; return false; }
  return true;
}

// ── G. CANVAS & CONTEXT ───────────────────────────────────────

let canvas, ctx, scale = 1;

function initCanvas() {
  canvas = document.getElementById('game-canvas');
  ctx    = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  const wrap   = document.getElementById('canvas-wrap');
  const availW = wrap.clientWidth;
  const availH = wrap.clientHeight;
  scale = Math.min(availW / WORLD_W, availH / WORLD_H);
  canvas.style.width  = `${Math.floor(WORLD_W * scale)}px`;
  canvas.style.height = `${Math.floor(WORLD_H * scale)}px`;
}

// ── H. DRAW HELPERS ───────────────────────────────────────────

function adjustColor(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (n >> 16)         + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff)        + amt));
  return `rgb(${r},${g},${b})`;
}

// ── H1. BACKGROUND ────────────────────────────────────────────

function drawBackground() {
  // Night sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, WORLD_H);
  sky.addColorStop(0,   '#0a0e1a');
  sky.addColorStop(0.5, '#0d1520');
  sky.addColorStop(1,   '#111f0d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  const starData = [
    [60,25],[180,15],[290,22],[410,10],[530,18],[650,24],[720,14],
    [80,50],[200,42],[350,55],[500,45],[680,50],[770,35],
    [30,80],[150,75],[440,68],[590,72],[760,80]
  ];
  starData.forEach(([sx, sy]) => {
    const twinkle = 0.5 + 0.5 * Math.sin(tick * 0.03 + sx * 0.1);
    ctx.globalAlpha = 0.4 + twinkle * 0.5;
    ctx.fillRect(sx, sy, 1, 1);
  });
  ctx.globalAlpha = 1;

  // Grass ground
  ctx.fillStyle = '#162413';
  ctx.fillRect(0, 90, WORLD_W, WORLD_H - 90);

  // Grass texture patches
  ctx.fillStyle = '#1c2e18';
  for (let gx = 0; gx < WORLD_W; gx += 24) {
    for (let gy = 110; gy < WORLD_H; gy += 20) {
      if ((gx + gy) % 48 === 0) ctx.fillRect(gx, gy, 14, 10);
    }
  }

  // Dirt circle around campfire
  const dirtR = 130;
  const dirtGrd = ctx.createRadialGradient(CAMP_X, CAMP_Y, 40, CAMP_X, CAMP_Y, dirtR);
  dirtGrd.addColorStop(0,   '#2e1a08');
  dirtGrd.addColorStop(0.6, '#1f1408');
  dirtGrd.addColorStop(1,   'rgba(15,10,3,0)');
  ctx.fillStyle = dirtGrd;
  ctx.beginPath();
  ctx.ellipse(CAMP_X, CAMP_Y + 10, dirtR, dirtR * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ── H2. TREE ──────────────────────────────────────────────────

function drawTree(tx, ty) {
  // Trunk
  ctx.fillStyle = '#3a2008';
  ctx.fillRect(tx - 5, ty - 14, 10, 18);

  // Three foliage tiers (bottom to top)
  const tiers = [
    { y: ty - 14, w: 34, h: 16, c: '#0f2910' },
    { y: ty - 28, w: 26, h: 16, c: '#163d14' },
    { y: ty - 42, w: 18, h: 16, c: '#1d5218' }
  ];
  tiers.forEach(t => {
    ctx.fillStyle = t.c;
    ctx.fillRect(tx - t.w / 2, t.y, t.w, t.h);
    // Highlight strip top-left
    ctx.fillStyle = adjustColor(t.c, 15);
    ctx.fillRect(tx - t.w / 2 + 2, t.y + 2, 6, 3);
  });
}

// ── H3. MUSHROOM ──────────────────────────────────────────────

function drawMushroom(mx, my) {
  ctx.fillStyle = '#5c1a1a'; // stem
  ctx.fillRect(mx - 2, my - 6, 4, 8);
  ctx.fillStyle = '#c0392b'; // cap
  ctx.fillRect(mx - 6, my - 10, 12, 6);
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(mx - 4, my - 11, 8, 3);
  ctx.fillStyle = '#fff'; // spots
  ctx.fillRect(mx - 3, my - 9, 2, 2);
  ctx.fillRect(mx + 1, my - 8, 2, 2);
}

// ── H4. CAMPFIRE ──────────────────────────────────────────────

function drawCampfire() {
  const cx = CAMP_X, cy = CAMP_Y;

  // Stone ring
  ctx.fillStyle = '#555';
  STONES.forEach(([dx, dy]) => ctx.fillRect(cx + dx - 4, cy + dy - 4, 8, 7));
  ctx.fillStyle = '#888';
  STONES.forEach(([dx, dy]) => ctx.fillRect(cx + dx - 3, cy + dy - 5, 5, 2)); // highlight

  // Logs
  ctx.fillStyle = '#3a1a05';
  ctx.save();
  ctx.translate(cx, cy + 2);
  ctx.rotate(0.45);  ctx.fillRect(-13, -3, 26, 5);
  ctx.rotate(-0.9);  ctx.fillRect(-13, -3, 26, 5);
  ctx.restore();

  // Coal glow
  ctx.fillStyle = '#8b2200';
  ctx.fillRect(cx - 7, cy - 3, 14, 5);
  ctx.fillStyle = '#cc3300';
  ctx.fillRect(cx - 5, cy - 4, 10, 3);

  // Animated flames
  const t = tick * 0.09;
  const flameData = [
    { ox: -4, baseH: 14, c: '#ff3300', phase: 0   },
    { ox:  0, baseH: 22, c: '#ff6600', phase: 0.8 },
    { ox:  4, baseH: 16, c: '#ff9900', phase: 1.6 },
    { ox: -1, baseH: 10, c: '#ffcc00', phase: 2.4 }
  ];
  flameData.forEach(f => {
    const h = f.baseH + Math.sin(t + f.phase) * 5;
    const w = 5 + Math.sin(t * 1.3 + f.phase) * 1.5;
    const wobble = Math.sin(t * 0.7 + f.phase) * 2;
    ctx.fillStyle = f.c;
    ctx.fillRect(cx + f.ox + wobble - w / 2, cy - 5 - h, w, h);
  });
}

// ── H5. CAMPFIRE GLOW ─────────────────────────────────────────

function drawFireGlow() {
  const intensity = 0.22 + Math.sin(tick * 0.08) * 0.05;
  const grd = ctx.createRadialGradient(CAMP_X, CAMP_Y - 20, 0, CAMP_X, CAMP_Y - 10, 200);
  grd.addColorStop(0, `rgba(255, 110, 20, ${intensity})`);
  grd.addColorStop(1, 'rgba(255, 60, 0, 0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
}

// ── H6. CHARACTER ─────────────────────────────────────────────

function drawCharacter(char) {
  const cx = Math.round(char.x);
  const cy = Math.round(char.y);  // cy = feet Y
  const col = char.color;
  const wf  = char.walkFrame;

  // Bob offset for idle personas
  const bob = char.isSpeaking || char.isPlayer
    ? 0
    : Math.round(Math.sin(tick * 0.07 + char.phase) * 1.2);

  const legL = wf === 1 ? 5 : 4;
  const legR = wf === 1 ? 4 : 5;

  const legsTop  = cy - legL * S + bob;
  const bodyTop  = legsTop - 6 * S;
  const headTop  = bodyTop - 5 * S;

  // Shadow ellipse
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 3, 7 * S / 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Left leg
  ctx.fillStyle = adjustColor(col, -55);
  ctx.fillRect(cx - 3 * S, cy - legL * S + bob, 2 * S, legL * S);
  // Right leg
  ctx.fillRect(cx + S,     cy - legR * S + bob, 2 * S, legR * S);

  // Body
  ctx.fillStyle = adjustColor(col, -28);
  ctx.fillRect(cx - 3 * S, bodyTop, 6 * S, 6 * S);

  // Arms (swing with walk)
  const armSwing = wf === 1 ? S : 0;
  ctx.fillRect(cx - 5 * S, bodyTop + armSwing,      2 * S, 4 * S);
  ctx.fillRect(cx + 3 * S, bodyTop + S - armSwing,  2 * S, 4 * S);

  // Head
  ctx.fillStyle = col;
  ctx.fillRect(cx - 3 * S, headTop, 6 * S, 5 * S);

  // Eyes
  ctx.fillStyle = '#1a0808';
  ctx.fillRect(cx - 2 * S, headTop + 2 * S, S, S);
  ctx.fillRect(cx + S,     headTop + 2 * S, S, S);

  // Open mouth when speaking
  if (char.isSpeaking && tick % 16 < 8) {
    ctx.fillStyle = '#1a0808';
    ctx.fillRect(cx - S, headTop + 4 * S - 1, 2 * S, S);
  }

  drawPersonaOverlay(char, cx, cy, headTop, bodyTop, bob, wf);

  // Thinking dots above head
  if (char.isThinking) {
    const dotY = headTop - 6;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    [0, 6, 12].forEach((dx, i) => {
      const bounce = Math.sin(tick * 0.15 + i * 1.2) > 0 ? -2 : 0;
      ctx.fillRect(cx - 9 + dx, dotY + bounce, 3, 3);
    });
  }

  // Emoji label above head
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(char.emoji, cx, headTop - 6);
  ctx.textAlign = 'left';
}

function drawPersonaOverlay(char, cx, cy, headTop, bodyTop, bob, wf) {
  switch (char.id) {

    case 'devil': {
      // Red pointed horns
      ctx.fillStyle = '#c1121f';
      ctx.beginPath();
      ctx.moveTo(cx - 2 * S, headTop);
      ctx.lineTo(cx - 3 * S, headTop - 4 * S);
      ctx.lineTo(cx - S,     headTop);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + S,     headTop);
      ctx.lineTo(cx + S,     headTop - 4 * S);
      ctx.lineTo(cx + 3 * S, headTop);
      ctx.fill();
      // Glowing red eyes
      ctx.fillStyle = 'rgba(255,40,40,0.4)';
      ctx.fillRect(cx - 2 * S - 1, headTop + 2 * S - 1, S + 2, S + 2);
      ctx.fillRect(cx + S - 1,     headTop + 2 * S - 1, S + 2, S + 2);
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(cx - 2 * S, headTop + 2 * S, S, S);
      ctx.fillRect(cx + S,     headTop + 2 * S, S, S);
      // Zigzag tail from body right
      ctx.fillStyle = '#c1121f';
      const tb = bodyTop + 4 * S;
      ctx.fillRect(cx + 3 * S, tb,         2 * S, S);
      ctx.fillRect(cx + 4 * S, tb + S,     2 * S, S);
      ctx.beginPath();
      ctx.moveTo(cx + 5 * S, tb + 2 * S);
      ctx.lineTo(cx + 8 * S, tb - S);
      ctx.lineTo(cx + 6 * S, tb + 2 * S);
      ctx.fill();
      break;
    }

    case 'pragmatist': {
      // Yellow hard hat dome + brim
      ctx.fillStyle = '#ffd60a';
      ctx.fillRect(cx - 3 * S, headTop - 3 * S, 6 * S, 3 * S);
      ctx.fillRect(cx - 4 * S, headTop - S,     8 * S, S);
      // Shadow line under brim
      ctx.fillStyle = '#c8a800';
      ctx.fillRect(cx - 4 * S, headTop, 8 * S, S);
      // Gray wrench (right hand)
      const wx = cx + 5 * S, wy = bodyTop + S;
      ctx.fillStyle = '#aaa';
      ctx.fillRect(wx,     wy,         S,     4 * S);
      ctx.fillRect(wx - S, wy,         3 * S, S);
      ctx.fillRect(wx - S, wy + S,     S,     S);
      ctx.fillRect(wx + S, wy + S,     S,     S);
      break;
    }

    case 'idealist': {
      // Flowing light-blue hair on sides + top tuft
      ctx.fillStyle = '#90e0ef';
      ctx.fillRect(cx - 5 * S, headTop,         2 * S, 5 * S);
      ctx.fillRect(cx + 3 * S, headTop,         2 * S, 5 * S);
      ctx.fillRect(cx - 4 * S, headTop + 5 * S, 2 * S, 2 * S);
      ctx.fillRect(cx + 2 * S, headTop + 5 * S, 2 * S, 2 * S);
      ctx.fillRect(cx - 2 * S, headTop - 2 * S, 4 * S, 2 * S);
      // Cape hem flare below body
      ctx.fillStyle = 'rgba(72,149,239,0.5)';
      ctx.fillRect(cx - 4 * S, bodyTop + 5 * S, 8 * S, 2 * S);
      // Animated sparkles
      const spts = [[-18, -8], [20, -4], [-22, 5], [24, S]];
      spts.forEach(([dx, dy], i) => {
        if (Math.sin(tick * 0.1 + i * 1.6) > 0) {
          const sx = cx + dx, sy = headTop + dy;
          ctx.fillStyle = '#caf0f8';
          ctx.fillRect(sx, sy, 2, 2);
          ctx.fillRect(sx - 2, sy + 1, 2, 1);
          ctx.fillRect(sx + 2, sy + 1, 2, 1);
          ctx.fillRect(sx + 1, sy - 2, 1, 2);
          ctx.fillRect(sx + 1, sy + 2, 1, 2);
        }
      });
      break;
    }

    case 'skeptic': {
      // Lab coat: white side columns + hem
      ctx.fillStyle = 'rgba(240,240,240,0.65)';
      ctx.fillRect(cx - 3 * S, bodyTop,         S,     6 * S);
      ctx.fillRect(cx + 2 * S, bodyTop,         S,     6 * S);
      ctx.fillRect(cx - 3 * S, bodyTop + 5 * S, 6 * S, S);
      // White-rimmed glasses
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 3 * S,     headTop + 2 * S - 1, 2 * S, S + 2);
      ctx.strokeRect(cx,             headTop + 2 * S - 1, 2 * S, S + 2);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(cx - S, headTop + 2 * S, S, 1);
      // Magnifying glass (right side)
      const mgCx = cx + 7 * S, mgCy = bodyTop + 2 * S, mgR = 2.5 * S;
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(mgCx, mgCy, mgR, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(180,210,255,0.18)';
      ctx.beginPath(); ctx.arc(mgCx, mgCy, mgR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.beginPath();
      ctx.moveTo(mgCx + mgR * 0.7, mgCy + mgR * 0.7);
      ctx.lineTo(mgCx + mgR * 0.7 + S * 1.5, mgCy + mgR * 0.7 + S * 1.5);
      ctx.stroke();
      break;
    }

    case 'first-principles': {
      // Antenna pole + blinking tip
      ctx.fillStyle = '#999';
      ctx.fillRect(cx, headTop - 9 * S, S, 9 * S);
      ctx.fillStyle = tick % 50 < 25 ? '#f72585' : '#ff9f1c';
      ctx.fillRect(cx - S, headTop - 10 * S, 3 * S, S);
      // Gear on chest: cross + diagonal nubs + dark center
      const gx = cx, gy = bodyTop + 3 * S;
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(gx - S, gy - 7,  2 * S, 14);
      ctx.fillRect(gx - 7, gy - S,  14,    2 * S);
      ctx.fillRect(gx - 5, gy - 5,  3,     3);
      ctx.fillRect(gx + 2, gy - 5,  3,     3);
      ctx.fillRect(gx - 5, gy + 2,  3,     3);
      ctx.fillRect(gx + 2, gy + 2,  3,     3);
      ctx.fillStyle = '#141d31';
      ctx.beginPath(); ctx.arc(gx, gy, S, 0, Math.PI * 2); ctx.fill();
      // Circuit nubs on arms
      ctx.fillStyle = '#7209b7';
      ctx.fillRect(cx - 5 * S, bodyTop + 2 * S, S, S);
      ctx.fillRect(cx + 3 * S, bodyTop + S,     S, S);
      break;
    }

    case 'ethicist': {
      // Gold halo ellipse above head
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, headTop - 4, 3.5 * S, S + 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,215,0,0.12)';
      ctx.beginPath();
      ctx.ellipse(cx, headTop - 4, 3.5 * S, S + 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // White beard hanging from chin
      ctx.fillStyle = '#f5f0e8';
      ctx.fillRect(cx - 2 * S, bodyTop,         4 * S, 2 * S);
      ctx.fillRect(cx - S,     bodyTop + 2 * S, 2 * S, S);
      // Robe hem wider than body
      ctx.fillStyle = 'rgba(180,170,220,0.5)';
      ctx.fillRect(cx - 4 * S, bodyTop + 4 * S, 8 * S, 2 * S);
      // Gold scales icon on chest
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(cx - S,     bodyTop + S,     2 * S, S);
      ctx.fillRect(cx,         bodyTop + S,     S,     3 * S);
      ctx.fillRect(cx - 3 * S, bodyTop + 2 * S, 2 * S, S);
      ctx.fillRect(cx + S,     bodyTop + 2 * S, 2 * S, S);
      break;
    }

    case 'contrarian': {
      // Spiky multicolor hair
      const sColors = ['#f72585', '#7209b7', '#4cc9f0'];
      [[-2, 5], [0, 6], [2, 5]].forEach(([dx, h], i) => {
        ctx.fillStyle = sColors[i];
        ctx.beginPath();
        ctx.moveTo(cx + (dx - 1) * S, headTop);
        ctx.lineTo(cx + dx * S,       headTop - h * S);
        ctx.lineTo(cx + (dx + 1) * S, headTop);
        ctx.fill();
      });
      // White X on chest
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - S,     bodyTop + S);
      ctx.lineTo(cx + 2 * S, bodyTop + 4 * S);
      ctx.moveTo(cx + 2 * S, bodyTop + S);
      ctx.lineTo(cx - S,     bodyTop + 4 * S);
      ctx.stroke();
      // Extended pointing arm (right side)
      ctx.fillStyle = adjustColor(char.color, -30);
      ctx.fillRect(cx + 3 * S, bodyTop,     5 * S, 2 * S);
      ctx.fillRect(cx + 7 * S, bodyTop - S, 2 * S, S);
      break;
    }

    case 'realist': {
      // Dark suit overlay on body
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(cx - 3 * S, bodyTop, 6 * S, 6 * S);
      // Light shirt centre
      ctx.fillStyle = '#d8d8d8';
      ctx.fillRect(cx - S, bodyTop, S * 2, 4 * S);
      // Lapels
      ctx.fillRect(cx - 2 * S, bodyTop, S, 3 * S);
      ctx.fillRect(cx + S,     bodyTop, S, 3 * S);
      // Dark tie
      ctx.fillStyle = '#2d2d44';
      ctx.fillRect(cx - S + 1, bodyTop + S, S + 1, 3 * S);
      // Thin glasses
      ctx.strokeStyle = '#777';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 3 * S,     headTop + 2 * S - 1, 2 * S, S + 1);
      ctx.strokeRect(cx,             headTop + 2 * S - 1, 2 * S, S + 1);
      ctx.fillStyle = '#777';
      ctx.fillRect(cx - S, headTop + 2 * S, S, 1);
      // Clipboard in left hand
      ctx.fillStyle = '#c8a96e';
      ctx.fillRect(cx - 8 * S, bodyTop,     3 * S, 5 * S);
      ctx.fillStyle = '#888';
      ctx.fillRect(cx - 7 * S, bodyTop - S, S + 2, S);
      ctx.fillStyle = '#555';
      ctx.fillRect(cx - 8 * S + 3, bodyTop + S,     S + 1, 1);
      ctx.fillRect(cx - 8 * S + 3, bodyTop + 2 * S, S + 1, 1);
      ctx.fillRect(cx - 8 * S + 3, bodyTop + 3 * S, S + 1, 1);
      break;
    }
  }
}

// ── H7. SPEECH BUBBLE ─────────────────────────────────────────

function drawSpeechBubble(char, text, color, isTyping) {
  if (!text) return;

  const mob      = window.innerWidth < 768;
  const maxW     = mob ? 155 : 210;
  const pad      = mob ? 10  : 9;
  const lineH    = mob ? 19  : 15;
  const fontSize = mob ? 13  : 10;

  ctx.font = `${fontSize}px 'Courier New', monospace`;
  ctx.textAlign = 'left';

  // Word-wrap
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW - pad * 2) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (!lines.length) return;

  const bw = Math.min(maxW, Math.max(...lines.map(l => ctx.measureText(l).width)) + pad * 2 + 4);
  const bh = lines.length * lineH + pad * 2;

  // Anchor to character head
  const headTop = Math.round(char.y) - (5 + 6 + 5) * S - 5 * S;
  let bx = Math.round(char.x) - bw / 2;
  let by = headTop - bh - 14;
  const clampL = mob ? MOB_VX + 5 : 6;
  const clampR = mob ? MOB_VX + WORLD_W / MOB_ZOOM - bw - 5 : WORLD_W - bw - 6;
  bx = Math.max(clampL, Math.min(clampR, bx));
  by = Math.max(mob ? MOB_VY + 5 : 6, by);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(bx + 3, by + 3, bw, bh);

  // Background
  ctx.fillStyle = 'rgba(8, 12, 28, 0.95)';
  ctx.fillRect(bx, by, bw, bh);

  // Border
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);

  // Tail
  const tailX = Math.max(bx + 10, Math.min(bx + bw - 10, Math.round(char.x)));
  ctx.fillStyle = 'rgba(8,12,28,0.95)';
  ctx.beginPath();
  ctx.moveTo(tailX - 5, by + bh);
  ctx.lineTo(tailX,     by + bh + 12);
  ctx.lineTo(tailX + 5, by + bh);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tailX - 5, by + bh);
  ctx.lineTo(tailX,     by + bh + 12);
  ctx.lineTo(tailX + 5, by + bh);
  ctx.stroke();

  // Text
  ctx.fillStyle = '#ddeeff';
  ctx.font = `${fontSize}px 'Courier New', monospace`;
  lines.forEach((l, i) => {
    ctx.fillText(l, bx + pad, by + pad + (i + 1) * lineH - 3);
  });

  // Blinking cursor
  if (isTyping && tick % 24 < 12) {
    const lastLine = lines[lines.length - 1];
    const lx = bx + pad + ctx.measureText(lastLine).width + 2;
    const ly = by + pad + (lines.length) * lineH - lineH + 2;
    ctx.fillStyle = color;
    ctx.fillRect(lx, ly, 2, lineH - 3);
  }
}

// ── H8. VIGNETTE ──────────────────────────────────────────────

function drawVignette() {
  const grd = ctx.createRadialGradient(
    WORLD_W / 2, WORLD_H / 2, WORLD_H * 0.3,
    WORLD_W / 2, WORLD_H / 2, WORLD_H * 0.9
  );
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
}

// ── H9. HUD ───────────────────────────────────────────────────

function drawHUD() {
  ctx.textAlign = 'left';
  ctx.font = "bold 6px 'Press Start 2P', monospace";
  ctx.fillStyle = 'rgba(0,180,216,0.5)';
  ctx.fillText('WASD / ↑↓←→ to move', 8, WORLD_H - 8);

  if (hintText) {
    ctx.fillStyle = 'rgba(255,200,60,0.92)';
    ctx.font = "bold 7px 'Press Start 2P', monospace";
    const tw = ctx.measureText(hintText).width;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(WORLD_W / 2 - tw / 2 - 8, 10, tw + 16, 18);
    ctx.fillStyle = 'rgba(255,200,60,0.95)';
    ctx.fillText(hintText, WORLD_W / 2 - tw / 2, 23);
  }
}

// ── I. RENDER ─────────────────────────────────────────────────

function render() {
  ctx.clearRect(0, 0, WORLD_W, WORLD_H);

  const mob = window.innerWidth < 768;
  if (mob) ctx.setTransform(MOB_ZOOM, 0, 0, MOB_ZOOM, -MOB_VX * MOB_ZOOM, -MOB_VY * MOB_ZOOM);

  drawBackground();

  // Depth-sort: trees + mushrooms + chars by Y
  const depthItems = [
    ...TREES.map(([x, y]) => ({ type: 'tree', x, y })),
    ...MUSHROOMS.map(([x, y]) => ({ type: 'shroom', x, y })),
    ...chars.map(c => ({ type: 'char', x: c.x, y: c.y, ref: c })),
    { type: 'fire', x: CAMP_X, y: CAMP_Y }
  ];
  depthItems.sort((a, b) => a.y - b.y);

  // Draw fire glow underneath everything
  drawFireGlow();

  depthItems.forEach(item => {
    if (item.type === 'tree')  drawTree(item.x, item.y);
    if (item.type === 'shroom') drawMushroom(item.x, item.y);
    if (item.type === 'fire')  drawCampfire();
    if (item.type === 'char')  drawCharacter(item.ref);
  });

  // Speech bubbles on top
  if (activeBubble) {
    const char = chars.find(c => c.id === activeBubble.charId);
    if (char) drawSpeechBubble(char, activeBubble.displayText, activeBubble.color, activeBubble.typing);
  }
  if (playerBubble && player && !mob) {
    ctx.globalAlpha = Math.min(1, playerBubble.holdFrames / 10);
    drawSpeechBubble(player, playerBubble.text, '#b8d4f0', false);
    ctx.globalAlpha = 1;
  }

  if (mob) ctx.setTransform(1, 0, 0, 1, 0, 0);

  drawVignette();
  drawHUD();
}

// ── J. UPDATE ─────────────────────────────────────────────────

function updatePlayer() {
  if (window.innerWidth < 768) return;
  // Don't steal keys when user is typing in the chat box
  if (document.activeElement === document.getElementById('chat-input')) return;

  const speed = 2.2;
  let moved = false;

  if (isKey('ArrowLeft') || isKey('a') || isKey('A'))  { player.x -= speed; moved = true; }
  if (isKey('ArrowRight')|| isKey('d') || isKey('D')) { player.x += speed; moved = true; }
  if (isKey('ArrowUp')   || isKey('w') || isKey('W')) { player.y -= speed; moved = true; }
  if (isKey('ArrowDown') || isKey('s') || isKey('S')) { player.y += speed; moved = true; }

  player.x = Math.max(16, Math.min(WORLD_W - 16, player.x));
  player.y = Math.max(50, Math.min(WORLD_H - 20, player.y));

  if (moved) {
    player.walkFrame = Math.floor(tick * 0.18) % 2;
  } else {
    player.walkFrame = 0;
  }
}

function updatePersonas() {
  chars.forEach(c => {
    if (c.isPlayer) return;
    if (c.isSpeaking) {
      // Stay near home, gentle sway
      c.x = c.homeX + Math.sin(tick * 0.04 + c.phase) * 4;
      c.y = c.homeY + Math.cos(tick * 0.04 + c.phase) * 3;
      c.walkFrame = 0;
      return;
    }
    // Wander: slow sine-wave drift around home
    c.x = c.homeX + Math.sin(tick * 0.013 + c.phase)       * 22;
    c.y = c.homeY + Math.cos(tick * 0.018 + c.phase * 0.7) * 14;
    c.walkFrame = Math.floor(tick * 0.12 + c.phase) % 2;
  });
}

function updateBubble() {
  if (!activeBubble) return;

  if (activeBubble.typing) {
    const prevInt = Math.floor(activeBubble.typeIdx);
    activeBubble.typeIdx = Math.min(
      activeBubble.typeIdx + 0.38, // ~23 chars/sec at 60fps
      activeBubble.fullText.length
    );
    const newInt = Math.floor(activeBubble.typeIdx);

    // Per-persona blip interval (pragmatist/contrarian: rapid; ethicist: slow)
    const blipEvery = PERSONA_VOICE_SPECS[activeBubble.charId]?.interval ?? 2;
    if (Math.floor(newInt / blipEvery) > Math.floor(prevInt / blipEvery)) {
      playVoiceBlip(activeBubble.charId);
    }

    if (activeBubble.typeIdx >= activeBubble.fullText.length) {
      activeBubble.typing = false;
      activeBubble.holdFrames = 150; // ~2.5s at 60fps
    }
    activeBubble.displayText = activeBubble.fullText.substring(0, newInt);
  } else {
    activeBubble.holdFrames--;
    if (activeBubble.holdFrames <= 0) clearBubble();
  }
}

function updatePlayerBubble() {
  if (!playerBubble) return;
  playerBubble.holdFrames--;
  if (playerBubble.holdFrames <= 0) playerBubble = null;
}

let tick = 0;
function update() {
  tick++;
  if (player) updatePlayer();
  updatePersonas();
  updateBubble();
  updatePlayerBubble();
}

// ── K. GAME LOOP ──────────────────────────────────────────────

let hintText = '';   // transient status line shown in HUD (rate-limit countdown etc.)
let loopId = null;

function startLoop() {
  if (loopId) cancelAnimationFrame(loopId);
  function step() {
    update();
    render();
    loopId = requestAnimationFrame(step);
  }
  loopId = requestAnimationFrame(step);
}

function stopLoop() {
  if (loopId) { cancelAnimationFrame(loopId); loopId = null; }
}

// ── L. API & DEBATE ───────────────────────────────────────────

async function callGemini(systemInstruction, userContent, onStatus) {
  if (!state.apiKey) throw new Error('No API key — click ⚙ API KEY in setup.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.model}:generateContent?key=${state.apiKey}`;
  const reqBody = JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: userContent }] }],
    generationConfig: { maxOutputTokens: 70, temperature: 0.95, topP: 0.92 }
  });

  async function doFetch() {
    try {
      return await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: reqBody });
    } catch (e) {
      throw new Error(`Network error. (${e.message})`);
    }
  }

  let res = await doFetch();

  if (res.status === 429) {
    // Read body once to distinguish quota exhaustion from transient rate limiting
    let errBody = {};
    try { errBody = await res.json(); } catch {}
    const errMsg = errBody?.error?.message || '';
    if (errMsg.includes('limit: 0') || errMsg.toLowerCase().includes('quota exceeded')) {
      hintText = '';
      throw new Error('QUOTA EXHAUSTED — switch to Groq in ⚙ Settings (it\'s free) or get a new Gemini key at aistudio.google.com');
    }
    // Transient rate limit — countdown then retry
    for (let i = 20; i > 0; i--) {
      const msg = `Rate limited — retrying in ${i}s`;
      hintText = msg;
      if (onStatus) onStatus(msg);
      await pause(1000);
    }
    hintText = '';
    res = await doFetch();
  }

  if (!res.ok) {
    let rawMsg = `HTTP ${res.status}`;
    let apiMsg = '';
    try {
      const d = await res.json();
      apiMsg = d.error?.message || '';
      rawMsg = `HTTP ${res.status}: ${apiMsg || d.error?.status || ''}`;
    } catch { /* ignore */ }
    console.error('[Quorum] API error', res.status, apiMsg);
    hintText = '';
    throw new Error(rawMsg);
  }

  hintText = '';
  const data = await res.json();
  console.log('[Quorum] API success, tokens used ~', JSON.stringify(data).length);
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

async function callGroq(systemInstruction, userContent) {
  if (!state.groqKey) throw new Error('No Groq API key — add one in ⚙ Settings (free at console.groq.com)');
  let res;
  try {
    res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.groqKey}` },
      body: JSON.stringify({
        model: state.model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user',   content: userContent }
        ],
        max_tokens: 60,
        temperature: 0.95
      })
    });
  } catch (e) {
    throw new Error(`Network error. (${e.message})`);
  }
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(`HTTP ${res.status}: ${d.error?.message || ''}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

async function callProxy(systemInstruction, userContent) {
  let res;
  try {
    res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user',   content: userContent },
        ],
        max_tokens: 60,
        temperature: 0.95,
      }),
    });
  } catch (e) {
    throw new Error(`Network error: ${e.message}`);
  }
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(`HTTP ${res.status}: ${d.error?.message || ''}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

function callLLM(systemInstruction, userContent, onStatus) {
  if (PROXY_URL) return callProxy(systemInstruction, userContent);
  if (state.provider === 'groq') return callGroq(systemInstruction, userContent);
  return callGemini(systemInstruction, userContent, onStatus);
}

const DEBATE_WRAPPER = `Campfire debate. TWO sentences max, 20 words total. Contractions. Blunt and direct. No filler openings ("I think", "Well,", "That's a good point"). React to the last thing said. Plain text only.`;

function buildSysPrompt(persona) {
  return `${persona.systemPrompt}\n\n${DEBATE_WRAPPER}`;
}

function buildContext(topic, history) {
  let ctx = `TOPIC: "${topic}"\n\n`;
  if (!history.length) {
    return ctx + 'You are the first to speak. Respond directly to the topic.';
  }
  history.forEach(h => {
    ctx += `${h.isUser ? 'THE HUMAN' : h.name}: ${h.text}\n\n`;
  });
  const last = history[history.length - 1];
  ctx += last.isUser
    ? 'The human just spoke. Respond specifically to what they said.'
    : 'Now it is your turn. Respond to what was most recently said.';
  return ctx;
}

async function runDebate() {
  const personaChars = chars.filter(c => !c.isPlayer);

  while (state.debating) {
    for (const char of personaChars) {
      if (!state.debating) return;

      const persona = PERSONAS.find(p => p.id === char.id);
      if (!persona) continue;

      // Show "thinking" dots
      char.isThinking = true;

      let text = '';
      try {
        text = await callLLM(
          buildSysPrompt(persona),
          buildContext(state.topic, state.history),
          (msg) => {
            // Show rate-limit status in activeBubble if one exists
            if (activeBubble && activeBubble.charId === char.id) {
              activeBubble.displayText = msg;
            }
          }
        );
      } catch (err) {
        char.isThinking = false;
        // Show error as a short bubble then continue
        await showBubble(char.id, `[${err.message}]`, '#ef233c');
        await pause(3000);
        clearBubble();
        continue;
      }

      char.isThinking = false;

      addToHistory({ id: char.id, name: char.name, text, isUser: false });

      await showBubble(char.id, text, char.color);
      await waitForBubbleClear();

      await pause(900); // beat of silence between speakers
    }
  }
}

function waitForBubbleClear() {
  return new Promise(resolve => {
    function check() {
      if (!activeBubble) { resolve(); return; }
      requestAnimationFrame(check);
    }
    check();
  });
}

function pause(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── M. USER INTERJECT + HISTORY ───────────────────────────────

function addToHistory(entry) {
  state.history.push(entry);
  const list = document.getElementById('history-list');
  if (!list) return;
  const persona = PERSONAS.find(p => p.id === entry.id);
  const color   = entry.isUser ? '#b8d4f0' : (persona?.color || '#aaa');

  const div      = document.createElement('div');
  div.className  = 'history-entry' + (entry.isUser ? ' user-entry' : '');
  div.style.borderLeft   = `2px solid ${color}`;
  div.style.paddingLeft  = '9px';

  const nameEl   = document.createElement('div');
  nameEl.className   = 'history-entry-name';
  nameEl.style.color = color;
  nameEl.textContent = (persona?.emoji ? persona.emoji + ' ' : '') + entry.name.toUpperCase();

  const textEl   = document.createElement('div');
  textEl.className   = 'history-entry-text';
  textEl.textContent = entry.text;

  div.appendChild(nameEl);
  div.appendChild(textEl);
  list.appendChild(div);
  list.scrollTop = list.scrollHeight;
}

function clearHistoryPanel() {
  const list = document.getElementById('history-list');
  if (list) list.innerHTML = '';
}

function toggleHistory() {
  const panel = document.getElementById('history-panel');
  const btn   = document.getElementById('history-btn');
  const open  = panel.style.display === 'none' || panel.style.display === '';
  panel.style.display = open ? 'flex' : 'none';
  btn.classList.toggle('log-open', open);
  if (open) {
    const list = document.getElementById('history-list');
    if (list) list.scrollTop = list.scrollHeight;
  }
}

function sendInterject(text) {
  if (!text.trim() || !state.debating) return;
  addToHistory({ id: 'player', name: 'You', text, isUser: true });
  playerBubble = { text, holdFrames: 280 };
}

// ── N. SETUP UI ───────────────────────────────────────────────

function renderPersonaGrid() {
  const grid = document.getElementById('persona-grid');
  grid.innerHTML = '';
  PERSONAS.forEach(p => {
    const card = document.createElement('div');
    card.className = 'persona-card';
    card.dataset.id = p.id;
    card.style.setProperty('--card-color', p.color);
    card.style.setProperty('--card-bg', p.colorDim);
    card.style.setProperty('--card-glow', p.colorGlow);
    card.innerHTML = `
      <div class="persona-card-sel">✓</div>
      <span class="persona-card-emoji">${p.emoji}</span>
      <div class="persona-card-name">${p.name.toUpperCase()}</div>
      <div class="persona-card-tagline">${p.tagline}</div>`;
    card.addEventListener('click', () => togglePersona(p.id, card));
    grid.appendChild(card);
  });
}

function togglePersona(id, card) {
  const idx = state.selectedIds.indexOf(id);
  if (idx === -1) {
    if (state.selectedIds.length >= 4) { flashError('setup-error', 'MAX 4 — deselect one first.'); return; }
    state.selectedIds.push(id);
    card.classList.add('selected');
  } else {
    state.selectedIds.splice(idx, 1);
    card.classList.remove('selected');
  }
  hideEl('setup-error');
}

function startGame() {
  const topic = document.getElementById('topic-input').value.trim();
  if (!topic)                         { flashError('setup-error', 'ENTER A TOPIC.'); return; }
  if (state.selectedIds.length < 2)   { flashError('setup-error', 'SELECT AT LEAST 2 PERSONAS.'); return; }
  const activeKey = PROXY_URL || (state.provider === 'groq' ? state.groqKey : state.apiKey);
  if (!activeKey)                     { openSettings(); return; }

  state.topic = topic;
  state.history = [];
  state.debating = true;
  clearHistoryPanel();
  // Only auto-open history panel on desktop — on mobile it covers the whole screen
  if (window.innerWidth >= 768) {
    document.getElementById('history-panel').style.display = 'flex';
    document.getElementById('history-btn').classList.add('log-open');
  }

  const selected = state.selectedIds.map(id => PERSONAS.find(p => p.id === id));
  initChars(selected);
  activeBubble = null;
  playerBubble = null;

  // Clear any keys held down while typing the topic
  Object.keys(keys).forEach(k => delete keys[k]);

  document.getElementById('setup-view').style.display = 'none';
  document.getElementById('game-view').style.display  = 'flex';
  document.body.classList.add('in-game');

  // Defer until browser has computed layout so clientWidth is correct
  requestAnimationFrame(() => {
    initCanvas();
    startLoop();
    runDebate();
  });
}

function endGame() {
  state.debating = false;
  stopLoop();
  document.getElementById('game-view').style.display  = 'none';
  document.getElementById('setup-view').style.display = 'flex';
  document.body.classList.remove('in-game');
}

// ── O. SETTINGS ───────────────────────────────────────────────

const PROVIDER_UI = {
  gemini: {
    keyLabel: 'GEMINI API KEY',
    keyPlaceholder: 'AIzaSy...',
    keyHelp: 'Free key at <strong>aistudio.google.com</strong> → Get API key.<br>Stored locally. Sent only to Google\'s API.',
    models: GEMINI_MODELS,
    defaultModel: 'gemini-2.0-flash',
  },
  groq: {
    keyLabel: 'GROQ API KEY',
    keyPlaceholder: 'gsk_...',
    keyHelp: 'Free key at <strong>console.groq.com</strong> → API Keys.<br>Generous free tier. Stored locally.',
    models: GROQ_MODELS,
    defaultModel: 'llama-3.3-70b-versatile',
  }
};

function applyProviderUI(provider) {
  const ui = PROVIDER_UI[provider] || PROVIDER_UI.gemini;
  document.getElementById('key-label').textContent = ui.keyLabel;
  document.getElementById('api-key-input').placeholder = ui.keyPlaceholder;
  document.getElementById('key-help').innerHTML = ui.keyHelp;
  const sel = document.getElementById('model-select');
  sel.innerHTML = ui.models.map(m => `<option value="${m.value}">${m.label}</option>`).join('');
  const savedModel = localStorage.getItem('quorum_model') || ui.defaultModel;
  sel.value = ui.models.find(m => m.value === savedModel) ? savedModel : ui.defaultModel;
}

function openSettings() {
  const provider = state.provider;
  document.getElementById('provider-select').value = provider;
  applyProviderUI(provider);
  document.getElementById('api-key-input').value = provider === 'groq' ? state.groqKey : state.apiKey;
  document.getElementById('model-select').value  = state.model;
  const notice = document.getElementById('proxy-notice');
  if (notice) notice.style.display = PROXY_URL ? 'block' : 'none';
  document.getElementById('settings-modal').style.display = 'flex';
}

function closeSettings() {
  document.getElementById('settings-modal').style.display = 'none';
  hideEl('settings-error');
}

async function testApiKey() {
  const key      = document.getElementById('api-key-input').value.trim();
  const model    = document.getElementById('model-select').value;
  const provider = document.getElementById('provider-select').value;
  const btn      = document.getElementById('test-key-btn');
  const okEl     = document.getElementById('settings-ok');

  if (!key) { flashError('settings-error', 'ENTER A KEY FIRST.'); return; }
  hideEl('settings-error');
  hideEl('settings-ok');
  btn.textContent = 'TESTING...';
  btn.disabled = true;

  try {
    let res, text;
    if (provider === 'groq') {
      res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Say: ok' }], max_tokens: 5 })
      });
    } else {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Reply with exactly: ok' }] }], generationConfig: { maxOutputTokens: 5 } })
      });
    }
    text = await res.text();
    console.log('[Quorum] Test response', res.status, text);
    if (res.ok) {
      okEl.style.display = 'block';
    } else {
      let msg = `HTTP ${res.status}`;
      try { msg = JSON.parse(text)?.error?.message || msg; } catch {}
      flashError('settings-error', msg);
    }
  } catch (e) {
    flashError('settings-error', `Network error: ${e.message}`);
  }

  btn.textContent = 'TEST KEY';
  btn.disabled = false;
}

function saveSettings() {
  const key      = document.getElementById('api-key-input').value.trim();
  const model    = document.getElementById('model-select').value;
  const provider = document.getElementById('provider-select').value;
  if (!key) { flashError('settings-error', 'KEY CANNOT BE EMPTY.'); return; }
  if (provider === 'gemini' && !key.startsWith('AIza')) {
    flashError('settings-error', 'GEMINI KEYS START WITH "AIza".'); return;
  }
  if (provider === 'groq' && !key.startsWith('gsk_')) {
    flashError('settings-error', 'GROQ KEYS START WITH "gsk_".'); return;
  }
  state.provider = provider;
  state.model    = model;
  if (provider === 'groq') {
    state.groqKey = key;
    localStorage.setItem('quorum_groq_key',  key);
  } else {
    state.apiKey = key;
    localStorage.setItem('quorum_api_key', key);
  }
  localStorage.setItem('quorum_provider', provider);
  localStorage.setItem('quorum_model',    model);
  closeSettings();
}

// ── P. DOM HELPERS ────────────────────────────────────────────

function flashError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => hideEl(id), 4000);
}

function hideEl(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// ── Q. INIT ───────────────────────────────────────────────────

function init() {
  renderPersonaGrid();

  // Default panel
  ['devil', 'pragmatist', 'idealist', 'skeptic'].forEach(id => {
    const card = document.querySelector(`.persona-card[data-id="${id}"]`);
    if (card) togglePersona(id, card);
  });

  const hasKey = PROXY_URL || (state.provider === 'groq' ? state.groqKey : state.apiKey);
  if (!hasKey) {
    setTimeout(() => {
      const el = document.getElementById('setup-error');
      el.textContent = '⚙ Add an API key to begin (click API KEY below).';
      el.style.display = 'block';
    }, 500);
  }

  // Wire setup events
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('topic-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startGame(); }
  });

  // Wire settings modal events
  document.getElementById('close-settings-btn').addEventListener('click', closeSettings);
  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
  document.getElementById('test-key-btn').addEventListener('click', testApiKey);
  document.getElementById('provider-select').addEventListener('change', e => {
    const p = e.target.value;
    applyProviderUI(p);
    document.getElementById('api-key-input').value = p === 'groq' ? state.groqKey : state.apiKey;
    hideEl('settings-error');
    hideEl('settings-ok');
  });
  document.getElementById('settings-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeSettings();
  });

  // Wire game events
  document.getElementById('quit-btn').addEventListener('click', () => {
    if (confirm('End this debate?')) endGame();
  });
  document.getElementById('history-btn').addEventListener('click', toggleHistory);
  document.getElementById('close-history-btn').addEventListener('click', toggleHistory);

  const chatInput = document.getElementById('chat-input');
  const sendBtn   = document.getElementById('send-btn');

  sendBtn.addEventListener('click', () => {
    sendInterject(chatInput.value.trim());
    chatInput.value = '';
  });

  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendInterject(chatInput.value.trim());
      chatInput.value = '';
    }
  });

  // Prevent WASD from going into chat input while game is running and input not focused
  // (input only captures keys when explicitly focused — no extra code needed)
}

document.addEventListener('DOMContentLoaded', init);
