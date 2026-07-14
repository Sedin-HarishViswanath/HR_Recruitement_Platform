import { resumeParserService } from '../modules/candidate/resume-parser.service';
import { env } from '../config/env';

// Mock pdf-parse
jest.mock('pdf-parse', () => {
  return {
    PDFParse: jest.fn().mockImplementation(() => {
      return {
        getText: jest.fn().mockResolvedValue({
          text: `
John Doe
john.doe@email.com

Summary
Passionate software engineer with experience building web applications.

Skills
React, Node.js, TypeScript, Docker, PostgreSQL, AWS

Experience
Software Engineer at Acme Corp | Jan 2020 - Present
- Built scaling microservices using Node.js and TypeScript.
- Deployed containers with Docker.

Education
B.S. in Computer Science - Stanford University (2019)
          `
        })
      };
    })
  };
});

describe('ResumeParserService', () => {
  const originalGeminiKey = env.GEMINI_API_KEY;
  const originalGroqKey = env.GROQ_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    env.GEMINI_API_KEY = originalGeminiKey;
    env.GROQ_API_KEY = originalGroqKey;
  });

  describe('Local Rule-Based Parsing (Fallback)', () => {
    it('should extract text from PDF and parse skills, experience, and education locally when AI is disabled', async () => {
      // Disable both AI providers to force local parsing fallback
      env.GEMINI_API_KEY = '';
      env.GROQ_API_KEY = '';

      const result = await resumeParserService.parsePdf(Buffer.from('%PDF-1.4 mock'));

      expect(result).not.toBeNull();
      if (result) {
        // Verify skills extraction. The local parser normalizes casing
        // idiosyncratically (e.g. "node.js", "Typescript"), so assert on the
        // set of skills case-insensitively rather than exact strings.
        expect(result.skills).toBeDefined();
        const skillsLower = (result.skills || []).map((s) => s.toLowerCase());
        expect(skillsLower).toContain('react');
        expect(skillsLower).toContain('node.js');
        expect(skillsLower).toContain('typescript');
        expect(skillsLower).toContain('docker');
        expect(skillsLower).toContain('postgresql');

        // Verify summary
        expect(result.summary).toContain('Passionate software engineer');

        // Verify experience
        expect(result.experience).toBeDefined();
        expect(result.experience?.length).toBeGreaterThan(0);
        expect(result.experience?.[0].title).toContain('Software Engineer');
        expect(result.experience?.[0].company).toContain('Acme Corp');
        expect(result.experience?.[0].duration).toBe('Jan 2020 - Present');

        // Verify education
        expect(result.education).toBeDefined();
        expect(result.education?.length).toBeGreaterThan(0);
        expect(result.education?.[0].degree).toContain('B.S. in Computer Science');
        expect(result.education?.[0].institution).toContain('Stanford University');
      }
    });
  });
});
