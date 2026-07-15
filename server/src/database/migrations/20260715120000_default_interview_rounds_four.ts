import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('jobs', (table) => {
    table.integer('interview_rounds').defaultTo(4).alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('jobs', (table) => {
    table.integer('interview_rounds').defaultTo(1).alter();
  });
}
