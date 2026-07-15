import { db } from '../../config/db';

export class AnalyticsService {
  async getCompanyAnalytics(companyId: string, query: any) {
    const { job_id, date_from, date_to } = query;

    // 1. KPI Cards
    const totalJobs = await db('jobs').where({ company_id: companyId, deleted_at: null }).count('* as count');
    
    let appsQuery = db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('jobs.company_id', companyId);
    
    if (job_id) appsQuery = appsQuery.where('applications.job_id', job_id);
    if (date_from) appsQuery = appsQuery.where('applications.applied_at', '>=', date_from);
    if (date_to) appsQuery = appsQuery.where('applications.applied_at', '<=', date_to);

    const totalApps = await appsQuery.clone().count('* as count');
    
    const activeCandidates = await appsQuery.clone()
      .whereNotIn('applications.status', ['hired', 'rejected', 'withdrawn'])
      .countDistinct('candidate_id as count');

    const hiredCount = await appsQuery.clone().where('applications.status', 'hired').count('* as count');

    // 2. Pipeline Funnel
    const funnel = await appsQuery.clone()
      .select('applications.status')
      .count('* as count')
      .groupBy('applications.status');

    // 3. Applications Over Time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const overTime = await appsQuery.clone()
      .select(db.raw('DATE(applied_at) as date'))
      .count('* as count')
      .where('applied_at', '>=', thirtyDaysAgo)
      .groupBy(db.raw('DATE(applied_at)'))
      .orderBy('date', 'asc');

    return {
      kpis: {
        totalJobs: parseInt(totalJobs[0].count as string),
        totalApplications: parseInt(totalApps[0].count as string),
        activeCandidates: parseInt(activeCandidates[0].count as string),
        hiredCount: parseInt(hiredCount[0].count as string),
        hireRate: totalApps[0].count ? ((parseInt(hiredCount[0].count as string) / parseInt(totalApps[0].count as string)) * 100).toFixed(1) : 0
      },
      funnel,
      overTime
    };
  }

  async getCompanyDashboardStats(companyId: string) {
    // 1. KPI Counts
    const [totalJobs] = await db('jobs').where({ company_id: companyId, deleted_at: null }).count('* as count');
    const [totalApps] = await db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('jobs.company_id', companyId)
      .count('* as count');
    const [totalInterviews] = await db('interviews')
      .join('applications', 'interviews.application_id', 'applications.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('jobs.company_id', companyId)
      .where('interviews.status', 'scheduled')
      .count('* as count');
    // Only candidates still "in progress" — i.e. with at least one application
    // that hasn't reached a terminal state (rejected / hired / withdrawn).
    const [totalCandidates] = await db('candidates')
      .join('applications', 'candidates.id', 'applications.candidate_id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('jobs.company_id', companyId)
      .whereNotIn('applications.status', ['rejected', 'hired', 'withdrawn'])
      .countDistinct('candidates.id as count');

    // 2. Pipeline Stages (Funnel)
    const pipelineData = await db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('jobs.company_id', companyId)
      .select('applications.status as label')
      .count('* as value')
      .groupBy('applications.status');

    // 3. Job Distribution (Segments)
    const jobSegments = await db('jobs')
      .where({ company_id: companyId, deleted_at: null })
      .select('title as label')
      .count('applications.id as value')
      .leftJoin('applications', 'jobs.id', 'applications.job_id')
      .groupBy('jobs.id', 'jobs.title')
      .orderBy('value', 'desc')
      .limit(5);

    // 4. Recent Applications
    const recentApplications = await db('applications')
      .select(
        'applications.*',
        'candidates.name as candidate_name',
        'jobs.title as job_title'
      )
      .join('candidates', 'applications.candidate_id', 'candidates.id')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('jobs.company_id', companyId)
      .orderBy('applications.applied_at', 'desc')
      .limit(5);

    return {
      stats: {
        jobs: parseInt(totalJobs.count as string),
        applications: parseInt(totalApps.count as string),
        interviews: parseInt(totalInterviews.count as string),
        candidates: parseInt(totalCandidates.count as string),
      },
      pipelineData: pipelineData.map(d => ({ label: d.label, value: parseInt(d.value as string) })),
      jobSegments: jobSegments.map((s, i) => ({ 
        label: s.label, 
        value: parseInt(s.value as string),
        color: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'][i % 5]
      })),
      recentApplications
    };
  }

  async getAdminAnalytics() {
    const num = (rows: any[]) => parseInt(rows?.[0]?.count as string) || 0;

    const [
      totalCompanies,
      companiesByStatus,
      totalJobs,
      publishedJobs,
      totalApps,
      totalCandidates,
      totalUsers,
      totalInterviews,
      pendingApprovals,
      activeCompanies,
    ] = await Promise.all([
      db('companies').count('* as count'),
      db('companies').select('status').count('* as count').groupBy('status'),
      db('jobs').whereNull('deleted_at').count('* as count'),
      db('jobs').where({ status: 'published', deleted_at: null }).count('* as count'),
      db('applications').count('* as count'),
      db('candidates').count('* as count'),
      db('users').count('* as count'),
      db('interviews').count('* as count'),
      db('companies').where({ status: 'pending' }).count('* as count'),
      db('companies').where({ status: 'active' }).count('* as count'),
    ]);

    const topCompanies = await db('companies')
      .select('companies.name')
      .count('jobs.id as jobs_count')
      .leftJoin('jobs', 'companies.id', 'jobs.company_id')
      .groupBy('companies.id')
      .orderBy('jobs_count', 'desc')
      .limit(5);

    // Most recent company signups for an activity feed.
    const recentCompanies = await db('companies')
      .select('id', 'name', 'status', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(6);

    return {
      kpis: {
        totalCompanies: num(totalCompanies),
        totalJobs: num(totalJobs),
        publishedJobs: num(publishedJobs),
        totalApplications: num(totalApps),
        totalCandidates: num(totalCandidates),
        totalUsers: num(totalUsers),
        totalInterviews: num(totalInterviews),
        pendingApprovals: num(pendingApprovals),
        activeCompanies: num(activeCompanies),
      },
      companiesByStatus,
      topCompanies,
      recentCompanies,
    };
  }
}

export const analyticsService = new AnalyticsService();
