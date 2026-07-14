import { randomUUID } from 'crypto';
import { db } from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';
import { generateText } from '../../shared/utils/llm';
import { notifyCompany } from '../../socket';
import { atsScreeningService } from './ats-screening.service';
import {
  chunk, rankCandidates, isLowConfidence, parseKitJson, ScoredCandidate, InterviewKit,
} from './screening-agent.helpers';

const BATCH_SIZE = 3;
const DEFAULT_LIMIT = 50;
const TOP_N_KITS = 3;
const STREAM_DELAY_MS = 300; // legibility on stage; set 0 to disable

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class ScreeningAgentService {
  async run(params: { jobId: string; companyId: string; userId: string; limit?: number; force?: boolean }) {
    const { jobId, companyId, force } = params;
    const limit = params.limit ?? DEFAULT_LIMIT;

    const job = await db('jobs').where({ id: jobId }).first();
    if (!job || String(job.company_id) !== String(companyId)) {
      throw new AppError('Job not found', 404);
    }

    // Idempotency: absorb double-clicks
    if (job.screening_status === 'running' && !force) {
      const meta = (typeof job.screening_meta === 'string' ? safeParse(job.screening_meta) : job.screening_meta) || {};
      return { run_id: meta.run_id || 'in-flight', status: 'running' as const, total: meta.total || 0 };
    }

    const applications = await db('applications')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .where('applications.job_id', jobId)
      .select(
        'applications.id as application_id',
        'applications.candidate_id',
        'candidates.name',
        'candidates.skills',
        'candidates.resume_text',
      )
      .limit(limit);

    if (applications.length === 0) throw new AppError('This job has no applicants to screen', 400);

    const run_id = randomUUID();
    await db('jobs').where({ id: jobId }).update({
      screening_status: 'running',
      screening_started_at: db.fn.now(),
      screening_completed_at: null,
      screening_meta: JSON.stringify({ run_id, total: applications.length, scored: 0, failed: 0 }),
    });

    // Fire-and-forget; wrapped so it can never crash the process.
    void this.execute(job, applications, companyId, run_id).catch((err) => {
      logger.error('Screening run crashed', { module: 'AGENT', err });
      db('jobs').where({ id: jobId }).update({ screening_status: 'failed' }).catch(() => undefined);
      notifyCompany(companyId, 'screen:failed', { jobId, run_id, message: 'Screening run failed unexpectedly' });
    });

    return { run_id, status: 'running' as const, total: applications.length };
  }

  private async execute(job: any, applications: any[], companyId: string, run_id: string) {
    const jobId = job.id;
    const method_hint = (env.GEMINI_API_KEY || env.GROQ_API_KEY) ? 'ai' : 'heuristic';
    notifyCompany(companyId, 'screen:started', { jobId, run_id, total: applications.length, method_hint });

    const scored: ScoredCandidate[] = [];
    let failed = 0;
    const methodCounts: Record<string, number> = {};

    for (const batch of chunk(applications, BATCH_SIZE)) {
      await Promise.all(
        batch.map(async (app) => {
          const skills: string[] = Array.isArray(app.skills) ? app.skills : [];
          try {
            const d = await atsScreeningService.screenResumeDetailed(skills, job, app.resume_text || undefined);
            const low = isLowConfidence({ resumeText: app.resume_text, skills, method: d.method });
            const card: ScoredCandidate = {
              application_id: String(app.application_id),
              candidate_id: String(app.candidate_id),
              name: app.name || 'Candidate',
              score: d.score, method: d.method, reason: d.reason,
              matched_skills: d.matched_skills, gaps: d.gaps, low_confidence: low,
            };
            scored.push(card);
            methodCounts[d.method] = (methodCounts[d.method] || 0) + 1;

            await db('applications').where({ id: app.application_id }).update({
              ai_score: d.score,
              matched_skills: JSON.stringify(d.matched_skills),
              screening_breakdown: JSON.stringify({ ...d, low_confidence: low, scored_at: new Date().toISOString() }),
            });

            if (STREAM_DELAY_MS) await sleep(STREAM_DELAY_MS);
            notifyCompany(companyId, 'screen:progress', { jobId, run_id, phase: 'scored', ...card });
          } catch (err: any) {
            failed++;
            logger.warn('Candidate screening failed', { module: 'AGENT', app: app.application_id, err: err?.message });
            notifyCompany(companyId, 'screen:candidate-error', {
              jobId, run_id, application_id: String(app.application_id), name: app.name, message: 'Screening failed for this candidate',
            });
          }
        }),
      );
    }

    const ranked = rankCandidates(scored);
    await Promise.all(
      ranked.map((c) => db('applications').where({ id: c.application_id }).update({ screening_rank: c.rank })),
    );
    notifyCompany(companyId, 'screen:ranked', { jobId, run_id, order: ranked.map((c) => c.application_id) });

    for (const top of ranked.slice(0, TOP_N_KITS)) {
      const kit = await this.generateKit(job, top);
      await db('applications').where({ id: top.application_id }).update({ interview_kit: JSON.stringify(kit) });
      notifyCompany(companyId, 'screen:kit', { jobId, run_id, application_id: top.application_id, kit });
    }

    const meta = { run_id, total: applications.length, scored: scored.length, failed, method_counts: methodCounts };
    await db('jobs').where({ id: jobId }).update({
      screening_status: 'done',
      screening_completed_at: db.fn.now(),
      screening_meta: JSON.stringify(meta),
    });
    notifyCompany(companyId, 'screen:complete', { jobId, run_id, meta });
  }

  private async generateKit(job: any, cand: ScoredCandidate): Promise<InterviewKit & { error?: boolean }> {
    const now = new Date().toISOString();
    const fallback: InterviewKit & { error?: boolean } = {
      focus_areas: cand.gaps.slice(0, 3),
      questions: cand.gaps.slice(0, 3).map((g) => ({ q: `Walk me through your experience with ${g}.`, targets: `${g} gap` })),
      generated_at: now,
    };
    if (!env.GEMINI_API_KEY && !env.GROQ_API_KEY) return fallback;

    const prompt = `You are a senior interviewer preparing a focused kit to screen ONE candidate for a specific role. Design questions that separate real, hands-on ability from surface familiarity.

ROLE: ${job.title}
EVIDENCED STRENGTHS (validate these are genuine and deep): ${cand.matched_skills.join(', ') || 'general background'}
GAPS / CONCERNS (probe these to establish the true level): ${cand.gaps.join(', ') || 'none noted'}

Write 4-5 specific, open-ended questions:
- For each gap: a question that reveals whether the candidate has real depth or only passing exposure (ask for a concrete example, a trade-off they made, or how they'd handle a realistic scenario).
- For key strengths: a question that pressure-tests the claim with a "tell me about a time you…" or a design/debugging scenario.
- Avoid generic or yes/no questions and anything answerable by reciting definitions.

Reply ONLY with valid JSON:
{"focus_areas": ["<the 2-4 themes these questions cover>"], "questions": [{"q": "<the interview question>", "targets": "<the specific gap or strength it probes>"}]}`;

    try {
      const text = await generateText({ prompt, temperature: 0.4, maxTokens: 512, json: true });
      const parsed = parseKitJson(text);
      if (!parsed || parsed.questions.length === 0) return { ...fallback, error: true };
      return { ...parsed, generated_at: now };
    } catch {
      logger.warn('Interview kit generation failed', { module: 'AGENT' });
      return { ...fallback, error: true };
    }
  }

  async getState(jobId: string, companyId: string) {
    const job = await db('jobs').where({ id: jobId }).first();
    if (!job || String(job.company_id) !== String(companyId)) throw new AppError('Job not found', 404);

    const rows = await db('applications')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .where('applications.job_id', jobId)
      .whereNotNull('applications.screening_breakdown')
      .select(
        'applications.id as application_id',
        'applications.candidate_id',
        'candidates.name',
        'applications.ai_score as score',
        'applications.screening_rank as rank',
        'applications.screening_breakdown',
        'applications.interview_kit',
      )
      .orderBy('applications.screening_rank', 'asc');

    const candidates = rows.map((r) => {
      const b = typeof r.screening_breakdown === 'string' ? safeParse(r.screening_breakdown) : r.screening_breakdown || {};
      return {
        application_id: String(r.application_id), candidate_id: String(r.candidate_id), name: r.name,
        score: r.score, rank: r.rank, method: b.method, reason: b.reason,
        matched_skills: b.matched_skills || [], gaps: b.gaps || [], low_confidence: !!b.low_confidence,
      };
    });
    const kits: Record<string, any> = {};
    rows.forEach((r) => {
      if (r.interview_kit) kits[String(r.application_id)] = typeof r.interview_kit === 'string' ? safeParse(r.interview_kit) : r.interview_kit;
    });

    const meta = typeof job.screening_meta === 'string' ? safeParse(job.screening_meta) : job.screening_meta;
    return { status: job.screening_status || 'idle', meta: meta || null, candidates, kits };
  }
}

function safeParse(s: string): any {
  try { return JSON.parse(s); } catch { return null; }
}

export const screeningAgentService = new ScreeningAgentService();
