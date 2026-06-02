import { Request, Response } from 'express';
import { jobService } from './job.service';
import { createJobSchema, updateJobSchema, changeJobStatusSchema } from './job.schema';
import { sendResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/AppError';
import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../shared/utils/logger';

export class JobController {
  async createJob(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const createdById = req.user.userId;
      
      const parsed = createJobSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten() });

      const job = await jobService.createJob(companyId!, createdById!, parsed.data);
      return sendResponse(res, 201, true, 'Job created successfully', job);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async getCompanyJobs(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const result = await jobService.getCompanyJobs(companyId!, req.query);
      return sendResponse(res, 200, true, 'Jobs retrieved successfully', result);
    } catch (error: any) {
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async getJobDetail(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const { id } = req.params;
      const job = await jobService.getJobDetail(id as string, companyId!);
      return sendResponse(res, 200, true, 'Job details retrieved', job);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async updateJob(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const { id } = req.params;
      
      const parsed = updateJobSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten() });

      const job = await jobService.updateJob(id as string, companyId!, parsed.data);
      return sendResponse(res, 200, true, 'Job updated successfully', job);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async changeJobStatus(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const { id } = req.params;
      
      const parsed = changeJobStatusSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten() });

      const job = await jobService.changeJobStatus(id as string, companyId!, parsed.data.status);
      return sendResponse(res, 200, true, 'Job status updated successfully', job);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async deleteJob(req: Request, res: Response) {
    try {
      const companyId = req.user.companyId;
      const { id } = req.params;
      await jobService.deleteJob(id as string, companyId!);
      return sendResponse(res, 200, true, 'Job deleted successfully');
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  // PUBLIC / CANDIDATE METHODS
  async getPublicJobs(req: Request, res: Response) {
    try {
      const candidateId = req.user?.role === 'Candidate' ? (req.user.candidateId || req.user.userId) : undefined;
      const result = await jobService.getPublicJobs(req.query, candidateId);
      return sendResponse(res, 200, true, 'Public jobs retrieved successfully', result);
    } catch (error: any) {
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async getPublicJobDetail(req: Request, res: Response) {
    try {
      const candidateId = req.user?.role === 'Candidate' ? (req.user.candidateId || req.user.userId) : undefined;
      const { id } = req.params;
      const job = await jobService.getPublicJobDetail(id as string, candidateId);
      return sendResponse(res, 200, true, 'Job details retrieved successfully', job);
    } catch (error: any) {
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 500, false, 'Internal server error');
    }
  }

  async generateDescription(req: Request, res: Response) {
    try {
      const { title, department, experience_level, employment_type, location, skills } = req.body;

      if (!title || title.trim().length < 3) {
        return sendResponse(res, 400, false, 'Job title is required to generate a description');
      }

      if (!env.GEMINI_API_KEY) {
        return sendResponse(res, 503, false, 'AI description generation requires a Gemini API key');
      }

      const prompt = `You are an expert technical recruiter writing a compelling job posting.

Generate a job description for the following role:
- Title: ${title}
- Department: ${department || 'Not specified'}
- Experience Level: ${experience_level || 'mid'}
- Employment Type: ${(employment_type || 'full_time').replace('_', '-')}
- Location: ${location || 'Not specified'}
- Skills: ${Array.isArray(skills) && skills.length > 0 ? skills.join(', ') : 'Not specified'}

Respond ONLY with valid JSON in this exact format:
{
  "description": "<professional job description, 200-350 words, with sections: About the Role, Responsibilities (4-5 bullets), Requirements (4-5 bullets), Nice to Have (2-3 bullets), What We Offer (2-3 bullets). Use markdown bullet points (-) for lists.>",
  "suggested_skills": ["<skill 1>", "<skill 2>", "<skill 3>", "<skill 4>", "<skill 5>"],
  "salary_min": <integer USD annual, realistic for the role and level>,
  "salary_max": <integer USD annual, 20-40% above min>
}`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`,
        {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
        },
        { params: { key: env.GEMINI_API_KEY }, timeout: 20000 }
      );

      const text: string = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');

      if (start === -1 || end === -1) throw new AppError('AI returned invalid response', 502);

      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      logger.info(`AI job description generated for: ${title}`, { module: 'Job' });

      return sendResponse(res, 200, true, 'Job description generated', {
        description: parsed.description || '',
        suggested_skills: Array.isArray(parsed.suggested_skills) ? parsed.suggested_skills : [],
        salary_min: Number(parsed.salary_min) || undefined,
        salary_max: Number(parsed.salary_max) || undefined,
      });
    } catch (error: any) {
      logger.error('Failed to generate job description', { module: 'Job', err: error?.message });
      if (error instanceof AppError) return sendResponse(res, error.statusCode, false, error.message);
      return sendResponse(res, 502, false, 'Failed to generate job description. Please try again.');
    }
  }
}

export const jobController = new JobController();
