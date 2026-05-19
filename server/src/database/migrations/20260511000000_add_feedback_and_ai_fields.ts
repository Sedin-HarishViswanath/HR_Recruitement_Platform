import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add additional_comments to feedbacks table
  const hasCol = await knex.schema.hasColumn('feedbacks', 'additional_comments');
  if (!hasCol) {
    await knex.schema.alterTable('feedbacks', (table) => {
      table.text('additional_comments').nullable();
    });
  }

  // Add ai_score to applications (for AI resume scoring feature)
  const hasAiScore = await knex.schema.hasColumn('applications', 'ai_score');
  if (!hasAiScore) {
    await knex.schema.alterTable('applications', (table) => {
      table.decimal('ai_score', 5, 2).nullable();
    });
  }

  // Add ai_match_score to candidates if not exists
  const hasCandidateAi = await knex.schema.hasColumn('candidates', 'ai_match_score');
  if (!hasCandidateAi) {
    await knex.schema.alterTable('candidates', (table) => {
      table.decimal('ai_match_score', 5, 2).nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasCol = await knex.schema.hasColumn('feedbacks', 'additional_comments');
  if (hasCol) {
    await knex.schema.alterTable('feedbacks', (table) => {
      table.dropColumn('additional_comments');
    });
  }
}
