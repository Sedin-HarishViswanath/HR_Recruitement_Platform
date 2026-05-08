import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardHeader } from '../../../shared/components/DashboardHeader';

const STAGE_FILTERS = ['Applied', 'Screening', 'Shortlisted', 'Interview 1', 'Interview 2', 'Offer', 'Hired', 'Rejected'];

const getStageStyle = (stage: string) => {
  const s = stage?.toLowerCase();
  if (s === 'applied') return 'bg-slate-100 text-slate-600';
  if (s === 'screening') return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
  if (s === 'shortlisted') return 'bg-blue-50 text-blue-700 border border-blue-200';
  if (s === 'interview 1' || s === 'interview') return 'bg-orange-50 text-orange-700 border border-orange-200';
  if (s === 'interview 2') return 'bg-purple-50 text-purple-700 border border-purple-200';
  if (s === 'offer') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (s === 'hired') return 'bg-green-100 text-green-800 border border-green-200';
  if (s === 'rejected') return 'bg-red-50 text-red-600 border border-red-200';
  return 'bg-slate-100 text-slate-600';
};

const getAiScoreStyle = (score: number) => {
  if (score >= 90) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (score >= 75) return 'bg-blue-50 text-blue-700 border border-blue-200';
  if (score >= 60) return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-slate-100 text-slate-600';
};

const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
};

const avatarColors = [
  'bg-amber-500', 'bg-teal-500', 'bg-violet-500', 'bg-rose-500',
  'bg-sky-500', 'bg-orange-500', 'bg-emerald-500', 'bg-pink-500',
];

export const CompanyApplicationsPage = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState('All Jobs');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/applications');
      setApplications(data.data || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    let notes = '';
    if (status === 'Rejected') {
      const reason = window.prompt('Please enter a rejection reason (optional):');
      if (reason === null) return; // Cancelled
      notes = reason;
    }

    try {
      await api.patch(`/applications/${id}/stage`, { stage: status.toLowerCase(), notes });
      toast.success(`Application marked as ${status}`);
      fetchApplications();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filtered = applications.filter((app) => {
    const name = (app.candidate_name || app.user_name || '').toLowerCase();
    const matchesSearch = !search || name.includes(search.toLowerCase());
    const matchesStage = !activeStage || (app.status || '').toLowerCase() === activeStage.toLowerCase();
    return matchesSearch && matchesStage;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f5f7]">
      <DashboardHeader title="Applications" subtitle={`${applications.length} total applications`} />

      <main className="p-4 sm:p-6 space-y-4 animate-fade-in">
        {/* Search + Filter Bar */}
        <div className="card-premium p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search candidates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-[13px] rounded-xl border border-slate-200 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 font-medium text-slate-700 placeholder:text-slate-400 transition-all"
            />
          </div>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option>All Jobs</option>
          </select>
          <button className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-[13px] font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all btn-premium">
            <Plus size={14} /> Add Application
          </button>
        </div>

        {/* Stage Filter Tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {STAGE_FILTERS.map((stage) => (
            <button
              key={stage}
              onClick={() => setActiveStage(activeStage === stage ? null : stage)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                activeStage === stage
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-600'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>

        {/* Table (desktop) / Cards (mobile) */}
        <div className="card-premium overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden lg:grid grid-cols-[auto_1fr_1fr_120px_100px_80px_100px_140px] gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center">
              <input type="checkbox" className="rounded border-slate-300 w-3.5 h-3.5" />
            </div>
            {['Candidate', 'Job Title', 'Stage', 'Recruiter', 'AI Score', 'Applied', 'Actions'].map((h) => (
              <p key={h} className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{h}</p>
            ))}
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-[13px] text-slate-400 font-medium">Loading applications...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[13px] text-slate-400 font-medium">No applications found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((app, i) => {
                const name = app.candidate_name || app.user_name || 'Unknown';
                const email = app.candidate_email || app.user_email || '';
                const initials = getInitials(name);
                const avatarBg = avatarColors[i % avatarColors.length];
                const aiScore = app.ai_score;
                const date = app.created_at ? new Date(app.created_at).toLocaleDateString('en-CA') : '—';

                return (
                  <div key={app.id || i}>
                    {/* Desktop row */}
                    <div className="hidden lg:grid grid-cols-[auto_1fr_1fr_120px_100px_80px_100px_140px] gap-4 px-5 py-3.5 items-center hover:bg-slate-50/60 transition-colors">
                      <input type="checkbox" className="rounded border-slate-300 w-3.5 h-3.5" />
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg ${avatarBg} flex items-center justify-center text-white font-bold text-[10px] shrink-0`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-900 leading-tight truncate">{name}</p>
                          <p className="text-[10px] text-slate-400 font-medium leading-tight truncate">{email}</p>
                        </div>
                      </div>
                      <p className="text-[13px] font-semibold text-slate-700 truncate">{app.job_title || '—'}</p>
                      <div>
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStageStyle(app.status)}`}>
                          {app.status || 'Applied'}
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-600 font-medium truncate">{app.recruiter_name || '—'}</p>
                      <div>
                        {aiScore ? (
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${getAiScoreStyle(aiScore)}`}>
                            AI {aiScore}%
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">{date}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStatusChange(app.id, 'Hired')}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[10px] font-bold transition-colors"
                        >
                          Hire
                        </button>
                        <button
                          onClick={() => handleStatusChange(app.id, 'Rejected')}
                          className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-[10px] font-bold transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>

                    {/* Mobile card */}
                    <div className="lg:hidden p-4 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl ${avatarBg} flex items-center justify-center text-white font-bold text-[11px] shrink-0`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-slate-900 leading-tight">{name}</p>
                          <p className="text-[12px] text-slate-500 font-medium truncate">{app.job_title || 'Position'}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${getStageStyle(app.status)}`}>
                          {app.status || 'Applied'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {aiScore && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getAiScoreStyle(aiScore)}`}>
                            AI {aiScore}%
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">{date}</span>
                        <div className="flex-1" />
                        <button
                          onClick={() => handleStatusChange(app.id, 'Hired')}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          Hire
                        </button>
                        <button
                          onClick={() => handleStatusChange(app.id, 'Rejected')}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
