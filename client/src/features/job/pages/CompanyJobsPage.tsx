import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Search, Plus, FilterX } from 'lucide-react';
import { toast } from 'sonner';
import { JobCard, Job } from '../components/JobCard';
import { JobForm } from '../components/JobForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

export const CompanyJobsPage = () => {
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
      setJobs(data.data.jobs);
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

  if (showForm) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create New Job</h1>
          <p className="text-slate-500 mt-1">Fill out the details below to post a new position.</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <JobForm 
            onSubmit={handleCreateJob} 
            onCancel={() => setShowForm(false)} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Jobs</h1>
          <p className="text-slate-500 mt-1">Manage your company's open positions.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowForm(true)}>
          <Plus className="mr-2" size={18} /> Create Job
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search by job title..." 
            className="pl-10 border-slate-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] border-slate-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        {(search || statusFilter !== 'all') && (
          <Button variant="ghost" onClick={() => { setSearch(''); setStatusFilter('all'); }} className="text-slate-500">
            <FilterX size={18} className="mr-2" /> Clear
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[200px] rounded-xl border border-slate-100 bg-slate-50 animate-pulse"></div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
          <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No jobs found</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-2">
            You haven't created any job postings yet, or none match your search criteria.
          </p>
          <Button className="mt-6 bg-blue-600 hover:bg-blue-700" onClick={() => setShowForm(true)}>
            Create your first job
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <JobCard 
              key={job.id} 
              job={job} 
              onEdit={() => console.log('Edit', job.id)}
              onView={() => console.log('View', job.id)}
              onDelete={handleDelete}
              onChangeStatus={handleChangeStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};
