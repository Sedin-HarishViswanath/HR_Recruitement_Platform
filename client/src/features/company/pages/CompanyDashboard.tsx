// Reading this as: company team workspace and analytics dashboard, with a modern B2B layout, leaning toward Fluent/Primer-inspired structured components + calibrated status labels.
import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { Users, Briefcase, Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import { DashboardHeader } from '../../../shared/components/DashboardHeader';
import { unwrapArray } from '../../../shared/lib/response';

const BarChart = ({ data }: { data: { label: string; value: number }[] }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 sm:gap-3 h-44 pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 flex-1 group">
          <div className="relative w-full">
            <div
              className="w-full bg-violet-500 rounded-t-md transition-all duration-700 ease-out cursor-pointer group-hover:bg-violet-600"
              style={{ height: `${(d.value / max) * 140}px`, minHeight: d.value > 0 ? '6px' : '0', animationDelay: `${i * 80}ms` }}
            />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{d.value}</div>
          </div>
          <span className="text-[9px] text-slate-400 font-medium text-center leading-tight">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({ segments }: { segments: { label: string; value: number; color: string }[] }) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  let cumulative = 0;
  const r = 52, cx = 64, cy = 64, circumference = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="128" height="128" className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="16" />
          {segments.map((seg, i) => {
            const fraction = seg.value / total;
            const offset = circumference * (1 - cumulative);
            const dash = circumference * fraction;
            cumulative += fraction;
            return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="16" strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={offset} className="transition-all duration-700" />;
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-bold text-slate-900">{total}</p>
            <p className="text-[9px] text-slate-400 font-medium uppercase">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const statMeta = [
  { title: 'APPLICATIONS', icon: Users, color: 'text-violet-600 bg-violet-50' },
  { title: 'OPEN POSITIONS', icon: Briefcase, color: 'text-teal-600 bg-teal-50' },
  { title: 'INTERVIEWS SCHEDULED', icon: Calendar, color: 'text-blue-600 bg-blue-50' },
  { title: 'TOTAL CANDIDATES', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
];

export const CompanyDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await api.get('/analytics/company/stats');
        const dashboard = res.data || {};
        setData({
          ...dashboard,
          stats: dashboard.stats || {},
          pipelineData: unwrapArray(dashboard.pipelineData),
          jobSegments: unwrapArray(dashboard.jobSegments),
          recentApplications: unwrapArray(dashboard.recentApplications),
        });
      }
      catch { console.error('Failed to fetch dashboard data'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc]">
      <DashboardHeader title="Dashboard" subtitle="Loading..." />
      <div className="flex-1 flex items-center justify-center"><div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
    </div>
  );
  if (!data) return <div className="p-8 text-center font-medium text-red-500">Failed to load dashboard.</div>;

  const { stats, pipelineData, jobSegments, recentApplications } = data;
  const statValues = [stats.applications || 0, stats.jobs || 0, stats.interviews || 0, stats.candidates || 0];

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'hired') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'rejected') return 'bg-red-50 text-red-600 border-red-200';
    if (s === 'offer') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s?.includes('interview')) return 'bg-violet-50 text-violet-700 border-violet-200';
    if (s === 'shortlisted') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s === 'screening') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };
  const getInitials = (name: string) => { if (!name) return 'U'; const p = name.trim().split(' '); return (p[0]?.[0] || '') + (p[1]?.[0] || ''); };
  const avatarGradients = ['from-violet-500 to-purple-500', 'from-teal-500 to-emerald-500', 'from-rose-500 to-pink-500', 'from-blue-500 to-cyan-500', 'from-orange-500 to-amber-500'];

  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc] font-sans">
      <DashboardHeader title="Dashboard" subtitle="Overview of your hiring pipeline" />
      <main className="p-4 sm:p-6 space-y-6 animate-fade-in-up">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
          {statMeta.map((card, i) => (
            <div key={i} className="metric-card p-5 group cursor-default">
              <div className="metric-card-accent" />
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center transition-transform group-hover:scale-105`}>
                  <card.icon size={17} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 pt-0.5">{card.title}</span>
              </div>
              <p className="text-[32px] font-extrabold text-slate-900 tracking-tight leading-none" style={{ fontFamily: 'Sora' }}>
                {statValues[i].toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ animationDelay: '200ms' }}>
          <div className="lg:col-span-2 surface-raised p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900" style={{ fontFamily: 'Sora' }}>Pipeline overview</h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Stage-by-stage conversion</p>
              </div>
              <span className="badge-premium badge-violet">Live</span>
            </div>
            <BarChart data={pipelineData} />
          </div>

          <div className="surface-raised p-5">
            <h2 className="text-[15px] font-bold text-slate-900 mb-5" style={{ fontFamily: 'Sora' }}>By department</h2>
            <DonutChart segments={jobSegments} />
            <div className="mt-4 space-y-1">
              {jobSegments.map((seg: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-[11px] group hover:bg-slate-50 rounded-lg px-2 py-1.5 -mx-1 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color }} />
                    <span className="text-slate-600 font-semibold">{seg.label}</span>
                  </div>
                  <span className="font-bold text-slate-900">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Applications ── */}
        <div className="surface-raised overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-[15px] font-bold text-slate-900" style={{ fontFamily: 'Sora' }}>Recent applications</h2>
            <button className="text-[11px] font-bold text-violet-600 hover:text-violet-700 flex items-center gap-0.5 transition-colors active:scale-[0.98] cursor-pointer">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-slate-50 list-slide-in">
            {recentApplications.length > 0 ? recentApplications.map((app: any, i: number) => {
              const name = app.candidate_name || app.user_name || 'Candidate';
              return (
                <div key={app.id || i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-all group cursor-pointer">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center text-white font-bold text-[10px] uppercase shrink-0 shadow-sm`}>
                    {getInitials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 leading-tight group-hover:text-violet-600 transition-colors">{name}</p>
                    <p className="text-[11px] text-slate-400 font-semibold leading-tight truncate mt-0.5">{app.job_title || 'Position'}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {app.ai_score && (
                      <span className="text-[10px] font-extrabold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-lg">
                        {app.ai_score}% fit
                      </span>
                    )}
                    <span className={`tag-pill ${getStatusStyle(app.status)}`}>{app.status || 'Applied'}</span>
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:block">{app.created_at ? new Date(app.created_at).toLocaleDateString('en-CA') : '—'}</span>
                  </div>
                </div>
              );
            }) : (
              <div className="py-14 text-center">
                <p className="text-[12px] font-semibold text-slate-400">No recent applications found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
