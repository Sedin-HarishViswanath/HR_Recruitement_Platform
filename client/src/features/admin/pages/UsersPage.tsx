import { DashboardHeader } from '../../../shared/components/DashboardHeader';
import { Users, ShieldCheck, Mail } from 'lucide-react';

export const SuperAdminUsersPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <DashboardHeader 
        title="User Management" 
        subtitle="Manage all platform users across organizations" 
      />
      <main className="p-8">
        <div className="bg-white rounded-[32px] border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-6">
            <Users size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">User Management</h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto">
            This module is under construction. Soon you will be able to manage all platform users here.
          </p>
        </div>
      </main>
    </div>
  );
};
