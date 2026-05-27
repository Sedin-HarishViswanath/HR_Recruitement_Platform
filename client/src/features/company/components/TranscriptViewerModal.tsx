import { useState, useEffect } from 'react';
import { api } from '../../../shared/lib/api';
import { X, Copy, Check, FileText, Mic, Loader2 } from 'lucide-react';

interface TranscriptEntry {
  id: string;
  speaker: 'candidate' | 'interviewer';
  text: string;
  timestamp: string;
  created_at: string;
}

interface TranscriptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  interviewId: string;
  roundType: string;
  roundNumber?: number;
  candidateName: string;
  interviewerName?: string;
  scheduledAt?: string;
  recordingUrl?: string;
}

export const TranscriptViewerModal = ({
  isOpen,
  onClose,
  interviewId,
  roundType,
  roundNumber,
  candidateName,
  interviewerName,
  scheduledAt,
  recordingUrl,
}: TranscriptViewerModalProps) => {
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !interviewId) return;
    const fetchTranscript = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/interviews/${interviewId}/transcript`);
        const data = res.data?.data || [];
        setEntries(Array.isArray(data) ? data : []);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTranscript();
  }, [isOpen, interviewId]);

  const handleCopyAll = () => {
    const text = entries
      .map(e => `[${e.timestamp}] ${e.speaker === 'interviewer' ? (interviewerName || 'Interviewer') : candidateName}: ${e.text}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const dateStr = scheduledAt ? new Date(scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-700 bg-[#0f111a] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-white truncate">
                Interview Transcript
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {(roundType || 'Interview').charAt(0).toUpperCase() + (roundType || '').slice(1)} Round
                {roundNumber ? ` (Round ${roundNumber})` : ''}
                {dateStr ? ` Â· ${dateStr}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy All'}
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Participants info */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-800/60 text-[11px] font-medium text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-blue-900/60 text-blue-300 flex items-center justify-center text-[8px] font-black">C</span>
            {candidateName}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-amber-900/60 text-amber-300 flex items-center justify-center text-[8px] font-black">I</span>
            {interviewerName || 'Interviewer'}
          </span>
          <span className="ml-auto text-slate-600">{entries.length} entries</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
          
          {/* Video Player */}
          {recordingUrl && (
            <div className="mb-6 rounded-xl border border-slate-800 bg-[#151822] overflow-hidden">
              <video 
                src={recordingUrl} 
                controls 
                className="w-full aspect-video"
                controlsList="nodownload"
              />
              <div className="p-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Meeting Video Recording</span>
                <span>Both Audio Streams Mixed</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={24} className="text-violet-400 animate-spin mb-3" />
              <p className="text-sm text-slate-500 font-medium">Loading transcript...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                <Mic size={28} className="text-slate-600" />
              </div>
              <p className="text-sm font-bold text-slate-400">No transcript available</p>
              <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
                Transcription was not recorded for this interview round.
              </p>
            </div>
          ) : (
            entries.map((entry, i) => (
              <div
                key={entry.id || i}
                className={`flex gap-3 ${entry.speaker === 'interviewer' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                  entry.speaker === 'candidate'
                    ? 'bg-blue-900/60 text-blue-300'
                    : 'bg-amber-900/60 text-amber-300'
                }`}>
                  {entry.speaker === 'candidate' ? 'C' : 'I'}
                </div>
                <div className={`flex-1 max-w-[80%] ${entry.speaker === 'interviewer' ? 'flex flex-col items-end' : ''}`}>
                  <div className={`inline-block px-4 py-2.5 rounded-2xl text-[12px] font-medium leading-relaxed ${
                    entry.speaker === 'candidate'
                      ? 'bg-[#1a2040] text-slate-300 rounded-tl-sm'
                      : 'bg-[#2a1d10] text-amber-100 rounded-tr-sm'
                  }`}>
                    {entry.text}
                  </div>
                  <p className="text-[9px] text-slate-700 mt-1 px-1">{entry.timestamp}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
