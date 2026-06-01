import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../shared/lib/api';
import { toast } from 'sonner';
import {
  Calendar, Clock, Video, Plus,
  Brain, AlertCircle, CheckSquare, MessageSquare,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { ScheduleInterviewModal } from '../components/ScheduleInterviewModal';
import { SubmitFeedbackModal } from '../components/SubmitFeedbackModal';
import { unwrapArray } from '../../../shared/lib/response';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';

const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
};

const avatarColors = [
  'bg-sky-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500',
  'bg-purple-500', 'bg-teal-500', 'bg-red-500', 'bg-blue-500',
];

export const CompanyInterviewsPage = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; interview: any }>({ isOpen: false, interview: null });
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [newTime, setNewTime] = useState('');
  const [isHandlingRequest, setIsHandlingRequest] = useState(false);

  // Selected candidate to display in the Right Panel (AI Assist / Call view)
  const [selectedActiveInterview, setSelectedActiveInterview] = useState<any | null>(null);

  const fetchInterviews = async () => {
    try {
      const { data } = await api.get('/interviews');
      const fetchedInts = unwrapArray(data, ['interviews']);
      setInterviews(fetchedInts);
      
      // Select the first scheduled one as active preview by default if none is selected
      if (fetchedInts.length > 0 && !selectedActiveInterview) {
        setSelectedActiveInterview(fetchedInts[0]);
      }
    } catch (err) {
      // Graceful fallback if api is down
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleRescheduleAction = async (requestId: string, action: 'approve' | 'reject', customTime?: string) => {
    try {
      setIsHandlingRequest(true);
      await api.patch(`/interviews/reschedule-requests/${requestId}`, {
        action,
        new_time: customTime ? new Date(customTime).toISOString() : undefined,
      });
      toast.success(`Reschedule request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setSelectedRequest(null);
      setNewTime('');
      fetchInterviews();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setIsHandlingRequest(false);
    }
  };



  // Render dummy calendar days for the right sidebar calendar widget
  const renderCalendarWidget = () => {
    const days = [];
    // Render blocks for May 2026 starting from Friday
    const totalDays = 31;
    const startOffset = 5; // Friday offset
    
    // Add empty spacer blocks
    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} className="h-7 w-7" />);
    }
    
    // Add day numbers
    for (let d = 1; d <= totalDays; d++) {
      const isToday = d === 21;
      const hasInterview = [4, 12, 15, 18, 21, 22, 26, 28].includes(d);
      days.push(
        <div
          key={d}
          className={`h-7 w-7 rounded-md flex flex-col items-center justify-center text-[10px] font-bold relative cursor-pointer hover:bg-slate-50 transition-colors ${
            isToday 
              ? 'bg-violet-600 text-white hover:bg-violet-700' 
              : 'text-slate-700'
          }`}
        >
          <span>{d}</span>
          {hasInterview && !isToday && (
            <span className="absolute bottom-0.5 w-1 h-1 bg-violet-400 rounded-full" />
          )}
          {isToday && (
            <span className="absolute bottom-0.5 w-1 h-1 bg-white rounded-full" />
          )}
        </div>
      );
    }
    return days;
  };

  const now = new Date();
  const todayStr = now.toDateString();
  
  // Start of week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  // End of week (Saturday 11:59:59 PM)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const processedInterviews = interviews.map((item) => {
    const schedTime = new Date(item.scheduled_at).getTime();
    const durationMs = (Number(item.duration) || 60) * 60000;
    const nowMs = Date.now();
    const isLive = item.status === 'scheduled' && nowMs >= schedTime && nowMs <= schedTime + durationMs;
    const isNoShow = item.status === 'scheduled' && nowMs > schedTime + durationMs;
    return { ...item, isLive, isNoShow };
  });

  const todayInterviews = processedInterviews.filter(
    item => new Date(item.scheduled_at).toDateString() === todayStr && item.status !== 'cancelled'
  );

  const weekInterviews = processedInterviews.filter(
    item => {
      const d = new Date(item.scheduled_at);
      return d >= startOfWeek && d < endOfWeek && item.status !== 'cancelled';
    }
  );

  const noShowInterviews = processedInterviews.filter(item => item.isNoShow);

  const totalDuration = processedInterviews.reduce((acc, item) => acc + (Number(item.duration) || 0), 0);
  const avgDuration = processedInterviews.length > 0 ? Math.round(totalDuration / processedInterviews.length) : 0;

  const todayScheduledCount = todayInterviews.filter(item => item.status === 'scheduled').length;
  const todayInProgressCount = todayInterviews.filter(item => item.isLive).length;

  const displayInterviews = processedInterviews;

  const getActiveInterview = () => {
    return selectedActiveInterview || displayInterviews[0];
  };

  const activeInt = getActiveInterview();

  const handleActiveSelect = (item: any) => {
    setSelectedActiveInterview(item);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc]">
      {/* Workspace Header Bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40">
        <div>
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <span>Workspace</span>
            <span>&rsaquo;</span>
            <span className="text-slate-600 font-semibold">Interviews</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              Interviews
            </h1>
            <span className="text-xs text-slate-400 font-medium">{weekInterviews.length} this week · {todayInterviews.length} today</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-[12px] font-bold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-sm shadow-violet-500/10 hover:scale-[1.01]"
          >
            <Plus size={13} />
            Schedule
          </button>
        </div>
      </div>

      <main className="p-5 max-w-[1600px] w-full mx-auto space-y-6 flex-1 flex flex-col">
        
        {/* Top metrics bar matching Image 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Today', value: String(todayInterviews.length), icon: Calendar, color: 'text-violet-600 bg-violet-50' },
            { label: 'This Week', value: String(weekInterviews.length), icon: Clock, color: 'text-sky-600 bg-sky-50' },
            { label: 'Avg Duration', value: `${avgDuration}m`, icon: Brain, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'No-Shows', value: String(noShowInterviews.length), icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
          ].map((metric, i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-0.5">{metric.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {metric.value}
                </p>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${metric.color}`}>
                <metric.icon size={16} />
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          
          {/* Left panel: Daily Timeline */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Today &middot; {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{todayScheduledCount} scheduled &middot; {todayInProgressCount} in progress</p>
              </div>

              {/* Day, Week, Month tabs */}
              <div className="flex bg-slate-50 border border-slate-200/60 rounded-lg p-0.5">
                {['Day', 'Week', 'Month'].map((tab) => (
                  <button
                    key={tab}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                      tab === 'Day'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* List of interviews */}
            <div className="divide-y divide-slate-100">
              {displayInterviews.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-400">
                  No interviews available
                </div>
              )}
              {displayInterviews.map((item, idx) => {
                const isActive = activeInt?.id === item.id;
                const time = new Date(item.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const initials = getInitials(item.candidate_name);
                const avatarBg = avatarColors[idx % avatarColors.length];

                return (
                  <div
                    key={item.id}
                    onClick={() => handleActiveSelect(item)}
                    className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all ${
                      isActive ? 'bg-slate-50/50 -mx-5 px-5 border-l-2 border-violet-600' : 'hover:bg-slate-50/30'
                    }`}
                  >
                    {/* Time & Candidate Info */}
                    <div className="flex items-start gap-4">
                      {/* Time indicators */}
                      <div className="text-left min-w-[56px] leading-tight shrink-0 pt-0.5">
                        <p className="text-xs font-bold text-slate-900">{time}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{item.duration}min</p>
                      </div>

                      {/* Candidate Avatar & Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center text-white font-extrabold text-[11px] shrink-0`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-xs text-slate-900 truncate">
                              {item.candidate_name}
                            </h4>
                            {item.isLive && (
                              <span className="inline-flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 animate-pulse uppercase tracking-wider">
                                <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                                Live now
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            {item.job_title} &middot; <span className="text-violet-500 font-bold uppercase tracking-wider text-[8px]">{item.round_type}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/interview/${item.id}`);
                        }}
                        className={`text-[10.5px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                          item.isLive 
                            ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-500/10'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Video size={12} />
                        {item.isLive ? 'Join' : 'Open'} &rarr;
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Live Video Call & Calendar */}
          <div className="space-y-6">
            
            {/* Live Now Assistant Panel */}
            {activeInt ? (
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    {activeInt.isLive ? 'Live Now' : 'Details View'} &middot; {new Date(activeInt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </h3>
                </div>
                {activeInt.isLive && (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    23:14 elapsed
                  </span>
                )}
              </div>

              {/* Call Mockup Image / Info */}
              <div className="bg-[#111827] rounded-xl overflow-hidden aspect-[4/3] flex flex-col justify-between p-4 relative group">
                {/* Visual Video stream preview */}
                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center select-none pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-violet-600/35 border-2 border-violet-500/50 flex items-center justify-center text-white font-black text-lg backdrop-blur-sm group-hover:scale-105 transition-transform duration-300">
                    {getInitials(activeInt.candidate_name)}
                  </div>
                </div>

                <div className="flex justify-between items-start relative z-10">
                  <span className="bg-slate-950/80 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur">
                    {activeInt.candidate_name}
                  </span>
                  <span className="bg-violet-600 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                    AI score {activeInt.ai_score || 'N/A'}
                  </span>
                </div>

                <div className="flex items-end justify-between relative z-10">
                  <span className="bg-slate-950/80 text-slate-300 text-[9px] font-medium px-2 py-0.5 rounded backdrop-blur">
                    {activeInt.location || 'Remote'}
                  </span>
                </div>
              </div>

              {/* Action triggers */}
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/interview/${activeInt.id}`)}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                >
                  <Video size={13} />
                  Open call
                </button>
                <button
                  onClick={() => setFeedbackModal({ isOpen: true, interview: activeInt })}
                  className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <CheckSquare size={13} className="text-slate-400" />
                  Scorecard
                </button>
              </div>

              {/* Live AI notes panel */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <MessageSquare size={11} />
                  Live AI notes
                </div>
                <p className="text-[11.5px] text-slate-600 leading-relaxed font-semibold">
                  {activeInt.ai_notes || 'No live notes available yet for this interview.'}
                </p>
              </div>
            </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex items-center justify-center text-slate-400 h-64 text-sm font-medium">
                No interviews scheduled
              </div>
            )}

            {/* Calendar widget matching Image 2 */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 text-xs" style={{ fontFamily: 'Sora, sans-serif' }}>
                  May 2026
                </h4>
                <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600"><ChevronLeft size={14} /></button>
                  <button className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600"><ChevronRight size={14} /></button>
                </div>
              </div>

              {/* Weekly headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-slate-400 uppercase">
                <span>S</span>
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {renderCalendarWidget()}
              </div>
            </div>

          </div>

        </div>

      </main>

      <ScheduleInterviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchInterviews} />
      {feedbackModal.interview && (
        <SubmitFeedbackModal
          isOpen={feedbackModal.isOpen}
          onClose={() => setFeedbackModal({ isOpen: false, interview: null })}
          onSuccess={() => {
            fetchInterviews();
            setFeedbackModal({ isOpen: false, interview: null });
          }}
          interview={feedbackModal.interview}
        />
      )}

      {/* Review Reschedule Request Modal */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={(open) => { if (!open) setSelectedRequest(null); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'Sora, sans-serif' }} className="text-lg font-black text-slate-900">
                Review Reschedule Request
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Review the rescheduling request from {selectedRequest.candidate_name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-3">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="text-xs text-slate-500"><strong>Candidate:</strong> {selectedRequest.candidate_name}</p>
                <p className="text-xs text-slate-500"><strong>Job / Round:</strong> {selectedRequest.job_title} ({selectedRequest.round_type})</p>
                <p className="text-xs text-slate-500"><strong>Original Scheduled Date:</strong> {new Date(selectedRequest.original_date).toLocaleString()}</p>
              </div>

              <div className="space-y-1 bg-blue-50 border border-blue-100 p-3 rounded-xl">
                <p className="text-xs font-bold text-blue-800">Candidate's Requested New Time:</p>
                <p className="text-sm font-bold text-slate-900">{new Date(selectedRequest.preferred_date).toLocaleString()}</p>
                {selectedRequest.reason && (
                  <div className="text-xs text-slate-600 bg-white/70 rounded-lg p-2 mt-2 border border-slate-100 italic">
                    "{selectedRequest.reason}"
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Confirm or Adjust New Date & Time</Label>
                <Input
                  type="datetime-local"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isHandlingRequest}
                  onClick={() => handleRescheduleAction(selectedRequest.id, 'reject')}
                  className="px-4 py-2 border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-50 transition-colors"
                >
                  Reject & Keep Original
                </button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedRequest(null)}
                    className="rounded-xl border border-slate-200 text-xs font-bold px-4 py-2 hover:bg-slate-50 text-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={isHandlingRequest}
                    onClick={() => handleRescheduleAction(selectedRequest.id, 'approve', newTime)}
                    className="rounded-xl font-bold text-xs bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-sm transition-all btn-premium px-4 py-2"
                  >
                    {isHandlingRequest ? 'Saving...' : 'Approve & Save'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
