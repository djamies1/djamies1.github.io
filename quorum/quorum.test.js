// @ts-check
const { test, expect } = require('@playwright/test');

const URL = 'http://localhost:8765/quorum/';
const FAKE_KEY = 'AIzaFakeKeyForPlaywrightTesting12345';
const MOCK_RESPONSE = {
  candidates: [{ content: { parts: [{ text: 'The assumption here is fundamentally flawed and worth examining.' }] } }]
};

async function withMockedAPI(page) {
  await page.route('**generativelanguage.googleapis.com**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_RESPONSE) })
  );
}

async function setApiKey(page) {
  await page.evaluate(key => localStorage.setItem('quorum_api_key', key), FAKE_KEY);
  await page.evaluate(() => localStorage.setItem('quorum_model', 'gemini-2.0-flash'));
}

// ── 1. LOAD & SETUP SCREEN ─────────────────────────────────────

test('loads without JS errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto(URL);
  await page.waitForTimeout(800);
  expect(errors).toHaveLength(0);
});

test('setup screen renders correctly', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('.logo')).toContainText('QUORUM');
  await expect(page.locator('#start-btn')).toBeVisible();
  await expect(page.locator('#topic-input')).toBeVisible();
  await expect(page.locator('.persona-card')).toHaveCount(8);
});

test('4 personas pre-selected by default', async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator('.persona-card.selected')).toHaveCount(4);
});

test('persona toggle: click selects and deselects', async ({ page }) => {
  await page.goto(URL);
  // Grab data-id of first selected card before clicking
  const cardId = await page.locator('.persona-card.selected').first().getAttribute('data-id');
  await page.locator(`.persona-card[data-id="${cardId}"]`).click();
  await expect(page.locator('.persona-card.selected')).toHaveCount(3);
  // Re-select by id
  await page.locator(`.persona-card[data-id="${cardId}"]`).click();
  await expect(page.locator('.persona-card.selected')).toHaveCount(4);
});

test('blocks start with no topic', async ({ page }) => {
  await page.goto(URL);
  await setApiKey(page);
  await page.reload();
  await page.click('#start-btn');
  await expect(page.locator('#setup-error')).toBeVisible();
  await expect(page.locator('#setup-error')).toContainText('TOPIC');
});

test('opens settings when no API key', async ({ page }) => {
  await page.goto(URL);
  // Ensure no key
  await page.evaluate(() => localStorage.removeItem('quorum_api_key'));
  await page.reload();
  await page.fill('#topic-input', 'Test topic');
  await page.click('#start-btn');
  await expect(page.locator('#settings-modal')).toBeVisible();
});

test('settings: save and close', async ({ page }) => {
  await page.goto(URL);
  await page.click('#settings-btn');
  await expect(page.locator('#settings-modal')).toBeVisible();
  await page.fill('#api-key-input', FAKE_KEY);
  await page.click('#save-settings-btn');
  await expect(page.locator('#settings-modal')).toBeHidden();
  const saved = await page.evaluate(() => localStorage.getItem('quorum_api_key'));
  expect(saved).toBe(FAKE_KEY);
});

// ── 2. GAME WORLD ──────────────────────────────────────────────

test('game canvas appears after starting', async ({ page }) => {
  await withMockedAPI(page);
  await page.goto(URL);
  await setApiKey(page);
  await page.reload();

  await page.fill('#topic-input', 'Should I quit my job to start a company?');
  await page.click('#start-btn');

  await expect(page.locator('#game-view')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('#game-canvas')).toBeVisible();

  const box = await page.locator('#game-canvas').boundingBox();
  expect(box.width).toBeGreaterThan(200);
  expect(box.height).toBeGreaterThan(100);
});

test('canvas renders non-blank pixels (game world visible)', async ({ page }) => {
  await withMockedAPI(page);
  await page.goto(URL);
  await setApiKey(page);
  await page.reload();

  await page.fill('#topic-input', 'Is remote work better?');
  await page.click('#start-btn');
  await page.waitForTimeout(500); // let first frame render

  // Sample some pixels from the canvas — should not all be black/transparent
  const hasColor = await page.evaluate(() => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(200, 100, 200, 100).data;
    let nonBlack = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 20 || data[i+1] > 20 || data[i+2] > 20) nonBlack++;
    }
    return nonBlack > 100; // at least 100 non-dark pixels in sample
  });
  expect(hasColor).toBe(true);
});

test('speech bubble appears after API call (mocked)', async ({ page }) => {
  await withMockedAPI(page);
  await page.goto(URL);
  await setApiKey(page);
  await page.reload();

  await page.fill('#topic-input', 'Should AI be regulated?');
  await page.click('#start-btn');

  // Wait for debate to start and first bubble to appear
  // With mocked API, this should be fast — check for bright pixels near campfire area
  // Campfire is at ~400,230 in a 800x472 canvas, scaled to fit screen
  await page.waitForTimeout(2500);

  const bubblePixels = await page.evaluate(() => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scale = canvas.offsetWidth / 800;
    // Sample area above campfire where bubbles appear
    const sx = Math.floor(200 * scale);
    const sy = Math.floor(30 * scale);
    const sw = Math.floor(400 * scale);
    const sh = Math.floor(100 * scale);
    if (sw < 1 || sh < 1) return false;
    const data = ctx.getImageData(sx, sy, sw, sh).data;
    let brightPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      // Look for near-white pixels (speech bubble text/background)
      if (data[i] > 180 && data[i+1] > 180 && data[i+2] > 200) brightPixels++;
    }
    return brightPixels > 20;
  });
  expect(bubblePixels).toBe(true);
});

// ── 3. PLAYER MOVEMENT ─────────────────────────────────────────

test('player moves without errors from keyboard input', async ({ page }) => {
  await withMockedAPI(page);
  await page.goto(URL);
  await setApiKey(page);
  await page.reload();

  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.fill('#topic-input', 'Test');
  await page.click('#start-btn');
  await page.waitForTimeout(300);

  // Click canvas to ensure focus context is on the page (not chat input)
  await page.locator('#canvas-wrap').click();

  // Get initial player position from canvas state
  const pos1 = await page.evaluate(() => {
    // player is accessible via the global `player` if exposed — otherwise just check no error
    return typeof player !== 'undefined' ? { x: player.x, y: player.y } : null;
  });

  // Hold keys for multiple frames so the game loop actually processes them
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(150);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(50);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(150);
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(100);

  expect(errors).toHaveLength(0);

  if (pos1) {
    // Player should have moved
    const pos2 = await page.evaluate(() => ({ x: player.x, y: player.y }));
    // Some movement expected
    const moved = Math.abs(pos2.x - pos1.x) > 0 || Math.abs(pos2.y - pos1.y) > 0;
    expect(moved).toBe(true);
  }
});

test('typing in chat does not move player (keys not stolen)', async ({ page }) => {
  await withMockedAPI(page);
  await page.goto(URL);
  await setApiKey(page);
  await page.reload();

  await page.fill('#topic-input', 'Test topic');
  await page.click('#start-btn');
  await page.waitForTimeout(300);

  // Focus chat input
  await page.click('#chat-input');

  const before = await page.evaluate(() =>
    typeof player !== 'undefined' ? { x: player.x, y: player.y } : null
  );

  // Type WASD into the chat input
  await page.keyboard.type('wasd');
  await page.waitForTimeout(200);

  const after = await page.evaluate(() =>
    typeof player !== 'undefined' ? { x: player.x, y: player.y } : null
  );

  if (before && after) {
    expect(after.x).toBe(before.x);
    expect(after.y).toBe(before.y);
  }

  // Chat input should have the typed text
  const inputVal = await page.inputValue('#chat-input');
  expect(inputVal).toBe('wasd');
});

// ── 4. INTERJECT ───────────────────────────────────────────────

test('interject adds to history and shows player bubble', async ({ page }) => {
  await withMockedAPI(page);
  await page.goto(URL);
  await setApiKey(page);
  await page.reload();

  await page.fill('#topic-input', 'Test');
  await page.click('#start-btn');
  await page.waitForTimeout(300);

  await page.fill('#chat-input', 'But what about the cost?');
  await page.click('#send-btn');

  // History should have the user message
  const historyLen = await page.evaluate(() =>
    state.history.filter(h => h.isUser).length
  );
  expect(historyLen).toBe(1);

  // Chat input should be cleared
  await expect(page.locator('#chat-input')).toHaveValue('');
});
