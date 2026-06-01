import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { Link } from 'react-router-dom';
import {
  Video, Sparkles, Search
} from 'lucide-react';
import { DashboardHeader } from '../../../shared/components/DashboardHeader';
import { unwrapArray } from '../../../shared/lib/response';

export const CandidateDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
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
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#fafbfc]">
        <DashboardHeader title="Dashboard" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

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

  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc]">
      
      {/* Header bar matching Image 3 */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40">
        <div>
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <span>Candidate</span>
            <span>&rsaquo;</span>
            <span className="text-slate-600 font-semibold">Dashboard</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
            Hi, Alex 👋
            <span className="text-xs text-slate-400 font-medium ml-2">Tuesday · May 21</span>
          </h1>
        </div>

        {/* Search controls */}
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search candidates, jobs..."
              className="pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:outline-none w-[200px] font-medium text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      <main className="p-5 max-w-[1400px] w-full mx-auto space-y-6 flex-1 flex flex-col">
        
        {/* Profile Completion Circle Row */}
        {profileCompletion < 100 && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col sm:flex-row items-center gap-5 shadow-sm">
            {/* Circular Progress Gauge */}
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="transparent" r="26" cx="32" cy="32" />
                <circle className="text-violet-600 transition-all duration-1000" strokeWidth="4" strokeDasharray={163} strokeDashoffset={163 - (163 * profileCompletion) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="26" cx="32" cy="32" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-black text-slate-800 text-[13px]" style={{ fontFamily: 'Sora' }}>{profileCompletion}%</span>
            </div>

            {/* Checklist text */}
            <div className="flex-1 text-center sm:text-left space-y-1">
              <h3 className="text-[14px] font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Sora' }}>Complete your profile to 100%</h3>
              <div className="flex flex-wrap justify-center sm:justify-start gap-x-3 gap-y-1 text-[10.5px] text-slate-400 font-semibold">
                <span className="text-emerald-600 flex items-center gap-0.5">Resume ✓</span>
                <span className="text-emerald-600 flex items-center gap-0.5">Skills ✓</span>
                <span className="text-slate-400">Portfolio</span>
                <span className="text-slate-400">References</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">3 more steps · Profiles &ge; 90% get 4x more recruiter views.</p>
            </div>

            <Link to="/candidate/profile" className="text-[12px] font-bold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg transition-colors shrink-0">
              Continue &rarr;
            </Link>
          </div>
        )}

        {/* Stats Row Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Profile Views', value: stats.profileViews, color: 'text-violet-600 bg-violet-50' },
            { label: 'Active Apps', value: stats.activeApps, color: 'text-sky-600 bg-sky-50' },
            { label: 'Interviews', value: stats.interviews, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Match Score Avg', value: `${stats.matchScore}%`, color: 'text-emerald-600 bg-emerald-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">{stat.label}</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight block" style={{ fontFamily: 'Sora' }}>{stat.value}</span>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black ${stat.color}`}>
                {stat.label.charAt(0)}
              </div>
            </div>
          ))}
        </div>

        {/* Main Split Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          
          {/* Left panel: Recommendations & Applications Progress */}
          <div className="space-y-6">
            
            {/* Recommended Jobs */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-violet-500 animate-float" />
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider" style={{ fontFamily: 'Sora, sans-serif' }}>
                    Recommended for you
                  </h3>
                  <span className="text-[9px] font-black bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    AI matched
                  </span>
                </div>
                <Link to="/candidate/jobs" className="text-[11px] font-bold text-violet-600 hover:text-violet-700">See all 24 &rarr;</Link>
              </div>

              {/* Recommended Jobs list */}
              <div className="space-y-3">
                {recommendedJobs.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">No recommended jobs at the moment.</p>
                ) : recommendedJobs.map((job: any) => (
                  <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl border border-slate-150 bg-white hover:border-slate-250 transition-colors group">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                        {job.company_name?.charAt(0) || 'J'}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-violet-600 transition-colors">
                          {job.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {job.company_name} &middot; {job.location || 'Remote'} &middot; {job.salary_range || 'Salary TBD'}
                        </p>
                        <div className="flex gap-1.5 pt-1">
                          {job.required_skills?.slice(0,3).map((t: string) => (
                            <span key={t} className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-500">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                      <span className="text-xs font-black text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100">
                        {job.match_score || 85}% MATCH
                      </span>
                      <Link to={`/candidate/jobs/${job.id}`} className="text-[10.5px] font-bold bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-lg transition-colors">
                        Apply
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stepper Applications Tracker */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Your applications
                </h3>
                <Link to="/candidate/applications" className="text-[11px] font-bold text-violet-600 hover:text-violet-700">View all (8) &rarr;</Link>
              </div>

              {/* Steppers List */}
              <div className="space-y-6 pt-1">
                {recentApplications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">No recent applications.</p>
                ) : recentApplications.map((app: any) => (
                  <div key={app.id} className="space-y-3 border-b border-slate-50 pb-5 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 font-extrabold text-xs">
                          {app.company_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 leading-none">{app.job_title}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">{app.company_name}</p>
                        </div>
                      </div>
                      <span className="text-[9.5px] font-black bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {app.status}
                      </span>
                    </div>

                    {/* Stepper Timeline */}
                    <div className="flex items-center justify-between relative px-1 pt-2">
                      <div className="absolute left-4 right-4 top-[17px] h-0.5 bg-slate-100 -z-10" />
                      {['new', 'interview_1', 'interview_2', 'hired'].map((stageName) => {
                        const isActive = app.status === stageName;
                        const isCompleted = ['new', 'interview_1', 'interview_2', 'hired'].indexOf(app.status) > ['new', 'interview_1', 'interview_2', 'hired'].indexOf(stageName);
                        
                        return (
                          <div key={stageName} className="flex flex-col items-center relative z-10">
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 transition-all ${
                              isCompleted 
                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                : isActive 
                                  ? 'bg-violet-600 border-violet-600 ring-4 ring-violet-50' 
                                  : 'bg-white border-slate-200'
                            }`} />
                            <span className={`text-[9px] font-black mt-2 tracking-tight ${
                              isActive ? 'text-slate-800 font-bold' : 'text-slate-400'
                            } uppercase`}>
                              {stageName.replace('_', ' ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right panel widgets */}
          <div className="space-y-6">
            
            {/* Next Interview Panel Widget */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Next Interview</span>
              </div>
              
              {nextInterview ? (
                <div className="space-y-3.5">
                  <div>
                    <h4 className="text-base font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Sora' }}>
                      {new Date(nextInterview.scheduled_at).toLocaleDateString()}
                    </h4>
                    <p className="text-[10.5px] text-slate-400 font-semibold mt-1">with {nextInterview.interviewer_name || 'Interviewer'}</p>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      {nextInterview.company_name?.charAt(0) || 'C'}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-bold text-xs text-slate-800 truncate">{nextInterview.job_title || 'Job Interview'}</h5>
                      <p className="text-[10px] text-slate-400 font-semibold">{nextInterview.company_name || 'Company'}</p>
                    </div>
                  </div>

                  {nextInterview.meeting_url && (
                    <a href={nextInterview.meeting_url} target="_blank" rel="noreferrer" className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm">
                      <Video size={13} />
                      Join Meeting
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">No upcoming interviews scheduled.</p>
              )}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
};
export default CandidateDashboard;
