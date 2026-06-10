import { resumeParserService } from '../modules/candidate/resume-parser.service';
import { env } from '../config/env';
import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    env.GEMINI_API_KEY = originalGeminiKey;
  });

  describe('Local Rule-Based Parsing (Fallback)', () => {
    it('should extract text from PDF and parse skills, experience, and education locally when Gemini is disabled', async () => {
      // Disable Gemini to force local parsing fallback
      env.GEMINI_API_KEY = '';

      (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('%PDF-1.4 mock'));

      const result = await resumeParserService.parsePdf('resume.pdf');

      expect(result).not.toBeNull();
      if (result) {
        // Verify skills extraction
        expect(result.skills).toBeDefined();
        expect(result.skills).toContain('React');
        expect(result.skills).toContain('node.js');
        expect(result.skills).toContain('Typescript');
        expect(result.skills).toContain('Docker');
        expect(result.skills).toContain('Postgresql');

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
