import axios from 'axios';
import { env } from '../../config/env';
import { logger } from './logger';

/**
 * Shared LLM helper with a Gemini -> Groq fallback chain.
 *
 * Gemini is the primary provider, but its free tier is easily exhausted
 * (429 RESOURCE_EXHAUSTED). Whenever Gemini is unavailable, we transparently
 * fall back to Groq's OpenAI-compatible endpoint so text/JSON generation keeps
 * working. Every call site that previously hit Gemini directly should route
 * through here so the fallback behaviour is consistent across the app.
 */

export interface GenerateTextOptions {
  /** The main user prompt. */
  prompt: string;
  /** Optional system instruction / persona. */
  system?: string;
  temperature?: number;
  maxTokens?: number;
  /** Ask the provider to return strict JSON (uses Groq JSON mode on fallback). */
  json?: boolean;
  /** Number of quick retries against Gemini on a transient 429 before falling back. */
  geminiRetries?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate text using Gemini, falling back to Groq on failure.
 * Throws only when BOTH providers fail (or neither is configured).
 */
export async function generateText(options: GenerateTextOptions): Promise<string> {
  const {
    prompt,
    system,
    temperature = 0.6,
    maxTokens = 1024,
    json = false,
    geminiRetries = 1,
  } = options;

  // --- Primary: Gemini ---
  if (env.GEMINI_API_KEY) {
    for (let attempt = 0; attempt <= geminiRetries; attempt++) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`,
          {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
              ...(json ? { responseMimeType: 'application/json' } : {}),
            },
          },
          { params: { key: env.GEMINI_API_KEY }, timeout: 30000 }
        );

        const text: string = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text.trim()) return text;
        throw new Error('Empty response from Gemini');
      } catch (error: any) {
        const status = error?.response?.status;
        // Retry once on a transient rate limit, then give up on Gemini.
        if (status === 429 && attempt < geminiRetries) {
          await sleep(1000 * (attempt + 1));
          continue;
        }
        logger.warn('Gemini unavailable, falling back to Groq', {
          module: 'LLM',
          status,
          message: error?.message,
        });
        break;
      }
    }
  }

  // --- Fallback: Groq ---
  if (env.GROQ_API_KEY) {
    try {
      const messages: { role: 'system' | 'user'; content: string }[] = [];
      if (system) messages.push({ role: 'system', content: system });
      messages.push({ role: 'user', content: prompt });

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: env.GROQ_MODEL,
          messages,
          temperature,
          max_tokens: maxTokens,
          ...(json ? { response_format: { type: 'json_object' } } : {}),
        },
        {
          headers: {
            Authorization: `Bearer ${env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const text: string = response.data?.choices?.[0]?.message?.content || '';
      if (text.trim()) {
        logger.info('Groq fallback succeeded', { module: 'LLM' });
        return text;
      }
      throw new Error('Empty response from Groq');
    } catch (error: any) {
      logger.error('Groq fallback failed', { module: 'LLM', message: error?.message });
    }
  }

  throw new Error('All AI providers are unavailable');
}

/**
 * Generate strict JSON from an LLM and parse it into an object.
 * Tolerates markdown fences and surrounding prose by extracting the first
 * balanced JSON object/array from the response.
 */
export async function generateJSON<T = any>(options: GenerateTextOptions): Promise<T> {
  const raw = await generateText({ ...options, json: true });
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

  // Extract the outermost JSON object (or array) from the text.
  const objStart = cleaned.indexOf('{');
  const arrStart = cleaned.indexOf('[');
  const start =
    arrStart !== -1 && (objStart === -1 || arrStart < objStart) ? arrStart : objStart;
  const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI returned invalid JSON');
  }

  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}
