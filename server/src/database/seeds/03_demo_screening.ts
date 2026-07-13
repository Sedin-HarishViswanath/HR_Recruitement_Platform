import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

/**
 * Demo data for the Autonomous Screening Agent.
 * Creates a company, a loginable recruiter, a published job, and 8 varied
 * applicants so a live "Run AI Screen" produces a clear score spread.
 *
 * Login:  recruiter@northwind.demo  /  password123
 *
 * Idempotent: wipes its own rows (by company name + recruiter email) first.
 */
const COMPANY_NAME = 'Demo — Northwind';
const RECRUITER_EMAIL = 'recruiter@northwind.demo';
const REQUIRED_SKILLS = ['Kubernetes', 'Go', 'AWS', 'Terraform', 'CI/CD'];

const CANDIDATES: { name: string; email: string; skills: string[]; resume_text: string }[] = [
  { name: 'Sarah Jenkins', email: 'sarah.jenkins@demo.dev', skills: ['Kubernetes', 'Go', 'AWS', 'Terraform', 'CI/CD', 'Docker'],
    resume_text: 'Staff Platform Engineer, 8 years. Built multi-region Kubernetes platforms on AWS with Terraform IaC and GitLab CI/CD. Wrote Go operators and internal developer platforms.' },
  { name: 'David Mercer', email: 'david.mercer@demo.dev', skills: ['AWS', 'Terraform', 'CI/CD', 'Kubernetes', 'Python'],
    resume_text: 'DevOps Architect, 7 years. Deep AWS + Terraform, Jenkins and GitHub Actions pipelines, ran EKS clusters. Some Go, mostly Python tooling.' },
  { name: 'Elena Rostova', email: 'elena.rostova@demo.dev', skills: ['Go', 'Docker', 'AWS', 'CI/CD'],
    resume_text: 'Backend/Platform Engineer, 5 years. Strong Go microservices on AWS ECS, Docker, CircleCI. Learning Kubernetes; no Terraform yet.' },
  { name: 'Tomás Okafor', email: 'tomas.okafor@demo.dev', skills: ['AWS', 'Linux', 'Bash', 'CI/CD'],
    resume_text: 'Senior SRE, 6 years. AWS-heavy, strong Linux and on-call, Bash automation and Bamboo CI. No Go or Kubernetes production experience.' },
  { name: 'Priya Nair', email: 'priya.nair@demo.dev', skills: ['Kubernetes', 'Docker', 'Python', 'GCP'],
    resume_text: 'Cloud Engineer, 4 years. GKE Kubernetes on GCP, Docker, Python. No AWS or Terraform, no Go.' },
  { name: 'Marcus Bell', email: 'marcus.bell@demo.dev', skills: ['Java', 'Spring', 'MySQL', 'REST'],
    resume_text: 'Backend Java engineer, 6 years. Spring Boot services and MySQL. No cloud infra, containers, or IaC experience.' },
  { name: 'Aiko Tanaka', email: 'aiko.tanaka@demo.dev', skills: ['React', 'TypeScript', 'CSS', 'Node.js'],
    resume_text: 'Frontend engineer, 5 years. React, TypeScript, design systems. Some Node.js. No platform/infra background.' },
  { name: 'Leo Fischer', email: 'leo.fischer@demo.dev', skills: ['Excel', 'SQL', 'PowerBI'],
    resume_text: 'Data analyst transitioning to engineering. SQL and reporting. No software infrastructure experience.' },
];

export async function seed(knex: Knex): Promise<void> {
  // ── Cleanup prior demo rows (idempotent) ──
  await knex('users').where({ email: RECRUITER_EMAIL }).del(); // cascades memberships
  const prior = await knex('companies').where({ name: COMPANY_NAME }).first();
  if (prior) await knex('companies').where({ id: prior.id }).del(); // cascades jobs, candidates, applications

  // ── Company ──
  const [company] = await knex('companies')
    .insert({ name: COMPANY_NAME, domain: 'northwind.demo', status: 'active', active: true, contact_email: RECRUITER_EMAIL })
    .returning(['id']);

  // ── Recruiter user + membership ──
  const recruiterRole = await knex('roles').where({ name: 'Recruiter' }).first();
  if (!recruiterRole) throw new Error('Recruiter role not found. Run the roles seed (01) first.');

  const password_digest = await bcrypt.hash('password123', 12);
  const [recruiter] = await knex('users')
    .insert({ email: RECRUITER_EMAIL, password_digest, name: 'Nora Recruiter', company_id: company.id })
    .returning(['id']);
  await knex('memberships').insert({ user_id: recruiter.id, role_id: recruiterRole.id });
  await knex('companies').where({ id: company.id }).update({ admin_user_id: recruiter.id });

  // ── Published job ──
  const [job] = await knex('jobs')
    .insert({
      title: 'Senior Platform Engineer',
      description:
        'We are hiring a Senior Platform Engineer to own our Kubernetes platform on AWS. ' +
        'You will build internal developer tooling in Go, manage infrastructure as code with Terraform, ' +
        'and keep our CI/CD pipelines fast and reliable.',
      status: 'published',
      department: 'Engineering',
      location: 'Remote',
      experience_level: 'senior',
      required_skills: REQUIRED_SKILLS,
      company_id: company.id,
      created_by_id: recruiter.id,
    })
    .returning(['id']);

  // ── Candidates + applications ──
  for (const c of CANDIDATES) {
    const [cand] = await knex('candidates')
      .insert({
        name: c.name,
        email: c.email,
        skills: c.skills,
        resume_text: c.resume_text,
        resume_url: '/uploads/resumes/demo.pdf',
        status: 'new',
        company_id: company.id,
        onboarding_completed: true,
      })
      .returning(['id']);

    await knex('applications').insert({
      job_id: job.id,
      candidate_id: cand.id,
      status: 'new',
      resume_url: '/uploads/resumes/demo.pdf',
      parsed_skills: c.skills,
    });
  }

  console.log(`Demo screening data ready: "${COMPANY_NAME}" job "Senior Platform Engineer" with ${CANDIDATES.length} applicants.`);
  console.log(`Login: ${RECRUITER_EMAIL} / password123`);
}
