import { DashboardHeader } from '../../../shared/components/DashboardHeader';
import { Users } from 'lucide-react';

export const SuperAdminUsersPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <DashboardHeader
        title="User Management"
        subtitle="Manage all platform users across organizations"
      />
      <main className="p-4 sm:p-5 lg:p-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center shadow-sm">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
              <Users size={28} />
            </div>
            <h2 className="text-lg font-black text-stone-900 mb-2">User Management</h2>
            <p className="text-stone-500 font-medium max-w-md mx-auto text-sm">
              This module is under construction. Platform-wide user management will be available here soon.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
