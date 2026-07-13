import { parseGeminiScreening } from '../modules/application/ats-screening.service';

describe('parseGeminiScreening', () => {
  it('parses a clean JSON object', () => {
    const out = parseGeminiScreening('{"score":88,"reason":"Strong match","matched_skills":["AWS"],"gaps":["K8s"]}');
    expect(out).toEqual({ score: 88, reason: 'Strong match', matched_skills: ['AWS'], gaps: ['K8s'] });
  });

  it('strips ```json fences and surrounding prose', () => {
    const out = parseGeminiScreening('Here you go:\n```json\n{"score":42,"reason":"Partial","matched_skills":[],"gaps":["Go"]}\n```');
    expect(out?.score).toBe(42);
    expect(out?.gaps).toEqual(['Go']);
  });

  it('clamps score to 0..100 and coerces missing arrays to []', () => {
    const out = parseGeminiScreening('{"score":150,"reason":"x"}');
    expect(out).toEqual({ score: 100, reason: 'x', matched_skills: [], gaps: [] });
  });

  it('returns null on non-JSON', () => {
    expect(parseGeminiScreening('no json here')).toBeNull();
  });

  it('returns null when score is not a number', () => {
    expect(parseGeminiScreening('{"score":"high","reason":"x"}')).toBeNull();
  });
});
