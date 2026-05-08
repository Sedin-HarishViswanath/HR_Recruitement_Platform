import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Inserts seed entries idempotently
  await knex('roles')
    .insert([
      { name: 'Super Admin' },
      { name: 'Admin' },
      { name: 'Recruiter' },
      { name: 'Interviewer' },
      { name: 'Candidate' },
    ])
    .onConflict('name')
    .ignore();
}
