import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../shared/lib/api';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { CodeEditor } from '../components/CodeEditor';
import { AptitudeTest } from '../components/AptitudeTest';
import { MeetingPanel } from '../components/MeetingPanel';
import { SubmitFeedbackModal } from '../../company/components/SubmitFeedbackModal';
import { ArrowLeft, Calendar, Clock, User, Briefcase, AlertCircle } from 'lucide-react';

export const InterviewWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const user = useSelector((state: any) => state.auth.user);

  useEffect(() => {
    if (!id) {
      setError('No interview ID provided');
      setLoading(false);
      return;
    }
    const fetchInterview = async () => {
      try {
        const res = await api.get(`/interviews/${id}`);
        const data = res.data?.data;
        if (!data) {
          setError('Interview not found or you do not have access.');
        } else {
          setInterview(data);
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Failed to load interview details';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [id]);

  // â”€â”€ Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-medium">Loading workspace...</p>
      </div>
    );
  }

  // â”€â”€ Error state
  if (error || !interview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Workspace Unavailable</h2>
          <p className="text-slate-400 font-medium mb-6">{error || 'Interview not found.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const isCandidate = user?.role === 'Candidate';
  const isReadOnly = !isCandidate; // Interviewers watch, candidates type
  const roundType = (interview.round_type || '').toLowerCase();
  const feedbackAlreadySubmitted = interview.status === 'completed';

  const promptForFeedback = () => {
    if (!isCandidate) {
      if (feedbackAlreadySubmitted) {
        toast.info('Feedback has already been submitted for this interview.');
        return;
      }
      setShowFeedbackModal(true);
    }
  };

  // â”€â”€ Interview info header (shown in all workspace types for interviewers)
  const WorkspaceHeader = () => (
    <div className="flex items-center gap-4 px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
      <button
        onClick={() => navigate(-1)}
        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
      >
        <ArrowLeft size={18} />
      </button>
      <div className="flex-1 flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <User size={14} className="text-slate-500" />
          <span className="font-semibold truncate">{interview.candidate_name || 'Candidate'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Briefcase size={14} className="text-slate-500" />
          <span className="truncate">{interview.job_title || 'Position'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Calendar size={14} className="text-slate-500" />
          <span>{interview.scheduled_at ? new Date(interview.scheduled_at).toLocaleDateString() : 'â€”'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Clock size={14} className="text-slate-500" />
          <span>{interview.scheduled_at ? new Date(interview.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'â€”'}</span>
        </div>
      </div>
      <span className="shrink-0 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-blue-900/40 text-blue-300 border border-blue-800">
        {interview.round_type} Round
      </span>
    </div>
  );

  // â”€â”€ APTITUDE ROUND
  if (roundType === 'aptitude') {
    if (isCandidate) {
      return (
        <div className="flex flex-col h-screen w-full bg-[#f8fafc]">
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Briefcase size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{interview.company_name} â€” Aptitude Assessment</p>
                <p className="text-xs text-slate-500">{interview.job_title}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500">20 Questions Â· Do not refresh</span>
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
    // Interviewer View for Aptitude
    return (
      <div className="flex flex-col h-screen w-full bg-slate-900">
        <WorkspaceHeader />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center">
            <div className="w-20 h-20 bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-800">
              <Briefcase size={36} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Aptitude Round</h2>
            {interview.status === 'completed' ? (
              <div className="mt-4">
                <p className="text-slate-400 font-medium mb-4">Candidate has completed the assessment.</p>
                <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-700">
                  <div className="text-5xl font-black text-blue-400 mb-2">
                    {interview.aptitude_score ?? 'â€”'}<span className="text-2xl text-slate-500">/20</span>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Final Score</p>
                  {interview.aptitude_score != null && (
                    <div className={`mt-3 text-sm font-bold ${(interview.aptitude_score / 20) >= 0.7 ? 'text-emerald-400' : 'text-violet-400'}`}>
                      {Math.round((interview.aptitude_score / 20) * 100)}% â€” {(interview.aptitude_score / 20) >= 0.7 ? 'Recommended to Hire' : 'Below Threshold'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                  <p className="text-amber-300 font-semibold text-sm">Test in progress...</p>
                </div>
                <p className="text-slate-400 font-medium text-sm">
                  The candidate is currently taking the 20-question aptitude test.
                  This page will update once they submit.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-6 px-4 py-2 bg-slate-700 text-slate-200 font-semibold rounded-xl hover:bg-slate-600 transition-colors text-sm"
                >
                  Refresh to check score
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // â”€â”€ HR ROUND â€” video room for both
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

  // â”€â”€ TECHNICAL ROUND â€” Code Editor (65%) + Meeting Panel (35%)
  if (roundType === 'technical') {
    const header = (
      <div className="flex items-center gap-3 px-4 py-2 bg-[#1a1d2e] border-b border-[#252840] shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 text-gray-500 hover:text-white rounded-lg transition-colors"
        >
          <ArrowLeft size={15} />
        </button>
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span className="text-sm font-bold text-gray-200 truncate">
            {interview.company_name}
          </span>
          <span className="text-gray-700">Â·</span>
          <span className="text-sm text-gray-400 truncate">{interview.job_title}</span>
        </div>
        <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-800 bg-emerald-900/30 px-3 py-1 rounded-full">
          Technical Round
        </span>
      </div>
    );

    return (
      <div className="flex flex-col h-screen w-full bg-[#0f111a]">
        {header}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Code Editor â€” 65% */}
          <div className="flex-1 min-w-0 h-full">
            <CodeEditor
              interviewId={interview.id}
              isReadOnly={!isCandidate && isReadOnly}
            />
          </div>
          {/* Meeting Panel â€” 35% */}
          <div className="w-[340px] shrink-0 h-full">
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

  // â”€â”€ FALLBACK â€” unknown round type, just show video call
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
