import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { Users, Briefcase, TrendingUp, MoreVertical, BarChart3, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardHeader } from '../../../shared/components/DashboardHeader';
import { toast } from 'sonner';

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try { setLoading(true); const { data: res } = await api.get('/analytics/admin'); setData(res.data); }
      catch { toast.error('Failed to load admin analytics'); }
      finally { setLoading(false); }
    };
    fetchAnalytics();
  }, []);

  const statMeta = [
    { label: 'Total Companies', key: 'totalCompanies', icon: Briefcase, gradient: 'from-amber-500 to-orange-500' },
    { label: 'Total Jobs', key: 'totalJobs', icon: Briefcase, gradient: 'from-teal-500 to-emerald-500' },
    { label: 'Total Applications', key: 'totalApplications', icon: Users, gradient: 'from-violet-500 to-purple-500' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f5f7]">
      <DashboardHeader title="Admin Dashboard" subtitle="Platform-wide overview" />
      <main className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
        {loading ? (
          <div className="py-16 text-center"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-[13px] text-slate-400 font-medium">Loading...</p></div>
        ) : !data ? (
          <div className="py-20 text-center text-slate-400 font-medium">Failed to load data</div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-stagger">
              {statMeta.map((s, i) => (
                <div key={i} className="stat-card p-5 group cursor-pointer" style={{ '--stat-gradient': `linear-gradient(90deg, var(--tw-gradient-stops))` } as any}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em]">{s.label}</p>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}>
                      <s.icon size={17} />
                    </div>
                  </div>
                  <h4 className="text-3xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'Sora' }}>{data.kpis?.[s.key] || 0}</h4>
                  <p className="text-[10px] font-semibold mt-1.5 text-amber-600">System-wide</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="lg:col-span-2 card-premium p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><Activity size={14} /></div>
                    <h3 className="font-bold text-slate-900 tracking-tight text-[14px]" style={{ fontFamily: 'Sora' }}>Companies by Status</h3>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 transition-colors"><MoreVertical size={16} /></button>
                </div>
                <div className="h-[260px] sm:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.companiesByStatus || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={10} />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: '#fef3c7' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontFamily: 'DM Sans' }} />
                      <Bar dataKey="count" fill="url(#barGradient)" radius={[8, 8, 0, 0]} barSize={36} />
                      <defs><linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#f97316" /></linearGradient></defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card-premium p-5 sm:p-6">
                <h3 className="font-bold text-slate-900 tracking-tight mb-5 text-[14px]" style={{ fontFamily: 'Sora' }}>Top Companies</h3>
                <div className="space-y-3 list-slide-in">
                  {(data.topCompanies || []).map((company: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[13px] font-medium border-b border-slate-100 pb-2.5 last:border-0 group hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-[10px] font-bold group-hover:scale-105 transition-transform">{i + 1}</div>
                        <span className="text-slate-700 group-hover:text-amber-600 transition-colors">{company.name}</span>
                      </div>
                      <span className="text-slate-900 font-semibold">{company.jobs_count} jobs</span>
                    </div>
                  ))}
                  {(!data.topCompanies || data.topCompanies.length === 0) && <div className="text-slate-400 text-[13px] font-medium py-4 text-center">No companies found.</div>}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
