import axios from 'axios';
import { AppError } from '../../shared/errors/AppError';
import { env } from '../../config/env';

const JDOODLE_API = 'https://api.jdoodle.com/v1/execute';

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

// Maps our UI language IDs -> JDoodle language + versionIndex
export const JDOODLE_LANGUAGE_MAP: Record<string, { lang: string; versionIndex: string }> = {
  javascript: { lang: 'nodejs', versionIndex: '4' },
  python:     { lang: 'python3', versionIndex: '4' },
  java:       { lang: 'java', versionIndex: '4' },
  cpp:        { lang: 'cpp', versionIndex: '5' },
  c:          { lang: 'c', versionIndex: '5' },
  csharp:     { lang: 'csharp', versionIndex: '4' },
  go:         { lang: 'go', versionIndex: '4' },
  ruby:       { lang: 'ruby', versionIndex: '4' },
  php:        { lang: 'php', versionIndex: '4' },
  swift:      { lang: 'swift', versionIndex: '4' },
  kotlin:     { lang: 'kotlin', versionIndex: '3' },
  rust:       { lang: 'rust', versionIndex: '4' },
  bash:       { lang: 'bash', versionIndex: '4' },
  typescript: { lang: 'nodejs', versionIndex: '4' }, // Fallback to Node for TS (needs compilation normally, but simple JS syntax works)
};

/**
 * Execute code via the JDoodle API (fallback from Piston).
 */
export const executeWithPiston = async (
  params: PistonExecuteParams,
  maxRetries = 2,
): Promise<PistonResult> => {
  const { language, code, stdin } = params;

  if (!env.JDOODLE_CLIENT_ID || !env.JDOODLE_CLIENT_SECRET) {
    throw new AppError('Code execution engine is not configured (missing JDoodle credentials).', 500);
  }

  const langConfig = JDOODLE_LANGUAGE_MAP[language];
  if (!langConfig) {
    return { output: `Language "${language}" is not supported by the execution engine.`, stderr: '', code: 1, signal: null };
  }

  const payload = {
    clientId: env.JDOODLE_CLIENT_ID,
    clientSecret: env.JDOODLE_CLIENT_SECRET,
    script: code,
    stdin: stdin || '',
    language: langConfig.lang,
    versionIndex: langConfig.versionIndex,
  };

  try {
    const response = await axios.post(JDOODLE_API, payload, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    return {
      output: response.data.output || '(no output)',
      stderr: '', // JDoodle combines stderr and stdout into output
      code: response.data.statusCode === 200 ? 0 : 1, 
      signal: null,
      cpuTime: response.data.cpuTime,
      memory: response.data.memory
    };
  } catch (error: any) {
    throw new AppError(
      'Code execution service (JDoodle) is currently unavailable. Please try again in a few seconds.',
      502,
    );
  }
};

/**
 * Dummy health check for JDoodle
 */
export const getPistonRuntimes = async () => {
  return [{ language: 'nodejs' }]; // Stub response
};
