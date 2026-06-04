import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CandidateSidebar } from './CandidateSidebar';

export const CandidateLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <CandidateSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 lg:ml-[220px] min-h-screen transition-all duration-300">
        <Outlet context={{ onToggleSidebar: () => setSidebarOpen(true) }} />
      </main>
    </div>
  );
};
