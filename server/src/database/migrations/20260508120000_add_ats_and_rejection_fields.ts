import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('applications', (table) => {
    table.jsonb('matched_skills').nullable();
    table.text('rejection_reason').nullable();
    // ai_score should be an integer, let's ensure it exists
    // based on repo code, it's already used, but let's check if we need to add or modify it
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('applications', (table) => {
    table.dropColumn('matched_skills');
    table.dropColumn('rejection_reason');
  });
}
