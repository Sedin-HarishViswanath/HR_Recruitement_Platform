import { db } from '../../config/db';

export class AtsScreeningService {
  /**
   * Simple keyword matching algorithm for resume screening
   * @param candidateSkills Array of candidate skills
   * @param jobData Job object with title, description, and required_skills
   * @returns { ai_score: number, matched_skills: string[] }
   */
  async screenResume(candidateSkills: string[], jobData: any) {
    const requiredSkills = jobData.required_skills || [];
    const jobDescription = (jobData.description || '').toLowerCase();
    const jobTitle = (jobData.title || '').toLowerCase();

    if (requiredSkills.length === 0 && !jobDescription) {
      return { ai_score: 50, matched_skills: [] };
    }

    // 1. Skill Matching (60% weight)
    const matchedSkills: string[] = [];
    requiredSkills.forEach((skill: string) => {
      const skillLower = skill.toLowerCase();
      // Check if candidate has the skill in their profile
      if (candidateSkills.some(s => s.toLowerCase() === skillLower)) {
        matchedSkills.push(skill);
      }
    });

    const skillScore = requiredSkills.length > 0 
      ? (matchedSkills.length / requiredSkills.length) * 60 
      : 30; // Default partial credit if no required skills listed

    // 2. Keyword matching in description (40% weight)
    // We'll use candidate's skills as keywords to check against description
    let keywordMatches = 0;
    candidateSkills.forEach(skill => {
      if (jobDescription.includes(skill.toLowerCase())) {
        keywordMatches++;
      }
    });

    const keywordScore = candidateSkills.length > 0
      ? Math.min((keywordMatches / Math.max(candidateSkills.length, 5)) * 40, 40)
      : 0;

    // 3. Title match bonus (up to 10 points)
    let titleBonus = 0;
    candidateSkills.forEach(skill => {
      if (jobTitle.includes(skill.toLowerCase())) {
        titleBonus += 2;
      }
    });
    titleBonus = Math.min(titleBonus, 10);

    const totalScore = Math.min(Math.round(skillScore + keywordScore + titleBonus), 100);

    return {
      ai_score: totalScore,
      matched_skills: matchedSkills
    };
  }
}

export const atsScreeningService = new AtsScreeningService();
