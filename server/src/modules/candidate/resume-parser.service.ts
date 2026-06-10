import axios from 'axios';
import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import { env } from '../../config/env';
import { logger } from '../../shared/utils/logger';

export interface ParsedResume {
  summary?: string;
  skills?: string[];
  resume_text?: string;
  experience?: any[];
  education?: any[];
  projects?: any[];
  certifications?: any[];
  resume_data?: Record<string, any>;
}

// ─── JSON Block Parser ─────────────────────────────────────────────────
const parseJsonBlock = (text: string): ParsedResume => {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return {};
  return JSON.parse(cleaned.slice(start, end + 1));
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Comprehensive Tech Skills Dictionary ───────────────────────────────
// Organized by category for better matching accuracy
const SKILL_DICTIONARY: Record<string, string[]> = {
  languages: [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'c',
    'ruby', 'go', 'golang', 'rust', 'swift', 'kotlin', 'scala', 'php',
    'perl', 'r', 'matlab', 'dart', 'lua', 'elixir', 'clojure',
    'haskell', 'objective-c', 'assembly', 'fortran', 'cobol',
    'visual basic', 'vb.net', 'f#', 'groovy', 'julia',
  ],
  frontend: [
    'react', 'reactjs', 'react.js', 'angular', 'angularjs', 'vue',
    'vuejs', 'vue.js', 'svelte', 'next.js', 'nextjs', 'nuxt',
    'nuxt.js', 'gatsby', 'remix', 'html', 'html5', 'css', 'css3',
    'sass', 'scss', 'less', 'tailwind', 'tailwindcss', 'bootstrap',
    'material ui', 'mui', 'chakra ui', 'ant design', 'styled-components',
    'emotion', 'webpack', 'vite', 'rollup', 'parcel', 'babel',
    'jquery', 'redux', 'mobx', 'zustand', 'recoil', 'pinia',
    'storybook', 'figma', 'framer motion', 'three.js', 'gsap',
    'pwa', 'webgl', 'web components', 'shadow dom',
  ],
  backend: [
    'node', 'nodejs', 'node.js', 'express', 'expressjs', 'express.js',
    'fastify', 'nestjs', 'nest.js', 'koa', 'hapi', 'django',
    'flask', 'fastapi', 'spring', 'spring boot', 'springboot',
    'rails', 'ruby on rails', 'laravel', 'symfony', 'asp.net',
    '.net', 'dotnet', '.net core', 'gin', 'echo', 'fiber',
    'actix', 'rocket', 'phoenix', 'ktor',
  ],
  databases: [
    'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'mongo',
    'redis', 'elasticsearch', 'sqlite', 'mariadb', 'oracle',
    'sql server', 'mssql', 'dynamodb', 'cassandra', 'couchdb',
    'couchbase', 'neo4j', 'firebase', 'firestore', 'supabase',
    'prisma', 'sequelize', 'typeorm', 'knex', 'mongoose',
    'drizzle', 'cockroachdb', 'influxdb', 'memcached',
  ],
  cloud: [
    'aws', 'amazon web services', 'azure', 'gcp',
    'google cloud', 'google cloud platform', 'heroku',
    'vercel', 'netlify', 'digitalocean', 'linode', 'cloudflare',
    'ec2', 's3', 'lambda', 'ecs', 'eks', 'fargate', 'rds',
    'sqs', 'sns', 'cloudwatch', 'cloudfront', 'route53',
    'api gateway', 'iam', 'cognito', 'amplify',
    'azure devops', 'azure functions', 'app service',
    'cloud functions', 'cloud run', 'cloud storage', 'bigquery',
  ],
  devops: [
    'docker', 'kubernetes', 'k8s', 'terraform', 'ansible',
    'puppet', 'chef', 'vagrant', 'jenkins', 'circleci',
    'travis ci', 'github actions', 'gitlab ci', 'bitbucket pipelines',
    'argocd', 'helm', 'istio', 'prometheus', 'grafana',
    'datadog', 'new relic', 'splunk', 'elk stack', 'logstash',
    'kibana', 'fluentd', 'nginx', 'apache', 'caddy',
    'load balancer', 'ci/cd', 'ci cd', 'continuous integration',
    'continuous deployment', 'infrastructure as code', 'iac',
  ],
  mobile: [
    'react native', 'flutter', 'ionic', 'xamarin',
    'swift ui', 'swiftui', 'jetpack compose', 'android',
    'ios', 'cordova', 'capacitor', 'expo',
  ],
  data: [
    'machine learning', 'ml', 'deep learning', 'dl',
    'artificial intelligence', 'ai', 'data science',
    'data engineering', 'data analytics', 'data visualization',
    'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn',
    'pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn',
    'tableau', 'power bi', 'jupyter', 'spark', 'hadoop',
    'airflow', 'kafka', 'flink', 'dbt',
    'nlp', 'natural language processing', 'computer vision',
    'opencv', 'llm', 'large language model', 'langchain',
    'hugging face', 'transformers', 'bert', 'gpt',
    'rag', 'vector database', 'pinecone', 'weaviate', 'chromadb',
  ],
  testing: [
    'jest', 'mocha', 'chai', 'jasmine', 'cypress', 'selenium',
    'playwright', 'puppeteer', 'testing library',
    'react testing library', 'enzyme', 'vitest',
    'junit', 'pytest', 'rspec', 'minitest',
    'tdd', 'bdd', 'unit testing', 'integration testing',
    'e2e testing', 'end to end testing', 'load testing',
    'performance testing', 'postman', 'insomnia', 'supertest',
  ],
  tools: [
    'git', 'github', 'gitlab', 'bitbucket', 'svn',
    'jira', 'confluence', 'trello', 'asana', 'notion',
    'slack', 'teams', 'vscode', 'vim', 'intellij',
    'linux', 'unix', 'bash', 'shell', 'powershell',
    'agile', 'scrum', 'kanban', 'waterfall',
    'rest', 'restful', 'graphql', 'grpc', 'websocket',
    'soap', 'microservices', 'monolith', 'serverless',
    'oauth', 'jwt', 'saml', 'sso', 'openid',
    'rabbitmq', 'celery', 'bull', 'sidekiq',
    'stripe', 'twilio', 'sendgrid', 'mailgun',
  ],
};

// Flatten dictionary into a searchable set
const ALL_SKILLS: string[] = Object.values(SKILL_DICTIONARY).flat();

// ─── Section Headers (regex patterns) ───────────────────────────────────
const SECTION_PATTERNS: Record<string, RegExp> = {
  experience: /\b(experience|work\s*history|employment|professional\s*experience|work\s*experience)\b/i,
  education: /\b(education|academic|qualifications?)\b/i,
  projects: /\b(projects|personal\s*projects|side\s*projects|portfolio)\b/i,
  skills: /\b(skills|technical\s*skills|technologies|tech\s*stack|competencies|tools\s*&?\s*technologies|core\s*competencies)\b/i,
  certifications: /\b(certifications?|certificates?|credentials?|accreditations?|licenses?)\b/i,
  summary: /\b(summary|objective|profile|about\s*me|professional\s*summary|career\s*objective|overview)\b/i,
};

// ─── Local Parsing Engine ───────────────────────────────────────────────

/**
 * Extract raw text from a PDF file using pdf-parse (pure JS, no API needed).
 */
async function extractTextFromPdf(filePath: string): Promise<string | null> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: fileBuffer });
    const data = await parser.getText();
    const text = (data.text || '').trim();
    if (text.length < 20) {
      logger.warn('[ResumeParser] PDF text extraction returned very little text', { module: 'ResumeParser', length: text.length });
      return null;
    }
    logger.info(`[ResumeParser] Local PDF text extraction: ${text.length} chars`, { module: 'ResumeParser' });
    return text;
  } catch (err: any) {
    logger.error('[ResumeParser] pdf-parse extraction failed', { module: 'ResumeParser', error: err?.message });
    return null;
  }
}

/**
 * Extract skills from resume text by matching against a comprehensive dictionary.
 * Uses word-boundary matching and multi-word term detection.
 */
function extractSkillsFromText(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found = new Set<string>();

  for (const skill of ALL_SKILLS) {
    // For short skills (1-2 chars like "c", "r"), require exact word boundary
    if (skill.length <= 2) {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerText)) {
        found.add(skill);
      }
    } else {
      // For longer skills, check for substring presence (handles multi-word terms)
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[\\s,;|/()\\[\\]])${escaped}(?:$|[\\s,;|/()\\[\\]])`, 'i');
      if (regex.test(lowerText)) {
        found.add(skill);
      }
    }
  }

  // Normalize: capitalize first letter of each skill for display
  return Array.from(found).map(s => {
    if (/^[a-z]/.test(s) && !s.includes('.') && !s.includes('#') && !s.includes('+')) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    return s;
  }).slice(0, 40);
}

/**
 * Split resume text into named sections based on common resume headings.
 */
function extractSections(text: string): Record<string, string> {
  const lines = text.split('\n');
  const sections: Record<string, string> = {};
  let currentSection = 'header';
  let currentContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this line is a section header
    let matchedSection: string | null = null;
    for (const [name, pattern] of Object.entries(SECTION_PATTERNS)) {
      // Section headers are typically short lines (< 45 chars) that match a pattern
      if (trimmed.length < 45 && pattern.test(trimmed)) {
        matchedSection = name;
        break;
      }
    }

    if (matchedSection) {
      // Save previous section
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = matchedSection;
      currentContent = [];
    } else {
      currentContent.push(trimmed);
    }
  }

  // Save last section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return sections;
}

/**
 * Extract experience entries from the experience section text.
 * Attempts to parse company names, titles, and durations.
 */
function parseExperienceSection(text: string): any[] {
  if (!text) return [];
  
  const entries: any[] = [];
  const lines = text.split('\n');
  let current: any = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect date ranges like "Jan 2020 - Present", "2019-2022", "2020 – 2023"
    const datePattern = /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}\s*[-–—]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}\s*[-–—]\s*present|\d{4}\s*[-–—]\s*\d{4}|\d{4}\s*[-–—]\s*present)/i;
    
    const dateMatch = trimmed.match(datePattern);
    if (dateMatch) {
      // If we have a previous entry, save it
      if (current.title || current.company) {
        entries.push({ ...current });
      }
      current = { duration: dateMatch[0].trim() };
      
      // The rest of the line might contain title/company
      const rest = trimmed.replace(dateMatch[0], '').trim().replace(/^[-–—|,]+|[-–—|,]+$/g, '').trim();
      if (rest) {
        // Try to split by common separators (at, -, |)
        const parts = rest.split(/\s+(?:at|@|-|–|—|\|)\s+/i);
        if (parts.length >= 2) {
          current.title = parts[0].trim();
          current.company = parts[1].trim();
        } else {
          current.title = rest;
        }
      }
    } else if (!current.title) {
      // First non-date line might be title or company
      const parts = trimmed.split(/\s+(?:at|@|-|–|—|\|)\s+/i);
      if (parts.length >= 2) {
        current.title = parts[0].trim();
        current.company = parts[1].trim();
      } else {
        current.title = trimmed;
      }
    } else if (!current.company) {
      current.company = trimmed;
    } else {
      // Description lines
      current.description = (current.description || '') + trimmed + ' ';
    }
  }

  // Don't forget the last entry
  if (current.title || current.company) {
    entries.push(current);
  }

  return entries.slice(0, 10); // Cap at 10 entries
}

/**
 * Extract education entries from the education section text.
 */
function parseEducationSection(text: string): any[] {
  if (!text) return [];
  
  const entries: any[] = [];
  const lines = text.split('\n');
  let current: any = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Look for degree patterns
    const degreePattern = /\b(b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|b\.?e\.?|m\.?e\.?|b\.?tech|m\.?tech|ph\.?d|mba|bba|bca|mca|bachelor|master|associate|diploma)\b/i;
    const yearPattern = /\b(19|20)\d{2}\b/;

    if (degreePattern.test(trimmed) || yearPattern.test(trimmed)) {
      if (current.institution || current.degree) {
        entries.push({ ...current });
        current = {};
      }
      
      const yearMatch = trimmed.match(yearPattern);
      if (yearMatch) {
        current.year = yearMatch[0];
      }

      if (degreePattern.test(trimmed)) {
        // Try to split by common separators (at, @, -, –, —, |, comma)
        const parts = trimmed.split(/\s+(?:at|@|-|–|—|\||,)\s+/i);
        if (parts.length >= 2) {
          current.degree = parts[0].trim();
          current.institution = parts.slice(1).join(' ').trim();
        } else {
          current.degree = trimmed;
        }
      } else {
        current.institution = trimmed;
      }

      // Clean up the year and parentheses from the institution/degree name if present
      if (current.institution && yearMatch) {
        current.institution = current.institution
          .replace(yearMatch[0], '')
          .replace(/\(\s*\)/g, '')
          .trim()
          .replace(/^[-–—|,]+|[-–—|,]+$/g, '')
          .trim();
      }
      if (current.degree && yearMatch) {
        current.degree = current.degree
          .replace(yearMatch[0], '')
          .replace(/\(\s*\)/g, '')
          .trim()
          .replace(/^[-–—|,]+|[-–—|,]+$/g, '')
          .trim();
      }
    } else if (!current.institution) {
      current.institution = trimmed;
    }
  }

  if (current.institution || current.degree) {
    entries.push(current);
  }

  return entries.slice(0, 5);
}

/**
 * Generate a summary from the header section or first few meaningful lines.
 */
function extractSummary(sections: Record<string, string>, fullText: string): string {
  // First try the explicit summary section
  if (sections.summary) {
    return sections.summary.slice(0, 1000);
  }

  // Fall back to header section (usually contains name + brief intro)
  if (sections.header) {
    return sections.header.slice(0, 500);
  }

  // Last resort: first 500 chars of the full text
  return fullText.slice(0, 500);
}

/**
 * Full local parsing pipeline — no API calls needed.
 * Extracts skills, sections, experience, education, and summary.
 */
function parseLocally(resumeText: string): ParsedResume {
  logger.info('[ResumeParser] Using local rule-based parsing engine', { module: 'ResumeParser' });

  const skills = extractSkillsFromText(resumeText);
  const sections = extractSections(resumeText);
  const experience = parseExperienceSection(sections.experience || '');
  const education = parseEducationSection(sections.education || '');
  const summary = extractSummary(sections, resumeText);

  // Extract projects section as simple text entries
  const projects: any[] = [];
  if (sections.projects) {
    const projectLines = sections.projects.split('\n').filter(l => l.trim());
    let current: any = {};
    for (const line of projectLines) {
      if (line.match(/^[A-Z•●▪►\-\*]/) && current.name) {
        projects.push(current);
        current = { name: line.replace(/^[•●▪►\-\*]\s*/, '').trim() };
      } else if (!current.name) {
        current.name = line.replace(/^[•●▪►\-\*]\s*/, '').trim();
      } else {
        current.description = (current.description || '') + line + ' ';
      }
    }
    if (current.name) projects.push(current);
  }

  // Extract certifications
  const certifications: string[] = [];
  if (sections.certifications) {
    const certLines = sections.certifications.split('\n').filter(l => l.trim().length > 3);
    certLines.forEach(l => certifications.push(l.replace(/^[•●▪►\-\*]\s*/, '').trim()));
  }

  const parsed: ParsedResume = {
    summary: typeof summary === 'string' ? summary.slice(0, 1000) : undefined,
    skills: skills.length > 0 ? skills : undefined,
    resume_text: resumeText.slice(0, 3000),
    experience: experience.length > 0 ? experience : undefined,
    education: education.length > 0 ? education : undefined,
    projects: projects.length > 0 ? projects.slice(0, 10) : undefined,
    certifications: certifications.length > 0 ? certifications.slice(0, 10) : undefined,
  };

  parsed.resume_data = { ...parsed };

  logger.info(`[ResumeParser] Local parse complete: ${skills.length} skills, ${experience.length} exp, ${education.length} edu`, { module: 'ResumeParser' });

  return parsed;
}


// ─── Public Service ─────────────────────────────────────────────────────

export class ResumeParserService {
  /**
   * Parse a PDF resume with a multi-tier strategy:
   *
   *  1. Extract raw text locally via pdf-parse (always runs first).
   *  2. Try Gemini AI with the extracted TEXT (not the heavy binary).
   *     This is much lighter, faster, and far less likely to hit 429s.
   *  3. If Gemini fails for any reason, fall back to local rule-based
   *     parsing which runs entirely in-process with zero API calls.
   *
   * This guarantees that resume parsing NEVER fails — even if every
   * external API is down, the candidate still gets skills extracted
   * and a non-zero ATS score.
   */
  async parsePdf(filePath: string): Promise<ParsedResume | null> {
    // ── Step 1: Local text extraction (always) ──────────────────────
    const resumeText = await extractTextFromPdf(filePath);

    if (!resumeText) {
      // If we can't even extract text from the PDF, try Gemini with binary as last resort
      logger.warn('[ResumeParser] Local text extraction failed, attempting Gemini binary parse', { module: 'ResumeParser' });
      return this.parseWithGeminiBinary(filePath);
    }

    // ── Step 2: Try Gemini with extracted text (lightweight) ────────
    if (env.GEMINI_API_KEY) {
      const geminiResult = await this.parseWithGeminiText(resumeText);
      if (geminiResult) {
        // Ensure resume_text is always populated
        if (!geminiResult.resume_text) {
          geminiResult.resume_text = resumeText.slice(0, 3000);
        }
        return geminiResult;
      }
    }

    // ── Step 3: Local rule-based fallback (always works) ────────────
    return parseLocally(resumeText);
  }

  /**
   * Parse resume using Gemini with pre-extracted TEXT (not binary PDF).
   * This is significantly cheaper in token cost and much less likely
   * to trigger rate limits compared to sending the raw PDF.
   */
  private async parseWithGeminiText(resumeText: string, maxRetries = 2): Promise<ParsedResume | null> {
    // Trim text to avoid token bloat
    const snippet = resumeText.slice(0, 4000);

    const prompt = `Parse this resume text and return ONLY valid JSON (no markdown, no explanation). Use these exact keys: summary (string), skills (array of strings), resume_text (short extracted text), experience (array of {company, title, duration, description}), education (array), projects (array), certifications (array). Keep skills as individual technologies/tools, max 40 items.

RESUME TEXT:
${snippet}`;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`,
          {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1 },
          },
          {
            params: { key: env.GEMINI_API_KEY },
            timeout: 20000,
          }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          logger.warn('[ResumeParser] Gemini text-parse returned empty response', { module: 'ResumeParser' });
          return null;
        }

        let parsed: ParsedResume;
        try {
          parsed = parseJsonBlock(text);
        } catch (parseErr) {
          logger.error('[ResumeParser] Failed to parse Gemini JSON from text-parse', { module: 'ResumeParser' });
          return null;
        }

        logger.info('[ResumeParser] Gemini text-parse successful', { module: 'ResumeParser' });

        return {
          summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 1000) : undefined,
          skills: Array.isArray(parsed.skills)
            ? parsed.skills.map(s => String(s).trim()).filter(Boolean).slice(0, 40)
            : undefined,
          resume_text: typeof parsed.resume_text === 'string' ? parsed.resume_text : resumeText.slice(0, 3000),
          experience: Array.isArray(parsed.experience) ? parsed.experience : undefined,
          education: Array.isArray(parsed.education) ? parsed.education : undefined,
          projects: Array.isArray(parsed.projects) ? parsed.projects : undefined,
          certifications: Array.isArray(parsed.certifications) ? parsed.certifications : undefined,
          resume_data: parsed,
        };
      } catch (err: any) {
        const status = err?.response?.status;

        if (status === 429 && attempt <= maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.warn(`[ResumeParser] Gemini rate limit (text-parse). Attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`, { module: 'ResumeParser' });
          await sleep(delay);
          continue;
        }

        if (status === 429) {
          logger.warn('[ResumeParser] Gemini rate limited — falling back to local parse', { module: 'ResumeParser' });
          return null; // Caller will use local fallback
        }

        logger.warn('[ResumeParser] Gemini text-parse error, falling back to local', { module: 'ResumeParser', status, message: err?.message });
        return null;
      }
    }

    return null;
  }

  /**
   * Legacy: Parse with Gemini using the raw binary PDF.
   * Only used when local text extraction fails (e.g., scanned/image PDFs).
   */
  private async parseWithGeminiBinary(filePath: string, maxRetries = 2): Promise<ParsedResume | null> {
    if (!env.GEMINI_API_KEY) {
      logger.warn('[ResumeParser] GEMINI_API_KEY not set — skipping binary parse', { module: 'ResumeParser' });
      return null;
    }

    let file: Buffer;
    try {
      file = await fs.readFile(filePath);
    } catch (err) {
      logger.error('[ResumeParser] Failed to read resume file for binary parse', { module: 'ResumeParser' });
      return null;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`,
          {
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: 'Parse this resume PDF and return ONLY valid JSON (no markdown, no explanation). Use these exact keys: summary (string), skills (array of strings), resume_text (short extracted text), experience (array of {company, title, duration, description}), education (array), projects (array), certifications (array). Keep skills as individual technologies/tools, max 40 items.',
                  },
                  {
                    inlineData: {
                      mimeType: 'application/pdf',
                      data: file.toString('base64'),
                    },
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0.1 },
          },
          {
            params: { key: env.GEMINI_API_KEY },
            timeout: 30000,
          }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return null;

        let parsed: ParsedResume;
        try {
          parsed = parseJsonBlock(text);
        } catch {
          return null;
        }

        return {
          summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 1000) : undefined,
          skills: Array.isArray(parsed.skills)
            ? parsed.skills.map(s => String(s).trim()).filter(Boolean).slice(0, 40)
            : undefined,
          resume_text: typeof parsed.resume_text === 'string' ? parsed.resume_text : undefined,
          experience: Array.isArray(parsed.experience) ? parsed.experience : undefined,
          education: Array.isArray(parsed.education) ? parsed.education : undefined,
          projects: Array.isArray(parsed.projects) ? parsed.projects : undefined,
          certifications: Array.isArray(parsed.certifications) ? parsed.certifications : undefined,
          resume_data: parsed,
        };
      } catch (err: any) {
        const status = err?.response?.status;

        if (status === 429 && attempt < maxRetries) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        }

        logger.warn('[ResumeParser] Gemini binary-parse failed', { module: 'ResumeParser', status, message: err?.message });
        return null;
      }
    }

    return null;
  }
}

export const resumeParserService = new ResumeParserService();
