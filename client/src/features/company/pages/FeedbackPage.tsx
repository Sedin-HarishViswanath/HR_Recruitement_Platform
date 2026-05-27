import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Filter,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Briefcase
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

import { toast } from 'sonner';
import { unwrapArray } from '../../../shared/lib/response';

export const FeedbackPage = () => {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [recommendationFilter, setRecommendationFilter] = useState('all');

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/interviews/feedback');
        setFeedback(unwrapArray(data, ['feedback']));
      } catch (err) {
        toast.error('Failed to load feedback');
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  const getFilteredFeedback = () => {
    if (recommendationFilter === 'all') return feedback;
    return feedback.filter(f => {
      const rec = (f.recommendation || '').toLowerCase().replace('_', '-').trim();
      return rec.includes(recommendationFilter);
    });
  };

  const filteredFeedback = getFilteredFeedback();

  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc]">
      {/* Workspace Header Bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40">
        <div>
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <span>Workspace</span>
            <span>&rsaquo;</span>
            <span className="text-slate-600 font-semibold">Feedback</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              Interview Feedback
            </h1>
            <span className="text-xs text-slate-400 font-medium">{feedback.length} evaluations submitted</span>
          </div>
        </div>
      </div>

      <main className="p-5 max-w-[1400px] w-full mx-auto space-y-5 animate-fade-in flex-1 flex flex-col">
        {/* Toolbar matching theme */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <Select 
              value={recommendationFilter} 
              onValueChange={(val) => setRecommendationFilter(val)}
            >
              <SelectTrigger className="w-[200px] h-9 rounded-lg bg-slate-50 border-slate-200 font-bold text-xs text-slate-600 focus:ring-0 focus:border-slate-300">
                <SelectValue placeholder="All Recommendations" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl font-bold text-xs">
                <SelectItem value="all">All Recommendations</SelectItem>
                <SelectItem value="strong_hire">Strong Hire</SelectItem>
                <SelectItem value="hire">Hire</SelectItem>
                <SelectItem value="no_hire">No Hire</SelectItem>
              </SelectContent>
            </Select>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 rounded-lg text-violet-600">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
              <span className="text-[10px] font-bold">
                {filteredFeedback.length} entries shown
              </span>
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50/50 transition-colors font-bold text-xs shadow-sm">
            <Filter size={13} className="text-slate-400" />
            <span>More Filters</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center flex-1">
            <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[12px] text-slate-400 font-medium">Loading evaluations...</p>
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200/80 shadow-sm flex-1">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-300 border border-slate-100">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-[14px] font-bold text-slate-900 mb-0.5" style={{ fontFamily: 'Sora' }}>No Feedback Found</h3>
            <p className="text-[11.5px] text-slate-400 font-medium max-w-xs text-center">Interviewer scorecards and evaluations matching criteria will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-stagger">
            {filteredFeedback.map((f, i) => {
              const rec = String(f.recommendation || '').toLowerCase();
              const isStrongHire = rec.includes('strong_hire') || rec.includes('strong-hire');
              const isNoHire = rec.includes('no');
              
              const recColor = isStrongHire 
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                : isNoHire 
                  ? 'text-rose-700 bg-rose-50 border-rose-200' 
                  : 'text-violet-700 bg-violet-50 border-violet-200';
                  
              const recIcon = isStrongHire 
                ? <ThumbsUp size={12} className="text-emerald-500" /> 
                : isNoHire 
                  ? <ThumbsDown size={12} className="text-rose-500" /> 
                  : <ThumbsUp size={12} className="text-violet-500" />;

              return (
                <div key={f.id || i} className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col group relative overflow-hidden">
                  
                  {/* Decorative rating-based background aura */}
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -mr-12 -mt-12 opacity-10 transition-opacity group-hover:opacity-20 ${isStrongHire ? 'bg-emerald-400' : isNoHire ? 'bg-rose-400' : 'bg-violet-400'}`}></div>

                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5 relative z-10">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-[12px] shadow-sm">
                        {f.candidate_name ? f.candidate_name.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase() : 'CA'}
                      </div>
                      <div>
                        <h4 className="font-bold text-[15px] text-slate-900 tracking-tight leading-tight group-hover:text-violet-600 transition-colors">
                          {f.candidate_name || 'Unknown Candidate'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[10.5px] font-bold text-slate-400">
                          <span className="flex items-center gap-1"><Briefcase size={11} /> {f.job_title || 'Position'}</span>
                          <span>&middot;</span>
                          <span className="flex items-center gap-1"><User size={11} /> {f.round || 'Round'}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 shadow-sm uppercase tracking-wider ${recColor}`}>
                      {recIcon}
                      {String(f.recommendation || 'Evaluated').replace('_', ' ')}
                    </div>
                  </div>

                  {/* Ratings */}
                  <div className="flex items-center gap-2.5 mb-5 bg-slate-50 border border-slate-100/60 p-2.5 rounded-lg w-fit">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={`transition-colors duration-300 ${s <= (f.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                    <div className="h-3 w-px bg-slate-200"></div>
                    <span className="text-[11.5px] font-extrabold text-slate-600">
                      {(f.rating || 0).toFixed(1)} <span className="text-slate-400 font-medium">/ 5.0</span>
                    </span>
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    <div className="p-3.5 rounded-lg bg-white border border-slate-150 relative overflow-hidden hover:border-emerald-200 transition-colors">
                      <div className="absolute top-0 left-0 w-0.5 h-full bg-emerald-500"></div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Strengths</p>
                      </div>
                      <p className="text-[12px] text-slate-600 leading-relaxed font-semibold">
                        {f.strengths || 'No strengths evaluation.'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-white border border-slate-150 relative overflow-hidden hover:border-rose-200 transition-colors">
                      <div className="absolute top-0 left-0 w-0.5 h-full bg-rose-500"></div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <XCircle size={13} className="text-rose-500" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-semibold">Improvements</p>
                      </div>
                      <p className="text-[12px] text-slate-600 leading-relaxed font-semibold">
                        {f.improvements || 'No areas for improvement noted.'}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-5.5 h-5.5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-[9px] font-extrabold shadow-inner uppercase">
                        {f.interviewer_name ? f.interviewer_name.charAt(0) : 'I'}
                      </div>
                      <p className="font-medium text-slate-500">
                        Evaluated by <span className="font-bold text-slate-800">{f.interviewer_name || 'Interviewer'}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 font-semibold bg-slate-50 px-2 py-1 rounded">
                      <Calendar size={12} />
                      <span className="text-[10px]">
                        {f.created_at ? new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'â€”'}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
