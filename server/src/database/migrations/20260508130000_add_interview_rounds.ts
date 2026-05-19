import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('jobs', (table) => {
    table.integer('interview_rounds').defaultTo(1);
  });
  await knex.schema.alterTable('interviews', (table) => {
    table.integer('round_number').defaultTo(1);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('jobs', (table) => {
    table.dropColumn('interview_rounds');
  });
  await knex.schema.alterTable('interviews', (table) => {
    table.dropColumn('round_number');
  });
}
