import axios from 'axios';
import { AppError } from '../../shared/errors/AppError';

const PISTON_API = 'https://emkc.org/api/v2/piston';

export interface PistonExecuteParams {
  language: string;
  version?: string;
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

/**
 * Sleep helper for retry backoff
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute code via the Piston API with retry logic.
 * Retries up to maxRetries times on timeout / 5xx with exponential backoff.
 */
export const executeWithPiston = async (
  params: PistonExecuteParams,
  maxRetries = 2,
): Promise<PistonResult> => {
  const { language, code, stdin } = params;

  const langConfig = PISTON_LANGUAGE_MAP[language];
  if (!langConfig) {
    return { output: `Language "${language}" is not supported.`, stderr: '', code: 1, signal: null };
  }

  const payload = {
    language: langConfig.lang,
    version: langConfig.version,
    files: [{ name: langConfig.filename, content: code }],
    stdin: stdin || '',
    args: [],
    compile_timeout: 15000,
    run_timeout: 10000,
  };

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 1s, 2s
      await sleep(attempt * 1000);
      console.log(`[Piston] Retry attempt ${attempt}/${maxRetries}`);
    }

    const start = Date.now();

    try {
      const response = await axios.post(`${PISTON_API}/execute`, payload, {
        timeout: 25000,
        headers: { 'Content-Type': 'application/json' },
      });

      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      const run = response.data.run;
      const compile = response.data.compile; // only present for compiled languages

      let output = run?.stdout || '';
      let stderr = run?.stderr || '';

      // Prepend compile errors for compiled languages
      if (compile?.stderr) {
        stderr = `[Compile Error]\n${compile.stderr}\n${stderr}`;
      }

      const fullOutput = output || stderr || '(no output)';

      return {
        output: fullOutput,
        stderr,
        code: run?.code ?? null,
        signal: run?.signal ?? null,
        cpuTime: elapsed,
      };
    } catch (error: any) {
      lastError = error;

      const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
      const isServerError = error.response?.status >= 500;
      const isRateLimit = error.response?.status === 429;

      // Don't retry on rate limit — add longer wait
      if (isRateLimit && attempt < maxRetries) {
        console.log('[Piston] Rate limited, waiting 3s...');
        await sleep(3000);
        continue;
      }

      // Retry on timeout or server errors
      if ((isTimeout || isServerError) && attempt < maxRetries) {
        console.log(`[Piston] Transient error (${error.code || error.response?.status}), retrying...`);
        continue;
      }

      // Final attempt failed or non-retryable error — break out
      break;
    }
  }

  // All attempts exhausted
  if (lastError?.code === 'ECONNABORTED' || lastError?.code === 'ETIMEDOUT') {
    throw new AppError(
      'Execution engine timed out. The code may be too complex or the service is overloaded. Try a simpler snippet.',
      504,
    );
  }

  if (lastError?.response?.status === 429) {
    throw new AppError(
      'Execution service is rate-limited. Please wait a moment and try again.',
      429,
    );
  }

  throw new AppError(
    'Code execution service (Piston) is currently unavailable. Please try again in a few seconds.',
    502,
  );
};

/**
 * Fetch available runtimes from Piston (for health check / discovery)
 */
export const getPistonRuntimes = async () => {
  const res = await axios.get(`${PISTON_API}/runtimes`, { timeout: 10000 });
  return res.data;
};
