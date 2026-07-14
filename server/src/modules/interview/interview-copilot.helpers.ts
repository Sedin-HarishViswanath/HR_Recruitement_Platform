export interface ClaimFlag {
  claim: string;
  concern: string;
}

export interface ScorecardSuggestion {
  rating: number | null;
  recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire' | null;
  strengths: string;
  weaknesses: string;
}

export interface CopilotResponse {
  questions: string[];
  claim_flags: ClaimFlag[];
  scorecard_suggestion: ScorecardSuggestion;
  meta: { transcript_entries_used: number; code_aware: boolean; method: 'ai' | 'fallback' };
}

const VALID_RECOMMENDATIONS = ['strong_hire', 'hire', 'no_hire', 'strong_no_hire'];

/**
 * Pure parser for the copilot's Gemini JSON response. Tolerates ```json fences
 * and surrounding prose, clamps the rating, rejects invalid recommendations,
 * and caps list lengths. Returns null only when no parseable object is found.
 */
export function parseCopilotResponse(
  text: string,
): { questions: string[]; claim_flags: ClaimFlag[]; scorecard_suggestion: ScorecardSuggestion } | null {
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

  const questions = Array.isArray(parsed.questions)
    ? parsed.questions.filter((q: any) => typeof q === 'string').slice(0, 3)
    : [];

  const claim_flags: ClaimFlag[] = Array.isArray(parsed.claim_flags)
    ? parsed.claim_flags
        .filter((f: any) => f && typeof f.claim === 'string' && typeof f.concern === 'string')
        .slice(0, 3)
        .map((f: any) => ({ claim: f.claim, concern: f.concern }))
    : [];

  const sc = parsed.scorecard_suggestion || {};
  // Respect an explicit null (model signalling "not enough signal yet") rather
  // than coercing it to 1 via Number(null) === 0.
  const ratingNum = sc.rating == null ? NaN : Number(sc.rating);
  const rating = !isNaN(ratingNum) ? Math.min(5, Math.max(1, Math.round(ratingNum))) : null;
  const recommendation = VALID_RECOMMENDATIONS.includes(sc.recommendation) ? sc.recommendation : null;

  return {
    questions,
    claim_flags,
    scorecard_suggestion: {
      rating,
      recommendation,
      strengths: typeof sc.strengths === 'string' ? sc.strengths : '',
      weaknesses: typeof sc.weaknesses === 'string' ? sc.weaknesses : '',
    },
  };
}

/**
 * Deterministic, non-AI questions used when Gemini is unavailable or fails to
 * parse. Round-type aware so the fallback still feels relevant.
 */
export function getFallbackQuestions(roundType: string): string[] {
  if (roundType === 'technical') {
    return [
      'Ask them to walk through their most complex recent project.',
      'Probe a specific technical decision they mentioned and why they chose it.',
    ];
  }
  return [
    'Ask about a time they disagreed with a teammate and how they handled it.',
    'Probe what they found most challenging in a recent role.',
  ];
}
