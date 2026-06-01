import { useState, useEffect } from 'react';
import { Users, Briefcase, Award, Activity } from 'lucide-react';
import { api } from '../../shared/lib/api';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const CompanyAnalyticsPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { data: res } = await api.get('/analytics/company');
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc]">
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40">
        <div>
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <span>Workspace</span><span>&rsaquo;</span><span className="text-slate-600 font-semibold">Analytics</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>Hiring Analytics</h1>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!data) return <div className="p-8 text-center text-red-500 font-medium">Failed to load data</div>;

  const metrics = [
    { label: 'Total Applications', value: data.kpis?.totalApplications || 0, icon: Users, color: 'text-violet-600 bg-violet-50' },
    { label: 'Active Candidates', value: data.kpis?.activeCandidates || 0, icon: Activity, color: 'text-sky-600 bg-sky-50' },
    { label: 'Total Jobs', value: data.kpis?.totalJobs || 0, icon: Briefcase, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Hired Candidates', value: data.kpis?.hiredCount || 0, icon: Award, color: 'text-rose-600 bg-rose-50' },
  ];

  // Map backend funnel statuses
  const funnelData = (data.funnel || []).map((f: any) => {
    const total = data.kpis?.totalApplications || 1;
    const count = parseInt(f.count as string) || 0;
    const pct = Math.round((count / total) * 100);
    return {
      stage: f.status ? f.status.charAt(0).toUpperCase() + f.status.slice(1) : 'Unknown',
      count,
      pct,
      color: f.status === 'hired' ? 'bg-teal-500' :
             f.status === 'offer' ? 'bg-emerald-500' :
             f.status === 'shortlisted' ? 'bg-sky-500' :
             f.status === 'screening' ? 'bg-indigo-500' :
             f.status === 'rejected' ? 'bg-rose-500' : 'bg-violet-600',
    };
  }).sort((a: any, b: any) => b.count - a.count);

  const overTimeData = (data.overTime || []).map((t: any) => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: parseInt(t.count as string) || 0
  }));

  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc]">
      {/* Workspace Header Bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40">
        <div>
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <span>Workspace</span>
            <span>&rsaquo;</span>
            <span className="text-slate-600 font-semibold">Analytics</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
            Hiring Analytics
          </h1>
        </div>
      </div>

      <main className="p-5 max-w-[1400px] w-full mx-auto space-y-6 animate-fade-in flex-1 flex flex-col">
        
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-0.5">{m.label}</p>
                <p className="text-xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>{m.value}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.color}`}>
                <m.icon size={16} />
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Funnel Pipeline Chart */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Hiring Funnel</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Application count by current status.</p>
            </div>
            
            <div className="space-y-3 pt-2">
              {funnelData.length > 0 ? funnelData.map((stage: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{stage.stage}</span>
                    <span className="text-slate-400">{stage.count} <span className="text-[10px] font-medium">({stage.pct}%)</span></span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                    <div className={`h-full rounded-full transition-all duration-1000 ${stage.color}`} style={{ width: `${Math.max(stage.pct, 2)}%` }} />
                  </div>
                </div>
              )) : (
                <div className="text-center text-[12px] font-medium text-slate-400 py-6">No funnel data available.</div>
              )}
            </div>
          </div>

          {/* Applications Over Time */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4 flex flex-col">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Applications Over Time</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Trend of applications received in the last 30 days.</p>
            </div>

            <div className="flex-1 min-h-[200px] pt-4 w-full">
              {overTimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overTimeData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} dy={10} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px' }} 
                      labelStyle={{ color: '#64748b', fontWeight: 600, marginBottom: '4px' }}
                      itemStyle={{ color: '#0f172a', fontWeight: 700 }}
                    />
                    <Area type="monotone" dataKey="count" name="Applications" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[12px] font-medium text-slate-400">No applications in the last 30 days.</div>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
