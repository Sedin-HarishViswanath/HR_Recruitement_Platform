import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('applications', (table) => {
    table.text('internal_notes').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('applications', (table) => {
    table.dropColumn('internal_notes');
  });
}
