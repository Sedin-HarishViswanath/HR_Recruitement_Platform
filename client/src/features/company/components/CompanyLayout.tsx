import { Outlet } from 'react-router-dom';
import { CompanySidebar } from './CompanySidebar';

export const CompanyLayout = () => {
  return (
    <div className="flex">
      <CompanySidebar />
      <main className="flex-1 ml-64 min-h-screen bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
};
