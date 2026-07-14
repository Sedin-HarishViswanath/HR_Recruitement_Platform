import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '../../../components/ui/dialog';
import { Sparkles, CheckCircle2, Users, X, Trophy, Loader2 } from 'lucide-react';
import { api } from '../../../shared/lib/api';

interface CompareVerdict {
  recommended: { application_id: string; name: string } | null;
  summary: string;
  per_candidate: { application_id: string; name: string; text: string }[];
}

const REC_LABEL: Record<string, string> = {
  strong_hire: 'Strong Hire', hire: 'Hire',
  no_hire: 'No Hire', strong_no_hire: 'Strong No Hire',
};

const REC_COLOR: Record<string, string> = {
  strong_hire: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  hire: 'text-green-700 bg-green-50 border-green-200',
  no_hire: 'text-orange-700 bg-orange-50 border-orange-200',
  strong_no_hire: 'text-red-700 bg-red-50 border-red-200',
};

const AVATAR_GRADIENTS = [
  'from-emerald-500 to-emerald-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-600',
];

const getInitials = (name: string) => {
  const p = (name || '').trim().split(' ');
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || 'U';
};

interface CandidateCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: any[];
}

export const CandidateCompareModal = ({
  isOpen, onClose, candidates,
}: CandidateCompareModalProps) => {
  const [verdict, setVerdict] = useState<CompareVerdict | null>(null);
  const [loadingVerdict, setLoadingVerdict] = useState(false);
  const [verdictError, setVerdictError] = useState(false);

  // Comma-joined ids so the effect re-runs only when the actual selection changes.
  const idsKey = candidates.map((c) => c.id).join(',');

  useEffect(() => {
    if (!isOpen || candidates.length < 2) return;
    let cancelled = false;
    setVerdict(null);
    setVerdictError(false);
    setLoadingVerdict(true);
    api
      .post('/applications/compare', { application_ids: candidates.map((c) => c.id) })
      .then(({ data }) => { if (!cancelled) setVerdict(data.data); })
      .catch(() => { if (!cancelled) setVerdictError(true); })
      .finally(() => { if (!cancelled) setLoadingVerdict(false); });
    return () => { cancelled = true; };
  }, [isOpen, idsKey, candidates.length]);

  if (!candidates.length) return null;

  const recommendedId = verdict?.recommended?.application_id;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl p-0 border-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="topbar-frost px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
              <Users size={15} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-stone-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>Candidate Comparison</h2>
              <p className="text-[10px] text-stone-400 font-medium">{candidates.length} candidates side-by-side</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer text-stone-400 hover:text-stone-700">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-auto flex-1 p-6">

          {/* ── AI Verdict panel ── */}
          <div className="mb-6 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 to-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} className="text-emerald-600" />
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">AI Verdict</span>
            </div>
            {loadingVerdict ? (
              <div className="flex items-center gap-2 py-2 text-[12px] text-stone-500 font-medium">
                <Loader2 size={13} className="animate-spin text-emerald-600" /> Analysing candidates head-to-head…
              </div>
            ) : verdictError ? (
              <p className="text-[12px] text-stone-500 font-medium py-1">Couldn't generate an AI comparison right now.</p>
            ) : verdict ? (
              <div className="space-y-2.5">
                {verdict.recommended && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold shadow-sm">
                    <Trophy size={12} /> Advance first: {verdict.recommended.name}
                  </div>
                )}
                {verdict.summary && (
                  <p className="text-[12.5px] text-stone-700 font-medium leading-relaxed">{verdict.summary}</p>
                )}
                {verdict.per_candidate?.some((p) => p.text) && (
                  <div className="grid gap-1.5 pt-1">
                    {verdict.per_candidate.filter((p) => p.text).map((p) => (
                      <div key={p.application_id} className="text-[11.5px] text-stone-600 leading-snug">
                        <span className="font-bold text-stone-800">{p.name}:</span> {p.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className={`grid gap-5`} style={{ gridTemplateColumns: `200px repeat(${candidates.length}, 1fr)` }}>

            {/* Column headers */}
            <div /> {/* empty corner */}
            {candidates.map((c, i) => (
              <div key={c.id} className="text-center space-y-2">
                <div className="relative">
                  <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white font-extrabold text-sm shadow-sm ${recommendedId === String(c.id) ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}>
                    {getInitials(c.candidate_name || c.user_name)}
                  </div>
                  {recommendedId === String(c.id) && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center shadow-sm" title="AI top pick">
                      <Trophy size={10} className="text-white" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900 leading-tight">{c.candidate_name || c.user_name || 'Unknown'}</p>
                  <p className="text-[10px] text-stone-400 font-medium truncate max-w-[130px] mx-auto">{c.job_title || '—'}</p>
                </div>
              </div>
            ))}

            {/* ── AI Match Score ── */}
            <div className="flex items-center text-[11px] font-bold text-stone-500 py-3 border-t border-stone-100">
              <span className="flex items-center gap-1"><Sparkles size={11} className="text-emerald-500" /> AI Fit Score</span>
            </div>
            {candidates.map((c) => (
              <div key={c.id} className="flex items-center justify-center py-3 border-t border-stone-100">
                {c.ai_score != null ? (
                  <div className="text-center">
                    <div className="text-2xl font-black text-stone-900 leading-none" style={{ fontFamily: 'Plus Jakarta Sans' }}>{c.ai_score}%</div>
                    <div className="w-full h-1.5 bg-stone-100 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${c.ai_score >= 75 ? 'bg-emerald-500' : c.ai_score >= 55 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${c.ai_score}%`, transition: 'width 0.7s ease' }}
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-[11px] text-stone-400 font-medium">—</span>
                )}
              </div>
            ))}

            {/* ── Status ── */}
            <div className="flex items-center text-[11px] font-bold text-stone-500 py-3 border-t border-stone-100">Status</div>
            {candidates.map((c) => (
              <div key={c.id} className="flex items-center justify-center py-3 border-t border-stone-100">
                <span className="text-[9.5px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {(c.status || 'applied').replace(/_/g, ' ')}
                </span>
              </div>
            ))}

            {/* ── Application Date ── */}
            <div className="flex items-center text-[11px] font-bold text-stone-500 py-3 border-t border-stone-100">Applied</div>
            {candidates.map((c) => (
              <div key={c.id} className="flex items-center justify-center py-3 border-t border-stone-100">
                <span className="text-[11px] text-stone-600 font-semibold">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </span>
              </div>
            ))}

            {/* ── Matched skills ── */}
            <div className="flex items-start text-[11px] font-bold text-stone-500 py-3 border-t border-stone-100 mt-1">Matched Skills</div>
            {candidates.map((c) => (
              <div key={c.id} className="py-3 border-t border-stone-100">
                {c.matched_skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {(c.matched_skills as string[]).slice(0, 5).map((s: string) => (
                      <span key={s} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                        <CheckCircle2 size={8} /> {s}
                      </span>
                    ))}
                    {c.matched_skills.length > 5 && (
                      <span className="text-[9px] text-stone-400 font-medium">+{c.matched_skills.length - 5} more</span>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-stone-400 text-center">—</p>
                )}
              </div>
            ))}

            {/* ── Latest feedback recommendation ── */}
            <div className="flex items-center text-[11px] font-bold text-stone-500 py-3 border-t border-stone-100">Recommendation</div>
            {candidates.map((c) => (
              <div key={c.id} className="flex items-center justify-center py-3 border-t border-stone-100">
                {c.latest_recommendation ? (
                  <span className={`text-[9px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${REC_COLOR[c.latest_recommendation] || 'bg-stone-50 text-stone-600 border-stone-200'}`}>
                    {REC_LABEL[c.latest_recommendation] || c.latest_recommendation}
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-400 font-medium">Pending</span>
                )}
              </div>
            ))}

            {/* ── Interview rounds completed ── */}
            <div className="flex items-center text-[11px] font-bold text-stone-500 py-3 border-t border-stone-100">Rounds Done</div>
            {candidates.map((c) => (
              <div key={c.id} className="flex items-center justify-center py-3 border-t border-stone-100">
                <span className="text-[13px] font-extrabold text-stone-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                  {c.latest_interview_round || 0}
                  <span className="text-[10px] text-stone-400 font-medium"> / {c.interview_rounds || 1}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-stone-100 bg-white shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
