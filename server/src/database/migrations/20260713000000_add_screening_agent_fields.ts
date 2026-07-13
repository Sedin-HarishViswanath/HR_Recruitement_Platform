import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const addCol = async (
    table: string,
    col: string,
    build: (t: Knex.AlterTableBuilder) => void,
  ) => {
    const exists = await knex.schema.hasColumn(table, col);
    if (!exists) await knex.schema.alterTable(table, build);
  };

  await addCol('applications', 'screening_breakdown', (t) => t.jsonb('screening_breakdown').nullable());
  await addCol('applications', 'interview_kit', (t) => t.jsonb('interview_kit').nullable());
  await addCol('applications', 'screening_rank', (t) => t.integer('screening_rank').nullable());

  await addCol('jobs', 'screening_status', (t) => t.string('screening_status').notNullable().defaultTo('idle'));
  await addCol('jobs', 'screening_started_at', (t) => t.timestamp('screening_started_at').nullable());
  await addCol('jobs', 'screening_completed_at', (t) => t.timestamp('screening_completed_at').nullable());
  await addCol('jobs', 'screening_meta', (t) => t.jsonb('screening_meta').nullable());
}

export async function down(knex: Knex): Promise<void> {
  const dropCol = async (table: string, col: string) => {
    const exists = await knex.schema.hasColumn(table, col);
    if (exists) await knex.schema.alterTable(table, (t) => t.dropColumn(col));
  };
  await dropCol('applications', 'screening_breakdown');
  await dropCol('applications', 'interview_kit');
  await dropCol('applications', 'screening_rank');
  await dropCol('jobs', 'screening_status');
  await dropCol('jobs', 'screening_started_at');
  await dropCol('jobs', 'screening_completed_at');
  await dropCol('jobs', 'screening_meta');
}
