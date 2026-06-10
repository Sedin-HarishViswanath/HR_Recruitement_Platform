import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePageTitle } from '../../../shared/hooks/usePageTitle';
import { api } from '../../../shared/lib/api';
import {
  Search, ChevronDown, ChevronUp, Star, MessageSquare, Award,
  Calendar, User, Eye, Sparkles, Filter, SlidersHorizontal, GitCompare
} from 'lucide-react';
import { toast } from 'sonner';
import { unwrapArray } from '../../../shared/lib/response';
import { ScheduleInterviewModal } from '../components/ScheduleInterviewModal';
import { RejectCandidateModal } from '../components/RejectCandidateModal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { CandidateCompareModal } from '../components/CandidateCompareModal';

// ── Helpers ──────────────────────────────────────────────────────────────────
const STAGE_FILTERS = ['All', 'New', 'Interview', 'Hired', 'Rejected'] as const;
type StageFilter = typeof STAGE_FILTERS[number];

const getInterviewRound = (app: any) => {
  const fromStatus = String(app.status || '').match(/^interview_(\d+)$/)?.[1];
  return Number(app.latest_interview_round || fromStatus || 0);
};

const getStageLabel = (app: any) => {
  const status = String(app.status || '').toLowerCase();
  if (status.startsWith('interview_') || status === 'interview') {
    const round = getInterviewRound(app) || 1;
    const total = Number(app.interview_rounds || 1);
    return `Round ${round}/${total}`;
  }
  if (['new', 'applied', 'screening', 'shortlisted'].includes(status)) return 'New';
  if (status === 'hired') return 'Hired';
  if (status === 'rejected') return 'Rejected';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getStageStyle = (status: string) => {
  const s = String(status || '').toLowerCase();
  if (['new', 'applied', 'screening', 'shortlisted'].includes(s))
    return 'badge-premium badge-sky';
  if (s.startsWith('interview_') || s === 'interview')
    return 'badge-premium badge-violet';
  if (s === 'hired') return 'badge-premium badge-emerald';
  if (s === 'rejected') return 'badge-premium badge-red';
  return 'badge-premium bg-slate-50 text-slate-500 border-slate-200';
};

const getAiScoreStyle = (score: number) => {
  if (score >= 85) return { badge: 'badge-premium badge-emerald', bar: 'bg-emerald-500' };
  if (score >= 70) return { badge: 'badge-premium badge-sky', bar: 'bg-blue-500' };
  if (score >= 55) return { badge: 'badge-premium badge-violet', bar: 'bg-violet-500' };
  return { badge: 'badge-premium bg-slate-50 text-slate-500 border-slate-200', bar: 'bg-slate-400' };
};

const getInitials = (name: string) => {
  if (!name) return 'U';
  const p = name.trim().split(' ');
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase();
};

const GRADIENTS = [
  'from-blue-600 to-cyan-600', 'from-violet-600 to-indigo-600',
  'from-amber-600 to-orange-600', 'from-emerald-600 to-teal-600',
  'from-rose-600 to-pink-600', 'from-sky-600 to-indigo-600',
];

const REC_STYLE: Record<string, string> = {
  strong_hire: 'badge-premium badge-emerald',
  hire: 'badge-premium badge-emerald',
  no_hire: 'badge-premium badge-amber',
  strong_no_hire: 'badge-premium badge-red',
};

const REC_LABEL: Record<string, string> = {
  strong_hire: 'Strong Hire', hire: 'Hire',
  no_hire: 'No Hire', strong_no_hire: 'Strong No Hire',
};

// ── Skeleton ─────────────────────────────────────────────────────────────────
const AppCardSkeleton = () => (
  <div className="panel p-5 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-200 rounded w-40" />
        <div className="h-2.5 bg-slate-100 rounded w-56" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-24 bg-slate-100 rounded-lg" />
        <div className="h-8 w-20 bg-slate-100 rounded-lg" />
      </div>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export const CompanyApplicationsPage = () => {
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeStage, setActiveStage] = useState<StageFilter>('All');
  const [selectedJob, setSelectedJob] = useState(searchParams.get('job_id') || 'all');
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState<Record<string, any[]>>({});
  const [loadingFeedback, setLoadingFeedback] = useState<string | null>(null);

  // Modal state
  const [scheduleModal, setScheduleModal] = useState<{ isOpen: boolean; application: any }>({ isOpen: false, application: null });
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; app: any }>({ isOpen: false, app: null });
  const [hireConfirm, setHireConfirm] = useState<{ isOpen: boolean; app: any; loading: boolean }>({ isOpen: false, app: null, loading: false });

  // Comparison state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else if (next.size < 3) { next.add(id); }
      else { toast.error('You can compare up to 3 candidates at once.'); }
      return next;
    });
  };

  const selectedCandidates = useMemo(
    () => applications.filter(a => selectedIds.has(a.id)),
    [applications, selectedIds]
  );

  usePageTitle('Applications');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/applications', {
        params: { job_id: selectedJob === 'all' ? undefined : selectedJob },
      });
      setApplications(unwrapArray(data, ['applications']));
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, [selectedJob]);

  useEffect(() => {
    const jobId = searchParams.get('job_id');
    setSelectedJob(jobId || 'all');
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/jobs', { params: { limit: 100 } });
        setJobs(unwrapArray(data, ['jobs']));
      } catch { /* silent */ }
    })();
  }, []);

  const handleStageChange = async (id: string, status: string, notes = '') => {
    try {
      await api.patch(`/applications/${id}/stage`, { stage: status, notes });
      toast.success(`Application ${status === 'hired' ? 'marked as hired' : 'updated'}`);
      fetchApplications();
    } catch {
      toast.error('Failed to update application');
    }
  };

  const handleReject = async (app: any, reason: string, message: string) => {
    await handleStageChange(app.id, 'rejected', [reason, message].filter(Boolean).join(' — '));
    setRejectModal({ isOpen: false, app: null });
  };

  const handleHire = async () => {
    if (!hireConfirm.app) return;
    setHireConfirm(prev => ({ ...prev, loading: true }));
    try {
      await handleStageChange(hireConfirm.app.id, 'hired');
      setHireConfirm({ isOpen: false, app: null, loading: false });
    } catch {
      setHireConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  const toggleFeedback = async (appId: string) => {
    if (expandedApp === appId) { setExpandedApp(null); return; }
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

  // Stage counts
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { All: applications.length };
    applications.forEach(app => {
      const s = (app.status || '').toLowerCase();
      if (['new', 'applied', 'screening', 'shortlisted'].includes(s)) counts['New'] = (counts['New'] || 0) + 1;
      else if (s.startsWith('interview_') || s === 'interview') counts['Interview'] = (counts['Interview'] || 0) + 1;
      else if (s === 'hired') counts['Hired'] = (counts['Hired'] || 0) + 1;
      else if (s === 'rejected') counts['Rejected'] = (counts['Rejected'] || 0) + 1;
    });
    return counts;
  }, [applications]);

  const filtered = useMemo(() => applications.filter(app => {
    const name = (app.candidate_name || app.user_name || '').toLowerCase();
    const matchesSearch = !search || name.includes(search.toLowerCase()) ||
      (app.job_title || '').toLowerCase().includes(search.toLowerCase());

    if (activeStage === 'All') return matchesSearch;
    const s = (app.status || '').toLowerCase();
    if (activeStage === 'New') return matchesSearch && ['new', 'applied', 'screening', 'shortlisted'].includes(s);
    if (activeStage === 'Interview') return matchesSearch && (s.startsWith('interview_') || s === 'interview');
    if (activeStage === 'Hired') return matchesSearch && s === 'hired';
    if (activeStage === 'Rejected') return matchesSearch && s === 'rejected';
    return matchesSearch;
  }), [applications, search, activeStage]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Page header ── */}
      <div className="topbar-frost px-6 py-4 sticky top-0 z-40">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
            Workspace &rsaquo; <span className="text-slate-600">Applications</span>
          </p>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              Applications
            </h1>
            <span className="chip-brand">{applications.length} Pipeline Entries</span>
          </div>
        </div>
      </div>

      <main className="p-6 max-w-[1400px] w-full mx-auto space-y-6 flex-1 animate-fade-in-up">
        {/* ── Toolbar ── */}
        <div className="panel p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
              <input
                type="text"
                placeholder="Search candidates or job posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-premium pl-9 text-xs py-2 bg-slate-50/50"
              />
            </div>

            {/* Job filter */}
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="input-premium pl-8 pr-8 py-2 text-xs bg-slate-50/50 font-bold text-slate-600 appearance-none min-w-[180px]"
              >
                <option value="all">All Jobs</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Compare actions */}
            {selectedIds.size >= 2 && (
              <button
                onClick={() => setCompareOpen(true)}
                className="btn-primary py-2 px-4 text-xs"
              >
                <GitCompare size={13} />
                Compare ({selectedIds.size})
              </button>
            )}
            {selectedIds.size === 1 && (
              <span className="text-[10px] text-slate-500 font-bold px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl">
                Select 1 more to compare
              </span>
            )}

            {/* Stage tabs */}
            <div className="flex items-center bg-slate-100/80 border border-slate-200/50 rounded-xl p-0.5 gap-0.5">
              {STAGE_FILTERS.map((stage) => {
                const count = stageCounts[stage] || 0;
                const isActive = activeStage === stage;
                return (
                  <button
                    key={stage}
                    onClick={() => setActiveStage(stage)}
                    className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition-spring cursor-pointer flex items-center gap-1 ${
                      isActive ? 'bg-white text-slate-900 shadow-sm border border-slate-200/40' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {stage}
                    {stage !== 'All' && count > 0 && (
                      <span className={`text-[9px] font-bold px-1.5 rounded-full ${isActive ? 'bg-violet-100 text-violet-700' : 'bg-slate-200/80 text-slate-500'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Application list ── */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map(i => <AppCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center panel">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/60 mx-auto flex items-center justify-center mb-4">
              <Filter size={24} className="text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mt-1" style={{ fontFamily: 'Sora' }}>No Applications Found</h3>
            <p className="text-xs text-slate-400 font-medium mt-1.5 max-w-xs mx-auto">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="panel divide-y divide-slate-100 overflow-hidden list-slide-in">
            {filtered.map((app, i) => {
              const name = app.candidate_name || app.user_name || 'Unknown';
              const email = app.candidate_email || app.user_email || '';
              const initials = getInitials(name);
              const gradient = GRADIENTS[i % GRADIENTS.length];
              const aiScore = typeof app.ai_score === 'number' ? app.ai_score : null;
              const scoreStyle = aiScore != null ? getAiScoreStyle(aiScore) : null;
              const date = app.created_at
                ? new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '—';
              const isExpanded = expandedApp === app.id;
              const appFeedback = feedbackData[app.id] || [];
              const status = String(app.status || '').toLowerCase();
              const latestStatus = String(app.latest_interview_status || '').toLowerCase();
              const latestRound = Number(app.latest_interview_round || 0);
              const totalRounds = Number(app.interview_rounds || 1);
              const isLastRound = latestRound >= totalRounds;

              return (
                <div
                  key={app.id || i}
                  className="overflow-hidden transition-colors duration-200 hover:bg-slate-50/20"
                >
                  {/* ── Main row ── */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4">
                    {/* Select checkbox */}
                    <div
                      onClick={() => toggleSelect(app.id)}
                      className="shrink-0 cursor-pointer"
                    >
                      <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-spring ${
                        selectedIds.has(app.id)
                          ? 'bg-violet-600 border-violet-600 shadow-sm shadow-violet-200'
                          : 'bg-white border-slate-300 hover:border-violet-400'
                      }`}>
                        {selectedIds.has(app.id) && (
                          <svg width="9" height="7" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Avatar + info */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-extrabold text-[11px] shrink-0 shadow-sm border border-slate-700/5`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-900 leading-none">{name}</p>
                          <span className={getStageStyle(app.status)}>
                            {getStageLabel(app)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 font-semibold flex-wrap mt-1">
                          <span className="text-slate-700 truncate max-w-[180px]">{app.job_title || '—'}</span>
                          <span className="text-slate-350">•</span>
                          <span className="truncate max-w-[200px]">{email}</span>
                        </div>
                      </div>
                    </div>

                    {/* AI score + date */}
                    <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                      {aiScore != null && scoreStyle && (
                        <div className="flex flex-col items-end gap-1">
                          <span className={scoreStyle.badge}>
                            <Sparkles size={10} />
                            {aiScore}% fit
                          </span>
                          <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-spring ${scoreStyle.bar}`} style={{ width: `${aiScore}%` }} />
                          </div>
                        </div>
                      )}
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">{date}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <button
                        onClick={() => toggleFeedback(app.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-650 border border-slate-200 rounded-xl text-[10.5px] font-bold transition-spring shadow-sm h-8.5 hover:border-slate-300 cursor-pointer"
                      >
                        <Eye size={12} className="text-slate-450" />
                        Feedback
                        {isExpanded
                          ? <ChevronUp size={11} className="text-slate-450" />
                          : <ChevronDown size={11} className="text-slate-450" />}
                      </button>

                      {/* Contextual action buttons */}
                      {(['new', 'applied', 'screening', 'shortlisted'].includes(status)) && (
                        <>
                          <button
                            onClick={() => setScheduleModal({ isOpen: true, application: app })}
                            className="btn-primary py-1.5 px-3.5 text-[10.5px] h-8.5"
                          >
                            Schedule Interview
                          </button>
                          <button
                            onClick={() => setRejectModal({ isOpen: true, app })}
                            className="btn-soft px-3.5 text-[10.5px] h-8.5 hover:bg-red-50 hover:text-red-655 hover:border-red-200"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {(status.startsWith('interview_') || status === 'interview') && (() => {
                        if (latestStatus === 'scheduled' || latestStatus === 'reschedule_requested') {
                          return (
                            <>
                              <span className="h-8.5 inline-flex items-center px-3 bg-violet-50 text-violet-700 border border-violet-100 rounded-xl text-[10.5px] font-bold">
                                {latestStatus === 'reschedule_requested' ? 'Reschedule Pending' : 'Interview Scheduled'}
                              </span>
                              {isLastRound && (
                                <button
                                  onClick={() => setHireConfirm({ isOpen: true, app, loading: false })}
                                  className="h-8.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10.5px] font-bold transition-spring shadow-sm shadow-emerald-150 cursor-pointer"
                                >
                                  Hire
                                </button>
                              )}
                              <button
                                  onClick={() => setRejectModal({ isOpen: true, app })}
                                  className="btn-soft px-3.5 text-[10.5px] h-8.5 hover:bg-red-50 hover:text-red-655 hover:border-red-200"
                                >
                                  Reject
                                </button>
                            </>
                          );
                        }
                        if (latestStatus === 'completed' || !latestStatus) {
                          if (!isLastRound) {
                            return (
                              <>
                                <button
                                  onClick={() => setScheduleModal({ isOpen: true, application: app })}
                                  className="btn-primary py-1.5 px-3.5 text-[10.5px] h-8.5"
                                >
                                  Schedule Next Round
                                </button>
                                <button
                                  onClick={() => setRejectModal({ isOpen: true, app })}
                                  className="btn-soft px-3.5 text-[10.5px] h-8.5 hover:bg-red-50 hover:text-red-655 hover:border-red-200"
                                >
                                  Reject
                                </button>
                              </>
                            );
                          }
                          return (
                            <>
                              <button
                                onClick={() => setHireConfirm({ isOpen: true, app, loading: false })}
                                className="h-8.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10.5px] font-bold transition-spring shadow-sm shadow-emerald-150 cursor-pointer"
                              >
                                Hire Candidate
                              </button>
                              <button
                                onClick={() => setRejectModal({ isOpen: true, app })}
                                className="btn-soft px-3.5 text-[10.5px] h-8.5 hover:bg-red-50 hover:text-red-655 hover:border-red-200"
                              >
                                Reject
                              </button>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* ── Feedback drawer ── */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/40 p-5 space-y-4 animate-fade-in-up">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <MessageSquare size={12} className="text-violet-500" />
                        Interview Feedback · {name}
                      </div>

                      {loadingFeedback === app.id ? (
                        <div className="flex items-center gap-2 py-4">
                          <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-slate-450 font-bold">Retrieving scorecards...</span>
                        </div>
                      ) : appFeedback.length === 0 ? (
                        <div className="py-8 text-center bg-white border border-slate-150 rounded-2xl max-w-md mx-auto shadow-sm">
                          <MessageSquare size={20} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-500">No scorecards submitted</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Feedback details will load after the interviews are completed.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {appFeedback.map((f: any, fi: number) => {
                            const hasFeedback = !!f.rating;
                            const isAptitude = (f.round_type || '').toLowerCase() === 'aptitude';
                            const aptitudePct = f.aptitude_score != null ? Math.round((f.aptitude_score / 20) * 100) : null;
                            return (
                              <div key={f.interview_id || f.id || fi} className="outer-bezel">
                                <div className="inner-core space-y-3">
                                  {/* Round header */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                                        <Award size={14} className="text-violet-600" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="text-xs font-extrabold text-slate-900 capitalize">
                                            {f.round_type || 'Interview'} Round
                                          </p>
                                          {f.round_number && (
                                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                              #{f.round_number}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-0.5 flex-wrap">
                                          <User size={10} className="text-slate-400" />
                                          {f.interviewer_name || 'Interviewer'}
                                          {f.scheduled_at && (
                                            <>
                                              <span className="text-slate-300">·</span>
                                              <Calendar size={10} className="text-slate-400" />
                                              {new Date(f.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {f.recommendation && (
                                        <span className={REC_STYLE[f.recommendation] || 'badge-premium bg-slate-100 text-slate-650'}>
                                          {REC_LABEL[f.recommendation] || f.recommendation}
                                        </span>
                                      )}
                                      {!hasFeedback && (
                                        <span className="badge-premium badge-amber">
                                          {f.interview_status === 'completed' || isAptitude ? 'Completed' : 'Pending feedback'}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Aptitude score block */}
                                  {isAptitude && f.aptitude_score != null && (
                                    <div className="flex items-center gap-4 p-3.5 rounded-xl bg-violet-50/70 border border-violet-100">
                                      <div className="text-center shrink-0">
                                        <p className="text-2xl font-black text-violet-750">{f.aptitude_score}<span className="text-sm font-bold text-violet-400">/20</span></p>
                                        <p className="text-[9px] font-bold text-violet-500 uppercase tracking-wider">Aptitude Score</p>
                                      </div>
                                      <div className="flex-1">
                                        <div className="w-full bg-violet-100/50 rounded-full h-1.5 mb-1.5">
                                          <div
                                            className={`h-1.5 rounded-full transition-spring ${aptitudePct != null && aptitudePct >= 70 ? 'bg-emerald-500' : 'bg-violet-500'}`}
                                            style={{ width: `${aptitudePct ?? 0}%` }}
                                          />
                                        </div>
                                        <p className={`text-[10px] font-bold ${aptitudePct != null && aptitudePct >= 70 ? 'text-emerald-600' : 'text-violet-650'}`}>
                                          {aptitudePct}% &mdash; {aptitudePct != null && aptitudePct >= 70 ? 'Passed technical threshold' : 'Under target criteria'}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Aptitude pending */}
                                  {isAptitude && f.aptitude_score == null && (
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                                      <p className="text-xs text-slate-400 font-medium">Aptitude assessment not yet completed</p>
                                    </div>
                                  )}

                                  {/* Feedback details — only when feedback was submitted */}
                                  {hasFeedback && (
                                    <>
                                      <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map(s => (
                                          <Star key={s} size={13} className={s <= (f.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                                        ))}
                                        <span className="ml-1.5 text-[10.5px] font-bold text-slate-500">
                                          {f.rating}/5 &middot; {['', 'Poor', 'Below Avg', 'Average', 'Good', 'Excellent'][f.rating] || ''}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="p-3.5 rounded-xl bg-emerald-50/30 border border-emerald-100/60">
                                          <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600 mb-1">Strengths</p>
                                          <p className="text-xs font-medium text-slate-700 leading-relaxed">{f.strengths || 'Not provided'}</p>
                                        </div>
                                        <div className="p-3.5 rounded-xl bg-rose-50/20 border border-rose-100/50">
                                          <p className="text-[9px] font-black uppercase tracking-wider text-rose-600 mb-1">Areas for Improvement</p>
                                          <p className="text-xs font-medium text-slate-700 leading-relaxed">{f.weaknesses || 'Not provided'}</p>
                                        </div>
                                      </div>

                                      {f.additional_comments && (
                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Notes</p>
                                          <p className="text-xs font-medium text-slate-655 leading-relaxed italic">&ldquo;{f.additional_comments}&rdquo;</p>
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {/* Non-aptitude round with no feedback yet */}
                                  {!hasFeedback && !isAptitude && (
                                    <p className="text-xs text-slate-400 font-medium text-center py-2">
                                      Interviewer feedback pending
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
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

      {/* ── Modals ── */}
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

      <RejectCandidateModal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, app: null })}
        onConfirm={(reason, msg) => handleReject(rejectModal.app, reason, msg)}
        candidateName={rejectModal.app?.candidate_name || rejectModal.app?.user_name || 'Candidate'}
        jobTitle={rejectModal.app?.job_title}
      />

      <ConfirmDialog
        isOpen={hireConfirm.isOpen}
        onClose={() => setHireConfirm({ isOpen: false, app: null, loading: false })}
        onConfirm={handleHire}
        title={`Hire ${hireConfirm.app?.candidate_name || 'this candidate'}?`}
        description={`This will mark ${hireConfirm.app?.candidate_name || 'the candidate'} as hired for ${hireConfirm.app?.job_title || 'this position'} and close their application.`}
        confirmLabel="Yes, Hire"
        variant="success"
        loading={hireConfirm.loading}
      />

      <CandidateCompareModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        candidates={selectedCandidates}
      />
    </div>
  );
};
