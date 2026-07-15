import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../../shared/lib/api';
import {
  Video, Mic, ExternalLink, Radio,
  Copy, Check, Loader2, PhoneOff,
  FileText, MicOff
} from 'lucide-react';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';

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

const BACKEND_URL = import.meta.env.VITE_API_URL || window.location.origin;

const JITSI_POLL_INTERVAL = 1000;

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const MeetingPanel = ({
  interviewId,
  candidateName = 'Candidate',
  jobTitle = 'Position',
  participantRole = 'candidate',
  onMeetingWindowClosed,
}: MeetingPanelProps) => {
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState('');
  const [tab, setTab] = useState<'meeting' | 'transcript' | 'notes'>('meeting');
  const [meetingJoined, setMeetingJoined] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);

  // Transcription state (Web Speech API — free, no key required)
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [micError, setMicError] = useState<string | null>(null);
  const [speechSupported] = useState(!!SpeechRecognition);
  const recognitionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const hasAutoSwitchedRef = useRef(false);
  const meetingWindowRef = useRef<Window | null>(null);
  const socketRef = useRef<Socket | null>(null);

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

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/interviews/${interviewId}/transcript`);
        const data = res.data?.data || [];
        if (Array.isArray(data) && data.length > 0) {
          setTranscript(data);
        }
      } catch (err) {
        // Ignore error
      }
    };
    fetchHistory();
  }, [interviewId]);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-interview', interviewId);
    });

    socket.on('transcript-entry', (data: { speaker: string; text: string; timestamp: string }) => {
      setTranscript(prev => [
        ...prev,
        { speaker: data.speaker as 'candidate' | 'interviewer', text: data.text, timestamp: data.timestamp },
      ]);
    });

    return () => { socket.disconnect(); };
  }, [interviewId]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const user = useSelector((state: RootState) => state.auth.user);
  const displayName = user?.name || (participantRole === 'candidate' ? candidateName : 'Interviewer');

  const joinUrl = roomUrl
    ? token
      ? `${roomUrl}?t=${token}`
      : `${roomUrl}#config.enableClosePage=false&config.prejoinPageEnabled=false&config.disableDeepLinking=true&userInfo.displayName="${encodeURIComponent(displayName)}"`
    : null;

  const handleCopy = async () => {
    if (!roomUrl) return;
    await navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startTranscription = useCallback(() => {
    if (!SpeechRecognition) {
      setMicError('Your browser does not support speech recognition. Please use Chrome or Edge.');
      return;
    }
    setMicError(null);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setTranscribing(true);
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          if (!text) continue;

          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const entry: TranscriptEntry = { speaker: participantRole, text, timestamp: now };

          setTranscript(prev => [...prev, entry]);

          if (socketRef.current?.connected) {
            socketRef.current.emit('transcript-entry', {
              interviewId,
              speaker: participantRole,
              text,
              timestamp: now,
            });
          }

          api.post(`/interviews/${interviewId}/transcript`, {
            entries: [{ speaker: participantRole, text, timestamp: now }],
          }).catch(() => {});

          if (!hasAutoSwitchedRef.current) {
            setTab('transcript');
            hasAutoSwitchedRef.current = true;
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setMicError('Microphone permission denied. Please allow microphone access.');
        setTranscribing(false);
        recognitionRef.current = null;
      } else if (event.error === 'no-speech') {
        // silence — recognition continues
      } else if (event.error === 'network') {
        setMicError('Network error — speech recognition requires an internet connection.');
        setTranscribing(false);
        recognitionRef.current = null;
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current && !meetingEnded) {
        try {
          recognition.start();
        } catch {
          // Already started or stopped
        }
      } else {
        setTranscribing(false);
      }
    };

    try {
      recognition.start();
    } catch (err) {
      setMicError('Failed to start speech recognition.');
    }
  }, [participantRole, interviewId, meetingEnded]);

  const stopTranscription = useCallback(() => {
    if (recognitionRef.current) {
      const ref = recognitionRef.current;
      recognitionRef.current = null;
      try { ref.stop(); } catch { /* already stopped */ }
    }
    setTranscribing(false);
  }, []);

  useEffect(() => () => stopTranscription(), [stopTranscription]);

  useEffect(() => {
    if (meetingJoined && !meetingEnded && speechSupported && !transcribing) {
      startTranscription();
    }
  }, [meetingJoined, meetingEnded, speechSupported]);

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
        window.clearInterval(timer);
        if (!meetingEnded) {
          onMeetingWindowClosed();
        }
      }
    }, JITSI_POLL_INTERVAL);
    return timer;
  }, [onMeetingWindowClosed, meetingEnded]);

  // Open video call in new tab
  const handleJoin = async () => {
    if (!joinUrl) return;

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

  const handleEndMeeting = () => {
    if (meetingWindowRef.current && !meetingWindowRef.current.closed) {
      try { meetingWindowRef.current.close(); } catch { /* cross-origin */ }
    }
    stopTranscription();
    setMeetingEnded(true);
    onMeetingWindowClosed?.();
  };

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
    ...(participantRole === 'candidate' ? [] : [{ key: 'transcript' as const, label: `Transcript${transcript.length ? ` (${transcript.length})` : ''}` }]),
    { key: 'notes' as const, label: 'Notes' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0f111a] text-white border-l border-[#1e2130]">
      {/* Header */}
      <div className="px-4 pt-4 pb-0 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full ${meetingJoined && !meetingEnded ? 'bg-emerald-400 animate-pulse' : 'bg-stone-600'}`} />
          <span className={`text-[10px] font-semibold uppercase tracking-widest ${meetingJoined && !meetingEnded ? 'text-emerald-400' : 'text-stone-500'}`}>
            {meetingJoined && !meetingEnded ? 'Live Session' : meetingEnded ? 'Session Ended' : 'Ready'}
          </span>
        </div>
        <p className="text-sm font-bold text-white truncate">{candidateName}</p>
        <p className="text-[11px] text-stone-500 truncate">{jobTitle}</p>

        {/* Tab bar */}
        <div className="flex mt-3 border-b border-[#1e2130]">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-2 px-3 text-[11px] font-bold transition-colors relative ${
                tab === t.key
                  ? 'text-emerald-400'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* MEETING TAB */}
        {tab === 'meeting' && (
          <div className="p-4 space-y-4">
            {/* Video Call Card */}
            <div className="bg-[#1a1d2e] rounded-2xl border border-[#2a2d3e] overflow-hidden">
              {/* Preview area */}
              <div className="aspect-video bg-gradient-to-br from-[#1a1d2e] to-[#0d0f1a] flex flex-col items-center justify-center relative">
                <div className="w-14 h-14 rounded-2xl bg-[#252840] border border-[#3a3d5e] flex items-center justify-center mb-3">
                  <Video size={24} className="text-stone-400" />
                </div>
                {meetingEnded ? (
                  <>
                    <p className="text-xs font-bold text-emerald-400">Session Ended</p>
                    <p className="text-[10px] text-stone-600 mt-1">Feedback form has been triggered</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold text-stone-400">Video call opens in a separate window</p>
                    <p className="text-[10px] text-stone-600 mt-1">
                      {meetingJoined ? 'Meeting is active — return to this tab anytime' : 'Click Join to open the video room'}
                    </p>
                  </>
                )}

                {loadingRoom && (
                  <div className="absolute inset-0 bg-[#0d0f1a]/80 flex items-center justify-center">
                    <Loader2 size={24} className="text-emerald-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Join / End buttons */}
              <div className="p-3 border-t border-[#2a2d3e] space-y-2">
                {!meetingJoined ? (
                  <button
                    onClick={handleJoin}
                    disabled={!joinUrl || loadingRoom}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 disabled:opacity-40 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-blue-900/40 active:scale-[0.98]"
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
                        className="w-full flex items-center justify-center gap-2 py-2 bg-[#252840] hover:bg-[#2a2d50] text-stone-300 font-bold text-xs rounded-xl transition-all border border-[#3a3d5e]"
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
                  <span className="flex-1 text-[10px] text-stone-500 truncate font-mono">
                    {loadingRoom ? 'Loading room...' : (roomUrl || 'No room')}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 text-stone-400 hover:text-white transition-colors"
                    title="Copy meeting link"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Transcription status card */}
            {participantRole !== 'candidate' && (
              <div className="bg-[#1a1d2e] rounded-2xl border border-[#2a2d3e] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-black text-white">Live Transcription</p>
                    <p className="text-[10px] text-stone-500">
                      {speechSupported ? 'Auto-recording · Browser Speech API (Free)' : 'Not supported in this browser'}
                    </p>
                  </div>
                  {transcribing && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-600/30">
                      <Radio size={11} className="animate-pulse" /> Recording
                    </div>
                  )}
                </div>

                {micError && (
                  <p className="text-[10px] text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-900/30">
                    {micError}
                  </p>
                )}

                {!speechSupported && (
                  <div className="flex items-center gap-2 text-[10px] text-emerald-400 bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-900/30">
                    <MicOff size={12} />
                    <span>Speech recognition is not supported. Use Chrome or Edge for transcription.</span>
                  </div>
                )}

                {transcribing && (
                  <div className="flex items-center gap-2 text-[10px] text-emerald-400 mt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Listening... speak clearly near your microphone
                  </div>
                )}

                {!transcribing && !micError && speechSupported && (
                  <p className="text-[10px] text-stone-600">
                    {meetingJoined ? 'Transcription will auto-start momentarily...' : 'Transcription auto-starts when you join the call.'}
                  </p>
                )}
              </div>
            )}

          </div>
        )}

        {/* TRANSCRIPT TAB */}
        {tab === 'transcript' && (
          <div className="flex flex-col h-full">
            {transcript.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e2130] shrink-0">
                <span className="text-[10px] text-stone-500 font-medium">{transcript.length} entries</span>
                <button
                  onClick={handleSaveTranscriptToNotes}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors border border-amber-600/30 bg-amber-600/10 hover:bg-emerald-700/20 px-2.5 py-1 rounded-lg"
                >
                  <FileText size={10} />
                  Save to Notes
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {transcript.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Mic size={28} className="text-stone-700 mb-3" />
                  <p className="text-xs font-bold text-stone-500">No transcript yet</p>
                  <p className="text-[10px] text-stone-600 mt-1">
                    {meetingJoined ? 'Transcription is active — speak into your microphone' : 'Join the meeting to begin transcription'}
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
                            ? 'bg-[#1a2040] text-stone-300 rounded-tl-sm'
                            : 'bg-[#2a1d10] text-amber-100 rounded-tr-sm'
                        }`}>
                          {entry.text}
                        </div>
                        <p className="text-[9px] text-stone-700 mt-0.5 px-1">{entry.timestamp}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </>
              )}
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {tab === 'notes' && (
          <div className="p-4 h-full">
            <textarea
              className="w-full h-full min-h-[200px] bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-4 text-sm text-stone-300 font-mono placeholder-stone-700 resize-none outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all leading-relaxed"
              placeholder={`Interviewer notes for ${candidateName}...\n\n• Technical skills:\n• Communication:\n• Problem solving:\n• Overall impression:`}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        )}

      </div>

      {/* Footer status */}
      {participantRole !== 'candidate' && (
        <div className="px-4 py-2.5 border-t border-[#1e2130] flex items-center gap-2 shrink-0">
          {transcribing ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] text-stone-500 font-medium">Recording transcription</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-stone-700" />
              <span className="text-[10px] text-stone-600 font-medium">
                {transcript.length > 0 ? `${transcript.length} transcript entries` : 'Transcription off'}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
