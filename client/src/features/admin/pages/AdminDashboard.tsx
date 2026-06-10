import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { Users, Briefcase, Activity, MoreVertical } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardHeader } from '../../../shared/components/DashboardHeader';
import { toast } from 'sonner';

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { data: res } = await api.get('/analytics/admin');
        setData(res.data);
      } catch {
        toast.error('Failed to load admin analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const statMeta = [
    { label: 'Total companies', key: 'totalCompanies', icon: Briefcase, colorClass: 'bg-violet-50 border-violet-100 text-violet-600' },
    { label: 'Total jobs', key: 'totalJobs', icon: Briefcase, colorClass: 'bg-blue-50 border-blue-100 text-blue-600' },
    { label: 'Total applications', key: 'totalApplications', icon: Users, colorClass: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Admin Dashboard" subtitle="Platform-wide overview" />
      <main className="p-4 sm:p-5 lg:p-6 space-y-5 animate-fade-in">
        <div className="max-w-[1400px] mx-auto space-y-5">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-[12px] text-slate-400 font-medium">Loading...</p>
            </div>
          ) : !data ? (
            <div className="py-20 text-center text-slate-400 font-medium text-sm">Failed to load data</div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {statMeta.map((s, i) => (
                  <div key={i} className="metric-card p-4 sm:p-5 flex items-center gap-4 group cursor-default">
                    <div className="metric-card-accent" />
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform border ${s.colorClass}`}>
                      <s.icon size={18} />
                    </div>
                    <div>
                      <p className="section-eyebrow mb-0.5">{s.label}</p>
                      <h4 className="text-[22px] font-extrabold text-slate-900 leading-none" style={{ fontFamily: 'Sora' }}>
                        {data.kpis?.[s.key] || 0}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                <div className="lg:col-span-2 panel p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                        <Activity size={12} />
                      </div>
                      <h3 className="font-bold text-slate-900 tracking-tight text-[13px]" style={{ fontFamily: 'Sora' }}>Companies by Status</h3>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                      <MoreVertical size={15} />
                    </button>
                  </div>
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.companiesByStatus || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={8} />
                        <YAxis hide />
                        <Tooltip
                          cursor={{ fill: 'rgba(124,92,246,0.08)' }}
                          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontFamily: 'Inter', fontSize: 12 }}
                        />
                        <Bar dataKey="count" fill="url(#barGradient)" radius={[5, 5, 0, 0]} barSize={30} />
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a78bfa" />
                            <stop offset="100%" stopColor="#7c3aed" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="panel p-4 sm:p-5">
                  <h3 className="font-bold text-slate-900 tracking-tight mb-4 text-[13px]" style={{ fontFamily: 'Sora' }}>Top Companies</h3>
                  <div className="space-y-2.5 list-slide-in">
                    {(data.topCompanies || []).map((company: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-[12px] font-medium border-b border-slate-100 pb-2 last:border-0 group hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold tabular-nums group-hover:bg-violet-700 transition-colors">{i + 1}</div>
                          <span className="text-slate-700 group-hover:text-violet-600 transition-colors truncate max-w-[100px]">{company.name}</span>
                        </div>
                        <span className="text-slate-900 font-semibold shrink-0">{company.jobs_count} jobs</span>
                      </div>
                    ))}
                    {(!data.topCompanies || data.topCompanies.length === 0) && (
                      <div className="text-slate-400 text-[12px] font-medium py-4 text-center">No companies found.</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
