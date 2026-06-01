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
  Users,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { logout } from '../../auth/auth.slice';

interface CompanySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanySidebar = ({ isOpen, onClose }: CompanySidebarProps) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const isAdmin = user?.role === 'Admin';
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/company/dashboard' },
    { icon: FileText, label: 'Applications', path: '/company/applications' },
    { icon: Briefcase, label: 'Jobs', path: '/company/jobs' },
    { icon: Calendar, label: 'Interviews', path: '/company/interviews' },
    { icon: MessageSquare, label: 'Feedback', path: '/company/feedback' },
    { icon: UserSearch, label: 'Candidates', path: '/company/candidates' },
    ...(isAdmin ? [{ icon: Users, label: 'Team', path: '/company/users' }] : []),
    { icon: BarChart3, label: 'Analytics', path: '/company/analytics' },
  ];

  return (
    <div
      className={cn(
        "w-[220px] h-screen bg-white text-slate-600 flex flex-col fixed top-0 z-50 border-r border-slate-200 transition-transform duration-300 ease-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo + Close */}
      <div className="px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <span className="text-[14px] font-bold">R</span>
          </div>
          <div>
            <h2 className="text-slate-900 text-[14px] font-bold tracking-tight leading-none">RecruitAI</h2>
            <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-[0.12em] font-semibold leading-none">COMPANY</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors p-1">
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
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 group relative text-[13px] font-medium",
                isActive
                  ? "bg-violet-50 text-violet-700 font-semibold"
                  : "hover:bg-slate-50 hover:text-slate-900 text-slate-500"
              )}
            >
              {isActive && (
                <div className="absolute left-0 w-[3px] h-5 bg-violet-600 rounded-r-full" />
              )}
              <item.icon size={17} className={cn(
                "shrink-0 transition-colors",
                isActive ? "text-violet-600" : "text-slate-400 group-hover:text-slate-600"
              )} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 mt-auto border-t border-slate-100">
        {/* User card */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 mb-2 rounded-lg bg-slate-50">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-slate-800 truncate leading-tight">{user?.name || 'Admin'}</p>
            <p className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider leading-tight truncate">{user?.role || 'Admin'}</p>
          </div>
        </div>

        <Link
          to="/company/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors group text-[12px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50"
        >
          <Settings size={15} className="group-hover:rotate-45 transition-transform duration-500 shrink-0" />
          <span>Settings</span>
        </Link>

        <button
          onClick={() => dispatch(logout())}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors group text-[12px] font-medium"
        >
          <LogOut size={15} className="group-hover:-translate-x-0.5 transition-transform shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
