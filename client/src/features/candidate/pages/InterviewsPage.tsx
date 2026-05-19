import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../shared/lib/api';
import { Button } from '../../../components/ui/button';
import { 
  Video, 
  Calendar, 
  Clock, 
  User, 
} from 'lucide-react';
import { toast } from 'sonner';
import { unwrapArray } from '../../../shared/lib/response';

import { DashboardHeader } from '../../../shared/components/DashboardHeader';

export const CandidateInterviewsPage = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  const fetchInterviews = async () => {
    try {
      const { data } = await api.get('/candidate/interviews');
      setInterviews(unwrapArray(data, ['interviews']));
    } catch (err) {
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const filteredInterviews = interviews.filter(i => 
    activeTab === 'upcoming' ? i.status === 'scheduled' : i.status !== 'scheduled'
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f5f7]">
      <DashboardHeader 
        title="Interviews" 
        subtitle="Your scheduled interviews" 
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 text-[12px] font-semibold rounded-lg transition-all ${activeTab === 'upcoming' ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Upcoming ({interviews.filter(i => i.status === 'scheduled').length})
            </button>
            <button 
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 text-[12px] font-semibold rounded-lg transition-all ${activeTab === 'completed' ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Completed ({interviews.filter(i => i.status !== 'scheduled').length})
            </button>
          </div>
        </div>

        <div className="space-y-4 animate-stagger">
          {loading ? (
             [1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-white border border-slate-200/80 animate-pulse" />)
          ) : filteredInterviews.length === 0 ? (
            <div className="text-center py-20 card-premium">
              <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>No interviews found</h3>
              <p className="text-slate-500 font-medium text-[13px]">You don't have any {activeTab} interviews at the moment.</p>
            </div>
          ) : (
            filteredInterviews.map((interview) => (
              <div key={interview.id} className="card-premium p-5 flex flex-col md:flex-row gap-5 items-center group cursor-pointer">
                {/* Candidate Info */}
                <div className="flex items-center gap-4 min-w-[240px]">
                  <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
                    {interview.candidate_name?.[0] || 'AR'}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{interview.candidate_name || 'Alex Rivera'}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{interview.job_title || 'Senior Frontend Engineer'}</p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={12} /> Date
                    </p>
                    <p className="text-sm font-black text-slate-700">{new Date(interview.scheduled_at).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={12} /> Time
                    </p>
                    <p className="text-sm font-black text-slate-700">{new Date(interview.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Video size={12} /> Type
                    </p>
                    <p className="text-sm font-black text-slate-700 capitalize">{interview.round_type || 'Technical'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <User size={12} /> Interviewer
                    </p>
                    <p className="text-sm font-black text-slate-700">{interview.interviewer_name || 'James Liu'}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                   {interview.status === 'scheduled' && (
                      <Button 
                        onClick={() => navigate(`/interview/${interview.id}`)}
                        className="rounded-xl h-10 px-4 font-black text-xs uppercase tracking-widest bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-sm transition-all btn-premium border-0"
                      >
                        Join Meeting
                      </Button>
                   )}
                   
                   <div className="ml-4 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-100">
                      {interview.status}
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};
