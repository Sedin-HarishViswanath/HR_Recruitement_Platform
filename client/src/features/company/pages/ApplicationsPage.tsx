import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../../shared/lib/api';
import { Search, Plus, ChevronDown, ChevronUp, Star, MessageSquare, Award, Calendar, User, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardHeader } from '../../../shared/components/DashboardHeader';
import { unwrapArray } from '../../../shared/lib/response';

const STAGE_FILTERS = ['Applied', 'Screening', 'Shortlisted', 'Interview 1', 'Interview 2', 'Offer', 'Hired', 'Rejected'];

const stageToApi = (stage: string) => stage.toLowerCase().replace(/\s+/g, '_');
const formatStage = (stage: string) => {
  const s = stage?.toLowerCase();
  const interviewRound = s?.match(/^interview_(\d+)$/)?.[1];
  if (interviewRound) return `Interview ${interviewRound}`;
  return stage ? s.charAt(0).toUpperCase() + s.slice(1) : 'Applied';
};

const getInterviewRound = (app: any) => {
  const fromStatus = String(app.status || '').match(/^interview_(\d+)$/)?.[1];
  return Number(app.latest_interview_round || fromStatus || 0);
};

const isLastHiringRound = (app: any) => {
  const status = String(app.status || '').toLowerCase();
  if (status === 'offer') return true;
  const totalRounds = Number(app.interview_rounds || 1);
  const round = getInterviewRound(app);
  return round > 0 && round >= totalRounds;
};

const getStageStyle = (stage: string) => {
  const s = stage?.toLowerCase();
  if (s === 'applied') return 'bg-slate-100 text-slate-600 border border-slate-200';
  if (s === 'screening') return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
  if (s === 'shortlisted') return 'bg-blue-50 text-blue-700 border border-blue-200';
  if (s === 'interview_1' || s === 'interview 1' || s === 'interview') return 'bg-orange-50 text-orange-700 border border-orange-200';
  if (s?.startsWith('interview_') || s === 'interview 2') return 'bg-purple-50 text-purple-700 border border-purple-200';
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

const avatarGradients = [
  'from-blue-500 to-cyan-500', 'from-violet-500 to-purple-500',
  'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500',
  'from-rose-500 to-pink-500', 'from-sky-500 to-indigo-500',
];

const recommendationStyle: Record<string, string> = {
  strong_hire: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  hire: 'bg-green-50 text-green-700 border-green-200',
  no_hire: 'bg-orange-50 text-orange-700 border-orange-200',
  strong_no_hire: 'bg-red-50 text-red-700 border-red-200',
};

const recommendationLabel: Record<string, string> = {
  strong_hire: 'Strong Hire',
  hire: 'Hire',
  no_hire: 'No Hire',
  strong_no_hire: 'Strong No Hire',
};

export const CompanyApplicationsPage = () => {
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState(searchParams.get('job_id') || 'all');
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState<Record<string, any[]>>({});
  const [loadingFeedback, setLoadingFeedback] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/applications', {
        params: {
          job_id: selectedJob === 'all' ? undefined : selectedJob,
        },
      });
      setApplications(unwrapArray(data, ['applications']));
    } catch (err) {
      console.error('Failed to load applications:', err);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [selectedJob]);

  useEffect(() => {
    const jobId = searchParams.get('job_id');
    setSelectedJob(jobId || 'all');
  }, [searchParams]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await api.get('/jobs', { params: { limit: 100 } });
        setJobs(unwrapArray(data, ['jobs']));
      } catch (err) {
        console.error('Failed to load jobs for filter:', err);
      }
    };
    fetchJobs();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    let notes = '';
    if (status === 'rejected') {
      const reason = window.prompt('Please enter a rejection reason (optional):');
      if (reason === null) return;
      notes = reason;
    }

    try {
      await api.patch(`/applications/${id}/stage`, { stage: status, notes });
      toast.success(`Application marked as ${formatStage(status)}`);
      fetchApplications();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const toggleFeedback = async (appId: string) => {
    if (expandedApp === appId) {
      setExpandedApp(null);
      return;
    }
    setExpandedApp(appId);
    if (!feedbackData[appId]) {
      setLoadingFeedback(appId);
      try {
        const { data } = await api.get(`/applications/${appId}/feedback`);
        setFeedbackData(prev => ({ ...prev, [appId]: Array.isArray(data?.data) ? data.data : [] }));
      } catch {
        setFeedbackData(prev => ({ ...prev, [appId]: [] }));
      } finally {
        setLoadingFeedback(null);
      }
    }
  };

  const filtered = applications.filter((app) => {
    const name = (app.candidate_name || app.user_name || '').toLowerCase();
    const matchesSearch = !search || name.includes(search.toLowerCase());
    const matchesStage = !activeStage || (app.status || '').toLowerCase() === stageToApi(activeStage);
    return matchesSearch && matchesStage;
  });

  const stageFilters = Array.from(new Set([...STAGE_FILTERS, ...applications.map((app) => formatStage(app.status)).filter(Boolean)]));

  // Stage counts
  const stageCounts: Record<string, number> = {};
  applications.forEach(app => {
    const s = formatStage(app.status);
    stageCounts[s] = (stageCounts[s] || 0) + 1;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f4f8]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>
      <DashboardHeader title="Applications" subtitle={`${applications.length} total applications`} />

      <main className="p-5 sm:p-6 lg:p-8 space-y-5 animate-fade-in max-w-[1400px] mx-auto w-full">
        {/* Search + Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search candidates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-[13px] rounded-xl border border-slate-200 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-medium text-slate-700 placeholder:text-slate-400 transition-all"
            />
          </div>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="px-3 py-2.5 text-[13px] border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="all">All Jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
        </div>

        {/* Stage Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {stageFilters.map((stage) => {
            const count = stageCounts[stage] || 0;
            return (
              <button
                key={stage}
                onClick={() => setActiveStage(activeStage === stage ? null : stage)}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-bold border transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  activeStage === stage
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50'
                }`}
              >
                {stage}
                {count > 0 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    activeStage === stage ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Application Cards */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-[13px] text-slate-400 font-medium">Loading applications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-[13px] text-slate-400 font-medium">No applications found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app, i) => {
              const name = app.candidate_name || app.user_name || 'Unknown';
              const email = app.candidate_email || app.user_email || '';
              const initials = getInitials(name);
              const gradient = avatarGradients[i % avatarGradients.length];
              const aiScore = app.ai_score;
              const date = app.created_at ? new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
              const isExpanded = expandedApp === app.id;
              const appFeedback = feedbackData[app.id] || [];

              return (
                <div key={app.id || i} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-blue-200/60">
                  {/* Main row */}
                  <div className="p-5">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-[12px] shrink-0 shadow-sm`}>
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[14px] font-bold text-slate-900 leading-tight truncate">{name}</p>
                          <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getStageStyle(app.status)}`}>
                            {formatStage(app.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                          <span className="truncate">{app.job_title || '—'}</span>
                          <span className="text-slate-300">·</span>
                          <span>{email}</span>
                        </div>
                      </div>

                      {/* Meta badges */}
                      <div className="hidden md:flex items-center gap-2">
                        {aiScore && (
                          <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg ${getAiScoreStyle(aiScore)}`}>
                            AI {aiScore}%
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium">{date}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFeedback(app.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                        >
                          <Eye size={12} />
                          Feedback
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>

                        {isLastHiringRound(app) ? (
                          <button
                            onClick={() => handleStatusChange(app.id, 'hired')}
                            className="px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Hire
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(app.id, 'shortlisted')}
                            className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Shortlist
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusChange(app.id, 'rejected')}
                          className="px-3.5 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>

                    {/* Mobile meta row */}
                    <div className="md:hidden flex items-center gap-2 mt-3 flex-wrap">
                      {aiScore && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getAiScoreStyle(aiScore)}`}>
                          AI {aiScore}%
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium">{date}</span>
                    </div>
                  </div>

                  {/* Expanded Feedback Section */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-5 animate-fade-in">
                      <div className="flex items-center gap-2 mb-4">
                        <MessageSquare size={14} className="text-blue-600" />
                        <h3 className="text-[12px] font-black uppercase tracking-wider text-slate-700">
                          Interview Feedback — {name}
                        </h3>
                      </div>

                      {loadingFeedback === app.id ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                          <span className="text-[12px] text-slate-400 font-medium">Loading feedback...</span>
                        </div>
                      ) : appFeedback.length === 0 ? (
                        <div className="py-6 text-center rounded-xl bg-white border border-slate-200/80">
                          <MessageSquare size={24} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-[12px] text-slate-400 font-medium">No feedback submitted yet for this candidate.</p>
                          <p className="text-[11px] text-slate-400 mt-1">Feedback is available after interviewers complete their rounds.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {appFeedback.map((f: any, fi: number) => (
                            <div key={f.id || fi} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
                              {/* Feedback Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Award size={16} className="text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-[13px] font-bold text-slate-900">
                                        {(f.round_type || 'Interview').charAt(0).toUpperCase() + (f.round_type || '').slice(1)} Round
                                      </p>
                                      {f.round_number && (
                                        <span className="text-[10px] text-slate-400 font-medium">Round {f.round_number}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                                      <User size={10} className="text-slate-400" />
                                      <span>{f.interviewer_name || 'Interviewer'}</span>
                                      {f.scheduled_at && (
                                        <>
                                          <span className="text-slate-300">·</span>
                                          <Calendar size={10} className="text-slate-400" />
                                          <span>{new Date(f.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        </>
                                      )}
                                      {f.aptitude_score != null && (
                                        <>
                                          <span className="text-slate-300">·</span>
                                          <span className="text-indigo-600 font-bold">Aptitude: {f.aptitude_score}/20</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Recommendation Badge */}
                                <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                  recommendationStyle[f.recommendation] || 'bg-slate-100 text-slate-600'
                                }`}>
                                  {recommendationLabel[f.recommendation] || f.recommendation || 'N/A'}
                                </span>
                              </div>

                              {/* Rating Stars */}
                              <div className="flex items-center gap-1 mb-3">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star key={s} size={14} className={s <= (f.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                                ))}
                                <span className="ml-1.5 text-[11px] font-bold text-slate-500">
                                  {f.rating}/5 — {['', 'Poor', 'Below Avg', 'Average', 'Good', 'Excellent'][f.rating] || ''}
                                </span>
                              </div>

                              {/* Strengths + Weaknesses */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">Strengths</p>
                                  <p className="text-[12px] font-medium text-emerald-900 leading-relaxed">{f.strengths || 'Not provided'}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-red-50/60 border border-red-100">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-1">Areas for Improvement</p>
                                  <p className="text-[12px] font-medium text-red-900 leading-relaxed">{f.weaknesses || 'Not provided'}</p>
                                </div>
                              </div>

                              {/* Additional Comments */}
                              {f.additional_comments && (
                                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Additional Comments</p>
                                  <p className="text-[12px] font-medium text-slate-700 leading-relaxed">{f.additional_comments}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
