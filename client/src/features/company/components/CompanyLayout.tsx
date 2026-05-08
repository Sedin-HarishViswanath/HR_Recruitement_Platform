import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CompanySidebar } from './CompanySidebar';

export const CompanyLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f4f5f7]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <CompanySidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 lg:ml-[220px] min-h-screen transition-all duration-300">
        <Outlet context={{ onToggleSidebar: () => setSidebarOpen(true) }} />
      </main>
    </div>
  );
};
