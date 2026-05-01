import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('jobs', (table) => {
    table.integer('salary_min').nullable();
    table.integer('salary_max').nullable();
    table.string('employment_type').defaultTo('full_time');
    table.date('deadline').nullable();
    table.boolean('remote').defaultTo(false);
    table.timestamp('published_at').nullable();
    table.timestamp('deleted_at').nullable(); // For soft deletes
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('jobs', (table) => {
    table.dropColumn('salary_min');
    table.dropColumn('salary_max');
    table.dropColumn('employment_type');
    table.dropColumn('deadline');
    table.dropColumn('remote');
    table.dropColumn('published_at');
    table.dropColumn('deleted_at');
  });
}
