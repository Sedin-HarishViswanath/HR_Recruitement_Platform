import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../../shared/lib/api';
import {
  Video, Mic, ExternalLink, Radio,
  Copy, Check, Loader2, StopCircle, PhoneOff,
  FileText, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface MeetingPanelProps {
  interviewId: string;
  candidateName?: string;
  jobTitle?: string;
  participantRole?: 'candidate' | 'interviewer';
  onMeetingWindowClosed?: () => void;
}

interface TranscriptEntry {
  speaker: 'candidate' | 'interviewer';
  text: string;
  timestamp: string;
}

const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY as string;

// How often to poll the Jitsi window for navigation (ms)
const JITSI_POLL_INTERVAL = 1000;

export const MeetingPanel = ({
  interviewId,
  candidateName = 'Candidate',
  jobTitle = 'Position',
  participantRole = 'candidate',
  onMeetingWindowClosed,
}: MeetingPanelProps) => {
  const canUseTranscription = participantRole === 'interviewer';
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState('');
  const [tab, setTab] = useState<'meeting' | 'transcript' | 'notes'>('meeting');
  const [meetingJoined, setMeetingJoined] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);

  // Deepgram transcription state
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [micError, setMicError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const hasAutoSwitchedRef = useRef(false);
  const meetingWindowRef = useRef<Window | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Fetch the configured meeting room.
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await api.get(`/interviews/${interviewId}/meeting-room`);
        setRoomUrl(res.data.data.roomUrl);
        setToken(res.data.data.token || '');
      } catch (err: any) {
        setMicError(err?.response?.data?.message || 'Meeting room is not available.');
        setRoomUrl(null);
      } finally {
        setLoadingRoom(false);
      }
    };
    fetchRoom();
  }, [interviewId]);

  // ── Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Build provider URL. Daily uses a token, Jitsi does not.
  // We append config parameters to Jitsi's hash:
  // - config.enableClosePage=false: tells Jitsi to close the window when the call is hung up
  // - config.prejoinPageEnabled=false: joins immediately (skips Jitsi's join lobby page)
  // - config.disableDeepLinking=true: prevents mobile app store redirect popups
  const joinUrl = roomUrl
    ? token
      ? `${roomUrl}?t=${token}`
      : `${roomUrl}#config.enableClosePage=false&config.prejoinPageEnabled=false&config.disableDeepLinking=true`
    : null;

  // ── Copy link to clipboard
  const handleCopy = async () => {
    if (!roomUrl) return;
    await navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Poll the Jitsi window. Since Jitsi has been configured with
   * config.enableClosePage=false, it will automatically close the tab/window
   * when hung up. We poll the window's `.closed` status (the only safe cross-origin property)
   * to detect when the tab closes and trigger the feedback modal.
   */
  const startJitsiPolling = useCallback((meetingWindow: Window) => {
    if (!onMeetingWindowClosed) return;
    const timer = window.setInterval(() => {
      try {
        if (meetingWindow.closed) {
          window.clearInterval(timer);
          if (!meetingEnded) {
            onMeetingWindowClosed();
          }
        }
      } catch {
        // Safe check failed — clear and trigger as safe fallback
        window.clearInterval(timer);
        if (!meetingEnded) {
          onMeetingWindowClosed();
        }
      }
    }, JITSI_POLL_INTERVAL);
    return timer;
  }, [onMeetingWindowClosed, meetingEnded]);

  // ── Open video call in new tab
  const handleJoin = () => {
    if (!joinUrl) return;
    // CRITICAL: Do NOT use noopener/noreferrer, otherwise window.open returns null
    // and we cannot poll the window status!
    const meetingWindow = window.open(joinUrl, '_blank');
    if (!meetingWindow) {
      toast.error('Browser blocked the popup. Please allow popups for this site to join the meeting.');
      return;
    }
    meetingWindowRef.current = meetingWindow;
    setMeetingJoined(true);
    setMeetingEnded(false);
    startJitsiPolling(meetingWindow);
  };

  // ── Manual "End Meeting" for interviewers
  const handleEndMeeting = () => {
    if (meetingWindowRef.current && !meetingWindowRef.current.closed) {
      try { meetingWindowRef.current.close(); } catch { /* cross-origin */ }
    }
    stopTranscription();
    setMeetingEnded(true);
    onMeetingWindowClosed?.();
  };

  // ── Build Deepgram WebSocket URL
  const buildDeepgramUrl = () =>
    `wss://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true&interim_results=false&punctuate=true`;

  // ── Start Deepgram live transcription
  const startTranscription = useCallback(async () => {
    if (!DEEPGRAM_API_KEY) {
      setMicError('VITE_DEEPGRAM_API_KEY is not set in your .env');
      return;
    }
    setMicError(null);
    setReconnecting(false);

    try {
      // Re-use existing stream if available
      if (!streamRef.current || streamRef.current.getTracks().every(t => t.readyState === 'ended')) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      }

      const ws = new WebSocket(buildDeepgramUrl(), ['token', DEEPGRAM_API_KEY]);
      socketRef.current = ws;

      ws.onopen = () => {
        setTranscribing(true);
        reconnectAttemptsRef.current = 0;
        const mediaRecorder = new MediaRecorder(streamRef.current!, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (ws.readyState === WebSocket.OPEN && e.data.size > 0) {
            ws.send(e.data);
          }
        };

        mediaRecorder.start(250);
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          const text = data?.channel?.alternatives?.[0]?.transcript;
          const isFinal = data?.is_final;
          if (text && isFinal) {
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setTranscript(prev => [
              ...prev,
              { speaker: participantRole, text, timestamp: now },
            ]);
            if (canUseTranscription && !hasAutoSwitchedRef.current) {
              setTab('transcript');
              hasAutoSwitchedRef.current = true;
            }
          }
        } catch {/* ignore parse errors */}
      };

      ws.onerror = () => {
        // Errors are handled via onclose
      };

      ws.onclose = (event) => {
        mediaRecorderRef.current?.stop();
        setTranscribing(false);

        // ── Code 1000: Normal close (user clicked Stop)
        // ── Code 1005: No Status / idle timeout — silent, not an error
        if (event.code === 1000 || event.code === 1005) {
          // Clean close — no error shown
          return;
        }

        // ── Auth errors — show message, don't reconnect
        if (event.code === 403 || event.code === 401) {
          setMicError('Deepgram API key rejected. Check your VITE_DEEPGRAM_API_KEY.');
          return;
        }

        // ── Unexpected disconnection — auto-reconnect (max 3 attempts)
        if (reconnectAttemptsRef.current < 3) {
          reconnectAttemptsRef.current++;
          const delay = reconnectAttemptsRef.current * 2000;
          setReconnecting(true);
          reconnectTimerRef.current = setTimeout(() => {
            setReconnecting(false);
            startTranscription();
          }, delay);
        } else {
          setMicError(`Transcription stopped (code: ${event.code}). Click Start to resume.`);
          reconnectAttemptsRef.current = 0;
        }
      };

    } catch (err: any) {
      setMicError(err.name === 'NotAllowedError' ? 'Microphone permission denied.' : 'Could not access microphone.');
    }
  }, [canUseTranscription, participantRole]);

  // ── Stop transcription
  const stopTranscription = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptsRef.current = 3; // Prevent auto-reconnect after manual stop
    mediaRecorderRef.current?.stop();
    socketRef.current?.close(1000, 'User stopped');
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setTranscribing(false);
    setReconnecting(false);
  }, []);

  useEffect(() => () => stopTranscription(), [stopTranscription]);

  // ── Save transcript to Notes tab
  const handleSaveTranscriptToNotes = () => {
    if (transcript.length === 0) return;
    const formatted = transcript
      .map(e => `[${e.timestamp}] ${e.speaker === 'interviewer' ? 'Me' : candidateName}: ${e.text}`)
      .join('\n');
    setNotes(prev => prev ? `${prev}\n\n--- Transcript ---\n${formatted}` : `--- Transcript ---\n${formatted}`);
    setTab('notes');
    toast.success('Transcript saved to Notes');
  };

  const tabs = [
    { key: 'meeting' as const, label: 'Meeting' },
    ...(canUseTranscription
      ? [
          { key: 'transcript' as const, label: `Transcript${transcript.length ? ` (${transcript.length})` : ''}` },
          { key: 'notes' as const, label: 'Notes' },
        ]
      : []),
  ] as const;

  return (
    <div className="flex flex-col h-full bg-[#0f111a] text-white border-l border-[#1e2130]">
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-0 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full ${meetingJoined && !meetingEnded ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${meetingJoined && !meetingEnded ? 'text-emerald-400' : 'text-slate-500'}`}>
            {meetingJoined && !meetingEnded ? 'Live Session' : meetingEnded ? 'Session Ended' : 'Ready'}
          </span>
        </div>
        <p className="text-sm font-bold text-white truncate">{candidateName}</p>
        <p className="text-[11px] text-slate-500 truncate">{jobTitle}</p>

        {/* Tab bar */}
        <div className="flex mt-3 border-b border-[#1e2130]">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-2 px-3 text-[11px] font-bold transition-colors relative ${
                tab === t.key
                  ? 'text-amber-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* ── MEETING TAB ── */}
        {tab === 'meeting' && (
          <div className="p-4 space-y-4">
            {/* Video Call Card */}
            <div className="bg-[#1a1d2e] rounded-2xl border border-[#2a2d3e] overflow-hidden">
              {/* Preview area */}
              <div className="aspect-video bg-gradient-to-br from-[#1a1d2e] to-[#0d0f1a] flex flex-col items-center justify-center relative">
                <div className="w-14 h-14 rounded-2xl bg-[#252840] border border-[#3a3d5e] flex items-center justify-center mb-3">
                  <Video size={24} className="text-slate-400" />
                </div>
                {meetingEnded ? (
                  <>
                    <p className="text-xs font-bold text-emerald-400">Session Ended</p>
                    <p className="text-[10px] text-slate-600 mt-1">Feedback form has been triggered</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-slate-400">Video call opens in a separate window</p>
                    <p className="text-[10px] text-slate-600 mt-1">
                      {meetingJoined ? 'Meeting is active — return to this tab anytime' : 'Click Join to open the video room'}
                    </p>
                  </>
                )}

                {loadingRoom && (
                  <div className="absolute inset-0 bg-[#0d0f1a]/80 flex items-center justify-center">
                    <Loader2 size={24} className="text-amber-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Join / End buttons */}
              <div className="p-3 border-t border-[#2a2d3e] space-y-2">
                {!meetingJoined ? (
                  <button
                    onClick={handleJoin}
                    disabled={!joinUrl || loadingRoom}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-blue-900/40 active:scale-[0.98]"
                  >
                    <ExternalLink size={14} />
                    Join Video Call
                  </button>
                ) : (
                  <div className="space-y-2">
                    {!meetingEnded && (
                      <button
                        onClick={handleJoin}
                        disabled={!joinUrl || loadingRoom}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-[#252840] hover:bg-[#2a2d50] text-slate-300 font-bold text-xs rounded-xl transition-all border border-[#3a3d5e]"
                      >
                        <ExternalLink size={12} />
                        Rejoin / Return to Call
                      </button>
                    )}
                    {participantRole === 'interviewer' && !meetingEnded && (
                      <button
                        onClick={handleEndMeeting}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-red-900/40 active:scale-[0.98]"
                      >
                        <PhoneOff size={14} />
                        End Meeting &amp; Give Feedback
                      </button>
                    )}
                    {meetingEnded && participantRole === 'interviewer' && (
                      <div className="text-center py-2 text-[11px] text-emerald-400 font-bold">
                        ✓ Feedback form is open
                      </div>
                    )}
                  </div>
                )}

                {/* Copy link */}
                <div className="flex items-center gap-2 bg-[#0d0f1a] rounded-lg px-3 py-2 border border-[#2a2d3e]">
                  <span className="flex-1 text-[10px] text-slate-500 truncate font-mono">
                    {loadingRoom ? 'Loading room...' : (roomUrl || 'No room')}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 text-slate-400 hover:text-white transition-colors"
                    title="Copy meeting link"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Transcription control — interviewer only */}
            {canUseTranscription && (
              <div className="bg-[#1a1d2e] rounded-2xl border border-[#2a2d3e] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-black text-white">AI Transcription</p>
                    <p className="text-[10px] text-slate-500">Powered by Deepgram Nova-2</p>
                  </div>
                  <button
                    onClick={transcribing ? stopTranscription : startTranscription}
                    disabled={reconnecting}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      transcribing
                        ? 'bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30'
                        : reconnecting
                        ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                        : 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/30'
                    }`}
                  >
                    {transcribing ? (
                      <><StopCircle size={11} /> Stop</>
                    ) : reconnecting ? (
                      <><RefreshCw size={11} className="animate-spin" /> Reconnecting...</>
                    ) : (
                      <><Radio size={11} /> Start</>
                    )}
                  </button>
                </div>

                {micError && (
                  <p className="text-[10px] text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-900/30">
                    {micError}
                  </p>
                )}

                {transcribing && (
                  <div className="flex items-center gap-2 text-[10px] text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Listening... speak clearly near your microphone
                  </div>
                )}

                {!transcribing && !micError && !reconnecting && (
                  <p className="text-[10px] text-slate-600">
                    Click Start to begin capturing speech to text in real-time.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TRANSCRIPT TAB ── */}
        {canUseTranscription && tab === 'transcript' && (
          <div className="flex flex-col h-full">
            {/* Toolbar */}
            {transcript.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e2130] shrink-0">
                <span className="text-[10px] text-slate-500 font-medium">{transcript.length} entries</span>
                <button
                  onClick={handleSaveTranscriptToNotes}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors border border-amber-600/30 bg-amber-600/10 hover:bg-amber-600/20 px-2.5 py-1 rounded-lg"
                >
                  <FileText size={10} />
                  Save to Notes
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {transcript.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Mic size={28} className="text-slate-700 mb-3" />
                  <p className="text-xs font-bold text-slate-500">No transcript yet</p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Start AI Transcription from the Meeting tab
                  </p>
                </div>
              ) : (
                <>
                  {transcript.map((entry, i) => (
                    <div
                      key={i}
                      className={`flex gap-2.5 ${entry.speaker === 'interviewer' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 ${
                        entry.speaker === 'candidate'
                          ? 'bg-blue-900/60 text-blue-300'
                          : 'bg-amber-900/60 text-amber-300'
                      }`}>
                        {entry.speaker === 'candidate' ? 'C' : 'I'}
                      </div>
                      <div className={`flex-1 ${entry.speaker === 'interviewer' ? 'items-end' : ''}`}>
                        <div className={`inline-block px-3 py-2 rounded-xl text-[11px] font-medium leading-relaxed ${
                          entry.speaker === 'candidate'
                            ? 'bg-[#1a2040] text-slate-300 rounded-tl-sm'
                            : 'bg-[#2a1d10] text-amber-100 rounded-tr-sm'
                        }`}>
                          {entry.text}
                        </div>
                        <p className="text-[9px] text-slate-700 mt-0.5 px-1">{entry.timestamp}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </>
              )}
            </div>
          </div>
        )}

        {/* ── NOTES TAB ── */}
        {canUseTranscription && tab === 'notes' && (
          <div className="p-4 h-full">
            <textarea
              className="w-full h-full min-h-[200px] bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-4 text-sm text-slate-300 font-mono placeholder-slate-700 resize-none outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all leading-relaxed"
              placeholder={`Interviewer notes for ${candidateName}...\n\n• Technical skills:\n• Communication:\n• Problem solving:\n• Overall impression:`}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        )}

      </div>

      {/* ── Footer status ── */}
      <div className="px-4 py-2.5 border-t border-[#1e2130] flex items-center gap-2 shrink-0">
        {transcribing ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] text-slate-500 font-medium">Recording transcription</span>
          </>
        ) : reconnecting ? (
          <>
            <RefreshCw size={10} className="text-amber-400 animate-spin" />
            <span className="text-[10px] text-amber-500 font-medium">Reconnecting transcription...</span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <span className="text-[10px] text-slate-600 font-medium">
              {transcript.length > 0 ? `${transcript.length} transcript entries` : 'Transcription off'}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
