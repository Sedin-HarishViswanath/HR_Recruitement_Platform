import axios from 'axios';
import { AppError } from '../../shared/errors/AppError';
import { env } from '../../config/env';
import { logger } from '../../shared/utils/logger';

/**
 * Code execution via a Piston engine (https://github.com/engineer-man/piston).
 * No credentials required — used by both live technical assessments and the
 * candidate practice room. Defaults to the self-hosted `piston` container
 * (the public emkc.org API became whitelist-only in Feb 2026).
 */
const PISTON_URL = (env.PISTON_URL || 'http://piston:2000/api/v2').replace(/\/$/, '');

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

// Maps our UI/monaco language IDs -> Piston language names.
const PISTON_LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'c++',
  c: 'c',
  csharp: 'csharp',
  go: 'go',
  ruby: 'ruby',
  php: 'php',
  swift: 'swift',
  kotlin: 'kotlin',
  rust: 'rust',
  bash: 'bash',
};

// Cache Piston's available runtimes so we can resolve a concrete version per
// language (Piston requires an explicit version on execute).
let runtimeCache: { language: string; version: string; aliases: string[] }[] | null = null;

const loadRuntimes = async () => {
  if (runtimeCache) return runtimeCache;
  const res = await axios.get(`${PISTON_URL}/runtimes`, { timeout: 10000 });
  runtimeCache = res.data;
  return runtimeCache!;
};

const resolveVersion = async (pistonLang: string): Promise<string | null> => {
  const runtimes = await loadRuntimes();
  const match = runtimes.find(
    (r) => r.language === pistonLang || (r.aliases || []).includes(pistonLang),
  );
  return match?.version || null;
};

/**
 * Execute code via Piston. Never needs API keys.
 */
export const executeWithPiston = async (
  params: PistonExecuteParams,
): Promise<PistonResult> => {
  const { language, code, stdin } = params;

  const pistonLang = PISTON_LANGUAGE_MAP[language];
  if (!pistonLang) {
    return { output: `Language "${language}" is not supported by the execution engine.`, stderr: '', code: 1, signal: null };
  }

  let version: string | null;
  try {
    version = await resolveVersion(pistonLang);
  } catch (err: any) {
    logger.warn('Piston runtimes lookup failed', { module: 'CodeExec', message: err?.message });
    throw new AppError('Code execution service is currently unavailable. Please try again shortly.', 502);
  }
  if (!version) {
    return { output: `Language "${language}" is not available on the execution engine.`, stderr: '', code: 1, signal: null };
  }

  try {
    const response = await axios.post(
      `${PISTON_URL}/execute`,
      {
        language: pistonLang,
        version,
        files: [{ content: code }],
        stdin: stdin || '',
        compile_timeout: 10000,
        run_timeout: 3000,
      },
      { timeout: 20000, headers: { 'Content-Type': 'application/json' } },
    );

    const run = response.data?.run || {};
    const compile = response.data?.compile;

    // Surface compile errors (e.g. Java/C++) ahead of run output.
    const compileErr = compile && compile.code !== 0 ? (compile.stderr || compile.output || '') : '';
    const stdout = run.stdout || '';
    const stderr = run.stderr || '';
    const combined = [compileErr, run.output ?? (stdout + stderr)].filter(Boolean).join('\n').trim();

    return {
      output: combined || '(no output)',
      stderr,
      code: compileErr ? 1 : (typeof run.code === 'number' ? run.code : 0),
      signal: run.signal || null,
    };
  } catch (error: any) {
    if (error?.response?.status === 429) {
      throw new AppError('Code execution is rate-limited right now. Please try again in a few seconds.', 429);
    }
    logger.warn('Piston execute failed', { module: 'CodeExec', message: error?.message });
    throw new AppError('Code execution service is currently unavailable. Please try again shortly.', 502);
  }
};

/**
 * Fetch the available runtimes (used for diagnostics / health checks).
 */
export const getPistonRuntimes = async () => {
  return loadRuntimes();
};
