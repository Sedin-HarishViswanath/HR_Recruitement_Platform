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

  const initials = user?.name
    ? user.name.trim().split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => context?.onToggleSidebar?.()}
          className="lg:hidden p-2 -ml-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
        >
          <Menu size={18} />
        </button>

        <div>
          <h1 className="text-[15px] font-bold tracking-tight text-slate-900 leading-none" style={{ fontFamily: 'Sora, sans-serif' }}>
            {title}
          </h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-none">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-100">
          <div className="text-right hidden sm:block">
            <p className="text-[12px] font-semibold text-slate-800 leading-none">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">{user?.role || ''}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white font-bold text-[11px] uppercase shrink-0 shadow-sm shadow-violet-200">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};
