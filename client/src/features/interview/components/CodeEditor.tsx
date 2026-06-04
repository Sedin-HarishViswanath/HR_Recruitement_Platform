import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { api } from '../../../shared/lib/api';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { Play, ChevronDown, Terminal, Clock, AlertCircle, CheckCircle2, WifiOff } from 'lucide-react';

interface CodeEditorProps {
  interviewId: string;
  isReadOnly?: boolean;
}

// Language config: UI label | Piston ID (sent to backend) | Monaco syntax | starter code
const LANGUAGES = [
  {
    label: 'JavaScript',
    pistonId: 'javascript',
    monaco: 'javascript',
    starter: '// JavaScript\nconsole.log("Hello, World!");',
  },
  {
    label: 'Python 3',
    pistonId: 'python',
    monaco: 'python',
    starter: '# Python 3\nprint("Hello, World!")',
  },
  {
    label: 'Java',
    pistonId: 'java',
    monaco: 'java',
    starter: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
  },
  {
    label: 'C++',
    pistonId: 'cpp',
    monaco: 'cpp',
    starter: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
  },
  {
    label: 'C',
    pistonId: 'c',
    monaco: 'c',
    starter: '#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
  },
  {
    label: 'C#',
    pistonId: 'csharp',
    monaco: 'csharp',
    starter: 'using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}',
  },
  {
    label: 'TypeScript',
    pistonId: 'typescript',
    monaco: 'typescript',
    starter: 'const greet = (name: string): string => `Hello, ${name}!`;\nconsole.log(greet("World"));',
  },
  {
    label: 'Go',
    pistonId: 'go',
    monaco: 'go',
    starter: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
  },
  {
    label: 'Ruby',
    pistonId: 'ruby',
    monaco: 'ruby',
    starter: 'puts "Hello, World!"',
  },
  {
    label: 'PHP',
    pistonId: 'php',
    monaco: 'php',
    starter: '<?php\necho "Hello, World!\\n";\n?>',
  },
  {
    label: 'Swift',
    pistonId: 'swift',
    monaco: 'swift',
    starter: 'print("Hello, World!")',
  },
  {
    label: 'Kotlin',
    pistonId: 'kotlin',
    monaco: 'kotlin',
    starter: 'fun main() {\n    println("Hello, World!")\n}',
  },
  {
    label: 'Rust',
    pistonId: 'rust',
    monaco: 'rust',
    starter: 'fn main() {\n    println!("Hello, World!");\n}',
  },
  {
    label: 'Bash',
    pistonId: 'bash',
    monaco: 'shell',
    starter: '#!/bin/bash\necho "Hello, World!"',
  },
];

interface ExecutionResult {
  output: string;
  stderr?: string;
  code: number | null;
  cpuTime?: string;
}

// The backend URL for socket.io.
// In dev: Vite proxies /socket.io â†’ backend:5000, so we connect to current origin.
// In prod: the same server serves both frontend and backend (or use VITE_API_URL).
const BACKEND_URL = import.meta.env.VITE_API_URL || window.location.origin;

export const CodeEditor = ({ interviewId, isReadOnly = false }: CodeEditorProps) => {
  const [langIndex, setLangIndex] = useState(0);
  const [code, setCode] = useState(LANGUAGES[0].starter);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [running, setRunning] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const currentLang = LANGUAGES[langIndex];
  const isSuccess = result !== null && result.code === 0;
  const isError = result !== null && result.code !== 0;

  useEffect(() => {
    // Connect to the backend socket.io server (not the Vite dev server)
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join-interview', interviewId);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('connect_error', () => {
      setSocketConnected(false);
    });

    socket.on('code-update', (data: { code: string; langIndex: number }) => {
      if (isReadOnly) {
        setCode(data.code);
        if (data.langIndex !== undefined) setLangIndex(data.langIndex);
      }
    });

    return () => { socket.disconnect(); };
  }, [interviewId, isReadOnly]);

  const emitCodeChange = (newCode: string, newLangIndex: number) => {
    if (!isReadOnly && socketRef.current?.connected) {
      socketRef.current.emit('code-change', {
        interviewId,
        code: newCode,
        langIndex: newLangIndex,
      });
    }
  };

  const handleCodeChange = (newCode: string | undefined) => {
    const val = newCode || '';
    setCode(val);
    emitCodeChange(val, langIndex);
  };

  const handleLanguageChange = (idx: number) => {
    const newStarter = LANGUAGES[idx].starter;
    setLangIndex(idx);
    setCode(newStarter);
    setResult(null);
    emitCodeChange(newStarter, idx);
  };

  const handleRunCode = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await api.post(`/interviews/${interviewId}/execute`, {
        script: code,
        language: currentLang.pistonId,
        stdin: stdin || undefined,
      });
      setResult(res.data.data);
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;

      if (!err?.response) {
        // Network error â€” backend not reachable
        toast.error('Backend server is unreachable. Is the server running?');
        setResult({ output: '// Error: Cannot connect to the backend server.\n// Make sure the server is running on port 5000.', code: 1 });
      } else if (status === 502 || status === 504) {
        // Backend reached, but Piston execution engine is down/slow
        toast.error('Code execution engine is temporarily unavailable.');
        setResult({ output: `// Error: ${serverMsg || 'Execution engine (Piston) is unavailable.'}\n// Try again in a moment.`, code: 1 });
      } else {
        toast.error(serverMsg || 'Failed to execute code');
        setResult({ output: `// Error: ${serverMsg || 'Unknown execution error.'}`, code: 1 });
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white select-none">

      {/* â”€â”€ Toolbar â”€â”€ */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333] gap-3 shrink-0 bg-[#252526]">
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative">
            <select
              className="bg-[#3c3c3c] border border-[#555] rounded-md text-xs px-3 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-amber-500 appearance-none font-bold text-gray-200 cursor-pointer"
              value={langIndex}
              onChange={(e) => handleLanguageChange(Number(e.target.value))}
              disabled={isReadOnly}
            >
              {LANGUAGES.map((l, i) => (
                <option key={l.pistonId} value={i}>{l.label}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>

          {isReadOnly && (
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-violet-400 bg-violet-50 px-2 py-1 rounded border border-violet-200 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />
              Live View
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Socket connection indicator */}
          <div className={`flex items-center gap-1 text-[10px] ${socketConnected ? 'text-emerald-500' : 'text-slate-600'}`} title={socketConnected ? 'Live sync active' : 'Sync disconnected'}>
            {socketConnected ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <WifiOff size={10} className="text-slate-600" />
            )}
          </div>

          {!isReadOnly && (
            <>
              <button
                onClick={() => setShowStdin(s => !s)}
                title="Toggle stdin input"
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md font-bold transition-colors ${
                  showStdin ? 'bg-blue-700/60 text-blue-200 border border-blue-600' : 'bg-[#3c3c3c] text-gray-400 hover:text-white border border-[#555]'
                }`}
              >
                <Terminal size={11} />
                stdin
              </button>
              <button
                onClick={handleRunCode}
                disabled={running}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md text-xs font-black transition-all shadow-lg shadow-emerald-900/40"
              >
                <Play size={11} fill="white" />
                {running ? 'Running...' : 'Run'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* â”€â”€ stdin Panel â”€â”€ */}
      {showStdin && !isReadOnly && (
        <div className="border-b border-[#333] bg-[#1a1a1a] px-4 py-2.5 shrink-0">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-1.5">Standard Input (stdin)</p>
          <textarea
            className="w-full bg-transparent text-green-300 font-mono text-xs outline-none resize-none placeholder-gray-700"
            rows={3}
            placeholder="Enter program input here (one value per line)..."
            value={stdin}
            onChange={e => setStdin(e.target.value)}
          />
        </div>
      )}

      {/* â”€â”€ Monaco Editor â”€â”€ */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={currentLang.monaco}
          theme="vs-dark"
          value={code}
          onChange={handleCodeChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            wordWrap: 'on',
            readOnly: isReadOnly,
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

      {/* â”€â”€ Output Panel â”€â”€ */}
      <div className="border-t border-[#333] bg-[#1a1a1a] shrink-0" style={{ height: '176px' }}>
        {/* Output header */}
        <div className="flex items-center justify-between px-4 py-1.5 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Output</span>
            {result && (
              isSuccess
                ? <CheckCircle2 size={12} className="text-emerald-400" />
                : <AlertCircle size={12} className="text-red-400" />
            )}
          </div>
          {result?.cpuTime && (
            <div className="flex items-center gap-1 text-[10px] text-gray-600">
              <Clock size={10} />
              <span>{result.cpuTime}s</span>
            </div>
          )}
        </div>

        {/* Output content */}
        <pre className={`h-[136px] overflow-auto px-4 py-3 text-xs font-mono whitespace-pre-wrap leading-relaxed ${
          running ? 'text-gray-600 animate-pulse' :
          isError  ? 'text-red-400' :
          isSuccess ? 'text-emerald-300' :
          'text-gray-600'
        }`}>
          {running
            ? '⏳  Executing your code...'
            : result?.output || '// Press Run to execute your code'}
        </pre>
      </div>
    </div>
  );
};
