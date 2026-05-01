import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.boolean('is_active').defaultTo(true);
  });
  await knex.schema.alterTable('candidates', (table) => {
    table.boolean('is_active').defaultTo(true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('candidates', (table) => {
    table.dropColumn('is_active');
  });
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('is_active');
  });
}
