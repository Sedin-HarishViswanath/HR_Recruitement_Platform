import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('candidates', (table) => {
    table.string('avatar');
    table.date('date_of_birth');
    table.text('about_me');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('candidates', (table) => {
    table.dropColumn('avatar');
    table.dropColumn('date_of_birth');
    table.dropColumn('about_me');
  });
}
