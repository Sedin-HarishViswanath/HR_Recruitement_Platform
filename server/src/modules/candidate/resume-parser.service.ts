import axios from 'axios';
import fs from 'fs/promises';
import { env } from '../../config/env';

export interface ParsedResume {
  summary?: string;
  skills?: string[];
  resume_text?: string;
  experience?: any[];
  education?: any[];
  projects?: any[];
  certifications?: any[];
  resume_data?: Record<string, any>;
}

const parseJsonBlock = (text: string): ParsedResume => {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return {};
  return JSON.parse(cleaned.slice(start, end + 1));
};

/**
 * Sleep helper for exponential backoff
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ResumeParserService {
  /**
   * Parse a PDF resume using Gemini Vision API.
   * Retries up to 3 times on 429 (rate limit) with exponential backoff.
   * Returns null gracefully if Gemini key is missing or all retries fail.
   */
  async parsePdf(filePath: string): Promise<ParsedResume | null> {
    if (!env.GEMINI_API_KEY) {
      console.warn('[ResumeParser] GEMINI_API_KEY not set — skipping AI parse');
      return null;
    }

    let file: Buffer;
    try {
      file = await fs.readFile(filePath);
    } catch (err) {
      console.error('[ResumeParser] Failed to read resume file:', err);
      return null;
    }

    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`,
          {
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text:
                      'Parse this resume PDF and return ONLY valid JSON (no markdown, no explanation). Use these exact keys: summary (string), skills (array of strings), resume_text (short extracted text), experience (array of {company, title, duration, description}), education (array), projects (array), certifications (array). Keep skills as individual technologies/tools, max 40 items.',
                  },
                  {
                    inlineData: {
                      mimeType: 'application/pdf',
                      data: file.toString('base64'),
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              // Note: responseMimeType is not supported on all free tier models;
              // we parse JSON from the text response to be safe.
            },
          },
          {
            params: { key: env.GEMINI_API_KEY },
            timeout: 30000,
          }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          console.warn('[ResumeParser] Gemini returned empty response');
          return null;
        }

        let parsed: ParsedResume;
        try {
          parsed = parseJsonBlock(text);
        } catch (parseErr) {
          console.error('[ResumeParser] Failed to parse Gemini JSON:', parseErr);
          return null;
        }

        return {
          summary:
            typeof parsed.summary === 'string'
              ? parsed.summary.slice(0, 1000)
              : undefined,
          skills: Array.isArray(parsed.skills)
            ? parsed.skills
                .map((skill) => String(skill).trim())
                .filter(Boolean)
                .slice(0, 40)
            : undefined,
          resume_text:
            typeof parsed.resume_text === 'string' ? parsed.resume_text : undefined,
          experience: Array.isArray(parsed.experience) ? parsed.experience : undefined,
          education: Array.isArray((parsed as any).education) ? (parsed as any).education : undefined,
          projects: Array.isArray((parsed as any).projects) ? (parsed as any).projects : undefined,
          certifications: Array.isArray((parsed as any).certifications)
            ? (parsed as any).certifications
            : undefined,
          resume_data: parsed,
        };
      } catch (err: any) {
        const status = err?.response?.status;

        if (status === 429) {
          // Rate limited — exponential backoff: 2s, 4s, 8s
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(
            `[ResumeParser] Gemini rate limit hit (429). Attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`
          );
          if (attempt < maxRetries) {
            await sleep(delay);
            continue;
          }
          console.error('[ResumeParser] All retry attempts exhausted due to rate limiting.');
          return null;
        }

        if (status === 400) {
          // Bad request — PDF may be malformed or too large
          console.error('[ResumeParser] Gemini 400 — PDF may be malformed or exceeds size limit');
          return null;
        }

        if (status === 403 || status === 401) {
          console.error('[ResumeParser] Gemini API key invalid or access denied');
          return null;
        }

        // Timeout or network error
        if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
          console.warn(`[ResumeParser] Timeout on attempt ${attempt}/${maxRetries}`);
          if (attempt < maxRetries) {
            await sleep(attempt * 1500);
            continue;
          }
          return null;
        }

        console.error('[ResumeParser] Unexpected error:', err?.message || err);
        return null;
      }
    }

    return null;
  }
}

export const resumeParserService = new ResumeParserService();
