import axios from 'axios';
import { GEMINI_RESPONSE_SCHEMA, GEMINI_SYSTEM_PROMPT } from '../ai/prompt.js';
import { logger } from '../utils/logger.js';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry(fn, retries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const delay = 800 * (attempt + 1);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

async function callGemini(text, apiKey, model, extraInstruction = '') {
  const payload = {
    systemInstruction: {
      parts: [{ text: GEMINI_SYSTEM_PROMPT }]
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${text}\n\nReturn JSON in this shape:\n${GEMINI_RESPONSE_SCHEMA}\n${extraInstruction}`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.9,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json'
    }
  };

  const response = await withRetry(async () => {
    try {
      const { data } = await axios.post(
        `${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`,
        payload,
        { timeout: 30000 }
      );
      return data;
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      logger.error({ status, data }, 'Gemini request failed');
      throw err;
    }
  });

  return response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

export async function parseOrderWithGemini(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  const tryParse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      const match = value.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      return null;
    }
  };

  let rawText = await callGemini(text, apiKey, model, '');

  if (!rawText) {
    throw new Error('Gemini response empty');
  }

  logger.info({ rawLength: rawText.length, rawText }, 'Gemini response');

  if (rawText.includes('Mavzudan chiqildi')) {
    return 'Mavzudan chiqildi';
  }

  let parsed = tryParse(rawText);
  if (parsed) {
    return parsed;
  }

  rawText = await callGemini(
    text,
    apiKey,
    model,
    'Return ONLY a valid JSON object. Do not include any extra text, markdown, or commentary.'
  );

  if (!rawText) {
    throw new Error('Gemini response empty');
  }

  logger.info({ rawLength: rawText.length, rawText }, 'Gemini response (retry)');

  parsed = tryParse(rawText);
  if (parsed) {
    return parsed;
  }

  // Last-resort: ask Gemini to fix its own JSON
  const fixPrompt = `Fix this JSON and return ONLY valid JSON:\n${rawText}`;
  rawText = await callGemini(fixPrompt, apiKey, model, '');
  if (!rawText) {
    throw new Error('Gemini response empty');
  }
  logger.info({ rawLength: rawText.length, rawText }, 'Gemini response (fix)');
  parsed = tryParse(rawText);
  if (parsed) {
    return parsed;
  }

  throw new Error(`Gemini JSON parse failed: ${rawText.slice(0, 200)}`);
}
