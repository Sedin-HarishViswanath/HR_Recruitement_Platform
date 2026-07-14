import { db } from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';
import { generateText } from '../../shared/utils/llm';
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

    // Code awareness is data-driven, not round_type-driven: 'technical' rounds
    // in this app are always the automated solo assessment (AUTOMATED_ROUND_TYPES
    // includes 'technical') and never reach this live-copilot code path, while the
    // live layout's CodeEditor is mounted unconditionally for every live round
    // (hr/final). So "code aware" simply means "the candidate has typed code."
    const codeState = getInterviewCode(interviewId);
    const codeAware = !!codeState && codeState.code.trim().length > 0;

    const fallback = (): CopilotResponse => ({
      questions: getFallbackQuestions(interview.round_type || 'hr'),
      claim_flags: [],
      scorecard_suggestion: { rating: null, recommendation: null, strengths: '', weaknesses: '' },
      meta: { transcript_entries_used: transcripts.length, code_aware: codeAware, method: 'fallback' },
    });

    if (!env.GEMINI_API_KEY && !env.GROQ_API_KEY) return fallback();

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

    const prompt = `You are a live interview copilot assisting an interviewer in real time. Your job is to help them dig deeper and stay objective, using ONLY what has actually been said (and any code written) so far.

CANDIDATE: ${context?.candidate_name || 'Unknown'}
ROLE: ${context?.job_title || 'Unknown'}
ROUND TYPE: ${interview.round_type}
REQUIRED SKILLS: ${(context?.required_skills || []).join(', ') || 'Not specified'}

TRANSCRIPT SO FAR (last ${transcripts.length} exchanges):
${transcriptText.slice(0, 3000)}
${codeSection}
Produce:
- questions: 2-3 sharp follow-ups that build on what the candidate JUST said — push for depth, a concrete example, a trade-off, or an edge case. If code is present, include a question about their actual code (a bug, its complexity, or how it handles an edge case). Never generic or yes/no. If the transcript is too short to judge, give 2 strong role-relevant opening questions tied to the required skills.
- claim_flags: 0-3 statements the candidate made that are vague, unverifiable, or possibly overstated; for each, give a specific way to verify it. Only flag real claims — do not invent.
- scorecard_suggestion: a calibrated draft grounded in transcript evidence. If there is not yet enough signal, use null for rating and recommendation and keep strengths/weaknesses brief or empty.

Reply ONLY with JSON, no prose:
{"questions": ["<follow-up question>"], "claim_flags": [{"claim": "<what they said>", "concern": "<what to verify and how>"}], "scorecard_suggestion": {"rating": <1-5 or null>, "recommendation": "<strong_hire|hire|no_hire|strong_no_hire or null>", "strengths": "<short evidence-based draft>", "weaknesses": "<short evidence-based draft>"}}`;

    try {
      const text = await generateText({ prompt, temperature: 0.3, maxTokens: 512, json: true });
      const parsed = parseCopilotResponse(text);
      if (!parsed) return fallback();

      return {
        ...parsed,
        meta: { transcript_entries_used: transcripts.length, code_aware: codeAware, method: 'ai' },
      };
    } catch (err: any) {
      logger.warn('Interview copilot AI call failed, using fallback', {
        module: 'COPILOT',
        message: err?.message,
      });
      return fallback();
    }
  }
}

export const interviewCopilotService = new InterviewCopilotService();
