import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  UserSearch,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  BarChart3,
  X,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { logout } from '../../auth/auth.slice';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/company/dashboard' },
  { icon: FileText, label: 'Applications', path: '/company/applications' },
  { icon: Briefcase, label: 'Jobs', path: '/company/jobs' },
  { icon: Calendar, label: 'Interviews', path: '/company/interviews' },
  { icon: MessageSquare, label: 'Feedback', path: '/company/feedback' },
  { icon: UserSearch, label: 'Candidates', path: '/company/candidates' },
  { icon: BarChart3, label: 'Analytics', path: '/company/analytics' },
];

interface CompanySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanySidebar = ({ isOpen, onClose }: CompanySidebarProps) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div
      className={cn(
        "w-[220px] h-screen bg-[#0b0f1a] text-slate-400 flex flex-col fixed top-0 z-50 border-r border-white/[0.06] transition-transform duration-300 ease-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo + Close */}
      <div className="px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
            <Briefcase size={16} />
          </div>
          <div>
            <h2 className="text-white text-[14px] font-bold tracking-tight leading-none" style={{ fontFamily: 'Sora, sans-serif' }}>RecruitAI</h2>
            <p className="text-[9px] text-amber-500/70 mt-0.5 uppercase tracking-[0.15em] font-semibold leading-none">Company</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white transition-colors p-1">
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 mt-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 group relative text-[13px] font-medium",
                isActive
                  ? "bg-amber-500/10 text-amber-400"
                  : "hover:bg-white/[0.04] hover:text-slate-200 text-slate-500"
              )}
            >
              {isActive && (
                <div className="absolute left-0 w-[3px] h-5 bg-amber-400 rounded-r-full" />
              )}
              <item.icon size={17} className={cn(
                "shrink-0 transition-colors",
                isActive ? "text-amber-400" : "text-slate-600 group-hover:text-slate-300"
              )} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 mt-auto border-t border-white/[0.06]">
        {/* User card */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 mb-2 rounded-xl bg-white/[0.03]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white truncate leading-tight">{user?.name || 'Admin'}</p>
            <p className="text-[9px] text-amber-500/60 uppercase font-semibold tracking-wider leading-tight truncate">{user?.role || 'Admin'}</p>
          </div>
        </div>

        <Link
          to="/company/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors group text-[12px] font-medium text-slate-500 hover:text-slate-300"
        >
          <Settings size={15} className="group-hover:rotate-45 transition-transform duration-500 shrink-0" />
          <span>Settings</span>
        </Link>

        <button
          onClick={() => dispatch(logout())}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:text-red-400 transition-colors group text-[12px] font-medium"
        >
          <LogOut size={15} className="group-hover:-translate-x-0.5 transition-transform shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
