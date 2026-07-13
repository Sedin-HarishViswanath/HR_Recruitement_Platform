import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSocket } from '../../../shared/hooks/useSocket';
import { api } from '../../../shared/lib/api';
import { Sparkles, X, Cpu, AlertTriangle } from 'lucide-react';

interface Card {
  application_id: string; candidate_id: string; name: string;
  score: number; rank?: number; method?: string; reason?: string;
  matched_skills?: string[]; gaps?: string[]; low_confidence?: boolean;
}
interface Kit { focus_areas: string[]; questions: { q: string; targets: string }[]; error?: boolean; }
interface Props { jobId: string; open: boolean; onClose: () => void; }

const scoreColor = (s: number) =>
  s >= 85 ? 'text-emerald-600' : s >= 65 ? 'text-primary' : s >= 45 ? 'text-amber-600' : 'text-stone-500';

export const ScreeningAgentConsole = ({ jobId, open, onClose }: Props) => {
  const socket = useSocket();
  const [log, setLog] = useState<string[]>([]);
  const [cards, setCards] = useState<Record<string, Card>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [kits, setKits] = useState<Record<string, Kit>>({});
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'failed'>('idle');
  const [heuristic, setHeuristic] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Rehydrate from persisted state on open / reconnect
  const { data: state } = useQuery({
    queryKey: ['screen-state', jobId],
    queryFn: async () => (await api.get(`/applications/job/${jobId}/screen/state`)).data.data,
    enabled: open,
  });

  useEffect(() => {
    if (!state) return;
    setStatus(state.status);
    const next: Record<string, Card> = {};
    (state.candidates || []).forEach((c: Card) => { next[c.application_id] = c; });
    setCards(next);
    setOrder((state.candidates || []).map((c: Card) => c.application_id));
    setKits(state.kits || {});
  }, [state]);

  useEffect(() => {
    if (!socket || !open) return;
    const forThis = (d: any) => d?.jobId === jobId;
    const onStart = (d: any) => { if (!forThis(d)) return; setStatus('running'); setHeuristic(d.method_hint === 'heuristic'); setLog((l) => [...l, `Starting screen of ${d.total} applicants…`]); };
    const onProgress = (d: any) => {
      if (!forThis(d)) return;
      setCards((c) => ({ ...c, [d.application_id]: d }));
      setLog((l) => [...l, `${d.name}: ${d.score} — ${d.reason || d.method}${d.gaps?.length ? ` · gaps: ${d.gaps.join(', ')}` : ''}`]);
    };
    const onCandErr = (d: any) => { if (!forThis(d)) return; setLog((l) => [...l, `⚠ ${d.name}: ${d.message}`]); };
    const onRanked = (d: any) => { if (!forThis(d)) return; setOrder(d.order); };
    const onKit = (d: any) => { if (!forThis(d)) return; setKits((k) => ({ ...k, [d.application_id]: d.kit })); };
    const onComplete = (d: any) => { if (!forThis(d)) return; setStatus('done'); setLog((l) => [...l, `Done — ${d.meta.scored} scored, ${d.meta.failed} failed.`]); };
    const onFailed = (d: any) => { if (!forThis(d)) return; setStatus('failed'); setLog((l) => [...l, `Run failed: ${d.message}`]); };

    socket.on('screen:started', onStart);
    socket.on('screen:progress', onProgress);
    socket.on('screen:candidate-error', onCandErr);
    socket.on('screen:ranked', onRanked);
    socket.on('screen:kit', onKit);
    socket.on('screen:complete', onComplete);
    socket.on('screen:failed', onFailed);
    return () => {
      socket.off('screen:started', onStart);
      socket.off('screen:progress', onProgress);
      socket.off('screen:candidate-error', onCandErr);
      socket.off('screen:ranked', onRanked);
      socket.off('screen:kit', onKit);
      socket.off('screen:complete', onComplete);
      socket.off('screen:failed', onFailed);
    };
  }, [socket, open, jobId]);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [log]);

  const ranked = useMemo(() => order.map((id) => cards[id]).filter(Boolean), [order, cards]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="AI Screening Agent">
      <div className="panel w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[hsl(150_24%_92%)] text-primary flex items-center justify-center"><Sparkles size={16} /></div>
            <div>
              <h2 className="text-[15px] font-bold text-foreground">AI Screening Agent</h2>
              <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">{status}</p>
            </div>
            {heuristic && <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5"><Cpu size={11} /> Heuristic mode</span>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          {/* Reasoning log */}
          <div className="border-r border-border overflow-y-auto p-4 bg-secondary/30" aria-live="polite">
            <p className="section-eyebrow mb-3">Agent reasoning</p>
            <div className="space-y-1.5">
              {log.map((line, i) => (
                <p key={i} className="text-[12px] text-foreground font-mono leading-relaxed">{line}</p>
              ))}
              {log.length === 0 && <p className="text-[12px] text-muted-foreground">Waiting to start…</p>}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* Ranked board */}
          <div className="overflow-y-auto p-4">
            <p className="section-eyebrow mb-3">Ranked shortlist</p>
            <div className="space-y-2">
              {ranked.map((c) => (
                <div key={c.application_id} className="panel p-3">
                  <div className="flex items-center gap-3">
                    <span className="font-data text-[13px] text-muted-foreground w-6">{c.rank ? `#${c.rank}` : '—'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-bold text-foreground truncate">{c.name}</p>
                        {c.low_confidence && <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1">low conf.</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{c.reason}</p>
                    </div>
                    <span className={`font-data text-[18px] font-semibold ${scoreColor(c.score)}`}>{c.score}</span>
                  </div>
                  {kits[c.application_id] && (
                    <button onClick={() => setExpanded(expanded === c.application_id ? null : c.application_id)} className="mt-2 text-[11px] font-semibold text-primary">
                      {expanded === c.application_id ? 'Hide' : 'View'} interview kit
                    </button>
                  )}
                  {expanded === c.application_id && kits[c.application_id] && (
                    <div className="mt-2 pt-2 border-t border-border space-y-1.5">
                      {kits[c.application_id].error && (
                        <p className="text-[10px] text-amber-700 flex items-center gap-1"><AlertTriangle size={11} /> Generated from gaps (AI kit unavailable)</p>
                      )}
                      {kits[c.application_id].questions.map((q, i) => (
                        <div key={i} className="text-[11px]">
                          <p className="text-foreground">{i + 1}. {q.q}</p>
                          {q.targets && <p className="text-muted-foreground">↳ {q.targets}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {ranked.length === 0 && <p className="text-[12px] text-muted-foreground">No results yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
