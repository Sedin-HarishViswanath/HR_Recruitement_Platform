import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add plagiarism_report JSONB column to interviews table
  const hasPlagiarismReport = await knex.schema.hasColumn('interviews', 'plagiarism_report');
  if (!hasPlagiarismReport) {
    await knex.schema.alterTable('interviews', (table) => {
      table.jsonb('plagiarism_report').nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasPlagiarismReport = await knex.schema.hasColumn('interviews', 'plagiarism_report');
  if (hasPlagiarismReport) {
    await knex.schema.alterTable('interviews', (table) => {
      table.dropColumn('plagiarism_report');
    });
  }
}
