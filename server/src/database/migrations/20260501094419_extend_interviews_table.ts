import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('interviews', (table) => {
    table.integer('duration').defaultTo(60);
    table.jsonb('code_snapshots').defaultTo('[]');
    table.text('interviewer_notes').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('interviews', (table) => {
    table.dropColumn('duration');
    table.dropColumn('code_snapshots');
    table.dropColumn('interviewer_notes');
  });
}
