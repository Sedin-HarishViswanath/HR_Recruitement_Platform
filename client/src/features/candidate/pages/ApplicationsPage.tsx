import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { toast } from 'sonner';

export const CandidateApplicationsPage = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const { data } = await api.get('/candidate/applications');
      setApplications(data.data);
    } catch (err) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (id: string) => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) return;
    try {
      await api.patch(`/candidate/applications/${id}/withdraw`);
      toast.success('Application withdrawn successfully');
      fetchApplications();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to withdraw application');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'applied': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Applied</Badge>;
      case 'screening': return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none">Screening</Badge>;
      case 'interview': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-none">Interview</Badge>;
      case 'offer': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Offer</Badge>;
      case 'hired': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold">Hired</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Rejected</Badge>;
      case 'withdrawn': return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none">Withdrawn</Badge>;
      default: return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Applications</h1>
        <p className="text-slate-500 mt-1">Track the status of your job applications.</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead>Job Role</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Date Applied</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">Loading...</TableCell></TableRow>
            ) : applications.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-500">You haven't applied to any jobs yet.</TableCell></TableRow>
            ) : (
              applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-semibold text-slate-900">{app.job_title}</TableCell>
                  <TableCell className="text-slate-600">{app.company_name}</TableCell>
                  <TableCell className="text-slate-500 text-sm">{new Date(app.applied_at).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <Button variant="ghost" size="sm">Details</Button>
                      {!['hired', 'rejected', 'withdrawn'].includes(app.status) && (
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleWithdraw(app.id)}>
                          Withdraw
                        </Button>
                      )}
                      {app.status === 'rejected' && app.rejection_reason && (
                        <p className="text-[10px] text-red-500 font-bold max-w-[150px] italic">"{app.rejection_reason}"</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
