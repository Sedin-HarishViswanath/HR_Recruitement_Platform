import { logger } from '../../shared/utils/logger';

// ─── Stop Words ────────────────────────────────────────────────────────
// Common English words that carry no semantic weight for matching
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'must',
  'it', 'its', 'this', 'that', 'these', 'those', 'i', 'me', 'my',
  'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
  'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'when',
  'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
  'about', 'above', 'after', 'again', 'also', 'am', 'any', 'because',
  'before', 'between', 'during', 'here', 'if', 'into', 'over',
  'then', 'there', 'through', 'under', 'up', 'down', 'out', 'off',
  'once', 'further', 'well', 'able', 'etc', 'e.g', 'i.e',
  // Resume-specific noise words
  'experience', 'work', 'working', 'worked', 'team', 'using',
  'including', 'responsible', 'role', 'company', 'position',
  'strong', 'excellent', 'good', 'knowledge', 'skills', 'skill',
  'years', 'year', 'months', 'month', 'proficient', 'familiar',
  'understanding', 'expertise', 'hands', 'based',
]);

// ─── Suffix Stemmer ────────────────────────────────────────────────────
// Simple rule-based suffix-stripping stemmer (no external dependencies)
function stem(word: string): string {
  if (word.length < 4) return word;

  // Common suffix replacements (Porter-lite)
  const rules: [RegExp, string][] = [
    [/ies$/, 'y'],
    [/ional$/, 'ion'],
    [/ation$/, 'ate'],
    [/ness$/, ''],
    [/ment$/, ''],
    [/ful$/, ''],
    [/less$/, ''],
    [/ously$/, 'ous'],
    [/ively$/, 'ive'],
    [/ling$/, ''],
    [/ating$/, 'ate'],
    [/ting$/, 't'],
    [/ing$/, ''],
    [/ies$/, 'y'],
    [/ied$/, 'y'],
    [/ely$/, 'e'],
    [/ally$/, 'al'],
    [/ity$/, ''],
    [/ous$/, ''],
    [/ive$/, ''],
    [/able$/, ''],
    [/ible$/, ''],
    [/ed$/, ''],
    [/er$/, ''],
    [/es$/, ''],
    [/s$/, ''],
  ];

  for (const [pattern, replacement] of rules) {
    if (pattern.test(word)) {
      const stemmed = word.replace(pattern, replacement);
      // Don't stem too aggressively — keep at least 3 chars
      if (stemmed.length >= 3) return stemmed;
    }
  }

  return word;
}

// ─── Tokenizer ─────────────────────────────────────────────────────────
/**
 * Tokenize, normalize, and stem text into an array of meaningful terms.
 * Handles multi-word tech terms (e.g., "machine learning", "next.js").
 */
function tokenize(text: string): string[] {
  if (!text) return [];

  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9\s.#+\-]/g, ' ')  // Keep dots, #, + for tech terms
    .replace(/\s+/g, ' ')
    .trim();

  // Split into raw tokens
  const raw = normalized.split(' ');

  const tokens: string[] = [];
  for (const token of raw) {
    // Clean trailing dots/dashes but preserve internal ones (e.g., "node.js", "c++")
    const cleaned = token.replace(/^[.\-]+|[.\-]+$/g, '');
    if (!cleaned || cleaned.length < 2) continue;

    // Skip stop words
    if (STOP_WORDS.has(cleaned)) continue;

    // Keep tech terms as-is (e.g., c#, c++, node.js, .net)
    if (/[.#+]/.test(cleaned)) {
      tokens.push(cleaned);
    } else {
      tokens.push(stem(cleaned));
    }
  }

  return tokens;
}

// ─── TF-IDF Math ───────────────────────────────────────────────────────

type SparseVector = Map<string, number>;

/**
 * Compute term frequency for a token array.
 * TF(t, d) = count(t in d) / |d|
 */
function computeTf(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const t of tokens) {
    freq.set(t, (freq.get(t) || 0) + 1);
  }

  const tf = new Map<string, number>();
  for (const [term, count] of freq) {
    tf.set(term, count / tokens.length);
  }
  return tf;
}

/**
 * Compute inverse document frequency across a corpus of documents.
 * IDF(t) = log((1 + N) / (1 + df(t))) + 1  where df = number of docs containing t (smoothed IDF)
 */
function computeIdf(documents: string[][]): Map<string, number> {
  const N = documents.length;
  const docFreq = new Map<string, number>();

  for (const doc of documents) {
    const unique = new Set(doc);
    for (const term of unique) {
      docFreq.set(term, (docFreq.get(term) || 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, df] of docFreq) {
    idf.set(term, Math.log((1 + N) / (1 + df)) + 1);
  }
  return idf;
}

/**
 * Build TF-IDF vector for a single document.
 */
function buildTfIdfVector(tokens: string[], idf: Map<string, number>): SparseVector {
  const tf = computeTf(tokens);
  const vec: SparseVector = new Map();

  for (const [term, tfVal] of tf) {
    const idfVal = idf.get(term) || 0;
    const tfidf = tfVal * idfVal;
    if (tfidf > 0) {
      vec.set(term, tfidf);
    }
  }
  return vec;
}

/**
 * Cosine similarity between two sparse vectors.
 * cos(A, B) = (A · B) / (|A| * |B|)
 */
function cosineSimilarity(vecA: SparseVector, vecB: SparseVector): number {
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const [term, valA] of vecA) {
    magA += valA * valA;
    const valB = vecB.get(term);
    if (valB !== undefined) {
      dotProduct += valA * valB;
    }
  }

  for (const [, valB] of vecB) {
    magB += valB * valB;
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

// ─── Public Service ────────────────────────────────────────────────────

export interface TfIdfMatchResult {
  ai_score: number;
  matched_skills: string[];
  missing_skills: string[];
  scoring_method: 'tfidf';
}

export class TfIdfMatcherService {
  /**
   * Score a candidate against a job using TF-IDF + Cosine Similarity.
   *
   * The algorithm:
   * 1. Builds a corpus from [resume, job description]
   * 2. Computes IDF weights across the corpus
   * 3. Generates TF-IDF vectors for both documents
   * 4. Calculates cosine similarity → raw score
   * 5. Boosts the score with exact skill matching
   * 6. Returns a blended 0–100 score
   */
  computeTfIdfScore(
    candidateSkills: string[],
    jobData: any,
    resumeText?: string,
  ): TfIdfMatchResult {
    const requiredSkills: string[] = jobData.required_skills || [];
    const jobDescription: string = jobData.description || '';
    const jobTitle: string = jobData.title || '';

    // Build the "resume document" from resume text + skills
    const resumeContent = [
      resumeText || '',
      candidateSkills.join(' '),
    ].join(' ');

    // Build the "job document" from title + description + required skills
    const jobContent = [
      jobTitle,
      jobDescription,
      requiredSkills.join(' '),
    ].join(' ');

    // Tokenize both documents
    const resumeTokens = tokenize(resumeContent);
    const jobTokens = tokenize(jobContent);

    // Edge case: if either is empty, fall through
    if (resumeTokens.length === 0 || jobTokens.length === 0) {
      return {
        ai_score: 0,
        matched_skills: [],
        missing_skills: requiredSkills,
        scoring_method: 'tfidf',
      };
    }

    // Compute IDF across the corpus of 2 documents
    const idf = computeIdf([resumeTokens, jobTokens]);

    // Build TF-IDF vectors
    const resumeVec = buildTfIdfVector(resumeTokens, idf);
    const jobVec = buildTfIdfVector(jobTokens, idf);

    // Calculate cosine similarity (0.0 – 1.0)
    const similarity = cosineSimilarity(resumeVec, jobVec);

    // ── Exact skill matching (provides the matched/missing lists) ──
    const skillsLower = candidateSkills.map(s => s.toLowerCase().trim());
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const skill of requiredSkills) {
      const skillLower = skill.toLowerCase().trim();
      const isMatched = skillsLower.some(s =>
        s === skillLower ||
        s.includes(skillLower) ||
        skillLower.includes(s)
      );
      if (isMatched) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }

    // ── Blend TF-IDF similarity (60%) + skill match ratio (40%) ──
    const skillMatchRatio = requiredSkills.length > 0
      ? matchedSkills.length / requiredSkills.length
      : 0.5; // neutral if no required skills specified

    const rawScore = (similarity * 0.6 + skillMatchRatio * 0.4) * 100;

    // Clamp to 0-100
    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    logger.info(
      `TF-IDF score: ${finalScore}% (cosine=${similarity.toFixed(3)}, skill_ratio=${skillMatchRatio.toFixed(2)}, matched=${matchedSkills.length}/${requiredSkills.length})`,
      { module: 'TF-IDF' }
    );

    return {
      ai_score: finalScore,
      matched_skills: matchedSkills,
      missing_skills: missingSkills,
      scoring_method: 'tfidf',
    };
  }
}

export const tfidfMatcherService = new TfIdfMatcherService();
