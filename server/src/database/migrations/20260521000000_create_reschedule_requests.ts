import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('reschedule_requests', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('interview_id').unsigned().notNullable().references('id').inTable('interviews').onDelete('CASCADE');
    table.bigInteger('candidate_id').unsigned().notNullable().references('id').inTable('candidates').onDelete('CASCADE');
    table.text('reason').nullable();
    table.timestamp('preferred_date').notNullable();
    table.string('status').notNullable().defaultTo('pending'); // pending, approved, rejected
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('reschedule_requests');
}
