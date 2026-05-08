import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { Users, Briefcase, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight, ChevronRight, Activity } from 'lucide-react';
import { DashboardHeader } from '../../../shared/components/DashboardHeader';

const BarChart = ({ data }: { data: { label: string; value: number }[] }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 sm:gap-3 h-44 pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 flex-1 group">
          <div className="relative w-full">
            <div
              className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-lg transition-all duration-700 ease-out cursor-pointer group-hover:from-amber-400 group-hover:to-orange-400 group-hover:shadow-lg group-hover:shadow-amber-500/20"
              style={{ height: `${(d.value / max) * 140}px`, minHeight: d.value > 0 ? '6px' : '0', animationDelay: `${i * 80}ms` }}
            />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{d.value}</div>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold text-center leading-tight">{d.label}</span>
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
            <p className="text-xl font-extrabold text-slate-900" style={{ fontFamily: 'Sora' }}>{total}</p>
            <p className="text-[9px] text-slate-400 font-semibold uppercase">Total</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const statMeta = [
  { title: 'Applications', icon: Users, gradient: 'from-amber-500 to-orange-500', trendUp: true, trend: '+12%' },
  { title: 'Open Positions', icon: Briefcase, gradient: 'from-teal-500 to-emerald-500', trendUp: true, trend: '+5%' },
  { title: 'Interviews', icon: Calendar, gradient: 'from-violet-500 to-purple-500', trendUp: false, trend: '-8%' },
  { title: 'Candidates', icon: TrendingUp, gradient: 'from-rose-500 to-pink-500', trendUp: true, trend: '+3%' },
];

export const CompanyDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try { const { data: res } = await api.get('/analytics/company/stats'); setData(res.data); }
      catch { console.error('Failed to fetch dashboard data'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-[#f4f5f7]">
      <DashboardHeader title="Dashboard" subtitle="Loading..." />
      <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
    </div>
  );
  if (!data) return <div className="p-8 text-center font-bold text-red-500">Failed to load dashboard.</div>;

  const { stats, pipelineData, jobSegments, recentApplications } = data;
  const statValues = [stats.applications, stats.jobs, stats.interviews, stats.candidates];

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
  const avatarGradients = ['from-amber-400 to-orange-500', 'from-teal-400 to-emerald-500', 'from-violet-400 to-purple-500', 'from-rose-400 to-pink-500', 'from-sky-400 to-blue-500'];

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f5f7]">
      <DashboardHeader title="Dashboard" subtitle="Overview of your hiring pipeline" />
      <main className="p-4 sm:p-6 space-y-6">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
          {statMeta.map((card, i) => (
            <div key={i} className="stat-card p-5 group cursor-pointer" style={{ '--stat-gradient': `linear-gradient(90deg, var(--tw-gradient-stops))` } as any}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{card.title}</p>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}>
                  <card.icon size={17} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-2" style={{ fontFamily: 'Sora' }}>{statValues[i]}</p>
              <div className={`flex items-center gap-1 text-[10px] font-semibold ${card.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                {card.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                <span>{card.trend} vs last month</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="lg:col-span-2 card-premium p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><Activity size={14} /></div>
                <h2 className="text-[14px] font-bold text-slate-800" style={{ fontFamily: 'Sora' }}>Pipeline Overview</h2>
              </div>
            </div>
            <BarChart data={pipelineData} />
          </div>
          <div className="card-premium p-5">
            <h2 className="text-[14px] font-bold text-slate-800 mb-3" style={{ fontFamily: 'Sora' }}>By Job</h2>
            <DonutChart segments={jobSegments} />
            <div className="mt-3 space-y-1.5">
              {jobSegments.map((seg: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-[11px] group hover:bg-slate-50 rounded-lg p-1 -mx-1 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} /><span className="text-slate-600 font-medium">{seg.label}</span></div>
                  <span className="font-bold text-slate-800">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Applications ── */}
        <div className="card-premium animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Users size={14} /></div>
              <h2 className="text-[14px] font-bold text-slate-800" style={{ fontFamily: 'Sora' }}>Recent Applications</h2>
            </div>
            <button className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-0.5 transition-colors">View all <ChevronRight size={12} /></button>
          </div>
          <div className="divide-y divide-slate-50 list-slide-in">
            {recentApplications.length > 0 ? recentApplications.map((app: any, i: number) => {
              const name = app.candidate_name || app.user_name || 'Candidate';
              return (
                <div key={app.id || i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-all group cursor-pointer">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center text-white font-bold text-[10px] uppercase shrink-0 group-hover:scale-105 transition-transform`}>
                    {getInitials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 leading-tight group-hover:text-amber-600 transition-colors">{name}</p>
                    <p className="text-[11px] text-slate-400 font-medium leading-tight truncate">{app.job_title || 'Position'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`tag-pill ${getStatusStyle(app.status)}`}>{app.status || 'Applied'}</span>
                    {app.ai_score && <span className="tag-pill bg-amber-50 text-amber-700 border-amber-200">AI {app.ai_score}%</span>}
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:block">{app.created_at ? new Date(app.created_at).toLocaleDateString('en-CA') : '—'}</span>
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
