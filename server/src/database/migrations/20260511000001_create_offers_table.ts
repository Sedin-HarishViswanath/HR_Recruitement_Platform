import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('offers', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('application_id').unsigned().notNullable().references('id').inTable('applications').onDelete('CASCADE');
    table.decimal('salary', 15, 2).notNullable();
    table.string('currency').defaultTo('USD');
    table.date('start_date').notNullable();
    table.string('status').defaultTo('pending'); // pending, accepted, declined
    table.text('additional_terms');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('offers');
}
