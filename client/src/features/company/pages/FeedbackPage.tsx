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

import { DashboardHeader } from '../../../shared/components/DashboardHeader';
import { toast } from 'sonner';
import { unwrapArray } from '../../../shared/lib/response';

export const FeedbackPage = () => {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<any[]>([]);

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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <DashboardHeader
        title="Interview Feedback"
        subtitle="Review scorecards and candidate evaluations"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <Select defaultValue="all">
              <SelectTrigger className="w-[220px] h-10 rounded-xl bg-slate-50 border-slate-200 font-semibold text-sm text-slate-700 focus:ring-0 focus:border-slate-300">
                <SelectValue placeholder="All Recommendations" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl font-medium">
                <SelectItem value="all">All Recommendations</SelectItem>
                <SelectItem value="strong-hire">Strong Hire</SelectItem>
                <SelectItem value="hire">Hire</SelectItem>
                <SelectItem value="no-hire">No Hire</SelectItem>
              </SelectContent>
            </Select>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-600">
                {feedback.length} entries
              </span>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer font-medium text-sm">
            <Filter size={16} />
            <span>More Filters</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-slate-500 font-medium">Loading candidate evaluations...</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Feedback Yet</h3>
            <p className="text-sm text-slate-500 font-medium max-w-sm text-center">Interviewer scorecards and candidate evaluations will appear here once submitted.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-stagger">
            {feedback.map((f) => {
              const isStrongHire = (f.recommendation || '').toLowerCase().includes('strong');
              const isNoHire = (f.recommendation || '').toLowerCase().includes('no');
              const recColor = isStrongHire ? 'text-green-700 bg-green-50 border-green-200' : isNoHire ? 'text-red-700 bg-red-50 border-red-200' : 'text-blue-700 bg-blue-50 border-blue-200';
              const recIcon = isStrongHire ? <ThumbsUp size={14} className="text-green-600" /> : isNoHire ? <ThumbsDown size={14} className="text-red-600" /> : <ThumbsUp size={14} className="text-blue-600" />;

              return (
                <div key={f.id} className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer relative overflow-hidden">
                  
                  {/* Decorative background glow based on rating */}
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 opacity-20 transition-opacity group-hover:opacity-40 ${isStrongHire ? 'bg-green-400' : isNoHire ? 'bg-red-400' : 'bg-blue-400'}`}></div>

                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-105 transition-transform duration-300">
                        {f.candidate_name ? f.candidate_name.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase() : 'CA'}
                      </div>
                      <div>
                        <h4 className="font-bold text-xl text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">{f.candidate_name || 'Unknown Candidate'}</h4>
                        <div className="flex items-center gap-3 mt-2 text-xs font-medium text-slate-500">
                          <span className="flex items-center gap-1.5"><Briefcase size={12} className="text-slate-400" /> {f.job_title || 'Position'}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="flex items-center gap-1.5"><User size={12} className="text-slate-400" /> {f.round || 'Interview'}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 shadow-sm ${recColor}`}>
                      {recIcon}
                      {f.recommendation || 'Evaluated'}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-3 mb-8 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 w-fit">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={16}
                          className={`transition-colors duration-300 ${s <= (f.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <span className="text-sm font-bold text-slate-700">{(f.rating || 0).toFixed(1)} <span className="text-slate-400 font-medium">/ 5.0</span></span>
                  </div>

                  {/* Feedback Blocks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm relative overflow-hidden group/block hover:border-green-200 transition-colors">
                      <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Strengths</p>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">{f.strengths || 'No specific strengths highlighted.'}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm relative overflow-hidden group/block hover:border-red-200 transition-colors">
                      <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                      <div className="flex items-center gap-2 mb-3">
                        <XCircle size={16} className="text-red-500" />
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Areas to Improve</p>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">{f.improvements || 'No areas for improvement noted.'}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between text-sm relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                        {f.interviewer_name ? f.interviewer_name.charAt(0).toUpperCase() : 'I'}
                      </div>
                      <p className="font-medium text-slate-600">Evaluated by <span className="font-bold text-slate-900">{f.interviewer_name || 'Interviewer'}</span></p>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-lg">
                      <Calendar size={14} />
                      <span className="text-xs">{f.created_at ? new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date'}</span>
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
