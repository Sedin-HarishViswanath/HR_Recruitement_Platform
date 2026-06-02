import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../../shared/hooks/usePageTitle';
import Editor from '@monaco-editor/react';
import { api } from '../../../shared/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, Send, Bot, User, Sparkles, Code2, MessageSquare,
  BrainCircuit, ChevronDown, Loader2, Play, RotateCcw,
  Terminal, Clock, CheckCircle2, AlertCircle, Zap, Trophy
} from 'lucide-react';

type InterviewMode = 'behavioral' | 'technical' | 'system_design';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const LANGUAGES = [
  { label: 'JavaScript', monaco: 'javascript', starter: '// Write your solution here\nfunction solution() {\n  \n}\n' },
  { label: 'Python 3', monaco: 'python', starter: '# Write your solution here\ndef solution():\n    pass\n' },
  { label: 'Java', monaco: 'java', starter: 'public class Solution {\n    public static void main(String[] args) {\n        \n    }\n}' },
  { label: 'C++', monaco: 'cpp', starter: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}' },
  { label: 'TypeScript', monaco: 'typescript', starter: '// Write your solution here\nfunction solution(): void {\n  \n}\n' },
  { label: 'Go', monaco: 'go', starter: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello")\n}' },
  { label: 'Rust', monaco: 'rust', starter: 'fn main() {\n    \n}' },
];

const MODE_CONFIG = {
  behavioral: {
    label: 'Behavioral',
    icon: MessageSquare,
    description: 'STAR method — leadership, conflict, teamwork',
    accent: 'amber',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-600',
    btnBg: 'bg-amber-500 hover:bg-amber-600',
    ring: 'ring-amber-200',
  },
  technical: {
    label: 'Technical',
    icon: Code2,
    description: 'Algorithms & data structures with live code review',
    accent: 'emerald',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-600',
    btnBg: 'bg-emerald-500 hover:bg-emerald-600',
    ring: 'ring-emerald-200',
  },
  system_design: {
    label: 'System Design',
    icon: BrainCircuit,
    description: 'Architect scalable systems end-to-end',
    accent: 'blue',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-600',
    btnBg: 'bg-blue-500 hover:bg-blue-600',
    ring: 'ring-blue-200',
  },
} as const;

// ── Safe markdown renderer (pure React elements, zero dangerouslySetInnerHTML) ──
const renderSafeMarkdown = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  const nextKey = () => `md-${key++}`;

  // Inline: bold + inline code only (safe, no HTML injection)
  const renderInline = (line: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let rest = line;
    let k = 0;

    while (rest.length > 0) {
      // Bold **text**
      const boldMatch = rest.match(/^(.*?)\*\*(.+?)\*\*/);
      if (boldMatch) {
        if (boldMatch[1]) parts.push(<Fragment key={k++}>{boldMatch[1]}</Fragment>);
        parts.push(<strong key={k++} className="font-bold text-slate-900">{boldMatch[2]}</strong>);
        rest = rest.slice(boldMatch[0].length);
        continue;
      }
      // Inline code `code`
      const codeMatch = rest.match(/^(.*?)`([^`]+)`/);
      if (codeMatch) {
        if (codeMatch[1]) parts.push(<Fragment key={k++}>{codeMatch[1]}</Fragment>);
        parts.push(
          <code key={k++} className="bg-slate-100 text-violet-700 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200">
            {codeMatch[2]}
          </code>
        );
        rest = rest.slice(codeMatch[0].length);
        continue;
      }
      parts.push(<Fragment key={k++}>{rest}</Fragment>);
      break;
    }
    return parts;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim() || '';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={nextKey()} className="my-2 rounded-xl overflow-hidden border border-slate-700 text-[11px]">
          {lang && (
            <div className="bg-[#1a1d2e] px-3 py-1.5 text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider border-b border-slate-700">
              {lang}
            </div>
          )}
          <pre className="bg-[#0f111a] text-emerald-300 px-4 py-3 font-mono overflow-x-auto whitespace-pre leading-relaxed">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      i++;
      continue;
    }

    // Heading ## or ###
    if (/^#{1,3}\s/.test(line.trim())) {
      const level = line.match(/^(#{1,3})\s/)?.[1]?.length || 1;
      const content = line.replace(/^#{1,3}\s/, '').trim();
      elements.push(
        <p key={nextKey()} className={`font-bold text-slate-900 mt-3 mb-1 ${level === 1 ? 'text-sm' : level === 2 ? 'text-xs' : 'text-[11px]'}`}>
          {renderInline(content)}
        </p>
      );
      i++;
      continue;
    }

    // Numbered list
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={nextKey()} className="flex gap-2 text-[12px] text-slate-700 font-medium leading-relaxed">
          <span className="text-violet-500 font-bold shrink-0 min-w-[16px]">{numMatch[1]}.</span>
          <span>{renderInline(numMatch[2])}</span>
        </div>
      );
      i++;
      continue;
    }

    // Bullet list
    if (/^[-•*]\s/.test(line.trim())) {
      const content = line.trim().replace(/^[-•*]\s/, '');
      elements.push(
        <div key={nextKey()} className="flex gap-2 text-[12px] text-slate-700 font-medium leading-relaxed">
          <span className="text-violet-400 font-bold shrink-0 mt-0.5">•</span>
          <span>{renderInline(content)}</span>
        </div>
      );
      i++;
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      elements.push(<div key={nextKey()} className="h-1.5" />);
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={nextKey()} className="text-[12px] text-slate-700 font-medium leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <>{elements}</>;
};

// ── Component ─────────────────────────────────────────────────────────────────
export const PracticeRoom = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<InterviewMode>('technical');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(true);
  const [langIndex, setLangIndex] = useState(0);
  const [code, setCode] = useState(LANGUAGES[0].starter);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [executionResult, setExecutionResult] = useState<{ output: string; code: number | null } | null>(null);
  const [running, setRunning] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  usePageTitle('AI Practice Room');
  const currentLang = LANGUAGES[langIndex];
  const cfg = MODE_CONFIG[mode];
  const ModeIcon = cfg.icon;

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);

  const buildHistory = () => messages.map(m => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: msg, timestamp: new Date() }]);
    setInput('');
    setLoading(true);
    setSessionStarted(true);

    try {
      const { data } = await api.post('/practice/chat', {
        message: msg,
        history: buildHistory(),
        mode,
        language: currentLang.label,
        code: showEditor && mode === 'technical' ? code : undefined,
      });

      const reply = data.data?.reply || data.data?.text || 'No response received.';
      setMessages(prev => [...prev, { role: 'model', text: reply, timestamp: new Date() }]);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to get AI response. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const startSession = () => {
    setMessages([]);
    setSessionStarted(false);
    const greeting =
      mode === 'behavioral' ? "Hi! I'd like to practice behavioral interview questions using the STAR method." :
      mode === 'system_design' ? "Hi! I'd like to practice system design interviews." :
      "Hi! I'd like to practice technical coding interview questions.";
    sendMessage(greeting);
  };

  const resetSession = () => {
    setMessages([]);
    setSessionStarted(false);
    setInput('');
    setCode(LANGUAGES[langIndex].starter);
    setExecutionResult(null);
  };

  const handleRunCode = async () => {
    setRunning(true);
    setExecutionResult(null);
    try {
      const res = await api.post('/interviews/practice-exec/execute', {
        script: code,
        language: currentLang.monaco,
        stdin: '',
      });
      setExecutionResult(res.data.data);
    } catch {
      setExecutionResult({
        output: '// Code execution unavailable in practice mode.\n// Share your code with the AI for review instead.',
        code: 1,
      });
    } finally {
      setRunning(false);
    }
  };

  const shareCodeWithAI = () => {
    if (!code.trim()) { toast.error('Write some code first!'); return; }
    const msg = `Please review my ${currentLang.label} solution:\n\n\`\`\`${currentLang.monaco}\n${code}\n\`\`\``;
    sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isTechnical = mode === 'technical';
  const showCodePanel = isTechnical && showEditor;

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fb]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between shrink-0 z-20 shadow-sm/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/candidate/interviews')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg ${cfg.bg} ${cfg.border} border flex items-center justify-center`}>
              <ModeIcon size={13} className={cfg.text} />
            </div>
            <div>
              <h1 className="text-[13px] font-bold text-slate-900 leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
                AI Practice Room
              </h1>
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{cfg.label} Mode</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode selector — only when session not started */}
          {!sessionStarted && (
            <div className="flex bg-slate-100 border border-slate-200/60 p-0.5 rounded-lg gap-0.5">
              {(Object.entries(MODE_CONFIG) as [InterviewMode, typeof cfg][]).map(([key, c]) => {
                const Icon = c.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      mode === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Icon size={11} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          )}

          {isTechnical && (
            <button
              onClick={() => setShowEditor(e => !e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                showEditor
                  ? 'bg-slate-800 text-white border-slate-700'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Code2 size={11} />
              {showEditor ? 'Hide Editor' : 'Show Editor'}
            </button>
          )}

          {sessionStarted && (
            <button
              onClick={resetSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <RotateCcw size={11} />
              New Session
            </button>
          )}
        </div>
      </div>

      {/* ── Main ── */}
      <div className="flex-1 flex min-h-0">

        {/* ── Chat panel ── */}
        <div className={`flex flex-col ${showCodePanel ? 'w-[45%]' : 'w-full max-w-3xl mx-auto'} bg-white border-r border-slate-200/60`}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scroll-smooth">

            {/* Welcome screen */}
            {!sessionStarted && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className={`w-16 h-16 rounded-2xl ${cfg.bg} ${cfg.border} border-2 flex items-center justify-center mb-5 shadow-sm`}>
                  <Sparkles size={28} className={cfg.text} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-1.5" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {cfg.label} Practice
                </h2>
                <p className="text-[12px] text-slate-500 font-medium mb-1 max-w-sm leading-relaxed">
                  {cfg.description}
                </p>

                <button
                  onClick={startSession}
                  className={`mt-6 flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg hover:shadow-xl active:scale-[0.97] cursor-pointer ${cfg.btnBg}`}
                >
                  <Trophy size={14} />
                  Start Practice Session
                </button>

                {/* Mode cards */}
                {!sessionStarted && (
                  <div className="mt-8 grid grid-cols-3 gap-3 w-full max-w-sm">
                    {(Object.entries(MODE_CONFIG) as [InterviewMode, typeof cfg][]).map(([key, c]) => {
                      const Icon = c.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => { setMode(key); }}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer text-center ${
                            mode === key
                              ? `${c.bg} ${c.border} ${c.text}`
                              : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                          }`}
                        >
                          <Icon size={16} />
                          <span className="text-[9.5px] font-bold">{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 flex gap-4 text-[10px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1"><Zap size={10} className="text-violet-400" /> Powered by Gemini</span>
                  <span className="flex items-center gap-1"><Code2 size={10} className="text-emerald-400" /> Live code review</span>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className={`w-7 h-7 rounded-lg ${cfg.bg} ${cfg.border} border flex items-center justify-center shrink-0 mt-0.5`}>
                    <Bot size={13} className={cfg.text} />
                  </div>
                )}
                <div className={`max-w-[86%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-slate-800 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200/80 text-slate-700 rounded-bl-sm shadow-sm'
                }`}>
                  {msg.role === 'model'
                    ? renderSafeMarkdown(msg.text)
                    : <p className="text-[12px] font-medium leading-relaxed">{msg.text}</p>
                  }
                  <p className={`text-[9px] mt-2 ${msg.role === 'user' ? 'text-slate-500' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={13} className="text-slate-500" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2.5 items-start">
                <div className={`w-7 h-7 rounded-lg ${cfg.bg} ${cfg.border} border flex items-center justify-center shrink-0`}>
                  <Bot size={13} className={cfg.text} />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* ── Input bar ── */}
          {sessionStarted && (
            <div className="border-t border-slate-200/80 bg-white p-3 shrink-0">
              <div className="flex items-end gap-2">
                {showCodePanel && (
                  <button
                    onClick={shareCodeWithAI}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-all shrink-0 cursor-pointer"
                  >
                    <Sparkles size={11} />
                    Share Code
                  </button>
                )}
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      mode === 'behavioral' ? 'Share your answer...' :
                      mode === 'system_design' ? 'Describe your approach...' :
                      'Ask a question or describe your logic...'
                    }
                    className="w-full resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                    onInput={e => {
                      const t = e.currentTarget;
                      t.style.height = 'auto';
                      t.style.height = Math.min(t.scrollHeight, 120) + 'px';
                    }}
                  />
                </div>
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className={`p-2.5 rounded-xl text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0 active:scale-95 ${
                    mode === 'behavioral' ? 'bg-amber-500 hover:bg-amber-600' :
                    mode === 'system_design' ? 'bg-blue-500 hover:bg-blue-600' :
                    'bg-violet-600 hover:bg-violet-700'
                  }`}
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5 px-1">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          )}
        </div>

        {/* ── Code editor panel ── */}
        {showCodePanel && (
          <div className="flex-1 flex flex-col bg-[#0f111a] text-white min-w-0">

            {/* Editor toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#252840] bg-[#1a1d2e] shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    className="bg-[#252840] border border-[#3a3d5c] rounded-lg text-[11px] px-3 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-violet-500 appearance-none font-bold text-slate-300 cursor-pointer"
                    value={langIndex}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setLangIndex(idx);
                      setCode(LANGUAGES[idx].starter);
                      setExecutionResult(null);
                    }}
                  >
                    {LANGUAGES.map((l, i) => (
                      <option key={l.monaco} value={i}>{l.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Practice Sandbox</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={shareCodeWithAI}
                  className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-bold transition-colors bg-violet-600/15 text-violet-400 border border-violet-500/20 hover:bg-violet-600/25 cursor-pointer"
                >
                  <Sparkles size={11} />
                  AI Review
                </button>
                <button
                  onClick={handleRunCode}
                  disabled={running}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm shadow-emerald-900/40 cursor-pointer"
                >
                  {running ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} fill="white" />}
                  {running ? 'Running...' : 'Run'}
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={currentLang.monaco}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  renderLineHighlight: 'gutter',
                  fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
                  fontLigatures: true,
                  padding: { top: 16, bottom: 8 },
                  smoothScrolling: true,
                  cursorBlinking: 'phase',
                  cursorSmoothCaretAnimation: 'on',
                  lineDecorationsWidth: 8,
                  bracketPairColorization: { enabled: true },
                }}
              />
            </div>

            {/* Output panel */}
            <div className="h-[140px] border-t border-[#252840] bg-[#0d0f1a] shrink-0 flex flex-col">
              <div className="flex items-center justify-between px-4 py-1.5 border-b border-[#1e2035] shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal size={11} className="text-slate-600" />
                  <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Output</span>
                  {executionResult && (
                    executionResult.code === 0
                      ? <CheckCircle2 size={11} className="text-emerald-500" />
                      : <AlertCircle size={11} className="text-red-400" />
                  )}
                </div>
                {running && (
                  <div className="flex items-center gap-1 text-[9px] text-slate-600">
                    <Clock size={10} className="animate-spin" />
                    Executing...
                  </div>
                )}
              </div>
              <pre className={`flex-1 overflow-auto px-4 py-3 text-[11px] font-mono whitespace-pre-wrap leading-relaxed ${
                running ? 'text-slate-600 animate-pulse' :
                executionResult?.code === 0 ? 'text-emerald-300' :
                executionResult ? 'text-red-400' :
                'text-slate-600'
              }`}>
                {running
                  ? '⟳  Executing...'
                  : executionResult?.output || '// Press Run ▶  to execute, or use AI Review for code feedback'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeRoom;
