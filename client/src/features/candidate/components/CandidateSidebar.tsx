import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, FileText, Video,
  User, LogOut, X, Gift, Sparkles, ChevronRight,
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { logout } from '../../auth/auth.slice';

const NAV_SECTIONS = [
  {
    label: 'Home',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/candidate/dashboard' },
    ],
  },
  {
    label: 'Discover',
    items: [
      { icon: Briefcase, label: 'Find Jobs', path: '/candidate/jobs' },
    ],
  },
  {
    label: 'My Activity',
    items: [
      { icon: FileText, label: 'My Applications', path: '/candidate/applications' },
      { icon: Video, label: 'Interviews', path: '/candidate/interviews' },
      { icon: Gift, label: 'Offers', path: '/candidate/offers' },
    ],
  },
  {
    label: 'Account',
    items: [
      { icon: User, label: 'Profile', path: '/candidate/profile' },
    ],
  },
];

interface CandidateSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CandidateSidebar = ({ isOpen, onClose }: CandidateSidebarProps) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const isActive = (path: string) => location.pathname.startsWith(path);

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
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40 shrink-0 relative">
            <Sparkles size={14} />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <div>
            <h2 className="text-white text-[14px] font-extrabold tracking-tight leading-none" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              RecruitAI
            </h2>
            <p className="text-[8.5px] mt-0.5 uppercase tracking-[0.15em] font-bold" style={{ color: 'rgba(46, 90, 70,0.8)' }}>
              Candidate
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg transition-colors text-stone-500 hover:text-stone-300 cursor-pointer"
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
                    className={cn('sidebar-dark-link group', active ? 'sidebar-dark-link-active' : '')}
                  >
                    {active && <div className="sidebar-dark-indicator" />}
                    <item.icon
                      size={16}
                      className={cn(
                        'shrink-0 transition-colors',
                        active ? 'text-emerald-400' : 'text-stone-500 group-hover:text-stone-300',
                      )}
                    />
                    <span>{item.label}</span>
                    {active && (
                      <ChevronRight size={12} className="ml-auto text-emerald-500/60" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom user card ── */}
      <div className="px-3 pb-4 mt-auto shrink-0">
        <div className="h-px mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md shadow-emerald-900/30">
            {user?.name?.[0]?.toUpperCase() || 'C'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-stone-200 truncate leading-tight">{user?.name || 'Candidate'}</p>
            <p className="text-[9px] uppercase font-bold tracking-wider leading-tight" style={{ color: 'rgba(46, 90, 70,0.7)' }}>
              Candidate
            </p>
          </div>
          <button
            onClick={() => dispatch(logout())}
            className="p-1.5 rounded-lg transition-colors text-stone-500 hover:text-red-400 hover:bg-red-500/10 shrink-0 cursor-pointer"
            title="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
