import { useState } from 'react';
import { api } from '../../../shared/lib/api';
import { Sparkles, MessageCircleQuestion, Flag, ClipboardCheck, Cpu } from 'lucide-react';
import { toast } from 'sonner';

interface ClaimFlag { claim: string; concern: string; }
interface ScorecardSuggestion {
  rating: number | null;
  recommendation: string | null;
  strengths: string;
  weaknesses: string;
}
interface CopilotResponse {
  questions: string[];
  claim_flags: ClaimFlag[];
  scorecard_suggestion: ScorecardSuggestion;
  meta: { transcript_entries_used: number; code_aware: boolean; method: 'ai' | 'fallback' };
}
interface Props {
  interviewId: string;
  onUseSuggestion: (scorecard: ScorecardSuggestion) => void;
}

const REC_LABEL: Record<string, string> = {
  strong_hire: 'Strong Hire', hire: 'Hire', no_hire: 'No Hire', strong_no_hire: 'Strong No Hire',
};

export const InterviewCopilotPanel = ({ interviewId, onUseSuggestion }: Props) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CopilotResponse | null>(null);

  const ask = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/interviews/${interviewId}/copilot`);
      setResult(data.data as CopilotResponse);
    } catch {
      toast.error('Could not get copilot suggestions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#12141f] text-stone-200">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#252840] shrink-0">
        <div className="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
          <Sparkles size={13} />
        </div>
        <span className="text-[12px] font-bold text-stone-100">Interview Copilot</span>
      </div>

      <div className="p-3 shrink-0">
        <button
          onClick={ask}
          disabled={loading}
          className="btn-primary w-full !py-2 !text-[12px] disabled:opacity-50"
        >
          <Sparkles size={13} />
          {loading ? 'Thinking…' : result ? 'Ask Again' : 'Ask Copilot'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-4" aria-live="polite">
        {!result && !loading && (
          <p className="text-[11px] text-stone-500 px-1">
            Click "Ask Copilot" any time for follow-up questions, claim flags, and a draft scorecard based on the conversation so far.
          </p>
        )}

        {result && (
          <>
            {result.meta.method === 'fallback' && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                <Cpu size={10} /> Heuristic mode
              </span>
            )}

            {result.questions.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-stone-500 mb-2">
                  <MessageCircleQuestion size={12} /> Follow-up questions
                </p>
                <ul className="space-y-1.5">
                  {result.questions.map((q, i) => (
                    <li key={i} className="text-[12px] text-stone-200 bg-white/5 rounded-lg px-3 py-2 leading-relaxed">{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.claim_flags.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-stone-500 mb-2">
                  <Flag size={12} /> Claim flags
                </p>
                <ul className="space-y-1.5">
                  {result.claim_flags.map((f, i) => (
                    <li key={i} className="text-[12px] bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                      <p className="text-stone-100 font-semibold">{f.claim}</p>
                      <p className="text-amber-300 mt-0.5">{f.concern}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-stone-500 mb-2">
                <ClipboardCheck size={12} /> Draft scorecard
              </p>
              <div className="bg-white/5 rounded-lg p-3 space-y-1.5">
                <p className="text-[11px] text-stone-300">
                  Rating: <span className="font-mono font-semibold text-stone-100">{result.scorecard_suggestion.rating ?? '—'}</span>
                  {result.scorecard_suggestion.recommendation && (
                    <span className="ml-2 text-emerald-400 font-semibold">
                      {REC_LABEL[result.scorecard_suggestion.recommendation] || result.scorecard_suggestion.recommendation}
                    </span>
                  )}
                </p>
                {result.scorecard_suggestion.strengths && (
                  <p className="text-[11px] text-stone-400"><span className="text-stone-300 font-semibold">Strengths: </span>{result.scorecard_suggestion.strengths}</p>
                )}
                {result.scorecard_suggestion.weaknesses && (
                  <p className="text-[11px] text-stone-400"><span className="text-stone-300 font-semibold">Weaknesses: </span>{result.scorecard_suggestion.weaknesses}</p>
                )}
                <button
                  onClick={() => onUseSuggestion(result.scorecard_suggestion)}
                  className="btn-soft w-full !py-1.5 !text-[11px] mt-1"
                >
                  Use this
                </button>
              </div>
            </div>

            <p className="text-[9px] text-stone-600 px-1">
              Based on {result.meta.transcript_entries_used} transcript {result.meta.transcript_entries_used === 1 ? 'entry' : 'entries'}
              {result.meta.code_aware ? ' + current code' : ''}.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
