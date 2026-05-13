import axios from 'axios';

const PISTON_API = 'https://emkc.org/api/v2/piston';

export interface PistonExecuteParams {
  language: string;
  version: string;
  code: string;
  stdin?: string;
  filename?: string;
}

export interface PistonResult {
  output: string;
  stderr: string;
  code: number | null;
  signal: string | null;
  cpuTime?: string;
  memory?: string;
}

// Maps our UI language IDs → Piston language + version + filename
export const PISTON_LANGUAGE_MAP: Record<string, { lang: string; version: string; filename: string }> = {
  javascript: { lang: 'javascript', version: '18.15.0', filename: 'main.js' },
  python:     { lang: 'python',     version: '3.10.0',  filename: 'main.py' },
  java:       { lang: 'java',       version: '15.0.2',  filename: 'Main.java' },
  cpp:        { lang: 'c++',        version: '10.2.0',  filename: 'main.cpp' },
  c:          { lang: 'c',          version: '10.2.0',  filename: 'main.c' },
  csharp:     { lang: 'csharp',     version: '6.12.0',  filename: 'main.cs' },
  typescript: { lang: 'typescript', version: '5.0.3',   filename: 'main.ts' },
  go:         { lang: 'go',         version: '1.16.2',  filename: 'main.go' },
  ruby:       { lang: 'ruby',       version: '3.0.1',   filename: 'main.rb' },
  php:        { lang: 'php',        version: '8.2.3',   filename: 'main.php' },
  swift:      { lang: 'swift',      version: '5.3.3',   filename: 'main.swift' },
  kotlin:     { lang: 'kotlin',     version: '1.8.20',  filename: 'main.kt' },
  rust:       { lang: 'rust',       version: '1.68.2',  filename: 'main.rs' },
  bash:       { lang: 'bash',       version: '5.2.0',   filename: 'main.sh' },
};

export const executeWithPiston = async (params: PistonExecuteParams): Promise<PistonResult> => {
  const { language, code, stdin } = params;

  const langConfig = PISTON_LANGUAGE_MAP[language];
  if (!langConfig) {
    return { output: `Language "${language}" is not supported.`, stderr: '', code: 1, signal: null };
  }

  const start = Date.now();
  
  const response = await axios.post(`${PISTON_API}/execute`, {
    language: langConfig.lang,
    version: langConfig.version,
    files: [
      {
        name: langConfig.filename,
        content: code,
      },
    ],
    stdin: stdin || '',
    args: [],
    compile_timeout: 15000,
    run_timeout: 10000,
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  const run = response.data.run;
  const compile = response.data.compile; // only present for compiled languages

  let output = run?.stdout || '';
  let stderr = run?.stderr || '';

  // For compiled languages, prepend any compile errors
  if (compile?.stderr) {
    stderr = `[Compile Error]\n${compile.stderr}\n${stderr}`;
  }

  // Combine stdout and stderr for display
  const fullOutput = output || stderr || '(no output)';

  return {
    output: fullOutput,
    stderr,
    code: run?.code ?? null,
    signal: run?.signal ?? null,
    cpuTime: elapsed,
  };
};

/**
 * Fetch available runtimes from Piston (for health check / discovery)
 */
export const getPistonRuntimes = async () => {
  const res = await axios.get(`${PISTON_API}/runtimes`);
  return res.data;
};
