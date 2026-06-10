import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('stage_transitions', (table) => {
    table.bigInteger('changed_by').unsigned().nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('stage_transitions', (table) => {
    table.bigInteger('changed_by').unsigned().notNullable().alter();
  });
}
