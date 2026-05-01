import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  BarChart3, 
  LogOut 
} from 'lucide-react';
import { cn } from '../../../shared/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../app/store';
import { logout } from '../../auth/auth.slice';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/superadmin/dashboard' },
  { icon: Building2, label: 'Companies', path: '/superadmin/companies' },
  { icon: Users, label: 'Users', path: '/superadmin/users' },
  { icon: BarChart3, label: 'Analytics', path: '/superadmin/analytics' },
];

export const AdminSidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0 z-30">
      <div className="p-6">
        <h2 className="text-white text-xl font-bold tracking-tight">HR Platform</h2>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold text-blue-400">Super Admin</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
              location.pathname === item.path 
                ? "bg-blue-600 text-white" 
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon size={20} className={cn(
              location.pathname === item.path ? "text-white" : "text-slate-400 group-hover:text-white"
            )} />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-4 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            {user?.name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-blue-400 truncate font-medium">Platform Admin</p>
          </div>
        </div>

        <button
          onClick={() => dispatch(logout())}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-900/20 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} className="text-slate-400" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};
