import { Menu } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useOutletContext } from 'react-router-dom';
import type { RootState } from '../../app/store';
import { NotificationBell } from './NotificationBell';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
}

export const DashboardHeader = ({ title, subtitle }: DashboardHeaderProps) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const context = useOutletContext<{ onToggleSidebar?: () => void }>();

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => context?.onToggleSidebar?.()}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1
            className="text-[15px] font-semibold tracking-tight text-slate-900 leading-none"
          >
            {title}
          </h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">

        <NotificationBell />

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-[12px] font-medium text-slate-700 leading-none">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 font-normal leading-none mt-0.5">{user?.email || ''}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-semibold text-[11px] uppercase shrink-0">
            {user?.name?.[0] || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
