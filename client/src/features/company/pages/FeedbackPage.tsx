import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { 
  Star, 
  ThumbsUp,
  Filter
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
    <div className="flex flex-col min-h-screen bg-[#f4f5f7]">
      <DashboardHeader 
        title="Interview Feedback" 
        subtitle="Review scorecards and recommendations" 
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Select defaultValue="all">
                <SelectTrigger className="w-[200px] h-10 rounded-xl bg-white border-slate-200 font-bold text-sm">
                  <SelectValue placeholder="All Recommendations" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl font-bold">
                  <SelectItem value="all">All Recommendations</SelectItem>
                  <SelectItem value="strong-hire">Strong Hire</SelectItem>
                  <SelectItem value="hire">Hire</SelectItem>
                  <SelectItem value="no-hire">No Hire</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm font-bold text-slate-400">
                {feedback.length} feedback entries
              </div>
           </div>
           <button className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-amber-600 hover:bg-slate-50 transition-all cursor-pointer">
             <Filter size={20} />
           </button>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-[13px] text-slate-400 font-medium">Loading feedback...</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="py-20 text-center card-premium">
            <p className="text-[13px] text-slate-400 font-medium">No feedback entries found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-stagger">
            {feedback.map((f) => (
              <div key={f.id} className="card-premium p-6 sm:p-8 flex flex-col group cursor-pointer">
                
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform">
                      {f.candidate_name ? f.candidate_name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 tracking-tight leading-none group-hover:text-amber-600 transition-colors">{f.candidate_name || 'Candidate'}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{f.job_title || 'Position'} · {f.round || 'Interview'}</p>
                    </div>
                  </div>

                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${
                    (f.recommendation || '').includes('Strong') 
                      ? 'bg-green-50 text-green-600 border-green-100' 
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {(f.recommendation || '').includes('Strong') ? <ThumbsUp size={12} /> : <ThumbsUp size={12} />}
                    {f.recommendation || 'Evaluated'}
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      size={16} 
                      className={s <= (f.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-100'} 
                    />
                  ))}
                  <span className="ml-2 text-xs font-black text-slate-400">{f.rating || 0}/5</span>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="p-4 rounded-2xl bg-green-50/50 border border-green-100">
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Strengths</p>
                    <p className="text-sm font-bold text-green-900 leading-relaxed">{f.strengths || 'Not provided'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Areas for Improvement</p>
                    <p className="text-sm font-bold text-red-900 leading-relaxed">{f.improvements || 'Not provided'}</p>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">by</p>
                    <p className="text-xs font-black text-slate-900">{f.interviewer_name || 'Interviewer'}</p>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.created_at ? new Date(f.created_at).toLocaleDateString() : 'Unknown date'}</p>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
