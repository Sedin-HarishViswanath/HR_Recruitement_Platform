import { parseCopilotResponse, getFallbackQuestions } from '../modules/interview/interview-copilot.helpers';

describe('parseCopilotResponse', () => {
  it('parses a clean JSON object with all fields', () => {
    const out = parseCopilotResponse(
      '{"questions":["Q1","Q2"],"claim_flags":[{"claim":"Used Redis","concern":"Ask why Redis over Postgres"}],"scorecard_suggestion":{"rating":4,"recommendation":"hire","strengths":"Strong fundamentals","weaknesses":"Limited depth on scaling"}}'
    );
    expect(out).toEqual({
      questions: ['Q1', 'Q2'],
      claim_flags: [{ claim: 'Used Redis', concern: 'Ask why Redis over Postgres' }],
      scorecard_suggestion: {
        rating: 4,
        recommendation: 'hire',
        strengths: 'Strong fundamentals',
        weaknesses: 'Limited depth on scaling',
      },
    });
  });

  it('strips ```json fences and surrounding prose', () => {
    const out = parseCopilotResponse(
      'Sure, here:\n```json\n{"questions":["Q1"],"claim_flags":[],"scorecard_suggestion":{"rating":3,"recommendation":"no_hire","strengths":"ok","weaknesses":"weak"}}\n```'
    );
    expect(out?.questions).toEqual(['Q1']);
    expect(out?.scorecard_suggestion.rating).toBe(3);
  });

  it('returns null on non-JSON', () => {
    expect(parseCopilotResponse('not json at all')).toBeNull();
  });

  it('defaults missing questions/claim_flags/scorecard to safe empty values', () => {
    const out = parseCopilotResponse('{}');
    expect(out).toEqual({
      questions: [],
      claim_flags: [],
      scorecard_suggestion: { rating: null, recommendation: null, strengths: '', weaknesses: '' },
    });
  });

  it('clamps an out-of-range rating into 1..5', () => {
    const out = parseCopilotResponse('{"scorecard_suggestion":{"rating":9}}');
    expect(out?.scorecard_suggestion.rating).toBe(5);
  });

  it('rejects an invalid recommendation value as null', () => {
    const out = parseCopilotResponse('{"scorecard_suggestion":{"recommendation":"maybe"}}');
    expect(out?.scorecard_suggestion.recommendation).toBeNull();
  });

  it('caps questions at 3 and claim_flags at 3', () => {
    const out = parseCopilotResponse(
      '{"questions":["a","b","c","d"],"claim_flags":[{"claim":"1","concern":"x"},{"claim":"2","concern":"x"},{"claim":"3","concern":"x"},{"claim":"4","concern":"x"}]}'
    );
    expect(out?.questions.length).toBe(3);
    expect(out?.claim_flags.length).toBe(3);
  });
});

describe('getFallbackQuestions', () => {
  it('returns technical-flavored prompts for a technical round', () => {
    const qs = getFallbackQuestions('technical');
    expect(qs.length).toBeGreaterThan(0);
    expect(qs.join(' ')).toMatch(/technical|project|decision/i);
  });

  it('returns behavioral-flavored prompts for a non-technical round', () => {
    const qs = getFallbackQuestions('hr');
    expect(qs.length).toBeGreaterThan(0);
  });
});
