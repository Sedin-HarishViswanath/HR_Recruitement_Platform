import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { Link } from 'react-router-dom';
import { Briefcase, FileText, Calendar, ChevronRight, MapPin, Clock, Video, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { DashboardHeader } from '../../../shared/components/DashboardHeader';
import { unwrapArray } from '../../../shared/lib/response';

export const CandidateDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/candidate/dashboard');
        const dashboard = res.data.data || {};
        setData({
          ...dashboard,
          stats: dashboard.stats || {},
          upcomingInterviews: unwrapArray(dashboard.upcomingInterviews),
          recentApplications: unwrapArray(dashboard.recentApplications),
          recommendedJobs: unwrapArray(dashboard.recommendedJobs),
        });
      }
      catch (err) { console.error('Failed to load dashboard', err); }
      finally { setLoading(false); }
    };
    fetchDashboard();
  }, []);

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-[#f4f5f7]">
      <DashboardHeader title="Dashboard" subtitle="Loading..." />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
  if (!data) return <div className="p-8">Failed to load dashboard data</div>;

  const statGradients = [
    'from-amber-500 to-orange-500',
    'from-teal-500 to-emerald-500',
    'from-violet-500 to-purple-500',
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f5f7]">
      <DashboardHeader title="Dashboard" subtitle="Overview of your job applications" />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Profile Completion */}
        {data.profileCompletion < 100 && (
          <div className="card-premium p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5 animate-fade-in-up group">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-slate-100" strokeWidth="6" stroke="currentColor" fill="transparent" r="34" cx="40" cy="40" />
                <circle className="text-amber-500 transition-all duration-1000" strokeWidth="6" strokeDasharray={213.6} strokeDashoffset={213.6 - (213.6 * data.profileCompletion) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="34" cx="40" cy="40" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-bold text-lg text-slate-900" style={{ fontFamily: 'Sora' }}>{data.profileCompletion}%</span>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1 group-hover:text-amber-600 transition-colors">Complete your profile</h3>
              <p className="text-[13px] text-slate-500 font-medium">Better profiles get 3x more interview invites from recruiters.</p>
            </div>
            <Link to="/candidate/profile" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-[13px] shadow-sm shadow-amber-500/20 btn-premium whitespace-nowrap flex items-center gap-1.5">
              Finish Profile <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Stats Row — creative gradient bottom-accent cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-stagger">
          {[
            { label: 'Applications', value: data.stats.totalApplications || 0, trend: '+2 this week', icon: FileText, idx: 0 },
            { label: 'Active', value: data.stats.activeApplications || 0, trend: 'In progress', icon: Briefcase, idx: 1 },
            { label: 'Interviews', value: data.stats.scheduledInterviews || 0, trend: 'Upcoming', icon: Calendar, idx: 2 },
          ].map((s) => (
            <div key={s.idx} className="stat-card p-5 group cursor-pointer" style={{ '--stat-gradient': `linear-gradient(90deg, var(--tw-gradient-stops))` } as any}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${statGradients[s.idx]} flex items-center justify-center text-white shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}>
                  <s.icon size={18} />
                </div>
                <TrendingUp className="text-slate-200 group-hover:text-amber-400 transition-colors" size={16} />
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-1">{s.label}</p>
              <h4 className="text-3xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'Sora' }}>{s.value}</h4>
              <p className="text-[10px] font-semibold mt-1.5 text-amber-600">{s.trend}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interviews */}
            <div className="card-premium animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="p-5 border-b border-slate-100/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"><Calendar size={14} /></div>
                  <h3 className="font-bold text-slate-900 text-[14px]" style={{ fontFamily: 'Sora' }}>Upcoming Interviews</h3>
                </div>
                <Link to="/candidate/interviews" className="text-amber-600 font-semibold text-[12px] flex items-center gap-1 hover:text-amber-700 transition-colors">View all <ChevronRight size={14} /></Link>
              </div>
              <div className="divide-y divide-slate-50 list-slide-in">
                {data.upcomingInterviews.length === 0 ? (
                  <div className="p-10 text-center">
                    <Calendar size={32} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-[13px] text-slate-400 font-medium">No interviews scheduled yet.</p>
                  </div>
                ) : data.upcomingInterviews.map((iv: any) => (
                  <div key={iv.id} className="p-4 hover:bg-slate-50/60 transition-all flex items-center justify-between group cursor-pointer">
                    <div className="flex gap-3 items-center">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-md transition-all duration-300"><Video size={18} /></div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-[13px] group-hover:text-amber-600 transition-colors">{iv.job_title}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">{iv.company_name} · <span className="text-violet-600 uppercase tracking-wider text-[9px] font-bold">{iv.round_type}</span></p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-bold text-slate-900">{new Date(iv.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-end gap-1 mt-0.5"><Clock size={10} />{new Date(iv.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Applications */}
            <div className="card-premium animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="p-5 border-b border-slate-100/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><FileText size={14} /></div>
                  <h3 className="font-bold text-slate-900 text-[14px]" style={{ fontFamily: 'Sora' }}>Recent Applications</h3>
                </div>
                <Link to="/candidate/applications" className="text-amber-600 font-semibold text-[12px] flex items-center gap-1 hover:text-amber-700 transition-colors">View all <ChevronRight size={14} /></Link>
              </div>
              <div className="p-3 space-y-2 list-slide-in">
                {data.recentApplications.length === 0 ? (
                  <div className="p-10 text-center"><p className="text-[13px] text-slate-400 font-medium">Apply to your first job!</p></div>
                ) : data.recentApplications.map((app: any) => (
                  <div key={app.id} className="p-3 rounded-xl border border-slate-100 hover:border-amber-200 transition-all flex justify-between items-center group hover:shadow-sm cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-amber-600 group-hover:bg-amber-50 transition-all duration-300"><FileText size={16} /></div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-[13px] group-hover:text-amber-600 transition-colors">{app.job_title}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">{app.company_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tag-pill bg-blue-50 text-blue-700 border-blue-200">{app.status}</span>
                      <ChevronRight className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">
            {/* Pro Tip */}
            <div className="bg-gradient-to-br from-[#0b0f1a] to-[#131b2e] rounded-2xl p-5 text-white relative overflow-hidden group animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-violet-500 rounded-full blur-2xl opacity-10" />
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Sparkles size={14} className="text-amber-400 animate-float" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Pro Tip</span>
              </div>
              <p className="text-[13px] text-slate-300 font-medium leading-relaxed relative z-10">Personalized cover letters boost your interview rate by <span className="text-amber-400 font-bold">40%</span>.</p>
              <button className="mt-3 text-amber-400 font-bold text-[12px] relative z-10 hover:text-amber-300 transition-colors flex items-center gap-1">More tips <ArrowRight size={12} /></button>
            </div>

            {/* Recommended Jobs — COMPACT, not oversized */}
            <div className="card-premium animate-fade-in-up" style={{ animationDelay: '250ms' }}>
              <div className="p-4 border-b border-slate-100/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center"><Briefcase size={12} /></div>
                  <h3 className="font-bold text-slate-900 text-[13px]" style={{ fontFamily: 'Sora' }}>For You</h3>
                </div>
                <Link to="/candidate/jobs" className="text-amber-600 font-semibold text-[11px] hover:text-amber-700 transition-colors">See all</Link>
              </div>
              <div className="p-2 space-y-0.5 max-h-[220px] overflow-y-auto">
                {data.recommendedJobs.length === 0 ? (
                  <div className="p-6 text-center text-[12px] text-slate-400">Add skills to get recommendations.</div>
                ) : data.recommendedJobs.slice(0, 4).map((job: any) => (
                  <Link to="/candidate/jobs" key={job.id} className="p-3 rounded-xl hover:bg-slate-50 transition-all group flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {job.title?.[0] || 'J'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 text-[12px] truncate group-hover:text-amber-600 transition-colors">{job.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 truncate"><MapPin size={9} />{job.location || 'Remote'}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-amber-500 shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
