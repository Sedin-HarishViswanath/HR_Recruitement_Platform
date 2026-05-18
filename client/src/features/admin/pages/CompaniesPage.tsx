import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { 
  Search, 
  Building2, 
  MoreVertical, 
  CheckCircle2, 
  XCircle,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Users,
  Clock,
  Calendar,
  Trash2
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { toast } from 'sonner';
import { DashboardHeader } from '../../../shared/components/DashboardHeader';

interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  company_size: string;
  status: 'pending' | 'active' | 'rejected';
  created_at: string;
  admin_name?: string;
  admin_email?: string;
}

export const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchCompanies = async () => {
    try {
      const { data } = await api.get('/companies/admin/list', {
        params: {
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: search || undefined,
        }
      });
      setCompanies(data.data.companies);
    } catch (err) {
      toast.error('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [statusFilter, search]);

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/companies/admin/${id}/approve`);
      toast.success('Company approved');
      fetchCompanies();
    } catch (err) {
      toast.error('Failed to approve company');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await api.patch(`/companies/admin/${id}/reject`, { reason });
      toast.success('Company rejected');
      fetchCompanies();
    } catch (err) {
      toast.error('Failed to reject company');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete company "${name}"?\nThis will permanently delete all associated users, jobs, candidates, applications, and interviews.`)) {
      return;
    }
    try {
      await api.delete(`/companies/admin/${id}`);
      toast.success('Company deleted successfully');
      fetchCompanies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete company');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': 
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 text-[11px] font-black uppercase tracking-wider">
            <CheckCircle2 size={12} /> Active
          </div>
        );
      case 'pending': 
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[11px] font-black uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" /> Pending
          </div>
        );
      case 'rejected': 
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 text-[11px] font-black uppercase tracking-wider">
            <XCircle size={12} /> Rejected
          </div>
        );
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <DashboardHeader 
        title="Companies" 
        subtitle="Manage tenant organizations and verification" 
      />

      <main className="p-8 space-y-8 animate-in fade-in duration-500">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                 <Building2 size={28} />
              </div>
              <div>
                 <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Total Companies</p>
                 <h4 className="text-2xl font-black text-slate-900 leading-none mt-1">{companies.length}</h4>
              </div>
           </div>
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                 <Clock size={28} />
              </div>
              <div>
                 <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Pending Review</p>
                 <h4 className="text-2xl font-black text-slate-900 leading-none mt-1">
                   {companies.filter(c => c.status === 'pending').length}
                 </h4>
              </div>
           </div>
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shadow-inner">
                 <CheckCircle2 size={28} />
              </div>
              <div>
                 <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Active Tenants</p>
                 <h4 className="text-2xl font-black text-slate-900 leading-none mt-1">
                   {companies.filter(c => c.status === 'active').length}
                 </h4>
              </div>
           </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-[28px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search by company name or domain..." 
              className="h-12 pl-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select onValueChange={setStatusFilter} defaultValue="all">
              <SelectTrigger className="h-12 w-[160px] rounded-2xl border-slate-100 bg-slate-50 font-bold text-slate-600">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-12 rounded-2xl border-slate-100 bg-slate-50 px-5 text-slate-600 hover:bg-slate-100">
              <Filter size={18} className="mr-2" /> Filters
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Company</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Admin Details</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Details</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Registered</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-8 py-6 h-20 bg-slate-50/20" />
                    </tr>
                  ))
                ) : companies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                       <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300">
                             <Building2 size={32} />
                          </div>
                          <p className="text-slate-400 font-bold">No companies found</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr key={company.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-600/5 text-blue-600 flex items-center justify-center font-black text-lg border border-blue-600/10 shadow-sm">
                            {company.name[0]}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 leading-none">{company.name}</p>
                            <p className="text-xs text-slate-400 font-medium mt-1.5 flex items-center gap-1.5">
                               <ExternalLink size={12} /> {company.domain}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                              <Users size={14} />
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-700 leading-none">{company.admin_name || 'System Admin'}</p>
                              <p className="text-[10px] text-slate-400 font-bold mt-1">{company.admin_email || 'admin@' + company.domain}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-600">{company.industry}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{company.company_size} Employees</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {getStatusBadge(company.status)}
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-2 text-slate-500">
                            <Calendar size={14} />
                            <span className="text-xs font-bold">{new Date(company.created_at).toLocaleDateString()}</span>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {company.status === 'pending' && (
                            <>
                              <Button 
                                onClick={() => handleApprove(company.id)}
                                className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                              >
                                Approve
                              </Button>
                              <Button 
                                onClick={() => handleReject(company.id)}
                                variant="outline"
                                className="h-9 px-4 rounded-xl border-slate-200 text-red-500 font-black text-xs hover:bg-red-50 hover:border-red-100 active:scale-95 transition-all"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button 
                            onClick={() => handleDelete(company.id, company.name)}
                            variant="ghost"
                            size="icon"
                            className="rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all"
                            title="Delete Company"
                          >
                             <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="bg-slate-50/50 px-8 py-5 border-t border-slate-100 flex items-center justify-between">
             <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">
               Showing {companies.length} organizations
             </p>
             <div className="flex items-center gap-2">
                <Button variant="outline" className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-400" disabled>
                   1
                </Button>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};
