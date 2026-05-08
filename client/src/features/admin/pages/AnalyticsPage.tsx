import { DashboardHeader } from '../../../shared/components/DashboardHeader';
import { BarChart3 } from 'lucide-react';

export const SuperAdminAnalyticsPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <DashboardHeader 
        title="Platform Analytics" 
        subtitle="Global metrics and performance tracking" 
      />
      <main className="p-8">
        <div className="bg-white rounded-[32px] border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
            <BarChart3 size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Platform Analytics</h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto">
            This module is under construction. Detailed platform metrics will be available here soon.
          </p>
        </div>
      </main>
    </div>
  );
};
