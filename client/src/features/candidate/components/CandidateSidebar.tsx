import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, FileText, Video,
  User, LogOut, UserCircle, X, Gift,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { logout } from '../../auth/auth.slice';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/candidate/dashboard' },
  { icon: Briefcase, label: 'Find Jobs', path: '/candidate/jobs' },
  { icon: FileText, label: 'My Applications', path: '/candidate/applications' },
  { icon: Video, label: 'Interviews', path: '/candidate/interviews' },
  { icon: Gift, label: 'Offers', path: '/candidate/offers' },
  { icon: User, label: 'Profile', path: '/candidate/profile' },
];

interface CandidateSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CandidateSidebar = ({ isOpen, onClose }: CandidateSidebarProps) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div
      className={cn(
        'w-[220px] h-screen bg-white text-slate-600 flex flex-col fixed top-0 z-50 border-r border-slate-200 transition-transform duration-300 ease-out',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <UserCircle size={16} />
          </div>
          <div>
            <h2 className="text-slate-900 text-[14px] font-bold tracking-tight leading-none">RecruitAI</h2>
            <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-[0.12em] font-semibold leading-none">Candidate</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 mt-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 group relative text-[13px] font-medium cursor-pointer',
                isActive
                  ? 'bg-violet-50 text-violet-700 font-semibold'
                  : 'hover:bg-slate-50 hover:text-slate-900 text-slate-500',
              )}
            >
              {isActive && (
                <div className="absolute left-0 w-[3px] h-5 bg-violet-600 rounded-r-full" />
              )}
              <item.icon
                size={17}
                className={cn(
                  'shrink-0 transition-colors',
                  isActive ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-600',
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 mt-auto border-t border-slate-100">
        <div className="flex items-center gap-2.5 px-3 py-2.5 mb-2 rounded-lg bg-slate-50">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'C'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-slate-800 truncate leading-tight">{user?.name || 'Candidate'}</p>
            <p className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider leading-tight">Candidate</p>
          </div>
        </div>
        <button
          onClick={() => dispatch(logout())}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors group text-[12px] font-medium cursor-pointer"
        >
          <LogOut size={15} className="group-hover:-translate-x-0.5 transition-transform shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
