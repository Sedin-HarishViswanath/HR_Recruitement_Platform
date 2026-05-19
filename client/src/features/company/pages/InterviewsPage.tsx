import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../shared/lib/api';
import { toast } from 'sonner';
import { Calendar, Clock, User, Video, RotateCcw, X, Plus, Award, Brain } from 'lucide-react';
import { DashboardHeader } from '../../../shared/components/DashboardHeader';
import { ScheduleInterviewModal } from '../components/ScheduleInterviewModal';
import { SubmitFeedbackModal } from '../components/SubmitFeedbackModal';
import { unwrapArray } from '../../../shared/lib/response';

const getInitials = (name: string) => { if (!name) return 'U'; const p = name.trim().split(' '); return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase(); };
const avatarGradients = ['from-blue-500 to-cyan-500', 'from-violet-500 to-purple-500', 'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500', 'from-rose-500 to-pink-500', 'from-sky-500 to-blue-500'];

export const CompanyInterviewsPage = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; interview: any }>({ isOpen: false, interview: null });

  const fetchInterviews = async () => {
    try { 
      setLoading(true); 
      const { data } = await api.get('/interviews'); 
      setInterviews(unwrapArray(data, ['interviews'])); 
    }
    catch (err) { console.error(err); toast.error('Failed to load interviews'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInterviews(); }, []);

  const upcoming = interviews.filter((i) => i.status?.toLowerCase() === 'scheduled');
  const completed = interviews.filter((i) => ['completed', 'feedback_submitted'].includes(i.status?.toLowerCase()));
  const displayed = tab === 'upcoming' ? upcoming : completed;

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f5f7]">
      <DashboardHeader title="Interviews" subtitle="Schedule and manage interviews" />
      <main className="p-4 sm:p-6 space-y-5 animate-fade-in">

        {/* Header bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex gap-0.5 bg-white border border-slate-200/80 rounded-xl p-1 shadow-sm">
            {[
              { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
              { key: 'completed', label: `Completed (${completed.length})` },
            ].map((t) => (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all duration-300 ${tab === t.key ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[13px] font-bold rounded-xl shadow-sm shadow-amber-500/20 transition-all btn-premium">
            <Plus size={14} /> Schedule Interview
          </button>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-[140px] shimmer rounded-2xl" />)}</div>
        ) : displayed.length === 0 ? (
          <div className="py-20 text-center card-premium">
            <Calendar size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-[14px] font-bold text-slate-900" style={{ fontFamily: 'Sora' }}>No {tab} interviews</p>
            <p className="text-[12px] text-slate-400 font-medium mt-1">Schedule your first interview to get started.</p>
          </div>
        ) : (
          <div className="space-y-4 animate-stagger">
            {displayed.map((iv, i) => {
              const date = iv.scheduled_at ? new Date(iv.scheduled_at) : null;
              const isCompleted = iv.status === 'completed' || iv.status === 'feedback_submitted';
              const isAptitude = (iv.round_type || '').toLowerCase() === 'aptitude';
              const hasScore = iv.aptitude_score != null;
              return (
                <div key={iv.id || i} className="card-premium p-5 group">
                  <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center text-white font-bold text-[12px] shrink-0 group-hover:scale-105 group-hover:shadow-md transition-all duration-300`}>
                        {getInitials(iv.candidate_name)}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-slate-900 leading-tight group-hover:text-amber-600 transition-colors">{iv.candidate_name}</p>
                        <p className="text-[11px] text-slate-400 font-medium leading-tight">{iv.job_title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAptitude && hasScore && (
                        <span className="tag-pill bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1">
                          <Award size={11} />
                          Score: {iv.aptitude_score}/20
                        </span>
                      )}
                      <span className={`tag-pill ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {isCompleted ? 'Completed' : 'Scheduled'}
                      </span>
                    </div>
                  </div>

                  {/* Meta grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      { icon: Calendar, label: 'Date', value: date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—' },
                      { icon: Clock, label: 'Time', value: date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' },
                      { icon: isAptitude ? Brain : Video, label: 'Type', value: (iv.round_type || 'Technical').charAt(0).toUpperCase() + (iv.round_type || 'Technical').slice(1) },
                      { icon: User, label: 'Interviewer', value: iv.interviewer_name || '—' },
                    ].map((m, j) => (
                      <div key={j} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50/60 border border-slate-100/60 group-hover:border-amber-100 transition-colors">
                        <m.icon size={13} className="text-slate-400 shrink-0" />
                        <div>
                          <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider leading-none">{m.label}</p>
                          <p className="text-[12px] font-semibold text-slate-700 leading-tight mt-0.5">{m.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  {!isCompleted && (
                    <div className="flex gap-2 pt-1">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-[12px] font-semibold text-slate-600 rounded-lg hover:bg-slate-50 hover:border-amber-200 transition-all">
                        <RotateCcw size={12} /> Reschedule
                      </button>
                      <button
                        onClick={() => navigate(`/interview/${iv.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[12px] font-semibold rounded-lg hover:shadow-md transition-all btn-premium"
                      >
                        <Video size={12} /> Join
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-[12px] font-semibold text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  )}

                  {/* Completed interview actions: show "Give Feedback" for aptitude rounds that are completed */}
                  {isCompleted && (
                    <div className="flex gap-2 pt-1">
                      {isAptitude && hasScore && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-200 text-[12px]">
                          <Award size={14} className="text-indigo-600" />
                          <span className="font-bold text-indigo-700">
                            Aptitude Score: {iv.aptitude_score}/20 ({Math.round((iv.aptitude_score / 20) * 100)}%)
                          </span>
                          <span className={`ml-1 font-bold ${(iv.aptitude_score / 20) >= 0.7 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            — {(iv.aptitude_score / 20) >= 0.7 ? 'Passed' : 'Below Threshold'}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => setFeedbackModal({ isOpen: true, interview: iv })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[12px] font-bold rounded-lg hover:shadow-md transition-all"
                      >
                        Give Feedback
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <ScheduleInterviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchInterviews} />
      {feedbackModal.interview && (
        <SubmitFeedbackModal
          isOpen={feedbackModal.isOpen}
          onClose={() => setFeedbackModal({ isOpen: false, interview: null })}
          onSuccess={() => {
            fetchInterviews();
            setFeedbackModal({ isOpen: false, interview: null });
          }}
          interview={feedbackModal.interview}
        />
      )}
    </div>
  );
};
