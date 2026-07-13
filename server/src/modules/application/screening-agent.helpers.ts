export interface ScoredCandidate {
  application_id: string;
  candidate_id: string;
  name: string;
  score: number;
  method: string;
  reason: string;
  matched_skills: string[];
  gaps: string[];
  low_confidence: boolean;
}

export interface InterviewKit {
  focus_areas: string[];
  questions: { q: string; targets: string }[];
  generated_at: string;
}

export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function rankCandidates(scored: ScoredCandidate[]): (ScoredCandidate & { rank: number })[] {
  return [...scored]
    .sort((a, b) => (b.score - a.score) || a.name.localeCompare(b.name))
    .map((c, i) => ({ ...c, rank: i + 1 }));
}

export function isLowConfidence(input: { resumeText?: string; skills: string[]; method: string }): boolean {
  if (input.method === 'keyword') return true;
  if (!input.resumeText && input.skills.length === 0) return true;
  return false;
}

export function parseKitJson(
  text: string,
): { focus_areas: string[]; questions: { q: string; targets: string }[] } | null {
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
    ? parsed.questions
        .filter((q: any) => q && typeof q.q === 'string')
        .map((q: any) => ({ q: String(q.q), targets: typeof q.targets === 'string' ? q.targets : '' }))
    : [];
  return {
    focus_areas: Array.isArray(parsed.focus_areas) ? parsed.focus_areas.map(String) : [],
    questions,
  };
}
