import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { 
  Building2, 
  Users, 
  Briefcase, 
  FileStack, 
  AlertCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Stats {
  totalCompanies: number;
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  pendingApprovals: number;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/dashboard');
        setStats(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Overview</h1>
        <p className="text-slate-500 mt-1">Global statistics and system-wide monitoring.</p>
      </div>

      {stats && stats.pendingApprovals > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-amber-800 font-medium">
            <AlertCircle className="text-amber-600" />
            <span>{stats.pendingApprovals} companies are awaiting approval</span>
          </div>
          <Link 
            to="/superadmin/companies?status=pending" 
            className="text-amber-900 font-bold hover:underline text-sm"
          >
            Review Now →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Building2} 
          label="Total Companies" 
          value={stats?.totalCompanies || 0} 
          color="bg-blue-500" 
        />
        <StatCard 
          icon={Users} 
          label="Platform Users" 
          value={stats?.totalUsers || 0} 
          color="bg-purple-500" 
        />
        <StatCard 
          icon={Briefcase} 
          label="Job Postings" 
          value={stats?.totalJobs || 0} 
          color="bg-emerald-500" 
        />
        <StatCard 
          icon={FileStack} 
          label="Applications" 
          value={stats?.totalApplications || 0} 
          color="bg-orange-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border shadow-sm min-h-[300px]">
          <h3 className="font-bold text-slate-800 mb-4">Registration Activity</h3>
          <div className="flex items-center justify-center h-full text-slate-400">
            {/* Chart Placeholder */}
            Chart data implementation next...
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm min-h-[300px]">
          <h3 className="font-bold text-slate-800 mb-4">Top Performing Companies</h3>
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            Company performance metrics will appear here.
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <h4 className="text-3xl font-bold mt-1 text-slate-900">{value}</h4>
      </div>
      <div className={`p-3 rounded-lg ${color} text-white`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);
