import axios from 'axios';
import { db } from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';
import { interviewRepository } from './interview.repository';
import { getInterviewCode } from '../../socket';
import { parseCopilotResponse, getFallbackQuestions, CopilotResponse } from './interview-copilot.helpers';

export class InterviewCopilotService {
  async generate(interviewId: string, companyId: string): Promise<CopilotResponse> {
    const interview = await interviewRepository.findById(interviewId);
    if (!interview || String(interview.company_id) !== String(companyId)) {
      throw new AppError('Interview not found', 404);
    }

    const transcripts = await db('interview_transcripts')
      .where({ interview_id: interviewId })
      .orderBy('created_at', 'asc')
      .limit(30);

    const codeAware = interview.round_type === 'technical';
    const codeState = codeAware ? getInterviewCode(interviewId) : undefined;

    const fallback = (): CopilotResponse => ({
      questions: getFallbackQuestions(interview.round_type || 'hr'),
      claim_flags: [],
      scorecard_suggestion: { rating: null, recommendation: null, strengths: '', weaknesses: '' },
      meta: { transcript_entries_used: transcripts.length, code_aware: codeAware, method: 'fallback' },
    });

    if (!env.GEMINI_API_KEY) return fallback();

    const context = await db('interviews')
      .select('candidates.name as candidate_name', 'jobs.title as job_title', 'jobs.required_skills')
      .join('applications', 'interviews.application_id', 'applications.id')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('interviews.id', interviewId)
      .first();

    const transcriptText = transcripts.length > 0
      ? transcripts.map((t: any) => `${t.speaker}: ${t.text}`).join('\n')
      : 'No transcript yet.';

    const codeSection = codeAware
      ? `\nCURRENT CODE (${codeState?.language || 'unknown'}):\n${codeState?.code ? codeState.code.slice(0, 2000) : 'No code written yet.'}\n`
      : '';

    const prompt = `You are a live interview copilot helping an interviewer in real time.

CANDIDATE: ${context?.candidate_name || 'Unknown'}
ROLE: ${context?.job_title || 'Unknown'}
ROUND TYPE: ${interview.round_type}
REQUIRED SKILLS: ${(context?.required_skills || []).join(', ') || 'Not specified'}

TRANSCRIPT SO FAR (last ${transcripts.length} exchanges):
${transcriptText.slice(0, 3000)}
${codeSection}
Reply ONLY with JSON, no prose:
{"questions": ["<follow-up question>"], "claim_flags": [{"claim": "<what they said>", "concern": "<what to verify>"}], "scorecard_suggestion": {"rating": <1-5>, "recommendation": "<strong_hire|hire|no_hire|strong_no_hire>", "strengths": "<short draft text>", "weaknesses": "<short draft text>"}}
Return 2-3 questions and 0-3 claim_flags. If the transcript is too short to judge, still return 2 generic but role-relevant opening questions.`;

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`,
        { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 512 } },
        { params: { key: env.GEMINI_API_KEY }, timeout: 20000 },
      );
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = parseCopilotResponse(text);
      if (!parsed) return fallback();

      return {
        ...parsed,
        meta: { transcript_entries_used: transcripts.length, code_aware: codeAware, method: 'gemini' },
      };
    } catch (err: any) {
      logger.warn('Interview copilot Gemini call failed, using fallback', {
        module: 'COPILOT',
        status: err?.response?.status,
      });
      return fallback();
    }
  }
}

export const interviewCopilotService = new InterviewCopilotService();
