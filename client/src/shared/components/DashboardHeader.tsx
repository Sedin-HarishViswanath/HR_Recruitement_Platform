import { Search, Menu } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useOutletContext } from 'react-router-dom';
import type { RootState } from '../../app/store';
import { NotificationBell } from './NotificationBell';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  showSearch?: boolean;
}

export const DashboardHeader = ({ title, subtitle, showSearch = true }: DashboardHeaderProps) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const context = useOutletContext<{ onToggleSidebar?: () => void }>();

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => context?.onToggleSidebar?.()}
          className="lg:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1
            className="text-[16px] font-bold tracking-tight text-slate-900 leading-none"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            {title}
          </h1>
          <p className="text-[11px] text-slate-400 font-medium mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showSearch && (
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search anything..."
              className="bg-slate-50/80 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-[13px] w-52 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>
        )}

        <NotificationBell />

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200/60">
          <div className="text-right hidden sm:block">
            <p className="text-[12px] font-semibold text-slate-800 leading-none">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">{user?.email || ''}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-[12px] shadow-sm uppercase shrink-0">
            {user?.name?.[0] || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
