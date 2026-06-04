import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../../shared/hooks/usePageTitle';
import { io, Socket } from 'socket.io-client';
import { api } from '../../../shared/lib/api';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { toast } from 'sonner';
import { CodeEditor } from '../components/CodeEditor';
import { AptitudeTest } from '../components/AptitudeTest';
import { MeetingPanel } from '../components/MeetingPanel';
import { SubmitFeedbackModal } from '../../company/components/SubmitFeedbackModal';
import {
  ArrowLeft, Calendar, Clock, User, Briefcase, AlertCircle,
  CheckCircle2, Trophy, RefreshCw
} from 'lucide-react';

export const InterviewWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  usePageTitle(interview ? `Interview · ${interview.candidate_name ?? ''}` : 'Interview Workspace');
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Live aptitude score state for the interviewer view
  const [liveAptitudeScore, setLiveAptitudeScore] = useState<{ score: number; total: number } | null>(null);
  const [aptitudeCompleted, setAptitudeCompleted] = useState(false);

  const isCandidate = user?.role === 'Candidate';

  // ── Load interview ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) { setError('No interview ID provided'); setLoading(false); return; }
    api.get(`/interviews/${id}`)
      .then(res => {
        const data = res.data?.data;
        if (!data) { setError('Interview not found or you do not have access.'); }
        else {
          setInterview(data);
          if (data.status === 'completed' && data.aptitude_score != null) {
            setLiveAptitudeScore({ score: data.aptitude_score, total: 20 });
            setAptitudeCompleted(true);
          }
        }
      })
      .catch(err => {
        const msg = err?.response?.data?.message || 'Failed to load interview details';
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ── Socket: join interview room + listen for aptitude-score-updated ─────────
  useEffect(() => {
    if (!id || !accessToken) return;

    const socket: Socket = io({ auth: { token: accessToken } });
    socket.emit('join-interview', id);

    socket.on('aptitude-score-updated', (data: { score: number; total: number }) => {
      setLiveAptitudeScore({ score: data.score, total: data.total });
      setAptitudeCompleted(true);
      // Update local interview state so the UI reflects completion
      setInterview((prev: any) => prev ? { ...prev, status: 'completed', aptitude_score: data.score } : prev);
    });

    return () => { socket.disconnect(); };
  }, [id, accessToken]);

  // ── Beforeunload guard during active interview ──────────────────────────────
  useEffect(() => {
    if (!interview) return;
    const roundType = (interview.round_type || '').toLowerCase();
    const isActive = interview.status === 'scheduled' && (roundType === 'technical' || roundType === 'hr');
    if (!isActive) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [interview]);

  const promptForFeedback = useCallback(() => {
    if (isCandidate) return;
    if (interview?.status === 'completed') {
      toast.info('Feedback has already been submitted for this interview.');
      return;
    }
    setShowFeedbackModal(true);
  }, [isCandidate, interview]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white gap-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-medium text-sm">Loading workspace...</p>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error || !interview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-sm w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Workspace Unavailable</h2>
          <p className="text-slate-400 text-sm font-medium mb-6">{error || 'Interview not found.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors cursor-pointer text-sm"
          >
            <ArrowLeft size={15} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const roundType = (interview.round_type || '').toLowerCase();

  // ── Shared header component ─────────────────────────────────────────────────
  const WorkspaceHeader = () => (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
      <button
        onClick={() => navigate(-1)}
        className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} />
      </button>
      <div className="flex-1 flex items-center gap-4 min-w-0 text-[11px] text-slate-400 font-semibold">
        <span className="flex items-center gap-1.5">
          <User size={12} className="text-slate-600" />
          <span className="text-slate-300 font-bold truncate max-w-[120px]">{interview.candidate_name || 'Candidate'}</span>
        </span>
        <span className="text-slate-700">·</span>
        <span className="flex items-center gap-1.5">
          <Briefcase size={12} className="text-slate-600" />
          <span className="truncate max-w-[140px]">{interview.job_title || 'Position'}</span>
        </span>
        {interview.scheduled_at && (
          <>
            <span className="text-slate-700">·</span>
            <span className="flex items-center gap-1.5">
              <Calendar size={12} className="text-slate-600" />
              {new Date(interview.scheduled_at).toLocaleDateString()}
            </span>
            <span className="text-slate-700">·</span>
            <span className="flex items-center gap-1.5">
              <Clock size={12} className="text-slate-600" />
              {new Date(interview.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </>
        )}
      </div>
      <span className="shrink-0 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest rounded-full bg-violet-900/40 text-violet-300 border border-violet-800">
        {interview.round_type} Round
      </span>
    </div>
  );

  // ── APTITUDE ROUND ──────────────────────────────────────────────────────────
  if (roundType === 'aptitude') {
    if (isCandidate) {
      return (
        <div className="flex flex-col h-screen w-full bg-[#f8fafc]">
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0 shadow-sm/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <Briefcase size={15} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{interview.company_name} — Aptitude Assessment</p>
                <p className="text-xs text-slate-500 font-medium">{interview.job_title}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
              20 Questions · Do not close this tab
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <AptitudeTest
              interviewId={interview.id}
              onComplete={() => toast.success('Test submitted! You may close this window.')}
            />
          </div>
        </div>
      );
    }

    // Interviewer view — real-time socket updates instead of manual reload
    const displayScore = liveAptitudeScore ?? (
      interview.aptitude_score != null
        ? { score: interview.aptitude_score, total: 20 }
        : null
    );
    const isCompleted = aptitudeCompleted || interview.status === 'completed';
    const pct = displayScore ? Math.round((displayScore.score / displayScore.total) * 100) : 0;
    const passed = pct >= 70;

    return (
      <div className="flex flex-col h-screen w-full bg-slate-900">
        <WorkspaceHeader />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-sm w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto border border-blue-800">
              <Briefcase size={30} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Sora' }}>Aptitude Round</h2>
              <p className="text-slate-400 text-sm font-medium mt-1">{interview.candidate_name}</p>
            </div>

            {isCompleted && displayScore ? (
              <div className="space-y-4">
                <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700">
                  <div className="text-5xl font-black text-blue-400 mb-1" style={{ fontFamily: 'Sora' }}>
                    {displayScore.score}
                    <span className="text-2xl text-slate-500">/{displayScore.total}</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Final Score</p>
                  <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${passed ? 'bg-emerald-500' : 'bg-violet-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className={`flex items-center justify-center gap-1.5 text-sm font-bold ${passed ? 'text-emerald-400' : 'text-violet-400'}`}>
                    {passed ? <CheckCircle2 size={15} /> : <Trophy size={15} />}
                    {pct}% — {passed ? 'Recommended to Hire' : 'Below Threshold'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-violet-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                <p className="text-amber-300 font-semibold text-sm">Test in progress...</p>
                <p className="text-slate-400 text-xs font-medium leading-relaxed">
                  The candidate is taking the assessment. Score will appear here automatically when they submit.
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-600 font-medium">
                  <RefreshCw size={10} className="animate-spin" />
                  Waiting for submission
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── HR ROUND ────────────────────────────────────────────────────────────────
  if (roundType === 'hr') {
    return (
      <div className="flex flex-col h-screen w-full bg-slate-900">
        <WorkspaceHeader />
        <div className="flex-1 min-h-0">
          <MeetingPanel
            interviewId={interview.id}
            candidateName={interview.candidate_name}
            jobTitle={interview.job_title}
            participantRole={isCandidate ? 'candidate' : 'interviewer'}
            onMeetingWindowClosed={promptForFeedback}
          />
        </div>
        {!isCandidate && (
          <SubmitFeedbackModal
            isOpen={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
            onSuccess={() => navigate('/company/interviews')}
            interview={interview}
          />
        )}
      </div>
    );
  }

  // ── TECHNICAL ROUND — Code Editor + Meeting Panel ───────────────────────────
  if (roundType === 'technical') {
    return (
      <div className="flex flex-col h-screen w-full bg-[#0d0f1a]">
        {/* Technical header */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1a1d2e] border-b border-[#252840] shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 text-slate-600 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
          </button>
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <span className="text-sm font-bold text-slate-200 truncate">{interview.company_name}</span>
            <span className="text-slate-700">·</span>
            <span className="text-[11px] text-slate-500 truncate">{interview.job_title}</span>
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-emerald-400 border border-emerald-800 bg-emerald-900/20 px-3 py-1 rounded-full shrink-0">
            Technical
          </span>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-w-0 h-full">
            <CodeEditor
              interviewId={interview.id}
              isReadOnly={!isCandidate}
              accessToken={accessToken ?? undefined}
            />
          </div>
          <div className="w-[340px] shrink-0 h-full border-l border-[#252840]">
            <MeetingPanel
              interviewId={interview.id}
              candidateName={interview.candidate_name}
              jobTitle={interview.job_title}
              participantRole={isCandidate ? 'candidate' : 'interviewer'}
              onMeetingWindowClosed={promptForFeedback}
            />
          </div>
        </div>

        {!isCandidate && (
          <SubmitFeedbackModal
            isOpen={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
            onSuccess={() => navigate('/company/interviews')}
            interview={interview}
          />
        )}
      </div>
    );
  }

  // ── FALLBACK ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen w-full bg-slate-900">
      <WorkspaceHeader />
      <div className="flex-1 min-h-0">
        <MeetingPanel
          interviewId={interview.id}
          candidateName={interview.candidate_name}
          jobTitle={interview.job_title}
          participantRole={isCandidate ? 'candidate' : 'interviewer'}
          onMeetingWindowClosed={promptForFeedback}
        />
      </div>
      {!isCandidate && (
        <SubmitFeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          onSuccess={() => navigate('/company/interviews')}
          interview={interview}
        />
      )}
    </div>
  );
};
