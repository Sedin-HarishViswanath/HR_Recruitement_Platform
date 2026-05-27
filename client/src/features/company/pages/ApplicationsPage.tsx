import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../../shared/lib/api';
import { Search, ChevronDown, ChevronUp, Star, MessageSquare, Award, Calendar, User, Eye, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { unwrapArray } from '../../../shared/lib/response';
import { ScheduleInterviewModal } from '../components/ScheduleInterviewModal';

const STAGE_FILTERS = ['New', 'Interview', 'Hired', 'Rejected'];

const getInterviewRound = (app: any) => {
  const fromStatus = String(app.status || '').match(/^interview_(\d+)$/)?.[1];
  return Number(app.latest_interview_round || fromStatus || 0);
};

const getStageLabel = (app: any) => {
  const status = String(app.status || '').toLowerCase();
  if (status.startsWith('interview_') || status === 'interview') {
    const round = getInterviewRound(app) || 1;
    const total = Number(app.interview_rounds || 1);
    return `Interview (Round ${round}/${total})`;
  }
  if (status === 'new' || status === 'applied' || status === 'screening' || status === 'shortlisted') return 'New';
  if (status === 'hired') return 'Hired';
  if (status === 'rejected') return 'Rejected';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getStageStyle = (status: string) => {
  const s = String(status || '').toLowerCase();
  if (s === 'new' || s === 'applied' || s === 'screening' || s === 'shortlisted') return 'bg-blue-50 text-blue-700 border border-blue-200';
  if (s.startsWith('interview_') || s === 'interview') return 'bg-orange-50 text-orange-700 border border-orange-200';
  if (s === 'hired') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (s === 'rejected') return 'bg-red-50 text-red-700 border border-red-200';
  return 'bg-slate-100 text-slate-600 border border-slate-200';
};

const getAiScoreStyle = (score: number) => {
  if (score >= 90) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (score >= 75) return 'bg-blue-50 text-blue-700 border border-blue-200';
  if (score >= 60) return 'bg-violet-50 text-violet-700 border border-violet-200';
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
  const [scheduleModal, setScheduleModal] = useState<{ isOpen: boolean; application: any }>({ isOpen: false, application: null });

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
      toast.success(`Application stage updated successfully`);
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

    let matchesStage = true;
    if (activeStage) {
      const s = (app.status || '').toLowerCase();
      if (activeStage === 'New') {
        matchesStage = s === 'new' || s === 'applied' || s === 'screening' || s === 'shortlisted';
      } else if (activeStage === 'Interview') {
        matchesStage = s.startsWith('interview_') || s === 'interview';
      } else if (activeStage === 'Hired') {
        matchesStage = s === 'hired';
      } else if (activeStage === 'Rejected') {
        matchesStage = s === 'rejected';
      } else {
        matchesStage = s === activeStage.toLowerCase();
      }
    }
    return matchesSearch && matchesStage;
  });

  const stageFilters = STAGE_FILTERS;

  // Stage counts
  const stageCounts: Record<string, number> = {};
  applications.forEach(app => {
    const s = (app.status || '').toLowerCase();
    let key = 'New';
    if (s.startsWith('interview_') || s === 'interview') {
      key = 'Interview';
    } else if (s === 'hired') {
      key = 'Hired';
    } else if (s === 'rejected') {
      key = 'Rejected';
    }
    stageCounts[key] = (stageCounts[key] || 0) + 1;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc]">
      {/* Workspace Header Bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40">
        <div>
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <span>Workspace</span>
            <span>&rsaquo;</span>
            <span className="text-slate-600 font-semibold">Applications</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              Applications
            </h1>
            <span className="text-xs text-slate-400 font-medium">{applications.length} total applications</span>
          </div>
        </div>
      </div>

      <main className="p-5 max-w-[1400px] w-full mx-auto space-y-5 animate-fade-in flex-1 flex flex-col">
        {/* Search + Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Search applications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 font-medium text-slate-700 placeholder:text-slate-400 transition-all"
              />
            </div>

            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 cursor-pointer h-[32px] sm:w-[220px]"
            >
              <option value="all">All Jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>

          {/* Stage Filter Tabs */}
          <div className="flex bg-slate-50 border border-slate-200/60 rounded-lg p-0.5 self-start md:self-auto">
            {stageFilters.map((stage) => {
              const count = stageCounts[stage] || 0;
              const isActive = activeStage === stage;
              return (
                <button
                  key={stage}
                  onClick={() => setActiveStage(activeStage === stage ? null : stage)}
                  className={`px-3 py-1 rounded text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer ${isActive
                    ? 'bg-white text-slate-800 shadow-sm font-extrabold'
                    : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  {stage}
                  {count > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${isActive ? 'bg-slate-100 text-slate-800' : 'bg-slate-200/60 text-slate-500'
                      }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Application Cards */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Loading applications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-xl border border-slate-200/80 shadow-sm">
            <p className="text-xs text-slate-400 font-medium">No applications found.</p>
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
                <div key={app.id || i} className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300/80">
                  {/* Main row */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-extrabold text-[11px] shrink-0 shadow-sm`}>
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
                          <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${getStageStyle(app.status)}`}>
                            {getStageLabel(app)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10.5px] text-slate-500 font-semibold flex-wrap">
                          <span className="truncate">{app.job_title || '—'}</span>
                          <span className="text-slate-300">•</span>
                          <span className="truncate">{email}</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Match Score and Date block */}
                    <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                      {aiScore && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg ${getAiScoreStyle(aiScore)}`}>
                          <Sparkles size={11} className="text-emerald-500 animate-pulse" />
                          AI Fit {aiScore}%
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-semibold">{date}</span>
                    </div>

                    {/* Action Triggers */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap md:flex-nowrap justify-end">
                      <button
                        onClick={() => toggleFeedback(app.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer shadow-sm h-8"
                      >
                        <Eye size={12} className="text-slate-400" />
                        Feedback
                        {isExpanded ? <ChevronUp size={11} className="text-slate-400" /> : <ChevronDown size={11} className="text-slate-400" />}
                      </button>

                      {(() => {
                        const status = String(app.status || '').toLowerCase();
                        const latestStatus = String(app.latest_interview_status || '').toLowerCase();
                        const latestRound = Number(app.latest_interview_round || 0);
                        const totalRounds = Number(app.interview_rounds || 1);

                        if (status === 'new' || status === 'applied' || status === 'screening' || status === 'shortlisted') {
                          return (
                            <>
                              <button
                                onClick={() => setScheduleModal({ isOpen: true, application: app })}
                                className="h-8 px-3.5 bg-violet-600 text-white hover:bg-violet-700 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer shadow-sm hover:scale-[1.01]"
                              >
                                Schedule Interview
                              </button>
                              <button
                                onClick={() => handleStatusChange(app.id, 'rejected')}
                                className="h-8 px-3.5 bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          );
                        }

                        if (status.startsWith('interview_') || status === 'interview') {
                          const isLastRound = latestRound >= totalRounds;
                          if (latestStatus === 'scheduled') {
                            return (
                              <>
                                <span className="h-8 inline-flex items-center px-3 bg-violet-50 text-violet-700 border border-violet-100 rounded-lg text-[10.5px] font-bold">
                                  Interview Scheduled
                                </span>
                                {isLastRound && (
                                  <button
                                    onClick={() => handleStatusChange(app.id, 'hired')}
                                    className="h-8 px-3.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer shadow-sm"
                                  >
                                    Hire
                                  </button>
                                )}
                                <button
                                  onClick={() => handleStatusChange(app.id, 'rejected')}
                                  className="h-8 px-3.5 bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            );
                          }

                          if (latestStatus === 'reschedule_requested') {
                            return (
                              <>
                                <span className="h-8 inline-flex items-center px-3 bg-violet-100 text-violet-800 border border-violet-200 rounded-lg text-[10.5px] font-bold">
                                  Reschedule Pending
                                </span>
                                {isLastRound && (
                                  <button
                                    onClick={() => handleStatusChange(app.id, 'hired')}
                                    className="h-8 px-3.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer shadow-sm"
                                  >
                                    Hire
                                  </button>
                                )}
                                <button
                                  onClick={() => handleStatusChange(app.id, 'rejected')}
                                  className="h-8 px-3.5 bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            );
                          }

                          if (latestStatus === 'completed' || !latestStatus) {
                            if (latestRound < totalRounds) {
                              return (
                                <>
                                  <button
                                    onClick={() => setScheduleModal({ isOpen: true, application: app })}
                                    className="h-8 px-3.5 bg-violet-600 text-white hover:bg-violet-700 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer shadow-sm"
                                  >
                                    Schedule Next Round
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(app.id, 'rejected')}
                                    className="h-8 px-3.5 bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <button
                                    onClick={() => handleStatusChange(app.id, 'hired')}
                                    className="h-8 px-3.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer shadow-sm"
                                  >
                                    Hire
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(app.id, 'rejected')}
                                    className="h-8 px-3.5 bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              );
                            }
                          }
                        }

                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Expanded Feedback Drawer */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 animate-fade-in space-y-4">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-black uppercase text-slate-400 tracking-wider">
                        <MessageSquare size={12} className="text-violet-500" />
                        Interview Feedback &bull; {name}
                      </div>

                      {loadingFeedback === app.id ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mr-2" />
                          <span className="text-xs text-slate-400 font-medium">Loading feedback...</span>
                        </div>
                      ) : appFeedback.length === 0 ? (
                        <div className="py-6 text-center rounded-xl bg-white border border-slate-200/85 max-w-xl mx-auto shadow-sm">
                          <MessageSquare size={20} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-600">No feedback submitted yet</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Feedback is available after interviewers complete their rounds.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {appFeedback.map((f: any, fi: number) => (
                            <div key={f.id || fi} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm space-y-3">
                              {/* Feedback Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                                    <Award size={15} className="text-violet-600" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-bold text-slate-900">
                                        {(f.round_type || 'Interview').charAt(0).toUpperCase() + (f.round_type || '').slice(1)} Round
                                      </p>
                                      {f.round_number && (
                                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Round {f.round_number}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10.5px] text-slate-500 font-semibold mt-0.5">
                                      <User size={10} className="text-slate-400" />
                                      <span>{f.interviewer_name || 'Interviewer'}</span>
                                      {f.scheduled_at && (
                                        <>
                                          <span className="text-slate-300">•</span>
                                          <Calendar size={10} className="text-slate-400" />
                                          <span>{new Date(f.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        </>
                                      )}
                                      {f.aptitude_score != null && (
                                        <>
                                          <span className="text-slate-300">•</span>
                                          <span className="text-violet-600 font-extrabold">Aptitude: {f.aptitude_score}/20</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Recommendation Pill */}
                                <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-wider px-2.5 py-0.8 rounded-full border self-start sm:self-auto ${recommendationStyle[f.recommendation] || 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}>
                                  {recommendationLabel[f.recommendation] || f.recommendation || 'N/A'}
                                </span>
                              </div>

                              {/* Rating Stars */}
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star key={s} size={13} className={s <= (f.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                                ))}
                                <span className="ml-1.5 text-[10.5px] font-bold text-slate-500">
                                  {f.rating}/5 &bull; {['', 'Poor', 'Below Avg', 'Average', 'Good', 'Excellent'][f.rating] || ''}
                                </span>
                              </div>

                              {/* Strengths & Weaknesses Grids */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                <div className="p-3 rounded-lg bg-emerald-50/40 border border-emerald-100">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600 mb-1">Strengths</p>
                                  <p className="text-xs font-semibold text-slate-700 leading-relaxed">{f.strengths || 'Not provided'}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-red-50/40 border border-red-100">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-red-600 mb-1">Areas for Improvement</p>
                                  <p className="text-xs font-semibold text-slate-700 leading-relaxed">{f.weaknesses || 'Not provided'}</p>
                                </div>
                              </div>

                              {/* Comments */}
                              {f.additional_comments && (
                                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Additional Comments</p>
                                  <p className="text-xs font-semibold text-slate-700 leading-relaxed italic">"{f.additional_comments}"</p>
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

      {scheduleModal.isOpen && scheduleModal.application && (
        <ScheduleInterviewModal
          isOpen={scheduleModal.isOpen}
          onClose={() => setScheduleModal({ isOpen: false, application: null })}
          onSuccess={() => {
            fetchApplications();
            setScheduleModal({ isOpen: false, application: null });
          }}
          preselectedApplicationId={scheduleModal.application.id}
        />
      )}
    </div>
  );
};
