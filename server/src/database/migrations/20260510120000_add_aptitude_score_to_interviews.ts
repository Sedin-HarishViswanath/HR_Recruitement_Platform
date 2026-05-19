import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('interviews', (table) => {
    table.integer('aptitude_score').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('interviews', (table) => {
    table.dropColumn('aptitude_score');
  });
}
