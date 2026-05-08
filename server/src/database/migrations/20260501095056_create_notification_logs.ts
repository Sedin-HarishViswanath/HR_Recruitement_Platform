import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notification_logs', (table) => {
    table.bigIncrements('id').primary();
    table.string('recipient_email').notNullable();
    table.string('subject').notNullable();
    table.string('event_type').notNullable(); // e.g. application_submitted, interview_scheduled
    table.string('entity_type').nullable(); // e.g. application, interview
    table.bigInteger('entity_id').nullable();
    table.enum('status', ['pending', 'sent', 'failed']).defaultTo('pending');
    table.text('error_message').nullable();
    table.integer('attempts').defaultTo(0);
    table.timestamp('last_attempt_at').nullable();
    table.timestamp('sent_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index(['recipient_email']);
    table.index(['status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notification_logs');
}
