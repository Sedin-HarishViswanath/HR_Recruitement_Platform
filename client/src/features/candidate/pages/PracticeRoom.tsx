import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { api } from '../../../shared/lib/api';
import { toast } from 'sonner';
import {
  ArrowLeft, Send, Bot, User, Sparkles, Code2, MessageSquare,
  Cpu, BrainCircuit, ChevronDown, Loader2, Play, RotateCcw,
  Lightbulb, Terminal, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';

type InterviewMode = 'behavioral' | 'technical' | 'system_design';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const LANGUAGES = [
  { label: 'JavaScript', monaco: 'javascript', starter: '// Write your solution here\nconsole.log("Hello, World!");' },
  { label: 'Python 3', monaco: 'python', starter: '# Write your solution here\nprint("Hello, World!")' },
  { label: 'Java', monaco: 'java', starter: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}' },
  { label: 'C++', monaco: 'cpp', starter: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}' },
  { label: 'TypeScript', monaco: 'typescript', starter: '// Write your solution here\nconst greet = (name: string): string => `Hello, ${name}!`;\nconsole.log(greet("World"));' },
  { label: 'Go', monaco: 'go', starter: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, World!")\n}' },
  { label: 'Rust', monaco: 'rust', starter: 'fn main() {\n    println!("Hello, World!");\n}' },
];

const MODE_CONFIG: Record<InterviewMode, { label: string; icon: typeof MessageSquare; description: string; color: string; bg: string; border: string }> = {
  behavioral: {
    label: 'Behavioral',
    icon: MessageSquare,
    description: 'STAR method practice — leadership, conflict, teamwork',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  technical: {
    label: 'Technical',
    icon: Code2,
    description: 'Algorithm & data structure problems with code review',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  system_design: {
    label: 'System Design',
    icon: BrainCircuit,
    description: 'Architect scalable systems — databases, APIs, caching',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
};

// Simple markdown renderer for chat messages
const renderMarkdown = (text: string) => {
  // Process code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
      if (match) {
        return (
          <pre key={i} className="bg-slate-900 text-emerald-300 rounded-lg p-3 my-2 text-[11px] font-mono overflow-x-auto border border-slate-700">
            <code>{match[2].trim()}</code>
          </pre>
        );
      }
    }
    
    // Process inline formatting
    const lines = part.split('\n');
    return (
      <span key={i}>
        {lines.map((line, j) => {
          // Bold
          let processed: React.ReactNode = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
          // Inline code
          processed = (processed as string).replace(/`(.*?)`/g, '<code class="bg-slate-100 text-violet-700 px-1 py-0.5 rounded text-[10px] font-mono">$1</code>');
          // Bullet points
          if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
            const content = line.trim().replace(/^[-•]\s/, '');
            return (
              <span key={j} className="block pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-violet-400 before:font-bold">
                <span dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/`(.*?)`/g, '<code class="bg-slate-100 text-violet-700 px-1 py-0.5 rounded text-[10px] font-mono">$1</code>') }} />
              </span>
            );
          }
          // Numbered lists
          const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            return (
              <span key={j} className="block pl-5 relative">
                <span className="absolute left-0 text-violet-500 font-bold text-[10px]">{numMatch[1]}.</span>
                <span dangerouslySetInnerHTML={{ __html: numMatch[2].replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/`(.*?)`/g, '<code class="bg-slate-100 text-violet-700 px-1 py-0.5 rounded text-[10px] font-mono">$1</code>') }} />
              </span>
            );
          }
          return (
            <span key={j}>
              <span dangerouslySetInnerHTML={{ __html: (processed as string) }} />
              {j < lines.length - 1 && <br />}
            </span>
          );
        })}
      </span>
    );
  });
};

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

  const currentLang = LANGUAGES[langIndex];

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const buildHistory = (): { role: 'user' | 'model'; parts: { text: string }[] }[] => {
    return messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));
  };

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    const userMessage: ChatMessage = { role: 'user', text: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setSessionStarted(true);

    try {
      const { data } = await api.post('/practice/chat', {
        message: msg,
        history: buildHistory(),
        mode,
        language: currentLang.label,
        code: showEditor ? code : undefined,
      });

      const reply = data.data?.reply || data.data?.text || 'No response received.';
      const aiMessage: ChatMessage = { role: 'model', text: reply, timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to get AI response. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const startSession = () => {
    setMessages([]);
    setSessionStarted(false);
    const greeting = mode === 'behavioral'
      ? "Hi! I'd like to practice behavioral interview questions."
      : mode === 'system_design'
      ? "Hi! I'd like to practice system design interview questions."
      : "Hi! I'd like to practice technical coding interview questions.";
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
      // Use a mock interview id to execute code via the existing endpoint
      const res = await api.post('/interviews/practice-exec/execute', {
        script: code,
        language: currentLang.monaco === 'python' ? 'python' : currentLang.monaco,
        stdin: undefined,
      });
      setExecutionResult(res.data.data);
    } catch {
      toast.error('Code execution is only available during live interviews. Use the AI to review your code instead.');
      setExecutionResult({ output: '// Tip: Share your code with the AI by clicking "Share Code with AI" button.', code: 1 });
    } finally {
      setRunning(false);
    }
  };

  const shareCodeWithAI = () => {
    if (!code.trim()) {
      toast.error('Write some code first!');
      return;
    }
    const msg = `Can you review my code and give me feedback?\n\n\`\`\`${currentLang.monaco}\n${code}\n\`\`\``;
    sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const modeConfig = MODE_CONFIG[mode];
  const ModeIcon = modeConfig.icon;

  return (
    <div className="flex flex-col h-screen bg-[#fafbfc]" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/candidate/interviews')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg ${modeConfig.bg} ${modeConfig.border} border flex items-center justify-center`}>
              <ModeIcon size={13} className={modeConfig.color} />
            </div>
            <div>
              <h1 className="text-[13px] font-bold text-slate-900 leading-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
                AI Practice Room
              </h1>
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{modeConfig.label} Mode</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Selector */}
          {!sessionStarted && (
            <div className="flex bg-slate-100 border border-slate-200/60 p-0.5 rounded-lg">
              {(Object.entries(MODE_CONFIG) as [InterviewMode, typeof modeConfig][]).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setMode(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                      mode === key
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Icon size={11} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Toggle Editor (only in technical mode) */}
          {mode === 'technical' && (
            <button
              onClick={() => setShowEditor(e => !e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            >
              <RotateCcw size={11} />
              New Session
            </button>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex min-h-0">
        
        {/* ── Chat Panel ── */}
        <div className={`flex flex-col ${mode === 'technical' && showEditor ? 'w-1/2' : 'w-full max-w-4xl mx-auto'} border-r border-slate-200/60`}>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {!sessionStarted && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in-up">
                <div className={`w-16 h-16 rounded-2xl ${modeConfig.bg} ${modeConfig.border} border-2 flex items-center justify-center mb-5 shadow-sm`}>
                  <Sparkles size={28} className={modeConfig.color} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-1.5" style={{ fontFamily: 'Sora, sans-serif' }}>
                  AI Mock Interview
                </h2>
                <p className="text-xs text-slate-400 font-medium mb-1 max-w-sm">
                  Practice with an AI interviewer that gives real-time feedback on your answers and code.
                </p>
                <p className="text-[10px] text-slate-350 font-medium mb-6 max-w-xs">
                  {modeConfig.description}
                </p>

                <button
                  onClick={startSession}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg hover:shadow-xl active:scale-[0.98] ${
                    mode === 'behavioral' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200/50' :
                    mode === 'system_design' ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-200/50' :
                    'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200/50'
                  }`}
                >
                  <Sparkles size={13} />
                  Start Practice Session
                </button>

                <div className="mt-8 flex gap-3 text-[10px] text-slate-350 font-medium">
                  <div className="flex items-center gap-1"><Lightbulb size={10} className="text-amber-400" /> AI-powered feedback</div>
                  <div className="flex items-center gap-1"><Cpu size={10} className="text-violet-400" /> Gemini AI</div>
                  <div className="flex items-center gap-1"><Code2 size={10} className="text-emerald-400" /> Code review</div>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                style={{ animationDelay: `${Math.min(idx * 50, 200)}ms` }}
              >
                {msg.role === 'model' && (
                  <div className={`w-7 h-7 rounded-lg ${modeConfig.bg} ${modeConfig.border} border flex items-center justify-center shrink-0 mt-0.5`}>
                    <Bot size={13} className={modeConfig.color} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-[12px] leading-relaxed font-medium ${
                    msg.role === 'user'
                      ? 'bg-slate-800 text-white rounded-br-sm'
                      : 'bg-white border border-slate-200/80 text-slate-700 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.role === 'model' ? renderMarkdown(msg.text) : msg.text}
                  <div className={`text-[9px] mt-1.5 ${msg.role === 'user' ? 'text-slate-400' : 'text-slate-300'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={13} className="text-slate-500" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-start animate-fade-in">
                <div className={`w-7 h-7 rounded-lg ${modeConfig.bg} ${modeConfig.border} border flex items-center justify-center shrink-0`}>
                  <Bot size={13} className={modeConfig.color} />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                    <Loader2 size={12} className="animate-spin" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          {sessionStarted && (
            <div className="border-t border-slate-200/80 bg-white p-3 shrink-0">
              <div className="flex items-end gap-2">
                {mode === 'technical' && showEditor && (
                  <button
                    onClick={shareCodeWithAI}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 hover:bg-violet-100 transition-all shrink-0"
                    title="Send your current code to the AI for review"
                  >
                    <Code2 size={11} />
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
                      mode === 'behavioral' ? 'Type your answer...' :
                      mode === 'system_design' ? 'Describe your design approach...' :
                      'Ask a question or describe your approach...'
                    }
                    className="w-full resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] text-slate-700 font-medium placeholder:text-slate-350 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
                    rows={1}
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                    onInput={(e) => {
                      const t = e.currentTarget;
                      t.style.height = 'auto';
                      t.style.height = Math.min(t.scrollHeight, 120) + 'px';
                    }}
                  />
                </div>
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="text-[9px] text-slate-300 mt-1.5 px-1">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          )}
        </div>

        {/* ── Code Editor Panel (Technical Mode Only) ── */}
        {mode === 'technical' && showEditor && (
          <div className="w-1/2 flex flex-col bg-[#1e1e1e] text-white">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#333] bg-[#252526] shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    className="bg-[#3c3c3c] border border-[#555] rounded-md text-xs px-3 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-amber-500 appearance-none font-bold text-gray-200 cursor-pointer"
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
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">Practice Sandbox</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={shareCodeWithAI}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md font-bold transition-colors bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30"
                  title="Send code to AI for review"
                >
                  <Sparkles size={11} />
                  AI Review
                </button>
                <button
                  onClick={handleRunCode}
                  disabled={running}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md text-xs font-black transition-all shadow-lg shadow-emerald-900/40"
                >
                  <Play size={11} fill="white" />
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
                  renderLineHighlight: 'line',
                  fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
                  fontLigatures: true,
                  padding: { top: 12 },
                  smoothScrolling: true,
                  cursorBlinking: 'phase',
                  cursorSmoothCaretAnimation: 'on',
                }}
              />
            </div>

            {/* Output Panel */}
            <div className="border-t border-[#333] bg-[#1a1a1a] shrink-0" style={{ height: '140px' }}>
              <div className="flex items-center justify-between px-4 py-1.5 border-b border-[#2a2a2a]">
                <div className="flex items-center gap-2">
                  <Terminal size={11} className="text-gray-600" />
                  <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Output</span>
                  {executionResult && (
                    executionResult.code === 0
                      ? <CheckCircle2 size={12} className="text-emerald-400" />
                      : <AlertCircle size={12} className="text-red-400" />
                  )}
                </div>
                {running && (
                  <div className="flex items-center gap-1 text-[10px] text-gray-600">
                    <Clock size={10} className="animate-spin" />
                    <span>Executing...</span>
                  </div>
                )}
              </div>
              <pre className={`h-[100px] overflow-auto px-4 py-3 text-xs font-mono whitespace-pre-wrap leading-relaxed ${
                running ? 'text-gray-600 animate-pulse' :
                executionResult?.code === 0 ? 'text-emerald-300' :
                executionResult?.code !== null ? 'text-red-400' :
                'text-gray-600'
              }`}>
                {running
                  ? '⟳  Executing your code...'
                  : executionResult?.output || '// Press Run to execute your code, or ask the AI to review it'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeRoom;
