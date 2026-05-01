import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('roles').del();

  // Inserts seed entries
  await knex('roles').insert([
    { name: 'Super Admin' },
    { name: 'Admin' },
    { name: 'Recruiter' },
    { name: 'Hiring Manager' },
    { name: 'Interviewer' },
  ]);
}
