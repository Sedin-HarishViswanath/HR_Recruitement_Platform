import { db } from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';
import { generateJSON } from '../../shared/utils/llm';

export interface AIDebrief {
  overall_score: number;
  summary: string;
  hire_recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
  key_strengths: string[];
  areas_to_improve: string[];
  communication_rating: number;
  technical_rating: number;
  culture_fit_rating: number;
  suggested_next_steps: string;
  generated_at: string;
}

export class AIDebriefService {
  async generateDebrief(interviewId: string): Promise<AIDebrief> {
    const interview = await db('interviews')
      .select(
        'interviews.*',
        'candidates.name as candidate_name',
        'jobs.title as job_title',
        'companies.name as company_name',
        'users.name as interviewer_name',
      )
      .join('applications', 'interviews.application_id', 'applications.id')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .join('companies', 'jobs.company_id', 'companies.id')
      .leftJoin('users', 'interviews.interviewer_id', 'users.id')
      .where('interviews.id', interviewId)
      .first();

    if (!interview) throw new AppError('Interview not found', 404);

    const feedback = await db('feedbacks').where({ interview_id: interviewId }).first();

    const transcripts = await db('interview_transcripts')
      .where({ interview_id: interviewId })
      .orderBy('created_at', 'asc')
      .limit(50);

    if (!feedback && transcripts.length === 0 && interview.round_type !== 'aptitude') {
      throw new AppError('No feedback or transcript available to generate a debrief', 400);
    }

    const transcriptText = transcripts.length > 0
      ? transcripts.map((t: any) => `${t.speaker}: ${t.text}`).join('\n')
      : 'No transcript available.';

    const feedbackText = feedback
      ? `Rating: ${feedback.rating}/5\nRecommendation: ${feedback.recommendation}\nStrengths: ${feedback.strengths}\nAreas for improvement: ${feedback.weaknesses}\nAdditional: ${feedback.additional_comments || 'None'}`
      : interview.round_type === 'aptitude'
        ? `Aptitude Score: ${interview.aptitude_score ?? 'N/A'}/20`
        : 'No human feedback submitted yet.';

    const prompt = `You are an expert technical recruiter generating a structured interview debrief report.

INTERVIEW CONTEXT:
- Candidate: ${interview.candidate_name}
- Position: ${interview.job_title} at ${interview.company_name}
- Round Type: ${interview.round_type}
- Interviewer: ${interview.interviewer_name || 'Unknown'}
- Status: ${interview.status}
${interview.aptitude_score != null ? `- Aptitude Score: ${interview.aptitude_score}/20` : ''}

HUMAN FEEDBACK:
${feedbackText}

INTERVIEW TRANSCRIPT (last 50 exchanges):
${transcriptText.slice(0, 3000)}

Generate a structured JSON debrief. Respond ONLY with this exact JSON format:
{
  "overall_score": <integer 0-100>,
  "summary": "<2-3 sentence professional summary of the candidate's performance>",
  "hire_recommendation": "<one of: strong_hire | hire | no_hire | strong_no_hire>",
  "key_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "areas_to_improve": ["<area 1>", "<area 2>"],
  "communication_rating": <integer 1-5>,
  "technical_rating": <integer 1-5>,
  "culture_fit_rating": <integer 1-5>,
  "suggested_next_steps": "<one actionable sentence for the hiring team>"
}

Base your assessment on the feedback and transcript. Be balanced and constructive.`;

    if (!env.GEMINI_API_KEY && !env.GROQ_API_KEY) {
      throw new AppError('AI debrief requires a Gemini or Groq API key to be configured', 503);
    }

    try {
      // Gemini primary with automatic Groq fallback.
      const parsed = await generateJSON<AIDebrief>({ prompt, temperature: 0.3, maxTokens: 512 });
      parsed.generated_at = new Date().toISOString();

      // Clamp values
      parsed.overall_score = Math.min(100, Math.max(0, Number(parsed.overall_score) || 50));
      parsed.communication_rating = Math.min(5, Math.max(1, Number(parsed.communication_rating) || 3));
      parsed.technical_rating = Math.min(5, Math.max(1, Number(parsed.technical_rating) || 3));
      parsed.culture_fit_rating = Math.min(5, Math.max(1, Number(parsed.culture_fit_rating) || 3));

      logger.info(`AI debrief generated for interview ${interviewId}`, { module: 'AIDebrief' });
      return parsed;
    } catch (err: any) {
      logger.error('Failed to generate AI debrief', { module: 'AIDebrief', err: err?.message });
      throw new AppError('Failed to generate AI debrief. Please try again.', 502);
    }
  }
}

export const aiDebriefService = new AIDebriefService();
