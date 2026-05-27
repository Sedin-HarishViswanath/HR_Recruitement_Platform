import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { Users, Briefcase, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
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
    <div className="flex flex-col min-h-screen bg-[#fafbfc]">
      <DashboardHeader title="Dashboard" subtitle="Overview of your hiring pipeline" />
      <main className="p-4 sm:p-6 space-y-5">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
          {statMeta.map((card, i) => (
            <div key={i} className="stat-card p-5 group cursor-default">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{card.title}</p>
                <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center`}>
                  <card.icon size={16} />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 tracking-tight leading-none mb-2">{statValues[i].toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="lg:col-span-2 card-premium p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-[14px] font-semibold text-slate-800">Pipeline overview</h2>
                <p className="text-[11px] text-slate-400 font-normal">Stage-by-stage conversion</p>
              </div>
            </div>
            <BarChart data={pipelineData} />
          </div>
          <div className="card-premium p-5">
            <h2 className="text-[14px] font-semibold text-slate-800 mb-3">By department</h2>
            <DonutChart segments={jobSegments} />
            <div className="mt-3 space-y-1.5">
              {jobSegments.map((seg: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-[11px] group hover:bg-slate-50 rounded-lg p-1 -mx-1 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} /><span className="text-slate-600 font-medium">{seg.label}</span></div>
                  <span className="font-semibold text-slate-800">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Applications ── */}
        <div className="card-premium animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-[14px] font-semibold text-slate-800">Recent applications</h2>
            <button className="text-[11px] font-medium text-violet-600 hover:text-violet-700 flex items-center gap-0.5 transition-colors">View all <ChevronRight size={12} /></button>
          </div>
          <div className="divide-y divide-slate-50 list-slide-in">
            {recentApplications.length > 0 ? recentApplications.map((app: any, i: number) => {
              const name = app.candidate_name || app.user_name || 'Candidate';
              return (
                <div key={app.id || i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-all group cursor-pointer">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center text-white font-semibold text-[10px] uppercase shrink-0`}>
                    {getInitials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-slate-800 leading-tight">{name}</p>
                    <p className="text-[11px] text-slate-400 font-normal leading-tight truncate">{app.job_title || 'Position'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {app.ai_score && <span className="text-[11px] font-semibold text-slate-700">{app.ai_score}</span>}
                    <span className={`tag-pill ${getStatusStyle(app.status)}`}>{app.status || 'Applied'}</span>
                    <span className="text-[10px] text-slate-400 font-normal hidden sm:block">{app.created_at ? new Date(app.created_at).toLocaleDateString('en-CA') : '—'}</span>
                  </div>
                </div>
              );
            }) : (
              <div className="py-10 text-center text-[12px] font-medium text-slate-400">No recent applications found.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
