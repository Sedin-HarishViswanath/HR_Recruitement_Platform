import { useState, useEffect, useMemo } from 'react';
import { usePageTitle } from '../../../shared/hooks/usePageTitle';
import { api } from '../../../shared/lib/api';
import {
  Star, CheckCircle2, XCircle,
  Calendar, User, Briefcase, Brain
} from 'lucide-react';
import { toast } from 'sonner';
import { unwrapArray } from '../../../shared/lib/response';
import { AIDebriefModal } from '../components/AIDebriefModal';

const REC_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  strong_hire:     { label: 'Strong Hire',     badgeClass: 'badge-premium badge-emerald' },
  hire:            { label: 'Hire',            badgeClass: 'badge-premium badge-emerald' },
  no_hire:         { label: 'No Hire',         badgeClass: 'badge-premium badge-amber' },
  strong_no_hire:  { label: 'Strong No Hire',  badgeClass: 'badge-premium badge-red' },
};

const getRec = (recommendation: string) =>
  REC_CONFIG[recommendation] ?? { label: recommendation || 'Evaluated', badgeClass: 'badge-premium bg-slate-50 text-slate-500 border-slate-200' };

// ── Skeleton ──────────────────────────────────────────────────────────────────
const FeedbackCardSkeleton = () => (
  <div className="outer-bezel animate-pulse">
    <div className="inner-core space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-xl" />
          <div className="space-y-1.5">
            <div className="h-3.5 bg-slate-200 rounded w-32" />
            <div className="h-2.5 bg-slate-100 rounded w-48" />
          </div>
        </div>
        <div className="h-6 w-20 bg-slate-100 rounded-full" />
      </div>
      <div className="h-8 bg-slate-50 rounded-lg w-36" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 bg-slate-50 rounded-lg" />
        <div className="h-20 bg-slate-50 rounded-lg" />
      </div>
    </div>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────
export const FeedbackPage = () => {
  usePageTitle('Interview Feedback');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [debriefModal, setDebriefModal] = useState<{ isOpen: boolean; feedback: any | null }>({ isOpen: false, feedback: null });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/interviews/feedback');
        setFeedback(unwrapArray(data, ['feedback']));
      } catch {
        toast.error('Failed to load feedback');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return feedback;
    return feedback.filter(f => (f.recommendation || '') === filter);
  }, [feedback, filter]);

  // Summary counts
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: feedback.length };
    feedback.forEach(f => {
      const r = f.recommendation || 'unknown';
      c[r] = (c[r] || 0) + 1;
    });
    return c;
  }, [feedback]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="topbar-frost px-6 py-4 sticky top-0 z-40">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
          Workspace &rsaquo; <span className="text-slate-600">Feedback</span>
        </p>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>
            Interview Feedback
          </h1>
          <span className="chip-brand">{feedback.length} Evaluations</span>
        </div>
      </div>

      <main className="p-6 max-w-[1400px] w-full mx-auto space-y-6 flex-1 animate-fade-in-up">
        {/* Filter bar */}
        <div className="panel p-3.5 flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-slate-100/80 border border-slate-200/50 rounded-xl p-0.5 gap-0.5">
            {[
              { key: 'all', label: 'All' },
              { key: 'strong_hire', label: 'Strong Hire' },
              { key: 'hire', label: 'Hire' },
              { key: 'no_hire', label: 'No Hire' },
              { key: 'strong_no_hire', label: 'Strong No Hire' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition-spring cursor-pointer flex items-center gap-1 ${
                  filter === key ? 'bg-white text-slate-900 shadow-sm border border-slate-200/40' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {label}
                {counts[key] > 0 && (
                  <span className={`text-[9px] px-1.5 rounded-full ${filter === key ? 'bg-violet-100 text-violet-700' : 'bg-slate-200/80 text-slate-500'}`}>
                    {counts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1, 2, 3].map(i => <FeedbackCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center panel">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/60 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 size={24} className="text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-700" style={{ fontFamily: 'Sora' }}>No Feedback Scorecards</h3>
            <p className="text-xs text-slate-400 font-medium mt-1.5 max-w-xs mx-auto">
              Interviewer scorecards matching this filter will appear here once submitted.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 list-slide-in">
            {filtered.map((f, i) => {
              const rec = getRec(f.recommendation);
              const isPositive = ['strong_hire', 'hire'].includes(f.recommendation);

              return (
                <div key={f.id || i} className="outer-bezel">
                  <div className="inner-core flex flex-col justify-between relative overflow-hidden h-full">
                    {/* Subtle color aura indicator */}
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 opacity-10 ${isPositive ? 'bg-emerald-400' : 'bg-rose-455'}`} />

                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-white font-extrabold text-[11px] shadow-sm border border-slate-750/30">
                            {(f.candidate_name || 'C').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900" style={{ fontFamily: 'Sora' }}>
                              {f.candidate_name || 'Unknown Candidate'}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[10.5px] font-semibold text-slate-400 flex-wrap">
                              <span className="flex items-center gap-1 text-slate-700 font-semibold"><Briefcase size={10} className="text-slate-400" /> {f.job_title || 'Position'}</span>
                              <span className="text-slate-300">·</span>
                              <span className="flex items-center gap-1"><User size={10} className="text-slate-400" /> {f.interviewer_name || 'Interviewer'}</span>
                            </div>
                          </div>
                        </div>

                        <span className={rec.badgeClass}>
                          {rec.label}
                        </span>
                      </div>

                      {/* Rating stars */}
                      <div className="flex items-center gap-2 mb-4 w-fit bg-slate-50/50 border border-slate-100 px-3 py-1.5 rounded-xl">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={13} className={s <= (f.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                          ))}
                        </div>
                        <div className="w-px h-3 bg-slate-200" />
                        <span className="text-[11px] font-extrabold text-slate-700">
                          {(f.rating || 0).toFixed(1)} <span className="text-slate-400 font-medium">/ 5</span>
                        </span>
                      </div>

                      {/* Strengths & weaknesses */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="surface-sunken p-3.5 relative overflow-hidden hover:border-emerald-200/50 transition-spring">
                          <div className="absolute top-0 left-0 w-0.5 h-full bg-emerald-500" />
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <CheckCircle2 size={11} className="text-emerald-500" />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Strengths</p>
                          </div>
                          <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium line-clamp-3">
                            {f.strengths || 'Not provided'}
                          </p>
                        </div>

                        <div className="surface-sunken p-3.5 relative overflow-hidden hover:border-red-200/50 transition-spring">
                          <div className="absolute top-0 left-0 w-0.5 h-full bg-red-400" />
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <XCircle size={11} className="text-red-400" />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Improvements</p>
                          </div>
                          <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium line-clamp-3">
                            {f.weaknesses || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between relative z-10 mt-3">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                        <Calendar size={11} className="text-slate-400" />
                        {f.created_at
                          ? new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                        {f.round_type && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="capitalize font-bold text-slate-500">{f.round_type} Round</span>
                          </>
                        )}
                      </div>

                      {f.interview_id && (
                        <button
                          onClick={() => setDebriefModal({ isOpen: true, feedback: f })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-violet-700 bg-violet-50 hover:bg-violet-100/80 border border-violet-150 text-[10px] font-bold transition-spring cursor-pointer shadow-sm"
                        >
                          <Brain size={11} />
                          AI Debrief
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* AI Debrief Modal */}
      {debriefModal.feedback && (
        <AIDebriefModal
          isOpen={debriefModal.isOpen}
          onClose={() => setDebriefModal({ isOpen: false, feedback: null })}
          interviewId={debriefModal.feedback.interview_id}
          candidateName={debriefModal.feedback.candidate_name}
          jobTitle={debriefModal.feedback.job_title}
          roundType={debriefModal.feedback.round_type}
        />
      )}
    </div>
  );
};
