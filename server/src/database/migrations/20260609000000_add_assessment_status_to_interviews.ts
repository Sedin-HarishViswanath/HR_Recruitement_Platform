import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('interviews', (table) => {
    table.string('assessment_status', 20).nullable();
  });
  // Allow null scheduled_at for automated assessments (candidate starts when ready)
  await knex.raw('ALTER TABLE interviews ALTER COLUMN scheduled_at DROP NOT NULL');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('interviews', (table) => {
    table.dropColumn('assessment_status');
  });
  await knex.raw('ALTER TABLE interviews ALTER COLUMN scheduled_at SET NOT NULL');
}
