import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('stage_transitions', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('application_id').unsigned().notNullable().references('id').inTable('applications').onDelete('CASCADE');
    table.string('from_stage').nullable();
    table.string('to_stage').notNullable();
    table.bigInteger('changed_by').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('changed_at').defaultTo(knex.fn.now());
    table.text('notes').nullable();
    
    table.index(['application_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('stage_transitions');
}
