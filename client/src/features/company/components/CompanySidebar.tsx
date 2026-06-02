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
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { logout } from '../../auth/auth.slice';

interface CompanySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/company/dashboard' },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { icon: FileText, label: 'Applications', path: '/company/applications' },
      { icon: Briefcase, label: 'Jobs', path: '/company/jobs' },
      { icon: Calendar, label: 'Interviews', path: '/company/interviews' },
      { icon: MessageSquare, label: 'Feedback', path: '/company/feedback' },
      { icon: UserSearch, label: 'Candidates', path: '/company/candidates' },
    ],
  },
  {
    label: 'Reporting',
    items: [
      { icon: BarChart3, label: 'Analytics', path: '/company/analytics' },
    ],
    adminOnly: false,
  },
];

const ADMIN_ITEMS = [{ icon: Users, label: 'Team', path: '/company/users' }];

export const CompanySidebar = ({ isOpen, onClose }: CompanySidebarProps) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const isAdmin = user?.role === 'Admin';

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div
      className={cn(
        'w-[220px] h-screen flex flex-col fixed top-0 z-50 transition-transform duration-300 ease-out sidebar-dark',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {/* ── Logo ── */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-900/40 shrink-0 relative">
            <Sparkles size={14} />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <div>
            <h2 className="text-white text-[14px] font-extrabold tracking-tight leading-none" style={{ fontFamily: 'Sora' }}>
              RecruitAI
            </h2>
            <p className="text-[8.5px] mt-0.5 uppercase tracking-[0.15em] font-bold" style={{ color: 'rgba(139,92,246,0.8)' }}>
              Company
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg transition-colors"
          style={{ color: 'rgba(148,163,184,0.7)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(148,163,184,0.7)')}
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Divider ── */}
      <div className="mx-5 mb-3 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-4 pb-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="sidebar-dark-section-label">{section.label}</p>
            <div className="space-y-0.5 mt-1">
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      'sidebar-dark-link group',
                      active ? 'sidebar-dark-link-active' : '',
                    )}
                  >
                    {active && <div className="sidebar-dark-indicator" />}
                    <item.icon
                      size={16}
                      className={cn(
                        'shrink-0 transition-colors',
                        active ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300',
                      )}
                    />
                    <span>{item.label}</span>
                    {active && (
                      <ChevronRight size={12} className="ml-auto text-violet-500/60" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {isAdmin && (
          <div>
            <p className="sidebar-dark-section-label">Admin</p>
            <div className="space-y-0.5 mt-1">
              {ADMIN_ITEMS.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={cn('sidebar-dark-link group', active ? 'sidebar-dark-link-active' : '')}
                  >
                    {active && <div className="sidebar-dark-indicator" />}
                    <item.icon
                      size={16}
                      className={cn(
                        'shrink-0',
                        active ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300',
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* ── Bottom ── */}
      <div className="px-3 pb-4 mt-auto shrink-0">
        <div className="h-px mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Settings */}
        <Link
          to="/company/settings"
          onClick={onClose}
          className="sidebar-dark-link group mb-0.5"
        >
          <Settings
            size={15}
            className="text-slate-500 group-hover:text-slate-300 transition-all group-hover:rotate-45 duration-500 shrink-0"
          />
          <span>Settings</span>
        </Link>

        {/* User card */}
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 mt-1.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md shadow-violet-900/30">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-slate-200 truncate leading-tight">{user?.name || 'Admin'}</p>
            <p className="text-[9px] uppercase font-bold tracking-wider leading-tight truncate" style={{ color: 'rgba(139,92,246,0.7)' }}>
              {user?.role || 'Admin'}
            </p>
          </div>
          <button
            onClick={() => dispatch(logout())}
            className="p-1.5 rounded-lg transition-colors text-slate-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
            title="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
