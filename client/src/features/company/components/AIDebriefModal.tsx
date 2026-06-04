import { useState } from 'react';
import { api } from '../../../shared/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '../../../components/ui/dialog';
import {
  Sparkles, Star, TrendingUp, MessageSquare, Code2, Users,
  CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, Brain
} from 'lucide-react';

interface AIDebrief {
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

interface AIDebriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  interviewId: string;
  candidateName?: string;
  jobTitle?: string;
  roundType?: string;
}

const REC_CONFIG = {
  strong_hire: { label: 'Strong Hire', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  hire: { label: 'Hire', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500' },
  no_hire: { label: 'No Hire', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
  strong_no_hire: { label: 'Strong No Hire', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
};

const RatingDots = ({ value, max = 5 }: { value: number; max?: number }) => (
  <div className="flex gap-1">
    {Array.from({ length: max }).map((_, i) => (
      <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < value ? 'bg-violet-600' : 'bg-slate-200'}`} />
    ))}
  </div>
);

const ScoreRing = ({ score }: { score: number }) => {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#8b5cf6' : '#f59e0b';

  return (
    <div className="relative w-20 h-20">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} stroke="#e2e8f0" strokeWidth="5" fill="none" />
        <circle
          cx="32" cy="32" r={r}
          stroke={color} strokeWidth="5" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[18px] font-black text-slate-900 leading-none" style={{ fontFamily: 'Sora' }}>{score}</span>
        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">/100</span>
      </div>
    </div>
  );
};

export const AIDebriefModal = ({
  isOpen, onClose, interviewId, candidateName, jobTitle, roundType
}: AIDebriefModalProps) => {
  const [debrief, setDebrief] = useState<AIDebrief | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/interviews/${interviewId}/debrief`);
      setDebrief(data.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to generate debrief. Ensure feedback has been submitted.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDebrief(null);
    onClose();
  };

  const rec = debrief ? REC_CONFIG[debrief.hire_recommendation] ?? REC_CONFIG.no_hire : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl p-0 border-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center border border-white/20">
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight" style={{ fontFamily: 'Sora' }}>AI Interview Debrief</h2>
              <p className="text-violet-200 text-[11px] font-medium mt-0.5">
                {candidateName && `${candidateName}`}{jobTitle && ` · ${jobTitle}`}{roundType && ` · ${roundType} Round`}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">

          {/* Empty state — trigger generation */}
          {!debrief && !loading && (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-5 border border-violet-100">
                <Sparkles size={28} className="text-violet-600" />
              </div>
              <h3 className="text-[15px] font-bold text-slate-900 mb-2" style={{ fontFamily: 'Sora' }}>Generate AI Analysis</h3>
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed max-w-sm mb-8">
                Gemini AI will analyze the interview feedback and transcript to produce a structured debrief with scores, strengths, and hiring recommendation.
              </p>
              <button
                onClick={generate}
                className="flex items-center gap-2 px-7 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-violet-200 active:scale-[0.98]"
              >
                <Sparkles size={14} />
                Generate Debrief
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
                <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
                <Brain size={20} className="absolute inset-0 m-auto text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Analyzing interview...</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Gemini is reading feedback and transcripts</p>
              </div>
            </div>
          )}

          {/* Debrief result */}
          {debrief && rec && (
            <div className="p-6 space-y-6">

              {/* Top row: score + recommendation */}
              <div className="flex items-center gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <ScoreRing score={debrief.overall_score} />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border ${rec.bg} ${rec.border} ${rec.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${rec.dot}`} />
                      {rec.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Generated {new Date(debrief.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-700 font-medium leading-relaxed">{debrief.summary}</p>
                </div>
              </div>

              {/* Ratings row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Communication', value: debrief.communication_rating, icon: MessageSquare, color: 'text-blue-600' },
                  { label: 'Technical', value: debrief.technical_rating, icon: Code2, color: 'text-emerald-600' },
                  { label: 'Culture Fit', value: debrief.culture_fit_rating, icon: Users, color: 'text-violet-600' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white border border-slate-200/80 rounded-xl p-4 text-center space-y-2 shadow-sm">
                    <Icon size={16} className={`${color} mx-auto`} />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                    <RatingDots value={value} />
                    <p className="text-[10px] text-slate-400 font-semibold">{value}/5</p>
                  </div>
                ))}
              </div>

              {/* Strengths + Areas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 size={11} /> Key Strengths
                  </p>
                  <ul className="space-y-1.5">
                    {debrief.key_strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-slate-700 font-medium">
                        <Star size={11} className="text-emerald-500 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 space-y-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                    <TrendingUp size={11} /> Areas to Improve
                  </p>
                  <ul className="space-y-1.5">
                    {debrief.areas_to_improve.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-slate-700 font-medium">
                        <AlertTriangle size={11} className="text-amber-500 mt-0.5 shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Next steps */}
              <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-700 mb-2 flex items-center gap-1.5">
                  <ArrowRight size={11} /> Suggested Next Steps
                </p>
                <p className="text-[12px] text-slate-700 font-medium leading-relaxed">{debrief.suggested_next_steps}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
          {debrief ? (
            <button
              onClick={() => { setDebrief(null); generate(); }}
              disabled={loading}
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer disabled:opacity-40"
            >
              <RotateCcw size={12} /> Regenerate
            </button>
          ) : <div />}
          <button
            onClick={handleClose}
            className="px-5 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
