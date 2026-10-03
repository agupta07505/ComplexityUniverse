import { query } from './db.js';

const DEFAULT_PROMPT = `You are a precise algorithms analyst inside a tool called ComplexityUniverse.

Analyze the {LANGUAGE} code below and determine its time and space complexity.

MODE: {MODE}
- detailed mode: give the core idea, walk through loops and recursion with their costs, best/average/worst cases if they differ, bottlenecks and concrete optimizations.
- short mode: keep the prose to two or three sentences, but still fill every JSON field.

Rules:
- Report complexity in Big-O notation, worst case unless the cases genuinely differ.
- Treat a sorting call as O(n log n) time. Consider recursion depth in the space cost.
- Count auxiliary structures (maps, sets, new arrays) toward space complexity.
- If the code is ambiguous, state the assumption you made inside "notes".

Respond with ONLY valid JSON, no markdown fences, exactly this shape:
{
  "time_complexity": "O(...)",
  "space_complexity": "O(...)",
  "confidence": 0.0,
  "summary": "one or two sentences a human would say out loud",
  "approach": "what the code is doing and why the cost follows from it",
  "breakdown": [{"label": "outer loop", "detail": "iterates the array once", "cost": "O(n)"}],
  "cases": {"best": "O(...)", "average": "O(...)", "worst": "O(...)"},
  "bottlenecks": ["the most expensive part of the code"],
  "optimizations": ["a concrete way to make it cheaper"],
  "notes": ""
}

CODE:
"""
{CODE}
"""`;

/** Gemini settings from Aiven MySQL app_settings table or process.env (Admin edits these on the AI settings page). */
export async function getAiSettings() {
  const map = {};
  try {
    const rows = await query(
      `SELECT setting_key, setting_value FROM app_settings
        WHERE setting_key IN ('gemini_api_key', 'gemini_model')`
    );
    for (const r of rows) map[r.setting_key] = (r.setting_value || '').trim();
  } catch {
    // If database app_settings is temporarily unreachable, fall back to environment variables
  }

  const apiKey = map.gemini_api_key || (process.env.GEMINI_API_KEY || '').trim();
  const model = map.gemini_model || (process.env.GEMINI_MODEL || '').trim() || 'gemini-3.8-flash';

  return { apiKey, model };
}

/** Active prompt template from MySQL (admin can rewrite it on the Admin page). */
export async function getActivePrompt() {
  const rows = await query(
    `SELECT id, name, prompt_template, version FROM analysis_prompts
      WHERE is_active = 1 ORDER BY version DESC, id DESC LIMIT 1`
  );
  return rows[0] || null;
}

export function buildPrompt(template, { code, language, mode }) {
  return template
    .replaceAll('{CODE}', code)
    .replaceAll('{LANGUAGE}', language || 'unknown')
    .replaceAll('{MODE}', mode === 'short' ? 'short' : 'detailed');
}

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normaliseResult(raw) {
  const arr = (v) => (Array.isArray(v) ? v : []);
  return {
    time_complexity: String(raw.time_complexity || 'O(n)'),
    space_complexity: String(raw.space_complexity || 'O(1)'),
    confidence: Number.isFinite(Number(raw.confidence)) ? Number(raw.confidence) : 0.8,
    summary: String(raw.summary || ''),
    approach: String(raw.approach || ''),
    breakdown: arr(raw.breakdown).map((b) => ({
      label: String(b?.label || 'Step'),
      detail: String(b?.detail || ''),
      cost: String(b?.cost || ''),
    })),
    cases: {
      best: String(raw.cases?.best || raw.time_complexity || 'O(n)'),
      average: String(raw.cases?.average || raw.time_complexity || 'O(n)'),
      worst: String(raw.cases?.worst || raw.time_complexity || 'O(n)'),
    },
    bottlenecks: arr(raw.bottlenecks).map(String),
    optimizations: arr(raw.optimizations).map(String),
    notes: String(raw.notes || ''),
    engine: 'gemini',
  };
}

/** Call the Google Gemini generateContent endpoint. */
async function callGemini(prompt, { apiKey, model }) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}` +
    `:generateContent?key=${encodeURIComponent(apiKey)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      if (res.status === 400 && /API key not valid|API_KEY_INVALID/i.test(detail)) {
        const err = new Error('The Gemini API key is not valid. Please update your Gemini API key in Admin → AI settings.');
        err.status = 400;
        throw err;
      }
      if (res.status === 404 || /models\/.*is not found/i.test(detail)) {
        const err = new Error(`The Gemini model "${model}" is not found or unsupported. Please choose a valid model in Admin → AI settings.`);
        err.status = 404;
        throw err;
      }
      if (res.status === 429) {
        const err = new Error('Gemini API rate limit reached. Please wait a moment and try again.');
        err.status = 429;
        throw err;
      }
      const err = new Error(`Gemini API request failed (${res.status}). Verify your Gemini API key and model in Admin → AI settings.`);
      err.status = 502;
      throw err;
    }

    const data = await res.json();
    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || '')
      .join('');
    const parsed = extractJson(text);
    if (!parsed) {
      const err = new Error('Gemini replied, but the response could not be parsed as JSON. Adjust the prompt in Admin → AI settings.');
      err.status = 502;
      throw err;
    }
    return parsed;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Analyze code exclusively using Google Gemini API with the configured prompt template.
 * There is NO offline fallback or mock analyzer.
 */
export async function analyzeCode({ code, language, mode = 'detailed' }) {
  const settings = await getAiSettings();
  if (!settings.apiKey) {
    const err = new Error(
      'Gemini AI is required for code analysis. Please configure your Google Gemini API key in Admin → AI settings or set GEMINI_API_KEY.'
    );
    err.status = 400;
    err.code = 'GEMINI_KEY_REQUIRED';
    throw err;
  }

  const promptRow = await getActivePrompt().catch(() => null);
  const template = promptRow?.prompt_template || DEFAULT_PROMPT;
  const prompt = buildPrompt(template, { code, language, mode });

  const raw = await callGemini(prompt, settings);
  return {
    ...normaliseResult(raw),
    prompt_version: promptRow?.version ?? null,
    prompt_id: promptRow?.id ?? null,
    model: settings.model,
  };
}

/** Shown to the client so the UI can display which prompt produced a result. */
export function promptMeta(promptRow) {
  return {
    id: promptRow?.id ?? null,
    name: promptRow?.name ?? 'default',
    version: promptRow?.version ?? 0,
  };
}
