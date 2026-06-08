import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { usePageTitle } from '../../../shared/hooks/usePageTitle';
import {
  Video, Sparkles, Search, TrendingUp, Briefcase, CalendarDays,
  BarChart2, ChevronRight, Clock, MapPin, BadgeCheck, ArrowRight,
  Zap, Users, Trophy
} from 'lucide-react';
import { unwrapArray } from '../../../shared/lib/response';

// ── Skeleton helpers ────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] rounded-lg ${className}`}
    style={{ animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }}
  />
);

const JobCardSkeleton = () => (
  <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100">
    <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-40 rounded" />
      <Skeleton className="h-2.5 w-56 rounded" />
      <div className="flex gap-1.5 pt-1">
        <Skeleton className="h-5 w-14 rounded" />
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-5 w-12 rounded" />
      </div>
    </div>
    <Skeleton className="h-8 w-16 rounded-lg shrink-0" />
  </div>
);

// ── Stage step label map ────────────────────────────────────────────────────
const STAGE_STEPS = ['Applied', 'Round 1', 'Round 2', 'Offer'];
const getStageIndex = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'new' || s === 'applied') return 0;
  if (s === 'interview_1') return 1;
  if (s === 'interview_2') return 2;
  if (s === 'hired') return 3;
  return 0;
};

const getStatusBadge = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'hired') return { label: 'Hired', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (s === 'rejected') return { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200' };
  if (s.startsWith('interview')) return { label: 'Interview', cls: 'bg-violet-50 text-violet-700 border-violet-200' };
  return { label: 'Applied', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
};

export const CandidateDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  usePageTitle('Dashboard');
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const firstName = user?.name?.split(' ')[0] || 'there';

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/candidate/dashboard');
        const dashboard = res.data.data || {};
        setData({
          ...dashboard,
          stats: dashboard.stats || {},
          upcomingInterviews: unwrapArray(dashboard.upcomingInterviews),
          recentApplications: unwrapArray(dashboard.recentApplications),
          recommendedJobs: unwrapArray(dashboard.recommendedJobs),
        });
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const profileCompletion = data?.profileCompletion ?? 0;
  const stats = {
    profileViews: data?.stats?.profileViews ?? 0,
    activeApps: data?.stats?.activeApplications ?? 0,
    interviews: data?.stats?.scheduledInterviews ?? 0,
    matchScore: data?.stats?.averageMatchScore ?? 0,
  };
  const recommendedJobs = data?.recommendedJobs || [];
  const recentApplications = data?.recentApplications || [];
  const upcomingInterviews = data?.upcomingInterviews || [];
  const nextInterview = upcomingInterviews[0];

  const STAT_CARDS = [
    {
      label: 'Profile Views',
      value: stats.profileViews,
      icon: Users,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
    },
    {
      label: 'Active Apps',
      value: stats.activeApps,
      icon: Briefcase,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-100',
    },
    {
      label: 'Interviews',
      value: stats.interviews,
      icon: CalendarDays,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      label: 'Avg Match Score',
      value: stats.matchScore ? `${stats.matchScore}%` : '—',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Top header ── */}
      <div className="topbar-frost px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-0.5">
            Candidate · Dashboard
          </p>
          <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
            Hi, {firstName} 👋
            <span className="text-xs text-slate-400 font-normal ml-2">{today}</span>
          </h1>
        </div>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
          <input
            type="text"
            placeholder="Search jobs, companies..."
            onFocus={() => navigate('/candidate/jobs')}
            className="pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 w-[230px] font-medium text-slate-700 placeholder:text-slate-400 transition-all cursor-pointer"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
            readOnly
          />
        </div>
      </div>

      <main className="p-5 max-w-[1400px] w-full mx-auto space-y-6 flex-1">

        {/* ── Profile completion banner ── */}
        {!loading && profileCompletion < 100 && (
          <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5 shadow-lg shadow-violet-200/40">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
            <div className="relative w-14 h-14 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="none" />
                <circle cx="28" cy="28" r="24"
                  stroke="white" strokeWidth="4" fill="none"
                  strokeDasharray={150.8}
                  strokeDashoffset={150.8 - (150.8 * profileCompletion) / 100}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-black text-white text-[13px]" style={{ fontFamily: 'Sora' }}>
                {profileCompletion}%
              </span>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-white font-bold text-sm">Complete your profile to unlock more opportunities</h3>
              <p className="text-violet-200 text-xs font-medium mt-0.5">Profiles ≥ 90% get 4× more recruiter views.</p>
            </div>
            <Link
              to="/candidate/profile"
              className="shrink-0 px-5 py-2.5 bg-white text-violet-700 font-bold text-xs rounded-xl hover:bg-violet-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              Complete profile <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? [0, 1, 2, 3].map(i => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/60 animate-pulse">
                  <Skeleton className="h-3 w-20 rounded mb-3" />
                  <Skeleton className="h-9 w-14 rounded" />
                </div>
              ))
            : STAT_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="stat-card p-5 bg-white group cursor-pointer">
                    <div className="flex items-center gap-2 text-slate-400 mb-3">
                      <div className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                        <Icon size={13} className={card.color} strokeWidth={2.25} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">{card.label}</span>
                    </div>
                    <p className="data-number text-[32px] sm:text-[36px] leading-none font-black text-slate-900" style={{ fontFamily: 'Sora' }}>
                      {card.value}
                    </p>
                  </div>
                );
              })}
        </div>

        {/* ── Main two-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

          {/* Left column */}
          <div className="space-y-6">

            {/* Recommended jobs */}
            <div className="surface-raised p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Zap size={12} className="text-violet-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: 'Sora' }}>
                    Recommended for you
                  </h3>
                  <span className="text-[9px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    AI matched
                  </span>
                </div>
                <Link
                  to="/candidate/jobs"
                  className="text-[11px] font-bold text-violet-600 hover:text-violet-800 transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  {loading ? '' : `See all ${recommendedJobs.length > 0 ? recommendedJobs.length : ''}`}
                  <ChevronRight size={13} />
                </Link>
              </div>

              <div className="space-y-3">
                {loading
                  ? [0, 1, 2].map(i => <JobCardSkeleton key={i} />)
                  : recommendedJobs.length === 0
                  ? (
                    <div className="text-center py-10">
                      <Sparkles size={28} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs text-slate-500 font-medium">No recommendations yet.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Add more skills to your profile to get matched.</p>
                    </div>
                  )
                  : recommendedJobs.map((job: any) => (
                    <div
                      key={job.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/30 hover:border-violet-200 hover:bg-violet-50/20 transition-all duration-200 group cursor-pointer"
                      onClick={() => navigate('/candidate/jobs')}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0 group-hover:bg-violet-700 transition-colors duration-200">
                          {job.company_name?.charAt(0) || 'J'}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 group-hover:text-violet-700 transition-colors">
                            {job.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                            {job.company_name}
                            {job.location && (
                              <>
                                <span className="text-slate-300">·</span>
                                <MapPin size={9} className="text-slate-400" />
                                {job.location}
                              </>
                            )}
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            {(job.required_skills || []).slice(0, 3).map((t: string) => (
                              <span key={t} className="text-[9.5px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className="text-[10px] font-extrabold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-lg whitespace-nowrap">
                          {job.match_score || '—'}% match
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate('/candidate/jobs'); }}
                          className="text-[10.5px] font-bold bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm whitespace-nowrap"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Applications tracker */}
            <div className="surface-raised p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                    <BarChart2 size={12} className="text-blue-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: 'Sora' }}>
                    Your applications
                  </h3>
                </div>
                <Link
                  to="/candidate/applications"
                  className="text-[11px] font-bold text-violet-600 hover:text-violet-800 transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  {!loading && `View all (${recentApplications.length})`}
                  <ChevronRight size={13} />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-6">
                  {[0, 1].map(i => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-8 w-full rounded-xl" />
                      <Skeleton className="h-4 w-full rounded" />
                    </div>
                  ))}
                </div>
              ) : recentApplications.length === 0 ? (
                <div className="text-center py-10">
                  <Briefcase size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500 font-medium">No applications yet.</p>
                  <Link to="/candidate/jobs" className="text-[11px] text-violet-600 font-bold hover:underline mt-1 inline-block cursor-pointer">
                    Browse open jobs →
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {recentApplications.slice(0, 4).map((app: any) => {
                    const badge = getStatusBadge(app.status);
                    const activeStep = getStageIndex(app.status);
                    return (
                      <div key={app.id} className="space-y-3 pb-5 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                              {app.company_name?.charAt(0) || 'C'}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900 leading-tight">{app.job_title}</h4>
                              <p className="text-[10px] text-slate-400 font-semibold">{app.company_name}</p>
                            </div>
                          </div>
                          <span className={`text-[9.5px] font-bold border px-2 py-0.5 rounded-full uppercase tracking-wider ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>

                        {/* Progress stepper */}
                        <div className="relative flex items-center justify-between px-1">
                          <div className="absolute left-4 right-4 top-[7px] h-0.5 bg-slate-100" />
                          <div
                            className="absolute left-4 top-[7px] h-0.5 bg-violet-500 transition-all duration-700"
                            style={{ width: `${(activeStep / (STAGE_STEPS.length - 1)) * (100 - (8 / (STAGE_STEPS.length - 1)))}%` }}
                          />
                          {STAGE_STEPS.map((step, idx) => {
                            const done = idx < activeStep;
                            const active = idx === activeStep;
                            return (
                              <div key={step} className="flex flex-col items-center z-10">
                                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                  done ? 'bg-violet-600 border-violet-600' :
                                  active ? 'bg-white border-violet-600 ring-4 ring-violet-50 ring-offset-0' :
                                  'bg-white border-slate-200'
                                }`}>
                                  {done && <BadgeCheck size={9} className="text-white" />}
                                </div>
                                <span className={`text-[9px] font-bold mt-1.5 tracking-tight ${active ? 'text-violet-700' : done ? 'text-slate-500' : 'text-slate-300'}`}>
                                  {step}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">

            {/* Next interview */}
            <div className="surface-raised overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Interview</p>
              </div>
              {loading ? (
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-32 rounded" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-9 w-full rounded-xl" />
                </div>
              ) : nextInterview ? (
                <div className="p-5 space-y-4">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900" style={{ fontFamily: 'Sora' }}>
                      {new Date(nextInterview.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </h4>
                    <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(nextInterview.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {nextInterview.interviewer_name && ` · with ${nextInterview.interviewer_name}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      {nextInterview.company_name?.charAt(0) || 'C'}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-slate-800 truncate">{nextInterview.job_title || 'Interview'}</h5>
                      <p className="text-[10px] text-slate-500 font-semibold capitalize mt-0.5">{nextInterview.company_name} · {nextInterview.round_type || 'General'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/interview/${nextInterview.id}`)}
                    className="w-full bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Video size={13} /> Join Interview
                  </button>
                </div>
              ) : (
                <div className="p-5 text-center">
                  <CalendarDays size={28} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No upcoming interviews.</p>
                </div>
              )}
            </div>

            {/* AI Practice CTA */}
            <div
              onClick={() => navigate('/candidate/practice')}
              className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-5 cursor-pointer group shadow-lg shadow-violet-200/50 hover:shadow-xl hover:shadow-violet-300/40 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-3 border border-white/20">
                  <Trophy size={16} className="text-white" />
                </div>
                <h3 className="text-white font-bold text-sm leading-tight" style={{ fontFamily: 'Sora' }}>
                  AI Mock Interviews
                </h3>
                <p className="text-violet-200 text-[11px] font-medium mt-1 leading-relaxed">
                  Practice with an AI coach — behavioral, technical, and system design.
                </p>
                <div className="flex items-center gap-1 mt-3 text-white text-[11px] font-bold group-hover:gap-2 transition-all">
                  Start practicing <ArrowRight size={12} />
                </div>
              </div>
            </div>

            {/* Quick stats compact */}
            {!loading && upcomingInterviews.length > 1 && (
              <div className="surface-raised p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">All upcoming</p>
                <div className="space-y-2">
                  {upcomingInterviews.slice(1, 4).map((iv: any) => (
                    <div
                      key={iv.id}
                      onClick={() => navigate(`/interview/${iv.id}`)}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-violet-100 flex items-center justify-center text-slate-600 font-bold text-[11px] shrink-0 transition-colors">
                        {iv.company_name?.charAt(0) || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{iv.job_title}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{new Date(iv.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <ChevronRight size={13} className="text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default CandidateDashboard;
