import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('interviews', (table) => {
    table.string('recording_url').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('interviews', (table) => {
    table.dropColumn('recording_url');
  });
}
