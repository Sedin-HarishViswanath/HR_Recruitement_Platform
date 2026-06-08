import { db } from '../../config/db';
import { env } from '../../config/env';
import { logger } from '../../shared/utils/logger';

// ─── Code Normalizer ───────────────────────────────────────────────────
// Strips comments, normalizes whitespace, replaces identifiers with
// generic tokens so that variable-renaming cannot bypass detection.

/**
 * Language-aware comment stripping.
 */
function stripComments(code: string, language: string): string {
  // C-style languages: JS, TS, Java, C, C++, C#, Go, Rust, Kotlin, Swift, PHP
  const cStyleLangs = ['javascript', 'typescript', 'java', 'c', 'cpp', 'csharp', 'go', 'rust', 'kotlin', 'swift', 'php'];
  // Script-style: Python, Ruby, Bash
  const hashCommentLangs = ['python', 'ruby', 'bash'];

  let result = code;

  if (cStyleLangs.includes(language)) {
    // Remove block comments /* ... */
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove single-line comments // ...
    result = result.replace(/\/\/.*$/gm, '');
  }

  if (hashCommentLangs.includes(language)) {
    // Remove # comments
    result = result.replace(/#.*$/gm, '');
  }

  if (language === 'python') {
    // Remove triple-quote docstrings
    result = result.replace(/"""[\s\S]*?"""/g, '');
    result = result.replace(/'''[\s\S]*?'''/g, '');
  }

  return result;
}

/**
 * Normalize code into a sequence of structural tokens.
 *
 * This is a lightweight AST-like normalization that:
 * 1. Strips comments and string literals
 * 2. Replaces all identifiers with a generic 'ID' token
 * 3. Replaces all number literals with 'NUM'
 * 4. Preserves keywords, operators, and structural tokens
 * 5. Normalizes whitespace
 */
function normalizeCode(code: string, language: string): string[] {
  // Strip comments first
  let cleaned = stripComments(code, language);

  // Replace string literals with a generic token
  cleaned = cleaned.replace(/"(?:[^"\\]|\\.)*"/g, 'STR');
  cleaned = cleaned.replace(/'(?:[^'\\]|\\.)*'/g, 'STR');
  cleaned = cleaned.replace(/`(?:[^`\\]|\\.)*`/g, 'STR');

  // Language keywords that should be preserved (they carry structural meaning)
  const keywords = new Set([
    // Common across languages
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
    'return', 'function', 'class', 'new', 'try', 'catch', 'throw', 'finally',
    'import', 'export', 'from', 'const', 'let', 'var', 'async', 'await',
    'yield', 'static', 'public', 'private', 'protected', 'abstract',
    'interface', 'extends', 'implements', 'super', 'this', 'typeof',
    'instanceof', 'void', 'null', 'undefined', 'true', 'false',
    // Python
    'def', 'elif', 'except', 'lambda', 'pass', 'raise', 'with', 'as',
    'in', 'not', 'and', 'or', 'is', 'None', 'True', 'False', 'self',
    'print', 'range', 'len', 'map', 'filter',
    // Java/C#
    'void', 'int', 'long', 'float', 'double', 'boolean', 'char', 'string',
    'byte', 'short', 'final', 'override', 'package', 'using', 'namespace',
    // C/C++
    'include', 'define', 'struct', 'enum', 'union', 'typedef', 'sizeof',
    'malloc', 'free', 'printf', 'scanf', 'main',
    // Go
    'func', 'go', 'chan', 'select', 'defer', 'goroutine', 'make',
    // Rust
    'fn', 'let', 'mut', 'impl', 'trait', 'match', 'mod', 'use', 'pub', 'ref',
  ]);

  // Structural operators/delimiters to preserve
  const operators = new Set([
    '{', '}', '(', ')', '[', ']', ';', ',', ':', '.',
    '=', '==', '===', '!=', '!==', '<', '>', '<=', '>=',
    '+', '-', '*', '/', '%', '**',
    '&&', '||', '!', '&', '|', '^', '~',
    '<<', '>>', '>>>',
    '+=', '-=', '*=', '/=', '%=',
    '=>', '->', '::',
    '?', '??', '?.', '...', '@',
  ]);

  // Tokenize: split on whitespace and boundaries around operators
  const tokenPattern = /[a-zA-Z_$][a-zA-Z0-9_$]*|[0-9]+(?:\.[0-9]+)?|===|!==|==|!=|<=|>=|&&|\|\||<<|>>|>>>|\?\?|\?\.|=>|->|::|\.{3}|[{}()\[\];,.:=+\-*/%<>!&|^~?@]/g;

  const rawTokens = cleaned.match(tokenPattern) || [];

  const normalized: string[] = [];
  for (const token of rawTokens) {
    if (keywords.has(token)) {
      normalized.push(token);
    } else if (operators.has(token)) {
      normalized.push(token);
    } else if (/^[0-9]/.test(token)) {
      normalized.push('NUM');
    } else if (token === 'STR') {
      normalized.push('STR');
    } else {
      // It's an identifier — normalize it
      normalized.push('ID');
    }
  }

  return normalized;
}

// ─── N-Gram Fingerprinting (Winnowing Algorithm) ───────────────────────

/**
 * Generate n-grams from a token sequence.
 */
function generateNgrams(tokens: string[], n: number): string[] {
  if (tokens.length < n) return [tokens.join(' ')];

  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * Simple string hash function (djb2).
 * Fast and produces reasonably distributed 32-bit hashes.
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

/**
 * Winnowing algorithm: select the minimum hash from each window.
 * This produces a smaller set of "fingerprints" that still captures
 * structural similarity, making comparison more efficient.
 *
 * @param hashes   Array of n-gram hashes
 * @param windowSize   Size of the sliding window (typically n - threshold + 1)
 * @returns Set of selected fingerprint hashes
 */
function winnow(hashes: number[], windowSize: number): Set<number> {
  if (hashes.length === 0) return new Set();
  if (windowSize <= 0 || windowSize > hashes.length) {
    return new Set(hashes);
  }

  const fingerprints = new Set<number>();
  let prevMinIdx = -1;

  for (let i = 0; i <= hashes.length - windowSize; i++) {
    // Find minimum hash in the window
    let minVal = hashes[i];
    let minIdx = i;

    for (let j = i + 1; j < i + windowSize; j++) {
      if (hashes[j] < minVal) {
        minVal = hashes[j];
        minIdx = j;
      }
    }

    // Only add if it's a new minimum position (avoid duplicates)
    if (minIdx !== prevMinIdx) {
      fingerprints.add(minVal);
      prevMinIdx = minIdx;
    }
  }

  return fingerprints;
}

// ─── Similarity Metrics ────────────────────────────────────────────────

/**
 * Jaccard similarity: |A ∩ B| / |A ∪ B|
 * Measures structural overlap between two fingerprint sets.
 */
function jaccardSimilarity(setA: Set<number>, setB: Set<number>): number {
  if (setA.size === 0 && setB.size === 0) return 0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  if (union === 0) return 0;

  return intersection / union;
}

// ─── Public Service ────────────────────────────────────────────────────

export interface PlagiarismResult {
  similarity_score: number;         // 0–100 percentage
  is_flagged: boolean;              // true if above threshold
  most_similar_candidate?: string;  // name of the most similar candidate
  most_similar_interview_id?: string;
  matched_fragments_count: number;  // number of matching fingerprints
  total_comparisons: number;        // how many other submissions were checked
  scoring_method: 'ast-fingerprint';
}

export class CodePlagiarismService {
  private readonly NGRAM_SIZE = 5;        // structural n-gram window size
  private readonly WINNOW_WINDOW = 4;     // winnowing window size

  /**
   * Check a code submission for plagiarism against other submissions
   * for the same job position.
   *
   * Algorithm:
   * 1. Normalize the submitted code (strip comments, replace identifiers)
   * 2. Generate structural n-grams
   * 3. Apply winnowing to select representative fingerprints
   * 4. Compare fingerprints against all other submissions for the same job
   * 5. Return the highest similarity score found
   */
  async checkPlagiarism(
    interviewId: string,
    code: string,
    language: string,
  ): Promise<PlagiarismResult> {
    const threshold = env.PLAGIARISM_THRESHOLD;

    // 1. Get the job ID for this interview to find peer submissions
    const interview = await db('interviews')
      .select('interviews.id', 'applications.job_id', 'applications.candidate_id')
      .join('applications', 'interviews.application_id', 'applications.id')
      .where('interviews.id', interviewId)
      .first();

    if (!interview) {
      return this.emptyResult();
    }

    // 2. Get all other code submissions for the same job (excluding this interview)
    const otherInterviews = await db('interviews')
      .select(
        'interviews.id',
        'interviews.code_snapshots',
        'candidates.name as candidate_name',
      )
      .join('applications', 'interviews.application_id', 'applications.id')
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .where('applications.job_id', interview.job_id)
      .whereNot('interviews.id', interviewId)
      .whereNotNull('interviews.code_snapshots');

    if (otherInterviews.length === 0) {
      return this.emptyResult();
    }

    // 3. Normalize and fingerprint the submitted code
    const submittedTokens = normalizeCode(code, language);
    const submittedNgrams = generateNgrams(submittedTokens, this.NGRAM_SIZE);
    const submittedHashes = submittedNgrams.map(ng => hashString(ng));
    const submittedFingerprints = winnow(submittedHashes, this.WINNOW_WINDOW);

    if (submittedFingerprints.size === 0) {
      return this.emptyResult();
    }

    // 4. Compare against each other submission
    let maxSimilarity = 0;
    let mostSimilarCandidate: string | undefined;
    let mostSimilarInterviewId: string | undefined;
    let maxMatchedFragments = 0;

    for (const other of otherInterviews) {
      // Extract the most recent code snapshot
      const snapshots = other.code_snapshots;
      if (!snapshots || !Array.isArray(snapshots) || snapshots.length === 0) continue;

      // Get the last snapshot's code
      const lastSnapshot = snapshots[snapshots.length - 1];
      const otherCode = lastSnapshot?.code || lastSnapshot?.script || '';
      const otherLang = lastSnapshot?.language || language;

      if (!otherCode) continue;

      // Normalize and fingerprint the other submission
      const otherTokens = normalizeCode(otherCode, otherLang);
      const otherNgrams = generateNgrams(otherTokens, this.NGRAM_SIZE);
      const otherHashes = otherNgrams.map(ng => hashString(ng));
      const otherFingerprints = winnow(otherHashes, this.WINNOW_WINDOW);

      if (otherFingerprints.size === 0) continue;

      // Calculate Jaccard similarity
      const similarity = jaccardSimilarity(submittedFingerprints, otherFingerprints);

      // Count matched fragments
      let matchCount = 0;
      for (const fp of submittedFingerprints) {
        if (otherFingerprints.has(fp)) matchCount++;
      }

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        mostSimilarCandidate = other.candidate_name;
        mostSimilarInterviewId = other.id;
        maxMatchedFragments = matchCount;
      }
    }

    const similarityPercent = Math.round(maxSimilarity * 100);
    const isFlagged = similarityPercent >= threshold;

    if (isFlagged) {
      logger.warn(
        `Plagiarism flagged: Interview ${interviewId} has ${similarityPercent}% similarity with ${mostSimilarCandidate}'s submission`,
        { module: 'Plagiarism' }
      );
    } else {
      logger.info(
        `Plagiarism check passed: Interview ${interviewId} — max similarity ${similarityPercent}% (threshold: ${threshold}%)`,
        { module: 'Plagiarism' }
      );
    }

    return {
      similarity_score: similarityPercent,
      is_flagged: isFlagged,
      most_similar_candidate: mostSimilarCandidate,
      most_similar_interview_id: mostSimilarInterviewId,
      matched_fragments_count: maxMatchedFragments,
      total_comparisons: otherInterviews.length,
      scoring_method: 'ast-fingerprint',
    };
  }

  /**
   * Analyze a single piece of code and return its structural fingerprint
   * (useful for debugging or showing the normalization to the user).
   */
  analyzeCode(code: string, language: string) {
    const tokens = normalizeCode(code, language);
    const ngrams = generateNgrams(tokens, this.NGRAM_SIZE);
    const hashes = ngrams.map(ng => hashString(ng));
    const fingerprints = winnow(hashes, this.WINNOW_WINDOW);

    return {
      token_count: tokens.length,
      unique_tokens: new Set(tokens).size,
      ngram_count: ngrams.length,
      fingerprint_count: fingerprints.size,
      normalized_preview: tokens.slice(0, 50).join(' '),
    };
  }

  private emptyResult(): PlagiarismResult {
    return {
      similarity_score: 0,
      is_flagged: false,
      matched_fragments_count: 0,
      total_comparisons: 0,
      scoring_method: 'ast-fingerprint',
    };
  }
}

export const codePlagiarismService = new CodePlagiarismService();
