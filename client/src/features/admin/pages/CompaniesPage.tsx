import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import {
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  Filter,
  ExternalLink,
  Users,
  Clock,
  Calendar
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
  status: 'pending' | 'active' | 'rejected' | 'revoked';
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

  useEffect(() => { fetchCompanies(); }, [statusFilter, search]);

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/companies/admin/${id}/approve`);
      toast.success('Company approved');
      fetchCompanies();
    } catch { toast.error('Failed to approve company'); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await api.patch(`/companies/admin/${id}/reject`, { reason });
      toast.success('Company rejected');
      fetchCompanies();
    } catch { toast.error('Failed to reject company'); }
  };

  const handleRevoke = async (id: string) => {
    const reason = prompt('Reason for revoking access:');
    if (reason === null) return;
    try {
      await api.patch(`/companies/admin/${id}/revoke`, { reason });
      toast.success('Company access revoked');
      fetchCompanies();
    } catch { toast.error('Failed to revoke company access'); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100 text-[10px] font-semibold uppercase tracking-wider"><CheckCircle2 size={10} /> Active</div>;
      case 'pending':
        return <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-semibold uppercase tracking-wider"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending</div>;
      case 'rejected':
        return <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 text-[10px] font-semibold uppercase tracking-wider"><XCircle size={10} /> Rejected</div>;
      case 'revoked':
        return <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold uppercase tracking-wider"><XCircle size={10} /> Revoked</div>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <DashboardHeader title="Companies" subtitle="Manage tenant organizations and verification" />

      <main className="p-4 sm:p-5 lg:p-6 space-y-5 animate-in fade-in duration-500">
        <div className="max-w-[1400px] mx-auto space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="metric-card p-4 sm:p-5 flex items-center gap-4 group cursor-default">
              <div className="metric-card-accent" />
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building2 size={18} />
              </div>
              <div>
                <p className="section-eyebrow mb-0.5">Total Companies</p>
                <h4 className="text-[22px] font-extrabold text-slate-900 leading-none" style={{ fontFamily: 'Sora' }}>{companies.length}</h4>
              </div>
            </div>
            <div className="metric-card p-4 sm:p-5 flex items-center gap-4 group cursor-default">
              <div className="metric-card-accent" />
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock size={18} />
              </div>
              <div>
                <p className="section-eyebrow mb-0.5">Pending Review</p>
                <h4 className="text-[22px] font-extrabold text-slate-900 leading-none" style={{ fontFamily: 'Sora' }}>
                  {companies.filter(c => c.status === 'pending').length}
                </h4>
              </div>
            </div>
            <div className="metric-card p-4 sm:p-5 flex items-center gap-4 group cursor-default">
              <div className="metric-card-accent" />
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="section-eyebrow mb-0.5">Active Tenants</p>
                <h4 className="text-[22px] font-extrabold text-slate-900 leading-none" style={{ fontFamily: 'Sora' }}>
                  {companies.filter(c => c.status === 'active').length}
                </h4>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <Input
                placeholder="Search by company name or domain..."
                className="h-10 pl-10 rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-medium text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select onValueChange={setStatusFilter} defaultValue="all">
                <SelectTrigger className="h-10 w-[150px] rounded-xl border-slate-100 bg-slate-50 font-semibold text-slate-600 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-10 rounded-xl border-slate-100 bg-slate-50 px-4 text-slate-600 hover:bg-slate-100 text-sm">
                <Filter size={14} className="mr-2" /> Filters
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100">
                    <th className="px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Company</th>
                    <th className="px-4 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Admin</th>
                    <th className="px-4 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Details</th>
                    <th className="px-4 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Registered</th>
                    <th className="px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-5 py-4 h-16 bg-slate-50/20" />
                      </tr>
                    ))
                  ) : companies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                            <Building2 size={24} />
                          </div>
                          <p className="text-slate-400 font-bold text-sm">No companies found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    companies.map((company) => (
                      <tr key={company.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-600/5 text-blue-600 flex items-center justify-center font-black text-base border border-blue-600/10 shrink-0">
                              {company.name[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm leading-none">{company.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                                <ExternalLink size={10} /> {company.domain}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                              <Users size={12} />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-slate-700 leading-none">{company.admin_name || 'System Admin'}</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate max-w-[140px]">{company.admin_email || `admin@${company.domain}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-[11px] font-bold text-slate-600">{company.industry || '—'}</p>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">{company.company_size ? `${company.company_size} employees` : '—'}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          {getStatusBadge(company.status)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Calendar size={12} />
                            <span className="text-[11px] font-bold">{new Date(company.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {company.status === 'pending' ? (
                              <>
                                <Button
                                  onClick={() => handleApprove(company.id)}
                                  className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-sm active:scale-95 transition-all"
                                >
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => handleReject(company.id)}
                                  variant="outline"
                                  className="h-8 px-3 rounded-lg border-slate-200 text-red-500 font-bold text-[11px] hover:bg-red-50 hover:border-red-100 active:scale-95 transition-all"
                                >
                                  Reject
                                </Button>
                              </>
                            ) : company.status === 'active' ? (
                              <Button
                                onClick={() => handleRevoke(company.id)}
                                variant="outline"
                                className="h-8 px-3 rounded-lg border-red-200 text-red-500 font-bold text-[11px] hover:bg-red-50 hover:border-red-100 active:scale-95 transition-all"
                              >
                                Revoke
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleApprove(company.id)}
                                className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-sm active:scale-95 transition-all"
                              >
                                Reactivate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50/40 px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                {companies.length} organizations
              </p>
              <Button variant="outline" className="h-7 w-7 p-0 rounded-lg border-slate-200 text-slate-400 text-xs" disabled>1</Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
