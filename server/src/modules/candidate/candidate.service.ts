import { candidateRepository } from './candidate.repository';
import { AppError } from '../../shared/errors/AppError';
import { resumeParserService } from './resume-parser.service';

export class CandidateService {
  async getProfile(candidateId: string) {
    const profile = await candidateRepository.findById(candidateId);
    if (!profile) throw new AppError('Candidate profile not found', 404);
    return {
      ...profile,
      ...(profile.preferences || {})
    };
  }

  async updateProfileStep(candidateId: string, step: number, data: any) {
    const profile = await this.getProfile(candidateId);

    // We only bump the step if they're progressing linearly
    let nextStep = profile.current_step;
    if (profile.current_step === step && step < 4) {
      nextStep = step + 1;
    }

    let updatedData: any = { ...data, current_step: nextStep };

    if (step === 2) {
      const { resume_drive_link, ...rest } = data;
      updatedData = {
        ...rest,
        current_step: nextStep,
        ...(resume_drive_link ? { resume_url: resume_drive_link } : {}),
        preferences: {
          ...(profile.preferences || {}),
          resume_drive_link
        }
      };
    } else if (step === 3) {
      const { leetcode_url, other_url, ...rest } = data;
      updatedData = {
        ...rest,
        current_step: nextStep,
        preferences: {
          ...(profile.preferences || {}),
          leetcode_url,
          other_url
        }
      };
    } else if (step === 4) {
      const {
        salary_min,
        salary_max,
        job_types,
        preferred_role,
        preferred_location,
        open_to_relocation,
        skills,
        ...rest
      } = data;

      updatedData = {
        ...rest,
        skills,
        preferences: {
          ...(profile.preferences || {}),
          salary_min,
          salary_max,
          job_types,
          preferred_role,
          preferred_location,
          open_to_relocation,
        },
        current_step: nextStep,
        onboarding_completed: true
      };
    }

    // Recalculate completeness
    const profileCompleteness = this.calculateCompleteness({
      ...profile,
      ...updatedData,
      preferences: { ...(profile.preferences || {}), ...(updatedData.preferences || {}) }
    });
    updatedData.profile_completion = profileCompleteness;

    return candidateRepository.updateProfile(candidateId, updatedData);
  }

  async updateProfile(candidateId: string, data: any) {
    const profile = await this.getProfile(candidateId);
    const updatedData = { ...data };

    // Recalculate completeness
    const profileCompleteness = this.calculateCompleteness({ ...profile, ...data });
    updatedData.profile_completion = profileCompleteness;

    return candidateRepository.updateProfile(candidateId, updatedData);
  }

  async uploadResume(candidateId: string, resumeUrl: string, filePath: string) {
    const profile = await this.getProfile(candidateId);
    const parsed = await resumeParserService.parsePdf(filePath).catch(() => null);
    const updatedData: any = { resume_url: resumeUrl };

    if (parsed) {
      if (parsed.resume_text) updatedData.resume_text = parsed.resume_text;
      if (parsed.resume_data) updatedData.resume_data = parsed.resume_data;
      if (parsed.experience) updatedData.experience = parsed.experience;
      if (parsed.summary && !profile.summary) updatedData.summary = parsed.summary;
      if (parsed.skills?.length && (!profile.skills || profile.skills.length === 0)) {
        updatedData.skills = parsed.skills;
      }
    }

    updatedData.profile_completion = this.calculateCompleteness({ ...profile, ...updatedData });
    updatedData.profile_strength_score = updatedData.profile_completion;

    return candidateRepository.updateProfile(candidateId, updatedData);
  }

  async deleteResume(candidateId: string) {
    // In a real app, delete from storage here
    return candidateRepository.updateProfile(candidateId, { resume_url: null });
  }

  calculateCompleteness(profile: any): number {
    let score = 0;
    if (profile.name) score += 10;
    if (profile.phone) score += 10;
    if (profile.location) score += 5;
    if (profile.resume_url || profile.resume_drive_link) score += 20;
    if (profile.summary) score += 10;
    if (profile.skills && profile.skills.length > 0) score += 15;
    if (profile.linkedin_url || profile.github_url || profile.portfolio_url) score += 10;
    if (profile.preferences && Object.keys(profile.preferences).length > 0) score += 20;

    return Math.min(100, score);
  }

  async getDashboard(candidateId: string) {
    const profile = await this.getProfile(candidateId);
    const recentApplications = await candidateRepository.getRecentApplications(candidateId);
    const upcomingInterviews = await candidateRepository.getUpcomingInterviews(candidateId);
    const recommendedJobs = await candidateRepository.getRecommendedJobs(profile.skills || []);
    const stats = await candidateRepository.getStats(candidateId);

    return {
      profileCompletion: profile.profile_completion,
      recentApplications,
      upcomingInterviews,
      recommendedJobs,
      stats,
    };
  }

  async getApplications(candidateId: string, query: any) {
    return candidateRepository.getApplications(candidateId, query);
  }

  async getApplicationById(candidateId: string, applicationId: string) {
    const app = await candidateRepository.getApplicationById(candidateId, applicationId);
    if (!app) throw new AppError('Application not found', 404);
    return app;
  }

  async withdrawApplication(candidateId: string, applicationId: string) {
    const updated = await candidateRepository.withdrawApplication(candidateId, applicationId);
    if (!updated || updated.length === 0) {
      throw new AppError('Cannot withdraw application in its current state', 400);
    }
    return updated[0];
  }

  async getInterviews(candidateId: string, query: any) {
    return candidateRepository.getInterviews(candidateId, query);
  }

  async getCompanyCandidates(companyId: string, query: any) {
    return candidateRepository.getCompanyCandidates(companyId, query);
  }
}

export const candidateService = new CandidateService();
