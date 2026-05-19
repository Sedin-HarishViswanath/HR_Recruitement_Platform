import axios from 'axios';
import { env } from '../../config/env';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class AtsScreeningService {
  /**
   * Screen a resume against a job posting.
   * Uses Gemini for semantic scoring when the API key is set,
   * falls back to keyword matching otherwise.
   *
   * @param candidateSkills  Array of skill strings from the candidate profile
   * @param jobData          Job object with title, description, required_skills
   * @param resumeText       Optional extracted resume text for deeper Gemini analysis
   * @returns { ai_score: number, matched_skills: string[] }
   */
  async screenResume(
    candidateSkills: string[],
    jobData: any,
    resumeText?: string,
  ): Promise<{ ai_score: number; matched_skills: string[] }> {
    // Always compute keyword score as the baseline / fallback
    const keywordResult = this.computeKeywordScore(candidateSkills, jobData);

    // Try Gemini-powered scoring if key is available
    if (env.GEMINI_API_KEY) {
      try {
        const geminiScore = await this.computeGeminiScore(
          candidateSkills,
          jobData,
          resumeText,
        );
        if (geminiScore !== null) {
          // Blend Gemini (70%) + keyword (30%) for a robust score
          const blended = Math.round(geminiScore * 0.7 + keywordResult.ai_score * 0.3);
          return {
            ai_score: Math.min(100, Math.max(0, blended)),
            matched_skills: keywordResult.matched_skills,
          };
        }
      } catch (err) {
        console.warn('[ATS] Gemini scoring failed, falling back to keyword match:', err);
      }
    }

    return keywordResult;
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
          console.log(`[ATS] Gemini score: ${score} — ${parsed.reason || ''}`);
          return score;
        }

        return null;
      } catch (err: any) {
        if (err?.response?.status === 429 && attempt <= maxRetries) {
          console.warn(`[ATS] Gemini rate limit — retrying in ${attempt * 2}s...`);
          await sleep(attempt * 2000);
          continue;
        }
        // Non-retryable or max retries exhausted
        console.warn('[ATS] Gemini scoring error:', err?.response?.status || err?.message);
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
