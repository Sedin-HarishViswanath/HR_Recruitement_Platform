import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../shared/lib/api';
import { Button } from '../../../components/ui/button';
import { Plus, BriefcaseBusiness, MapPin, Briefcase, GraduationCap, Wallet, Users } from 'lucide-react';
import { toast } from 'sonner';
import { JobCard } from '../components/JobCard';
import type { Job } from '../components/JobCard';
import { JobForm } from '../components/JobForm';
import { DashboardHeader } from '../../../shared/components/DashboardHeader';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { unwrapArray } from '../../../shared/lib/response';

export const CompanyJobsPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [viewingJob, setViewingJob] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; title: string; loading: boolean }>({
    open: false, id: '', title: '', loading: false,
  });

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

  const handleDelete = (id: string) => {
    const job = jobs.find(j => j.id === id);
    setDeleteConfirm({ open: true, id, title: job?.title || 'this job', loading: false });
  };

  const confirmDelete = async () => {
    setDeleteConfirm(prev => ({ ...prev, loading: true }));
    try {
      await api.delete(`/jobs/${deleteConfirm.id}`);
      toast.success('Job deleted');
      fetchJobs();
      setDeleteConfirm({ open: false, id: '', title: '', loading: false });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete job');
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
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

  const handleViewDetails = async (id: string) => {
    try {
      const { data } = await api.get(`/jobs/${id}`);
      setViewingJob(data?.data || data);
    } catch (err: any) {
      toast.error('Failed to load job details');
    }
  };

  const handleEditClick = async (id: string) => {
    try {
      const { data } = await api.get(`/jobs/${id}`);
      const job = data?.data || data;
      setEditingJob(job);
    } catch (err: any) {
      toast.error('Failed to load job details');
    }
  };

  const handleEditJob = async (data: any) => {
    if (!editingJob) return;
    try {
      await api.patch(`/jobs/${editingJob.id}`, data);
      toast.success('Job updated successfully');
      setEditingJob(null);
      fetchJobs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update job');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingJob(null);
  };

  const showModal = showForm || !!editingJob;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <DashboardHeader
        title="Job Positions"
        subtitle="Manage open roles and postings"
      />

      <main className="p-8 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-bold text-stone-500">
            {jobs.length} total positions
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search jobs"
              className="h-10 w-full sm:w-56 rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 outline-none transition-colors focus:border-emerald-400"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-bold text-stone-600 outline-none transition-colors focus:border-emerald-400"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Open</option>
              <option value="closed">Closed</option>
            </select>
            <Button
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl h-10 px-6 shadow-sm shadow-emerald-500/20 active:scale-95 transition-all btn-premium"
              onClick={() => setShowForm(true)}
            >
              <Plus className="mr-2" size={18} /> Create Job
            </Button>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 animate-in zoom-in duration-300">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                    {editingJob ? 'Edit Job' : 'Create New Job'}
                  </h2>
                  <button onClick={closeForm} className="text-stone-400 hover:text-stone-600 font-bold">Close</button>
                </div>
                <JobForm
                  initialData={editingJob ? {
                    title: editingJob.title,
                    description: editingJob.description,
                    department: editingJob.department || '',
                    location: editingJob.location || '',
                    employment_type: editingJob.employment_type || 'full_time',
                    experience_level: editingJob.experience_level || 'mid',
                    required_skills: editingJob.required_skills || [],
                    salary_min: editingJob.salary_min,
                    salary_max: editingJob.salary_max,
                    deadline: editingJob.deadline ? editingJob.deadline.split('T')[0] : '',
                    remote: editingJob.remote || false,
                    status: editingJob.status || 'draft',
                  } : undefined}
                  onSubmit={editingJob ? handleEditJob : handleCreateJob}
                  onCancel={closeForm}
                />
              </div>
            </div>
          </div>
        )}

        {viewingJob && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 animate-in zoom-in duration-300">
              <div className="p-8 space-y-5">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-stone-900 tracking-tight">{viewingJob.title}</h2>
                    <p className="text-sm text-stone-500 font-semibold mt-1">{viewingJob.department || 'General'}</p>
                  </div>
                  <button onClick={() => setViewingJob(null)} className="text-stone-400 hover:text-stone-600 font-bold shrink-0">Close</button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-stone-100">
                  <div className="flex items-center gap-2 text-[12px] text-stone-600 font-semibold">
                    <MapPin size={14} className="text-stone-300 shrink-0" />
                    <span className="truncate">{viewingJob.remote ? 'Remote' : viewingJob.location || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-stone-600 font-semibold">
                    <Briefcase size={14} className="text-stone-300 shrink-0" />
                    <span className="truncate">{viewingJob.employment_type?.replace('_', '-') || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-stone-600 font-semibold">
                    <GraduationCap size={14} className="text-stone-300 shrink-0" />
                    <span className="truncate">{viewingJob.experience_level || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-stone-600 font-semibold">
                    <Users size={14} className="text-stone-300 shrink-0" />
                    <span className="truncate">{viewingJob.applicant_count || 0} applicants</span>
                  </div>
                </div>

                {(viewingJob.salary_min || viewingJob.salary_max) && (
                  <div className="flex items-center gap-2 text-[12px] text-stone-600 font-semibold">
                    <Wallet size={14} className="text-stone-300 shrink-0" />
                    {viewingJob.salary_min && viewingJob.salary_max
                      ? `$${Number(viewingJob.salary_min).toLocaleString()} – $${Number(viewingJob.salary_max).toLocaleString()}`
                      : `$${Number(viewingJob.salary_min || viewingJob.salary_max).toLocaleString()}+`}
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Description</h3>
                  <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{viewingJob.description}</p>
                </div>

                {viewingJob.required_skills && viewingJob.required_skills.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {viewingJob.required_skills.map((skill: string) => (
                        <span key={skill} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-stone-50 text-stone-600 border border-stone-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-3 border-t border-stone-100">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { navigate(`/company/applications?job_id=${viewingJob.id}`); setViewingJob(null); }}
                  >
                    View Pipeline
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold"
                    onClick={() => { handleEditClick(viewingJob.id); setViewingJob(null); }}
                  >
                    Edit Job
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[220px] rounded-xl border border-stone-100 bg-white animate-pulse shadow-sm"></div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-stone-200 shadow-sm">
            <BriefcaseBusiness size={64} className="mx-auto text-stone-200 mb-6" />
            <h3 className="text-2xl font-black text-stone-900 tracking-tight">No jobs found</h3>
            <p className="text-stone-500 max-w-sm mx-auto mt-2 font-medium">
              You haven&apos;t created any job postings yet matching your criteria.
            </p>
            <Button className="mt-8 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl h-12 px-8 shadow-sm shadow-emerald-500/20 transition-all active:scale-95 btn-premium" onClick={() => setShowForm(true)}>
              Post First Job
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onEdit={() => handleEditClick(job.id)}
                onView={() => navigate(`/company/applications?job_id=${job.id}`)}
                onViewDetails={() => handleViewDetails(job.id)}
                onDelete={handleDelete}
                onChangeStatus={handleChangeStatus}
              />
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: '', title: '', loading: false })}
        onConfirm={confirmDelete}
        title={`Delete "${deleteConfirm.title}"?`}
        description="This will permanently remove the job posting and all associated data. This action cannot be undone."
        confirmLabel="Delete Job"
        variant="danger"
        loading={deleteConfirm.loading}
      />
    </div>
  );
};
