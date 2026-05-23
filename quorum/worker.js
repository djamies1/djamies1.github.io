/**
 * Quorum — Cloudflare Worker proxy
 *
 * Forwards debate requests to Groq's API so visitors don't need their own key.
 * Deploy:
 *   1. wrangler secret put GROQ_API_KEY   (paste your key, Enter)
 *   2. wrangler deploy
 *   3. Copy the *.workers.dev URL into PROXY_URL in quorum/app.js
 */

const ALLOWED_ORIGINS = new Set([
  'https://djamies1.github.io',
  'http://localhost:8765',
  'http://127.0.0.1:8765',
]);

const ALLOWED_MODELS = new Set([
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
]);

function cors(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : 'null';
  return {
    'Access-Control-Allow-Origin':  allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age':       '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? '';
    const headers = cors(origin);

    // Pre-flight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers });
    }

    // Strict origin check (belt-and-suspenders beyond CORS)
    if (!ALLOWED_ORIGINS.has(origin)) {
      return new Response('Forbidden', { status: 403, headers });
    }

    // Parse + validate body
    let body;
    try { body = await request.json(); }
    catch { return new Response('Bad request', { status: 400, headers }); }

    const { messages, model: reqModel, max_tokens: reqTokens } = body;

    if (!Array.isArray(messages) || messages.length < 1 || messages.length > 24) {
      return new Response('Invalid messages', { status: 400, headers });
    }
    for (const m of messages) {
      if (!m.role || typeof m.content !== 'string' || m.content.length > 6000) {
        return new Response('Invalid message', { status: 400, headers });
      }
    }

    const model     = ALLOWED_MODELS.has(reqModel) ? reqModel : 'llama-3.3-70b-versatile';
    const maxTokens = Math.min(Number(reqTokens) || 70, 70); // hard cap

    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.95 }),
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  },
};
