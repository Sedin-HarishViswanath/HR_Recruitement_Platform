import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../shared/lib/api';
import {
  Video, Calendar, Clock, User, CalendarClock, Sparkles, CheckCircle2,
  Compass, RefreshCw, Cpu, PlayCircle, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { unwrapArray } from '../../../shared/lib/response';
import { RescheduleRequestModal } from '../components/RescheduleRequestModal';

const AUTOMATED_ROUNDS = ['aptitude', 'technical'];

const ASSESSMENT_STATUS_CONFIG = {
  not_started: { label: 'Not Started', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  in_progress:  { label: 'In Progress',  color: 'bg-amber-50 text-amber-700 border-amber-200'  },
  completed:    { label: 'Completed',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export const CandidateInterviewsPage = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [rescheduleModal, setRescheduleModal] = useState<{ isOpen: boolean; interview: any }>({
    isOpen: false,
    interview: null,
  });

  const fetchInterviews = async () => {
    try {
      const { data } = await api.get('/candidate/interviews');
      setInterviews(unwrapArray(data, ['interviews']));
    } catch (err) {
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const isUpcoming = (iv: any) => {
    const automated = AUTOMATED_ROUNDS.includes(iv.round_type);
    if (automated) return iv.assessment_status !== 'completed';
    return ['scheduled', 'reschedule_requested'].includes(iv.status);
  };

  const filteredInterviews = interviews.filter(i =>
    activeTab === 'upcoming' ? isUpcoming(i) : !isUpcoming(i)
  );

  const activePrepInterview = filteredInterviews[0] || interviews[0];

  const getPrepQuestions = (roundType: string) => {
    const r = String(roundType || '').toLowerCase();
    if (r === 'technical') {
      return [
        "Solve problems step-by-step: read carefully, plan before coding.",
        "Know your time/space complexity — Big-O is commonly asked.",
        "Practice on arrays, strings, trees, and dynamic programming."
      ];
    }
    if (r === 'aptitude') {
      return [
        "Brush up on percentages, ratios, and number series.",
        "Logical reasoning and data interpretation are key.",
        "Work quickly — time management matters in MCQ tests."
      ];
    }
    return [
      "How do you handle scope conflicts with product leaders?",
      "Tell me about a time you had to make a high-stakes technical decision under pressure.",
      "How do you mentor junior developers and foster clean coding practices?"
    ];
  };

  const handleStartTest = async (interview: any) => {
    if (startingId) return;
    setStartingId(interview.id);
    try {
      await api.post(`/interviews/${interview.id}/start-assessment`);
      navigate(`/interview/${interview.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start assessment');
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="topbar-frost px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40">
        <div>
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <span>Candidate</span>
            <span>&rsaquo;</span>
            <span className="text-slate-600 font-semibold">Interviews</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              My Interviews
            </h1>
            <span className="text-xs text-slate-400 font-medium">{interviews.length} total</span>
          </div>
        </div>
      </div>

      <main className="p-5 max-w-[1400px] w-full mx-auto flex-1 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

          {/* Left panel: Timeline list */}
          <div className="space-y-4">
            <div className="flex bg-slate-100 border border-slate-200/40 p-0.5 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  activeTab === 'upcoming'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-450 hover:text-slate-700'
                }`}
              >
                Upcoming ({interviews.filter(isUpcoming).length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  activeTab === 'completed'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-450 hover:text-slate-700'
                }`}
              >
                Completed ({interviews.filter(i => !isUpcoming(i)).length})
              </button>
            </div>

            <div className="space-y-3">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-28 rounded-xl bg-white border border-slate-200 animate-pulse" />)
              ) : filteredInterviews.length === 0 ? (
                <div className="text-center py-20 surface-raised !rounded-xl max-w-xl mx-auto w-full">
                  <Calendar size={36} className="mx-auto text-slate-250 mb-3" />
                  <h3 className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Sora, sans-serif' }}>No interviews found</h3>
                  <p className="text-xs text-slate-400 mt-1">You don't have any {activeTab} interviews at the moment.</p>
                </div>
              ) : (
                filteredInterviews.map((interview) => {
                  const automated = AUTOMATED_ROUNDS.includes(interview.round_type);
                  const isScheduled = interview.status === 'scheduled';
                  const isPendingReschedule = interview.status === 'reschedule_requested';
                  const assessmentStatus = interview.assessment_status as keyof typeof ASSESSMENT_STATUS_CONFIG | null;
                  const assessmentCfg = assessmentStatus ? ASSESSMENT_STATUS_CONFIG[assessmentStatus] : null;
                  const canStartTest = automated && assessmentStatus !== 'completed';
                  const isStarting = startingId === interview.id;

                  const date = interview.scheduled_at
                    ? new Date(interview.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                    : null;
                  const time = interview.scheduled_at
                    ? new Date(interview.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : null;

                  return (
                    <div key={interview.id} className="bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between shadow-sm hover:shadow-md hover:border-slate-350 transition-all">
                      {/* Left: Company & round type icon */}
                      <div className="flex items-center gap-4 min-w-[200px]">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-[15px] border shrink-0 ${
                          automated
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-violet-500/10 text-violet-600 border-violet-500/20'
                        }`}>
                          {automated ? <Cpu size={18} /> : (interview.company_name?.[0] || 'C')}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 leading-tight">{interview.company_name}</h4>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider mt-1 flex items-center gap-1">
                            <span className={automated ? 'text-emerald-600' : 'text-violet-600'}>
                              {interview.round_type || 'Interview'}
                            </span>
                            {automated && (
                              <span className="text-slate-400">· Automated</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Middle: Details */}
                      <div className="flex-1 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-650 w-full md:w-auto md:px-4">
                        {automated ? (
                          <>
                            <div className="space-y-0.5 min-w-[120px]">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Cpu size={11} className="text-slate-400" /> Type
                              </p>
                              <p className="text-slate-800 font-bold capitalize">
                                {interview.round_type === 'technical' ? 'Coding Assessment' : 'Aptitude Test'}
                              </p>
                            </div>
                            <div className="space-y-0.5 min-w-[100px]">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Clock size={11} className="text-slate-400" /> Duration
                              </p>
                              <p className="text-slate-800 font-bold">{interview.duration} min</p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                              {assessmentCfg && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold ${assessmentCfg.color}`}>
                                  {assessmentCfg.label}
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            {date && (
                              <div className="space-y-0.5 min-w-[100px]">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                  <Calendar size={11} className="text-slate-400" /> Date
                                </p>
                                <p className="text-slate-800 font-bold">{date}</p>
                              </div>
                            )}
                            {time && (
                              <div className="space-y-0.5 min-w-[70px]">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                  <Clock size={11} className="text-slate-400" /> Time
                                </p>
                                <p className="text-slate-800 font-bold">{time}</p>
                              </div>
                            )}
                            <div className="space-y-0.5 min-w-[90px]">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Video size={11} className="text-slate-400" /> Format
                              </p>
                              <p className="text-slate-800 font-bold capitalize">{interview.round_type || 'Interview'}</p>
                            </div>
                            <div className="space-y-0.5 min-w-[120px]">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <User size={11} className="text-slate-400" /> Host
                              </p>
                              <p className="text-slate-800 font-bold truncate max-w-[130px]" title={interview.interviewer_name}>
                                {interview.interviewer_name || 'Hiring Manager'}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                        {/* Automated round actions */}
                        {automated && canStartTest && (
                          <button
                            onClick={() => handleStartTest(interview)}
                            disabled={isStarting}
                            className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[10.5px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm"
                          >
                            {isStarting
                              ? <><RefreshCw size={12} className="animate-spin" /> Starting...</>
                              : <><PlayCircle size={12} /> Start Test</>
                            }
                          </button>
                        )}
                        {automated && assessmentStatus === 'completed' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[9px] font-semibold uppercase tracking-wider">
                            <CheckCircle2 size={10} className="text-emerald-500" />
                            Submitted
                          </span>
                        )}
                        {automated && assessmentStatus === 'in_progress' && (
                          <button
                            onClick={() => navigate(`/interview/${interview.id}`)}
                            className="h-8 px-3.5 bg-amber-500 hover:bg-amber-600 text-white text-[10.5px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm"
                          >
                            <PlayCircle size={12} />
                            Resume Test
                          </button>
                        )}

                        {/* Live round actions */}
                        {!automated && isScheduled && (
                          <>
                            <button
                              onClick={() => navigate(`/interview/${interview.id}`)}
                              className="h-8 px-3.5 bg-violet-600 hover:bg-violet-700 text-white text-[10.5px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm"
                            >
                              <Video size={12} />
                              Join
                            </button>
                            <button
                              onClick={() => setRescheduleModal({ isOpen: true, interview })}
                              className="h-8 px-3 border border-slate-200 text-slate-650 hover:bg-slate-50 text-[10.5px] font-bold rounded-lg transition-all flex items-center gap-1 bg-white shadow-sm"
                            >
                              <CalendarClock size={12} className="text-slate-400" />
                              Reschedule
                            </button>
                          </>
                        )}
                        {!automated && isPendingReschedule && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/20 text-[9px] font-semibold uppercase tracking-wider">
                            <RefreshCw size={10} className="animate-spin text-blue-500" />
                            Reschedule Pending
                          </span>
                        )}
                        {!automated && !isScheduled && !isPendingReschedule && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20 text-[9px] font-semibold uppercase tracking-wider">
                            {interview.status || 'Completed'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: AI prep sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Sparkles size={13} className="text-violet-500 animate-float" />
                <h3 className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                  AI prep assistant
                </h3>
              </div>

              {activePrepInterview ? (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Round</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {activePrepInterview.company_name} &bull; {activePrepInterview.round_type || 'General'} Round
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                      Key tips for your {activePrepInterview.round_type || 'upcoming'} round:
                    </p>
                    <div className="space-y-2">
                      {getPrepQuestions(activePrepInterview.round_type).map((q, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[10.5px] text-slate-700 font-medium leading-normal hover:bg-slate-100/50 transition-colors">
                          {q}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Prep Checklist</div>
                    <div className="space-y-1.5 text-[10.5px] text-slate-600 font-medium">
                      {AUTOMATED_ROUNDS.includes(activePrepInterview.round_type) ? (
                        <>
                          <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Find a quiet, well-lit space</div>
                          <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Allow camera access when prompted</div>
                          <div className="flex items-center gap-2"><Lock size={12} className="text-slate-300" /> Do not switch tabs during the test</div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Test your microphone & camera</div>
                          <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Review job description keywords</div>
                          <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-slate-300" /> Research {activePrepInterview.company_name}'s values</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <Compass size={24} className="mx-auto text-slate-200 mb-2" />
                  No upcoming interview to prep for.
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Hiring Tips</h4>
              <ul className="space-y-2.5 text-[10.5px] text-slate-650 font-medium">
                <li className="leading-normal">&bull; <strong>STAR Method:</strong> Answer behavioral questions with Situation, Task, Action, and Result.</li>
                <li className="leading-normal">&bull; <strong>Ask Questions:</strong> Prepare 2-3 thoughtful questions about design structures or team culture.</li>
                <li className="leading-normal">&bull; <strong>Clean Space:</strong> Ensure a quiet background with solid lighting before joining calls.</li>
              </ul>
            </div>
          </div>

        </div>
      </main>

      {rescheduleModal.interview && (
        <RescheduleRequestModal
          isOpen={rescheduleModal.isOpen}
          onClose={() => setRescheduleModal({ isOpen: false, interview: null })}
          onSuccess={fetchInterviews}
          interviewId={rescheduleModal.interview.id}
          interviewType={rescheduleModal.interview.round_type}
          companyName={rescheduleModal.interview.company_name}
        />
      )}
    </div>
  );
};
export default CandidateInterviewsPage;
