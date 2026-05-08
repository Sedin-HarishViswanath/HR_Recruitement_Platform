import { BarChart3, TrendingUp, Users, Briefcase } from 'lucide-react';
import { DashboardHeader } from '../../shared/components/DashboardHeader';

export const CompanyAnalyticsPage = () => {

  const metrics = [
    { label: 'Applications This Month', value: '24', change: '+12%', up: true },
    { label: 'Avg. Time to Hire', value: '18d', change: '-3d', up: true },
    { label: 'Interview Pass Rate', value: '64%', change: '+5%', up: true },
    { label: 'Offer Acceptance Rate', value: '78%', change: '-2%', up: false },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-#f8fafc]">
      <DashboardHeader title="Analytics" subtitle="Track your hiring performance and pipeline metrics" />

      <main className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{m.label}</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{m.value}</p>
              <p className={`text-[10px] font-semibold mt-1 [${m.up ? 'text-emerald-600' : 'text-red-500'}`}>{m.change}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm text-center">
          <BarChart3 size={40} className="mx-auto text-blue-200 mb-3" />
          <h3 className="text-[14px] font-bold text-slate-700 mb-1">Detailed Analytics Coming Soon</h3>
          <p className="text-[12px] text-slate-400 font-medium">Connect your data sources to view in-depth hiring analytics.</p>
        </div>
      </main>
    </div>
  );
};
