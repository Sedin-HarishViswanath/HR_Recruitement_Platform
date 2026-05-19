import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../shared/lib/api';
import { Button } from '../../../components/ui/button';
import { Plus, BriefcaseBusiness } from 'lucide-react';
import { toast } from 'sonner';
import { JobCard } from '../components/JobCard';
import type { Job } from '../components/JobCard';
import { JobForm } from '../components/JobForm';
import { DashboardHeader } from '../../../shared/components/DashboardHeader';
import { unwrapArray } from '../../../shared/lib/response';

export const CompanyJobsPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/jobs', {
        params: {
          search: search || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
        }
      });
      setJobs(unwrapArray<Job>(data, ['jobs']));
    } catch (err) {
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchJobs();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      toast.success('Job deleted');
      fetchJobs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete job');
    }
  };

  const handleChangeStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/jobs/${id}/status`, { status: newStatus });
      toast.success(`Job marked as ${newStatus}`);
      fetchJobs();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleCreateJob = async (data: any) => {
    try {
      await api.post('/jobs', data);
      toast.success('Job created successfully');
      setShowForm(false);
      fetchJobs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create job');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <DashboardHeader 
        title="Job Positions" 
        subtitle="Manage open roles and postings" 
      />

      <main className="p-8 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-bold text-slate-500">
            {jobs.length} total positions
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search jobs"
              className="h-10 w-full sm:w-56 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-amber-400"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none transition-colors focus:border-amber-400"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Open</option>
              <option value="closed">Closed</option>
            </select>
            <Button 
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl h-10 px-6 shadow-sm shadow-amber-500/20 active:scale-95 transition-all btn-premium"
              onClick={() => setShowForm(true)}
            >
              <Plus className="mr-2" size={18} /> Create Job
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in zoom-in duration-300">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create New Job</h2>
                    <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 font-bold">Close</button>
                  </div>
                  <JobForm 
                    onSubmit={handleCreateJob} 
                    onCancel={() => setShowForm(false)} 
                  />
                </div>
             </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[220px] rounded-xl border border-slate-100 bg-white animate-pulse shadow-sm"></div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
            <BriefcaseBusiness size={64} className="mx-auto text-slate-200 mb-6" />
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">No jobs found</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2 font-medium">
              You haven't created any job postings yet matching your criteria.
            </p>
            <Button className="mt-8 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl h-12 px-8 shadow-sm shadow-amber-500/20 transition-all active:scale-95 btn-premium" onClick={() => setShowForm(true)}>
              Post First Job
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard 
                key={job.id} 
                job={job} 
                onEdit={() => console.log('Edit', job.id)}
                onView={() => navigate(`/company/applications?job_id=${job.id}`)}
                onDelete={handleDelete}
                onChangeStatus={handleChangeStatus}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
