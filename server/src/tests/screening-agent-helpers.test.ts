import { chunk, rankCandidates, isLowConfidence, parseKitJson, ScoredCandidate } from '../modules/application/screening-agent.helpers';

const mk = (id: string, score: number, extra: Partial<ScoredCandidate> = {}): ScoredCandidate => ({
  application_id: id, candidate_id: 'c' + id, name: 'N' + id, score,
  method: 'gemini', reason: '', matched_skills: [], gaps: [], low_confidence: false, ...extra,
});

describe('chunk', () => {
  it('splits into batches of size n', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it('returns [] for empty input', () => {
    expect(chunk([], 3)).toEqual([]);
  });
});

describe('rankCandidates', () => {
  it('sorts by score desc and assigns 1-based rank', () => {
    const out = rankCandidates([mk('a', 70), mk('b', 91), mk('c', 55)]);
    expect(out.map((c) => c.application_id)).toEqual(['b', 'a', 'c']);
    expect(out.map((c) => c.rank)).toEqual([1, 2, 3]);
  });
  it('breaks ties by name for determinism', () => {
    const out = rankCandidates([mk('a', 80, { name: 'Zoe' }), mk('b', 80, { name: 'Ann' })]);
    expect(out[0].name).toBe('Ann');
  });
});

describe('isLowConfidence', () => {
  it('true when keyword method', () => {
    expect(isLowConfidence({ resumeText: 'x', skills: ['a'], method: 'keyword' })).toBe(true);
  });
  it('true when no resume and no skills', () => {
    expect(isLowConfidence({ resumeText: undefined, skills: [], method: 'gemini' })).toBe(true);
  });
  it('false for a normal gemini candidate', () => {
    expect(isLowConfidence({ resumeText: 'cv', skills: ['a'], method: 'gemini' })).toBe(false);
  });
});

describe('parseKitJson', () => {
  it('parses fenced kit JSON', () => {
    const out = parseKitJson('```json\n{"focus_areas":["K8s"],"questions":[{"q":"Explain pods","targets":"K8s gap"}]}\n```');
    expect(out?.focus_areas).toEqual(['K8s']);
    expect(out?.questions[0].q).toBe('Explain pods');
  });
  it('returns null on garbage', () => {
    expect(parseKitJson('nope')).toBeNull();
  });
});
