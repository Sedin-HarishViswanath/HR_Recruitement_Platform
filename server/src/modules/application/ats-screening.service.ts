import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../shared/utils/logger';
import { tfidfMatcherService } from './tfidf-matcher.service';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface DetailedScreening {
  score: number;
  method: 'gemini' | 'tfidf' | 'keyword';
  reason: string;
  matched_skills: string[];
  gaps: string[];
}

/**
 * Pure parser for the detailed Gemini screening JSON.
 * Tolerates ```json fences and surrounding prose; clamps score; coerces arrays.
 * Returns null when there is no parseable object or the score is not numeric.
 */
export function parseGeminiScreening(
  text: string,
): { score: number; reason: string; matched_skills: string[]; gaps: string[] } | null {
  const cleaned = (text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
  const score = Number(parsed.score);
  if (isNaN(score)) return null;
  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    reason: typeof parsed.reason === 'string' ? parsed.reason : '',
    matched_skills: Array.isArray(parsed.matched_skills) ? parsed.matched_skills.map(String) : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String) : [],
  };
}

export class AtsScreeningService {
  /**
   * Screen a resume against a job posting.
   *
   * Scoring cascade (default — USE_CUSTOM_ML=false):
   *   1. Gemini (semantic AI)     → primary
   *   2. TF-IDF (custom ML)      → fallback
   *   3. Keyword matching         → final fallback
   *
   * When USE_CUSTOM_ML=true, the order flips:
   *   1. TF-IDF (custom ML)      → primary
   *   2. Gemini (semantic AI)     → fallback
   *   3. Keyword matching         → final fallback
   *
   * @param candidateSkills  Array of skill strings from the candidate profile
   * @param jobData          Job object with title, description, required_skills
   * @param resumeText       Optional extracted resume text for deeper analysis
   * @returns { ai_score, matched_skills, scoring_method }
   */
  async screenResume(
    candidateSkills: string[],
    jobData: any,
    resumeText?: string,
  ): Promise<{ ai_score: number; matched_skills: string[]; scoring_method?: string }> {
    // Always compute keyword score as the last-resort fallback
    const keywordResult = this.computeKeywordScore(candidateSkills, jobData);

    if (env.USE_CUSTOM_ML) {
      // ── Custom ML is PRIMARY ──
      return this.cascadeTfIdfFirst(candidateSkills, jobData, resumeText, keywordResult);
    } else {
      // ── Gemini is PRIMARY (existing behavior) ──
      return this.cascadeGeminiFirst(candidateSkills, jobData, resumeText, keywordResult);
    }
  }

  /**
   * Detailed screening for the autonomous agent: returns score + reasoning + gaps.
   * Cascade: Gemini (rich) → TF-IDF → keyword. Never throws.
   */
  async screenResumeDetailed(
    candidateSkills: string[],
    jobData: any,
    resumeText?: string,
  ): Promise<DetailedScreening> {
    const keyword = this.computeKeywordScore(candidateSkills, jobData);

    if (env.GEMINI_API_KEY) {
      try {
        const g = await this.computeGeminiDetailed(candidateSkills, jobData, resumeText);
        if (g) {
          const blended = Math.round(g.score * 0.7 + keyword.ai_score * 0.3);
          return {
            score: Math.min(100, Math.max(0, blended)),
            method: 'gemini',
            reason: g.reason || 'AI-assessed fit.',
            matched_skills: g.matched_skills.length ? g.matched_skills : keyword.matched_skills,
            gaps: g.gaps,
          };
        }
      } catch (err) {
        logger.warn('Gemini detailed screening failed, falling back', { module: 'ATS', err });
      }
    }

    try {
      const t = tfidfMatcherService.computeTfIdfScore(candidateSkills, jobData, resumeText);
      if (t.ai_score > 0) {
        const required: string[] = jobData.required_skills || [];
        const gaps = required.filter((s) => !t.matched_skills.includes(s));
        return {
          score: t.ai_score,
          method: 'tfidf',
          reason: `Statistical match on ${t.matched_skills.length}/${required.length || '—'} required skills.`,
          matched_skills: t.matched_skills,
          gaps,
        };
      }
    } catch (err) {
      logger.warn('TF-IDF detailed screening failed, falling back to keyword', { module: 'ATS', err });
    }

    const required: string[] = jobData.required_skills || [];
    const gaps = required.filter((s) => !keyword.matched_skills.includes(s));
    return {
      score: keyword.ai_score,
      method: 'keyword',
      reason: `Keyword match on ${keyword.matched_skills.length}/${required.length || '—'} required skills.`,
      matched_skills: keyword.matched_skills,
      gaps,
    };
  }

  private async computeGeminiDetailed(
    candidateSkills: string[],
    jobData: any,
    resumeText?: string,
  ): Promise<{ score: number; reason: string; matched_skills: string[]; gaps: string[] } | null> {
    const requiredSkills: string[] = jobData.required_skills || [];
    const jobDescription: string = (jobData.description || '').slice(0, 2000);
    const skillsList = candidateSkills.slice(0, 30).join(', ') || 'Not specified';
    const resumeSnippet = resumeText ? resumeText.slice(0, 1500) : `Skills: ${skillsList}`;

    const prompt = `You are an expert ATS. Assess the candidate's fit for the job and reply ONLY with JSON.

JOB TITLE: ${jobData.title || ''}
REQUIRED SKILLS: ${requiredSkills.join(', ') || 'Not specified'}
JOB DESCRIPTION (excerpt): ${jobDescription}

CANDIDATE PROFILE:
${resumeSnippet}

Reply ONLY with valid JSON, no prose:
{"score": <integer 0-100>, "reason": "<one concise sentence>", "matched_skills": ["<skill>"], "gaps": ["<missing required skill or concern>"]}`;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`,
          {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 256 },
          },
          { params: { key: env.GEMINI_API_KEY }, timeout: 15000 },
        );
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return parseGeminiScreening(text);
      } catch (err: any) {
        if (err?.response?.status === 429 && attempt < 3) {
          await sleep(attempt * 2000);
          continue;
        }
        logger.warn('Gemini detailed error', { module: 'ATS', status: err?.response?.status });
        return null;
      }
    }
    return null;
  }

  /**
   * Default cascade: Gemini → TF-IDF → Keyword
   */
  private async cascadeGeminiFirst(
    candidateSkills: string[],
    jobData: any,
    resumeText: string | undefined,
    keywordResult: { ai_score: number; matched_skills: string[] },
  ): Promise<{ ai_score: number; matched_skills: string[]; scoring_method: string }> {
    // 1. Try Gemini
    if (env.GEMINI_API_KEY) {
      try {
        const geminiScore = await this.computeGeminiScore(candidateSkills, jobData, resumeText);
        if (geminiScore !== null) {
          const blended = Math.round(geminiScore * 0.7 + keywordResult.ai_score * 0.3);
          return {
            ai_score: Math.min(100, Math.max(0, blended)),
            matched_skills: keywordResult.matched_skills,
            scoring_method: 'gemini',
          };
        }
      } catch (err) {
        logger.warn('Gemini scoring failed, falling back to TF-IDF', { module: 'ATS', err });
      }
    }

    // 2. Fallback: TF-IDF
    try {
      const tfidfResult = tfidfMatcherService.computeTfIdfScore(candidateSkills, jobData, resumeText);
      if (tfidfResult.ai_score > 0) {
        logger.info('Using TF-IDF fallback for ATS scoring', { module: 'ATS' });
        return {
          ai_score: tfidfResult.ai_score,
          matched_skills: tfidfResult.matched_skills,
          scoring_method: 'tfidf',
        };
      }
    } catch (err) {
      logger.warn('TF-IDF scoring failed, falling back to keyword match', { module: 'ATS', err });
    }

    // 3. Final fallback: Keyword
    return { ...keywordResult, scoring_method: 'keyword' };
  }

  /**
   * Custom ML cascade: TF-IDF → Gemini → Keyword
   * Activated when USE_CUSTOM_ML=true
   */
  private async cascadeTfIdfFirst(
    candidateSkills: string[],
    jobData: any,
    resumeText: string | undefined,
    keywordResult: { ai_score: number; matched_skills: string[] },
  ): Promise<{ ai_score: number; matched_skills: string[]; scoring_method: string }> {
    // 1. Try TF-IDF (primary)
    try {
      const tfidfResult = tfidfMatcherService.computeTfIdfScore(candidateSkills, jobData, resumeText);
      if (tfidfResult.ai_score > 0) {
        logger.info('Using TF-IDF as primary scorer', { module: 'ATS' });
        return {
          ai_score: tfidfResult.ai_score,
          matched_skills: tfidfResult.matched_skills,
          scoring_method: 'tfidf',
        };
      }
    } catch (err) {
      logger.warn('TF-IDF primary scoring failed, falling back to Gemini', { module: 'ATS', err });
    }

    // 2. Fallback: Gemini
    if (env.GEMINI_API_KEY) {
      try {
        const geminiScore = await this.computeGeminiScore(candidateSkills, jobData, resumeText);
        if (geminiScore !== null) {
          const blended = Math.round(geminiScore * 0.7 + keywordResult.ai_score * 0.3);
          return {
            ai_score: Math.min(100, Math.max(0, blended)),
            matched_skills: keywordResult.matched_skills,
            scoring_method: 'gemini',
          };
        }
      } catch (err) {
        logger.warn('Gemini fallback scoring failed', { module: 'ATS', err });
      }
    }

    // 3. Final fallback: Keyword
    return { ...keywordResult, scoring_method: 'keyword' };
  }

  /**
   * Gemini-based semantic scoring.
   * Prompts the model to return a score 0–100 as a JSON object.
   */
  private async computeGeminiScore(
    candidateSkills: string[],
    jobData: any,
    resumeText?: string,
    maxRetries = 2,
  ): Promise<number | null> {
    const requiredSkills: string[] = jobData.required_skills || [];
    const jobDescription: string = (jobData.description || '').slice(0, 2000); // trim to avoid token bloat
    const jobTitle: string = jobData.title || '';

    const skillsList = candidateSkills.slice(0, 30).join(', ') || 'Not specified';
    const resumeSnippet = resumeText
      ? resumeText.slice(0, 1500)
      : `Skills: ${skillsList}`;

    const prompt = `You are an expert ATS (Applicant Tracking System). Score the candidate's fit for the job.

JOB TITLE: ${jobTitle}
REQUIRED SKILLS: ${requiredSkills.join(', ') || 'Not specified'}
JOB DESCRIPTION (excerpt): ${jobDescription}

CANDIDATE PROFILE:
${resumeSnippet}

Respond ONLY with valid JSON in this exact format:
{"score": <integer 0-100>, "reason": "<one sentence>"}

Score rubric:
- 85-100: Excellent match — most required skills present, strong experience alignment
- 65-84: Good match — several required skills, relevant experience
- 45-64: Partial match — some skills overlap, may need training
- 20-44: Weak match — few relevant skills
- 0-19: Poor match — little to no relevant skills`;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`,
          {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 128 },
          },
          {
            params: { key: env.GEMINI_API_KEY },
            timeout: 15000,
          }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        // Parse the JSON score from the response
        const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start === -1 || end === -1) return null;

        const parsed = JSON.parse(cleaned.slice(start, end + 1));
        const score = Number(parsed.score);

        if (!isNaN(score) && score >= 0 && score <= 100) {
          logger.debug(`Gemini score: ${score} — ${parsed.reason || ''}`, { module: 'ATS' });
          return score;
        }

        return null;
      } catch (err: any) {
        if (err?.response?.status === 429 && attempt <= maxRetries) {
          logger.warn(`Gemini rate limit — retrying in ${attempt * 2}s`, { module: 'ATS' });
          await sleep(attempt * 2000);
          continue;
        }
        // Non-retryable or max retries exhausted
        logger.warn('Gemini scoring error', { module: 'ATS', status: err?.response?.status, message: err?.message });
        return null;
      }
    }

    return null;
  }

  /**
   * Classic keyword-based scoring (always available, no API needed).
   * - 60% weight: required skill matching
   * - 30% weight: keyword density in job description
   * - 10% weight: job title relevance
   */
  private computeKeywordScore(
    candidateSkills: string[],
    jobData: any,
  ): { ai_score: number; matched_skills: string[] } {
    const requiredSkills: string[] = jobData.required_skills || [];
    const jobDescription = (jobData.description || '').toLowerCase();
    const jobTitle = (jobData.title || '').toLowerCase();
    const skillsLower = candidateSkills.map(s => s.toLowerCase());

    if (requiredSkills.length === 0 && !jobDescription) {
      return { ai_score: 50, matched_skills: [] };
    }

    // 1. Required skill matching (60% weight)
    const matchedSkills: string[] = [];
    requiredSkills.forEach((skill: string) => {
      const skillLower = skill.toLowerCase();
      if (skillsLower.some(s => s === skillLower || s.includes(skillLower) || skillLower.includes(s))) {
        matchedSkills.push(skill);
      }
    });

    const skillScore = requiredSkills.length > 0
      ? (matchedSkills.length / requiredSkills.length) * 60
      : 30;

    // 2. Keyword density in description (30% weight)
    let keywordMatches = 0;
    skillsLower.forEach(skill => {
      if (jobDescription.includes(skill)) keywordMatches++;
    });

    const keywordScore = candidateSkills.length > 0
      ? Math.min((keywordMatches / Math.max(candidateSkills.length, 5)) * 30, 30)
      : 0;

    // 3. Title relevance bonus (10% weight)
    let titleBonus = 0;
    skillsLower.forEach(skill => {
      if (jobTitle.includes(skill)) titleBonus += 2;
    });
    titleBonus = Math.min(titleBonus, 10);

    const totalScore = Math.min(Math.round(skillScore + keywordScore + titleBonus), 100);

    return { ai_score: totalScore, matched_skills: matchedSkills };
  }
}

export const atsScreeningService = new AtsScreeningService();
