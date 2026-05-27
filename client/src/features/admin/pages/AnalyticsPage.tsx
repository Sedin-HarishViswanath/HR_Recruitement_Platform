import { useState, useEffect } from 'react';
import { DashboardHeader } from '../../../shared/components/DashboardHeader';
import { Briefcase, Users, Activity } from 'lucide-react';
import { api } from '../../../shared/lib/api';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const SuperAdminAnalyticsPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { data: res } = await api.get('/analytics/admin');
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load platform analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <DashboardHeader title="Platform Analytics" subtitle="Loading..." />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!data) return <div className="p-8 text-center text-red-500 font-medium">Failed to load data</div>;

  const statMeta = [
    { label: 'Total Companies', value: data.kpis?.totalCompanies || 0, icon: Briefcase, gradient: 'from-amber-500 to-orange-500' },
    { label: 'Total Jobs', value: data.kpis?.totalJobs || 0, icon: Briefcase, gradient: 'from-teal-500 to-emerald-500' },
    { label: 'Total Applications', value: data.kpis?.totalApplications || 0, icon: Users, gradient: 'from-violet-500 to-purple-500' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <DashboardHeader 
        title="Platform Analytics" 
        subtitle="Global metrics and performance tracking" 
      />
      <main className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statMeta.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                <p className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>{s.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white shadow-sm`}>
                <s.icon size={20} />
              </div>
            </div>
          ))}
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Companies By Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Activity size={16} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-[15px]" style={{ fontFamily: 'Sora, sans-serif' }}>Companies by Status</h3>
                <p className="text-xs text-slate-400 font-medium">Distribution of registered companies</p>
              </div>
            </div>
            
            <div className="h-[280px] w-full">
              {data.companiesByStatus && data.companiesByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.companiesByStatus}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm font-medium text-slate-400">No data available</div>
              )}
            </div>
          </div>

          {/* Top Companies */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 text-[15px]" style={{ fontFamily: 'Sora, sans-serif' }}>Top Companies by Jobs</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Companies with the most active job postings</p>
            </div>
            
            <div className="space-y-4">
              {data.topCompanies && data.topCompanies.length > 0 ? data.topCompanies.map((company: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                      #{i + 1}
                    </div>
                    <span className="font-semibold text-slate-800">{company.name}</span>
                  </div>
                  <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    {company.jobs_count} jobs
                  </span>
                </div>
              )) : (
                <div className="py-8 text-center text-sm font-medium text-slate-400">No top companies found</div>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
